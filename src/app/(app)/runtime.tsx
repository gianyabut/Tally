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

type ModalState = { kind: ModalKind; entry?: Entry };

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
type Toast = { id: number; msg: string };
type ToastCtx = { toasts: Toast[]; showToast: (msg: string) => void };
const ToastContext = createContext<ToastCtx | null>(null);
export function useToast(): ToastCtx {
  const v = useContext(ToastContext);
  if (!v) throw new Error("useToast must be used within AppRuntime");
  return v;
}

export function AppRuntime({
  data,
  children,
}: {
  data: AppData;
  children: React.ReactNode;
}) {
  const [modal, setModal] = useState<ModalState>({ kind: null });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const open = useCallback(
    (kind: Exclude<ModalKind, null>, opts?: { entry?: Entry }) =>
      setModal({ kind, entry: opts?.entry }),
    [],
  );
  const close = useCallback(() => setModal({ kind: null }), []);

  const showToast = useCallback((msg: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      2600,
    );
  }, []);

  // Keyboard: ⌘K / Ctrl-K opens the palette; Esc closes any modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModal((m) => (m.kind ? m : { kind: "palette" }));
      } else if (e.key === "Escape") {
        setModal({ kind: null });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const modalCtx = useMemo(() => ({ modal, open, close }), [modal, open, close]);
  const toastCtx = useMemo(() => ({ toasts, showToast }), [toasts, showToast]);

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
