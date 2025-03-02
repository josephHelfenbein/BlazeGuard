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
    const dob = searchParams.get("dob"); // Format should be YYYY-MM-DD

    // Validate required parameters
    if (!name || !dob) {
      return NextResponse.json(
        {
          error:
            "Both name and date of birth (dob) are required query parameters",
        },
        { status: 400 }
      );
    }

    // Query for the medical info directly using fullName and dateOfBirth
    const { data: medicalData, error: medicalError } = await supabase
      .from("medical_info")
      .select("*")
      .eq("fullName", name)
      .eq("dateOfBirth", dob)
      .single();

    if (medicalError || !medicalData) {
      console.error("Database error or no data found:", medicalError);
      return NextResponse.json(
        { error: "No user found with the provided name and date of birth" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedData = {
      user_id: medicalData.user_id,
      name: medicalData.fullName,
      date_of_birth: medicalData.dateOfBirth,
      medical_info: {
        emergency_contact: medicalData.emergencyContact,
        emergency_phone: medicalData.emergencyPhone,
        blood_type: medicalData.bloodType,
        allergies: medicalData.allergies,
        medications: medicalData.medications,
        chronic_conditions: medicalData.hasChronicConditions
          ? medicalData.chronicConditions
          : null,
        additional_notes: medicalData.additionalNotes,
        created_at: medicalData.created_at,
        updated_at: medicalData.updated_at,
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
