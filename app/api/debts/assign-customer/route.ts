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
    const customerId = Number(body.customerId);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return Response.json(
        {
          success: false,
          error: "A valid saleId is required",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return Response.json(
        {
          success: false,
          error: "A valid customerId is required",
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

      const customer = await tx.orm.public.Customer.first({
        id: customerId,
        businessId,
      });

      if (!customer) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }

      const amountOwed = sale.totalAmount - sale.amountPaid;

      if (amountOwed <= 0) {
        throw new Error("SALE_ALREADY_PAID");
      }

      if (sale.customerId) {
        throw new Error("CUSTOMER_ALREADY_ASSIGNED");
      }

      const updatedSale = await tx.orm.public.Sale
        .where({
          id: sale.id,
        })
        .update({
          customerId: customer.id,
        });

      return {
        sale: updatedSale,
        customer,
        amountOwed,
      };
    });

    return Response.json({
      success: true,
      message: "Customer assigned successfully",
      ...result,
    });
  } catch (error) {
    console.error("ASSIGN CUSTOMER ERROR:", error);

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

      if (error.message === "CUSTOMER_NOT_FOUND") {
        return Response.json(
          {
            success: false,
            error: "Customer not found",
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

      if (error.message === "CUSTOMER_ALREADY_ASSIGNED") {
        return Response.json(
          {
            success: false,
            error: "A customer is already assigned to this sale",
          },
          { status: 400 }
        );
      }
    }

    return Response.json(
      {
        success: false,
        error: "Could not assign customer",
      },
      { status: 500 }
    );
  }
}