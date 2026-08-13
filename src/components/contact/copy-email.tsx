"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copy-to-clipboard for the email address. Falls back silently if blocked. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard denied — the address is visible next to this button anyway.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-dim hover:text-accent shrink-0 p-1 transition-colors"
      aria-label={copied ? "Email address copied" : "Copy email address"}
    >
      {copied ? (
        <Check aria-hidden="true" className="text-accent h-3.5 w-3.5" />
      ) : (
        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
