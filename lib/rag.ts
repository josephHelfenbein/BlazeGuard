import { GoogleGenerativeAI } from "@google/generative-ai";
import { similaritySearch } from "@/utils/supabase/vectorStore";

export class RAGService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateResponse(query: string): Promise<string> {
    try {
      // Retrieve relevant documents
      let docs;
      try {
        docs = await similaritySearch(query);
      } catch (error) {
        console.error("Error searching for documents:", error);
        return "I encountered an error while searching for relevant information. Please try again later.";
      }

      if (!docs || docs.length === 0) {
        return "I couldn't find any relevant information to answer your question about emergency response.";
      }

      // Extract context from documents
      const context = docs.map((doc) => doc.pageContent).join("\n\n");

      // Generate prompt with context
      const prompt = `
You are an emergency response assistant. Use the following information to answer the user's question.
If you don't know the answer based on the provided information, say so.

CONTEXT:
${context}

USER QUESTION:
${query}

ANSWER:
`;

      // Generate response using Gemini
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return response;
    } catch (error) {
      console.error("Error in RAG service:", error);
      return "Sorry, I encountered an error while processing your question.";
    }
  }
}

// Create a singleton instance
export const ragService = new RAGService();
