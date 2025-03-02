import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data from request
    const formData = await req.json();
    console.log("Received form data:", formData);

    // Check if user already has medical info
    const { data: existingData, error: checkError } = await supabase
      .from("medical_info")
      .select("id")
      .eq("user_id", user.id)
      .single();

    console.log("Existing data check:", existingData, checkError);

    let result;

    if (existingData) {
      // Update existing record
      console.log("Updating existing record");
      result = await supabase
        .from("medical_info")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select();
    } else {
      // Insert new record
      console.log("Inserting new record");
      result = await supabase
        .from("medical_info")
        .insert({
          user_id: user.id,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
    }

    console.log("Database operation result:", result);

    if (result.error) {
      console.error("Error saving medical info:", result.error);
      return NextResponse.json(
        { error: "Failed to save medical information", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in medical info API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching medical info for user:", user.id);

    // Get medical info for the current user
    const { data, error } = await supabase
      .from("medical_info")
      .select("*")
      .eq("user_id", user.id)
      .single();

    console.log("Fetch result:", data, error);

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error
      console.error("Error fetching medical info:", error);
      return NextResponse.json(
        { error: "Failed to fetch medical information", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || {} });
  } catch (error) {
    console.error("Error in medical info API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
