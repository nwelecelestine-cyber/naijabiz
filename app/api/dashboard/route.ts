import { db } from "@/src/prisma/db";

const BUSINESS_ID = 1;

export async function GET() {
  try {
    const [sales, expenses, products] = await Promise.all([
      db.orm.public.Sale.where({
        businessId: BUSINESS_ID,
      }).all(),

      db.orm.public.Expense.where({
        businessId: BUSINESS_ID,
      }).all(),

      db.orm.public.Product.where({
        businessId: BUSINESS_ID,
      }).all(),
    ]);

    const today = new Date();

    const isToday = (date: string | Date) => {
      const value = new Date(date);

      return (
        value.getFullYear() === today.getFullYear() &&
        value.getMonth() === today.getMonth() &&
        value.getDate() === today.getDate()
      );
    };

    const todaySales = sales.filter((sale) => isToday(sale.createdAt));
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
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Could not load dashboard data",
      },
      { status: 500 }
    );
  }
}