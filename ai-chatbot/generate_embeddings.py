# ai-chatbot/generate_embeddings.py
import logging
import os
import re
import shutil
import sys

from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

REQUIRED_ENV_VARS = [
    "OPENAI_API_KEY",
    "OPENAI_EMBEDDING_MODEL",
]


def validate_env():
    missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    if missing:
        logging.error("Missing required environment variables: %s", ", ".join(missing))
        logging.error("Set them before running embeddings generation.")
        sys.exit(1)


def sanitize_error_message(message):
    if not message:
        return "Unknown error"
    sanitized = message
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        sanitized = sanitized.replace(api_key, "[REDACTED]")
    sanitized = re.sub(r"sk-[A-Za-z0-9]{10,}", "[REDACTED]", sanitized)
    return sanitized


def process_project(folder, project_id):
    if not os.path.isdir(folder):
        raise FileNotFoundError(f"Upload folder not found: {folder}")

    persist_directory = f"./db/{project_id}"
    if os.path.isdir(persist_directory):
        shutil.rmtree(persist_directory)

    docs = []
    for file in os.listdir(folder):
        if file.endswith(".pdf"):
            loader = PyPDFLoader(os.path.join(folder, file))
            docs += loader.load()

    if not docs:
        raise ValueError(f"No PDF files found in {folder}")

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL")
    Chroma.from_documents(
        chunks,
        OpenAIEmbeddings(model=embedding_model),
        persist_directory=persist_directory,
    ).persist()
    return {
        "status": "success",
        "project_id": project_id,
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