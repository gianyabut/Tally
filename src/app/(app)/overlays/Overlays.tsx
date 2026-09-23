"use client";

import { useModal } from "../runtime";
import { Toaster } from "./Toaster";
import { CommandPalette } from "./CommandPalette";
import { LogHolidayModal } from "./LogHolidayModal";
import { FileLeaveModal } from "./FileLeaveModal";
import { ProofViewer } from "./ProofViewer";

export function Overlays() {
  const { modal } = useModal();
  return (
    <>
      {modal.kind === "palette" && <CommandPalette />}
      {modal.kind === "log" && <LogHolidayModal />}
      {modal.kind === "leave" && <FileLeaveModal />}
      {modal.kind === "proof" && <ProofViewer />}
      <Toaster />
    </>
  );
}
