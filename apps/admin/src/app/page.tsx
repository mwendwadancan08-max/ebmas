"use client";

import { useEffect, useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Schools", href: "/schools" },
  { label: "Courses", href: "/courses" },
  { label: "Students", href: "/students" },
  { label: "Departments", href: "/departments" },
  { label: "Examinations", href: "/examinations" },
  { label: "Archive", href: "/archive" },
];

type School = {
  id: string;
  name: string;
  code: string;
  _count?: {
    courses: number;
    students: number;
    departments: number;
  };
};

type Course = {
  id: string;
  name: string;
  code: string;
};

export default function DashboardPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [schoolsResponse, coursesResponse] = await Promise.all([
          fetch("/api/schools", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
        ]);

        const schoolsData = await schoolsResponse.json();
        const coursesData = await coursesResponse.json();

        setSchools(schoolsData.schools ?? []);
        setCourses(coursesData.courses ?? []);
      } catch (error) {
        console.error("Failed to load dashboard statistics:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const totalStudents = schools.reduce(
    (total, school) => total + (school._count?.students ?? 0),
    0
  );

  const totalDepartments = schools.reduce(
    (total, school) => total + (school._count?.departments ?? 0),
    0
  );

  const totalCourses = courses.length;

  return (
    <div className="ebmas-shell">
      {/* Sidebar */}
      <aside className="ebmas-sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="text-xl font-bold tracking-wide">EBMAS</div>
          <div className="text-xs text-white/60 mt-1">
            Examination Accountability
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`block px-4 py-3 rounded-lg transition ${
                item.label === "Dashboard"
                  ? "bg-white/10 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-5 text-xs text-white/40">
          DBC.tech
        </div>
      </aside>

      {/* Main */}
      <main className="ebmas-main">
        {/* Hero */}
        <section className="ebmas-hero">
          <div className="relative z-10">
            <div className="inline-flex px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sm mb-5">
              Examination Booklet Management & Accountability System
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              EBMAS
            </h1>

            <p className="mt-4 text-lg md:text-xl text-white/80 max-w-3xl">
              Centralized examination booklet accountability from student
              registration to final archive.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/schools"
                className="px-5 py-3 rounded-lg bg-white text-[#0b1f3a] font-semibold hover:bg-slate-100"
              >
                Manage Schools
              </a>

              <a
                href="/courses"
                className="px-5 py-3 rounded-lg border border-white/30 text-white font-semibold hover:bg-white/10"
              >
                Manage Courses
              </a>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="ebmas-content">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0b1f3a]">
              System Overview
            </h2>
            <p className="text-slate-500 mt-1">
              Live statistics from the EBMAS database.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <div className="ebmas-card p-6">
              <div className="text-sm text-slate-500">Schools</div>
              <div className="text-4xl font-bold text-[#0b1f3a] mt-2">
                {loading ? "..." : schools.length}
              </div>
              <div className="text-sm text-slate-400 mt-2">
                Registered schools
              </div>
            </div>

            <div className="ebmas-card p-6">
              <div className="text-sm text-slate-500">Courses</div>
              <div className="text-4xl font-bold text-[#155eef] mt-2">
                {loading ? "..." : totalCourses}
              </div>
              <div className="text-sm text-slate-400 mt-2">
                Registered courses
              </div>
            </div>

            <div className="ebmas-card p-6">
              <div className="text-sm text-slate-500">Students</div>
              <div className="text-4xl font-bold text-[#16803c] mt-2">
                {loading ? "..." : totalStudents}
              </div>
              <div className="text-sm text-slate-400 mt-2">
                Students across schools
              </div>
            </div>

            <div className="ebmas-card p-6">
              <div className="text-sm text-slate-500">Departments</div>
              <div className="text-4xl font-bold text-[#b7791f] mt-2">
                {loading ? "..." : totalDepartments}
              </div>
              <div className="text-sm text-slate-400 mt-2">
                Registered departments
              </div>
            </div>
          </div>

          {/* Workflow */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0b1f3a]">
              Examination Workflow
            </h2>
            <p className="text-slate-500 mt-1">
              Follow the system workflow from setup to archive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="ebmas-card p-6">
              <div className="text-sm font-semibold text-[#155eef]">
                01
              </div>
              <h3 className="text-lg font-bold mt-2">
                University Structure
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Configure schools, courses, students, departments and units.
              </p>
            </div>

            <div className="ebmas-card p-6">
              <div className="text-sm font-semibold text-[#155eef]">
                02
              </div>
              <h3 className="text-lg font-bold mt-2">
                Examination Setup
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Create examination periods and sittings and assign
                invigilators.
              </p>
            </div>

            <div className="ebmas-card p-6">
              <div className="text-sm font-semibold text-[#155eef]">
                03
              </div>
              <h3 className="text-lg font-bold mt-2">
                Offline Recording
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Download sittings to the invigilator device and record
                booklet accountability offline.
              </p>
            </div>

            <div className="ebmas-card p-6">
              <div className="text-sm font-semibold text-[#155eef]">
                04
              </div>
              <h3 className="text-lg font-bold mt-2">
                Archive
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Completed examination records become available for historical
                accountability and lookup.
              </p>
            </div>
          </div>

          {/* Database status */}
          <div className="ebmas-card mt-8 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#0b1f3a]">
                  Database Status
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Dashboard statistics are loaded directly from the EBMAS
                  database.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-[#16803c]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16803c]" />
                Connected
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="ebmas-footer">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="font-semibold text-[#0b1f3a]">
                EBMAS
              </div>
              <div className="text-sm">
                Examination Booklet Management & Accountability System
              </div>
            </div>

            <div className="text-sm">
              DBC.tech · dbc.techfirm@gmail.com
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
