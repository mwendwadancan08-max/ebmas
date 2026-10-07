export type Examination = {
  id: string;
  examinationName: string;
  academicYear: string;
  semester: string;
  schoolName: string;
  departmentName: string;
  courseCode: string;
  courseName: string;
  unitCode: string;
  unitName: string;
  yearOfStudy: number;
  startTime: string;
  endTime: string;
  status: string;
};

type Props = {
  examinations: Examination[];
  onOpen: (examination: Examination) => void;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderExaminationsPage({
  examinations,
}: Props): string {
  if (examinations.length === 0) {
    return `
      <section class="page-section">

        <div class="page-header">
          <div>
            <h1>Examinations</h1>
            <p>
              Downloaded examination sittings available
              on this device.
            </p>
          </div>
        </div>

        <div class="empty-state">
          <h2>No Examinations</h2>
          <p>
            No examination has been downloaded to
            this invigilator device yet.
          </p>
        </div>

      </section>
    `;
  }

  return `
    <section class="page-section">

      <div class="page-header">

        <div>
          <h1>Examinations</h1>
          <p>
            Examination sittings downloaded to this device.
          </p>
        </div>

        <div class="page-count">
          ${examinations.length}
          ${examinations.length === 1
            ? "examination"
            : "examinations"}
        </div>

      </div>

      <div class="examination-list">

        ${examinations
          .map(
            (exam) => `
              <article class="examination-card">

                <div class="examination-card-header">

                  <div>

                    <div class="exam-code">
                      ${escapeHtml(exam.unitCode)}
                    </div>

                    <h2>
                      ${escapeHtml(exam.unitName)}
                    </h2>

                    <p class="exam-course">
                      ${escapeHtml(exam.courseCode)}
                      &mdash;
                      ${escapeHtml(exam.courseName)}
                    </p>

                  </div>

                  <span class="status-badge">
                    ${escapeHtml(exam.status)}
                  </span>

                </div>

                <div class="exam-details">

                  <div>
                    <span>School</span>
                    <strong>
                      ${escapeHtml(exam.schoolName)}
                    </strong>
                  </div>

                  <div>
                    <span>Department</span>
                    <strong>
                      ${escapeHtml(exam.departmentName)}
                    </strong>
                  </div>

                  <div>
                    <span>Year of Study</span>
                    <strong>
                      Year ${exam.yearOfStudy}
                    </strong>
                  </div>

                  <div>
                    <span>Semester</span>
                    <strong>
                      ${escapeHtml(exam.semester)}
                    </strong>
                  </div>

                </div>

                <div class="exam-actions">

                  <button
                    type="button"
                    class="primary-button"
                    data-open-examination="${escapeHtml(exam.id)}"
                  >
                    Open Examination
                  </button>

                </div>

              </article>
            `
          )
          .join("")}

      </div>

    </section>
  `;
}

export function bindExaminationsEvents(
  examinations: Examination[],
  onOpen: (examination: Examination) => void
): void {
  document
    .querySelectorAll<HTMLButtonElement>(
      "[data-open-examination]"
    )
    .forEach((button) => {

      button.addEventListener("click", () => {

        const id =
          button.dataset.openExamination;

        if (!id) {
          return;
        }

        const examination =
          examinations.find(
            (exam) => exam.id === id
          );

        if (!examination) {
          return;
        }

        onOpen(examination);
      });

    });
}