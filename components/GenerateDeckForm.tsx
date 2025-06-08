
import React, { useState } from 'react';

interface GenerateDeckFormProps {
  onGenerate: (topic: string, count: number) => void;
  isLoading: boolean;
  onClearDeck?: () => void;
  hasCards: boolean;
  isTestActiveOrGenerating?: boolean; // New prop
}

const GenerateDeckForm: React.FC<GenerateDeckFormProps> = ({ 
    onGenerate, 
    isLoading, 
    onClearDeck, 
    hasCards,
    isTestActiveOrGenerating 
}) => {
  const [topic, setTopic] = useState<string>("TOEIC Vocabulary");
  const [count, setCount] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && count > 0 && Number.isFinite(count)) {
      onGenerate(topic, count);
    }
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueString = e.target.value;
    if (valueString === "") {
      setCount(1);
    } else {
      const num = parseInt(valueString, 10);
      if (!isNaN(num) && Number.isFinite(num)) {
        setCount(Math.max(1, Math.min(20, num)));
      } else {
        setCount(1);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 mb-8 rounded-xl shadow-xl animate-slideInUp">
      <h2 className="text-2xl font-bold text-center text-sky-600 dark:text-sky-400 mb-6">Create Your Flashcard Deck</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Topic (e.g., "Travel Vocabulary", "Business Idioms")
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="Enter a topic"
            required
            disabled={isLoading || isTestActiveOrGenerating}
            aria-label="Flashcard topic"
          />
        </div>
        <div>
          <label htmlFor="count" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Number of Cards (1-20)
          </label>
          <input
            type="number"
            id="count"
            value={count}
            onChange={handleCountChange}
            min="1"
            max="20"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            required
            disabled={isLoading || isTestActiveOrGenerating}
            aria-label="Number of flashcards"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto flex-grow px-6 py-3 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isLoading || isTestActiveOrGenerating || !topic.trim() || !(count > 0 && Number.isFinite(count))}
          >
            {isLoading && !isTestActiveOrGenerating ? ( // Only show generating spinner if not related to test generation
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Cards...
              </>
            ) : "Generate Cards"}
          </button>
          {hasCards && onClearDeck && (
             <button
              type="button"
              onClick={onClearDeck}
              className="w-full sm:w-auto px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-70"
              disabled={isLoading || isTestActiveOrGenerating}
            >
              Start New Deck
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default GenerateDeckForm;
