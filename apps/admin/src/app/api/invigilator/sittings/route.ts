import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return response({}, 200);
}

export async function GET(request: NextRequest) {
  try {
    const deviceKey = request.nextUrl.searchParams.get("deviceKey");

    if (!deviceKey) {
      return response(
        { error: "Device key is required." },
        400
      );
    }

    const device = await prisma.device.findUnique({
      where: {
        deviceKey,
      },
      select: {
        id: true,
        deviceKey: true,
        name: true,
        active: true,
        schoolId: true,
        departmentId: true,
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!device) {
      return response(
        { error: "Device is not registered." },
        403
      );
    }

    if (!device.active) {
      return response(
        { error: "Device is inactive." },
        403
      );
    }

    if (!device.schoolId || !device.departmentId) {
      return response(
        {
          error:
            "Device is registered but has no school and department scope.",
        },
        403
      );
    }

    const sittings = await prisma.examSitting.findMany({
      where: {
        status: "SCHEDULED",
        courseUnit: {
          course: {
            schoolId: device.schoolId,
          },
          unit: {
            departmentId: device.departmentId,
          },
        },
      },

      orderBy: {
        startTime: "asc",
      },

      select: {
        id: true,
        examPeriodId: true,
        courseUnitId: true,
        startTime: true,
        endTime: true,
        status: true,

        examPeriod: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            semester: true,
            startDate: true,
            endDate: true,
          },
        },

        courseUnit: {
          select: {
            yearOfStudy: true,

            course: {
              select: {
                id: true,
                code: true,
                name: true,
                schoolId: true,

                students: {
                  orderBy: [
                    { lastName: "asc" },
                    { firstName: "asc" },
                  ],

                  select: {
                    id: true,
                    regNumber: true,
                    firstName: true,
                    lastName: true,
                    admissionYear: true,
                  },
                },
              },
            },

            unit: {
              select: {
                id: true,
                code: true,
                name: true,
                departmentId: true,
              },
            },
          },
        },
      },
    });

    await prisma.device.update({
      where: {
        id: device.id,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });

    return response({
      device: {
        id: device.id,
        name: device.name,
        deviceKey: device.deviceKey,
        schoolId: device.schoolId,
        schoolName: device.school?.name ?? "",
        departmentId: device.departmentId,
        departmentName: device.department?.name ?? "",
      },

      sittings,
    });
  } catch (error) {
    console.error("Invigilator sittings error:", error);

    return response(
      { error: "Unable to load assigned examinations." },
      500
    );
  }
}