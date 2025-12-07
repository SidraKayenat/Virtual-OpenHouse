# ai-chatbot/chatbot_service.py
from flask import Flask, request, jsonify
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA

app = Flask(__name__)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    query = data['query']
    project_id = data['project_id']

    db = Chroma(persist_directory=f"./db/{project_id}", embedding_function=OpenAIEmbeddings())
    qa = RetrievalQA.from_chain_type(llm=ChatOpenAI(), retriever=db.as_retriever())
    answer = qa.run(query)
    return jsonify({"response": answer})

if __name__ == '__main__':
    app.run(port=5000)
