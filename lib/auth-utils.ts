import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"

export interface JWTPayload {
  id: string
  email: string
  name: string
  role: string
  orgId?: string
}

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

// Alias for compatibility
export const verifyJWT = verifyToken;

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}

export function requireAuth(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { error: "Unauthorized", status: 401, user: null }
  }

  const user = verifyToken(token)
  if (!user) {
    return { error: "Invalid token", status: 401, user: null }
  }

  return { error: null, status: 200, user }
}

export function requireAdmin(request: NextRequest) {
  const auth = requireAuth(request)
  const role = auth.user?.role?.toLowerCase()
  const allowedRoles = ["admin", "head_admin", "creator", "master_admin", "superadmin"];
  
  if (auth.error || !allowedRoles.includes(role || "")) {
    return { error: "Admin access required", status: 403, user: null }
  }
  return auth
}

export function requireHeadAdmin(request: NextRequest) {
  const auth = requireAuth(request)
  const role = auth.user?.role?.toLowerCase()
  const allowedRoles = ["head_admin", "creator", "master_admin", "superadmin"];
  if (auth.error || !allowedRoles.includes(role || "")) {
    return { error: "Head Admin access required", status: 403, user: null }
  }
  return auth
}

export function requireMasterAdmin(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth.error) return auth
  
  const role = auth.user?.role?.toLowerCase()
  if (role !== "master_admin" && role !== "superadmin") {
    return { error: "Master Admin access required", status: 403, user: null }
  }
  return auth
}
