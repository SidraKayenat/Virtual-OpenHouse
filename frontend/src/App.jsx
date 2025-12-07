import React from 'react';
import './App.css'
import { useState } from 'react';

function ProjectChatbot({ projectId }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");

  const askBot = async () => {
    const res = await fetch(`http://localhost:3000/api/chatbot/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    setAnswer(data.response);
  };

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask a question" />
      <button onClick={askBot}>Ask</button>
      <p><strong>Answer:</strong> {answer}</p>
    </div>
  );
}


function App() {
 

  return (
    <>
     <h1>WE WILL DO IT INSHALLAH </h1>
    </>

  )
}

export default App
