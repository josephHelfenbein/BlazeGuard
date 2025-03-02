const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// SQL statements to execute separately
const sqlStatements = [
  // Enable pgvector extension
  `CREATE EXTENSION IF NOT EXISTS vector;`,

  // Create table for embeddings
  `CREATE TABLE IF NOT EXISTS emergency_response_embeddings (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(768)
  );`,

  // Create function for similarity search
  `CREATE OR REPLACE FUNCTION match_emergency_documents(
    query_embedding VECTOR(768),
    match_threshold FLOAT,
    match_count INT
  )
  RETURNS TABLE (
    id BIGINT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
  )
  LANGUAGE plpgsql
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      emergency_response_embeddings.id,
      emergency_response_embeddings.content,
      emergency_response_embeddings.metadata,
      1 - (emergency_response_embeddings.embedding <=> query_embedding) AS similarity
    FROM emergency_response_embeddings
    WHERE 1 - (emergency_response_embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY emergency_response_embeddings.embedding <=> query_embedding
    LIMIT match_count;
  END;
  $$;`,

  // Create index for faster similarity searches
  `CREATE INDEX IF NOT EXISTS emergency_response_embeddings_embedding_idx
  ON emergency_response_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);`,
];

async function setupVectorStore() {
  try {
    console.log("Setting up vector store in Supabase...");

    // Execute each SQL statement separately
    for (const sql of sqlStatements) {
      console.log(`Executing SQL: ${sql.substring(0, 50)}...`);

      // Use Supabase's REST API to execute SQL
      const { error } = await supabase.rpc("exec_sql", { sql_string: sql });

      if (error) {
        console.log(`Error executing SQL: ${error.message}`);
        console.log("This is likely because the RPC function doesn't exist.");
        console.log("Please run the following SQL in the Supabase SQL editor:");
        console.log("--------------------------------------------------");
        sqlStatements.forEach((stmt) => console.log(stmt + "\n"));
        console.log("--------------------------------------------------");
        return;
      }
    }

    console.log("Vector store setup complete!");
  } catch (error) {
    console.error("Error setting up vector store:", error);
    console.log("Please run the following SQL in the Supabase SQL editor:");
    console.log("--------------------------------------------------");
    sqlStatements.forEach((stmt) => console.log(stmt + "\n"));
    console.log("--------------------------------------------------");
  }
}

// Run the setup
setupVectorStore()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
