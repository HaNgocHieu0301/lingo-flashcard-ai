import { createClient, Session, User } from '@supabase/supabase-js';
import { Topic, FlashcardItem } from '../types';

// Directly integrated Supabase URL and Anon Key
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
export const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

// Type for data being inserted into the 'flashcards' table
// Ensures keys match database column names (snake_case)
type FlashcardForInsert = {
  topic_id: string;
  user_id: string;
  word: string;
  definition: string;
  example_sentence: string; // snake_case for DB column
};

const mapDbFlashcardToFlashcardItem = (dbItem: any): FlashcardItem => ({
  id: dbItem.id,
  user_id: dbItem.user_id,
  topic_id: dbItem.topic_id,
  word: dbItem.word,
  definition: dbItem.definition,
  exampleSentence: dbItem.example_sentence, // Explicit mapping
  created_at: dbItem.created_at,
  updated_at: dbItem.updated_at,
});

// --- Auth ---
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

export const signUp = async (email: string, password: string): Promise<User | null> => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
};

export const signInWithPassword = async (email: string, password: string): Promise<User | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};


// --- Topics ---
export const fetchTopics = async (userId: string): Promise<Topic[]> => {
  const { data, error } = await supabase
    .from('topics')
    .select('*, flashcards(count)') // Optionally count flashcards
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }
  return data.map(topic => ({
    ...topic,
    flashcard_count: topic.flashcards[0]?.count || 0
  })) as Topic[];
};

export const fetchTopicById = async (topicId: string): Promise<Topic | null> => {
  const { data, error } = await supabase
    .from('topics')
    .select('*, flashcards(count)')
    .eq('id', topicId)
    .single();
  
  if (error) {
    console.error(`Error fetching topic by ID ${topicId}:`, error);
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  if (!data) return null;
  
  return {
    ...data,
    flashcard_count: data.flashcards[0]?.count || 0
  } as Topic;
};


export const addTopic = async (userId: string, name: string): Promise<Topic> => {
  const { data, error } = await supabase
    .from('topics')
    .insert([{ user_id: userId, name: name }])
    .select('*, flashcards(count)') // fetch count for newly created topic
    .single();
  if (error) {
     console.error('Error adding topic:', error);
     if (error.code === '23505') { // Unique constraint violation
        throw new Error(`A topic with the name "${name}" already exists.`);
     }
    throw error;
  }
   return {
    ...data,
    flashcard_count: data.flashcards[0]?.count || 0
  } as Topic;
};

export const deleteTopic = async (topicId: string): Promise<void> => {
  // Flashcards associated with this topic will be deleted due to ON DELETE CASCADE
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId);
  if (error) {
    console.error('Error deleting topic:', error);
    throw error;
  }
};

// --- Flashcards ---
const flashcardColumns = 'id, user_id, topic_id, word, definition, example_sentence, created_at, updated_at';

export const fetchFlashcardsForTopic = async (topicId: string): Promise<FlashcardItem[]> => {
  const { data, error } = await supabase
    .from('flashcards')
    .select(flashcardColumns)
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching flashcards for topic:', error);
    throw error;
  }
  return data ? data.map(mapDbFlashcardToFlashcardItem) : [];
};

export const addFlashcards = async (flashcardsData: FlashcardForInsert[]): Promise<FlashcardItem[]> => {
  if (flashcardsData.length === 0) return [];
  const { data, error } = await supabase
    .from('flashcards')
    .insert(flashcardsData) 
    .select(flashcardColumns);
  if (error) {
    console.error('Error adding flashcards:', error);
    throw error;
  }
  return data ? data.map(mapDbFlashcardToFlashcardItem) : [];
};

export const deleteFlashcard = async (flashcardId: string): Promise<void> => {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', flashcardId);
  if (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
};

export const updateFlashcard = async (flashcardId: string, updates: Partial<Pick<FlashcardItem, 'word' | 'definition' | 'exampleSentence'>>): Promise<FlashcardItem> => {
  const dbUpdates: { word?: string; definition?: string; example_sentence?: string } = {};
  if (updates.word !== undefined) dbUpdates.word = updates.word;
  if (updates.definition !== undefined) dbUpdates.definition = updates.definition;
  if (updates.exampleSentence !== undefined) dbUpdates.example_sentence = updates.exampleSentence;

  const { data, error } = await supabase
    .from('flashcards')
    .update(dbUpdates)
    .eq('id', flashcardId)
    .select(flashcardColumns)
    .single(); 

  if (error) {
    console.error('Error updating flashcard:', error);
    throw error;
  }
  if (!data) {
    throw new Error('Flashcard not found or update failed to return data.');
  }
  return mapDbFlashcardToFlashcardItem(data);
};


export const getTopicByName = async (userId: string, topicName: string): Promise<Topic | null> => {
  const { data, error } = await supabase
    .from('topics')
    .select('*, flashcards(count)')
    .eq('user_id', userId)
    .eq('name', topicName)
    .maybeSingle();
  if (error) {
    console.error('Error fetching topic by name:', error);
    throw error;
  }
  if (!data) return null;
  return {
    ...data,
    flashcard_count: data.flashcards[0]?.count || 0
  } as Topic;
};

export const getExistingDefinitionsForTopic = async (topicId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('flashcards')
    .select('definition')
    .eq('topic_id', topicId);
  if (error) {
    console.error('Error fetching existing definitions:', error);
    throw error;
  }
  return data ? data.map(item => item.definition) : [];
};
