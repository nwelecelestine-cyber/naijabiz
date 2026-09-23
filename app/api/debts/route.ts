import { db } from "@/src/prisma/db";

const BUSINESS_ID = 1;

export async function GET() {
  try {
    const sales = await db.orm.public.Sale.where({
      businessId: BUSINESS_ID,
    }).all();

    const customers = await db.orm.public.Customer.where({
      businessId: BUSINESS_ID,
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