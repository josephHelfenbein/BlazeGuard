"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EmergencyRAG() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data.response);
      } else {
        setResponse(`Error: ${data.error || "Failed to get a response"}`);
      }
    } catch (error) {
      console.error("Error querying RAG system:", error);
      setResponse(
        "Sorry, something went wrong while processing your question."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">
          Emergency Response Assistant
        </h1>
        <p className="text-muted-foreground">
          Ask questions about emergency procedures and protocols
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about emergency procedures..."
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Thinking..." : "Ask"}
        </Button>
      </form>

      {response && (
        <div className="p-4 rounded-md border bg-card">
          <h2 className="font-medium mb-2">Response:</h2>
          <div className="whitespace-pre-wrap">{response}</div>
        </div>
      )}
    </div>
  );
}
