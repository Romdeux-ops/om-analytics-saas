"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MAIN_ROUTES = ["/calendrier", "/classement", "/effectif", "/fan-zone"] as const;

/** Précharge les routes principales dès le montage pour des transitions instantanées. */
export function NavPrefetch() {
  const router = useRouter();

  useEffect(() => {
    for (const route of MAIN_ROUTES) {
      router.prefetch(route);
    }
  }, [router]);

  return null;
}
