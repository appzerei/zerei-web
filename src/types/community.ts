// Types for Community feature
export interface Post {
  id: string;
  content: string;
  user_id: string;
  author_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_streak?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  from_id: string;
  to_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}
