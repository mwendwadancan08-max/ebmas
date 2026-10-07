type Props = {
  activePage: string;
  deviceName: string;
  deviceKey: string;
  registered: boolean;
  onNavigate: (page: string) => void;
  children: string;
};

const navigation = [
  ["dashboard", "Dashboard"],
  ["examinations", "Examinations"],
  ["students", "Students"],
  ["transfers", "Transfers"],
  ["archive", "Archive"],
] as const;

export function renderShell({
  activePage,
  deviceName,
  deviceKey,
  registered,
  children,
}: Props): string {
  return `
    <div class="app-shell">

      <aside class="sidebar">

        <div class="brand">
          <div class="brand-mark">E</div>

          <div class="brand-text">
            <strong>EBMAS</strong>
            <span>Examination Accountability</span>
          </div>
        </div>

        <div class="sidebar-divider"></div>

        <nav class="main-nav">
          ${navigation
            .map(
              ([page, label]) => `
                <button
                  type="button"
                  class="nav-item ${
                    activePage === page
                      ? "active"
                      : ""
                  }"
                  data-nav="${page}"
                >
                  ${label}
                </button>
              `
            )
            .join("")}
        </nav>

        <div class="sidebar-bottom">

          <div class="device-status">

            <span class="device-status-label">
              DEVICE
            </span>

            <strong>
              ${deviceName || "Invigilator Device"}
            </strong>

            <small>
              ${
                registered
                  ? "REGISTERED"
                  : "NOT REGISTERED"
              }
            </small>

            <code>${deviceKey}</code>

          </div>

          <div class="dbc-brand">
            <span>Developed by</span>
            <strong>DBC.tech</strong>
          </div>

        </div>

      </aside>

      <main class="main-area">

        <header class="top-header">

          <div>
            <span class="system-label">
              EXAMINATION MANAGEMENT SYSTEM
            </span>

            <h1>EBMAS</h1>
          </div>

          <div class="header-status">
            <span class="online-dot"></span>
            Offline-first device
          </div>

        </header>

        <div class="page-content">
          ${children}
        </div>

        <footer class="app-footer">
          <span>
            EBMAS — Examination Booklet Management & Accountability System
          </span>

          <strong>DBC.tech</strong>
        </footer>

      </main>

    </div>
  `;
}

export function bindShellEvents(
  onNavigate: (page: string) => void
): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-nav]")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const page =
          button.dataset.nav;

        if (!page) {
          return;
        }

        onNavigate(page);
      });

    });
}