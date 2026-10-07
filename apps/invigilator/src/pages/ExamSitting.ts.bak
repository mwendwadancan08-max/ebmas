export type SittingStudent = {
  studentId: string;
  regNumber: string;
  firstName: string;
  lastName: string;
  present: boolean;
  bookletCode?: string;
};

export type ExamSitting = {
  id: string;
  examinationName: string;
  schoolName: string;
  departmentName: string;
  courseCode: string;
  courseName: string;
  unitCode: string;
  unitName: string;
  yearOfStudy: number;
  semester: string;
  startTime: string;
  endTime: string;
  status: "DOWNLOADED" | "IN_PROGRESS" | "ENDED" | "TRANSFERRED";
  receptionCode?: string;
  students: SittingStudent[];
};

type Props = {
  sitting: ExamSitting;
  onBack: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  onSaveBooklet?: (
    studentId: string,
    bookletCode: string,
    present: boolean
  ) => void;
  onSaveAttendance?: (
    studentId: string,
    present: boolean
  ) => void;
  onSaveAttendance?: (
    studentId: string,
    present: boolean
  ) => void;
};

export function renderExamSittingPage({
  sitting,
  onBack,
  onStart,
  onEnd,
  onSaveBooklet,
}: Props): string {
  const statusLabel =
    sitting.status === "DOWNLOADED"
      ? "READY"
      : sitting.status;

  return `
    <section class="sitting-page">

      <div class="sitting-topbar">
        <button class="back-button" id="back-to-examinations">
          Back to Examinations
        </button>

        <span class="status-badge">
          ${statusLabel}
        </span>
      </div>

      <div class="sitting-heading">
        <p class="exam-code">${sitting.unitCode}</p>
        <h1>${sitting.unitName}</h1>
        <p>${sitting.courseCode} Ã¢â‚¬â€ ${sitting.courseName}</p>
      </div>

      <div class="sitting-grid">

        <section class="info-panel">
          <h2>Examination Details</h2>

          <div class="info-list">
            <div>
              <span>Examination</span>
              <strong>${sitting.examinationName}</strong>
            </div>

            <div>
              <span>School</span>
              <strong>${sitting.schoolName}</strong>
            </div>

            <div>
              <span>Department</span>
              <strong>${sitting.departmentName}</strong>
            </div>

            <div>
              <span>Course</span>
              <strong>${sitting.courseCode} Ã¢â‚¬â€ ${sitting.courseName}</strong>
            </div>

            <div>
              <span>Year of Study</span>
              <strong>Year ${sitting.yearOfStudy}</strong>
            </div>

            <div>
              <span>Semester</span>
              <strong>${sitting.semester}</strong>
            </div>

            <div>
              <span>Exam Time</span>
              <strong>
                ${sitting.startTime} Ã¢â‚¬â€ ${sitting.endTime}
              </strong>
            </div>
          </div>
        </section>

        <section class="info-panel">
          <h2>Exam Control</h2>

          <p>
            This examination is controlled by the registered
            invigilator device.
          </p>

          <div class="control-actions">

            ${
              sitting.status === "DOWNLOADED"
                ? `
                  <button class="primary-button" id="start-exam">
                    Start Exam
                  </button>
                `
                : ""
            }

            ${
              sitting.status === "IN_PROGRESS"
                ? `
                  <button class="danger-button" id="end-exam">
                    End Exam
                  </button>
                `
                : ""
            }

            ${
              sitting.status === "ENDED"
                ? `
                  <div class="reception-box">
                    <span>Reception Code</span>
                    <strong>
                      ${sitting.receptionCode || "GENERATED OFFLINE"}
                    </strong>
                    <p>
                      Submit this code when the examination is
                      received by the central system.
                    </p>
                  </div>
                `
                : ""
            }

            ${
              sitting.status === "TRANSFERRED"
                ? `
                  <div class="success-box">
                    Examination transferred successfully.
                  </div>
                `
                : ""
            }

          </div>
        </section>

      </div>

      <section class="roster-panel">
        <div class="panel-heading">
          <div>
            <h2>Student Roster</h2>
            <p>
              ${sitting.students.length} student${sitting.students.length === 1 ? "" : "s"}
              registered for this examination.
            </p>
          </div>
        </div>

        <div class="roster-table-wrapper">
          <table class="roster-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Registration Number</th>
                <th>Student Name</th>
                <th>Present</th>
                <th>Booklet Number</th>
              </tr>
            </thead>

            <tbody>
              ${
                sitting.students.length
                  ? sitting.students
                      .map(
                        (student, index) => `
                          <tr>
                            <td>${index + 1}</td>

                            <td>
                              ${student.regNumber}
                            </td>

                            <td>
                              ${student.lastName} ${student.firstName}
                            </td>

                            <td>
                              <input
                                type="checkbox"
                                class="student-present"
                                data-student-id="${student.studentId}"
                                ${student.present ? "checked" : ""}
                                ${
                                  sitting.status !== "IN_PROGRESS"
                                    ? "disabled"
                                    : ""
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="text"
                                class="booklet-input"
                                data-student-id="${student.studentId}"
                                value="${student.bookletCode || ""}"
                                placeholder="Booklet number"
                                ${
                                  sitting.status !== "IN_PROGRESS"
                                    ? "disabled"
                                    : ""
                                }
                              />
                            </td>
                          </tr>
                        `
                      )
                      .join("")
                  : `
                    <tr>
                      <td colspan="5" class="empty-table">
                        No students downloaded for this sitting.
                      </td>
                    </tr>
                  `
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="reception-panel">
        <h2>Reception / Transfer</h2>

        ${
          sitting.status === "ENDED"
            ? `
              <p>
                The examination has ended on the offline device.
                The reception code identifies this submission for
                transfer into the central system.
              </p>
            `
            : `
              <p>
                Reception information will become available after
                the examination is ended on the invigilator device.
              </p>
            `
        }
      </section>

    </section>
  `;
}

export function bindExamSittingEvents({
  onBack,
  onStart,
  onEnd,
  onSaveBooklet,
  onSaveAttendance,
}: Omit<Props, "sitting">) {
  document
    .getElementById("back-to-examinations")
    ?.addEventListener("click", onBack);

  document
    .getElementById("start-exam")
    ?.addEventListener("click", () => onStart?.());

  document
    .getElementById("end-exam")
    ?.addEventListener("click", () => onEnd?.());

  document.querySelectorAll<HTMLInputElement>(".student-present")
    .forEach((input) => {
      input.addEventListener("change", () => {
        const studentId = input.dataset.studentId;

        if (!studentId) return;

        onSaveAttendance?.(
          studentId,
          input.checked
        );
      });
    });
  document.querySelectorAll<HTMLInputElement>(".student-present")
    .forEach((input) => {
      input.addEventListener("change", () => {
        const studentId = input.dataset.studentId;

        if (!studentId) return;

        onSaveAttendance?.(
          studentId,
          input.checked
        );
      });
    });
  document.querySelectorAll<HTMLInputElement>(".booklet-input")
    .forEach((input) => {
      input.addEventListener("change", () => {
        const studentId = input.dataset.studentId;

        if (!studentId) return;

        const row = input.closest("tr");
        const presentInput =
          row?.querySelector<HTMLInputElement>(".student-present");

        onSaveBooklet?.(
          studentId,
          input.value.trim(),
          presentInput?.checked ?? true
        );
      });
    });
}