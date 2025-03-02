import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const channel = supabase.channel("wildfire");

  // Subscribe to the channel
  channel.subscribe((status) => {
    console.log(`Subscription status: ${status}`);
  });

  // Function to send a broadcast with the current time
  function sendTimeUpdate(time: number) {
    channel.send({
      type: "broadcast",
      event: "timeUpdate",
      payload: { time },
    });
  }

  // Start the timer and send updates
  let time = 0;
  const timerInterval = setInterval(() => {
    if (time <= 120) {
      sendTimeUpdate(time);
      time++;
    } else {
      clearInterval(timerInterval);
      console.log("Stopped updating at 120 seconds");
    }
  }, 1000); // update every 1 second

  // Return a response to the client
  return NextResponse.json({
    status: "success",
    message: "Wildfire data stream initiated",
  });
}
