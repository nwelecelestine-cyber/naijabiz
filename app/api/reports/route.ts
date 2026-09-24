import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import sql from "@/src/lib/db";
import { createClient } from "@/src/lib/supabase/server";

const LAGOS_TIME_ZONE = "Africa/Lagos";

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

function getLagosDateKey(date: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function createLagosStartDate(dateString: string) {
  return new Date(`${dateString}T00:00:00+01:00`);
}

function createLagosEndDate(dateString: string) {
  return new Date(`${dateString}T23:59:59.999+01:00`);
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    const todayKey = getLagosDateKey(now);

    const defaultFromDate = new Date(
      `${todayKey}T00:00:00+01:00`
    );

    defaultFromDate.setDate(defaultFromDate.getDate() - 30);

    const defaultFrom = getLagosDateKey(defaultFromDate);

    const from = fromParam
      ? createLagosStartDate(fromParam)
      : createLagosStartDate(defaultFrom);

    const to = toParam
      ? createLagosEndDate(toParam)
      : now;

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid report date range.",
        },
        { status: 400 }
      );
    }

    if (from > to) {
      return NextResponse.json(
        {
          success: false,
          error: "The report start date cannot be after the end date.",
        },
        { status: 400 }
      );
    }

    const [sales, expenses, products, customers, saleItems] =
      await Promise.all([
        db.orm.public.Sale.where({ businessId }).all(),

        db.orm.public.Expense.where({ businessId }).all(),

        db.orm.public.Product.where({ businessId }).all(),

        db.orm.public.Customer.where({ businessId }).all(),

        /*
         * IMPORTANT:
         *
         * COGS now comes from SaleItem.unitCost.
         *
         * We do NOT use Product.costPrice here because Product.costPrice
         * can change after a sale has already happened.
         *
         * SaleItem.unitCost is the historical cost captured when
         * the sale was created.
         */
        sql`
          SELECT
            si.id,
            si."saleId",
            si."productId",
            si.quantity,
            si."unitPrice",
            si."unitCost",
            si."totalPrice",
            s."createdAt" AS "saleCreatedAt",
            s."businessId",
            p.name AS "productName"
          FROM public."saleItem" si
          INNER JOIN public.sale s
            ON s.id = si."saleId"
          INNER JOIN public.product p
            ON p.id = si."productId"
          WHERE s."businessId" = ${businessId}
            AND s."createdAt" >= ${from}
            AND s."createdAt" <= ${to}
          ORDER BY s."createdAt" DESC
        `,
      ]);

    /*
     * Keep sales and expenses restricted to the selected period.
     */
    const salesInPeriod = sales.filter((sale) => {
      const date = new Date(sale.createdAt);
      return date >= from && date <= to;
    });

    const expensesInPeriod = expenses.filter((expense) => {
      const date = new Date(expense.createdAt);
      return date >= from && date <= to;
    });

    /*
     * -------------------------
     * FINANCIAL SUMMARY
     * -------------------------
     */

    const totalRevenue = salesInPeriod.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const totalCollected = salesInPeriod.reduce(
      (sum, sale) => sum + sale.amountPaid,
      0
    );

    const totalExpenses = expensesInPeriod.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const outstandingDebt = salesInPeriod.reduce(
      (sum, sale) =>
        sum + Math.max(0, sale.totalAmount - sale.amountPaid),
      0
    );

    /*
     * -------------------------
     * COGS + PRODUCT PROFIT
     * -------------------------
     *
     * COGS:
     *
     * quantity × historical unitCost
     *
     * Revenue:
     *
     * quantity × historical unitPrice
     *
     * Gross profit:
     *
     * revenue - COGS
     */

    let totalCogs = 0;

    const productRevenueMap = new Map<
      number,
      {
        productId: number;
        productName: string;
        unitsSold: number;
        revenue: number;
        cogs: number;
        grossProfit: number;
      }
    >();

    for (const item of saleItems) {
      const quantity = Number(item.quantity) || 0;
      const revenue = Number(item.totalPrice) || 0;
      const unitCost = Number(item.unitCost) || 0;

      const itemCogs = quantity * unitCost;

      const itemGrossProfit = revenue - itemCogs;

      totalCogs += itemCogs;

      const productId = Number(item.productId);

      const existing = productRevenueMap.get(productId);

      if (existing) {
        existing.unitsSold += quantity;
        existing.revenue += revenue;
        existing.cogs += itemCogs;
        existing.grossProfit += itemGrossProfit;
      } else {
        productRevenueMap.set(productId, {
          productId,
          productName: String(item.productName),
          unitsSold: quantity,
          revenue,
          cogs: itemCogs,
          grossProfit: itemGrossProfit,
        });
      }
    }

    const revenueByProduct = Array.from(
      productRevenueMap.values()
    ).sort((a, b) => b.revenue - a.revenue);

    /*
     * Gross profit:
     *
     * Revenue - COGS
     */

    const grossProfit = totalRevenue - totalCogs;

    /*
     * Net profit:
     *
     * Gross profit - operating expenses
     */

    const netProfit = grossProfit - totalExpenses;

    /*
     * -------------------------
     * INVENTORY
     * -------------------------
     *
     * Inventory value intentionally uses the CURRENT product cost,
     * because this represents the current value of stock currently
     * sitting in the business.
     */

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum + product.quantity * product.costPrice,
      0
    );

    const inventorySellingValue = products.reduce(
      (sum, product) =>
        sum + product.quantity * product.sellingPrice,
      0
    );

    const lowStockProducts = products
      .filter((product) => product.quantity <= 5)
      .sort((a, b) => a.quantity - b.quantity);

    /*
     * -------------------------
     * DAILY SALES
     * -------------------------
     *
     * Grouped using Africa/Lagos so Nigerian calendar days are used
     * instead of UTC days.
     */

    const dailySalesMap = new Map<
      string,
      {
        date: string;
        revenue: number;
        collected: number;
        transactions: number;
      }
    >();

    for (const sale of salesInPeriod) {
      const key = getLagosDateKey(sale.createdAt);

      const existing = dailySalesMap.get(key);

      if (existing) {
        existing.revenue += sale.totalAmount;
        existing.collected += sale.amountPaid;
        existing.transactions += 1;
      } else {
        dailySalesMap.set(key, {
          date: key,
          revenue: sale.totalAmount,
          collected: sale.amountPaid,
          transactions: 1,
        });
      }
    }

    const dailySales = Array.from(
      dailySalesMap.values()
    ).sort((a, b) => b.date.localeCompare(a.date));

    /*
     * -------------------------
     * EXPENSE BY CATEGORY
     * -------------------------
     */

    const expenseCategoryMap = new Map<
      string,
      {
        category: string;
        amount: number;
        transactions: number;
      }
    >();

    for (const expense of expensesInPeriod) {
      const category =
        expense.category?.trim() || "Other";

      const existing = expenseCategoryMap.get(category);

      if (existing) {
        existing.amount += expense.amount;
        existing.transactions += 1;
      } else {
        expenseCategoryMap.set(category, {
          category,
          amount: expense.amount,
          transactions: 1,
        });
      }
    }

    const expenseByCategory = Array.from(
      expenseCategoryMap.values()
    ).sort((a, b) => b.amount - a.amount);

    /*
     * -------------------------
     * PAYMENT STATUS
     * -------------------------
     */

    const paymentStatus = {
      paid: salesInPeriod.filter(
        (sale) => sale.paymentStatus === "PAID"
      ).length,

      partial: salesInPeriod.filter(
        (sale) => sale.paymentStatus === "PARTIAL"
      ).length,

      unpaid: salesInPeriod.filter(
        (sale) => sale.paymentStatus === "UNPAID"
      ).length,
    };

    /*
     * -------------------------
     * RECENT SALES
     * -------------------------
     */

    const recentSales = [...salesInPeriod]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    /*
     * -------------------------
     * RECENT EXPENSES
     * -------------------------
     */

    const recentExpenses = [...expensesInPeriod]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({
      success: true,

      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },

      summary: {
        totalRevenue,
        totalCollected,
        totalExpenses,
        outstandingDebt,

        totalCogs,

        grossProfit,

        netProfit,

        /*
         * Compatibility aliases.
         *
         * Existing code that still expects these names will not
         * immediately break.
         */
        estimatedCogs: totalCogs,
        estimatedGrossProfit: grossProfit,
        estimatedNetProfit: netProfit,
        estimatedProfit: netProfit,

        customerCount: customers.length,
        productCount: products.length,
        inventoryValue,
        inventorySellingValue,
      },

      paymentStatus,

      dailySales,

      revenueByProduct,

      expenseByCategory,

      recentSales,

      recentExpenses,

      lowStockProducts,
    });
  } catch (error) {
    console.error("REPORTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not load reports.",
      },
      { status: 500 }
    );
  }
}