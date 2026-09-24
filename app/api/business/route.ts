import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import sql from "@/src/lib/db";
import { createClient } from "@/src/lib/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

async function getBusinessIdForUser(userId: string) {
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
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

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

    const businesses = await db.orm.public.Business.where({
      id: businessId,
    }).all();

    if (businesses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Business not found.",
        },
        { status: 404 }
      );
    }

    const business = businesses[0];

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        phone: business.phone,
        email: business.email,
        address: business.address,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
      },
      account: {
        id: user.id,
        email: user.email ?? null,
      },
    });
  } catch (error) {
    console.error("BUSINESS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not load business information.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

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

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const email =
      typeof body.email === "string" ? body.email.trim() : "";

    const address =
      typeof body.address === "string" ? body.address.trim() : "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Business name is required.",
        },
        { status: 400 }
      );
    }

    const updatedBusinesses =
      await db.orm.public.Business.where({
        id: businessId,
      }).update({
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
      });

    if (!updatedBusinesses) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not update business information.",
        },
        { status: 500 }
      );
    }

    const businesses = await db.orm.public.Business.where({
      id: businessId,
    }).all();

    return NextResponse.json({
      success: true,
      business: businesses[0],
    });
  } catch (error) {
    console.error("BUSINESS PATCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not update business information.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST is kept for compatibility with the existing account/business flow.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    const existingBusinessId = await getBusinessIdForUser(user.id);

    if (existingBusinessId) {
      return NextResponse.json({
        success: true,
        existing: true,
        businessId: existingBusinessId,
      });
    }

    const body = await request.json();

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : "My Business";

    const business = await db.orm.public.Business.create({
      name,
    });

    await sql`
      INSERT INTO public.business_member
        ("authUserId", "businessId")
      VALUES
        (${user.id}, ${business.id})
    `;

    return NextResponse.json({
      success: true,
      existing: false,
      business,
    });
  } catch (error) {
    console.error("BUSINESS POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not create business.",
      },
      { status: 500 }
    );
  }
}