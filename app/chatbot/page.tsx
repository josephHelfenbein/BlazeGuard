"use client"
import React, { useState, useRef, useEffect } from 'react';

type ChatMessage = {
  role: 'user' | 'assistant';
  message: string;
};

export default function ChatDashboard() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmedMessage = input.trim();
    if (!trimmedMessage) return;

    setMessages(prev => [...prev, { role: 'user', message: trimmedMessage }]);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const data = await res.json();
      const assistantResponse = data.message || 'No response';

      setMessages(prev => [
        ...prev,
        { role: 'assistant', message: assistantResponse },
      ]);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', message: 'Error: Could not reach the server.' },
      ]);
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Chat Dashboard</h1>
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          height: '400px',
          overflowY: 'auto',
          background: '#f9f9f9',
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              margin: '10px 0',
              textAlign: msg.role === 'assistant' ? 'left' : 'right',
            }}
          >
            <strong>{msg.role === 'assistant' ? 'Gemini' : 'You'}:</strong>{' '}
            <span>{msg.message}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={{ marginTop: '10px', display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={{
            flexGrow: 1,
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            marginRight: '10px',
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '10px 20px',
            borderRadius: '4px',
            border: 'none',
            background: '#0070f3',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
