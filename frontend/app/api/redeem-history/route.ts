import { NextResponse } from "next/server";
import { getMongoDB } from "@/lib/db";

export async function GET() {
  try {
    const db = await getMongoDB();
    const redeems = await db
      .collection("redeem_history")
      .find({})
      .sort({ redeemedAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(redeems);
  } catch (err) {
    console.error("[api/redeem-history]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
