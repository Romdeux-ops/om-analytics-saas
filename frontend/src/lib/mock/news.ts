import type { NewsItem } from "@/src/lib/types/news";

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "De Zerbi confirme une équipe ambitieuse avant le choc au Vélodrome",
    excerpt: "L'entraîneur marseillais mise sur la profondeur de banc et un pressing haut pour aborder le prochain match à domicile.",
    category: "match",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    title: "Mercato : l'OM surveille un milieu créatif en Serie A",
    excerpt: "Selon nos informations, le club phocéen aurait pris des renseignements sur un profil technique capable de dynamiser l'entrejeu.",
    category: "mercato",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "Le Vélodrome affiche complet pour le prochain match",
    excerpt: "Plus de 65 000 supporters attendus au stade pour soutenir les Olympiens dans un match décisif pour le podium.",
    category: "club",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    title: "Retour à l'entraînement collectif pour un défenseur clé",
    excerpt: "Bon signe pour l'effectif marseillais à quelques jours du coup d'envoi, avec un renfort de plus dans le groupe.",
    category: "blessure",
    publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    title: "Analyse : l'OM parmi les meilleures attaques à domicile de Ligue 1",
    excerpt: "Les statistiques confirment la solidité offensive des Marseillais devant leur public cette saison.",
    category: "match",
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];
