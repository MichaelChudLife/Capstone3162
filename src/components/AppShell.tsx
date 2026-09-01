import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="min-h-screen pl-[76px]">
        <div className="mx-auto max-w-5xl px-8 py-7">{children}</div>
      </main>
    </div>
  );
}
