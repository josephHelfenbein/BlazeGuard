const {
  SupabaseVectorStore,
} = require("@langchain/community/vectorstores/supabase");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { createScriptClient } = require("./scriptClient");

async function createVectorStore() {
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
    similarityK: 4,
    similarityThreshold: 0.5,
  });
}

async function similaritySearch(query, k = 4) {
  const vectorStore = await createVectorStore();
  return vectorStore.similaritySearch(query, k);
}

module.exports = { createVectorStore, similaritySearch };
