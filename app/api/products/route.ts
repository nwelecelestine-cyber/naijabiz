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

async function getAuthenticatedBusiness() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      businessId: null,
    };
  }

  return {
    user,
    businessId: await getBusinessIdForUser(user.id),
  };
}

export async function GET() {
  try {
    const { user, businessId } = await getAuthenticatedBusiness();

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    if (!businessId) {
      return Response.json(
        {
          success: false,
          error: "No business is linked to this account.",
        },
        { status: 403 }
      );
    }

    const products = await db.orm.public.Product.where({
      businessId,
    }).all();

    return Response.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("PRODUCTS GET ERROR:", error);

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
    const { user, businessId } = await getAuthenticatedBusiness();

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

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

    const name = String(body.name ?? "").trim();
    const quantity = Number(body.quantity);
    const costPrice = Number(body.costPrice);
    const sellingPrice = Number(body.sellingPrice);

    if (!name) {
      return Response.json(
        {
          success: false,
          error: "Product name is required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return Response.json(
        {
          success: false,
          error: "Quantity must be a valid whole number.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(costPrice) || costPrice < 0) {
      return Response.json(
        {
          success: false,
          error: "Cost price must be valid.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(sellingPrice) || sellingPrice < 0) {
      return Response.json(
        {
          success: false,
          error: "Selling price must be valid.",
        },
        { status: 400 }
      );
    }

    const product = await db.orm.public.Product.create({
      businessId,
      name,
      sku:
        typeof body.sku === "string" && body.sku.trim()
          ? body.sku.trim()
          : null,
      category:
        typeof body.category === "string" && body.category.trim()
          ? body.category.trim()
          : null,
      quantity,
      costPrice,
      sellingPrice,
    });

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("PRODUCTS POST ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not create product",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, businessId } = await getAuthenticatedBusiness();

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

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

    const productId = Number(body.id);
    const name = String(body.name ?? "").trim();
    const quantity = Number(body.quantity);
    const costPrice = Number(body.costPrice);
    const sellingPrice = Number(body.sellingPrice);

    if (!Number.isInteger(productId) || productId <= 0) {
      return Response.json(
        {
          success: false,
          error: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return Response.json(
        {
          success: false,
          error: "Product name is required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return Response.json(
        {
          success: false,
          error: "Quantity must be a valid whole number.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(costPrice) || costPrice < 0) {
      return Response.json(
        {
          success: false,
          error: "Cost price must be valid.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(sellingPrice) || sellingPrice < 0) {
      return Response.json(
        {
          success: false,
          error: "Selling price must be valid.",
        },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM public.product
      WHERE id = ${productId}
        AND "businessId" = ${businessId}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    await sql`
      UPDATE public.product
      SET
        name = ${name},
        sku = ${typeof body.sku === "string" && body.sku.trim()
          ? body.sku.trim()
          : null},
        category = ${typeof body.category === "string" && body.category.trim()
          ? body.category.trim()
          : null},
        quantity = ${quantity},
        "costPrice" = ${costPrice},
        "sellingPrice" = ${sellingPrice},
        "updatedAt" = now()
      WHERE id = ${productId}
        AND "businessId" = ${businessId}
    `;

    const updated = await sql`
      SELECT
        id,
        name,
        sku,
        category,
        quantity,
        "costPrice",
        "sellingPrice",
        "createdAt",
        "updatedAt"
      FROM public.product
      WHERE id = ${productId}
        AND "businessId" = ${businessId}
      LIMIT 1
    `;

    return Response.json({
      success: true,
      message: "Product updated successfully.",
      product: updated[0],
    });
  } catch (error) {
    console.error("PRODUCTS PATCH ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not update product.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, businessId } = await getAuthenticatedBusiness();

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

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
    const productId = Number(body.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return Response.json(
        {
          success: false,
          error: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM public.product
      WHERE id = ${productId}
        AND "businessId" = ${businessId}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    const saleItems = await sql`
      SELECT id
      FROM public."saleItem"
      WHERE "productId" = ${productId}
      LIMIT 1
    `;

    if (saleItems.length > 0) {
      return Response.json(
        {
          success: false,
          error:
            "This product cannot be deleted because it has sales records. You can edit the product instead.",
        },
        { status: 409 }
      );
    }

    await sql`
      DELETE FROM public.product
      WHERE id = ${productId}
        AND "businessId" = ${businessId}
    `;

    return Response.json({
      success: true,
      message: "Product deleted successfully.",
      productId,
    });
  } catch (error) {
    console.error("PRODUCTS DELETE ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not delete product.",
      },
      { status: 500 }
    );
  }
}