import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "db";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    const devices = await prisma.device.findMany({
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
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      devices,
    });
  } catch (error) {
    console.error("GET /api/devices error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load devices.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const deviceKey = String(body.deviceKey ?? "").trim();
    const schoolId = String(body.schoolId ?? "").trim();
    const departmentId = String(body.departmentId ?? "").trim();

    if (!name || !deviceKey || !schoolId || !departmentId) {
      return NextResponse.json(
        {
          error:
            "Device name, device key, school and department are required.",
        },
        { status: 400 }
      );
    }

    const [school, department] = await Promise.all([
      prisma.school.findUnique({
        where: {
          id: schoolId,
        },
      }),
      prisma.department.findUnique({
        where: {
          id: departmentId,
        },
      }),
    ]);

    if (!school) {
      return NextResponse.json(
        {
          error: "Selected school was not found.",
        },
        { status: 404 }
      );
    }

    if (!department) {
      return NextResponse.json(
        {
          error: "Selected department was not found.",
        },
        { status: 404 }
      );
    }

    if (department.schoolId !== schoolId) {
      return NextResponse.json(
        {
          error:
            "The selected department does not belong to the selected school.",
        },
        { status: 400 }
      );
    }

    const existingDevice = await prisma.device.findUnique({
      where: {
        deviceKey,
      },
    });

    if (existingDevice) {
      return NextResponse.json(
        {
          error: "This device key is already registered.",
        },
        { status: 409 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    const device = await prisma.device.create({
      data: {
        name,
        deviceKey,
        tokenHash,
        schoolId,
        departmentId,
      },
      include: {
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

    return NextResponse.json(
      {
        device,
        token,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/devices error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "This device key is already registered.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to register device.",
      },
      { status: 500 }
    );
  }
}
