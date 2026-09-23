"use client";

import { useEffect } from "react";

/**
 * Close a popover when a pointer goes down outside any element marked
 * `data-popover-root`. Used instead of a full-screen click-catcher, which as a
 * fixed layer would knock the popover's text off ClearType.
 */
export function useOutsideClose(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest("[data-popover-root]")) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);
}
