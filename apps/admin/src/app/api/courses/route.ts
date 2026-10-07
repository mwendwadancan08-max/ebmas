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

    const courses = await prisma.course.findMany({
      where: schoolId
        ? {
            schoolId,
          }
        : undefined,
      orderBy: {
        name: "asc",
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            students: true,
            courseUnits: true,
          },
        },
      },
    });

    return NextResponse.json({
      schools,
      courses,
    });
  } catch (error) {
    console.error("GET /api/courses error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load courses.",
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
          error: "School, course name and course code are required.",
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

    const course = await prisma.course.create({
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
        _count: {
          select: {
            students: true,
            courseUnits: true,
          },
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/courses error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "A course with that code already exists in this school.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create course.",
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
          error: "Course ID, school, course name and course code are required.",
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

    const course = await prisma.course.update({
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
        _count: {
          select: {
            students: true,
            courseUnits: true,
          },
        },
      },
    });

    return NextResponse.json(course);
  } catch (error: unknown) {
    console.error("PATCH /api/courses error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "A course with that code already exists in this school.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update course.",
      },
      { status: 500 }
    );
  }
}
