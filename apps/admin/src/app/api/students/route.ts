import { NextResponse } from "next/server";
import { prisma } from "db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const courseId = searchParams.get("courseId");

    const students = await prisma.student.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        ...(courseId ? { courseId } : {}),
      },
      orderBy: [
        { admissionYear: "asc" },
        { regNumber: "asc" },
      ],
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      students,
    });
  } catch (error) {
    console.error("GET /api/students error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load students.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const schoolId = String(body.schoolId ?? "").trim();
    const courseId = String(body.courseId ?? "").trim();
    const admissionYear = Number(body.admissionYear);
    const students = Array.isArray(body.students) ? body.students : [];

    if (!schoolId || !courseId || !admissionYear) {
      return NextResponse.json(
        {
          error: "School, course and admission year are required.",
        },
        { status: 400 }
      );
    }

    if (!students.length) {
      return NextResponse.json(
        {
          error: "At least one student is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(admissionYear) ||
      admissionYear < 2000 ||
      admissionYear > 2100
    ) {
      return NextResponse.json(
        {
          error: "Admission year is invalid.",
        },
        { status: 400 }
      );
    }

    const [school, course] = await Promise.all([
      prisma.school.findUnique({
        where: { id: schoolId },
      }),
      prisma.course.findUnique({
        where: { id: courseId },
      }),
    ]);

    if (!school) {
      return NextResponse.json(
        { error: "Selected school was not found." },
        { status: 404 }
      );
    }

    if (!course) {
      return NextResponse.json(
        { error: "Selected course was not found." },
        { status: 404 }
      );
    }

    if (course.schoolId !== schoolId) {
      return NextResponse.json(
        {
          error: "The selected course does not belong to the selected school.",
        },
        { status: 400 }
      );
    }

    const yearShort = String(admissionYear).slice(-2);

    const data = students.map(
      (student: { name?: string; indexNumber?: string }) => {
        const name = String(student.name ?? "").trim();
        const indexNumber = String(student.indexNumber ?? "").trim();

        const nameParts = name.split(/\s+/).filter(Boolean);
        const firstName = nameParts.shift() ?? "";
        const lastName = nameParts.join(" ") || firstName;

        if (!name || !indexNumber) {
          throw new Error("Every student must have a name and index number.");
        }

        if (!/^\d+$/.test(indexNumber)) {
          throw new Error(
            `Invalid index number "${indexNumber}". Use numbers only.`
          );
        }

        const paddedIndex = indexNumber.padStart(5, "0");
        const regNumber = `${course.code}/${paddedIndex}/${yearShort}`;

        return {
          schoolId,
          courseId,
          admissionYear,
          regNumber,
          firstName,
          lastName,
        };
      }
    );

    const created = await prisma.student.createMany({
      data,
      skipDuplicates: false,
    });

    const saved = await prisma.student.findMany({
      where: {
        schoolId,
        courseId,
        admissionYear,
      },
      orderBy: {
        regNumber: "asc",
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        created: created.count,
        students: saved,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/students error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "One or more registration numbers already exist. Check the index numbers and admission year.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save students.",
      },
      { status: 500 }
    );
  }
}
