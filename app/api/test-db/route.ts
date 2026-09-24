import { db } from "@/src/prisma/db";
import sql from "@/src/lib/db";
import { createClient } from "@/src/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    const memberships = await sql`
      SELECT "businessId"
      FROM public.business_member
      WHERE "authUserId" = ${user.id}
      LIMIT 1
    `;

    if (memberships.length === 0) {
      return Response.json(
        {
          success: false,
          error: "No business is linked to this account.",
        },
        { status: 403 }
      );
    }

    const businessId = Number(memberships[0].businessId);

    const businesses = await db.orm.public.Business.where({
      id: businessId,
    }).all();

    return Response.json({
      success: true,
      count: businesses.length,
      businesses,
    });
  } catch (error) {
    console.error("TEST DB ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}