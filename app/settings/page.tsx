"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  // Subscribe to the Supabase channel
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("wildfire");

    // Listen for time updates
    channel
      .on("broadcast", { event: "timeUpdate" }, (payload) => {
        console.log("Received time update:", payload);
        setCurrentTime(payload.payload.time);

        // Show toast for first update
        if (payload.payload.time === 0) {
          toast.success("🔥 Connected to wildfire stream!");
        }
      })
      .subscribe((status) => {
        console.log(`Subscription status: ${status}`);
        if (status === "SUBSCRIBED") {
          toast.success("📡 Subscribed to wildfire channel");
        }
      });

    // Cleanup function
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleStartWildfire = async () => {
    setIsLoading(true);
    try {
      // Call the wildfire-data API endpoint
      const response = await fetch("/api/wildfire-data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initiate wildfire");
      }

      const data = await response.json();
      toast.success(`🔥 Wild fire initiated! ${data.message}`);
    } catch (error) {
      console.error("Error initiating wildfire:", error);
      toast.error("Failed to initiate wildfire. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Start Wild Fire</CardTitle>
          <CardDescription>
            Initiate a controlled wild fire in your designated area. Use with
            caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleStartWildfire}
            disabled={isLoading}
          >
            {isLoading ? "Initiating..." : "Start Fire"}
          </Button>

          {currentTime !== null && (
            <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-950 rounded-md">
              <p className="text-amber-800 dark:text-amber-300">
                🔥 Wildfire in progress: {currentTime} seconds
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
