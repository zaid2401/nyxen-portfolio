"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useSystem } from "@/components/system/system-provider";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog used for automation case details and project details.
 *
 * Does the four things a modal must actually do and that hand-rolled ones
 * usually miss: traps Tab within itself, closes on Escape, restores focus to
 * the trigger on close, and locks the page behind it.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  labelId,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  labelId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const { motionEnabled } = useSystem();

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) {
      restoreFocus.current?.focus?.();
      return;
    }

    restoreFocus.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [open, onKeyDown]);

  const duration = motionEnabled ? 0.22 : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          <div
            aria-hidden="true"
            onClick={onClose}
            className="bg-void/80 absolute inset-0 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            initial={{ opacity: 0, y: motionEnabled ? 18 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: motionEnabled ? 18 : 0 }}
            transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
            className="border-line-strong bg-raised relative flex max-h-[86vh] w-full max-w-2xl flex-col border shadow-2xl shadow-black/70"
          >
            <div className="border-line flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-7 sm:py-5">
              <div id={labelId} className="min-w-0">
                {title}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-dim hover:text-fg hover:border-line-strong -m-1 shrink-0 border border-transparent p-1.5 transition-colors"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
