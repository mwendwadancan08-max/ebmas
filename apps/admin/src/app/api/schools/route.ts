import { NextResponse } from "next/server";
import { prisma } from "db";

export async function GET() {
  try {
    const university = await prisma.university.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    const schools = university
      ? await prisma.school.findMany({
          where: {
            universityId: university.id,
          },
          orderBy: {
            name: "asc",
          },
          include: {
            _count: {
              select: {
                courses: true,
                students: true,
                departments: true,
              },
            },
          },
        })
      : [];

    return NextResponse.json({
      university,
      schools,
    });
  } catch (error) {
    console.error("GET /api/schools error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load schools.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim().toUpperCase();

    if (!name || !code) {
      return NextResponse.json(
        {
          error: "School name and school code are required.",
        },
        { status: 400 }
      );
    }

    const university = await prisma.university.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!university) {
      return NextResponse.json(
        {
          error: "Please configure the university name first.",
        },
        { status: 400 }
      );
    }

    const school = await prisma.school.create({
      data: {
        universityId: university.id,
        name,
        code,
      },
      include: {
        _count: {
          select: {
            courses: true,
            students: true,
            departments: true,
          },
        },
      },
    });

    return NextResponse.json(school, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/schools error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "A school with that name or code already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create school.",
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
    const code = String(body.code ?? "").trim().toUpperCase();

    if (!id || !name || !code) {
      return NextResponse.json(
        {
          error: "School ID, name and school code are required.",
        },
        { status: 400 }
      );
    }

    const school = await prisma.school.update({
      where: {
        id,
      },
      data: {
        name,
        code,
      },
      include: {
        _count: {
          select: {
            courses: true,
            students: true,
            departments: true,
          },
        },
      },
    });

    return NextResponse.json(school);
  } catch (error: unknown) {
    console.error("PATCH /api/schools error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "A school with that name or code already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update school.",
      },
      { status: 500 }
    );
  }
}
