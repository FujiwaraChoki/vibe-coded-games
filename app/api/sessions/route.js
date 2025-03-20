import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

// Get all active game sessions
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("oceanGame");

    // Get sessions active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const sessions = await db
      .collection("gameSessions")
      .find({ lastUpdated: { $gte: fiveMinutesAgo } })
      .toArray();

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Create a new game session or update existing one
export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("oceanGame");
    const data = await req.json();

    const {
      sessionId,
      weather,
      treasuresAvailable,
      hazards,
      playersConnected,
    } = data;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required",
        },
        { status: 400 }
      );
    }

    const result = await db.collection("gameSessions").updateOne(
      { sessionId },
      {
        $set: {
          weather,
          treasuresAvailable,
          hazards,
          playersConnected,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      data: { sessionId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
