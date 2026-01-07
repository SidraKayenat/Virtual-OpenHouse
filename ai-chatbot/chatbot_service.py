# ai-chatbot/chatbot_service.py
import logging
import os
import re
import sys

from flask import Flask, request, jsonify
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

from generate_embeddings import process_project

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

REQUIRED_ENV_VARS = [
    "OPENAI_API_KEY",
    "OPENAI_CHAT_MODEL",
    "OPENAI_EMBEDDING_MODEL",
]
DEFAULT_TOP_K = 4
DEFAULT_SEARCH_TYPE = "similarity"
DEFAULT_SCORE_THRESHOLD = 0.0

DOCUMENT_PROMPT = PromptTemplate(
    input_variables=["page_content", "metadata"],
    template="Source metadata: {metadata}\nContent:\n{page_content}",
)

QA_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template=(
        "You are a helpful assistant answering questions about the repository.\n"
        "Use the provided context to answer.\n"
        "Cite file paths from the context metadata when you make claims.\n"
        "If the answer is uncertain or the context is insufficient, say so explicitly.\n\n"
        "Context:\n{context}\n\n"
        "Question: {question}\n"
        "Answer:"
    ),
)


def validate_env():
    missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    if missing:
        logging.error("Missing required environment variables: %s", ", ".join(missing))
        logging.error(
            "Set them before starting. Example: "
            "export OPENAI_API_KEY=... OPENAI_CHAT_MODEL=... OPENAI_EMBEDDING_MODEL=..."
        )
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


validate_env()


def validate_project_db(project_id):
    persist_directory = f"./db/{project_id}"
    sqlite_path = os.path.join(persist_directory, "chroma.sqlite3")

    if not os.path.isdir(persist_directory):
        return False, f"Vector database directory not found for project '{project_id}'."

    if not os.path.isfile(sqlite_path) or os.path.getsize(sqlite_path) == 0:
        return False, f"Vector database is missing or empty for project '{project_id}'."

    return True, None


@app.route('/chat', methods=['POST'])
def chat():

    try:
        data = request.get_json(force=True)
        query = data.get("query")
        project_id = data.get("project_id")
        if not query or not project_id:
            return (
                jsonify(
                    {
                        "error": "Missing required fields.",
                        "details": "Provide both query and project_id.",
                    }
                ),
                400,
            )

        is_valid, error_message = validate_project_db(project_id)
        if not is_valid:
            return jsonify({"error": error_message}), 404

        embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL")
        chat_model = os.getenv("OPENAI_CHAT_MODEL")
        top_k = data.get("top_k", DEFAULT_TOP_K)
        search_type = data.get("search_type", DEFAULT_SEARCH_TYPE)
        score_threshold = data.get("score_threshold", DEFAULT_SCORE_THRESHOLD)
        db = Chroma(
            persist_directory=f"./db/{project_id}",
            embedding_function=OpenAIEmbeddings(model=embedding_model),
        )
        retriever = db.as_retriever(
            search_type=search_type,
            search_kwargs={"k": top_k, "score_threshold": score_threshold},
        )
        qa = RetrievalQA.from_chain_type(
            llm=ChatOpenAI(model_name=chat_model),
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={"prompt": QA_PROMPT, "document_prompt": DOCUMENT_PROMPT},
        )
        result = qa({"query": query})
        sources = [doc.metadata for doc in result.get("source_documents", [])]
        return jsonify({"response": result.get("result"), "sources": sources})
    except Exception as exc:
        logging.exception("Chatbot request failed")
        return (
            jsonify(
                {
                    "error": "Chatbot request failed.",
                    "details": sanitize_error_message(str(exc)),
                    "hint": (
                        "Verify OpenAI credentials/models and confirm embeddings exist for the project."
                    ),
                }
            ),
            500,
        )


@app.route('/ingest', methods=['POST'])
def ingest():
    try:
        data = request.get_json(force=True)
        project_id = data.get("project_id")
        folder_path = data.get("folder_path")
        if not project_id or not folder_path:
            return (
                jsonify(
                    {
                        "error": "Missing required fields.",
                        "details": "Provide both project_id and folder_path.",
                    }
                ),
                400,
            )
        result = process_project(folder_path, project_id)
        return jsonify(result)
    except Exception as exc:
        logging.exception("Embedding ingestion failed")
        return (
            jsonify(
                {
                    "error": "Embedding ingestion failed.",
                    "details": sanitize_error_message(str(exc)),
                    "hint": "Verify the upload folder and OpenAI embedding configuration.",
                }
            ),
            500,
        )


if __name__ == '__main__':
    app.run(port=5000)