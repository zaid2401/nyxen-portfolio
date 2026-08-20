"use client";

import dynamic from "next/dynamic";
import { useSystem } from "@/components/system/system-provider";

/**
 * Lazily mounts the hidden archive.
 *
 * The archive is a dialog full of prose that most visitors never open, and it
 * should not cost a first-time visitor a single byte until they go looking for
 * it. Gating the import on the open flag means the chunk is requested at the
 * moment of the `sudo nyxen --secret`, not during the initial page load.
 *
 * `ssr: false` is correct here rather than merely convenient: it is opened by
 * client-side interaction and has no server-rendered state, so prerendering it
 * would be pure cost.
 */

const SecretArchive = dynamic(
  () =>
    import("@/components/easter-eggs/secret-archive").then(
      (mod) => mod.SecretArchive,
    ),
  { ssr: false },
);

export function OverlayHost() {
  const { archiveOpen } = useSystem();

  return <>{archiveOpen && <SecretArchive />}</>;
}
