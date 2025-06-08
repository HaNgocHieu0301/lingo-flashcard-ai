
import React from 'react';

interface TestSummaryViewProps {
  score: number;
  totalQuestions: number;
  onRetryTest: () => void;
  onBackToFlashcards: () => void;
}

const TestSummaryView: React.FC<TestSummaryViewProps> = ({
  score,
  totalQuestions,
  onRetryTest,
  onBackToFlashcards,
}) => {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  let message = "";
  if (percentage === 100) {
    message = "Perfect score! You're a vocabulary master! 🎉";
  } else if (percentage >= 80) {
    message = "Excellent work! You're doing great! 👍";
  } else if (percentage >= 60) {
    message = "Good job! Keep practicing to improve. 📚";
  } else {
    message = "Keep trying! Practice makes perfect. 💪";
  }


  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 my-6 text-center animate-fadeIn">
      <h2 className="text-3xl font-bold text-sky-600 dark:text-sky-400 mb-4">Test Completed!</h2>
      <p className="text-xl text-slate-700 dark:text-slate-200 mb-2">
        You scored <strong className="text-sky-500 dark:text-sky-400">{score}</strong> out of <strong className="text-sky-500 dark:text-sky-400">{totalQuestions}</strong> ({percentage}%)
      </p>
      <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">{message}</p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onRetryTest}
          className="px-6 py-3 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        >
          Retry Test
        </button>
        <button
          onClick={onBackToFlashcards}
          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        >
          Back to Flashcards
        </button>
      </div>
    </div>
  );
};

export default TestSummaryView;
