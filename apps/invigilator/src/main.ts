import "./styles.css";

import {
  downloadSitting,
  endSitting,
  getLocalSittings,
  getOrCreateDevice,
  getSittingBookletEntries,
  getSittingStudents,
  saveBookletEntry,
  startSitting,
  getTransferBatch,
  type LocalDevice,
} from "./lib/rna-service";

import type {
  LocalBookletEntry,
  LocalSitting,
  LocalStudent,
} from "./lib/rna-db";

const ADMIN_API_URL = "http://localhost:3000";

type Page =
  | "dashboard"
  | "examinations"
  | "students"
  | "transfers"
  | "archive"
  | "sitting";

type ApiStudent = {
  id: string;
  regNumber: string;
  firstName: string;
  lastName: string;
  admissionYear: number;
};

type ApiSitting = {
  id: string;
  examPeriodId: string;
  courseUnitId: string;
  startTime: string;
  endTime: string;
  status: string;
  examPeriod: {
    id: string;
    name: string;
    academicYear: string;
    semester: string;
    startDate: string;
    endDate: string;
  };
  courseUnit: {
    yearOfStudy: number;
    course: {
      id: string;
      code: string;
      name: string;
      schoolId: string;
      students: ApiStudent[];
    };
    unit: {
      id: string;
      code: string;
      name: string;
      departmentId: string;
    };
  };
};

const state: {
  page: Page;
  device: LocalDevice | null;
  localSittings: LocalSitting[];
  activeSittingId: string | null;
  students: LocalStudent[];
  entries: LocalBookletEntry[];
  loading: boolean;
  savingStudentId: string | null;
  error: string | null;
  message: string | null;
} = {
  page: "dashboard",
  device: null,
  localSittings: [],
  activeSittingId: null,
  students: [],
  entries: [],
  loading: false,
  savingStudentId: null,
  error: null,
  message: null,
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getActiveSitting() {
  return state.localSittings.find(
    (item) => item.id === state.activeSittingId,
  ) ?? null;
}

function getEntry(studentId: string) {
  return state.entries.find(
    (entry) => entry.studentId === studentId,
  );
}

function goTo(page: Page) {
  state.page = page;
  state.error = null;
  state.message = null;
  render();
}

function alerts() {
  return `
    ${
      state.error
        ? `
          <div class="alert alert-error">
            <strong>Operation failed</strong>
            <span>${escapeHtml(state.error)}</span>
          </div>
        `
        : ""
    }

    ${
      state.message
        ? `
          <div class="alert alert-success">
            <strong>Operation complete</strong>
            <span>${escapeHtml(state.message)}</span>
          </div>
        `
        : ""
    }
  `;
}

function shell(content: string) {
  return `
    <div class="app-shell">

      <header class="topbar">
        <div class="brand-block">
          <div class="brand-mark">EB</div>

          <div>
            <div class="brand-name">EBMAS</div>
            <div class="brand-subtitle">
              EXAMINATION OPERATIONS
            </div>
          </div>
        </div>

        <div class="topbar-status">
          <span class="status-dot"></span>
          <span>Local RNA Ready</span>
        </div>
      </header>

      <div class="workspace">

        <aside class="sidebar">

          <div class="sidebar-heading">
            WORKSPACE
          </div>

          <nav class="nav-list">

            <button
              class="nav-item ${state.page === "dashboard" ? "active" : ""}"
              data-nav="dashboard"
            >
              Dashboard
            </button>

            <button
              class="nav-item ${state.page === "examinations" ? "active" : ""}"
              data-nav="examinations"
            >
              Examinations
            </button>

            <button
              class="nav-item ${state.page === "students" ? "active" : ""}"
              data-nav="students"
            >
              Students
            </button>

            <button
              class="nav-item ${state.page === "transfers" ? "active" : ""}"
              data-nav="transfers"
            >
              Transfers
            </button>

            <button
              class="nav-item ${state.page === "archive" ? "active" : ""}"
              data-nav="archive"
            >
              Archive
            </button>

          </nav>

          <div class="sidebar-footer">

            <div class="sidebar-heading">
              DEVICE
            </div>

            <div class="device-mini">

              <div class="device-mini-label">
                DEVICE
              </div>

              <div class="device-mini-name">
                ${escapeHtml(
                  state.device?.name ?? "Unregistered Device",
                )}
              </div>

              <div class="device-mini-key">
                ${escapeHtml(
                  state.device?.deviceKey ?? "DEVICE-PENDING",
                )}
              </div>

            </div>

          </div>

        </aside>

        <main class="main-content">
          ${content}
        </main>

      </div>

    </div>
  `;
}

function dashboardPage() {
  const sitting = state.localSittings[0];

  return `
    <div class="page-heading">

      <div>
        <div class="eyebrow">
          DEVICE CONTROL
        </div>

        <h1>
          Examination Operations
        </h1>

        <p>
          Download assigned examinations, work offline,
          record booklet accountability and transfer
          completed examination data.
        </p>
      </div>

      <div class="connection-card">

        <span class="connection-indicator"></span>

        <div>
          <strong>RNA LOCAL MODE</strong>
          <small>Ready for offline operation</small>
        </div>

      </div>

    </div>

    ${alerts()}

    <section class="operations-grid">

      <article class="panel device-panel">

        <div class="panel-header">

          <div>
            <div class="panel-kicker">
              DEVICE
            </div>

            <h2>
              Device Information
            </h2>
          </div>

          <span class="panel-badge">
            RNA
          </span>

        </div>

        <div class="device-information">

          <div class="info-row">
            <span>DEVICE NAME</span>

            <strong>
              ${escapeHtml(
                state.device?.name ?? "Unregistered Device",
              )}
            </strong>
          </div>

          <div class="info-row">
            <span>DEVICE KEY</span>

            <strong class="mono">
              ${escapeHtml(
                state.device?.deviceKey ?? "DEVICE-PENDING",
              )}
            </strong>
          </div>

          <div class="info-row">
            <span>REGISTRATION</span>

            <strong
              class="${
                state.device?.registered
                  ? "registered"
                  : "not-registered"
              }"
            >
              ${
                state.device?.registered
                  ? "REGISTERED"
                  : "NOT REGISTERED"
              }
            </strong>
          </div>

        </div>

        <div class="device-note">
          ${
            state.device?.registered
              ? "This device is paired with its assigned school and department."
              : "This device has not yet been registered by the central examination administrator."
          }
        </div>

      </article>

      <article class="panel storage-panel">

        <div class="panel-header">

          <div>
            <div class="panel-kicker">
              LOCAL STORAGE
            </div>

            <h2>
              Local RNA Storage
            </h2>
          </div>

          <span class="panel-badge">
            PERSISTENT
          </span>

        </div>

        <p class="panel-description">
          Examination data is written locally before
          examination work begins. The device can
          continue operating when the network is unavailable.
        </p>

        <div class="storage-grid">

          <div class="storage-item">
            <strong>DEVICE</strong>
            <span>Persistent</span>
          </div>

          <div class="storage-item">
            <strong>SITTINGS</strong>
            <span>${state.localSittings.length} Local</span>
          </div>

          <div class="storage-item">
            <strong>STUDENTS</strong>
            <span>
              ${sitting ? "Downloaded" : "Waiting"}
            </span>
          </div>

          <div class="storage-item">
            <strong>BOOKLETS</strong>
            <span>Local Recording</span>
          </div>

          <div class="storage-item">
            <strong>SYNC BATCHES</strong>
            <span>Transfer Queue</span>
          </div>

        </div>

      </article>

    </section>

    <section class="panel examination-panel">

      <div class="panel-header">

        <div>
          <div class="panel-kicker">
            CENTRAL EXAMINATION SYSTEM
          </div>

          <h2>
            ${
              sitting
                ? "Downloaded Examination"
                : "No Examination Downloaded"
            }
          </h2>
        </div>

        <span
          class="exam-status ${
            sitting ? "downloaded" : "waiting"
          }"
        >
          ${sitting ? statusLabel(sitting.status) : "READY"}
        </span>

      </div>

      ${
        sitting
          ? `
            <div class="exam-hero">

              <div class="exam-main">

                <div class="exam-period">
                  ${escapeHtml(sitting.examinationName)}
                </div>

                <h3>
                  ${escapeHtml(sitting.unitCode)}
                  —
                  ${escapeHtml(sitting.unitName)}
                </h3>

                <div class="exam-meta">

                  <span>
                    <strong>
                      ${escapeHtml(sitting.courseCode)}
                    </strong>

                    ${escapeHtml(sitting.courseName)}
                  </span>

                  <span>
                    Year ${sitting.yearOfStudy}
                  </span>

                  <span>
                    ${escapeHtml(sitting.academicYear)}
                    · Semester
                    ${escapeHtml(sitting.semester)}
                  </span>

                </div>

              </div>

              <button
                id="open-examination"
                class="primary-button"
              >
                Open Examination
              </button>

            </div>

            <div class="exam-details">

              <div>
                <span>SCHOOL</span>
                <strong>
                  ${escapeHtml(sitting.schoolName)}
                </strong>
              </div>

              <div>
                <span>DEPARTMENT</span>
                <strong>
                  ${escapeHtml(sitting.departmentName)}
                </strong>
              </div>

              <div>
                <span>EXAM DATE</span>
                <strong>
                  ${formatDate(sitting.startTime)}
                </strong>
              </div>

              <div>
                <span>TIME</span>
                <strong>
                  ${formatTime(sitting.startTime)}
                  —
                  ${formatTime(sitting.endTime)}
                </strong>
              </div>

            </div>
          `
          : `
            <div class="empty-examination">

              <div class="empty-icon">
                EX
              </div>

              <div class="empty-copy">

                <h3>
                  Ready for examination download
                </h3>

                <p>
                  The central system will provide the
                  examination assigned to this device.
                  Course, year, unit and student roster
                  are imported automatically.
                </p>

              </div>

              <button
                id="download-examination"
                class="primary-button"
                ${state.loading ? "disabled" : ""}
              >
                ${
                  state.loading
                    ? "Downloading..."
                    : "Download Examination"
                }
              </button>

            </div>
          `
      }

    </section>
  `;
}

function examinationsPage() {
  return `
    <div class="page-heading">

      <div>
        <div class="eyebrow">
          LOCAL RNA
        </div>

        <h1>
          Examinations
        </h1>

        <p>
          Downloaded examinations remain available on
          this device for offline examination work.
        </p>
      </div>

    </div>

    ${alerts()}

    <section class="panel">

      <div class="panel-header">

        <div>
          <div class="panel-kicker">
            DOWNLOADED EXAMINATIONS
          </div>

          <h2>
            Examination List
          </h2>
        </div>

        <span class="panel-badge">
          ${state.localSittings.length} LOCAL
        </span>

      </div>

      ${
        state.localSittings.length === 0
          ? `
            <div class="empty-page-state">

              <h3>
                No downloaded examination
              </h3>

              <p>
                Go to Dashboard and download the examination
                assigned to this device.
              </p>

              <button
                class="primary-button"
                data-nav="dashboard"
              >
                Go to Dashboard
              </button>

            </div>
          `
          : `
            <div class="local-exam-list">

              ${state.localSittings
                .map(
                  (sitting) => `
                    <button
                      class="local-exam-card"
                      data-open-sitting="${escapeHtml(
                        sitting.id,
                      )}"
                    >

                      <div class="local-exam-card-main">

                        <div class="local-exam-kicker">
                          ${escapeHtml(
                            sitting.examinationName,
                          )}
                        </div>

                        <h3>
                          ${escapeHtml(
                            sitting.unitCode,
                          )}
                          —
                          ${escapeHtml(
                            sitting.unitName,
                          )}
                        </h3>

                        <div class="local-exam-meta">

                          <span>
                            <strong>School:</strong>
                            ${escapeHtml(
                              sitting.schoolName,
                            )}
                          </span>

                          <span>
                            <strong>Department:</strong>
                            ${escapeHtml(
                              sitting.departmentName,
                            )}
                          </span>

                          <span>
                            <strong>Course:</strong>
                            ${escapeHtml(
                              sitting.courseCode,
                            )}
                            —
                            ${escapeHtml(
                              sitting.courseName,
                            )}
                          </span>

                          <span>
                            <strong>Year:</strong>
                            ${sitting.yearOfStudy}
                          </span>

                        </div>

                      </div>

                      <div class="local-exam-card-side">

                        <span
                          class="exam-status downloaded"
                        >
                          ${statusLabel(
                            sitting.status,
                          )}
                        </span>

                        <span class="open-label">
                          Open Examination
                        </span>

                      </div>

                    </button>
                  `,
                )
                .join("")}

            </div>
          `
      }

    </section>
  `;
}

function studentsPage() {
  const sitting = getActiveSitting();

  if (!sitting) {
    return `
      <div class="page-heading">
        <div>
          <div class="eyebrow">LOCAL ROSTER</div>
          <h1>Students</h1>
          <p>No examination is currently selected.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="page-heading">

      <div>
        <div class="eyebrow">
          LOCAL ROSTER
        </div>

        <h1>
          Students
        </h1>

        <p>
          ${escapeHtml(sitting.courseCode)}
          · Year ${sitting.yearOfStudy}
          · ${escapeHtml(sitting.unitCode)}
        </p>
      </div>

    </div>

    <section class="panel">

      <div class="panel-header">

        <div>
          <div class="panel-kicker">
            DOWNLOADED ROSTER
          </div>

          <h2>
            ${state.students.length} Students
          </h2>
        </div>

      </div>

      <div class="roster-table-wrap">

        <table class="roster-table">

          <thead>
            <tr>
              <th>#</th>
              <th>Registration Number</th>
              <th>Student Name</th>
              <th>Booklet Number</th>
            </tr>
          </thead>

          <tbody>

            ${state.students
              .map(
                (student, index) => `
                  <tr>

                    <td>
                      ${index + 1}
                    </td>

                    <td class="mono">
                      ${escapeHtml(
                        student.regNumber,
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        student.firstName,
                      )}
                      ${escapeHtml(
                        student.lastName,
                      )}
                    </td>

                    <td>
                      ${
                        getEntry(student.studentId)
                          ?.bookletCode ??
                        "Not recorded"
                      }
                    </td>

                  </tr>
                `,
              )
              .join("")}

          </tbody>

        </table>

      </div>

    </section>
  `;
}

function transfersPage() {
  return `
    <div class="page-heading">

      <div>
        <div class="eyebrow">
          RECEPTION / TRANSFER
        </div>

        <h1>
          Transfers
        </h1>

        <p>
          Completed offline examinations waiting
          for transfer to the central system.
        </p>
      </div>

    </div>

    ${alerts()}

    <section class="panel">

      <div class="panel-header">

        <div>
          <div class="panel-kicker">
            RNA TRANSFER QUEUE
          </div>

          <h2>
            Transfer Queue
          </h2>
        </div>

      </div>

      <div class="empty-page-state">

        <h3>
          Reception and transfer
        </h3>

        <p>
          After End Exam, the device generates a
          reception code and keeps the completed
          package locally until transfer succeeds.
        </p>

      </div>

    </section>
  `;
}

function archivePage() {
  const transferred = state.localSittings.filter(
    (sitting) => sitting.status === "TRANSFERRED",
  );

  return `
    <div class="page-heading">

      <div>
        <div class="eyebrow">
          LOCAL RECORD
        </div>

        <h1>
          Archive
        </h1>

        <p>
          Completed examination records retained
          on this device.
        </p>
      </div>

    </div>

    <section class="panel">

      <div class="panel-header">

        <div>
          <div class="panel-kicker">
            TRANSFERRED RECORDS
          </div>

          <h2>
            Archive
          </h2>
        </div>

        <span class="panel-badge">
          ${transferred.length} RECORDS
        </span>

      </div>

      ${
        transferred.length === 0
          ? `
            <div class="empty-page-state">
              <h3>No transferred examinations</h3>
              <p>
                Transferred examinations will appear here.
              </p>
            </div>
          `
          : `
            <div class="local-exam-list">

              ${transferred
                .map(
                  (sitting) => `
                    <div class="local-exam-card archive-card">

                      <div class="local-exam-card-main">

                        <div class="local-exam-kicker">
                          ${escapeHtml(
                            sitting.examinationName,
                          )}
                        </div>

                        <h3>
                          ${escapeHtml(
                            sitting.unitCode,
                          )}
                          —
                          ${escapeHtml(
                            sitting.unitName,
                          )}
                        </h3>

                        <div class="local-exam-meta">
                          <span>
                            ${escapeHtml(
                              sitting.courseCode,
                            )}
                            —
                            ${escapeHtml(
                              sitting.courseName,
                            )}
                          </span>

                          <span>
                            Year ${sitting.yearOfStudy}
                          </span>
                        </div>

                      </div>

                      <div class="local-exam-card-side">
                        <span
                          class="exam-status downloaded"
                        >
                          TRANSFERRED
                        </span>
                      </div>

                    </div>
                  `,
                )
                .join("")}

            </div>
          `
      }

    </section>
  `;
}

function sittingPage() {
  const sitting = getActiveSitting();

  if (!sitting) {
    state.page = "examinations";
    return examinationsPage();
  }

  const editable = sitting.status === "IN_PROGRESS";

  return `
    <div class="sitting-page">

      <div class="sitting-topbar">

        <button
          class="back-button"
          data-nav="examinations"
        >
          &lt; Back to Examinations
        </button>

      </div>

      <div class="sitting-heading">

        <div>

          <div class="eyebrow">
            EXAM SITTING
          </div>

          <h1>
            ${escapeHtml(sitting.unitCode)}
          </h1>

          <h2>
            ${escapeHtml(sitting.unitName)}
          </h2>

        </div>

        <span class="exam-status downloaded">
          ${statusLabel(sitting.status)}
        </span>

      </div>

      ${alerts()}

      <section class="sitting-details-grid">

        <div class="sitting-detail">
          <span>SCHOOL</span>
          <strong>
            ${escapeHtml(sitting.schoolName)}
          </strong>
        </div>

        <div class="sitting-detail">
          <span>DEPARTMENT</span>
          <strong>
            ${escapeHtml(sitting.departmentName)}
          </strong>
        </div>

        <div class="sitting-detail">
          <span>COURSE</span>
          <strong>
            ${escapeHtml(sitting.courseCode)}
          </strong>
          <small>
            ${escapeHtml(sitting.courseName)}
          </small>
        </div>

        <div class="sitting-detail">
          <span>YEAR OF STUDY</span>
          <strong>
            Year ${sitting.yearOfStudy}
          </strong>
        </div>

        <div class="sitting-detail">
          <span>EXAMINATION</span>
          <strong>
            ${escapeHtml(sitting.examinationName)}
          </strong>
        </div>

        <div class="sitting-detail">
          <span>UNIT</span>
          <strong>
            ${escapeHtml(sitting.unitCode)}
          </strong>
          <small>
            ${escapeHtml(sitting.unitName)}
          </small>
        </div>

        <div class="sitting-detail">
          <span>DATE</span>
          <strong>
            ${formatDate(sitting.startTime)}
          </strong>
        </div>

        <div class="sitting-detail">
          <span>TIME</span>
          <strong>
            ${formatTime(sitting.startTime)}
            —
            ${formatTime(sitting.endTime)}
          </strong>
        </div>

      </section>

      <section class="panel sitting-control-panel">

        <div class="panel-header">

          <div>
            <div class="panel-kicker">
              EXAM CONTROL
            </div>

            <h2>
              Examination Session
            </h2>
          </div>

        </div>

        <div class="sitting-control-body">

          ${
            sitting.status === "DOWNLOADED"
              ? `
                <div>
                  <strong class="control-title">
                    Ready to Start
                  </strong>

                  <p>
                    This examination is stored locally
                    and can now be conducted without
                    network access.
                  </p>
                </div>

                <button
                  id="start-examination"
                  class="primary-button"
                >
                  Start Examination
                </button>
              `
              : sitting.status === "IN_PROGRESS"
                ? `
                  <div>
                    <strong class="control-title">
                      Examination In Progress
                    </strong>

                    <p>
                      Booklet numbers are saved locally
                      as they are recorded.
                    </p>
                  </div>

                  <button
                    id="end-examination"
                    class="danger-button"
                  >
                    End Exam
                  </button>
                `
                : `
                  <div>
                    <strong class="control-title">
                      Examination
                      ${statusLabel(sitting.status)}
                    </strong>

                    <p>
                      The local examination session
                      is no longer editable.
                    </p>
                  </div>
                `
          }

        </div>

      </section>

      <section class="panel">

        <div class="panel-header">

          <div>
            <div class="panel-kicker">
              STUDENT ROSTER
            </div>

            <h2>
              ${state.students.length} Students
            </h2>
          </div>

          <span class="panel-badge">
            BOOKLET ACCOUNTABILITY
          </span>

        </div>

        <div class="roster-table-wrap">

          <table class="roster-table">

            <thead>
              <tr>
                <th>#</th>
                <th>Registration Number</th>
                <th>Student Name</th>
                <th>Booklet Number</th>
                <th>State</th>
              </tr>
            </thead>

            <tbody>

              ${state.students
                .map(
                  (student, index) => {
                    const entry =
                      getEntry(student.studentId);

                    return `
                      <tr>

                        <td>
                          ${index + 1}
                        </td>

                        <td class="mono roster-reg">
                          ${escapeHtml(
                            student.regNumber,
                          )}
                        </td>

                        <td class="student-name">
                          ${escapeHtml(
                            student.firstName,
                          )}
                          ${escapeHtml(
                            student.lastName,
                          )}
                        </td>

                        <td>

                          <div class="booklet-entry">

                            <input
                              class="booklet-input"
                              data-booklet-input="${escapeHtml(
                                student.studentId,
                              )}"
                              value="${escapeHtml(
                                entry?.bookletCode ?? "",
                              )}"
                              placeholder="Enter booklet no."
                              ${
                                editable
                                  ? ""
                                  : "disabled"
                              }
                            />

                            <button
                              class="save-booklet-button"
                              data-save-booklet="${escapeHtml(
                                student.studentId,
                              )}"
                              ${
                                editable
                                  ? ""
                                  : "disabled"
                              }
                            >
                              ${
                                state.savingStudentId ===
                                student.studentId
                                  ? "Saving..."
                                  : "Save"
                              }
                            </button>

                          </div>

                        </td>

                        <td>

                          ${
                            entry
                              ? `
                                <span class="recorded-badge">
                                  RECORDED
                                </span>
                              `
                              : `
                                <span class="pending-badge">
                                  PENDING
                                </span>
                              `
                          }

                        </td>

                      </tr>
                    `;
                  },
                )
                .join("")}

            </tbody>

          </table>

        </div>

      </section>

      <section class="panel reception-panel">

        <div class="panel-header">

          <div>
            <div class="panel-kicker">
              RECEPTION / TRANSFER
            </div>

            <h2>
              Offline Submission
            </h2>
          </div>

        </div>

        <div class="reception-body">

          <p>
            The offline device generates the reception
            code when the exam is ended and the
            submission is ready for transfer.
          </p>

          ${
            sitting.status === "ENDED" ||
            sitting.status === "TRANSFERRED"
              ? `
                <div class="reception-code-box">

                  <span>
                    RECEPTION CODE
                  </span>

                  <strong id="reception-code">
                    Loading...
                  </strong>

                </div>
              `
              : `
                <div class="reception-empty">
                  No reception code yet.
                </div>
              `
          }

        </div>

      </section>

    </div>
  `;
}

function render() {
  const app =
    document.querySelector<HTMLDivElement>("#app");

  if (!app) {
    return;
  }

  let content = "";

  switch (state.page) {
    case "dashboard":
      content = dashboardPage();
      break;

    case "examinations":
      content = examinationsPage();
      break;

    case "students":
      content = studentsPage();
      break;

    case "transfers":
      content = transfersPage();
      break;

    case "archive":
      content = archivePage();
      break;

    case "sitting":
      content = sittingPage();
      break;
  }

  app.innerHTML =
    state.page === "sitting"
      ? `<div class="app-shell">${content}</div>`
      : shell(content);

  attachHandlers();
}

function attachHandlers() {

  document
    .querySelectorAll<HTMLElement>("[data-nav]")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const page =
          button.dataset.nav as Page | undefined;

        if (page) {
          goTo(page);
        }

      });

    });

  document
    .querySelectorAll<HTMLElement>("[data-open-sitting]")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const sittingId =
          button.dataset.openSitting;

        if (sittingId) {
          void openSitting(sittingId);
        }

      });

    });

  document
    .querySelector<HTMLButtonElement>(
      "#download-examination",
    )
    ?.addEventListener(
      "click",
      handleDownload,
    );

  document
    .querySelector<HTMLButtonElement>(
      "#open-examination",
    )
    ?.addEventListener("click", () => {

      const sitting =
        state.localSittings[0];

      if (sitting) {
        void openSitting(sitting.id);
      }

    });

  document
    .querySelector<HTMLButtonElement>(
      "#start-examination",
    )
    ?.addEventListener(
      "click",
      handleStart,
    );

  document
    .querySelector<HTMLButtonElement>(
      "#end-examination",
    )
    ?.addEventListener(
      "click",
      handleEnd,
    );

  document
    .querySelectorAll<HTMLButtonElement>(
      "[data-save-booklet]",
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const studentId =
            button.dataset.saveBooklet;

          const sitting =
            getActiveSitting();

          if (!studentId || !sitting) {
            return;
          }

          const input =
            document.querySelector<HTMLInputElement>(
              `[data-booklet-input="${CSS.escape(
                studentId,
              )}"]`,
            );

          if (!input) {
            return;
          }

          const bookletCode =
            input.value.trim();

          if (!bookletCode) {
            state.error =
              "Enter a booklet number before saving.";

            state.message = null;

            render();

            return;
          }

          state.savingStudentId =
            studentId;

          state.error = null;
          state.message = null;

          render();

          try {

            await saveBookletEntry(
              sitting.id,
              studentId,
              bookletCode,
              true,
            );

            await loadActiveData();

            state.message =
              `Booklet ${bookletCode} saved locally for ${studentName(
                studentId,
              )}.`;

          } catch (error) {

            state.error =
              error instanceof Error
                ? error.message
                : "Unable to save booklet number.";

          } finally {

            state.savingStudentId = null;

          }

          render();

        },
      );

    });

  if (
    state.page === "sitting" &&
    (
      getActiveSitting()?.status === "ENDED" ||
      getActiveSitting()?.status === "TRANSFERRED"
    )
  ) {
    void loadReceptionCode();
  }
}

async function openSitting(
  sittingId: string,
) {

  state.activeSittingId =
    sittingId;

  state.page =
    "sitting";

  state.error = null;
  state.message = null;

  await loadActiveData();

  render();

  void loadReceptionCode();
}

async function loadActiveData() {

  if (!state.activeSittingId) {
    state.students = [];
    state.entries = [];
    return;
  }

  state.students =
    await getSittingStudents(
      state.activeSittingId,
    );

  state.entries =
    await getSittingBookletEntries(
      state.activeSittingId,
    );
}

function studentName(
  studentId: string,
) {

  const student =
    state.students.find(
      (item) =>
        item.studentId ===
        studentId,
    );

  return student
    ? `${student.firstName} ${student.lastName}`
    : "student";
}

async function handleStart() {

  const sitting =
    getActiveSitting();

  if (!sitting) {
    return;
  }

  try {

    await startSitting(
      sitting.id,
    );

    state.localSittings =
      await getLocalSittings();

    await loadActiveData();

    state.error = null;

    state.message =
      "Examination started. Booklet numbers can now be recorded offline.";

  } catch (error) {

    state.error =
      error instanceof Error
        ? error.message
        : "Unable to start examination.";

  }

  render();
}

async function handleEnd() {

  const sitting =
    getActiveSitting();

  if (!sitting) {
    return;
  }

  const confirmed =
    window.confirm(
      "End this examination? Booklet recording will be locked after this step.",
    );

  if (!confirmed) {
    return;
  }

  try {

    await endSitting(
      sitting.id,
    );

    state.localSittings =
      await getLocalSittings();

    await loadActiveData();

    state.error = null;

    state.message =
      "Exam ended. Reception package created locally.";

  } catch (error) {

    state.error =
      error instanceof Error
        ? error.message
        : "Unable to end examination.";

  }

  render();

  void loadReceptionCode();
}

async function loadReceptionCode() {

  const sitting =
    getActiveSitting();

  if (
    !sitting ||
    (
      sitting.status !== "ENDED" &&
      sitting.status !== "TRANSFERRED"
    )
  ) {
    return;
  }

  try {

    const batch =
      await getTransferBatch(
        sitting.id,
      );

    const code =
      document.querySelector<HTMLElement>(
        "#reception-code",
      );

    if (code) {
      code.textContent =
        batch?.receptionCode ??
        "NOT GENERATED";
    }

  } catch {

    const code =
      document.querySelector<HTMLElement>(
        "#reception-code",
      );

    if (code) {
      code.textContent =
        "NOT AVAILABLE";
    }

  }
}

async function loadDevice() {

  state.device =
    await getOrCreateDevice();

  state.localSittings =
    await getLocalSittings();

  if (state.localSittings.length) {

    state.activeSittingId =
      state.localSittings[0].id;

  }

  render();
}

async function handleDownload() {

  if (!state.device) {
    return;
  }

  state.loading = true;
  state.error = null;
  state.message = null;

  render();

  try {

    const response =
      await fetch(
        `${ADMIN_API_URL}/api/invigilator/sittings?deviceKey=${encodeURIComponent(
          state.device.deviceKey,
        )}`,
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ??
          "Unable to retrieve assigned examinations.",
      );
    }

    const sitting =
      data.sittings?.[0] as
        | ApiSitting
        | undefined;

    if (!sitting) {
      throw new Error(
        "No examination has been assigned to this device.",
      );
    }

    const apiDevice =
      data.device;

    if (!apiDevice) {
      throw new Error(
        "The central system did not return device information.",
      );
    }

    state.device = {
      ...state.device,

      name:
        apiDevice.name ??
        state.device.name,

      schoolId:
        apiDevice.schoolId ??
        null,

      departmentId:
        apiDevice.departmentId ??
        null,

      registered:
        true,
    };

    const localSitting:
      LocalSitting = {

      id:
        sitting.id,

      examPeriodId:
        sitting.examPeriodId,

      courseUnitId:
        sitting.courseUnitId,

      examinationName:
        sitting.examPeriod.name,

      academicYear:
        sitting.examPeriod.academicYear,

      semester:
        sitting.examPeriod.semester,

      schoolId:
        apiDevice.schoolId,

      schoolName:
        apiDevice.schoolName,

      departmentId:
        apiDevice.departmentId,

      departmentName:
        apiDevice.departmentName,

      courseId:
        sitting.courseUnit.course.id,

      courseCode:
        sitting.courseUnit.course.code,

      courseName:
        sitting.courseUnit.course.name,

      unitId:
        sitting.courseUnit.unit.id,

      unitCode:
        sitting.courseUnit.unit.code,

      unitName:
        sitting.courseUnit.unit.name,

      yearOfStudy:
        sitting.courseUnit.yearOfStudy,

      startTime:
        sitting.startTime,

      endTime:
        sitting.endTime,

      status:
        "DOWNLOADED",

      downloadedAt:
        new Date().toISOString(),

      startedAt:
        null,

      endedAt:
        null,
    };

    const students =
      sitting.courseUnit.course.students.map(
        (student) => ({

          id:
            crypto.randomUUID(),

          sittingId:
            sitting.id,

          studentId:
            student.id,

          regNumber:
            student.regNumber,

          firstName:
            student.firstName,

          lastName:
            student.lastName,

          present:
            true,

        }),
      );

    await downloadSitting(
      localSitting,
      students,
    );

    state.localSittings =
      await getLocalSittings();

    state.activeSittingId =
      localSitting.id;

    state.message =
      `${students.length} students downloaded automatically with ` +
      `${localSitting.courseCode}, Year ${localSitting.yearOfStudy}, ` +
      `${localSitting.unitCode}.`;

    state.page =
      "examinations";

  } catch (error) {

    state.error =
      error instanceof Error
        ? error.message
        : "Unable to download examination.";

  } finally {

    state.loading = false;

    render();

  }
}

function renderPage() {

  switch (state.page) {

    case "dashboard":
      return dashboardPage();

    case "examinations":
      return examinationsPage();

    case "students":
      return studentsPage();

    case "transfers":
      return transfersPage();

    case "archive":
      return archivePage();

    case "sitting":
      return sittingPage();

  }
}

function finalRender() {

  const app =
    document.querySelector<HTMLDivElement>(
      "#app",
    );

  if (!app) {
    return;
  }

  if (state.page === "sitting") {

    app.innerHTML = `
      <div class="app-shell">
        ${renderPage()}
      </div>
    `;

  } else {

    app.innerHTML =
      shell(renderPage());

  }

  attachHandlers();
}

const originalRender = render;

function render() {
  finalRender();
}

void loadDevice();