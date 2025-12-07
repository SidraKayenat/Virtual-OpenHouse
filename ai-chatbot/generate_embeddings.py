# ai-chatbot/generate_embeddings.py
import os, sys
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

def process_project(folder, project_id):
    docs = []
    for file in os.listdir(folder):
        if file.endswith(".pdf"):
            loader = PyPDFLoader(os.path.join(folder, file))
            docs += loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    Chroma.from_documents(chunks, OpenAIEmbeddings(), persist_directory=f"./db/{project_id}").persist()

if __name__ == "__main__":
    folder = sys.argv[1]  # e.g. ../uploads/project123
    project_id = sys.argv[2]
    process_project(folder, project_id)
