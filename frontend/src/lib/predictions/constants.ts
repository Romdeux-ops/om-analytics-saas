const HOUR = 60 * 60 * 1000;

export const MAX_PREDICTED_GOALS = 15;

export const RATING_MIN = 1;
export const RATING_MAX = 10;
export const RATING_STEP = 0.5;
/** Valeur proposée au premier clic sur un joueur non noté. */
export const RATING_DEFAULT = 6;
/** Doit rester aligné sur rating_window_open() (migration predictions_ratings). */
export const RATING_OPENS_AFTER_MS = 2 * HOUR;
export const RATING_CLOSES_AFTER_MS = 72 * HOUR;
export const MAX_RATED_PLAYERS = 30;

export const LEADERBOARD_SIZE = 50;
