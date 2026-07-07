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

export const MIN_ROOM_NAME_LENGTH = 2;
export const MAX_ROOM_NAME_LENGTH = 80;
export const MAX_ROOM_DESCRIPTION_LENGTH = 200;
export const MIN_POLL_QUESTION_LENGTH = 5;
export const MAX_POLL_QUESTION_LENGTH = 200;
export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 6;
export const MIN_POLL_OPTION_LABEL_LENGTH = 1;
export const MAX_POLL_OPTION_LABEL_LENGTH = 100;
export const MIN_DEBATE_QUESTION_LENGTH = 5;
export const MAX_DEBATE_QUESTION_LENGTH = 300;
export const MAX_DEBATE_POST_LENGTH = 500;
export const MAX_DEBATE_REPLY_LENGTH = 300;
export const DEBATE_POSTS_PREVIEW = 5;
