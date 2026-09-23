import { db } from "@/src/prisma/db";

const BUSINESS_ID = 1;

export async function GET() {
  try {
    const sales = await db.orm.public.Sale.all();

    return Response.json({
      success: true,
      sales,
    });
  } catch (error) {
    console.error(error);

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
    const body = await request.json();

    const productId = Number(body.productId);
    const quantity = Number(body.quantity);
    const amountPaid = Number(body.amountPaid ?? 0);

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

    const result = await db.transaction(async (tx) => {
      // 1. Find the product
      const product = await tx.orm.public.Product.first({
        id: productId,
        businessId: BUSINESS_ID,
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      // 2. Check available stock
      if (product.quantity < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // 3. Calculate sale amount
      const totalAmount = product.sellingPrice * quantity;

      if (amountPaid > totalAmount) {
        throw new Error("PAYMENT_TOO_HIGH");
      }

      // 4. Determine payment status
      let paymentStatus = "UNPAID";

      if (amountPaid >= totalAmount) {
        paymentStatus = "PAID";
      } else if (amountPaid > 0) {
        paymentStatus = "PARTIAL";
      }

      // 5. Create the sale
      const sale = await tx.orm.public.Sale.create({
        businessId: BUSINESS_ID,
        customerId: body.customerId ?? null,
        totalAmount,
        amountPaid,
        paymentStatus,
        notes: body.notes ?? null,
      });

      // 6. Create the sale item
      const saleItem = await tx.orm.public.SaleItem.create({
        saleId: sale.id,
        productId: product.id,
        quantity,
        unitPrice: product.sellingPrice,
        totalPrice: totalAmount,
      });

      // 7. Reduce inventory
      const newQuantity = product.quantity - quantity;

      await tx.orm.public.Product
        .where({ id: product.id })
        .update({
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
    console.error(error);

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