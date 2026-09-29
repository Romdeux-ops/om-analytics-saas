"use client";

import { ErrorFallback } from "@/src/components/ui/ErrorFallback";

export default function MainError({ reset }: { reset: () => void }) {
  return <ErrorFallback reset={reset} compact />;
}
