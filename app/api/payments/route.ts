import { db } from "@/src/prisma/db";

const BUSINESS_ID = 1;

export async function GET() {
  try {
    const payments = await db.orm.public.Payment.where({
      businessId: BUSINESS_ID,
    }).all();

    const customers = await db.orm.public.Customer.where({
      businessId: BUSINESS_ID,
    }).all();

    const sales = await db.orm.public.Sale.where({
      businessId: BUSINESS_ID,
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
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Could not load payment history",
      },
      { status: 500 }
    );
  }
}