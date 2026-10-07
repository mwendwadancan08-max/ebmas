type Props = {
  deviceName: string;
  deviceKey: string;
  registered: boolean;
  examinationCount: number;
  onExaminations: () => void;
};

export function renderDashboardPage({
  deviceName,
  deviceKey,
  registered,
  examinationCount,
}: Props): string {
  return `
    <section class="page-section dashboard-page">

      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Offline examination control and booklet accountability.</p>
        </div>
      </div>

      <div class="dashboard-grid">

        <section class="dashboard-card">
          <div class="card-heading">
            <span class="card-label">DEVICE</span>

            <span class="status-pill ${registered ? "status-registered" : "status-pending"}">
              ${registered ? "REGISTERED" : "NOT REGISTERED"}
            </span>
          </div>

          <h2>${deviceName || "Invigilator Device"}</h2>

          <div class="device-key-block">
            <span>Device Key</span>
            <strong>${deviceKey}</strong>
          </div>
        </section>

        <section class="dashboard-card">
          <div class="card-heading">
            <span class="card-label">EXAMINATION SYSTEM</span>
          </div>

          <div class="system-number">
            ${examinationCount}
          </div>

          <p class="system-description">
            examination${examinationCount === 1 ? "" : "s"} downloaded to this device.
          </p>

          <button
            class="primary-button"
            data-dashboard-examinations
          >
            Open Examinations
          </button>
        </section>

      </div>

    </section>
  `;
}

export function bindDashboardEvents(
  onExaminations: () => void
) {
  document
    .querySelector<HTMLButtonElement>("[data-dashboard-examinations]")
    ?.addEventListener("click", onExaminations);
}