"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 3000;

export default function LiveRefresh({ version, nextReminderAt }: { version: number; nextReminderAt: string | null }) {
  const router = useRouter();
  const seen = useRef(version);
  const reminderDue = useRef<number | null>(null);

  useEffect(() => {
    seen.current = Math.max(seen.current, version);
  }, [version]);

  useEffect(() => {
    reminderDue.current = nextReminderAt ? new Date(nextReminderAt).getTime() : null;
  }, [nextReminderAt]);

  useEffect(() => {
    let stopped = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    async function check() {
      if (inFlight || document.visibilityState !== "visible") return;
      if (reminderDue.current !== null && Date.now() >= reminderDue.current) {
        reminderDue.current = null;
        router.refresh();
        return;
      }
      inFlight = true;
      try {
        const res = await fetch("/api/live", { cache: "no-store", signal: controller.signal });
        if (res.status === 401) {
          router.refresh();
          return;
        }
        if (!res.ok) return;
        const body = (await res.json()) as { version?: number };
        if (typeof body.version === "number" && body.version !== seen.current) {
          seen.current = body.version;
          router.refresh();
        }
      } catch {
        return;
      } finally {
        inFlight = false;
      }
    }

    function schedule() {
      timer = setTimeout(async () => {
        await check();
        if (!stopped) schedule();
      }, POLL_MS);
    }

    function onVisibility() {
      if (document.visibilityState === "visible") void check();
    }

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}
