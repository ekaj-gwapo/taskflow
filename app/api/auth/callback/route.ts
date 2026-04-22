import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const { user: supaUser } = data.session;
      const email = supaUser.email;
      const name = supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || email?.split("@")[0] || "User";
      const avatarUrl = supaUser.user_metadata?.avatar_url || "";

      // Check if user exists in SQLite
      let user: any = await db.getOne("SELECT * FROM users WHERE email = ?", [email]);

      if (!user) {
        // Automatic registration
        const newId = uuidv4();
        const role = "employee"; // Default role
        const now = new Date().toISOString();

        await db.execute(
          "INSERT INTO users (id, name, email, password, role, avatarUrl, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [newId, name, email, "", role, avatarUrl, 1, now, now]
        );

        user = { id: newId, name, email, role };
      } else {
        // Update user if needed (e.g. avatar)
        if (avatarUrl && user.avatarUrl !== avatarUrl) {
          await db.execute("UPDATE users SET avatarUrl = ?, updatedAt = ? WHERE id = ?", [
            avatarUrl,
            new Date().toISOString(),
            user.id,
          ]);
        }
      }

      // Generate local JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      // Redirect to a confirmation page that saves the token to localStorage
      // We pass the token via query param
      return NextResponse.redirect(`${origin}/auth/confirm?token=${token}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
