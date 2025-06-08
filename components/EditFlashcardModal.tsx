
import React, { useState, useEffect } from 'react';
import { FlashcardItem } from '../types';
import ErrorAlert from './ErrorAlert';

interface EditFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flashcardId: string, updates: Partial<Pick<FlashcardItem, 'word' | 'definition' | 'exampleSentence'>>) => Promise<void>;
  flashcard: FlashcardItem | null;
  isSaving: boolean;
  error: string | null;
  clearError: () => void;
}

const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  flashcard,
  isSaving,
  error,
  clearError
}) => {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');

  useEffect(() => {
    if (flashcard) {
      setWord(flashcard.word || ''); // Fallback to empty string
      setDefinition(flashcard.definition || ''); // Fallback to empty string
      setExampleSentence(flashcard.exampleSentence || ''); // Fallback to empty string
      clearError(); // Clear previous errors when a new card is loaded
    } else {
      // Reset fields if no flashcard is provided (e.g., modal closed and re-opened without a card)
      setWord('');
      setDefinition('');
      setExampleSentence('');
    }
  }, [flashcard, clearError]);

  if (!isOpen || !flashcard) return null;

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    // The state variables (word, definition, exampleSentence) are now guaranteed to be strings
    // due to the fallbacks in useEffect, so .trim() is safe.
    if (!word.trim() || !definition.trim() || !exampleSentence.trim()) {
        // Basic validation, specific error handling for this is not requested yet
        alert("All fields are required.");
        return;
    }
    await onSave(flashcard.id, { 
        word: word.trim(), 
        definition: definition.trim(), 
        exampleSentence: exampleSentence.trim() 
    });
    // App.tsx will handle closing the modal on successful save or display error
  };
  
  const handleModalClose = () => {
    clearError();
    onClose();
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={handleModalClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-flashcard-modal-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 m-4 w-full max-w-lg transform transition-all animate-slideInUp overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="edit-flashcard-modal-title" className="text-xl font-semibold text-sky-700 dark:text-sky-300">Edit Flashcard</h2>
          <button
            onClick={handleModalClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {error && <ErrorAlert message={error} onDismiss={clearError} />}

        <form onSubmit={handleSaveChanges} className="space-y-4">
          <div>
            <label htmlFor="edit-word" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Word</label>
            <input
              type="text"
              id="edit-word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              required
              disabled={isSaving}
            />
          </div>
          <div>
            <label htmlFor="edit-definition" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Definition</label>
            <textarea
              id="edit-definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              required
              disabled={isSaving}
            />
          </div>
          <div>
            <label htmlFor="edit-exampleSentence" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Example Sentence</label>
            <textarea
              id="edit-exampleSentence"
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              required
              disabled={isSaving}
            />
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm transition-colors duration-150 ease-in-out"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isSaving || !word.trim() || !definition.trim() || !exampleSentence.trim()}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFlashcardModal;
