type ShellProps = {
  page: string;
  deviceName: string;
  deviceKey: string;
};

export function renderTopbar(): string {
  return `
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
  `;
}

export function renderSidebar({
  page,
  deviceName,
  deviceKey,
}: ShellProps): string {
  return `
    <aside class="sidebar">

      <div class="sidebar-heading">
        WORKSPACE
      </div>

      <nav class="nav-list">

        <button
          class="nav-item ${page === "dashboard" ? "active" : ""}"
          data-nav="dashboard"
        >
          Dashboard
        </button>

        <button
          class="nav-item ${page === "examinations" ? "active" : ""}"
          data-nav="examinations"
        >
          Examinations
        </button>

        <button
          class="nav-item ${page === "students" ? "active" : ""}"
          data-nav="students"
        >
          Students
        </button>

        <button
          class="nav-item ${page === "transfers" ? "active" : ""}"
          data-nav="transfers"
        >
          Transfers
        </button>

        <button
          class="nav-item ${page === "archive" ? "active" : ""}"
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

          <div class="device-mini-name">
            ${deviceName}
          </div>

          <div class="device-mini-key">
            ${deviceKey}
          </div>

        </div>

      </div>

    </aside>
  `;
}