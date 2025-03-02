const fs = require("fs");
const path = require("path");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("langchain/document");
const pdfParse = require("pdf-parse");
const { createVectorStore } = require("../supabase/vectorStore");

// Function to extract text from PDF
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

// Function to split text into chunks
async function splitTextIntoChunks(text) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  return splitter.createDocuments([text]);
}

// Main function to process PDF and store embeddings
async function processPDFAndStoreEmbeddings(pdfPath, metadata = {}) {
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

    // Create vector store
    const vectorStore = await createVectorStore();

    // Add documents to vector store
    await vectorStore.addDocuments(documentsWithMetadata);

    console.log(`Successfully processed and stored embeddings for ${pdfPath}`);
    return { success: true, count: chunks.length };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { success: false, error };
  }
}

module.exports = { processPDFAndStoreEmbeddings };
