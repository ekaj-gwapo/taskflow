import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.getOne('SELECT id, name, "emailVerified" FROM users WHERE email = ?', [email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.execute(`
      UPDATE users 
      SET "emailVerifyToken" = ?, 
          "emailVerifyExpiry" = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [otpCode, verificationExpiry, user.id]);

    const { sendVerificationCodeEmail } = await import("@/lib/email");
    await sendVerificationCodeEmail(email, user.name, otpCode);

    return NextResponse.json({ message: "Verification code sent" });
  } catch (error: any) {
    console.error("RESEND VERIFICATION ERROR:", error);
    return NextResponse.json({ 
      error: "Failed to resend verification email", 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
