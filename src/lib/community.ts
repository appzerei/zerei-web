import { supabase } from './supabase';
import { Post, Comment, FriendRequest } from '../types/community';

// Fetch posts with filter
export async function fetchPosts(filter: 'new' | 'streak' | 'featured'): Promise<Post[]> {
  let query = supabase.from('posts').select('*');
  // Simple ordering based on filter (placeholder logic)
  if (filter === 'new') query = query.order('created_at', { ascending: false });
  else if (filter === 'streak') query = query.order('user_streak', { ascending: false });
  else if (filter === 'featured') query = query.order('likes_count', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
}

export async function createPost(content: string, userId: string): Promise<Post> {
  const { data, error } = await supabase.from('posts').insert({ content, user_id: userId }).single();
  if (error) throw error;
  return data as Post;
}

export async function likePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId }).single();
  if (error) throw error;
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
  if (error) throw error;
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase.from('comments').select('*').eq('post_id', postId);
  if (error) throw error;
  return data as Comment[];
}

export async function createComment(postId: string, content: string, userId: string): Promise<Comment> {
  const { data, error } = await supabase.from('comments').insert({ post_id: postId, content, user_id: userId }).single();
  if (error) throw error;
  return data as Comment;
}

export async function sendFriendRequest(fromId: string, toId: string): Promise<void> {
  const { error } = await supabase.from('friendships').insert({ from_id: fromId, to_id: toId, status: 'pending' }).single();
  if (error) throw error;
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
  if (error) throw error;
}
