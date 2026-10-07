import { NextResponse } from "next/server";
import { prisma } from "db";

const examinationInclude = {
  schools: {
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true,
          departments: {
            orderBy: {
              name: "asc",
            },
            select: {
              id: true,
              name: true,
              code: true,
              units: {
                orderBy: {
                  code: "asc",
                },
                include: {
                  courseUnits: {
                    orderBy: {
                      yearOfStudy: "asc",
                    },
                    include: {
                      course: {
                        select: {
                          id: true,
                          name: true,
                          code: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  sittings: {
    orderBy: {
      startTime: "asc",
    },
    include: {
      courseUnit: {
        include: {
          unit: {
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
      },
    },
  },
} as const;

function formatExamination(examination: any) {
  return {
    ...examination,
    schools: examination.schools.map((item: any) => ({
      id: item.id,
      school: item.school,
    })),
  };
}

export async function GET() {
  try {
    const [examinations, schools] = await Promise.all([
      prisma.examPeriod.findMany({
        orderBy: [
          { academicYear: "desc" },
          { semester: "asc" },
        ],
        include: examinationInclude,
      }),

      prisma.school.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          code: true,
          departments: {
            orderBy: {
              name: "asc",
            },
            select: {
              id: true,
              name: true,
              code: true,
              units: {
                orderBy: {
                  code: "asc",
                },
                include: {
                  courseUnits: {
                    orderBy: {
                      yearOfStudy: "asc",
                    },
                    include: {
                      course: {
                        select: {
                          id: true,
                          name: true,
                          code: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      examinations: examinations.map(formatExamination),
      schools,
    });
  } catch (error: unknown) {
    console.error("GET /api/examinations error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load examinations.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const academicYear = String(body.academicYear ?? "").trim();
    const semester = String(body.semester ?? "").trim();
    const name = String(body.name ?? "").trim();
    const startDate = String(body.startDate ?? "").trim();
    const endDate = String(body.endDate ?? "").trim();

    const schoolIds: string[] = Array.isArray(body.schoolIds)
      ? body.schoolIds
          .map((id: unknown) => String(id).trim())
          .filter((id: string) => Boolean(id))
      : [];

    if (!academicYear || !semester || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Academic year, semester, start date and end date are required.",
        },
        { status: 400 }
      );
    }

    if (schoolIds.length === 0) {
      return NextResponse.json(
        {
          error: "Select at least one participating school.",
        },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Invalid examination dates.",
        },
        { status: 400 }
      );
    }

    if (parsedEndDate < parsedStartDate) {
      return NextResponse.json(
        {
          error: "End date cannot be before the start date.",
        },
        { status: 400 }
      );
    }

    const uniqueSchoolIds: string[] = [
      ...new Set<string>(schoolIds),
    ];

    const schools = await prisma.school.findMany({
      where: {
        id: {
          in: uniqueSchoolIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (schools.length !== uniqueSchoolIds.length) {
      return NextResponse.json(
        {
          error: "One or more selected schools were not found.",
        },
        { status: 404 }
      );
    }

    const examName =
      name || `${academicYear} ${semester} Examination`;

    const examination = await prisma.examPeriod.create({
      data: {
        name: examName,
        academicYear,
        semester,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        schools: {
          create: uniqueSchoolIds.map((schoolId) => ({
            schoolId,
          })),
        },
      },
      include: examinationInclude,
    });

    return NextResponse.json(
      {
        examination: formatExamination(examination),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/examinations error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "An examination already exists for this academic year and semester.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create examination.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id ?? "").trim();
    const academicYear = String(body.academicYear ?? "").trim();
    const semester = String(body.semester ?? "").trim();
    const name = String(body.name ?? "").trim();
    const startDate = String(body.startDate ?? "").trim();
    const endDate = String(body.endDate ?? "").trim();

    const schoolIds: string[] = Array.isArray(body.schoolIds)
      ? body.schoolIds
          .map((schoolId: unknown) => String(schoolId).trim())
          .filter((schoolId: string) => Boolean(schoolId))
      : [];

    if (!id) {
      return NextResponse.json(
        { error: "Examination ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.examPeriod.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sittings: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Examination was not found." },
        { status: 404 }
      );
    }

    if (existing._count.sittings > 0) {
      return NextResponse.json(
        {
          error:
            "This examination already has exam sittings and can no longer be structurally edited.",
        },
        { status: 409 }
      );
    }

    if (!academicYear || !semester || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Academic year, semester, start date and end date are required.",
        },
        { status: 400 }
      );
    }

    if (schoolIds.length === 0) {
      return NextResponse.json(
        {
          error: "Select at least one participating school.",
        },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Invalid examination dates.",
        },
        { status: 400 }
      );
    }

    if (parsedEndDate < parsedStartDate) {
      return NextResponse.json(
        {
          error: "End date cannot be before the start date.",
        },
        { status: 400 }
      );
    }

    const uniqueSchoolIds: string[] = [
      ...new Set<string>(schoolIds),
    ];

    const schools = await prisma.school.findMany({
      where: {
        id: {
          in: uniqueSchoolIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (schools.length !== uniqueSchoolIds.length) {
      return NextResponse.json(
        {
          error: "One or more selected schools were not found.",
        },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.examPeriodSchool.deleteMany({
        where: {
          examPeriodId: id,
        },
      });

      return tx.examPeriod.update({
        where: {
          id,
        },
        data: {
          name:
            name || `${academicYear} ${semester} Examination`,
          academicYear,
          semester,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          schools: {
            create: uniqueSchoolIds.map((schoolId) => ({
              schoolId,
            })),
          },
        },
        include: examinationInclude,
      });
    });

    return NextResponse.json({
      examination: formatExamination(updated),
    });
  } catch (error: unknown) {
    console.error("PATCH /api/examinations error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "An examination already exists for this academic year and semester.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update examination.",
      },
      { status: 500 }
    );
  }
}

