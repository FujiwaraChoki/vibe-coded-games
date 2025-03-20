import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

// Get all players
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("oceanGame");

    const players = await db.collection("players").find({}).toArray();

    return NextResponse.json({ success: true, data: players });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Create a new player or update existing player
export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("oceanGame");
    const data = await req.json();

    const { playerId, name, position, rotation, score, shipDamage } = data;

    if (!playerId || !name) {
      return NextResponse.json(
        {
          success: false,
          error: "Player ID and name are required",
        },
        { status: 400 }
      );
    }

    const result = await db.collection("players").updateOne(
      { playerId },
      {
        $set: {
          name,
          lastActive: new Date(),
          position,
          rotation,
          score,
          shipDamage,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      data: { playerId, name },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
