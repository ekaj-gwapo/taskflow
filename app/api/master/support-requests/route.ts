import { NextRequest, NextResponse } from "next/server"
import { requireMasterAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function GET(request: NextRequest) {
  const auth = requireMasterAdmin(request)
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const requests = await db.getAll(`
      SELECT 
        sr.*,
        u.name as creator_name,
        u.email as creator_email,
        o.name as organization_name
      FROM support_requests sr
      JOIN users u ON sr.creator_id = u.id
      LEFT JOIN organizations o ON u.orgid = o.id
      ORDER BY sr.created_at DESC
    `)

    return NextResponse.json(requests)
  } catch (error: any) {
    console.error("API get support-requests error:", error)
    return NextResponse.json({ error: "Failed to fetch support requests", details: error.message }, { status: 500 })
  }
}

