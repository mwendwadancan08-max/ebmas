import { NextResponse } from "next/server";
import { prisma } from "db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const departmentId = searchParams.get("departmentId");
    const schoolId = searchParams.get("schoolId");
    const unitId = searchParams.get("unitId");

    const where: {
      departmentId?: string;
      department?: {
        schoolId?: string;
      };
      id?: string;
    } = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (schoolId) {
      where.department = {
        schoolId,
      };
    }

    if (unitId) {
      where.id = unitId;
    }

    const units = await prisma.unit.findMany({
      where,
      orderBy: {
        code: "asc",
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            school: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        courseUnits: {
          orderBy: [
            {
              yearOfStudy: "asc",
            },
            {
              course: {
                name: "asc",
              },
            },
          ],
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
                schoolId: true,
                students: {
                  select: {
                    id: true,
                    regNumber: true,
                    firstName: true,
                    lastName: true,
                    admissionYear: true,
                  },
                  orderBy: {
                    regNumber: "asc",
                  },
                },
              },
            },
          },
        },
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
      select: {
        id: true,
        name: true,
        code: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
      select: {
        id: true,
        name: true,
        code: true,
        schoolId: true,
      },
    });

    return NextResponse.json({
      units,
      departments,
      courses,
    });
  } catch (error) {
    console.error("GET /api/units error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load units.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const departmentId = String(body.departmentId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim().toUpperCase();

    const courseMappings = Array.isArray(body.courseMappings)
      ? body.courseMappings
      : [];

    if (!departmentId || !name || !code) {
      return NextResponse.json(
        {
          error:
            "Department, unit name and unit code are required.",
        },
        { status: 400 }
      );
    }

    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
        schoolId: true,
      },
    });

    if (!department) {
      return NextResponse.json(
        {
          error: "Selected department was not found.",
        },
        { status: 404 }
      );
    }

    const mappings = courseMappings.map(
      (mapping: { courseId?: unknown; yearOfStudy?: unknown }) => ({
        courseId: String(mapping.courseId ?? "").trim(),
        yearOfStudy: Number(mapping.yearOfStudy),
      })
    );

    const invalidMapping = mappings.find(
      (mapping: { courseId: string; yearOfStudy: number }) =>
        !mapping.courseId ||
        !Number.isInteger(mapping.yearOfStudy) ||
        mapping.yearOfStudy < 1 ||
        mapping.yearOfStudy > 8
    );

    if (invalidMapping) {
      return NextResponse.json(
        {
          error:
            "Every course mapping must have a valid course and year of study from 1 to 8.",
        },
        { status: 400 }
      );
    }

    const uniqueCourseIds: string[] = [...new Set<string>(mappings.map(
          (mapping: { courseId: string; yearOfStudy: number }) =>
            mapping.courseId
        )
      ),
    ];

    if (uniqueCourseIds.length !== mappings.length) {
      return NextResponse.json(
        {
          error:
            "A course can only be mapped once to a unit.",
        },
        { status: 400 }
      );
    }

    if (uniqueCourseIds.length > 0) {
      const courses = await prisma.course.findMany({
        where: {
          id: {
            in: uniqueCourseIds,
          },
          schoolId: department.schoolId,
        },
        select: {
          id: true,
        },
      });

      if (courses.length !== uniqueCourseIds.length) {
        return NextResponse.json(
          {
            error:
              "One or more selected courses do not belong to this department's school.",
          },
          { status: 400 }
        );
      }
    }

    const unit = await prisma.$transaction(async (tx) => {
      const createdUnit = await tx.unit.create({
        data: {
          departmentId,
          name,
          code,
        },
      });

      if (mappings.length > 0) {
        await tx.courseUnit.createMany({
          data: mappings.map(
            (mapping: { courseId: string; yearOfStudy: number }) => ({
              unitId: createdUnit.id,
              courseId: mapping.courseId,
              yearOfStudy: mapping.yearOfStudy,
            })
          ),
        });
      }

      return tx.unit.findUnique({
        where: {
          id: createdUnit.id,
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
              school: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          courseUnits: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
            orderBy: {
              yearOfStudy: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        unit,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/units error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A unit with that code already exists in this department.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create unit.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id ?? "").trim();
    const departmentId = String(body.departmentId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim().toUpperCase();

    const courseMappings = Array.isArray(body.courseMappings)
      ? body.courseMappings
      : [];

    if (!id || !departmentId || !name || !code) {
      return NextResponse.json(
        {
          error:
            "Unit ID, department, unit name and unit code are required.",
        },
        { status: 400 }
      );
    }

    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
        schoolId: true,
      },
    });

    if (!department) {
      return NextResponse.json(
        {
          error: "Selected department was not found.",
        },
        { status: 404 }
      );
    }

    const mappings = courseMappings.map(
      (mapping: { courseId?: unknown; yearOfStudy?: unknown }) => ({
        courseId: String(mapping.courseId ?? "").trim(),
        yearOfStudy: Number(mapping.yearOfStudy),
      })
    );

    const invalidMapping = mappings.find(
      (mapping: { courseId: string; yearOfStudy: number }) =>
        !mapping.courseId ||
        !Number.isInteger(mapping.yearOfStudy) ||
        mapping.yearOfStudy < 1 ||
        mapping.yearOfStudy > 8
    );

    if (invalidMapping) {
      return NextResponse.json(
        {
          error:
            "Every course mapping must have a valid course and year of study from 1 to 8.",
        },
        { status: 400 }
      );
    }

    const uniqueCourseIds: string[] = [...new Set<string>(mappings.map(
          (mapping: { courseId: string; yearOfStudy: number }) =>
            mapping.courseId
        )
      ),
    ];

    if (uniqueCourseIds.length !== mappings.length) {
      return NextResponse.json(
        {
          error:
            "A course can only be mapped once to a unit.",
        },
        { status: 400 }
      );
    }

    if (uniqueCourseIds.length > 0) {
      const courses = await prisma.course.findMany({
        where: {
          id: {
            in: uniqueCourseIds,
          },
          schoolId: department.schoolId,
        },
        select: {
          id: true,
        },
      });

      if (courses.length !== uniqueCourseIds.length) {
        return NextResponse.json(
          {
            error:
              "One or more selected courses do not belong to this department's school.",
          },
          { status: 400 }
        );
      }
    }

    const unit = await prisma.$transaction(async (tx) => {
      const updatedUnit = await tx.unit.update({
        where: {
          id,
        },
        data: {
          departmentId,
          name,
          code,
        },
      });

      await tx.courseUnit.deleteMany({
        where: {
          unitId: id,
        },
      });

      if (mappings.length > 0) {
        await tx.courseUnit.createMany({
          data: mappings.map(
            (mapping: { courseId: string; yearOfStudy: number }) => ({
              unitId: id,
              courseId: mapping.courseId,
              yearOfStudy: mapping.yearOfStudy,
            })
          ),
        });
      }

      return tx.unit.findUnique({
        where: {
          id: updatedUnit.id,
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
              school: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          courseUnits: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
            orderBy: {
              yearOfStudy: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json({
      unit,
    });
  } catch (error: unknown) {
    console.error("PATCH /api/units error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A unit with that code already exists in this department.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update unit.",
      },
      { status: 500 }
    );
  }
}


