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
  console.log("Seeding EBMAS presentation data...");

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

  const school1 = await prisma.school.create({
    data: {
      name: "School of Computing and Informatics",
      code: "SCI",
    },
  });

  const school2 = await prisma.school.create({
    data: {
      name: "School of Engineering",
      code: "SOE",
    },
  });

  const course1 = await prisma.course.create({
    data: {
      schoolId: school1.id,
      name: "Bachelor of Science in Computer Science",
      code: "BSCS",
    },
  });

  const course2 = await prisma.course.create({
    data: {
      schoolId: school1.id,
      name: "Bachelor of Science in Information Technology",
      code: "BSIT",
    },
  });

  const course3 = await prisma.course.create({
    data: {
      schoolId: school2.id,
      name: "Bachelor of Science in Civil Engineering",
      code: "BSCE",
    },
  });

  const course4 = await prisma.course.create({
    data: {
      schoolId: school2.id,
      name: "Bachelor of Science in Electrical Engineering",
      code: "BSEE",
    },
  });

  const unit1 = await prisma.unit.create({
    data: {
      schoolId: school1.id,
      name: "Data Structures and Algorithms",
      code: "CSC 201",
    },
  });

  const unit2 = await prisma.unit.create({
    data: {
      schoolId: school1.id,
      name: "Database Management Systems",
      code: "CSC 202",
    },
  });

  const unit3 = await prisma.unit.create({
    data: {
      schoolId: school1.id,
      name: "Web Application Development",
      code: "IT 301",
    },
  });

  const unit4 = await prisma.unit.create({
    data: {
      schoolId: school1.id,
      name: "Computer Networks",
      code: "IT 302",
    },
  });

  const unit5 = await prisma.unit.create({
    data: {
      schoolId: school2.id,
      name: "Structural Analysis",
      code: "CIV 301",
    },
  });

  const unit6 = await prisma.unit.create({
    data: {
      schoolId: school2.id,
      name: "Engineering Mathematics",
      code: "MAT 301",
    },
  });

  const unit7 = await prisma.unit.create({
    data: {
      schoolId: school2.id,
      name: "Digital Electronics",
      code: "EEE 201",
    },
  });

  const unit8 = await prisma.unit.create({
    data: {
      schoolId: school2.id,
      name: "Electrical Machines",
      code: "EEE 302",
    },
  });

  const courseUnits = [
    [unit1.id, course1.id],
    [unit2.id, course1.id],
    [unit3.id, course2.id],
    [unit4.id, course2.id],
    [unit5.id, course3.id],
    [unit6.id, course3.id],
    [unit7.id, course4.id],
    [unit8.id, course4.id],
  ];

  for (const [unitId, courseId] of courseUnits) {
    await prisma.courseUnit.create({
      data: { unitId, courseId },
    });
  }

  const students = [
    ["SCI", course1.id, "SCI/CS/001/2024", "Brian", "Otieno"],
    ["SCI", course1.id, "SCI/CS/002/2024", "Mercy", "Wanjiku"],
    ["SCI", course1.id, "SCI/CS/003/2024", "Kevin", "Mwangi"],
    ["SCI", course1.id, "SCI/CS/004/2024", "Faith", "Achieng"],
    ["SCI", course2.id, "SCI/IT/001/2024", "Daniel", "Kiptoo"],
    ["SCI", course2.id, "SCI/IT/002/2024", "Sheila", "Njeri"],
    ["SCI", course2.id, "SCI/IT/003/2024", "Mark", "Kamau"],
    ["SCI", course2.id, "SCI/IT/004/2024", "Lucy", "Atieno"],
    ["SOE", course3.id, "SOE/CE/001/2024", "John", "Maina"],
    ["SOE", course3.id, "SOE/CE/002/2024", "Ann", "Wambui"],
    ["SOE", course3.id, "SOE/CE/003/2024", "Peter", "Omondi"],
    ["SOE", course3.id, "SOE/CE/004/2024", "Irene", "Chebet"],
    ["SOE", course4.id, "SOE/EE/001/2024", "Alex", "Mutua"],
    ["SOE", course4.id, "SOE/EE/002/2024", "Nancy", "Akinyi"],
    ["SOE", course4.id, "SOE/EE/003/2024", "Samuel", "Kipkorir"],
    ["SOE", course4.id, "SOE/EE/004/2024", "Janet", "Moraa"],
  ];

  for (const [, courseId, regNumber, firstName, lastName] of students) {
    const schoolId = courseId === course1.id || courseId === course2.id
      ? school1.id
      : school2.id;

    await prisma.student.create({
      data: {
        schoolId,
        courseId,
        regNumber,
        firstName,
        lastName,
      },
    });
  }

  const admin = await prisma.user.create({
    data: {
      email: "admin@ebmas.demo",
      password: "demo-password",
      firstName: "EBMAS",
      lastName: "Administrator",
      role: "ADMIN",
    },
  });

  const invigilator1 = await prisma.user.create({
    data: {
      email: "invigilator1@ebmas.demo",
      password: "demo-password",
      firstName: "James",
      lastName: "Ochieng",
      role: "INVIGILATOR",
      schoolId: school1.id,
    },
  });

  const invigilator2 = await prisma.user.create({
    data: {
      email: "invigilator2@ebmas.demo",
      password: "demo-password",
      firstName: "Grace",
      lastName: "Wambui",
      role: "INVIGILATOR",
      schoolId: school2.id,
    },
  });

  const examPeriod = await prisma.examPeriod.create({
    data: {
      name: "2026/2027 First Semester Examinations",
      startDate: new Date("2026-10-05T00:00:00"),
      endDate: new Date("2026-10-23T23:59:59"),
    },
  });

  const courseUnitRecords = await prisma.courseUnit.findMany({
    include: {
      course: true,
      unit: true,
    },
  });

  for (const [index, courseUnit] of courseUnitRecords.entries()) {
    const sitting = await prisma.examSitting.create({
      data: {
        examPeriodId: examPeriod.id,
        courseUnitId: courseUnit.id,
        startTime: new Date(`2026-10-${10 + index}T09:00:00`),
        endTime: new Date(`2026-10-${10 + index}T12:00:00`),
      },
    });

    const invigilator =
      courseUnit.course.schoolId === school1.id
        ? invigilator1
        : invigilator2;

    await prisma.sittingInvigilator.create({
      data: {
        sittingId: sitting.id,
        userId: invigilator.id,
      },
    });

    const roster = await prisma.student.findMany({
      where: {
        courseId: courseUnit.courseId,
      },
      orderBy: {
        regNumber: "asc",
      },
      take: 4,
    });

    for (const [studentIndex, student] of roster.entries()) {
      await prisma.bookletEntry.create({
        data: {
          sittingId: sitting.id,
          studentId: student.id,
          bookletCode: `EB-${String(index + 1).padStart(2, "0")}-${String(studentIndex + 1).padStart(3, "0")}`,
          present: true,
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED_PRESENTATION_DATA",
      entity: "SYSTEM",
      metadata: {
        schools: 2,
        courses: 4,
        units: 8,
        students: students.length,
        examPeriod: examPeriod.name,
      },
    },
  });

  console.log("EBMAS presentation data seeded successfully.");
  console.log("Schools: 2");
  console.log("Courses: 4");
  console.log("Units: 8");
  console.log(`Students: ${students.length}`);
  console.log(`Exam sittings: ${courseUnitRecords.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
