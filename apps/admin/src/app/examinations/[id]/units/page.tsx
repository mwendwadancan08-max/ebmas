"use client";

import { use, useEffect, useMemo, useState } from "react";

type CourseMapping = {
  id: string;
  courseId: string;
  yearOfStudy: number;
  course: {
    id: string;
    name: string;
    code: string;
  };
};

type Unit = {
  id: string;
  name: string;
  code: string;
  courseUnits: CourseMapping[];
};

type Course = {
  id: string;
  name: string;
  code: string;
};

type Department = {
  id: string;
  name: string;
  code: string;
  units: Unit[];
};

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

const navigation = [
  ["Dashboard", "/"],
  ["Schools", "/schools"],
  ["Courses", "/courses"],
  ["Students", "/students"],
  ["Departments", "/departments"],
  ["Units", "/units"],
  ["Examinations", "/examinations"],
  ["Devices", "/devices"],
];

export default function UnitSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examinationId } = use(params);

  const [examination, setExamination] =
    useState<Examination | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [schoolId, setSchoolId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1");

  const [unitName, setUnitName] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [bulkUnits, setBulkUnits] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedSchool = examination?.schools.find(
    (item) => item.school.id === schoolId
  );

  const selectedDepartment = departments.find(
    (item) => item.id === departmentId
  );

  const availableUnits = useMemo(() => {
    return units.filter((unit) =>
      unit.courseUnits.some(
        (mapping) =>
          mapping.courseId === courseId &&
          mapping.yearOfStudy === Number(yearOfStudy)
      )
    );
  }, [units, courseId, yearOfStudy]);

  async function loadExamination() {
    const response = await fetch("/api/examinations");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load examination.");
    }

    const found = data.examinations.find(
      (item: Examination) => item.id === examinationId
    );

    if (!found) {
      throw new Error("Examination not found.");
    }

    setExamination(found);

    if (found.schools.length > 0) {
      setSchoolId(found.schools[0].school.id);
    }
  }

  async function loadStructure(nextSchoolId: string) {
    if (!nextSchoolId) return;

    const response = await fetch(
      `/api/units?schoolId=${encodeURIComponent(nextSchoolId)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load academic structure.");
    }

    setDepartments(data.departments || []);
    setCourses(data.courses || []);
    setUnits(data.units || []);
  }

  useEffect(() => {
    async function start() {
      try {
        setLoading(true);
        await loadExamination();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load."
        );
      } finally {
        setLoading(false);
      }
    }

    start();
  }, [examinationId]);

  useEffect(() => {
    if (!schoolId) return;

    async function load() {
      try {
        setError("");
        await loadStructure(schoolId);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load structure."
        );
      }
    }

    load();
  }, [schoolId]);

  useEffect(() => {
    setDepartmentId("");
    setCourseId("");
  }, [schoolId]);

  useEffect(() => {
    setCourseId("");
  }, [departmentId]);

  async function saveNewUnit() {
    setError("");
    setMessage("");

    if (!departmentId || !courseId || !unitName || !unitCode) {
      setError("Select department, course and enter unit details.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          departmentId,
          name: unitName.trim(),
          code: unitCode.trim().toUpperCase(),
          courseMappings: [
            {
              courseId,
              yearOfStudy: Number(yearOfStudy),
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save unit.");
      }

      setUnitName("");
      setUnitCode("");
      setMessage("Unit saved and linked to the course.");

      await loadStructure(schoolId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save unit."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveBulkUnits() {
    setError("");
    setMessage("");

    if (!departmentId || !courseId) {
      setError("Select department and course first.");
      return;
    }

    const rows = bulkUnits
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean);

    if (!rows.length) {
      setError("Enter at least one unit.");
      return;
    }

    const parsed = rows.map((row) => {
      const parts = row.split("|");

      return {
        code: (parts[0] || "").trim().toUpperCase(),
        name: (parts[1] || "").trim(),
      };
    });

    if (parsed.some((unit) => !unit.code || !unit.name)) {
      setError("Use the format: CODE | Unit Name");
      return;
    }

    try {
      setSaving(true);

      for (const unit of parsed) {
        const response = await fetch("/api/units", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            departmentId,
            name: unit.name,
            code: unit.code,
            courseMappings: [
              {
                courseId,
                yearOfStudy: Number(yearOfStudy),
              },
            ],
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Failed to save ${unit.code}.`
          );
        }
      }

      setBulkUnits("");
      setMessage(`${parsed.length} unit(s) saved successfully.`);

      await loadStructure(schoolId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bulk save failed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function linkExistingUnit(unit: Unit) {
    if (!courseId || !departmentId) return;

    const alreadyLinked = unit.courseUnits.some(
      (mapping) =>
        mapping.courseId === courseId &&
        mapping.yearOfStudy === Number(yearOfStudy)
    );

    if (alreadyLinked) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const mappings = unit.courseUnits.map((mapping) => ({
        courseId: mapping.courseId,
        yearOfStudy: mapping.yearOfStudy,
      }));

      mappings.push({
        courseId,
        yearOfStudy: Number(yearOfStudy),
      });

      const response = await fetch("/api/units", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unitId: unit.id,
          departmentId,
          name: unit.name,
          code: unit.code,
          courseMappings: mappings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to link unit.");
      }

      setMessage(`${unit.code} linked to the selected course.`);

      await loadStructure(schoolId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to link unit."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ebmas-shell">
        <main className="ebmas-main p-10">
          <div className="font-black text-black">
            Loading Unit Setup...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ebmas-shell">
      <aside className="ebmas-sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="text-2xl font-black">EBMAS</div>
          <div className="text-xs text-white/60 mt-1">
            Examination Accountability
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className={`block rounded-lg px-4 py-3 text-sm font-bold ${
                label === "Examinations"
                  ? "bg-white/15 text-white"
                  : "text-white/75 hover:bg-white/10"
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
            className="text-xs font-black text-white/70"
          >
            ← Examinations
          </a>

          <div className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-white/70">
            Unit Setup
          </div>

          <h1 className="mt-2 text-4xl font-black">
            {examination?.name}
          </h1>

          <p className="mt-2 text-sm font-bold text-white/70">
            {examination?.academicYear} · {examination?.semester}
          </p>
        </section>

        <section className="ebmas-content">
          <div className="mb-5 grid gap-3 md:grid-cols-4">
            <div className="ebmas-card p-4">
              <div className="text-xs font-black uppercase">
                1. School
              </div>
              <div className="mt-1 font-black">
                {selectedSchool?.school.code || "—"}
              </div>
            </div>

            <div className="ebmas-card p-4">
              <div className="text-xs font-black uppercase">
                2. Department
              </div>
              <div className="mt-1 font-black">
                {selectedDepartment?.code || "—"}
              </div>
            </div>

            <div className="ebmas-card p-4">
              <div className="text-xs font-black uppercase">
                3. Course
              </div>
              <div className="mt-1 font-black">
                {courses.find((c) => c.id === courseId)?.code || "—"}
              </div>
            </div>

            <div className="ebmas-card p-4">
              <div className="text-xs font-black uppercase">
                4. Year
              </div>
              <div className="mt-1 font-black">
                Year {yearOfStudy}
              </div>
            </div>
          </div>

          <div className="ebmas-card p-5">
            <h2 className="text-xl font-black text-black">
              Select academic structure
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
              >
                {examination?.schools.map((item) => (
                  <option key={item.school.id} value={item.school.id}>
                    {item.school.code} — {item.school.name}
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
                    {department.code} — {department.name}
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
                    {course.code} — {course.name}
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
          </div>

          {courseId && (
            <>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="ebmas-card p-5">
                  <h2 className="text-xl font-black text-black">
                    Add single unit
                  </h2>

                  <div className="mt-4 space-y-3">
                    <input
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value)}
                      placeholder="Unit code e.g. BIO 201"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
                    />

                    <input
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      placeholder="Unit name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black"
                    />

                    <button
                      onClick={saveNewUnit}
                      disabled={saving}
                      className="w-full rounded-lg bg-[#0b1f3a] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Unit"}
                    </button>
                  </div>
                </div>

                <div className="ebmas-card p-5">
                  <h2 className="text-xl font-black text-black">
                    Add multiple units
                  </h2>

                  <p className="mt-1 text-xs font-bold text-black">
                    One unit per line: CODE | Unit Name
                  </p>

                  <textarea
                    value={bulkUnits}
                    onChange={(e) => setBulkUnits(e.target.value)}
                    placeholder={`BIO 201 | Ecology
BIO 202 | Evolution
BIO 203 | Genetics`}
                    rows={6}
                    className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-black outline-none"
                  />

                  <button
                    onClick={saveBulkUnits}
                    disabled={saving}
                    className="mt-3 w-full rounded-lg bg-[#0b1f3a] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save All Units"}
                  </button>
                </div>
              </div>

              <div className="ebmas-card mt-5 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h2 className="text-xl font-black text-black">
                    Units for {courses.find((c) => c.id === courseId)?.code}
                    {" "}· Year {yearOfStudy}
                  </h2>
                </div>

                {availableUnits.length === 0 ? (
                  <div className="p-5 text-sm font-bold text-black">
                    No units linked to this course and year yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {availableUnits.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between gap-4 p-4"
                      >
                        <div>
                          <div className="font-black text-black">
                            {unit.code}
                          </div>
                          <div className="text-sm font-bold text-black">
                            {unit.name}
                          </div>
                        </div>

                        <div className="text-xs font-black">
                          LINKED
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-5 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black">
                    Existing units from this department
                  </h3>

                  <div className="mt-3 space-y-2">
                    {units
                      .filter(
                        (unit) =>
                          !unit.courseUnits.some(
                            (mapping) =>
                              mapping.courseId === courseId &&
                              mapping.yearOfStudy ===
                                Number(yearOfStudy)
                          )
                      )
                      .map((unit) => (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3"
                        >
                          <div>
                            <div className="font-black text-black">
                              {unit.code}
                            </div>
                            <div className="text-xs font-bold text-black">
                              {unit.name}
                            </div>
                          </div>

                          <button
                            onClick={() => linkExistingUnit(unit)}
                            disabled={saving}
                            className="rounded-lg border border-[#0b1f3a] px-3 py-2 text-xs font-black text-[#0b1f3a]"
                          >
                            Link
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}

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

          <div className="mt-5 flex justify-end">
            <a
              href={`/examinations/${examinationId}/sittings`}
              className="rounded-lg bg-[#0b1f3a] px-5 py-3 text-sm font-black text-white"
            >
              Continue to Exam Sittings →
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
