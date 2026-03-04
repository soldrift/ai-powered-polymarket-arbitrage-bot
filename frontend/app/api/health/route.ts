import { NextResponse } from "next/server";
import { getRedis, getMongoDB } from "@/lib/db";

export async function GET() {
  try {
    const [redisOk, mongoOk] = await Promise.all([
      getRedis().then((r) => r.ping().then(() => true)).catch(() => false),
      getMongoDB().then((db) => db.command({ ping: 1 }).then(() => true)).catch(() => false),
    ]);

    return NextResponse.json({
      redis: redisOk ? "ok" : "error",
      mongodb: mongoOk ? "ok" : "error",
      ok: redisOk && mongoOk,
    });
  } catch {
    return NextResponse.json({ redis: "error", mongodb: "error", ok: false });
  }
}
