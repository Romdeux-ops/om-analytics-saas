export interface ProfileView {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role?: "user" | "admin";
}

export interface RoomView {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active?: boolean;
}

export interface ReactionCount {
  emoji: string;
  count: number;
}

export interface MessageView {
  id: number;
  room_id: number;
  parent_id: number | null;
  user_id: string;
  content: string;
  created_at: string;
  profile: ProfileView;
  like_count: number;
  user_liked: boolean;
  reactions: ReactionCount[];
  user_reaction: string | null;
  reply_count: number;
  is_pinned?: boolean;
  pending?: boolean;
}

export interface PollOptionView {
  id: number;
  label: string;
  vote_count: number;
}

export interface PollView {
  id: number;
  room_id: number | null;
  question: string;
  is_active: boolean;
  closes_at: string | null;
  options: PollOptionView[];
  user_vote_option_id: number | null;
}

export interface MessageFeedPage {
  messages: MessageView[];
  nextCursor: string | null;
}

export interface DebatePostView {
  id: number;
  debate_id: number;
  parent_id: number | null;
  user_id: string;
  content: string;
  created_at: string;
  profile: ProfileView;
  reply_count: number;
  pending?: boolean;
}

export interface DebateView {
  id: number;
  room_id: number;
  question: string;
  is_active: boolean;
  created_at: string;
  posts: DebatePostView[];
}

export type RoomSlug = string;
