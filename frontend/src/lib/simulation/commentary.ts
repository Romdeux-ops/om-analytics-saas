import type { Rng } from "./rng";

/**
 * Gabarits de commentaire « radio ». Les jetons {p}, {a}, {gk}, {v}, {in}, {out}
 * et {team} sont remplacés par des noms de joueurs ou de clubs.
 */
const TEMPLATES = {
  goal: [
    "BUT ! {p} conclut d'une frappe croisée imparable.",
    "BUT ! Tête rageuse de {p}, le gardien est battu.",
    "BUUUT ! {p} trompe le portier du plat du pied.",
    "BUT ! {p} enroule sa frappe dans la lucarne !",
    "BUT ! {p} surgit au second poteau et pousse le ballon au fond.",
    "BUT ! Frappe sèche de {p} à l'entrée de la surface, ça rentre !",
  ],
  assist: [" Offrande de {a}.", " Sur un centre millimétré de {a}.", " Passe décisive de {a}.", " Superbe travail préparatoire de {a}."],
  shot: [
    "Frappe de {p}, à côté.",
    "{p} tente sa chance de loin : au-dessus.",
    "Reprise de volée de {p}, ça passe juste à côté !",
    "Tir de {p} contré par la défense.",
    "{p} déclenche du gauche, le ballon file en tribune.",
  ],
  bigChance: [
    "Énorme occasion pour {p} ! Seul face au but, il manque le cadre.",
    "{p} trouve le poteau ! Quelle occasion !",
    "La barre transversale sauve le gardien sur la tête de {p} !",
    "{p} rate l'immanquable à six mètres !",
  ],
  save: [
    "Arrêt de {gk} sur la frappe de {p}.",
    "Parade décisive de {gk} devant {p} !",
    "{gk} s'interpose en deux temps sur la tentative de {p}.",
    "Frappe cadrée de {p}, {gk} capte sans difficulté.",
  ],
  corner: ["Corner pour {team}.", "{team} obtient un corner.", "Le ballon sort en corner, à tirer pour {team}."],
  foul: ["Faute de {p} sur {v}.", "{p} accroche {v}, coup franc.", "Coup franc sifflé : {p} a fauché {v}."],
  yellow: [
    "Carton jaune pour {p} après sa faute sur {v}.",
    "{p} est averti pour un tacle en retard sur {v}.",
    "Avertissement pour {p}, qui stoppe {v} irrégulièrement.",
  ],
  secondYellow: ["Deuxième avertissement pour {p} : expulsé !", "{p} prend un second jaune et laisse les siens à dix !"],
  red: ["Carton rouge direct pour {p} après un tacle dangereux sur {v} !", "Expulsion ! {p} voit rouge pour une semelle sur {v}."],
  offside: ["{p} signalé hors-jeu.", "Le drapeau se lève : {p} était hors-jeu.", "Hors-jeu de {p}, l'action s'arrête."],
  substitution: ["Changement pour {team} : {in} remplace {out}.", "{team} procède à un changement : {out} cède sa place à {in}."],
  varCheck: [
    "VAR : l'arbitre vérifie une position de hors-jeu sur le but de {p}…",
    "VAR : contrôle en cours sur l'action du but de {p}…",
  ],
  varConfirmed: ["VAR : après vérification, le but de {p} est validé !", "VAR : rien à signaler, le but de {p} tient."],
  varOverturned: ["VAR : le but de {p} est refusé pour hors-jeu !", "VAR : main dans l'action, le but de {p} est annulé !"],
  kickoff: ["Coup d'envoi ! {team} engage.", "C'est parti ! {team} donne le coup d'envoi."],
  secondHalf: ["Reprise de la seconde période.", "C'est reparti pour la deuxième mi-temps."],
  halfTime: ["Mi-temps : {score}.", "L'arbitre siffle la pause : {score}."],
  fullTime: ["Coup de sifflet final : {score}.", "C'est terminé ! Score final : {score}."],
} as const;

export type CommentaryKey = keyof typeof TEMPLATES;

export function commentary(rng: Rng, key: CommentaryKey, tokens: Record<string, string>): string {
  const template = rng.pick(TEMPLATES[key]);
  return template.replace(/\{(\w+)\}/g, (_, token: string) => tokens[token] ?? "");
}
