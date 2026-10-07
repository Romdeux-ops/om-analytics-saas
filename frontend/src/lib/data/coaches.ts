export interface CoachProfile {
  name: string;
  club: string;
  role: string;
  system: string;
  style: string;
  philosophy: string;
  age?: number;
  nationality?: string;
}

export const COACHES_DATABASE: Record<string, CoachProfile> = {
  Marseille: {
    name: "Bruno Génésio",
    club: "Olympique de Marseille",
    role: "Entraîneur principal",
    system: "4-2-3-1 / 4-3-3",
    style: "Transition rapide & maîtrise collective",
    philosophy:
      "Animation offensive rythmée, projection rapide des milieux dans les espaces libres, maîtrise technique et pressing coordonné à la perte du ballon.",
    age: 59,
    nationality: "Française",
  },
  "Paris-SG": {
    name: "Luis Enrique",
    club: "Paris Saint-Germain",
    role: "Entraîneur principal",
    system: "4-3-3",
    style: "Contrôle territorial & Gegenpressing",
    philosophy:
      "Possession écrasante, contre-pressing à haute intensité, ailiers provocateurs en un-contre-un et transitions fulgurantes.",
    age: 56,
    nationality: "Espagnole",
  },
  Monaco: {
    name: "Adi Hütter",
    club: "AS Monaco",
    role: "Entraîneur principal",
    system: "4-4-2 / 3-4-2-1",
    style: "Pressing vertical & intensité athlétique",
    philosophy:
      "Pressing tout-terrain étouffant, projection rapide en nombre dès la récupération et pistons très hauts.",
    age: 56,
    nationality: "Autrichienne",
  },
  Lyon: {
    name: "Pierre Sage",
    club: "Olympique Lyonnais",
    role: "Entraîneur principal",
    system: "4-3-3 / 4-2-3-1",
    style: "Équilibre tactique & verticalité ciblée",
    philosophy:
      "Circulation fluide, exploitation chirurgicale des demi-espaces et solidarité défensive retrouvée.",
    age: 47,
    nationality: "Française",
  },
  Lille: {
    name: "Bruno Génésio",
    club: "LOSC Lille",
    role: "Entraîneur principal",
    system: "4-2-3-1",
    style: "Transition rapide & maîtrise technique",
    philosophy:
      "Double pivot actif à la relance, projection des latéraux et capacité d'adaptation tactique contre les blocs bas.",
    age: 59,
    nationality: "Française",
  },
  Lens: {
    name: "Will Still",
    club: "RC Lens",
    role: "Entraîneur principal",
    system: "3-4-2-1",
    style: "Pression constante & intensité physique",
    philosophy:
      "Défense agressive en avançant, harcèlement du porteur et verticalité immédiate vers les attaquants de rupture.",
    age: 33,
    nationality: "Belge / Britannique",
  },
  Nice: {
    name: "Franck Haise",
    club: "OGC Nice",
    role: "Entraîneur principal",
    system: "3-4-3",
    style: "Organisation géométrique & transitions coupantes",
    philosophy:
      "Bloc compact hermétique, couverture mutuelle et utilisation maximale des couloirs extérieurs.",
    age: 55,
    nationality: "Française",
  },
  Rennes: {
    name: "Julien Stéphan",
    club: "Stade Rennais",
    role: "Entraîneur principal",
    system: "4-3-3",
    style: "Maîtrise collective & attaques placées",
    philosophy:
      "Animation offensive soignée, utilisation de la largeur et transitions appliquées.",
    age: 45,
    nationality: "Française",
  },
  Brest: {
    name: "Éric Roy",
    club: "Stade Brestois",
    role: "Entraîneur principal",
    system: "4-3-3",
    style: "Solidité collective & impact athlétique",
    philosophy:
      "Générosité maximale dans les replis, pressing compact et efficacité redoutable sur phases arrêtées.",
    age: 58,
    nationality: "Française",
  },
  Strasbourg: {
    name: "Liam Rosenior",
    club: "RC Strasbourg",
    role: "Entraîneur principal",
    system: "4-2-3-1",
    style: "Construction patiente & audace de la jeunesse",
    philosophy:
      "Relance progressive sous pression, liberté accordée aux jeunes ailiers et pressing modulable.",
    age: 41,
    nationality: "Britannique",
  },
  Toulouse: {
    name: "Carles Martinez Novell",
    club: "Toulouse FC",
    role: "Entraîneur principal",
    system: "4-3-3",
    style: "Jeu associatif & dynamisme collectif",
    philosophy:
      "Inspiration barcelonaise, recherche constante de lignes de passe intérieures et pressing coordonné.",
    age: 41,
    nationality: "Espagnole",
  },
  Auxerre: {
    name: "Christophe Pélissier",
    club: "AJ Auxerre",
    role: "Entraîneur principal",
    system: "4-4-2",
    style: "Rigueur défensive & contre-attaques éclair",
    philosophy:
      "Discipline tactique stricte, solidité axiale et projection tranchante en deux ou trois touches de balle.",
    age: 59,
    nationality: "Française",
  },
  Troyes: {
    name: "Stéphane Dumont",
    club: "ESTAC Troyes",
    role: "Entraîneur principal",
    system: "4-2-3-1",
    style: "Bloc compact & transitions rapides",
    philosophy:
      "Densité axiale au milieu, pressing sélectif, engagement physique et exploitation des couloirs en contre.",
    age: 44,
    nationality: "Française",
  },
  Angers: {
    name: "Alexandre Dujeux",
    club: "Angers SCO",
    role: "Entraîneur principal",
    system: "4-2-3-1",
    style: "Bloc bas discipliné & combativité",
    philosophy:
      "Rideau défensif resserré, résilience mentale et réalisme maximal sur les rares opportunités offensives.",
    age: 49,
    nationality: "Française",
  },
  "Le Havre": {
    name: "Didier Digard",
    club: "Le Havre AC",
    role: "Entraîneur principal",
    system: "4-3-3",
    style: "Pressing agressif & verticalité",
    philosophy:
      "Audace dans la récupération haute, dynamisme sur les côtés et jeu direct vers l'avant.",
    age: 39,
    nationality: "Française",
  },
  Lorient: {
    name: "Olivier Pantaloni",
    club: "FC Lorient",
    role: "Entraîneur principal",
    system: "4-4-2",
    style: "Structure tactique rigoureuse",
    philosophy:
      "Bloc médian compact, réduction maximale des espaces entre les lignes et transitions collectives.",
    age: 58,
    nationality: "Française",
  },
  "Paris FC": {
    name: "Stéphane Gilli",
    club: "Paris FC",
    role: "Entraîneur principal",
    system: "4-3-3",
    style: "Jeu combiné & projection rapide",
    philosophy:
      "Animation offensive ambitieuse, créativité des milieux relayeurs et jeu vertical spontané.",
    age: 51,
    nationality: "Française",
  },
  "Le Mans": {
    name: "Patrick Videira",
    club: "Le Mans FC",
    role: "Entraîneur principal",
    system: "4-2-3-1",
    style: "Solidité & intensité athlétique",
    philosophy:
      "Combativité dans les duels, organisation rigoureuse et projection rapide sur les seconds ballons.",
    age: 48,
    nationality: "Française",
  },
  Leverkusen: {
    name: "Xabi Alonso",
    club: "Bayer Leverkusen",
    role: "Entraîneur principal",
    system: "3-4-2-1",
    style: "Fluidité tactique totale & maîtrise absolue",
    philosophy:
      "Contrôle du tempo, occupation dynamique de l'espace, pistons supersoniques et pressing étouffant.",
    age: 44,
    nationality: "Espagnole",
  },
  Olympiacos: {
    name: "José Luis Mendilibar",
    club: "Olympiacos FC",
    role: "Entraîneur principal",
    system: "4-2-3-1",
    style: "Pressing suffocant & verticalité directe",
    philosophy:
      "Harcèlement continu, jeu sans fioriture vers la surface adverse et agressivité positive.",
    age: 64,
    nationality: "Espagnole",
  },
  "Beşiktaş": {
    name: "Giovanni van Bronckhorst",
    club: "Beşiktaş JK",
    role: "Entraîneur principal",
    system: "4-2-3-1",
    style: "Rigueur néerlandaise & intensité offensive",
    philosophy:
      "Circulation rapide, ailiers percutants et équilibre défensif préservé à la perte.",
    age: 51,
    nationality: "Néerlandaise",
  },
  Celtic: {
    name: "Brendan Rodgers",
    club: "Celtic FC",
    role: "Entraîneur principal",
    system: "4-3-3",
    style: "Football offensif & possession dominante",
    philosophy:
      "Rythme élevé, dédoublements constants et pressing dès la première relance adverse.",
    age: 53,
    nationality: "Nord-irlandaise",
  },
  Celta: {
    name: "Claudio Giráldez",
    club: "Celta de Vigo",
    role: "Entraîneur principal",
    system: "3-4-3",
    style: "Jeu associatif & audace offensive",
    philosophy:
      "Sortie de balle impeccable, créativité technique et pressing haut coordonné.",
    age: 38,
    nationality: "Espagnole",
  },
  Anderlecht: {
    name: "David Hubert",
    club: "RSC Anderlecht",
    role: "Entraîneur principal",
    system: "4-3-3",
    style: "Formation & dynamisme offensif",
    philosophy:
      "Lignes de passes directes, vivacité des transmissions et valorisation des talents techniques.",
    age: 38,
    nationality: "Belge",
  },
  "Sturm Graz": {
    name: "Christian Ilzer",
    club: "SK Sturm Graz",
    role: "Entraîneur principal",
    system: "4-4-2 Losange",
    style: "Pressing redoutable & transitions foudroyantes",
    philosophy:
      "Intensité athlétique totale, losange agressif au cœur du jeu et attaques ultra-rapides.",
    age: 48,
    nationality: "Autrichienne",
  },
  "Levski Sofia": {
    name: "Stanislav Genchev",
    club: "PFC Levski Sofia",
    role: "Entraîneur principal",
    system: "3-5-2",
    style: "Bloc compact & transitions physiques",
    philosophy:
      "Densité défensive impénétrable, duel aérien et efficacité chirurgicale sur contres.",
    age: 44,
    nationality: "Bulgare",
  },
};

import { unstable_cache } from "next/cache";

const FOOTBALL_DATA_TOKEN = process.env.FOOTBALL_DATA_TOKEN || "c30131c74cdf444289c2ab429527ecfe";

/**
 * Récupère les entraîneurs en direct depuis l'API football-data.org pour la Ligue 1.
 */
export const fetchLigue1CoachesFromApi = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const res = await fetch("https://api.football-data.org/v4/competitions/FL1/teams", {
        headers: { "X-Auth-Token": FOOTBALL_DATA_TOKEN },
      });
      if (!res.ok) return {};
      const data = await res.json();
      const map: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const t of data.teams ?? []) {
        const coachName = t.coach?.name;
        if (coachName) {
          if (t.name) map[t.name] = coachName;
          if (t.shortName) map[t.shortName] = coachName;
        }
      }
      return map;
    } catch {
      return {};
    }
  },
  ["ligue1-coaches-api"],
  { revalidate: 86400, tags: ["coaches"] },
);

export function getCoachForTeam(
  teamName: string,
  dbCoach?: string | null,
  apiCoach?: string | null,
): CoachProfile {
  const chosenCoachName = dbCoach?.trim() || apiCoach?.trim();

  // Recherche par correspondance directe
  if (COACHES_DATABASE[teamName]) {
    const coach = { ...COACHES_DATABASE[teamName] };
    if (chosenCoachName) coach.name = chosenCoachName;
    return coach;
  }

  // Recherche insensible à la casse ou alias
  const lower = teamName.toLowerCase();
  for (const [key, profile] of Object.entries(COACHES_DATABASE)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      const coach = { ...profile };
      if (chosenCoachName) coach.name = chosenCoachName;
      return coach;
    }
  }

  // Profil par défaut si club inconnu
  return {
    name: chosenCoachName || "Entraîneur principal",
    club: teamName,
    role: "Entraîneur principal",
    system: "4-3-3",
    style: "Organisation tactique équilibrée",
    philosophy: "Structure collective disciplinée et adaptation tactique à l'adversaire.",
  };
}
