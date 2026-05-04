import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { userTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    // 1. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 2. Check existing user
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    // 3. Insert user
    const newUser = await db
      .insert(userTable)
      .values({
        username,
        email,
        password,
      })
      .returning();

    const user = newUser[0];

    console.log(user);
    

    // 4. Response (no password)
    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}