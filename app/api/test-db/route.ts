import { db } from "@/src/prisma/db";

export async function GET() {
  try {
    const businesses = await db.orm.public.Business.all();

    return Response.json({
      success: true,
      count: businesses.length,
      businesses,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}