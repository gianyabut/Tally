"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Role, YearSettings } from "@/lib/types";
import type { Balances } from "@/lib/ledger/balances";
import type { Entry, Holiday } from "@/lib/ledger/types";
import type { NextHoliday } from "@/lib/data/ledger";
import type { NotificationItem } from "@/lib/data/team";

// ---------- App data (server-fetched, provided to the whole app subtree) ----------
export type AppData = {
  year: number;
  yearSettings: YearSettings | null;
  entries: Entry[];
  holidays: Holiday[];
  balances: Balances;
  nextHoliday: NextHoliday;
  role: Role;
  teamName: string;
  notifications: NotificationItem[];
};

const AppDataContext = createContext<AppData | null>(null);
export function useAppData(): AppData {
  const v = useContext(AppDataContext);
  if (!v) throw new Error("useAppData must be used within AppRuntime");
  return v;
}

// ---------- Modals ----------
export type ModalKind =
  | "palette"
  | "log"
  | "leave"
  | "proof"
  | "invite"
  | "notif"
  | null;

/** `top` = the page's scroll offset when the modal opened: overlays are
 *  positioned inside the app frame (like the design) at that offset. */
type ModalState = { kind: ModalKind; entry?: Entry; top: number };

type ModalCtx = {
  modal: ModalState;
  open: (kind: Exclude<ModalKind, null>, opts?: { entry?: Entry }) => void;
  close: () => void;
};
const ModalContext = createContext<ModalCtx | null>(null);
export function useModal(): ModalCtx {
  const v = useContext(ModalContext);
  if (!v) throw new Error("useModal must be used within AppRuntime");
  return v;
}

// ---------- Toasts ----------
// One toast at a time, as in the design: a new message replaces the current.
type ToastCtx = { toast: string | null; showToast: (msg: string) => void };
const ToastContext = createContext<ToastCtx | null>(null);
export function useToast(): ToastCtx {
  const v = useContext(ToastContext);
  if (!v) throw new Error("useToast must be used within AppRuntime");
  return v;
}

/** Arrival toasts for redirects that carry `?welcome=<code>`. */
function welcomeMessage(code: string, teamName: string, year: number) {
  if (code === "joined") return `You joined ${teamName} — ${year} ledger ready`;
  if (code === "moved") return `You joined ${teamName} — ledger moved into the team`;
  if (code === "solo") return "Personal workspace ready";
  if (code === "skip") return "Personal workspace ready — invite workmates anytime";
  if (code === "invites-failed") return "Workspace ready — invites not sent, retry from Team";
  const n = /^invited-(\d+)$/.exec(code)?.[1];
  if (n) return `Workspace ready — ${n} ${n === "1" ? "invite" : "invites"} sent`;
  return null;
}

export function AppRuntime({
  data,
  children,
}: {
  data: AppData;
  children: React.ReactNode;
}) {
  const [modal, setModal] = useState<ModalState>({ kind: null, top: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback(
    (kind: Exclude<ModalKind, null>, opts?: { entry?: Entry }) =>
      setModal((m) => ({ kind, entry: opts?.entry, top: m.kind ? m.top : window.scrollY })),
    [],
  );
  const close = useCallback(() => setModal({ kind: null, top: 0 }), []);

  // Lock page scroll while an overlay is open, padding for the vanished
  // scrollbar so the page doesn't shift sideways.
  const anyOpen = modal.kind !== null;
  useEffect(() => {
    if (!anyOpen) return;
    const html = document.documentElement;
    const scrollbar = window.innerWidth - html.clientWidth;
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
    html.style.overflow = "hidden";
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;
    return () => {
      html.style.overflow = prev.overflow;
      html.style.paddingRight = prev.paddingRight;
    };
  }, [anyOpen]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Keyboard: ⌘K / Ctrl-K opens the palette; Esc closes any modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModal((m) => (m.kind ? m : { kind: "palette", top: window.scrollY }));
      } else if (e.key === "Escape") {
        setModal({ kind: null, top: 0 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // One-shot arrival toast (?welcome=…), then strip the param from the URL.
  const { teamName, year } = data;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("welcome");
    if (!code) return;
    params.delete("welcome");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
    );
    const msg = welcomeMessage(code, teamName, year);
    if (msg) setTimeout(() => showToast(msg), 0);
  }, [showToast, teamName, year]);

  const modalCtx = useMemo(() => ({ modal, open, close }), [modal, open, close]);
  const toastCtx = useMemo(() => ({ toast, showToast }), [toast, showToast]);

  return (
    <AppDataContext.Provider value={data}>
      <ModalContext.Provider value={modalCtx}>
        <ToastContext.Provider value={toastCtx}>
          {children}
        </ToastContext.Provider>
      </ModalContext.Provider>
    </AppDataContext.Provider>
  );
}
