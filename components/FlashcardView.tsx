
import React from 'react';
import { FlashcardItem } from '../types';

interface FlashcardViewProps {
  card: FlashcardItem | null;
  isFlipped: boolean;
  onFlip: () => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ card, isFlipped, onFlip }) => {
  if (!card) {
    return (
      <div className="h-64 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl flex flex-col justify-center items-center text-slate-500 dark:text-slate-400 p-6 text-center animate-fadeIn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
        <h3 className="text-xl font-semibold">No flashcards loaded.</h3>
        <p className="mt-1">Try generating a new deck to start learning!</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 [perspective:1000px] cursor-pointer" onClick={onFlip}>
      <div 
        className={`relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 flex flex-col justify-center items-center [backface-visibility:hidden] text-center overflow-auto">
          <h2 className="text-4xl font-bold text-sky-600 dark:text-sky-400 mb-4 break-words">{card.word}</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">(Click to flip)</span>
        </div>
        {/* Back of the card */}
        <div className="absolute w-full h-full bg-sky-500 dark:bg-sky-700 text-white rounded-xl shadow-2xl p-6 flex flex-col justify-center items-start [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-auto">
          <div className="w-full">
            <p className="text-lg font-semibold mb-2 break-words"><strong>Definition:</strong> {card.definition}</p>
            <p className="text-md italic break-words"><strong>Example:</strong> {card.exampleSentence}</p>
          </div>
           <span className="absolute bottom-4 right-4 text-xs text-sky-100 dark:text-sky-300">(Click to flip)</span>
        </div>
      </div>
    </div>
  );
};

export default FlashcardView;
