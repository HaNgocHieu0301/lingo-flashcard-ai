
import React, { useState, useEffect } from 'react';
import { FlashcardItem, Topic } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface FlashcardListViewProps {
  topic: Topic;
  flashcards: FlashcardItem[];
  isLoadingFlashcards: boolean;
  mode: 'practice' | 'edit';
  onStartTestWithSelected: (selectedFlashcardIds: string[]) => void; // Used in practice mode
  onEditFlashcard: (flashcard: FlashcardItem) => void; // Used in edit mode
  onRequestDeleteFlashcard: (flashcardId: string) => void; // Used in edit mode
  onBackToDashboard: () => void;
}

const EditIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


const FlashcardListView: React.FC<FlashcardListViewProps> = ({
  topic,
  flashcards,
  isLoadingFlashcards,
  mode,
  onStartTestWithSelected,
  onEditFlashcard,
  onRequestDeleteFlashcard,
  onBackToDashboard,
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (mode === 'practice') {
      // Pre-select all cards in practice mode by default
      const allIds = new Set(flashcards.map(fc => fc.id));
      setSelectedCardIds(allIds);
    } else {
      setSelectedCardIds(new Set()); // No pre-selection in edit mode
    }
  }, [flashcards, mode]);

  const handleSelectCard = (cardId: string) => {
    setSelectedCardIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(cardId)) {
        newSelected.delete(cardId);
      } else {
        newSelected.add(cardId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (mode === 'practice') { // Select all only makes sense in practice mode
        if (selectedCardIds.size === flashcards.length && flashcards.length > 0) {
        setSelectedCardIds(new Set()); 
        } else {
        setSelectedCardIds(new Set(flashcards.map(fc => fc.id))); 
        }
    }
  };

  const handleStartTest = () => {
    if (mode === 'practice') { // This button only exists in practice mode
      if (selectedCardIds.size === 0) {
          alert("Please select at least one card to start a test."); // Simple alert for now
          return;
      }
      onStartTestWithSelected(Array.from(selectedCardIds));
    }
  };

  const title = mode === 'practice' ? `Practice: ${topic.name}` : `Edit Cards: ${topic.name}`;

  return (
    <div className="w-full bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-xl animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBackToDashboard} className="text-sm text-sky-600 dark:text-sky-400 hover:underline" aria-label="Back to topics dashboard">
          &larr; To Topics
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-semibold text-sky-700 dark:text-sky-300 mb-3 sm:mb-0">{title}</h2>
        {mode === 'practice' && flashcards.length > 0 && (
          <button
            onClick={handleStartTest}
            disabled={selectedCardIds.size === 0}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-sm transition-colors duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label={`Start test with ${selectedCardIds.size} selected cards`}
          >
            Start Test with {selectedCardIds.size} Selected Card{selectedCardIds.size !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {isLoadingFlashcards ? (
        <LoadingSpinner message="Loading flashcards..." />
      ) : flashcards.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-50">
             <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.123 0 1.131.094 1.976 1.057 1.976 2.192V7.5M8.25 7.5h7.5M8.25 7.5V9M8.25 9h7.5m-7.5 0a3 3 0 0 0-3 3h13.5a3 3 0 0 0-3-3M3.75 9h16.5v7.5c0 1.657-1.343 3-3 3H6.75a3 3 0 0 1-3-3V9Z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">No flashcards in this topic yet.</h3>
          <p>You can add cards by clicking "Add New Topic/Flashcards" on the dashboard and selecting this topic.</p>
        </div>
      ) : (
        <>
          {mode === 'practice' && (
            <div className="mb-4">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-medium rounded-md transition-colors"
              >
                {selectedCardIds.size === flashcards.length ? 'Deselect All' : 'Select All'} ({selectedCardIds.size}/{flashcards.length})
              </button>
            </div>
          )}
          <ul className="space-y-3">
            {flashcards.map((card) => (
              <li
                key={card.id}
                className={`p-4 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between transition-colors duration-150 ease-in-out 
                            ${mode === 'practice' && selectedCardIds.has(card.id) ? 'bg-sky-50 dark:bg-sky-800 ring-2 ring-sky-500' : 'bg-slate-50 dark:bg-slate-700'}`}
              >
                {mode === 'practice' && (
                  <div className="mr-3 flex-shrink-0 mb-2 md:mb-0">
                    <input
                      type="checkbox"
                      id={`card-select-${card.id}`}
                      checked={selectedCardIds.has(card.id)}
                      onChange={() => handleSelectCard(card.id)}
                      className="h-5 w-5 text-sky-600 border-slate-300 dark:border-slate-500 rounded focus:ring-sky-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-700"
                      aria-labelledby={`card-word-${card.id}`}
                    />
                  </div>
                )}
                <div className="flex-grow text-left">
                  <p id={`card-word-${card.id}`} className="font-semibold text-slate-800 dark:text-slate-100 break-words">{card.word}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 break-words">{card.definition}</p>
                  <p className="text-xs italic text-slate-500 dark:text-slate-400 break-words mt-1">{card.exampleSentence}</p>
                </div>
                {mode === 'edit' && (
                  <div className="flex-shrink-0 flex items-center gap-2 mt-3 md:mt-0 md:ml-4">
                    <button
                        onClick={() => onEditFlashcard(card)}
                        className="p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-slate-700"
                        aria-label={`Edit flashcard ${card.word}`}
                    >
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onRequestDeleteFlashcard(card.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400 focus:ring-offset-1 dark:focus:ring-offset-slate-700"
                        aria-label={`Delete flashcard ${card.word}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default FlashcardListView;
