// import { NextResponse } from "next/server";
// import { clearServerToken } from "@/src/lib/auth/server"

// export async function POST() {
//   const res = NextResponse.json({ message: "Logged out" });

//   res.cookies.set("userId", "", {
//     maxAge: 0,
//     path: "/",
//   });

//   return res;
// }

import { NextResponse } from 'next/server';
import { clearServerToken } from '@/src/lib/auth/server';

export async function POST() {
  try {
    // Clear token from HTTP-only cookie
    const res = await clearServerToken();
    
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}