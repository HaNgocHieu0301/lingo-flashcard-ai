
export interface FlashcardItem {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
}

// Test Feature Types
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
