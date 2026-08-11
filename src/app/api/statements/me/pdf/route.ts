import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  const url = new URL(`/api/statements/${userId}/pdf`, req.url);
  url.search = req.nextUrl.search;
  return NextResponse.redirect(url);
}