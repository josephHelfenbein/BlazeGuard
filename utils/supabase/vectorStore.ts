import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createScriptClient } from "./scriptClient";

export async function createVectorStore() {
  const supabase = createScriptClient();

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: "embedding-001",
  });

  return new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "emergency_response_embeddings",
    queryName: "match_emergency_documents",
    filter: {},
  });
}

export async function similaritySearch(query, k = 4) {
  const vectorStore = await createVectorStore();
  return vectorStore.similaritySearch(query, k);
}
