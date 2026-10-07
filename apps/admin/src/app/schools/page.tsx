"use client";

import { FormEvent, useEffect, useState } from "react";

type University = {
  id: string;
  name: string;
};

type School = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  _count: {
    courses: number;
    students: number;
    departments: number;
  };
};

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Schools", href: "/schools" },
  { label: "Courses", href: "/courses" },
  { label: "Students", href: "/students" },
  { label: "Departments", href: "/departments" },
  { label: "Examinations", href: "/examinations" },
  { label: "Archive", href: "/archive" },
];

export default function SchoolsPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [university, setUniversity] = useState<University | null>(null);
  const [universityName, setUniversityName] = useState("");

  const [schools, setSchools] = useState<School[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUniversity, setEditingUniversity] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadSchools() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/schools", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load schools.");
      }

      setUniversity(data.university);
      setUniversityName(data.university.name);
      setSchools(data.schools);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load university and schools."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  function resetSchoolForm() {
    setName("");
    setCode("");
    setEditingId(null);
  }

  function startEditing(school: School) {
    setEditingId(school.id);
    setName(school.name);
    setCode(school.code);

    setSuccess("");
    setError("");

    window.scrollTo({
      top: 400,
      behavior: "smooth",
    });
  }

  async function saveUniversity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!universityName.trim()) {
      setError("Enter the university name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/university", {
        method: university ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: university?.id,
          name: universityName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save university.");
      }

      setUniversity(data);
      setUniversityName(data.name);
      setEditingUniversity(false);
      setSuccess("University name saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save university."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim() || !code.trim()) {
      setError("Enter both the school name and school code.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/schools", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          name: name.trim(),
          code: code.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess(
        editingId
          ? "School updated successfully."
          : "School saved successfully."
      );

      resetSchoolForm();
      await loadSchools();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the school."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ebmas-shell">
      <aside className="ebmas-sidebar">
        <div className="border-b border-white/10 px-6 py-7">
          <div className="text-2xl font-bold tracking-tight">EBMAS</div>

          <div className="mt-1 text-xs text-blue-200">
            Examination Accountability
          </div>
        </div>

        <nav className="px-3 py-6">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`mb-1 block rounded-lg px-4 py-3 text-sm transition ${
                item.label === "Schools"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 px-6 py-5">
          <div className="text-xs text-slate-400">Powered by</div>
          <div className="mt-1 font-semibold text-white">DBC.tech</div>
        </div>
      </aside>

      <main className="ebmas-main">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
          <div>
            <div className="font-bold text-slate-900">EBMAS</div>
            <div className="text-xs text-slate-500">Admin Portal</div>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            Menu
          </button>
        </header>

        {menuOpen && (
          <div className="border-b border-slate-200 bg-white p-4 lg:hidden">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`block rounded-lg px-3 py-3 text-sm ${
                  item.label === "Schools"
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}

        <section className="ebmas-hero">
          <div className="relative z-10 max-w-5xl">
            <div className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              University Structure
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Schools
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-blue-50 sm:text-lg">
              Establish the university structure by registering and managing
              the schools within the university.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
                {university?.name || "University"}
              </div>

              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
                {schools.length} Schools
              </div>

              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
                Persistent Records
              </div>
            </div>
          </div>
        </section>

        <section className="ebmas-content">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="ebmas-card mb-8 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="text-sm font-medium text-blue-600">
                  University
                </div>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {university?.name || "University Setup"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  This university is the parent of every school in EBMAS.
                </p>
              </div>

              {!editingUniversity && university && (
                <button
                  type="button"
                  onClick={() => setEditingUniversity(true)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600"
                >
                  Edit University
                </button>
              )}
            </div>

            {(!university || editingUniversity) && (
              <form
                onSubmit={saveUniversity}
                className="mt-6 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  value={universityName}
                  onChange={(event) =>
                    setUniversityName(event.target.value)
                  }
                  placeholder="Enter university name"
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save University"}
                </button>

                {editingUniversity && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUniversity(false);
                      setUniversityName(university?.name || "");
                    }}
                    className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </form>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="ebmas-card p-6">
              <h3 className="font-semibold text-slate-900">
                {editingId ? "Edit School" : "Add School"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {editingId
                  ? "Update the selected school."
                  : "Add a school under the university."}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    School Name
                  </label>

                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. School of Computing"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Short Code
                  </label>

                  <input
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.toUpperCase())
                    }
                    placeholder="e.g. SCIT"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update School"
                        : "Save School"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetSchoolForm}
                      className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="ebmas-card p-6 xl:col-span-2">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Schools
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Schools registered under {university?.name || "the university"}.
                  </p>
                </div>

                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {schools.length} registered
                </div>
              </div>

              <div className="mt-6">
                {loading ? (
                  <div className="rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
                    Loading university structure...
                  </div>
                ) : schools.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
                    <div className="text-sm font-medium text-slate-700">
                      No schools registered yet
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      Add the first school using the form.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schools.map((school) => (
                      <div
                        key={school.id}
                        className="rounded-xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="font-semibold text-slate-900">
                                {school.name}
                              </h4>

                              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                                {school.code}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                              <span>
                                {school._count.courses} Courses
                              </span>

                              <span>
                                {school._count.students} Students
                              </span>

                              <span>
                                {school._count.departments} Departments
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => startEditing(school)}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="ebmas-footer">
          <div className="flex flex-col justify-between gap-4 text-sm sm:flex-row">
            <div>
              <div className="font-semibold text-slate-800">EBMAS</div>

              <div className="mt-1">
                Examination Booklet Management & Accountability System
              </div>
            </div>

            <div className="sm:text-right">
              <div>dbc.techfirm@gmail.com</div>

              <div className="mt-1 font-semibold tracking-wide text-slate-800">
                DBC.tech
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}


