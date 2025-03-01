export interface Utterance {
    role: "agent" | "user";
    content: string;
  }
  
  export interface RetellRequest {
    response_id?: number;
    transcript: Utterance[];
    interaction_type: "update_only" | "response_required" | "reminder_required";
  }
  
  export interface RetellResponse {
    response_id?: number;
    content: string;
    content_complete: boolean;
    end_call: boolean;
  }
  
export class LLMHandler {
    constructor() {}
  
    async fetchGeminiResponse(prompt: string): Promise<string> {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
            }),
          }
        );
  
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't understand that.";
      } catch (error) {
        console.error("Error generating content:", error);
        return "An error occurred while processing your request.";
      }
    }
  
    async processMessage(request: RetellRequest, ws: WebSocket) {
      if (request.interaction_type === "update_only") {
        return;
      }
  
      const lastUtterance = request.transcript.at(-1)?.content || "";
      const aiResponse = await this.fetchGeminiResponse(lastUtterance);
  
      const res: RetellResponse = {
        response_id: request.response_id,
        content: aiResponse,
        content_complete: true,
        end_call: false,
      };
      ws.send(JSON.stringify(res));
    }
  }
  