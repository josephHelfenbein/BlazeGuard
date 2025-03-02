// app/api/medical-data/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Add authentication check
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add role-based access control if needed
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user || user.role !== 'emergency_responder') {
    //   return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    // }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get("name");

    // Validate required parameters
    if (!name) {
      return NextResponse.json(
        {
          error: "Name is required as a query parameter",
        },
        { status: 400 }
      );
    }

    // Query for the medical info using only fullName and return the best match
    const { data: medicalData, error: medicalError } = await supabase
      .from("medical_info")
      .select("*")
      .ilike("fullName", `%${name}%`)
      .limit(1);

    if (medicalError || !medicalData || medicalData.length === 0) {
      console.error("Database error or no data found:", medicalError);
      return NextResponse.json(
        { error: "No user found with the provided name" },
        { status: 404 }
      );
    }

    // Format the response (using the first/best match)
    const formattedData = {
      user_id: medicalData[0].user_id,
      name: medicalData[0].fullName,
      date_of_birth: medicalData[0].dateOfBirth,
      medical_info: {
        emergency_contact: medicalData[0].emergencyContact,
        emergency_phone: medicalData[0].emergencyPhone,
        blood_type: medicalData[0].bloodType,
        allergies: medicalData[0].allergies,
        medications: medicalData[0].medications,
        chronic_conditions: medicalData[0].hasChronicConditions
          ? medicalData[0].chronicConditions
          : null,
        additional_notes: medicalData[0].additionalNotes,
        created_at: medicalData[0].created_at,
        updated_at: medicalData[0].updated_at,
      },
    };

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error("Error in medical data API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
