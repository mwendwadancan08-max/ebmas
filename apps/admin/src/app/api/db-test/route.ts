import { prisma } from "db";
import { NextResponse } from "next/server";

export async function GET() {
  const schools = await prisma.school.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({
    connected: true,
    count: schools.length,
    schools,
  });
}
