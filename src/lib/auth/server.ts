'use server'

import { cookies } from "next/headers";
import { apiGetProfile } from "./api";
import { UserProfile } from "./type";
import { NextResponse } from "next/server";

/**
 * Get token from HTTP-only cookie (server-side)
 */
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("userId")?.value || null;
}

export async function setServerToken(res: NextResponse, token: string): Promise<void> {
  res.cookies.set("userId", token, {
    httpOnly: true,
    secure: true,     // true in production (HTTPS)
    sameSite: "lax",
    maxAge: 60 * 60 * 24,     // 1 day
  });
}

/**
 * Clear token from HTTP-only cookie (server-side)
 */
export async function clearServerToken(): Promise<NextResponse | null> {
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set("userId", "", {
    maxAge: 0,
  });

  return res;
}

/**
 * Get current user from server-side cookie
 */
export async function getServerUser(): Promise<UserProfile | null> {
  const token = await getServerToken();
  
  if (!token) return null;

  try {
    const user = await apiGetProfile(token);
    return user;
  } catch {
    await clearServerToken();
    return null;
  }
}
