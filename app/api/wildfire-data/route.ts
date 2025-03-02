import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const region = searchParams.get("region");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    // Validate required parameters
    if (!region) {
      return NextResponse.json(
        { error: "Region parameter is required" },
        { status: 400 }
      );
    }

    // Query for fire data
    const { data: fireData, error: fireError } = await supabase
      .from("wildfire_data")
      .select("*")
      .eq("region", region)
      .gte("timestamp", startTime || "")
      .lte("timestamp", endTime || new Date().toISOString());

    if (fireError) {
      console.error("Database error:", fireError);
      return NextResponse.json(
        { error: "Error fetching wildfire data" },
        { status: 500 }
      );
    }

    // Query for points of interest
    const { data: poiData, error: poiError } = await supabase
      .from("points_of_interest")
      .select("*")
      .eq("region", region);

    if (poiError) {
      console.error("Database error:", poiError);
      return NextResponse.json(
        { error: "Error fetching points of interest" },
        { status: 500 }
      );
    }

    // Format the response as GeoJSON
    const formattedData = {
      type: "FeatureCollection",
      features: fireData.map((fire) => ({
        type: "Feature",
        properties: {
          id: fire.id,
          name: fire.name,
          timestamp: fire.timestamp,
          intensity: fire.intensity,
        },
        geometry: fire.geometry,
      })),
      pointsOfInterest: poiData,
    };

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error("Error in wildfire data API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
