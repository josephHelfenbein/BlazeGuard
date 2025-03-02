import { NextRequest, NextResponse } from "next/server";
import { ragService } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter is required and must be a string" },
        { status: 400 }
      );
    }

    const response = await ragService.generateResponse(query);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in RAG API:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
