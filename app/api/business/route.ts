import { db } from "@/src/prisma/db";

export async function POST() {
  try {
    const business = await db.orm.public.Business.create({
      name: "My Business",
    });

    return Response.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Could not create business",
      },
      { status: 500 }
    );
  }
}