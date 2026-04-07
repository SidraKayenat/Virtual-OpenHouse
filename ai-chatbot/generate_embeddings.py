# ai-chatbot/generate_embeddings.py
import logging
import os
import re
import shutil
import sys
import zipfile
import xml.etree.ElementTree as ET
import chromadb

from langchain_core.documents import Document

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders import Docx2txtLoader
from langchain_community.document_loaders import UnstructuredPowerPointLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
import chromadb
from dotenv import load_dotenv

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_ROOT = os.path.join(CURRENT_DIR, "db")
load_dotenv(os.path.join(CURRENT_DIR, ".env"))
load_dotenv(os.path.join(CURRENT_DIR, "..", ".env"))
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

REQUIRED_ENV_VARS = [
    "GROQ_API_KEY",
]
DEFAULT_EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-mpnet-base-v2")
MAX_CLOUD_UPSERT_BATCH = 300
DEFAULT_CLOUD_UPSERT_BATCH = int(os.getenv("CHROMA_UPSERT_BATCH_SIZE", "300"))


def validate_env():
    missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    if use_cloud_chroma():
        missing += [
            var
            for var in ["CHROMA_API_KEY", "CHROMA_TENANT", "CHROMA_DATABASE"]
            if not os.getenv(var)
        ]
    if missing:
        logging.error("Missing required environment variables: %s", ", ".join(missing))
        logging.error("Set them before running embeddings generation.")
        sys.exit(1)


def sanitize_error_message(message):
    if not message:
        return "Unknown error"
    sanitized = message
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        sanitized = sanitized.replace(api_key, "[REDACTED]")
    sanitized = re.sub(r"gsk_[A-Za-z0-9]{10,}", "[REDACTED]", sanitized)
    return sanitized

def extract_docx_text(file_path):
    with zipfile.ZipFile(file_path) as docx_zip:
        xml_content = docx_zip.read("word/document.xml")

    root = ET.fromstring(xml_content)
    texts = [node.text for node in root.iter() if node.tag.endswith("}t") and node.text]
    return "\n".join(texts).strip()


def extract_pptx_slide_texts(file_path):
    texts = []
    with zipfile.ZipFile(file_path) as pptx_zip:
        slide_files = sorted(
            [name for name in pptx_zip.namelist() if name.startswith("ppt/slides/slide") and name.endswith(".xml")]
        )
        for slide_file in slide_files:
            xml_content = pptx_zip.read(slide_file)
            root = ET.fromstring(xml_content)
            slide_text = [node.text for node in root.iter() if node.tag.endswith("}t") and node.text]
            texts.append("\n".join(slide_text).strip())
    return texts

def use_cloud_chroma():
    return os.getenv("CHROMA_USE_CLOUD", "false").lower() in {"1", "true", "yes"}


def get_cloud_client():
    return chromadb.CloudClient(
        api_key=os.getenv("CHROMA_API_KEY"),
        tenant=os.getenv("CHROMA_TENANT"),
        database=os.getenv("CHROMA_DATABASE"),
    )


def describe_storage_target(project_id):
    if use_cloud_chroma():
        return {
            "storage_mode": "cloud",
            "collection_name": project_id,
            "tenant": os.getenv("CHROMA_TENANT"),
            "database": os.getenv("CHROMA_DATABASE"),
        }
    return {
        "storage_mode": "local",
        "persist_directory": os.path.join(DB_ROOT, project_id),
    }

def process_project(folder, project_id):
    if not os.path.isdir(folder):
        raise FileNotFoundError(f"Upload folder not found: {folder}")

    persist_directory = os.path.join(DB_ROOT, project_id)
    cloud_mode = use_cloud_chroma()
    cloud_client = get_cloud_client() if cloud_mode else None
    storage_target = describe_storage_target(project_id)
    logging.info("Ingestion target: %s", storage_target)
    if cloud_mode:
        # keep ingestion idempotent like local mode (fresh index per project/stall)
        try:
            cloud_client.delete_collection(name=project_id)
        except Exception:
            pass
    elif os.path.isdir(persist_directory):
        shutil.rmtree(persist_directory)

    docs = []
    supported_extensions = (".pdf", ".docx", ".ppt", ".pptx")
    discovered_files = []
    failed_files = []
    for file in os.listdir(folder):
        if not file.lower().endswith(supported_extensions):
            continue

        full_path = os.path.join(folder, file)
        discovered_files.append(file)
        try:
            if file.lower().endswith(".pdf"):
                loader = PyPDFLoader(full_path)
                docs += loader.load()
            elif file.lower().endswith(".docx"):
                doc_text = extract_docx_text(full_path)
                if doc_text:
                    docs.append(Document(page_content=doc_text, metadata={"source": full_path, "page": 0}))
            elif file.lower().endswith(".pptx"):
                slide_texts = extract_pptx_slide_texts(full_path)
                for idx, slide_text in enumerate(slide_texts):
                    if slide_text:
                        docs.append(
                            Document(
                                page_content=slide_text,
                                metadata={"source": full_path, "page": idx},
                            )
                        )
            else:
                failed_files.append({"file": file, "reason": "Legacy .ppt format is not supported in this environment"})
        except Exception as exc:
            failed_files.append({"file": file, "reason": sanitize_error_message(str(exc))})

    if not docs:
        raise ValueError(
            f"No processable files found in {folder}. Expected extensions: {supported_extensions}. Failures: {failed_files}"
        )


    # =========================
    # FIX 1: DEBUG - verify title page text is extractable
    # =========================
    print("\n=== DEBUG: FIRST PAGES PREVIEW (check title/project name) ===")
    for i, d in enumerate(docs[:3]):
        print(f"\n---- DOC PAGE INDEX {i} ----")
        preview = (d.page_content or "").strip()
        print(preview[:800] if preview else "[EMPTY PAGE CONTENT]")
    print("=== END DEBUG ===\n")

    # =========================
    # FIX 4: mark early pages (title page usually page 0/1)
    # =========================
    for doc in docs:
        page = doc.metadata.get("page", 99)
        doc.metadata["is_title_page"] = page <= 1

    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    # =========================
    # FIX 3: add explicit metadata to every chunk
    # =========================
    for chunk in chunks:
        chunk.metadata["project_id"] = project_id

        # keep filename-friendly source for debugging + citations
        src = chunk.metadata.get("source", "")
        chunk.metadata["source_file"] = os.path.basename(src) if src else "unknown.pdf"

        # carry forward title-page flag (if present)
        # (splitter usually copies metadata, but we keep it safe)
        if "is_title_page" not in chunk.metadata:
            chunk.metadata["is_title_page"] = False

    embedding_model = HuggingFaceEmbeddings()
    if cloud_mode:
        vector_store = Chroma(
            collection_name=project_id,
            client=cloud_client,
            embedding_function=embedding_model,
        )
        batch_size = max(1, min(DEFAULT_CLOUD_UPSERT_BATCH, MAX_CLOUD_UPSERT_BATCH))
        logging.info(
            "Cloud ingestion batching enabled: batch_size=%s total_chunks=%s",
            batch_size,
            len(chunks),
        )

        for start in range(0, len(chunks), batch_size):
            end = min(start + batch_size, len(chunks))
            vector_store.add_documents(chunks[start:end])
            logging.info(
                "Upserted chunks %s-%s / %s",
                start + 1,
                end,
                len(chunks),
            )
    else:
        Chroma.from_documents(
            chunks,
            embedding_model,
            persist_directory=persist_directory,
        )

    return {
        "status": "success",
        "project_id": project_id,
        **storage_target,
        "files_ingested": discovered_files,
        "files_failed": failed_files,
        "chunks_indexed": len(chunks),
    }


if __name__ == "__main__":
    validate_env()
    try:
        folder = sys.argv[1]  # e.g. ../uploads/project123
        project_id = sys.argv[2]
        process_project(folder, project_id)
    except IndexError:
        logging.error("Usage: python generate_embeddings.py <folder> <project_id>")
        sys.exit(1)
    except Exception as exc:
        logging.exception("Embedding generation failed")
        logging.error("Details: %s", sanitize_error_message(str(exc)))
        sys.exit(1)
