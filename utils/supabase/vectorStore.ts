import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createScriptClient } from "./scriptClient";

export async function createVectorStore() {
  const supabase = createScriptClient();

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: "text-embedding-004",
  });

  return new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "emergency_response_embeddings",
    queryName: "match_emergency_documents",
  });
}

export async function similaritySearch(query: string, k = 4) {
  console.log(`Performing similarity search for query: "${query}" with k=${k}`);
  try {
    const vectorStore = await createVectorStore();
    const results = await vectorStore.similaritySearch(query, k, {
      score_threshold: 0.5,
    });
    console.log(`Found ${results.length} results`);
    if (results.length > 0) {
      console.log(`First result: ${JSON.stringify(results[0], null, 2)}`);
    }
    return results;
  } catch (error) {
    console.error("Error in similaritySearch:", error);
    throw error;
  }
}
