import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { userTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { setServerToken } from "@/src/lib/auth/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (!user.length) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isMatch = await password === user[0].password;
  if (!isMatch) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ message: "Login success" });

  // // set cookie (store user id)
  setServerToken(res, String(user[0].id));

  return res;
}