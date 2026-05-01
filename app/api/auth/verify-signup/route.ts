import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login?email_error=missing_token", request.url));
    }

    console.log("Verifying token:", token);

    // Find user by token
    const user = await db.getOne(`
      SELECT id, "emailVerifyToken", "emailVerifyExpiry", "emailVerified"
      FROM users 
      WHERE "emailVerifyToken" = $1
    `, [token]);

    console.log("DB User result:", user);

    if (!user) {
      return NextResponse.json({ error: "Invalid token. No user found with this token." }, { status: 400 });
    }

    if (user.emailVerified) {
       return NextResponse.redirect(new URL("/auth/login?email_verified=1", request.url));
    }

    const expiry = new Date(user.emailVerifyExpiry);
    const now = new Date();

    if (expiry < now) {
      return NextResponse.json({ error: "Token has expired.", expiry, now }, { status: 400 });
    }

    // Update user to verified
    await db.execute(`
      UPDATE users 
      SET "emailVerified" = true, 
          "emailVerifyToken" = NULL, 
          "emailVerifyExpiry" = NULL,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [user.id]);

    return NextResponse.redirect(new URL("/dashboard?email_verified=1&open_profile=1", request.url));
  } catch (error: any) {
    console.error("VERIFY SIGNUP ERROR:", error);
    return NextResponse.redirect(new URL("/dashboard?email_error=server_error", request.url));
  }
}
