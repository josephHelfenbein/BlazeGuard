import { WebSocketServer, WebSocket, RawData } from "ws";

import { LLMHandler } from './handler';

export default function handler(req, res) {
  const server = res.socket;

  if (!server.wss) {
    const wss = new WebSocketServer({ noServer: true });
    server.wss = wss;

    wss.on("connection", (ws) => {
      const llmHandler = new LLMHandler();

      ws.on("message", async (data) => {
        try {
          const request = JSON.parse(data.toString());
          await llmHandler.processMessage(request, ws);
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
          ws.close(1002, "Cannot parse incoming message.");
        }
      });

      ws.send(
        JSON.stringify({
          response_id: 0,
          content: "How may I assist you?",
          content_complete: true,
          end_call: false,
        })
      );
    });

    const serverNew = res.socket;
    serverNew.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });
  }

  res.status(200).json({ message: "WebSocket server running." });
}
