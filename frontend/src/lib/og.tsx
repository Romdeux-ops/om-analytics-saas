import { BRAND_COLORS } from "@/src/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

const DISPLAY_FONT = { name: "Big Shoulders", weight: 900 } as const;
const BODY_FONT = { name: "JetBrains Mono", weight: 500 } as const;
const STATIC_TEXT = "OM Analytics Droit au but. contre";

/**
 * Sous-ensemble Google Fonts limité au texte rendu.
 * Satori ne lit pas le woff2 : Google renvoie du TrueType à un client sans user-agent navigateur.
 */
async function loadGoogleFont(font: { name: string; weight: number }, text: string): Promise<ArrayBuffer | null> {
  try {
    const params = new URLSearchParams({ family: `${font.name}:wght@${font.weight}`, text });
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${params}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/**
 * Options d'ImageResponse avec les polices du site. `texts` doit couvrir tout le texte variable
 * de l'image : un caractère absent du sous-ensemble serait rendu dans une autre police.
 * Sans réseau, on retombe sur la police par défaut de Satori.
 */
export async function ogOptions(size: { width: number; height: number }, texts: string[] = []) {
  const all = [STATIC_TEXT, ...texts].join(" ");
  const subset = `${all} ${all.toUpperCase()}`;
  const [display, body] = await Promise.all([loadGoogleFont(DISPLAY_FONT, subset), loadGoogleFont(BODY_FONT, subset)]);
  if (!display || !body) return size;
  return {
    ...size,
    fonts: [
      { name: DISPLAY_FONT.name, data: display, weight: DISPLAY_FONT.weight, style: "normal" as const },
      { name: BODY_FONT.name, data: body, weight: BODY_FONT.weight, style: "normal" as const },
    ],
  };
}

const display = { fontFamily: DISPLAY_FONT.name, fontWeight: DISPLAY_FONT.weight } as const;
const body = { fontFamily: BODY_FONT.name, fontWeight: BODY_FONT.weight } as const;

/** Pastille « OM » de l'en-tête, réutilisée pour les icônes. */
export function BrandMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_COLORS.accent,
        color: BRAND_COLORS.ink,
        fontSize: size * 0.6,
        ...display,
      }}
    >
      OM
    </div>
  );
}

interface MatchCardProps {
  kicker: string;
  home: string;
  away: string;
  footer: string;
}

/** Affiche « Domicile contre Extérieur » façon programme de match. */
export function MatchCard({ kicker, home, away, footer }: MatchCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: BRAND_COLORS.paper,
        color: BRAND_COLORS.ink,
        borderTop: `24px solid ${BRAND_COLORS.ink}`,
        ...body,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              background: BRAND_COLORS.accent,
              fontSize: 44,
              ...display,
            }}
          >
            OM
          </div>
          <span style={{ fontSize: 52, ...display }}>Analytics</span>
        </div>
        <span style={{ textTransform: "uppercase", letterSpacing: 2, opacity: 0.7 }}>{kicker}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.9 }}>
        <span style={{ fontSize: 150, textTransform: "uppercase", ...display }}>{home}</span>
        <span style={{ fontSize: 32, opacity: 0.6, margin: "12px 0" }}>contre</span>
        <span style={{ fontSize: 150, textTransform: "uppercase", color: BRAND_COLORS.accent, ...display }}>{away}</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: `4px solid ${BRAND_COLORS.ink}`,
          paddingTop: 20,
          fontSize: 26,
        }}
      >
        <span>{footer}</span>
        <span style={{ fontSize: 40, textTransform: "uppercase", ...display }}>Droit au but.</span>
      </div>
    </div>
  );
}

/** Carte par défaut quand aucun match n'est programmé. */
export function DefaultCard({ subtitle }: { subtitle: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 64,
        background: BRAND_COLORS.ink,
        color: BRAND_COLORS.paper,
        ...body,
      }}
    >
      <div style={{ display: "flex", fontSize: 200, lineHeight: 0.9, textTransform: "uppercase", ...display }}>
        <span>OM</span>
        <span style={{ color: BRAND_COLORS.accent, marginLeft: 36 }}>Analytics</span>
      </div>
      <span style={{ fontSize: 32, marginTop: 32, opacity: 0.8 }}>{subtitle}</span>
    </div>
  );
}

const PARIS_TZ = "Europe/Paris";

export function formatKickoff(date: Date, timeTbd = false): string {
  const day = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: PARIS_TZ,
  }).format(date);
  if (timeTbd) return `${day} · horaire à confirmer`;
  const hour = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: PARIS_TZ }).format(date);
  return `${day} · ${hour}`;
}
