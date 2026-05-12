import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/activity";
import { verifyToken } from "@/lib/auth-utils";
import { registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone, location, jobTitle, jobDescription, role, orgId, autoVerify } = validation.data;

    // Check if user already exists
    const existingUser = await db.getOne("SELECT id FROM users WHERE email = ? OR username = ?", [email, email]);
    if (existingUser) {
      return NextResponse.json({ error: "Username or Email already exists" }, { status: 400 });
    }

    // Enforce User Limits if joining an organization
    if (orgId) {
      const org = await db.getOne("SELECT plan FROM organizations WHERE id = ?", [orgId]);
      if (org) {
        const userCountResult = await db.getOne(`SELECT COUNT(*) as count FROM users WHERE orgid = ? AND isactive = TRUE`, [orgId]);
        const userCount = parseInt(userCountResult.count || "0", 10);
        
        let limit = 0;
        switch (org.plan) {
          case 'FREE':
          case 'FREE_TRIAL': limit = 5; break;
          case 'STARTER': limit = 10; break;
          case 'PRO': limit = 25; break;
          case 'ENTERPRISE': limit = 999999; break;
          default: limit = 5;
        }

        if (userCount >= limit) {
          return NextResponse.json(
            { error: `User limit reached for the current plan (${org.plan}). Please upgrade to add more users.` },
            { status: 403 }
          );
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    // Use autoVerify if provided (e.g. when an admin adds a user)
    const isVerified = autoVerify === true;
    
    // Generate a 6-digit OTP instead of a UUID token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    // Default to 'employee' for admin-created users, 'creator' for public signups
    const defaultRole = isVerified ? "employee" : "creator";

    // Insert user
    await db.execute(`
      INSERT INTO users (
        id, name, email, username, password, role, 
        phone, location, jobtitle, jobdescription, orgid,
        "emailVerified", "emailVerifyToken", "emailVerifyExpiry",
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, name, email, email, hashedPassword, role || defaultRole, 
      phone || "", location || "", jobTitle || "", jobDescription || "", orgId || null,
      isVerified, isVerified ? null : otpCode, isVerified ? null : verificationExpiry,
      new Date().toISOString(), new Date().toISOString()
    ]);

    // Only send email if NOT auto-verified
    if (!isVerified) {
      const { sendVerificationCodeEmail } = await import("@/lib/email");
      try {
        await sendVerificationCodeEmail(email, name, otpCode);
      } catch (emailError) {
        console.error("Failed to send verification code email:", emailError);
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
