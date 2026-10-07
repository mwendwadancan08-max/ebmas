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

export function renderExaminationsPage({
  examinations,
  onOpen,
}: Props): string {
  if (examinations.length === 0) {
    return `
      <section class="page-section">
        <div class="page-header">
          <div>
            <h1>Examinations</h1>
            <p>Downloaded examination sittings available on this device.</p>
          </div>
        </div>

        <div class="empty-state">
          <h2>No Examinations</h2>
          <p>
            No examination has been downloaded to this invigilator device yet.
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
          <p>Examination sittings downloaded to this device.</p>
        </div>

        <div class="page-count">
          ${examinations.length} examination${examinations.length === 1 ? "" : "s"}
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
                      ${exam.unitCode}
                    </div>

                    <h2>${exam.unitName}</h2>

                    <p class="exam-course">
                      ${exam.courseCode} — ${exam.courseName}
                    </p>
                  </div>

                  <span class="status-badge">
                    ${exam.status}
                  </span>
                </div>

                <div class="exam-details">
                  <div>
                    <span>School</span>
                    <strong>${exam.schoolName}</strong>
                  </div>

                  <div>
                    <span>Department</span>
                    <strong>${exam.departmentName}</strong>
                  </div>

                  <div>
                    <span>Year of Study</span>
                    <strong>Year ${exam.yearOfStudy}</strong>
                  </div>

                  <div>
                    <span>Semester</span>
                    <strong>${exam.semester}</strong>
                  </div>
                </div>

                <div class="exam-actions">
                  <button
                    class="primary-button"
                    data-open-examination="${exam.id}"
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