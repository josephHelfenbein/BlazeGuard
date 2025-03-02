import { NextRequest } from "next/server";
import { pusher } from "@/lib/pusher";
import { LLMHandler, RetellRequest } from "./handler";

const llmHandler = new LLMHandler();

export async function POST(req: NextRequest) {
  try {
    const request: RetellRequest = await req.json();
    console.log("Received request:", request);

    if (request.interaction_type === "update_only") {
      console.log("Received update_only request, ignoring");
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lastUtterance = request.transcript.at(-1)?.content || "";
    console.log("Last utterance:", lastUtterance);
    const aiResponse = await llmHandler.fetchGeminiResponse(lastUtterance);
    console.log("AI response:", aiResponse);

    const response = {
      response_id: request.response_id,
      content: aiResponse,
      content_complete: true,
      end_call: false,
    };
    console.log("Sending response:", response);
    await pusher.trigger("retell-channel", "response", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
