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

    return Response.json({
      success: true,
      sales,
    });
  } catch (error) {
    console.error("SALES GET ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not fetch sales",
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

    const productId = Number(body.productId);
    const quantity = Number(body.quantity);
    const amountPaid = Number(body.amountPaid ?? 0);

    const customerId =
      body.customerId === null ||
      body.customerId === undefined ||
      body.customerId === ""
        ? null
        : Number(body.customerId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return Response.json(
        {
          success: false,
          error: "A valid productId is required",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return Response.json(
        {
          success: false,
          error: "Quantity must be a positive whole number",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amountPaid) || amountPaid < 0) {
      return Response.json(
        {
          success: false,
          error: "Amount paid must be a valid non-negative number",
        },
        { status: 400 }
      );
    }

    if (
      customerId !== null &&
      (!Number.isInteger(customerId) || customerId <= 0)
    ) {
      return Response.json(
        {
          success: false,
          error: "A valid customerId is required",
        },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // 1. Find the product belonging to this business
      const product = await tx.orm.public.Product.first({
        id: productId,
        businessId,
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      // 2. Make sure the customer belongs to this business
      if (customerId !== null) {
        const customer = await tx.orm.public.Customer.first({
          id: customerId,
          businessId,
        });

        if (!customer) {
          throw new Error("CUSTOMER_NOT_FOUND");
        }
      }

      // 3. Check available stock
      if (product.quantity < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // 4. Capture the product cost at the exact moment of sale.
      //
      // This is critical for historical reporting.
      // If the product cost later changes, this sale will
      // still retain the original cost.
      const unitCost = product.costPrice;

      // 5. Calculate sale amount
      const totalAmount = product.sellingPrice * quantity;

      if (amountPaid > totalAmount) {
        throw new Error("PAYMENT_TOO_HIGH");
      }

      // 6. Determine payment status
      let paymentStatus = "UNPAID";

      if (amountPaid >= totalAmount) {
        paymentStatus = "PAID";
      } else if (amountPaid > 0) {
        paymentStatus = "PARTIAL";
      }

      // 7. Create the sale under the user's business
      const sale = await tx.orm.public.Sale.create({
        businessId,
        customerId,
        totalAmount,
        amountPaid,
        paymentStatus,
        notes: body.notes ?? null,
      });

      // 8. Create the sale item.
      //
      // unitCost stores the historical cost price that existed
      // when this particular sale happened.
      const saleItem = await tx.orm.public.SaleItem.create({
        saleId: sale.id,
        productId: product.id,
        quantity,
        unitPrice: product.sellingPrice,
        unitCost,
        totalPrice: totalAmount,
      });

      // 9. Reduce inventory
      const newQuantity = product.quantity - quantity;

      await tx.orm.public.Product.where({
        id: product.id,
      }).update({
        quantity: newQuantity,
      });

      return {
        sale,
        saleItem,
        product: {
          id: product.id,
          name: product.name,
          previousQuantity: product.quantity,
          newQuantity,
        },
      };
    });

    return Response.json({
      success: true,
      message: "Sale recorded successfully",
      ...result,
    });
  } catch (error) {
    console.error("SALES POST ERROR:", error);

    if (error instanceof Error) {
      if (error.message === "PRODUCT_NOT_FOUND") {
        return Response.json(
          {
            success: false,
            error: "Product not found",
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

      if (error.message === "INSUFFICIENT_STOCK") {
        return Response.json(
          {
            success: false,
            error: "Insufficient stock",
          },
          { status: 400 }
        );
      }

      if (error.message === "PAYMENT_TOO_HIGH") {
        return Response.json(
          {
            success: false,
            error: "Amount paid cannot be greater than the sale total",
          },
          { status: 400 }
        );
      }
    }

    return Response.json(
      {
        success: false,
        error: "Could not create sale",
      },
      { status: 500 }
    );
  }
}