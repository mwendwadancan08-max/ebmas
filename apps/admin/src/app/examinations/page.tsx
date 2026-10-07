"use client";

import { useEffect, useState } from "react";

type School = {
  id: string;
  name: string;
  code: string;
};

type ExaminationSchool = {
  id: string;
  school: School;
};

type Sitting = {
  id: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "ENDED" | "TRANSFERRED";
  endedAt: string | null;
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

type Examination = {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  schools: ExaminationSchool[];
  sittings: Sitting[];
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

function statusLabel(status: Sitting["status"]) {
  return status.replace("_", " ");
}

function statusClass(status: Sitting["status"]) {
  if (status === "SCHEDULED") {
    return "bg-blue-50 text-blue-800 border-blue-200";
  }

  if (status === "IN_PROGRESS") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  if (status === "ENDED") {
    return "bg-slate-100 text-slate-800 border-slate-200";
  }

  return "bg-green-50 text-green-800 border-green-200";
}

function examinationState(exam: Examination) {
  if (!exam.sittings.length) {
    return {
      label: "NO SITTINGS",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (exam.sittings.some((sitting) => sitting.status === "IN_PROGRESS")) {
    return {
      label: "IN PROGRESS",
      className: "bg-amber-50 text-amber-800",
    };
  }

  if (exam.sittings.some((sitting) => sitting.status === "ENDED")) {
    return {
      label: "AWAITING TRANSFER",
      className: "bg-slate-100 text-slate-800",
    };
  }

  if (
    exam.sittings.length > 0 &&
    exam.sittings.every((sitting) => sitting.status === "TRANSFERRED")
  ) {
    return {
      label: "TRANSFERRED",
      className: "bg-green-50 text-green-800",
    };
  }

  return {
    label: "SCHEDULED",
    className: "bg-blue-50 text-blue-800",
  };
}

export default function ExaminationsPage() {
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [expandedExams, setExpandedExams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("Semester 1");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);

      const response = await fetch("/api/examinations");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setExaminations(data.examinations || []);
      setSchools(data.schools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleExam(examId: string) {
    setExpandedExams((current) =>
      current.includes(examId)
        ? current.filter((id) => id !== examId)
        : [...current, examId]
    );
  }

  function reset() {
    setEditingId(null);
    setAcademicYear("");
    setSemester("Semester 1");
    setName("");
    setStartDate("");
    setEndDate("");
    setSelectedSchools([]);
    setMessage("");
    setError("");
  }

  function edit(exam: Examination) {
    setEditingId(exam.id);
    setAcademicYear(exam.academicYear);
    setSemester(exam.semester);
    setName(exam.name);
    setStartDate(exam.startDate.slice(0, 10));
    setEndDate(exam.endDate.slice(0, 10));
    setSelectedSchools(exam.schools.map((item) => item.school.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleSchool(id: string) {
    setSelectedSchools((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function save() {
    setError("");
    setMessage("");

    if (!academicYear || !semester || !startDate || !endDate) {
      setError("Complete all examination details.");
      return;
    }

    if (!selectedSchools.length) {
      setError("Select at least one school.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/examinations", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          academicYear,
          semester,
          name,
          startDate,
          endDate,
          schoolIds: selectedSchools,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setMessage(
        editingId ? "Examination updated." : "Examination created."
      );

      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
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
        <div className="md:hidden bg-[#0b1f3a] text-white px-5 py-4 font-black">
          EBMAS
        </div>

        <section className="ebmas-hero">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
            EBMAS / Examination Management
          </div>

          <h1 className="mt-3 text-4xl md:text-5xl font-black">
            Examinations
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-white/70">
            Manage examination periods, sittings, invigilator activity,
            transfers and completed examination records.
          </p>
        </section>

        <section className="ebmas-content">
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">

            {/* CREATE / EDIT */}
            <div className="ebmas-card p-5 h-fit">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-black">
                  {editingId ? "Edit Examination" : "New Examination"}
                </h2>

                {editingId && (
                  <button
                    onClick={reset}
                    className="text-xs font-bold text-black"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="mt-5 space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Examination name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none"
                />

                <input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="Academic year e.g. 2026/2027"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none"
                />

                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none"
                >
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                  <option>Semester 3</option>
                  <option>Special/Supplementary</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2 py-2.5 text-sm font-semibold"
                  />

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2 py-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <div className="text-sm font-black text-black mb-2">
                    Participating Schools
                  </div>

                  <div className="space-y-1.5">
                    {schools.map((school) => {
                      const selected = selectedSchools.includes(school.id);

                      return (
                        <button
                          key={school.id}
                          onClick={() => toggleSchool(school.id)}
                          className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-bold ${
                            selected
                              ? "border-[#0b1f3a] bg-[#eaf2ff]"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <span className="mr-2">
                            {selected ? "✓" : "○"}
                          </span>
                          {school.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-lg bg-green-50 p-3 text-xs font-bold text-green-700">
                    {message}
                  </div>
                )}

                <button
                  onClick={save}
                  disabled={saving}
                  className="w-full rounded-lg bg-[#0b1f3a] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Examination"
                    : "Create Examination"}
                </button>
              </div>
            </div>

            {/* EXAMINATION LIST */}
            <div className="ebmas-card overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-black">
                      Saved Examinations
                    </h2>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Examination periods and their scheduled sittings
                    </p>
                  </div>

                  <div className="text-xs font-black text-slate-500">
                    {examinations.length} EXAM
                    {examinations.length === 1 ? "" : "S"}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-6 text-sm font-bold text-black">
                  Loading...
                </div>
              ) : examinations.length === 0 ? (
                <div className="p-6 text-sm font-bold text-black">
                  No examinations yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {examinations.map((exam) => {
                    const expanded = expandedExams.includes(exam.id);
                    const state = examinationState(exam);

                    return (
                      <div key={exam.id}>
                        {/* EXAM HEADER */}
                        <div className="p-5">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <button
                              onClick={() => toggleExam(exam.id)}
                              className="flex min-w-0 flex-1 items-start gap-4 text-left"
                            >
                              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0b1f3a] text-sm font-black text-white">
                                {expanded ? "−" : "+"}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-black text-black">
                                    {exam.name}
                                  </h3>

                                  <span
                                    className={`rounded-md px-2 py-1 text-[10px] font-black ${state.className}`}
                                  >
                                    {state.label}
                                  </span>
                                </div>

                                <div className="mt-1 text-sm font-bold text-black">
                                  {exam.academicYear} · {exam.semester}
                                </div>

                                <div className="mt-2 text-xs font-semibold text-slate-500">
                                  {exam.startDate.slice(0, 10)} —{" "}
                                  {exam.endDate.slice(0, 10)}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {exam.schools.map((item) => (
                                    <span
                                      key={item.id}
                                      className="rounded-md bg-[#eaf2ff] px-2.5 py-1 text-xs font-black text-[#0b1f3a]"
                                    >
                                      {item.school.code}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </button>

                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`/examinations/${exam.id}/units`}
                                className="rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-black text-white"
                              >
                                Unit Setup
                              </a>

                              <button
                                onClick={() => edit(exam)}
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-black text-black"
                              >
                                Edit
                              </button>

                              <a
                                href={`/examinations/${exam.id}/sittings`}
                                className="rounded-lg border border-[#0b1f3a] px-4 py-2.5 text-sm font-black text-[#0b1f3a] hover:bg-[#eaf2ff]"
                              >
                                Exam Sittings
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* EXPANDED SITTINGS */}
                        {expanded && (
                          <div className="border-t border-slate-100 bg-slate-50 px-5 py-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="text-sm font-black text-black">
                                  Examination Sittings
                                </div>
                                <div className="mt-1 text-xs font-semibold text-slate-500">
                                  {exam.sittings.length} sitting
                                  {exam.sittings.length === 1 ? "" : "s"}
                                </div>
                              </div>

                              <a
                                href={`/examinations/${exam.id}/sittings`}
                                className="w-fit rounded-lg bg-[#0b1f3a] px-4 py-2 text-xs font-black text-white"
                              >
                                Manage Sittings
                              </a>
                            </div>

                            {exam.sittings.length === 0 ? (
                              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm font-bold text-slate-500">
                                No examination sittings have been created yet.
                              </div>
                            ) : (
                              <div className="mt-4 grid gap-3">
                                {exam.sittings.map((sitting) => (
                                  <a
                                    key={sitting.id}
                                    href={`/examinations/${exam.id}/sittings/${sitting.id}`}
                                    className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#0b1f3a]"
                                  >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-sm font-black text-black">
                                            {sitting.courseUnit.course.code}
                                          </span>

                                          <span className="text-slate-400">
                                            /
                                          </span>

                                          <span className="text-sm font-black text-black">
                                            {sitting.courseUnit.unit.code}
                                          </span>

                                          <span
                                            className={`rounded-md border px-2 py-1 text-[10px] font-black ${statusClass(
                                              sitting.status
                                            )}`}
                                          >
                                            {statusLabel(sitting.status)}
                                          </span>
                                        </div>

                                        <div className="mt-2 text-sm font-bold text-slate-700">
                                          {sitting.courseUnit.course.name}
                                        </div>

                                        <div className="mt-1 text-xs font-semibold text-slate-500">
                                          {sitting.courseUnit.unit.name} · Year{" "}
                                          {sitting.courseUnit.yearOfStudy}
                                        </div>
                                      </div>

                                      <div className="shrink-0 text-left lg:text-right">
                                        <div className="text-sm font-black text-black">
                                          {new Date(
                                            sitting.startTime
                                          ).toLocaleString()}
                                        </div>

                                        <div className="mt-1 text-xs font-semibold text-slate-500">
                                          Ends{" "}
                                          {new Date(
                                            sitting.endTime
                                          ).toLocaleString()}
                                        </div>

                                        <div className="mt-2 text-xs font-black text-[#0b1f3a]">
                                          Open Sitting →
                                        </div>
                                      </div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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