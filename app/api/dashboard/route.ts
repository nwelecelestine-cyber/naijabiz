import { db } from "@/src/prisma/db";
import sql from "@/src/lib/db";
import { createClient } from "@/src/lib/supabase/server";

async function getBusinessIdForUser(userId: string): Promise<number | null> {
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

/**
 * Returns a YYYY-MM-DD date key using Nigeria time.
 * This prevents the server timezone from affecting
 * "today's" sales and expenses.
 */
function getLagosDateKey(date: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

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

    const businessId = await getBusinessIdForUser(user.id);

    if (!businessId) {
      return Response.json(
        {
          success: false,
          error: "No business is linked to this account.",
        },
        { status: 403 }
      );
    }

    const [sales, expenses, products] = await Promise.all([
      db.orm.public.Sale.where({
        businessId,
      }).all(),

      db.orm.public.Expense.where({
        businessId,
      }).all(),

      db.orm.public.Product.where({
        businessId,
      }).all(),
    ]);

    // Always determine "today" using Nigeria/Lagos time.
    const todayKey = getLagosDateKey(new Date());

    const isToday = (date: string | Date) => {
      return getLagosDateKey(date) === todayKey;
    };

    const todaySales = sales.filter((sale) =>
      isToday(sale.createdAt)
    );

    const todayExpenses = expenses.filter((expense) =>
      isToday(expense.createdAt)
    );

    const totalSales = todaySales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const totalExpenses = todayExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const moneyOwed = sales.reduce(
      (sum, sale) => sum + (sale.totalAmount - sale.amountPaid),
      0
    );

    const estimatedProfit = totalSales - totalExpenses;

    const recentSales = [...sales]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    return Response.json({
      success: true,
      dashboard: {
        todaySales: totalSales,
        todayExpenses: totalExpenses,
        moneyOwed,
        estimatedProfit,
        productCount: products.length,
        products,
        recentSales,
      },
    });
  } catch (error) {
    console.error("DASHBOARD GET ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not load dashboard data",
      },
      { status: 500 }
    );
  }
}