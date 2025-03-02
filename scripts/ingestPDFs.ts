import * as fs from "fs";
import * as path from "path";
// Use require for pdf-parse to avoid TypeScript errors
const pdfParse = require("pdf-parse");
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const geminiApiKey = process.env.GEMINI_API_KEY as string;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create embeddings model
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: geminiApiKey,
  modelName: "embedding-001",
});

// Create vector store
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "emergency_response_embeddings",
  queryName: "match_emergency_documents",
});

const DATA_DIR = path.join(process.cwd(), "data");

// Function to extract text from PDF
async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

// Function to split text into chunks
async function splitTextIntoChunks(text: string): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  return splitter.createDocuments([text]);
}

// Process PDF and store embeddings
async function processPDFAndStoreEmbeddings(
  pdfPath: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; count?: number; error?: any }> {
  try {
    console.log(`Processing PDF: ${pdfPath}`);

    // Extract text from PDF
    const text = await extractTextFromPDF(pdfPath);

    // Split text into chunks
    const chunks = await splitTextIntoChunks(text);

    // Add metadata to chunks
    const documentsWithMetadata = chunks.map((chunk) => {
      return {
        ...chunk,
        metadata: {
          ...chunk.metadata,
          source: path.basename(pdfPath),
          ...metadata,
        },
      };
    });

    // Add documents to vector store
    await vectorStore.addDocuments(documentsWithMetadata);

    console.log(`Successfully processed and stored embeddings for ${pdfPath}`);
    return { success: true, count: chunks.length };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { success: false, error };
  }
}

async function ingestAllPDFs() {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.log("Data directory not found. Creating...");
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(
      "Please add PDF files to the data directory and run this script again."
    );
    return;
  }

  // Get all PDF files
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((file) => file.endsWith(".pdf"));

  if (files.length === 0) {
    console.log("No PDF files found in the data directory.");
    return;
  }

  console.log(`Found ${files.length} PDF files. Starting ingestion...`);

  // Process each PDF
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`Processing ${file}...`);

    const result = await processPDFAndStoreEmbeddings(filePath, {
      category: "emergency_response",
      filename: file,
      ingestionDate: new Date().toISOString(),
    });

    if (result.success) {
      console.log(
        `Successfully processed ${file}. Created ${result.count} chunks.`
      );
    } else {
      console.error(`Failed to process ${file}:`, result.error);
    }
  }

  console.log("PDF ingestion complete!");
}

// Run the ingestion
ingestAllPDFs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error during ingestion:", err);
    process.exit(1);
  });

// Add this line to make the file a module
export {};
