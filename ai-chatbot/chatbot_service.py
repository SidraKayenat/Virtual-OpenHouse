# ai-chatbot/chatbot_service.py
from dotenv import load_dotenv
load_dotenv()

import logging
import os
import re
import sys

print("MODEL:", os.getenv("GROQ_CHAT_MODEL"))
print("KEY SET:", bool(os.getenv("GROQ_API_KEY")))


from flask import Flask, request, jsonify
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_classic.chains import RetrievalQA

from generate_embeddings import process_project

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

REQUIRED_ENV_VARS = [
    "GROQ_API_KEY",
    "GROQ_CHAT_MODEL",
]

DEFAULT_TOP_K = 12
# Use MMR by default to diversify retrieved chunks across uploaded files.
DEFAULT_SEARCH_TYPE = "mmr"
# Only used when search_type == "similarity_score_threshold"
DEFAULT_SCORE_THRESHOLD = 0.0
DEFAULT_FETCH_K = 50



DETAILED_TOP_K = 20
DETAILED_FETCH_K = 80
DETAIL_REQUEST_PATTERN = re.compile(
    r"\b(detailed|in\s*detail|in-depth|thorough|elaborate|comprehensive|step[- ]by[- ]step|deep dive)\b",
    re.IGNORECASE,
)



def detect_response_style(query: str, requested_style: str | None):
    if requested_style in {"brief", "normal", "detailed"}:
        return requested_style
    if query and DETAIL_REQUEST_PATTERN.search(query):
        return "detailed"
    return "normal"


def build_qa_prompt(scope_instruction: str, response_style: str):
    style_instruction = (
        "Default to concise answers (4-8 sentences) unless the user explicitly asks for detail."
        if response_style != "detailed"
        else (
            "The user asked for detail. Provide a structured answer with: "
            "(1) Short summary, (2) Detailed explanation, and (3) Practical takeaways."
        )
    )
    return PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "You are a helpful assistant answering questions about a stall project.\n"
            f"Scope rules: {scope_instruction}\n"
            f"Response style: {style_instruction}\n"
            "Use only the provided context to answer.\n"
            "Do not reference section numbers, chapter numbers, or tell users to look up specific sections in documents.\n"
            "Do not mention internal IDs, project IDs, event IDs, file paths, or database identifiers in your response.\n"
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
        logging.error("Set them before starting. Example: set GROQ_API_KEY=... GROQ_CHAT_MODEL=...")
        sys.exit(1)


def sanitize_error_message(message: str) -> str:
    if not message:
        return "Unknown error"
    sanitized = message
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        sanitized = sanitized.replace(api_key, "[REDACTED]")
        sanitized = re.sub(r"gsk_[A-Za-z0-9]{10,}", "[REDACTED]", sanitized)
    return sanitized


validate_env()


def validate_project_db(project_id: str):
    persist_directory = f"./db/{project_id}"
    sqlite_path = os.path.join(persist_directory, "chroma.sqlite3")

    if not os.path.isdir(persist_directory):
        return False, f"Vector database directory not found for project '{project_id}'."

    if not os.path.isfile(sqlite_path) or os.path.getsize(sqlite_path) == 0:
        return False, f"Vector database is missing or empty for project '{project_id}'."

    return True, None


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)
        query = data.get("query")
        project_id = data.get("project_id")
        context = data.get("context") or {}
        requested_style = data.get("response_style")

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


        chat_model = os.getenv("GROQ_CHAT_MODEL")
        top_k = data.get("top_k", DEFAULT_TOP_K)
        search_type = data.get("search_type", DEFAULT_SEARCH_TYPE)
        score_threshold = data.get("score_threshold", DEFAULT_SCORE_THRESHOLD)
        fetch_k = data.get("fetch_k", DEFAULT_FETCH_K)
        response_style = detect_response_style(query, requested_style)
        if response_style == "detailed":
            top_k = max(top_k, DETAILED_TOP_K)
            fetch_k = max(fetch_k, DETAILED_FETCH_K)
        stall_name = context.get("stallName") or "Unknown Stall"  #keep the stall_name 
        event_name = context.get("eventName") or "Unknown Event"
        scope_instruction = (
            f"Answer only for stall '{stall_name}' in event '{event_name}'. "
            "If asked about other stalls or events, explain your scope is limited."
        )
        qa_prompt = build_qa_prompt(scope_instruction, response_style)

        db = Chroma(
            persist_directory=f"./db/{project_id}",
            embedding_function=HuggingFaceEmbeddings(),
        )

        # FIX: Only pass score_threshold when the retriever type supports it.
        # Some Chroma versions error if score_threshold is passed for plain similarity search.
        search_kwargs = {"k": top_k}
        if search_type == "similarity_score_threshold":
            search_kwargs["score_threshold"] = score_threshold
        elif search_type == "mmr":
            search_kwargs["fetch_k"] = fetch_k

        retriever = db.as_retriever(
            search_type=search_type,
            search_kwargs=search_kwargs,
        )

        qa = RetrievalQA.from_chain_type(
            llm=ChatGroq(model=chat_model),
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={"prompt": qa_prompt},
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
                    "hint": "Verify Groq credentials/models and confirm embeddings exist for the project.",
                }
            ),
            500,
        )


@app.route("/ingest", methods=["POST"])
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
                    "hint": "Verify the upload folder and embeddings configuration.",
                }
            ),
            500,
        )


if __name__ == "__main__":
    app.run(port=5000)
