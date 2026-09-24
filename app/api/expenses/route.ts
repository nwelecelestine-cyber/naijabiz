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

    const expenses = await db.orm.public.Expense.where({
      businessId,
    }).all();

    const sortedExpenses = [...expenses].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      expenses: sortedExpenses,
    });
  } catch (error) {
    console.error("EXPENSES GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not load expenses.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : null;

    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    const amount = Number(body.amount);

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          error: "Expense description is required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Expense amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const expense = await db.orm.public.Expense.create({
      businessId,
      description,
      category,
      amount,
      notes,
    });

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("EXPENSE POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not create expense.",
      },
      { status: 500 }
    );
  }
}