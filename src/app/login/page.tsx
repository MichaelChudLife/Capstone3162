const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]";

function Flame() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--brand)">
        <path d="M14 2c.4 3-1.4 4.6-3 6.2S8.4 11.5 8.4 13.4a3.6 3.6 0 0 0 7.2 0c0-1.3-.4-2.3-1-3.3 2 1 3.4 3 3.4 5.3a6.9 6.9 0 1 1-13.8 0c0-3 1.8-5 3.5-6.7C13.2 5.5 13.7 4 14 2Z" />
      </svg>
    </div>
  );
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function LoginPage() {
  const features = [
    "Events and tasks in one shared workspace",
    "Deadline reminders before things slip",
    "Role-based access for the committee",
  ];

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[46%] flex-col justify-between p-12 text-[var(--sidebar-ink)] lg:flex" style={{ background: "var(--sidebar)" }}>
        <div className="flex items-center gap-3">
          <Flame />
          <div className="leading-tight">
            <div className="text-lg font-semibold text-white">CCA Hub</div>
            <div className="text-xs text-[var(--sidebar-muted)]">Committee Workspace</div>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold leading-tight text-white">One home for every committee deadline.</h1>
          <ul className="mt-8 space-y-3.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-[var(--sidebar-ink)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  <Check />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-[var(--sidebar-muted)]">Commerce &amp; Computing Association · Monash University</div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Flame />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Welcome back</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">Log in to the CCA committee workspace.</p>

          <div className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">Email</label>
              <input className={fieldClass} type="email" defaultValue="michael@cca.org.au" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--muted)]">Password</label>
                <span className="text-xs font-medium text-[var(--brand-strong)]">Forgot password?</span>
              </div>
              <input className={fieldClass} type="password" defaultValue="cca-committee-2026" />
            </div>

            <button className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-strong)]">
              Log in
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">Invite-only.</span> Ask a committee IT Admin for an invite. Sessions expire after 30 minutes of inactivity.
          </div>
        </div>
      </div>
    </div>
  );
}
