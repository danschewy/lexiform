import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { demoFormId: string } }
) {
  try {
    const body = await request.json();
    console.log(`Submitting data for demo form ${params.demoFormId}:`, body);
    // Placeholder for demo form submission logic
    // In a real implementation, you might save this to a temporary store
    // or log it, without requiring user authentication.
    return NextResponse.json({
      success: true,
      message: "Demo form submitted (simulated)",
    });
  } catch (error) {
    console.error("Error submitting demo form:", error);
    return NextResponse.json(
      { success: false, message: "Error submitting demo form" },
      { status: 500 }
    );
  }
}
