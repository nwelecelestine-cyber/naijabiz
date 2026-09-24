import { db } from "@/src/prisma/db";
import sql from "@/src/lib/db";
import { createClient } from "@/src/lib/supabase/server";

export async function POST() {
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

    // Check whether this user already has a business.
    const existingMemberships = await sql`
      SELECT id, "authUserId", "businessId"
      FROM public.business_member
      WHERE "authUserId" = ${user.id}
      LIMIT 1
    `;

    if (existingMemberships.length > 0) {
      return Response.json({
        success: true,
        businessId: existingMemberships[0].businessId,
        existing: true,
      });
    }

    // Check whether Business ID 1 already has an owner.
    const existingMembers = await sql`
      SELECT id
      FROM public.business_member
      WHERE "businessId" = 1
      LIMIT 1
    `;

    let businessId: number;

    if (existingMembers.length === 0) {
      // First NaijaBiz account claims the existing Business ID 1.
      businessId = 1;
    } else {
      // Additional users receive their own business.
      const metadata = user.user_metadata as {
        business_name?: string;
      };

      const businessName =
        typeof metadata?.business_name === "string" &&
        metadata.business_name.trim()
          ? metadata.business_name.trim()
          : "My Business";

      const business = await db.orm.public.Business.create({
        name: businessName,
      });

      businessId = business.id;
    }

    await sql`
      INSERT INTO public.business_member
        ("authUserId", "businessId")
      VALUES
        (${user.id}, ${businessId})
    `;

    return Response.json({
      success: true,
      businessId,
      existing: false,
    });
  } catch (error) {
    console.error("ACCOUNT SETUP ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not set up your business account.",
      },
      { status: 500 }
    );
  }
}