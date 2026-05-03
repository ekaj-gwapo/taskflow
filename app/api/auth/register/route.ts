import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/activity";
import { verifyToken } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, location, jobTitle, role, orgId, autoVerify } = await request.json();

    if (!email && !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.getOne("SELECT id FROM users WHERE email = ? OR username = ?", [email, email]);
    if (existingUser) {
      return NextResponse.json({ error: "Username or Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    // Use autoVerify if provided (e.g. when an admin adds a user)
    const isVerified = autoVerify === true;
    const verificationToken = uuidv4();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Default to 'employee' for admin-created users, 'creator' for public signups
    const defaultRole = isVerified ? "employee" : "creator";

    // Insert user
    await db.execute(`
      INSERT INTO users (
        id, name, email, username, password, role, 
        phone, location, jobtitle, orgid,
        "emailVerified", "emailVerifyToken", "emailVerifyExpiry",
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, name, email, email, hashedPassword, role || defaultRole, 
      phone || "", location || "", jobTitle || "", orgId || null,
      isVerified, isVerified ? null : verificationToken, isVerified ? null : verificationExpiry,
      new Date().toISOString(), new Date().toISOString()
    ]);

    // Only send email if NOT auto-verified
    if (!isVerified) {
      const { sendVerificationEmail } = await import("@/lib/email");
      try {
        await sendVerificationEmail(email, name, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    const message = isVerified 
      ? "User created successfully." 
      : "Registration successful. Please check your email to verify your account.";

    // Log activity
    const authHeader = request.headers.get("authorization");
    let actorId = userId;
    let actorName = name;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        actorId = decoded.id;
        actorName = decoded.name;
      }
    }

    await logActivity({
      action: "USER_CREATED",
      entityId: userId,
      entityType: "USER",
      userId: actorId,
      userName: actorName,
      details: { 
        createdUserId: userId, 
        name: name, 
        email: email, 
        role: role || defaultRole,
        isAutoVerified: isVerified
      }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json({ error: "Failed to register", details: error.message }, { status: 500 });
  }
}
