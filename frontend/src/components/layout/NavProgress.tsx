"use client";

import { useLinkStatus } from "next/link";

export function NavProgress() {
  const { pending } = useLinkStatus();

  return (
    <span
      className="nav-progress"
      data-pending={pending ? "true" : undefined}
      aria-hidden
    />
  );
}
