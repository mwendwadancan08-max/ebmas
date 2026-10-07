import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const examination = await prisma.examPeriod.findUnique({
      where: { id },
    });

    if (!examination) {
      return NextResponse.json(
        { error: "Examination not found" },
        { status: 404 }
      );
    }

    const sittings = await prisma.examSitting.findMany({
      where: { examPeriodId: id },
      select: {
        id: true,
        examPeriodId: true,
        courseUnitId: true,
        startTime: true,
        endTime: true,
        status: true,
        endedAt: true,
        createdAt: true,
        updatedAt: true,
        courseUnit: {
          include: {
            course: true,
            unit: true,
          },
        },
        invigilators: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json({ sittings });
  } catch (error) {
    console.error("GET exam sittings error:", error);

    return NextResponse.json(
      { error: "Failed to load exam sittings" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { courseUnitId, startTime, endTime } = body;

    if (!courseUnitId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "courseUnitId, startTime and endTime are required" },
        { status: 400 }
      );
    }

    const examination = await prisma.examPeriod.findUnique({
      where: { id },
      include: {
        schools: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (!examination) {
      return NextResponse.json(
        { error: "Examination not found" },
        { status: 404 }
      );
    }

    const courseUnit = await prisma.courseUnit.findUnique({
      where: { id: courseUnitId },
      include: {
        course: true,
        unit: true,
      },
    });

    if (!courseUnit) {
      return NextResponse.json(
        { error: "Course unit not found" },
        { status: 404 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid start or end time" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    if (start < examination.startDate || end > examination.endDate) {
      return NextResponse.json(
        { error: "Exam sitting must fall within the examination period" },
        { status: 400 }
      );
    }

    const participatingSchoolIds: string[] =
      examination.schools.map(
        (school: { schoolId: string }) => school.schoolId
      );

    if (!participatingSchoolIds.includes(courseUnit.course.schoolId)) {
      return NextResponse.json(
        {
          error:
            "The course belongs to a school that is not participating in this examination",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.examSitting.findUnique({
      where: {
        examPeriodId_courseUnitId: {
          examPeriodId: id,
          courseUnitId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "An exam sitting already exists for this course and unit in this examination",
        },
        { status: 409 }
      );
    }

    const sitting = await prisma.examSitting.create({
      data: {
        examPeriodId: id,
        courseUnitId,
        startTime: start,
        endTime: end,
      },
      include: {
        courseUnit: {
          include: {
            course: true,
            unit: true,
          },
        },
        invigilators: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({ sitting }, { status: 201 });
  } catch (error) {
    console.error("POST exam sitting error:", error);

    return NextResponse.json(
      { error: "Failed to create exam sitting" },
      { status: 500 }
    );
  }
}