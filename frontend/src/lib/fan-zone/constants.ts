export const PAGE_SIZE = 20;
export const MAX_CONTENT_LENGTH = 500;
export const MAX_REPLY_LENGTH = 300;
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_DISPLAY_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 30;

/** Like (bouton cœur) — table séparée des emojis */
export const LIKE_EMOJI = "❤️";
/** Emojis réaction (sans le cœur, géré par like) */
export const EMOJI_REACTIONS = ["🔵", "⚪", "💙", "🔥", "👏", "😂"] as const;
export type EmojiReaction = (typeof EMOJI_REACTIONS)[number];

export const REPLIES_PREVIEW = 5;
