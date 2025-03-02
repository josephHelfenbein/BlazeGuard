"use client"
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Dashboard() {
  const [status, setStatus] = useState("Loading...");
  const supabase = createClient();

  useEffect(() => {
    async function fetchStatus() {
      const { data, error } = await supabase
        .from("agent_status")
        .select("*")
        .single();
      if (error) {
        console.error("Error fetching agent status:", error);
        setStatus("Error fetching status");
      } else if (data) {
        setStatus(data.status);
      }
    }
    fetchStatus();

    const channel = supabase.channel("agent_status_channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agent_status",
          filter: "id=eq.1"
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          setStatus(payload.new.status);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_status",
          filter: "id=eq.1"
        },
        (payload) => {
          console.log("Realtime insert received:", payload);
          setStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Agent Dashboard</h1>
      <p>
        <strong>Current Agent Status:</strong> {status}
      </p>
    </div>
  );
}
