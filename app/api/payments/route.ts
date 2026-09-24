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

    const payments = await db.orm.public.Payment.where({
      businessId,
    }).all();

    const customers = await db.orm.public.Customer.where({
      businessId,
    }).all();

    const sales = await db.orm.public.Sale.where({
      businessId,
    }).all();

    const customerMap = new Map(
      customers.map((customer) => [customer.id, customer])
    );

    const saleMap = new Map(
      sales.map((sale) => [sale.id, sale])
    );

    const paymentHistory = payments
      .map((payment) => {
        const customer = customerMap.get(payment.customerId);
        const sale = saleMap.get(payment.saleId);

        if (!customer || !sale) {
          return null;
        }

        return {
          id: payment.id,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,

          saleId: sale.id,
          saleTotal: sale.totalAmount,

          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          notes: payment.notes,

          createdAt: payment.createdAt,
        };
      })
      .filter((payment) => payment !== null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

    const totalPayments = paymentHistory.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    return Response.json({
      success: true,
      count: paymentHistory.length,
      totalPayments,
      payments: paymentHistory,
    });
  } catch (error) {
    console.error("PAYMENTS GET ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not load payment history",
      },
      { status: 500 }
    );
  }
}