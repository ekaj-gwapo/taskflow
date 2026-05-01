import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { verifyToken } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 0o1 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: "Organization name is too short" }, { status: 400 });
    }

    // Check if user already has an organization
    const user = await db.getOne('SELECT orgid, role FROM users WHERE id = $1', [decoded.id]);
    if (user && user.orgid) {
      return NextResponse.json({ error: "You already belong to an organization" }, { status: 400 });
    }

    const orgId = uuidv4();
    const slug = name.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

    // Create organization
    await db.execute(`
      INSERT INTO organizations (id, name, slug, createdat, updatedat)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [orgId, name.trim(), slug]);

    // Update user to be the creator of this org
    await db.execute(`
      UPDATE users SET orgid = $1, role = 'creator' WHERE id = $2
    `, [orgId, decoded.id]);

    return NextResponse.json({ 
      message: "Organization created successfully", 
      orgId, 
      role: 'creator' 
    });
  } catch (error: any) {
    console.error("ORG CREATE ERROR:", error);
    return NextResponse.json({ error: "Failed to create organization", details: error.message }, { status: 500 });
  }
}
