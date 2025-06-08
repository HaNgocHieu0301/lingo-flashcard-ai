import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface FlashcardItem {
  id: string; // UUID from Supabase
  user_id?: string; // UUID of the user, from Supabase
  topic_id: string; // UUID of the parent topic, from Supabase
  word: string;
  definition: string;
  exampleSentence: string;
  created_at?: string;
  updated_at?: string;
}

export interface Topic {
  id: string; // UUID from Supabase
  user_id: string; // UUID of the user
  name: string;
  flashcards?: FlashcardItem[]; // Optional: can be loaded separately
  created_at?: string;
  updated_at?: string;
  flashcard_count?: number; // For display in dashboard
}

export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

export interface MCQItem {
  id: string; // Unique ID for the MCQ item
  flashcardId: string; // ID of the flashcard it's based on
  questionSentence: string; // The sentence with a blank
  options: MCQOption[]; // Array of 4 options (1 correct, 3 distractors)
  explanation: string; // Explanation for why the correct answer is right
  originalWord: string; // The original word that was blanked out
}

export interface UserAnswer {
  questionId: string;
  selectedOptionText: string;
  isCorrect: boolean;
}

// Re-export SupabaseUser or a simplified version if needed
export type User = SupabaseUser;