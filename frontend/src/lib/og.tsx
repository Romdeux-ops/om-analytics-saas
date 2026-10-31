import { BRAND_COLORS } from "@/src/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

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
        fontSize: size * 0.5,
        fontWeight: 900,
        letterSpacing: -size * 0.02,
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
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              background: BRAND_COLORS.accent,
              fontSize: 36,
              fontWeight: 900,
            }}
          >
            OM
          </div>
          <span style={{ fontWeight: 800, fontSize: 36 }}>Analytics</span>
        </div>
        <span style={{ textTransform: "uppercase", letterSpacing: 2, opacity: 0.7 }}>{kicker}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", fontWeight: 900, lineHeight: 0.95 }}>
        <span style={{ fontSize: 120, textTransform: "uppercase" }}>{home}</span>
        <span style={{ fontSize: 48, fontStyle: "italic", fontWeight: 400, opacity: 0.6, margin: "12px 0" }}>
          contre
        </span>
        <span style={{ fontSize: 120, textTransform: "uppercase", color: BRAND_COLORS.accent }}>{away}</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: `4px solid ${BRAND_COLORS.ink}`,
          paddingTop: 20,
          fontSize: 30,
        }}
      >
        <span>{footer}</span>
        <span style={{ fontWeight: 800 }}>Droit au but.</span>
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
      }}
    >
      <div style={{ display: "flex", fontSize: 160, fontWeight: 900, lineHeight: 0.9 }}>
        <span>OM</span>
        <span style={{ color: BRAND_COLORS.accent, marginLeft: 36 }}>Analytics</span>
      </div>
      <span style={{ fontSize: 40, marginTop: 32, opacity: 0.8 }}>{subtitle}</span>
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
