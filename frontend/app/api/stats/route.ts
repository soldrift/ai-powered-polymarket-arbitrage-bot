import { NextResponse } from "next/server";
import { getMongoDB } from "@/lib/db";

export async function GET() {
  try {
    const db = await getMongoDB();

    const [buys, redeems] = await Promise.all([
      db.collection("impulse_buys").find({}).toArray(),
      db.collection("redeem_history").find({}).toArray(),
    ]);

    const totalSpentUsd = (buys as unknown as Array<{ amountUsd?: number }>).reduce(
      (sum, b) => sum + (b.amountUsd || 0),
      0
    );
    const totalRedeemedUsd = (redeems as unknown as Array<{ payoutUsd?: number }>).reduce(
      (sum, r) => sum + (r.payoutUsd ?? 0),
      0
    );
    const realizedPnl = totalRedeemedUsd - totalSpentUsd;
    const totalBuys = buys.length;
    const totalRedeems = redeems.length;

    return NextResponse.json({
      totalSpentUsd,
      totalRedeemedUsd,
      realizedPnl,
      totalBuys,
      totalRedeems,
    });
  } catch (err) {
    console.error("[api/stats]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
