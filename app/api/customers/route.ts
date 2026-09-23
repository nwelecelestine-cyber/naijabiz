import { db } from "@/src/prisma/db";

const BUSINESS_ID = 1;

export async function GET() {
  try {
    const customers = await db.orm.public.Customer.where({
      businessId: BUSINESS_ID,
    }).all();

    return Response.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error(error);

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
      businessId: BUSINESS_ID,
      name,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      address: body.address?.trim() || null,
    });

    return Response.json({
      success: true,
      message: "Customer added successfully",
      customer,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Could not create customer",
      },
      { status: 500 }
    );
  }
}