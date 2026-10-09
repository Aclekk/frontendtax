import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  response.cookies.delete("role");
  return response;
}