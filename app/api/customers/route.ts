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

  const businessId = await getBusinessIdForUser(user.id);

  return {
    user,
    businessId,
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

    const customers = await db.orm.public.Customer.where({
      businessId,
    }).all();

    return Response.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("CUSTOMERS GET ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not fetch customers",
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

    if (!name) {
      return Response.json(
        {
          success: false,
          error: "Customer name is required",
        },
        { status: 400 }
      );
    }

    const customer = await db.orm.public.Customer.create({
      businessId,
      name,
      phone:
        typeof body.phone === "string" && body.phone.trim()
          ? body.phone.trim()
          : null,
      email:
        typeof body.email === "string" && body.email.trim()
          ? body.email.trim()
          : null,
      address:
        typeof body.address === "string" && body.address.trim()
          ? body.address.trim()
          : null,
    });

    return Response.json({
      success: true,
      message: "Customer added successfully",
      customer,
    });
  } catch (error) {
    console.error("CUSTOMERS POST ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not create customer",
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
    const customerId = Number(body.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return Response.json(
        {
          success: false,
          error: "Invalid customer ID.",
        },
        { status: 400 }
      );
    }

    const name = String(body.name ?? "").trim();

    if (!name) {
      return Response.json(
        {
          success: false,
          error: "Customer name is required.",
        },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM public.customer
      WHERE id = ${customerId}
        AND "businessId" = ${businessId}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Customer not found.",
        },
        { status: 404 }
      );
    }

    await sql`
      UPDATE public.customer
      SET
        name = ${name},
        phone = ${typeof body.phone === "string" && body.phone.trim()
          ? body.phone.trim()
          : null},
        email = ${typeof body.email === "string" && body.email.trim()
          ? body.email.trim()
          : null},
        address = ${typeof body.address === "string" && body.address.trim()
          ? body.address.trim()
          : null},
        "updatedAt" = now()
      WHERE id = ${customerId}
        AND "businessId" = ${businessId}
    `;

    const updated = await sql`
      SELECT
        id,
        name,
        phone,
        email,
        address,
        "createdAt",
        "updatedAt"
      FROM public.customer
      WHERE id = ${customerId}
        AND "businessId" = ${businessId}
      LIMIT 1
    `;

    return Response.json({
      success: true,
      message: "Customer updated successfully.",
      customer: updated[0],
    });
  } catch (error) {
    console.error("CUSTOMERS PATCH ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not update customer.",
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
    const customerId = Number(body.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return Response.json(
        {
          success: false,
          error: "Invalid customer ID.",
        },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM public.customer
      WHERE id = ${customerId}
        AND "businessId" = ${businessId}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Customer not found.",
        },
        { status: 404 }
      );
    }

    const sales = await sql`
      SELECT id
      FROM public.sale
      WHERE "customerId" = ${customerId}
        AND "businessId" = ${businessId}
      LIMIT 1
    `;

    if (sales.length > 0) {
      return Response.json(
        {
          success: false,
          error:
            "This customer cannot be deleted because they have sales records. You can edit the customer instead.",
        },
        { status: 409 }
      );
    }

    await sql`
      DELETE FROM public.customer
      WHERE id = ${customerId}
        AND "businessId" = ${businessId}
    `;

    return Response.json({
      success: true,
      message: "Customer deleted successfully.",
      customerId,
    });
  } catch (error) {
    console.error("CUSTOMERS DELETE ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not delete customer.",
      },
      { status: 500 }
    );
  }
}