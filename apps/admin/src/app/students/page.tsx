"use client";

import { useEffect, useMemo, useState } from "react";

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
};

type Course = {
  id: string;
  name: string;
  code: string;
  school: School;
};

type Student = {
  id: string;
  schoolId: string;
  courseId: string;
  admissionYear: number;
  regNumber: string;
  firstName: string;
  lastName: string;
  school: School;
  course: School & {
    name: string;
    code: string;
  };
};

type StudentSlot = {
  name: string;
  indexNumber: string;
};

export default function StudentsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [schoolId, setSchoolId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [admissionYear, setAdmissionYear] = useState(
    String(new Date().getFullYear())
  );

  const [slots, setSlots] = useState<StudentSlot[]>(
    Array.from({ length: 10 }, (_, index) => ({
      name: "",
      indexNumber: String(index + 1).padStart(5, "0"),
    }))
  );

  const [openSchools, setOpenSchools] = useState<Record<string, boolean>>({});
  const [openCourses, setOpenCourses] = useState<Record<string, boolean>>({});
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [schoolsResponse, coursesResponse, studentsResponse] =
        await Promise.all([
          fetch("/api/schools", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
          fetch("/api/students", { cache: "no-store" }),
        ]);

      const schoolsData = await schoolsResponse.json();
      const coursesData = await coursesResponse.json();
      const studentsData = await studentsResponse.json();

      setSchools(schoolsData.schools ?? []);
      setCourses(coursesData.courses ?? []);
      setStudents(studentsData.students ?? []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load student data.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = useMemo(() => {
    if (!schoolId) return [];
    return courses.filter((course) => course.school.id === schoolId);
  }, [courses, schoolId]);

  const selectedCourse = courses.find((course) => course.id === courseId);

  function changeSchool(value: string) {
    setSchoolId(value);
    setCourseId("");
    setMessage("");
  }

  function changeCourse(value: string) {
    setCourseId(value);
    setMessage("");
  }

  function updateSlot(
    index: number,
    field: keyof StudentSlot,
    value: string
  ) {
    setSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index
          ? {
              ...slot,
              [field]:
                field === "indexNumber"
                  ? value.replace(/\D/g, "").slice(0, 5)
                  : value,
            }
          : slot
      )
    );
  }

  function addTenSlots() {
    setSlots((current) => {
      const start = current.length + 1;

      return [
        ...current,
        ...Array.from({ length: 10 }, (_, index) => ({
          name: "",
          indexNumber: String(start + index).padStart(5, "0"),
        })),
      ];
    });
  }

  function removeEmptySlots() {
    setSlots((current) => {
      const filled = current.filter(
        (slot) => slot.name.trim() || slot.indexNumber.trim()
      );

      return filled.length
        ? filled
        : Array.from({ length: 10 }, (_, index) => ({
            name: "",
            indexNumber: String(index + 1).padStart(5, "0"),
          }));
    });
  }

  async function saveStudents() {
    setMessage("");

    if (!schoolId) {
      setMessage("Select a school first.");
      return;
    }

    if (!courseId) {
      setMessage("Select a course first.");
      return;
    }

    const year = Number(admissionYear);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setMessage("Enter a valid admission year.");
      return;
    }

    const filledSlots = slots.filter(
      (slot) => slot.name.trim() && slot.indexNumber.trim()
    );

    if (!filledSlots.length) {
      setMessage("Enter at least one student.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId,
          courseId,
          admissionYear: year,
          students: filledSlots,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Failed to save students.");
        return;
      }

      setMessage(
        `${data.created} student${data.created === 1 ? "" : "s"} saved successfully.`
      );

      setSlots(
        Array.from({ length: 10 }, (_, index) => ({
          name: "",
          indexNumber: String(index + 1).padStart(5, "0"),
        }))
      );

      await loadData();
    } catch (error) {
      console.error(error);
      setMessage("Failed to save students.");
    } finally {
      setSaving(false);
    }
  }

  const grouped = useMemo(() => {
    const result: Record<
      string,
      {
        school: School;
        courses: Record<
          string,
          {
            course: Course;
            years: Record<number, Student[]>;
          }
        >;
      }
    > = {};

    for (const student of students) {
      const schoolKey = student.school.id;
      const courseKey = student.course.id;

      if (!result[schoolKey]) {
        result[schoolKey] = {
          school: student.school,
          courses: {},
        };
      }

      if (!result[schoolKey].courses[courseKey]) {
        result[schoolKey].courses[courseKey] = {
          course: {
            id: student.course.id,
            name: student.course.name,
            code: student.course.code,
            school: student.school,
          },
          years: {},
        };
      }

      if (!result[schoolKey].courses[courseKey].years[student.admissionYear]) {
        result[schoolKey].courses[courseKey].years[student.admissionYear] = [];
      }

      result[schoolKey].courses[courseKey].years[
        student.admissionYear
      ].push(student);
    }

    return result;
  }, [students]);

  function toggleSchool(id: string) {
    setOpenSchools((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function toggleCourse(id: string) {
    setOpenCourses((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function toggleYear(key: string) {
    setOpenYears((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  return (
    <div className="ebmas-shell">
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
                item.label === "Students"
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

      <main className="ebmas-main">
        <section className="ebmas-hero">
          <div className="relative z-10">
            <div className="inline-flex px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sm mb-5">
              Student Management
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Students
            </h1>

            <p className="mt-4 text-lg text-white/80 max-w-3xl">
              Register students by school, course and admission year with
              structured examination registration numbers.
            </p>
          </div>
        </section>

        <section className="ebmas-content">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1">
              <div className="ebmas-card p-6 sticky top-6">
                <h2 className="text-xl font-bold text-[#0b1f3a]">
                  Add Students
                </h2>

                <p className="text-sm text-slate-500 mt-1 mb-6">
                  Select the academic structure first. Registration numbers
                  are generated automatically.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      School
                    </label>

                    <select
                      value={schoolId}
                      onChange={(event) =>
                        changeSchool(event.target.value)
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-3 bg-white"
                    >
                      <option value="">Select school</option>

                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Course
                    </label>

                    <select
                      value={courseId}
                      onChange={(event) =>
                        changeCourse(event.target.value)
                      }
                      disabled={!schoolId}
                      className="w-full border border-slate-300 rounded-lg px-3 py-3 bg-white disabled:bg-slate-100"
                    >
                      <option value="">
                        {schoolId
                          ? "Select course"
                          : "Select school first"}
                      </option>

                      {filteredCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} — {course.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCourse && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                      <div className="text-xs text-slate-500">
                        Registration format
                      </div>

                      <div className="font-bold text-[#0b1f3a] mt-1">
                        {selectedCourse.code}/00001/24
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Admission Year
                    </label>

                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={admissionYear}
                      onChange={(event) =>
                        setAdmissionYear(event.target.value)
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-3"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-2">
              <div className="ebmas-card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#0b1f3a]">
                      Student Entry
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      {selectedCourse
                        ? `${selectedCourse.code} · Admission ${admissionYear}`
                        : "Select a school and course to begin."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addTenSlots}
                      className="px-4 py-2.5 rounded-lg bg-[#155eef] text-white font-semibold hover:bg-[#1047b8]"
                    >
                      + Add 10
                    </button>

                    <button
                      type="button"
                      onClick={removeEmptySlots}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 font-semibold hover:bg-slate-50"
                    >
                      Remove Empty
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="px-3 py-3 text-sm text-slate-500 w-16">
                          #
                        </th>
                        <th className="px-3 py-3 text-sm text-slate-500">
                          Student Name
                        </th>
                        <th className="px-3 py-3 text-sm text-slate-500">
                          Index Number
                        </th>
                        <th className="px-3 py-3 text-sm text-slate-500">
                          Registration Number
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {slots.map((slot, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-100"
                        >
                          <td className="px-3 py-2 font-semibold text-slate-500">
                            {index + 1}
                          </td>

                          <td className="px-3 py-2">
                            <input
                              value={slot.name}
                              onChange={(event) =>
                                updateSlot(
                                  index,
                                  "name",
                                  event.target.value
                                )
                              }
                              placeholder="Student name"
                              className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <input
                              value={slot.indexNumber}
                              onChange={(event) =>
                                updateSlot(
                                  index,
                                  "indexNumber",
                                  event.target.value
                                )
                              }
                              inputMode="numeric"
                              maxLength={5}
                              className="w-32 border border-slate-300 rounded-lg px-3 py-2.5"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <div className="px-3 py-2.5 rounded-lg bg-slate-50 text-slate-600 font-mono text-sm">
                              {selectedCourse
                                ? `${selectedCourse.code}/${(
                                    slot.indexNumber || "0"
                                  ).padStart(5, "0")}/${String(
                                    admissionYear
                                  ).slice(-2)}`
                                : "—"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {message && (
                  <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
                    {message}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={saveStudents}
                    disabled={saving || !schoolId || !courseId}
                    className="px-6 py-3 rounded-lg bg-[#16803c] text-white font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Students"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-[#0b1f3a]">
                Saved Students
              </h2>

              <p className="text-slate-500 mt-1">
                Students are organized by school, course and admission year.
              </p>
            </div>

            <div className="ebmas-card overflow-hidden">
              {loading ? (
                <div className="p-8 text-slate-500">
                  Loading students...
                </div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="p-8 text-slate-500">
                  No students have been registered yet.
                </div>
              ) : (
                Object.values(grouped).map((schoolGroup) => {
                  const schoolOpen =
                    openSchools[schoolGroup.school.id] ?? true;

                  return (
                    <div
                      key={schoolGroup.school.id}
                      className="border-b border-slate-200 last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleSchool(schoolGroup.school.id)
                        }
                        className="w-full flex items-center justify-between px-6 py-4 bg-[#0b1f3a] text-white text-left"
                      >
                        <div>
                          <div className="font-bold">
                            {schoolGroup.school.name}
                          </div>
                          <div className="text-xs text-white/60 mt-1">
                            {schoolGroup.school.code}
                          </div>
                        </div>

                        <span>{schoolOpen ? "−" : "+"}</span>
                      </button>

                      {schoolOpen && (
                        <div className="p-4 space-y-3">
                          {Object.values(schoolGroup.courses).map(
                            (courseGroup) => {
                              const courseOpen =
                                openCourses[courseGroup.course.id] ?? true;

                              return (
                                <div
                                  key={courseGroup.course.id}
                                  className="border border-slate-200 rounded-lg overflow-hidden"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleCourse(courseGroup.course.id)
                                    }
                                    className="w-full flex items-center justify-between px-5 py-4 bg-slate-100 text-left"
                                  >
                                    <div>
                                      <div className="font-bold text-[#0b1f3a]">
                                        {courseGroup.course.name}
                                      </div>
                                      <div className="text-sm text-slate-500">
                                        {courseGroup.course.code}
                                      </div>
                                    </div>

                                    <span>
                                      {courseOpen ? "−" : "+"}
                                    </span>
                                  </button>

                                  {courseOpen && (
                                    <div className="p-3 space-y-3">
                                      {Object.entries(
                                        courseGroup.years
                                      ).map(([year, yearStudents]) => {
                                        const yearKey = `${courseGroup.course.id}-${year}`;
                                        const yearOpen =
                                          openYears[yearKey] ?? true;

                                        return (
                                          <div
                                            key={yearKey}
                                            className="border border-slate-200 rounded-lg overflow-hidden"
                                          >
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleYear(yearKey)
                                              }
                                              className="w-full flex items-center justify-between px-4 py-3 bg-white text-left"
                                            >
                                              <div>
                                                <span className="font-semibold text-[#0b1f3a]">
                                                  Admission {year}
                                                </span>

                                                <span className="text-sm text-slate-500 ml-3">
                                                  {yearStudents.length}{" "}
                                                  student
                                                  {yearStudents.length === 1
                                                    ? ""
                                                    : "s"}
                                                </span>
                                              </div>

                                              <span>
                                                {yearOpen ? "−" : "+"}
                                              </span>
                                            </button>

                                            {yearOpen && (
                                              <div className="overflow-x-auto">
                                                <table className="w-full">
                                                  <thead>
                                                    <tr className="bg-slate-50 border-t border-slate-200">
                                                      <th className="px-4 py-3 text-left text-xs text-slate-500">
                                                        #
                                                      </th>
                                                      <th className="px-4 py-3 text-left text-xs text-slate-500">
                                                        Student Name
                                                      </th>
                                                      <th className="px-4 py-3 text-left text-xs text-slate-500">
                                                        Registration Number
                                                      </th>
                                                    </tr>
                                                  </thead>

                                                  <tbody>
                                                    {yearStudents.map(
                                                      (
                                                        student,
                                                        studentIndex
                                                      ) => (
                                                        <tr
                                                          key={student.id}
                                                          className="border-t border-slate-100"
                                                        >
                                                          <td className="px-4 py-3 text-sm text-slate-500">
                                                            {studentIndex + 1}
                                                          </td>

                                                          <td className="px-4 py-3 font-medium">
                                                            {
                                                              student.firstName
                                                            }{" "}
                                                            {
                                                              student.lastName
                                                            }
                                                          </td>

                                                          <td className="px-4 py-3 font-mono text-sm text-[#155eef]">
                                                            {
                                                              student.regNumber
                                                            }
                                                          </td>
                                                        </tr>
                                                      )
                                                    )}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <footer className="ebmas-footer">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="font-semibold text-[#0b1f3a]">EBMAS</div>
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
