export type ArchivedExam = {
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
  receptionCode: string;
  status: "READY FOR TRANSFER" | "TRANSFERRED";
  presentCount: number;
  absentCount: number;
  bookletCount: number;
  missingBookletCount: number;
};

type Props = {
  examinations: ArchivedExam[];
  onBack: () => void;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderArchivePage({
  examinations,
}: Props): string {
  return `
    <section class="page-section">

      <div class="page-header">

        <div>
          <h1>Offline Archive</h1>
          <p>
            Completed examinations stored on this
            device before transfer.
          </p>
        </div>

        <button
          type="button"
          class="back-button"
          id="archive-back"
        >
          Back
        </button>

      </div>

      ${
        examinations.length === 0
          ? `
            <div class="empty-state">

              <h2>No Archived Examinations</h2>

              <p>
                Completed examinations will appear
                here after End Exam.
              </p>

            </div>
          `
          : `
            <div class="archive-list">

              ${examinations
                .map(
                  (exam) => `
                    <article class="archive-card">

                      <div class="archive-card-header">

                        <div>

                          <span class="exam-code">
                            ${escapeHtml(exam.unitCode)}
                          </span>

                          <h2>
                            ${escapeHtml(exam.unitName)}
                          </h2>

                          <p>
                            ${escapeHtml(exam.courseCode)}
                            &mdash;
                            ${escapeHtml(exam.courseName)}
                          </p>

                        </div>

                        <span class="status-badge">
                          ${escapeHtml(exam.status)}
                        </span>

                      </div>

                      <div class="archive-details">

                        <div>
                          <span>Examination</span>
                          <strong>
                            ${escapeHtml(exam.examinationName)}
                          </strong>
                        </div>

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

                        <div>
                          <span>Exam Time</span>
                          <strong>
                            ${escapeHtml(exam.startTime)}
                            &mdash;
                            ${escapeHtml(exam.endTime)}
                          </strong>
                        </div>

                      </div>

                      <div class="archive-summary">

                        <div>
                          <span>Present</span>
                          <strong>
                            ${exam.presentCount}
                          </strong>
                        </div>

                        <div>
                          <span>Absent</span>
                          <strong>
                            ${exam.absentCount}
                          </strong>
                        </div>

                        <div>
                          <span>Booklets Recorded</span>
                          <strong>
                            ${exam.bookletCount}
                          </strong>
                        </div>

                        <div>
                          <span>Booklets Missing</span>
                          <strong>
                            ${exam.missingBookletCount}
                          </strong>
                        </div>

                      </div>

                      <div class="archive-footer">

                        <div>
                          <span>Reception Code</span>
                          <strong>
                            ${escapeHtml(exam.receptionCode)}
                          </strong>
                        </div>

                        <span class="archive-local">
                          Stored Offline
                        </span>

                      </div>

                    </article>
                  `
                )
                .join("")}

            </div>
          `
      }

    </section>
  `;
}

export function bindArchiveEvents(
  onBack: () => void
): void {
  const button =
    document.getElementById("archive-back");

  if (!button) {
    return;
  }

  button.addEventListener("click", onBack);
}