
import React from 'react';
import { Topic } from '../types';

interface TopicDashboardProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void; // For "Study Deck" (clicking topic name)
  onEditTopicCards: (topic: Topic) => void; // New: For "Edit" button
  onPracticeTopic: (topic: Topic) => void; // New: For "Practice" button
  onDeleteTopic: (topicId: string) => void; 
  onCreateNewTopic: () => void; 
  isLoading: boolean;
}

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const EditIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);


const TopicDashboard: React.FC<TopicDashboardProps> = ({
  topics,
  onSelectTopic,
  onEditTopicCards,
  onPracticeTopic,
  onDeleteTopic, 
  onCreateNewTopic, 
  isLoading
}) => {
  if (isLoading && topics.length === 0) {
    return <p className="text-center text-slate-500 dark:text-slate-400 my-8">Loading your topics...</p>;
  }

  return (
    <div className="w-full bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-xl animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-sky-600 dark:text-sky-400 mb-3 sm:mb-0">Your Flashcard Topics</h2>
        <button
          onClick={onCreateNewTopic} 
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 self-start sm:self-center"
        >
          + Add New Topic/Flashcards
        </button>
      </div>

      {topics.length === 0 && !isLoading && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">No topics yet!</h3>
          <p>Click "Add New Topic/Flashcards" to generate your first deck.</p>
        </div>
      )}

      {topics.length > 0 && (
        <ul className="space-y-3">
          {topics.map((topic) => (
            <li
              key={topic.id}
              className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 ease-in-out flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div 
                className="flex-grow mb-3 md:mb-0 md:mr-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 p-2 rounded-md transition-colors duration-150"
                onClick={() => onSelectTopic(topic)} // Click topic name to go to Study View
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectTopic(topic);}}
                aria-label={`Study topic ${topic.name}. Contains ${topic.flashcard_count || 0} cards.`}
              >
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{topic.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {topic.flashcard_count || 0} card{topic.flashcard_count !== 1 ? 's' : ''}
                  {topic.created_at && ` | Created: ${new Date(topic.created_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 self-start md:self-center md:ml-auto md:flex-nowrap items-center">
                 <button
                  onClick={() => onPracticeTopic(topic)}
                  className="text-xs px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors"
                  aria-label={`Practice topic ${topic.name}`}
                >
                  Practice
                </button>
                <button
                  onClick={() => onEditTopicCards(topic)}
                  className="p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-slate-700"
                  aria-label={`Edit cards for ${topic.name}`}
                >
                  <EditIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDeleteTopic(topic.id)} 
                  className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 dark:focus:ring-offset-slate-700"
                  aria-label={`Delete topic ${topic.name}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopicDashboard;
