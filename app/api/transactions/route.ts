import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

const BUSINESS_ID = 1;

export async function GET() {
  try {
    const result = await db.orm.public.Sale.where({
      businessId: BUSINESS_ID,
    }).all();

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load transactions" },
      { status: 500 }
    );
  }
}