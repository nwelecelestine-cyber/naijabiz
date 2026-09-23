import { db } from "@/src/prisma/db";

export async function GET() {
  try {
    const products = await db.orm.public.Product.all();

    return Response.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Could not fetch products",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const product = await db.orm.public.Product.create({
      businessId: 1,
      name: body.name,
      sku: body.sku ?? null,
      category: body.category ?? null,
      quantity: body.quantity ?? 0,
      costPrice: body.costPrice,
      sellingPrice: body.sellingPrice,
    });

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Could not create product",
      },
      { status: 500 }
    );
  }
}