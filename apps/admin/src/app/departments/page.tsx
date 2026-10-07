"use client";

import { FormEvent, useEffect, useState } from "react";

type School = {
  id: string;
  name: string;
  code: string;
};

type Department = {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  school: School;
};

type Device = {
  id: string;
  name: string;
  deviceKey: string;
  active: boolean;
  schoolId: string | null;
  departmentId: string | null;
  school: School | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
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

export default function DepartmentsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");

  const [deviceName, setDeviceName] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [deviceDepartmentId, setDeviceDepartmentId] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [expandedSchools, setExpandedSchools] =
    useState<Record<string, boolean>>({});

  const [expandedDepartments, setExpandedDepartments] =
    useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDevice, setSavingDevice] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deviceSuccess, setDeviceSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [departmentsResponse, devicesResponse] = await Promise.all([
        fetch("/api/departments", { cache: "no-store" }),
        fetch("/api/devices", { cache: "no-store" }),
      ]);

      const departmentsData = await departmentsResponse.json();
      const devicesData = await devicesResponse.json();

      if (!departmentsResponse.ok) {
        throw new Error(
          departmentsData.error || "Failed to load departments."
        );
      }

      if (!devicesResponse.ok) {
        throw new Error(devicesData.error || "Failed to load devices.");
      }

      setSchools(departmentsData.schools || []);
      setDepartments(departmentsData.departments || []);
      setDevices(devicesData.devices || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load departments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleSchool(schoolId: string) {
    setExpandedSchools((current) => ({
      ...current,
      [schoolId]: !(current[schoolId] ?? false),
    }));
  }

  function toggleDepartment(departmentId: string) {
    setExpandedDepartments((current) => ({
      ...current,
      [departmentId]: !(current[departmentId] ?? false),
    }));
  }

  function expandAll() {
    const expanded: Record<string, boolean> = {};

    schools.forEach((school) => {
      expanded[school.id] = true;
    });

    setExpandedSchools(expanded);
  }

  function collapseAll() {
    setExpandedSchools({});
    setExpandedDepartments({});
  }

  function getSchoolDepartments(schoolId: string) {
    return departments.filter(
      (department) => department.schoolId === schoolId
    );
  }

  function getDepartmentDevices(departmentId: string) {
    return devices.filter(
      (device) => device.departmentId === departmentId
    );
  }

  function resetDepartmentForm() {
    setSelectedSchoolId("");
    setDepartmentName("");
    setDepartmentCode("");
    setEditingId(null);
  }

  function startEditing(department: Department) {
    setEditingId(department.id);
    setSelectedSchoolId(department.schoolId);
    setDepartmentName(department.name);
    setDepartmentCode(department.code);

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 400,
      behavior: "smooth",
    });
  }

  function handleSchoolChange(schoolId: string) {
    setSelectedSchoolId(schoolId);

    if (schoolId) {
      setExpandedSchools((current) => ({
        ...current,
        [schoolId]: true,
      }));
    }
  }

  async function handleDepartmentSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !selectedSchoolId ||
      !departmentName.trim() ||
      !departmentCode.trim()
    ) {
      setError(
        "Select a school and enter both the department name and department code."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/departments", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          schoolId: selectedSchoolId,
          name: departmentName.trim(),
          code: departmentCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save department."
        );
      }

      setSuccess(
        editingId
          ? "Department updated successfully."
          : "Department saved successfully."
      );

      resetDepartmentForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the department."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeviceSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setDeviceSuccess("");

    if (!deviceDepartmentId || !deviceName.trim() || !deviceKey.trim()) {
      setError(
        "Select a department and enter both the device name and device key."
      );
      return;
    }

    const department = departments.find(
      (item) => item.id === deviceDepartmentId
    );

    if (!department) {
      setError("Selected department was not found.");
      return;
    }

    try {
      setSavingDevice(true);

      const response = await fetch("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: deviceName.trim(),
          deviceKey: deviceKey.trim(),
          schoolId: department.schoolId,
          departmentId: department.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to register device."
        );
      }

      setDeviceSuccess(
        `Device "${deviceName.trim()}" registered successfully.`
      );

      setDeviceName("");
      setDeviceKey("");
      setDeviceDepartmentId("");

      setExpandedSchools((current) => ({
        ...current,
        [department.schoolId]: true,
      }));

      setExpandedDepartments((current) => ({
        ...current,
        [department.id]: true,
      }));

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to register the device."
      );
    } finally {
      setSavingDevice(false);
    }
  }

  return (
    <div className="ebmas-shell">
      <aside className="ebmas-sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="text-2xl font-black tracking-tight">
            EBMAS
          </div>

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
                item.label === "Departments"
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
                    item.label === "Departments"
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
              Departments
            </h1>

            <p className="mt-5 max-w-3xl text-lg md:text-xl text-white/80 leading-relaxed">
              Manage academic departments within their respective
              schools. Devices are assigned to departments for
              controlled examination operations.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm">
                {schools.length} schools
              </div>

              <div className="rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm">
                {departments.length} departments
              </div>

              <div className="rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm">
                {devices.length} devices
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

          {deviceSuccess && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
              {deviceSuccess}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
            <div className="ebmas-card p-6 h-fit">
              <div className="mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#155eef]">
                  {editingId ? "Edit Department" : "New Department"}
                </div>

                <h2 className="mt-2 text-2xl font-black text-[#0b1f3a]">
                  {editingId
                    ? "Update department"
                    : "Add a department"}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Select the school first, then enter the department
                  details.
                </p>
              </div>

              <form
                onSubmit={handleDepartmentSubmit}
                className="space-y-5"
              >
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
                    Department Name
                  </label>

                  <input
                    value={departmentName}
                    onChange={(event) =>
                      setDepartmentName(event.target.value)
                    }
                    placeholder="e.g. Department of Biology"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#155eef] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Department Code
                  </label>

                  <input
                    value={departmentCode}
                    onChange={(event) =>
                      setDepartmentCode(
                        event.target.value.toUpperCase()
                      )
                    }
                    placeholder="e.g. BSC"
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
                        ? "Update Department"
                        : "Save Department"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetDepartmentForm}
                      className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#155eef]">
                  Device Registration
                </div>

                <h3 className="mt-2 text-lg font-black text-[#0b1f3a]">
                  Register an invigilator device
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Assign the device to a school and department.
                </p>

                <form
                  onSubmit={handleDeviceSubmit}
                  className="mt-5 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Department
                    </label>

                    <select
                      value={deviceDepartmentId}
                      onChange={(event) =>
                        setDeviceDepartmentId(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#155eef] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select department</option>

                      {departments.map((department) => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {department.name} ({department.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Device Name
                    </label>

                    <input
                      value={deviceName}
                      onChange={(event) =>
                        setDeviceName(event.target.value)
                      }
                      placeholder="e.g. Exam Room PC 01"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#155eef] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Device Key
                    </label>

                    <input
                      value={deviceKey}
                      onChange={(event) =>
                        setDeviceKey(event.target.value)
                      }
                      placeholder="Paste device key"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-[#155eef] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingDevice}
                    className="w-full rounded-xl border border-[#155eef] px-5 py-3 font-bold text-[#155eef] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingDevice
                      ? "Registering..."
                      : "Register Device"}
                  </button>
                </form>
              </div>
            </div>

            <div className="ebmas-card overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[#0b1f3a]">
                      Academic Department Structure
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Click a school to expand or collapse its
                      departments.
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
                    Create a school first before adding departments.
                  </p>
                </div>
              ) : (
                <div className="p-4 md:p-5 space-y-3">
                  {schools.map((school) => {
                    const schoolDepartments =
                      getSchoolDepartments(school.id);

                    const isExpanded =
                      expandedSchools[school.id] ?? false;

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
                                  {schoolDepartments.length} department
                                  {schoolDepartments.length === 1
                                    ? ""
                                    : "s"}
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
                            {schoolDepartments.length === 0 ? (
                              <div className="rounded-lg bg-white/70 px-5 py-6 text-center">
                                <div className="text-sm font-bold text-slate-600">
                                  No departments registered
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  Use the form on the left to add a
                                  department for this school.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {schoolDepartments.map((department) => {
                                  const departmentDevices =
                                    getDepartmentDevices(
                                      department.id
                                    );

                                  const departmentExpanded =
                                    expandedDepartments[
                                      department.id
                                    ] ?? false;

                                  return (
                                    <div
                                      key={department.id}
                                      className="overflow-hidden rounded-lg border border-blue-100 bg-[#f7faff]"
                                    >
                                      <div className="px-5 py-4">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleDepartment(
                                                department.id
                                              )
                                            }
                                            className="flex items-start gap-4 text-left"
                                          >
                                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#dbeafe] text-[#155eef]">
                                              <span className="text-sm font-black">
                                                {departmentExpanded
                                                  ? "-"
                                                  : "D"}
                                              </span>
                                            </div>

                                            <div>
                                              <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-black text-[#172033]">
                                                  {department.name}
                                                </h4>

                                                <span className="rounded-md bg-[#dbeafe] px-2.5 py-1 text-xs font-black text-[#155eef]">
                                                  {department.code}
                                                </span>
                                              </div>

                                              <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                                                <span>
                                                  Devices:{" "}
                                                  {
                                                    departmentDevices.length
                                                  }
                                                </span>

                                                <span>
                                                  Click to{" "}
                                                  {departmentExpanded
                                                    ? "collapse"
                                                    : "view devices"}
                                                </span>
                                              </div>
                                            </div>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              startEditing(
                                                department
                                              )
                                            }
                                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-[#155eef] hover:text-[#155eef]"
                                          >
                                            Edit
                                          </button>
                                        </div>
                                      </div>

                                      {departmentExpanded && (
                                        <div className="border-t border-blue-100 bg-white px-5 py-4">
                                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div>
                                              <div className="text-xs font-bold uppercase tracking-wider text-[#155eef]">
                                                Registered Devices
                                              </div>

                                              <p className="mt-1 text-xs text-slate-500">
                                                Devices assigned to this
                                                department.
                                              </p>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setDeviceDepartmentId(
                                                  department.id
                                                );
                                                setDeviceSuccess("");
                                                window.scrollTo({
                                                  top: 400,
                                                  behavior: "smooth",
                                                });
                                              }}
                                              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#155eef] hover:text-[#155eef]"
                                            >
                                              Register Device
                                            </button>
                                          </div>

                                          {departmentDevices.length ===
                                          0 ? (
                                            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
                                              <div className="text-sm font-bold text-slate-600">
                                                No devices registered
                                              </div>

                                              <p className="mt-1 text-xs text-slate-500">
                                                Register an invigilator
                                                device using the form on
                                                the left.
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="mt-4 space-y-2">
                                              {departmentDevices.map(
                                                (device) => (
                                                  <div
                                                    key={device.id}
                                                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                                                  >
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                      <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                          <span className="font-bold text-[#172033]">
                                                            {device.name}
                                                          </span>

                                                          <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                                              device.active
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                            }`}
                                                          >
                                                            {device.active
                                                              ? "Active"
                                                              : "Inactive"}
                                                          </span>
                                                        </div>

                                                        <div className="mt-1 text-xs text-slate-500">
                                                          Device key:
                                                          <span className="ml-2 font-mono text-slate-600">
                                                            {device.deviceKey}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )
                                              )}
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
