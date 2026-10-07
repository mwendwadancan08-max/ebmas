"use client";

import { use, useEffect, useState } from "react";

type School = {
  id: string;
  name: string;
  code: string;
};

type Examination = {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
  schools: {
    id: string;
    school: School;
  }[];
};

type Course = {
  id: string;
  name: string;
  code: string;
};

type UnitMapping = {
  id: string;
  courseId: string;
  yearOfStudy: number;
  course: Course;
};

type Unit = {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  courseUnits: UnitMapping[];
};

type Department = {
  id: string;
  name: string;
  code: string;
  units: Unit[];
};

type Sitting = {
  id: string;
  startTime: string;
  endTime: string;
  courseUnit: {
    yearOfStudy: number;
    unit: {
      id: string;
      code: string;
      name: string;
    };
    course: {
      id: string;
      code: string;
      name: string;
    };
  };
};

export default function ExamSittingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examinationId } = use(params);

  const [examination, setExamination] = useState<Examination | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sittings, setSittings] = useState<Sitting[]>([]);

  const [schoolId, setSchoolId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadExamination() {
    const response = await fetch("/api/examinations");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load examination");
    }

    const found = data.examinations.find(
      (item: Examination) => item.id === examinationId
    );

    if (!found) {
      throw new Error("Examination not found");
    }

    setExamination(found);
    setSchoolId(found.schools[0]?.school.id || "");
  }

  async function loadStructure(currentSchoolId: string) {
    if (!currentSchoolId) return;

    const response = await fetch(
      `/api/units?schoolId=${encodeURIComponent(currentSchoolId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load academic structure");
    }

    const units: Unit[] = data.units || [];

    const departmentsWithUnits: Department[] = (data.departments || []).map(
      (department: Omit<Department, "units">) => ({
        ...department,
        units: units.filter(
          (unit) => unit.departmentId === department.id
        ),
      })
    );

    setDepartments(departmentsWithUnits);
    setCourses(data.courses || []);
  }

  async function loadSittings() {
    const response = await fetch(
      `/api/examinations/${examinationId}/sittings`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load exam sittings");
    }

    setSittings(data.sittings || []);
  }

  useEffect(() => {
    async function load() {
      try {
        await loadExamination();
        await loadSittings();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load examination"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [examinationId]);

  useEffect(() => {
    if (!schoolId) return;

    loadStructure(schoolId).catch((err) => {
      setError(
        err instanceof Error ? err.message : "Failed to load structure"
      );
    });

    setDepartmentId("");
    setCourseId("");
    setUnitId("");
  }, [schoolId]);

  const selectedDepartment = departments.find(
    (department) => department.id === departmentId
  );

  const availableUnits =
    selectedDepartment?.units.filter((unit) =>
      unit.courseUnits.some(
        (mapping) =>
          mapping.courseId === courseId &&
          mapping.yearOfStudy === Number(yearOfStudy)
      )
    ) || [];

  useEffect(() => {
    if (!departmentId) {
      setCourseId("");
      setUnitId("");
      return;
    }

    const department = departments.find(
      (item) => item.id === departmentId
    );

    if (!department) return;

    const courseIds = new Set(
      department.units.flatMap((unit) =>
        unit.courseUnits.map((mapping) => mapping.courseId)
      )
    );

    const firstCourse = courses.find((course) => courseIds.has(course.id));

    setCourseId(firstCourse?.id || "");
    setUnitId("");
  }, [departmentId, departments, courses]);

  useEffect(() => {
    setUnitId("");
  }, [courseId, yearOfStudy]);

  async function createSitting() {
    setMessage("");
    setError("");

    if (!courseId || !unitId || !startTime || !endTime) {
      setError("Select course, unit, start time and end time.");
      return;
    }

    const selectedUnit = availableUnits.find(
      (unit) => unit.id === unitId
    );

    const mapping = selectedUnit?.courseUnits.find(
      (item) =>
        item.courseId === courseId &&
        item.yearOfStudy === Number(yearOfStudy)
    );

    if (!mapping) {
      setError("Selected unit is not configured for this course and year.");
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/examinations/${examinationId}/sittings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseUnitId: mapping.id,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create sitting");
      }

      setMessage("Exam sitting created.");
      setStartTime("");
      setEndTime("");

      await loadSittings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create sitting"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ebmas-shell">
        <main className="ebmas-main">
          <div className="p-8 font-black text-black">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="ebmas-shell">
      <aside className="ebmas-sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="text-2xl font-black tracking-tight">EBMAS</div>
          <div className="text-xs text-white/60 mt-1">
            Examination Accountability
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {[
            ["Dashboard", "/"],
            ["Schools", "/schools"],
            ["Courses", "/courses"],
            ["Students", "/students"],
            ["Departments", "/departments"],
            ["Examinations", "/examinations"],
            ["Devices", "/devices"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className={`block rounded-lg px-4 py-3 text-sm font-semibold transition ${
                label === "Examinations"
                  ? "bg-white/15 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-5 text-xs text-white/40">
          DBC.tech
        </div>
      </aside>

      <main className="ebmas-main">
        <section className="ebmas-hero">
          <a
            href="/examinations"
            className="text-xs font-black uppercase tracking-[0.14em] text-white/70 hover:text-white"
          >
            ← Examinations
          </a>

          <div className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-white/70">
            Exam Sittings
          </div>

          <h1 className="mt-2 text-4xl font-black">
            {examination?.name}
          </h1>

          <p className="mt-2 text-sm font-bold text-white/70">
            {examination?.academicYear} · {examination?.semester}
          </p>
        </section>

        <section className="ebmas-content">
          <div className="ebmas-card p-5">
            <h2 className="text-xl font-black text-black">
              Create exam sitting
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
              >
                {examination?.schools.map((item) => (
                  <option key={item.school.id} value={item.school.id}>
                    {item.school.code} - {item.school.name}
                  </option>
                ))}
              </select>

              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.code} - {department.name}
                  </option>
                ))}
              </select>

              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>

              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    Year {index + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
              >
                <option value="">Select unit</option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-black text-black">
                  Start time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
                />
              </div>

              <div>
                <label className="text-xs font-black text-black">
                  End time
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
                />
              </div>
            </div>

            <button
              onClick={createSitting}
              disabled={saving}
              className="mt-4 rounded-lg bg-[#0b1f3a] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Exam Sitting"}
            </button>
          </div>

          {(message || error) && (
            <div
              className={`mt-5 rounded-lg p-4 text-sm font-black ${
                error
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {error || message}
            </div>
          )}

          <div className="ebmas-card mt-5 overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-xl font-black text-black">
                Created exam sittings
              </h2>
            </div>

            {sittings.length === 0 ? (
              <div className="p-5 text-sm font-bold text-black">
                No exam sittings created yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sittings.map((sitting) => (
                  <div
                    key={sitting.id}
                    className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-black text-black">
                        {sitting.courseUnit.unit.code} ·{" "}
                        {sitting.courseUnit.unit.name}
                      </div>

                      <div className="mt-1 text-sm font-bold text-black">
                        {sitting.courseUnit.course.code} · Year{" "}
                        {sitting.courseUnit.yearOfStudy}
                      </div>

                      <div className="mt-1 text-xs font-bold text-black">
                        {new Date(sitting.startTime).toLocaleString()} →{" "}
                        {new Date(sitting.endTime).toLocaleString()}
                      </div>
                    </div>

                    <a
                      href={`/examinations/${examinationId}/sittings/${sitting.id}`}
                      className="rounded-lg border border-[#0b1f3a] px-4 py-2 text-xs font-black text-[#0b1f3a]"
                    >
                      Manage Sitting
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-between">
            <a
              href={`/examinations/${examinationId}/units`}
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-black text-black"
            >
              ← Unit Setup
            </a>

            <a
              href="/examinations"
              className="rounded-lg bg-[#0b1f3a] px-5 py-3 text-sm font-black text-white"
            >
              Done
            </a>
          </div>
        </section>

        <footer className="ebmas-footer">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-black text-[#0b1f3a]">EBMAS</div>
              <div className="text-sm font-bold">
                Examination Booklet Management & Accountability System
              </div>
            </div>

            <div className="text-sm font-bold">
              dbc.techfirm@gmail.com
            </div>
          </div>

          <div className="mt-3 text-xs font-bold text-slate-400">
            Developed by DBC.tech
          </div>
        </footer>
      </main>
    </div>
  );
}