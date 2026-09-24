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

export async function POST(request: Request) {
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

    const body = await request.json();

    const saleId = Number(body.saleId);
    const paymentAmount = Number(body.paymentAmount);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return Response.json(
        {
          success: false,
          error: "A valid saleId is required",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(paymentAmount) || paymentAmount <= 0) {
      return Response.json(
        {
          success: false,
          error: "Payment amount must be greater than zero",
        },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const sale = await tx.orm.public.Sale.first({
        id: saleId,
        businessId,
      });

      if (!sale) {
        throw new Error("SALE_NOT_FOUND");
      }

      const currentBalance = sale.totalAmount - sale.amountPaid;

      if (currentBalance <= 0) {
        throw new Error("SALE_ALREADY_PAID");
      }

      if (paymentAmount > currentBalance) {
        throw new Error("PAYMENT_TOO_HIGH");
      }

      const newAmountPaid = sale.amountPaid + paymentAmount;

      let paymentStatus = "PARTIAL";

      if (newAmountPaid >= sale.totalAmount) {
        paymentStatus = "PAID";
      }

      const updatedSale = await tx.orm.public.Sale
        .where({
          id: sale.id,
        })
        .update({
          amountPaid: newAmountPaid,
          paymentStatus,
        });

      return {
        sale: updatedSale,
        paymentAmount,
        previousBalance: currentBalance,
        newBalance: sale.totalAmount - newAmountPaid,
        paymentStatus,
      };
    });

    return Response.json({
      success: true,
      message: "Payment recorded successfully",
      ...result,
    });
  } catch (error) {
    console.error("DEBT PAYMENT ERROR:", error);

    if (error instanceof Error) {
      if (error.message === "SALE_NOT_FOUND") {
        return Response.json(
          {
            success: false,
            error: "Sale not found",
          },
          { status: 404 }
        );
      }

      if (error.message === "SALE_ALREADY_PAID") {
        return Response.json(
          {
            success: false,
            error: "This sale has already been fully paid",
          },
          { status: 400 }
        );
      }

      if (error.message === "PAYMENT_TOO_HIGH") {
        return Response.json(
          {
            success: false,
            error: "Payment cannot be greater than the outstanding balance",
          },
          { status: 400 }
        );
      }
    }

    return Response.json(
      {
        success: false,
        error: "Could not record payment",
      },
      { status: 500 }
    );
  }
}