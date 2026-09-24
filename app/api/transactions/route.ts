import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import sql from "@/src/lib/db";
import { createClient } from "@/src/lib/supabase/server";

async function getBusinessIdForUser(
  userId: string
): Promise<number | null> {
  const memberships = await sql`
    SELECT "businessId"
    FROM public.business_member
    WHERE "authUserId" = ${userId}
    LIMIT 1
  `;

  if (memberships.length === 0) {
    return null;
  }

  return Number(memberships[0].businessId);
}

export async function GET() {
  try {
    // Get authenticated Supabase user
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    // Get the business linked to this user
    const businessId = await getBusinessIdForUser(user.id);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "No business is linked to this account.",
        },
        { status: 403 }
      );
    }

    // Only load transactions belonging to this user's business
    const result = await db.orm.public.Sale.where({
      businessId,
    }).all();

    return NextResponse.json(result);
  } catch (error) {
    console.error("TRANSACTIONS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load transactions",
      },
      { status: 500 }
    );
  }
}