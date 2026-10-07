import type { LocalDevice, LocalSitting } from "../lib/rna-db";

type Props = {
  device: LocalDevice | null;
  localSittings: LocalSitting[];
  onOpenExaminations?: () => void;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function renderDashboardPage({
  device,
  localSittings,
}: Props): string {
  const sitting = localSittings[0];

  return `
    <main class="dashboard-page">

      <header class="dashboard-header">
        <div>
          <div class="dashboard-kicker">DEVICE CONTROL</div>
          <h1>Examination Operations</h1>
          <p>
            Manage assigned examinations, work offline, record booklet
            accountability and transfer completed examination data.
          </p>
        </div>

        <div class="dashboard-mode">
          <span class="dashboard-mode-dot"></span>
          <div>
            <strong>RNA LOCAL MODE</strong>
            <span>Ready for offline operation</span>
          </div>
        </div>
      </header>

      <section class="dashboard-grid">

        <article class="dashboard-card">
          <div class="dashboard-card-title">
            <div>
              <span class="dashboard-label">DEVICE</span>
              <h2>Device Information</h2>
            </div>
            <span class="dashboard-chip">RNA</span>
          </div>

          <div class="dashboard-fields">

            <div class="dashboard-field">
              <span>Device Name</span>
              <strong>
                ${escapeHtml(device?.name ?? "Unregistered Device")}
              </strong>
            </div>

            <div class="dashboard-field">
              <span>Device Key</span>
              <strong class="dashboard-code">
                ${escapeHtml(device?.deviceKey ?? "DEVICE-PENDING")}
              </strong>
            </div>

            <div class="dashboard-field">
              <span>Registration</span>
              <strong class="${
                device?.registered
                  ? "dashboard-success"
                  : "dashboard-warning"
              }">
                ${device?.registered ? "REGISTERED" : "NOT REGISTERED"}
              </strong>
            </div>

          </div>

          <div class="dashboard-note">
            ${
              device?.registered
                ? "This device is paired with its assigned school and department."
                : "This device has not yet been registered by the central examination administrator."
            }
          </div>
        </article>

        <article class="dashboard-card">
          <div class="dashboard-card-title">
            <div>
              <span class="dashboard-label">LOCAL STORAGE</span>
              <h2>RNA Storage</h2>
            </div>
            <span class="dashboard-chip dashboard-chip-dark">PERSISTENT</span>
          </div>

          <p class="dashboard-description">
            Examination data is stored locally before work begins,
            allowing the device to continue operating without a network.
          </p>

          <div class="dashboard-storage-grid">
            <div>
              <strong>DEVICE</strong>
              <span>Persistent</span>
            </div>

            <div>
              <strong>SITTINGS</strong>
              <span>${localSittings.length} Local</span>
            </div>

            <div>
              <strong>STUDENTS</strong>
              <span>${sitting ? "Downloaded" : "Waiting"}</span>
            </div>

            <div>
              <strong>BOOKLETS</strong>
              <span>Local Recording</span>
            </div>
          </div>
        </article>

      </section>

      <section class="dashboard-card dashboard-examination">

        <div class="dashboard-card-title">
          <div>
            <span class="dashboard-label">CENTRAL EXAMINATION SYSTEM</span>
            <h2>
              ${sitting ? "Downloaded Examination" : "No Examination Downloaded"}
            </h2>
          </div>

          <span class="dashboard-status ${
            sitting ? "dashboard-status-active" : "dashboard-status-ready"
          }">
            ${sitting ? statusLabel(sitting.status) : "READY"}
          </span>
        </div>

        ${
          sitting
            ? `
              <div class="dashboard-exam-main">

                <div class="dashboard-exam-heading">
                  <span>${escapeHtml(sitting.examinationName)}</span>
                  <h3>${escapeHtml(sitting.unitCode)}</h3>
                  <p>${escapeHtml(sitting.unitName)}</p>
                </div>

                <div class="dashboard-exam-meta">

                  <div>
                    <span>COURSE</span>
                    <strong>${escapeHtml(sitting.courseCode)}</strong>
                    <small>${escapeHtml(sitting.courseName)}</small>
                  </div>

                  <div>
                    <span>YEAR OF STUDY</span>
                    <strong>${sitting.yearOfStudy}</strong>
                    <small>Academic year</small>
                  </div>

                  <div>
                    <span>SEMESTER</span>
                    <strong>${escapeHtml(sitting.semester)}</strong>
                    <small>Examination period</small>
                  </div>

                </div>

              </div>
            `
            : `
              <div class="dashboard-empty">
                No examination has been downloaded to this device.
              </div>
            `
        }

      </section>

    </main>
  `;
}