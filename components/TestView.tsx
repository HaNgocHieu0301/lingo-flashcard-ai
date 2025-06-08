import React, { useState, useEffect } from 'react';
import { MCQItem, UserAnswer, MCQOption } from '../types';

interface TestViewProps {
  questionItem: MCQItem;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSelect: (questionId: string, selectedOptionText: string, isCorrect: boolean) => void;
  onNextQuestion: () => void;
  userAnswer: UserAnswer | undefined;
}

const TestView: React.FC<TestViewProps> = ({
  questionItem,
  questionNumber,
  totalQuestions,
  onAnswerSelect,
  onNextQuestion,
  userAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<MCQOption[]>([]);
  const [prevQuestionId, setPrevQuestionId] = useState<string | null>(null); // Track question changes

  useEffect(() => {
    // Shuffle options ONLY if the question ID has changed
    if (questionItem.id !== prevQuestionId) {
      setShuffledOptions([...questionItem.options].sort(() => Math.random() - 0.5));
      setPrevQuestionId(questionItem.id);
      setSelectedOption( (userAnswer && userAnswer.questionId === questionItem.id) ? userAnswer.selectedOptionText : null );
    } else {
      if (userAnswer && userAnswer.questionId === questionItem.id) {
           setSelectedOption(userAnswer.selectedOptionText);
      }
      else if (!userAnswer && questionItem.id === prevQuestionId) {
         setSelectedOption(null); // Clear selection if answer is removed for current q
      }
    }
  }, [questionItem, userAnswer, prevQuestionId]);

  const handleOptionClick = (option: MCQOption) => {
    if (userAnswer && userAnswer.questionId === questionItem.id) return;

    setSelectedOption(option.text); // Local state update for immediate feedback
    onAnswerSelect(questionItem.id, option.text, option.isCorrect);
  };

  const getOptionClass = (option: MCQOption) => {
    let baseClass = "w-full text-left p-3 my-2 rounded-lg border-2 transition-all duration-150 ease-in-out focus:outline-none";
    const isAnswerSubmittedForThisQuestion = userAnswer && userAnswer.questionId === questionItem.id;

    if (!isAnswerSubmittedForThisQuestion) { // No answer submitted yet for this question
      return `${baseClass} ${selectedOption === option.text ? 'bg-sky-200 dark:bg-sky-700 border-sky-500' : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600'}`;
    }
    // Answer submitted for this question
    if (option.isCorrect) {
      return `${baseClass} bg-green-100 dark:bg-green-800 border-green-500 dark:border-green-400 text-green-700 dark:text-green-200 font-semibold`;
    }
    if (userAnswer.selectedOptionText === option.text && !option.isCorrect) { // User's submitted answer was this incorrect option
      return `${baseClass} bg-red-100 dark:bg-red-800 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200`;
    }
    // Other incorrect options (not selected by user)
    return `${baseClass} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 opacity-70`;
  };

  const isCurrentQuestionAnswered = userAnswer && userAnswer.questionId === questionItem.id;

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 my-6 animate-fadeIn">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
        Question {questionNumber} of {totalQuestions}
      </p>
      <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: questionItem.questionSentence.replace(/______/g, '<span class="font-bold text-sky-500 dark:text-sky-400">______</span>') }}></h2>

      <div className="space-y-3">
        {shuffledOptions.map((option) => (
          <button
            key={option.text}
            onClick={() => handleOptionClick(option)}
            disabled={isCurrentQuestionAnswered}
            className={getOptionClass(option)}
            aria-pressed={selectedOption === option.text && !isCurrentQuestionAnswered}
          >
            {option.text}
          </button>
        ))}
      </div>

      {isCurrentQuestionAnswered && (
        <div className={`mt-6 mb-8 p-4 rounded-md animate-fadeIn ${userAnswer.isCorrect ? 'bg-green-50 dark:bg-green-900 border border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700'}`}>
          <h3 className={`font-bold ${userAnswer.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {userAnswer.isCorrect ? 'Correct!' : 'Incorrect.'}
          </h3>
          {!userAnswer.isCorrect && (
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              Correct answer: <strong className="text-green-600 dark:text-green-400">{questionItem.options.find(o => o.isCorrect)?.text}</strong>
            </p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">{questionItem.explanation}</p>
        </div>
      )}

      {isCurrentQuestionAnswered && (
        <button
          onClick={onNextQuestion}
          className="w-full mt-8 px-6 py-3 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        >
          {questionNumber === totalQuestions ? 'Finish Test' : 'Next Question'}
        </button>
      )}
    </div>
  );
};

export default TestView;
