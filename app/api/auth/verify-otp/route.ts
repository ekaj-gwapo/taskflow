import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { signToken } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    // Find user by email and code
    const user = await db.getOne(`
      SELECT id, name, email, role, orgid as "orgId", "emailVerifyToken", "emailVerifyExpiry", "emailVerified"
      FROM users 
      WHERE email = ? AND "emailVerifyToken" = ?
    `, [email.toLowerCase(), code]);

    if (!user) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    if (user.emailVerified) {
       return NextResponse.json({ message: "Email already verified" }, { status: 200 });
    }

    const expiry = new Date(user.emailVerifyExpiry);
    const now = new Date();

    if (expiry < now) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    // Update user to verified
    await db.execute(`
      UPDATE users 
      SET "emailVerified" = true, 
          "emailVerifyToken" = NULL, 
          "emailVerifyExpiry" = NULL,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [user.id]);

    // Generate token for automatic login after verification
    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId
    });

    return NextResponse.json({ 
      message: "Email verified successfully", 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("VERIFY OTP ERROR:", error);
    return NextResponse.json({ error: "Server error during verification" }, { status: 500 });
  }
}
