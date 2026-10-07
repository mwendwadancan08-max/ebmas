import { NextResponse } from "next/server";
import { prisma } from "db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "University name is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.university.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const university = await prisma.university.create({
      data: {
        name,
      },
    });

    return NextResponse.json(university, { status: 201 });
  } catch (error) {
    console.error("POST /api/university error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save university.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();

    if (!id || !name) {
      return NextResponse.json(
        { error: "University ID and name are required." },
        { status: 400 }
      );
    }

    const university = await prisma.university.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json(university);
  } catch (error) {
    console.error("PATCH /api/university error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update university.",
      },
      { status: 500 }
    );
  }
}
