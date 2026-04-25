import { db } from "@/src/db";
import { userTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {

  const { userId } = await params;

  const id = Number(userId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const user = await db
    .select({
      id: userTable.id,
      username: userTable.username,
      email: userTable.email,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .where(eq(userTable.id, id))
    .limit(1);

  if (!user.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    message: "Get user profile successfully",
    status: 200,
    data: user[0]
  });
}