import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileExtension = file.name.split('.').pop() || 'png'
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `uploads/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Supabase storage error:", error)
      // Fallback: return a data URL for small files (< 2MB)
      if (buffer.length < 2 * 1024 * 1024) {
        const base64 = buffer.toString('base64')
        const dataUrl = `data:${file.type};base64,${base64}`
        return NextResponse.json({
          url: dataUrl,
          name: file.name,
          type: file.type,
        })
      }
      return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      name: file.name,
      type: file.type,
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 })
  }
}
