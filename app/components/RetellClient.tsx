"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";

export default function RetellClient() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Initialize Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // Subscribe to the channel
    const channel = pusher.subscribe("retell-channel");

    // Listen for responses
    channel.bind("response", (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    // Cleanup
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Retell Conversation</h1>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
