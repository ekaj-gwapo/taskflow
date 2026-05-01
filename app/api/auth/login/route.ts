import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user: any = await db.getOne(`
      SELECT u.id, u.name, u.email, u.password, u.role, u.phone, u.location, u.jobtitle AS "jobTitle", 
             u.avatarUrl as avatar, u.theme, u.mode, u.orgid AS "orgId", 
             u.createdAt as "createdAt", u.updatedAt as "updatedAt",
             u."emailVerified", u."notifyOnAssign", u."notifyOnDeadline", 
             u."notifyOnDiscussion", u."notifyOnExtension", u.isActive as "isActive",
             o.name as "organizationName"
      FROM users u
      LEFT JOIN organizations o ON u.orgid = o.id
      WHERE u.email = ?
    `, [email]);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account deactivated. Contact the superadmin." },
        { status: 403 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Email not verified. Please check your inbox for the verification link." },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        orgId: user.orgId 
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return NextResponse.json({ user: userWithoutPassword, token });
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ error: "Failed to login", details: error.message }, { status: 500 });
  }
}
