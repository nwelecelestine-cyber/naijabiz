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

    const sales = await db.orm.public.Sale.where({
      businessId,
    }).all();

    const customers = await db.orm.public.Customer.where({
      businessId,
    }).all();

    const customerMap = new Map(
      customers.map((customer) => [customer.id, customer])
    );

    const debts = sales
      .map((sale) => {
        const amountOwed = sale.totalAmount - sale.amountPaid;

        if (!sale.customerId || amountOwed <= 0) {
          return null;
        }

        const customer = customerMap.get(sale.customerId);

        if (!customer) {
          return null;
        }

        return {
          saleId: sale.id,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          totalAmount: sale.totalAmount,
          amountPaid: sale.amountPaid,
          amountOwed,
          paymentStatus: sale.paymentStatus,
          createdAt: sale.createdAt,
        };
      })
      .filter((debt) => debt !== null);

    const unassignedDebts = sales
      .map((sale) => {
        const amountOwed = sale.totalAmount - sale.amountPaid;

        if (sale.customerId || amountOwed <= 0) {
          return null;
        }

        return {
          saleId: sale.id,
          totalAmount: sale.totalAmount,
          amountPaid: sale.amountPaid,
          amountOwed,
          paymentStatus: sale.paymentStatus,
          notes: sale.notes,
          createdAt: sale.createdAt,
        };
      })
      .filter((debt) => debt !== null);

    const customerTotals = new Map<
      number,
      {
        customerId: number;
        customerName: string;
        customerPhone: string | null;
        totalOwed: number;
      }
    >();

    for (const debt of debts) {
      const existing = customerTotals.get(debt.customerId);

      if (existing) {
        existing.totalOwed += debt.amountOwed;
      } else {
        customerTotals.set(debt.customerId, {
          customerId: debt.customerId,
          customerName: debt.customerName,
          customerPhone: debt.customerPhone,
          totalOwed: debt.amountOwed,
        });
      }
    }

    const customerDebts = Array.from(customerTotals.values()).sort(
      (a, b) => b.totalOwed - a.totalOwed
    );

    const totalCustomerDebt = debts.reduce(
      (sum, debt) => sum + debt.amountOwed,
      0
    );

    const totalUnassignedDebt = unassignedDebts.reduce(
      (sum, debt) => sum + debt.amountOwed,
      0
    );

    const totalDebt = totalCustomerDebt + totalUnassignedDebt;

    return Response.json({
      success: true,
      totalDebt,
      totalCustomerDebt,
      totalUnassignedDebt,
      debtCount: debts.length,
      customerCount: customerDebts.length,
      unassignedDebtCount: unassignedDebts.length,
      debts,
      customerDebts,
      unassignedDebts,
    });
  } catch (error) {
    console.error("DEBTS API ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not load debts",
      },
      { status: 500 }
    );
  }
}