import { NextResponse } from "next/server";
import { prisma } from "db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    const schools = await prisma.school.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    const departments = await prisma.department.findMany({
      where: schoolId
        ? {
            schoolId,
          }
        : undefined,
      orderBy: [
        {
          school: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      schools,
      departments,
    });
  } catch (error) {
    console.error("GET /api/departments error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load departments.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const schoolId = String(body.schoolId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim().toUpperCase();

    if (!schoolId || !name || !code) {
      return NextResponse.json(
        {
          error: "School, department name and department code are required.",
        },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: {
        id: schoolId,
      },
    });

    if (!school) {
      return NextResponse.json(
        {
          error: "Selected school was not found.",
        },
        { status: 404 }
      );
    }

    const department = await prisma.department.create({
      data: {
        schoolId,
        name,
        code,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/departments error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A department with that code already exists in this school.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create department.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id ?? "").trim();
    const schoolId = String(body.schoolId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim().toUpperCase();

    if (!id || !schoolId || !name || !code) {
      return NextResponse.json(
        {
          error:
            "Department ID, school, department name and department code are required.",
        },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: {
        id: schoolId,
      },
    });

    if (!school) {
      return NextResponse.json(
        {
          error: "Selected school was not found.",
        },
        { status: 404 }
      );
    }

    const department = await prisma.department.update({
      where: {
        id,
      },
      data: {
        schoolId,
        name,
        code,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(department);
  } catch (error: unknown) {
    console.error("PATCH /api/departments error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A department with that code already exists in this school.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update department.",
      },
      { status: 500 }
    );
  }
}
