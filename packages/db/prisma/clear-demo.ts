import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing EBMAS demo data...");

  await prisma.bookletEntry.deleteMany();
  await prisma.syncBatch.deleteMany();
  await prisma.sittingInvigilator.deleteMany();
  await prisma.examSitting.deleteMany();
  await prisma.courseUnit.deleteMany();
  await prisma.examPeriod.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.device.deleteMany();
  await prisma.student.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  console.log("EBMAS demo data cleared.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
