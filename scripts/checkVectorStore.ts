import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVectorStore() {
  try {
    console.log("Checking if vector store table exists in Supabase...");

    // Check if the table exists
    const { data, error } = await supabase
      .from("emergency_response_embeddings")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Error checking table:", error.message);
      console.log(
        "The table might not exist. Please run the SQL statements in the Supabase SQL Editor."
      );
      return;
    }

    console.log("Table exists! Found data:", data);
    console.log("Vector store is properly set up.");
  } catch (error) {
    console.error("Error checking vector store:", error);
  }
}

// Run the check
checkVectorStore()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });

// Add this line to make the file a module
export {};
