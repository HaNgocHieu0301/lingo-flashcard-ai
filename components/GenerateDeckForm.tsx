
import React, { useState, useEffect } from 'react';
import { Topic } from '../types'; 

interface GenerateDeckFormProps {
  onGenerateAndSave: (topicName: string, count: number, existingTopicId?: string) => Promise<void>;
  isLoading: boolean;
  isTestActiveOrGenerating?: boolean; // Kept for potential future use if form is disabled during test
  userTopics: Topic[]; 
  currentTopic?: Topic | null; 
  onCancel?: () => void; // For closing the modal
}

const GenerateDeckForm: React.FC<GenerateDeckFormProps> = ({
  onGenerateAndSave,
  isLoading,
  isTestActiveOrGenerating,
  userTopics,
  currentTopic,
  onCancel
}) => {
  const [topicName, setTopicName] = useState<string>("");
  const [count, setCount] = useState<number>(5);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [isCreatingNewTopic, setIsCreatingNewTopic] = useState<boolean>(true);

  useEffect(() => {
    if (currentTopic) { // Editing/adding to an existing topic passed to the modal
        setTopicName(currentTopic.name);
        setSelectedTopicId(currentTopic.id);
        setIsCreatingNewTopic(false);
    } else { // Creating a brand new topic
        setTopicName(""); // Default empty for new topic via modal
        setSelectedTopicId(undefined);
        setIsCreatingNewTopic(true);
    }
  }, [currentTopic]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topicName.trim() && count > 0 && Number.isFinite(count)) {
      const topicIdToUse = isCreatingNewTopic ? undefined : selectedTopicId;
      // The promise from onGenerateAndSave will handle closing the modal or showing errors within it
      await onGenerateAndSave(topicName.trim(), count, topicIdToUse);
      // If successful, App.tsx handles closing the modal. If error, modal stays open.
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
  
  const handleTopicSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "new") {
        setIsCreatingNewTopic(true);
        setSelectedTopicId(undefined);
        setTopicName(""); 
    } else {
        setIsCreatingNewTopic(false);
        setSelectedTopicId(value);
        const foundTopic = userTopics.find(t => t.id === value);
        if (foundTopic) setTopicName(foundTopic.name);
    }
  };


  const isDisabled = isLoading || isTestActiveOrGenerating;

  return (
    // Removed outer bg-white/dark:bg-slate-800 p-6 md:p-8 mb-8 rounded-xl shadow-xl animate-slideInUp as modal handles this
    // The h2 title is also handled by the Modal component's title prop.
    <form onSubmit={handleSubmit} className="space-y-4">
    <div>
        <label htmlFor="topicSelection" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Topic Action
        </label>
        <select
            id="topicSelection"
            value={isCreatingNewTopic ? "new" : selectedTopicId || "new"} // Fallback to "new" if selectedTopicId is undefined
            onChange={handleTopicSelectionChange}
            disabled={isDisabled || !!currentTopic} // Disable if editing a specific topic passed via currentTopic
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        >
            <option value="new">Create a new topic</option>
            {userTopics.map(topic => (
                <option key={topic.id} value={topic.id}>Add to: {topic.name} ({topic.flashcard_count || 0} cards)</option>
            ))}
        </select>
    </div>

    {isCreatingNewTopic && (
        <div>
        <label htmlFor="topicName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            New Topic Name (e.g., "Travel Vocabulary")
        </label>
        <input
            type="text"
            id="topicName"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="Enter a new topic name"
            required={isCreatingNewTopic}
            disabled={isDisabled || !isCreatingNewTopic}
            aria-label="New flashcard topic name"
        />
        </div>
    )}

    <div>
        <label htmlFor="count" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Number of New Cards to Generate (1-20)
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
        disabled={isDisabled}
        aria-label="Number of new flashcards to generate"
        />
    </div>
    <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
        {onCancel && (
        <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            disabled={isLoading}
        >
            Cancel
        </button>
        )}
        <button
        type="submit"
        className="px-6 py-2 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={isDisabled || !topicName.trim() || !(count > 0 && Number.isFinite(count))}
        >
        {isLoading ? (
            <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating & Saving...
            </>
        ) : (isCreatingNewTopic ? "Create Topic & Generate Cards" : "Generate & Add Cards")}
        </button>
    </div>
    </form>
  );
};

export default GenerateDeckForm;
