"use client";

import { ErrorFallback } from "@/src/components/ui/ErrorFallback";

export default function RootError({ reset }: { reset: () => void }) {
  return <ErrorFallback reset={reset} />;
}
