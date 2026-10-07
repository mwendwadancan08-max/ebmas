"use client";

import { FormEvent, useEffect, useState } from "react";

type School = {
  id: string;
  name: string;
  code: string;
};

type Course = {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  school: School;
  _count: {
    students: number;
    courseUnits: number;
  };
};

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Schools", href: "/schools" },
  { label: "Courses", href: "/courses" },
  { label: "Students", href: "#" },
  { label: "Departments", href: "#" },
  { label: "Examinations", href: "#" },
  { label: "Archive", href: "#" },
];

export default function CoursesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [expandedSchools, setExpandedSchools] = useState<
    Record<string, boolean>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/courses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load courses.");
      }

      setSchools(data.schools ?? []);
      setCourses(data.courses ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load courses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const toggleSchool = (schoolId: string) => {
    setExpandedSchools((previous) => ({
      ...previous,
      [schoolId]: !previous[schoolId],
    }));
  };

  const expandAll = () => {
    const state: Record<string, boolean> = {};

    schools.forEach((school) => {
      state[school.id] = true;
    });

    setExpandedSchools(state);
  };

  const collapseAll = () => {
    const state: Record<string, boolean> = {};

    schools.forEach((school) => {
      state[school.id] = false;
    });

    setExpandedSchools(state);
  };

  const getSchoolCourses = (schoolId: string) => {
    return courses.filter((course) => course.schoolId === schoolId);
  };

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setEditingId(null);
    setCourseName("");
    setCourseCode("");
    setError("");
    setSuccess("");

    if (schoolId) {
      setExpandedSchools((previous) => ({
        ...previous,
        [schoolId]: true,
      }));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setCourseName("");
    setCourseCode("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedSchoolId) {
      setError("Select a school first.");
      return;
    }

    if (!courseName.trim() || !courseCode.trim()) {
      setError("Course name and course code are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/courses", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          schoolId: selectedSchoolId,
          name: courseName.trim(),
          code: courseCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save course.");
      }

      setSuccess(
        editingId
          ? "Course updated successfully."
          : "Course saved successfully."
      );

      resetForm();

      setExpandedSchools((previous) => ({
        ...previous,
        [selectedSchoolId]: true,
      }));

      await loadCourses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save course."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (course: Course) => {
    setEditingId(course.id);
    setSelectedSchoolId(course.schoolId);
    setCourseName(course.name);
    setCourseCode(course.code);

    setExpandedSchools((previous) => ({
      ...previous,
      [course.schoolId]: true,
    }));

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 350,
      behavior: "smooth",
    });
  };

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
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`block rounded-lg px-4 py-3 text-sm font-semibold transition ${
                item.label === "Courses"
                  ? "bg-white/15 text-white"
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

      <main className="ebmas-main">
        <div className="md:hidden bg-[#0b1f3a] text-white px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-black text-xl">EBMAS</div>

            <div className="text-xs text-white/60">
              Examination Accountability
            </div>
          </div>

          <details className="relative">
            <summary className="list-none cursor-pointer rounded-lg border border-white/20 px-3 py-2 font-bold">
              Menu
            </summary>

            <div className="absolute right-0 top-12 z-50 w-56 rounded-xl bg-white p-2 shadow-xl border border-slate-200">
              {navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`block rounded-lg px-4 py-3 text-sm font-semibold ${
                    item.label === "Courses"
                      ? "bg-slate-100 text-[#0b1f3a]"
                      : "text-slate-700"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </details>
        </div>

        <section className="ebmas-hero">
          <div className="relative z-10 max-w-5xl">
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
              EBMAS / Academic Structure
            </div>

            <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
              Courses
            </h1>

            <p className="mt-5 max-w-3xl text-lg md:text-xl text-white/80 leading-relaxed">
              Manage academic courses within their respective schools.
              Each school contains its own academic course structure.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm">
                {schools.length} schools
              </div>

              <div className="rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm">
                {courses.length} courses
              </div>

              {selectedSchoolId && (
                <div className="rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm">
                  {
                    schools.find(
                      (school) => school.id === selectedSchoolId
                    )?.name
                  }
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="ebmas-content">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
              {success}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
            <div className="ebmas-card p-6 h-fit">
              <div className="mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#155eef]">
                  {editingId ? "Edit Course" : "New Course"}
                </div>

                <h2 className="mt-2 text-2xl font-black text-[#0b1f3a]">
                  {editingId ? "Update course" : "Add a course"}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Select the school first, then enter the course details.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    School
                  </label>

                  <select
                    value={selectedSchoolId}
                    onChange={(event) =>
                      handleSchoolChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#155eef] focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select school</option>

                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Course Name
                  </label>

                  <input
                    value={courseName}
                    onChange={(event) =>
                      setCourseName(event.target.value)
                    }
                    placeholder="e.g. Bachelor of Science in Computer Science"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#155eef] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Course Code
                  </label>

                  <input
                    value={courseCode}
                    onChange={(event) =>
                      setCourseCode(event.target.value.toUpperCase())
                    }
                    placeholder="e.g. BSC-CS"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-[#155eef] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving || !selectedSchoolId}
                    className="flex-1 rounded-xl bg-[#155eef] px-5 py-3 font-bold text-white transition hover:bg-[#1047b8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Course"
                        : "Save Course"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="ebmas-card overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[#0b1f3a]">
                      Academic Course Structure
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Click a school to expand or collapse its courses.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={expandAll}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Expand All
                    </button>

                    <button
                      type="button"
                      onClick={collapseAll}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="px-6 py-16 text-center text-slate-500">
                  Loading academic structure...
                </div>
              ) : schools.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="text-lg font-bold text-slate-700">
                    No schools found
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Create a school first before adding courses.
                  </p>
                </div>
              ) : (
                <div className="p-4 md:p-5 space-y-3">
                  {schools.map((school) => {
                    const schoolCourses = getSchoolCourses(school.id);
                    const isExpanded = expandedSchools[school.id] ?? false;

                    return (
                      <div
                        key={school.id}
                        className="overflow-hidden rounded-xl border border-slate-200"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSchool(school.id)}
                          className="w-full bg-[#f1f5f9] px-5 py-4 text-left transition hover:bg-[#e8eef5]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0b1f3a] text-white">
                                <span className="text-lg font-black">
                                  {isExpanded ? "-" : "+"}
                                </span>
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base md:text-lg font-black text-[#0b1f3a]">
                                    {school.name}
                                  </h3>

                                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                                    {school.code}
                                  </span>
                                </div>

                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  {schoolCourses.length} course
                                  {schoolCourses.length === 1 ? "" : "s"}
                                </p>
                              </div>
                            </div>

                            <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-slate-400">
                              {isExpanded ? "Collapse" : "Expand"}
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="bg-[#eaf2ff] p-3 border-t border-slate-200">
                            {schoolCourses.length === 0 ? (
                              <div className="rounded-lg bg-white/70 px-5 py-6 text-center">
                                <div className="text-sm font-bold text-slate-600">
                                  No courses registered
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  Use the form on the left to add a course
                                  for this school.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {schoolCourses.map((course) => (
                                  <div
                                    key={course.id}
                                    className="rounded-lg border border-blue-100 bg-[#f7faff] px-5 py-4 transition hover:bg-white"
                                  >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                      <div className="flex items-start gap-4">
                                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#dbeafe] text-[#155eef]">
                                          <span className="text-sm font-black">
                                            C
                                          </span>
                                        </div>

                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-black text-[#172033]">
                                              {course.name}
                                            </h4>

                                            <span className="rounded-md bg-[#dbeafe] px-2.5 py-1 text-xs font-black text-[#155eef]">
                                              {course.code}
                                            </span>
                                          </div>

                                          <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                                            <span>
                                              Students:{" "}
                                              {course._count.students}
                                            </span>

                                            <span>
                                              Units:{" "}
                                              {course._count.courseUnits}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          startEditing(course)
                                        }
                                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-[#155eef] hover:text-[#155eef]"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  </div>
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
              <div className="font-black text-[#0b1f3a]">
                EBMAS
              </div>

              <div className="text-sm">
                Examination Booklet Management & Accountability System
              </div>
            </div>

            <div className="text-sm">
              dbc.techfirm@gmail.com
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Developed by DBC.tech
          </div>
        </footer>
      </main>
    </div>
  );
}

