
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { MAX_INT_ID } from "@/lib/ids";

const secretValue = process.env.JWT_SECRET;

if (!secretValue || secretValue.length < 32) {
  throw new Error("JWT_SECRET must be configured securely");
}

const secret = new TextEncoder().encode(secretValue);

export async function createSession(userId: number) {
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (!payload.sub || !/^\d+$/.test(payload.sub)) return null;

    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId > MAX_INT_ID) {
      return null;
    }

    return await prisma.user.findFirst({
      where: {
        id: userId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  } catch {
    return null;
  }
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: Response.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
