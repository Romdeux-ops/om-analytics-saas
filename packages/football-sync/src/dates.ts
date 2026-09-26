const PARIS_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-15T19:00Z" → "2026-10-15T21:00:00+02:00" (format attendu par CalendarFixture.date). */
export function toParisIso(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw new Error(`Date invalide : ${input}`);

  const parts = Object.fromEntries(
    PARIS_PARTS.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<Intl.DateTimeFormatPartTypes, string>;

  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMinutes = Math.round((localAsUtc - date.getTime()) / 60_000);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Année de début de saison : 2026 pour 2026-2027 (bascule au 1er juillet). */
export function currentSeasonYear(now = new Date()): number {
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}
