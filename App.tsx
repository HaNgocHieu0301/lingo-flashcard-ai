
import React, { useState, useEffect, useCallback } from 'react';
import { FlashcardItem, MCQItem, UserAnswer } from './types';
import { generateFlashcardsFromAPI, generateMCQForFlashcard } from './services/geminiService';
import FlashcardView from './components/FlashcardView';
import DeckControls from './components/DeckControls';
import GenerateDeckForm from './components/GenerateDeckForm';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import TestView from './components/TestView';
import TestSummaryView from './components/TestSummaryView';


const INITIAL_FLASHCARDS: FlashcardItem[] = [
  { id: 'initial-1', word: 'Welcome!', definition: 'An expression of greeting.', exampleSentence: 'Welcome to LingoFlip! Generate a new deck to start.' },
  { id: 'initial-2', word: 'Learn', definition: 'To gain knowledge or skill by studying, practicing, being taught, or experiencing something.', exampleSentence: 'I want to learn new English words every day.' },
  { id: 'initial-3', word: 'Flashcard', definition: 'A card containing a small amount of information, held up for students to see, as an aid to learning.', exampleSentence: 'Using flashcards is a great way to memorize vocabulary.' },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const App: React.FC = () => {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>(INITIAL_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For flashcard generation
  const [error, setError] = useState<string | null>(null);

  // Test Mode State
  const [isTestModeActive, setIsTestModeActive] = useState<boolean>(false);
  const [testQuestions, setTestQuestions] = useState<MCQItem[]>([]);
  const [currentTestQuestionIndex, setCurrentTestQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  const [showTestSummary, setShowTestSummary] = useState<boolean>(false);


  const currentFlashcard = flashcards.length > 0 ? flashcards[currentIndex] : null;
  const currentTestQuestion = isTestModeActive && testQuestions.length > 0 ? testQuestions[currentTestQuestionIndex] : null;

  const resetToFlashcardMode = () => {
    setIsTestModeActive(false);
    setTestQuestions([]);
    setCurrentTestQuestionIndex(0);
    setUserAnswers([]);
    setShowTestSummary(false);
    setError(null); // Clear errors when switching mode
  };

  const handleGenerateDeck = useCallback(async (topic: string, count: number) => {
    setIsLoading(true);
    resetToFlashcardMode(); // Exit test mode if a new deck is generated
    try {
      const newCards = await generateFlashcardsFromAPI(topic, count);
      if (newCards && newCards.length > 0) {
        setFlashcards(newCards);
        setCurrentIndex(0);
      } else {
         setError("No cards were generated. The API might have returned an empty list or there was an issue. Try a different topic or check console for details.");
         if (flashcards.length === 0 || flashcards === INITIAL_FLASHCARDS) setFlashcards(INITIAL_FLASHCARDS); // Ensure INITIAL_FLASHCARDS is set if previous was empty or initial
      }
    } catch (err) {
      console.error("Generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during card generation.";
      setError(errorMessage);
      if (flashcards.length === 0 || flashcards === INITIAL_FLASHCARDS) setFlashcards(INITIAL_FLASHCARDS); // Ensure INITIAL_FLASHCARDS is set if previous was empty or initial
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed flashcards.length as it caused re-renders and INITIAL_FLASHCARDS logic is handled inside.

  const handleNextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlipCard = () => {
    if (flashcards.length > 0) {
      setIsFlipped(prevFlipped => !prevFlipped);
    }
  };

  const handleShuffleDeck = () => {
    // Shuffle should not happen for INITIAL_FLASHCARDS, controlled by isDeckEmpty in DeckControls
    if (flashcards.length > 1 && flashcards !== INITIAL_FLASHCARDS) {
      setFlashcards(prevCards => shuffleArray(prevCards));
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };
  
  const handleClearDeck = () => {
    setFlashcards(INITIAL_FLASHCARDS); // Reset to initial cards instead of empty
    setCurrentIndex(0);
    setIsFlipped(false);
    resetToFlashcardMode(); 
  };

  // Test Mode Functions
  const handleStartTest = async () => {
    if (flashcards.length === 0 || flashcards === INITIAL_FLASHCARDS) {
        setError("Please generate a deck of flashcards first to start a test.");
        return;
    }
    setIsGeneratingTest(true);
    setError(null);
    try {
        const mcqPromises = flashcards.map(async (card) => {
            const mcqData = await generateMCQForFlashcard(card);
            return {
                ...mcqData,
                id: `mcq-${card.id}-${Date.now()}`,
                flashcardId: card.id,
            };
        });
        const generatedMcqs = await Promise.all(mcqPromises);
        
        const validMcqs = generatedMcqs.filter(mcq => mcq.options && mcq.options.length > 0 && mcq.questionSentence);

        if (validMcqs.length === 0) {
            setError("Could not generate any test questions for the current deck. Please try again or generate a new deck.");
            setIsGeneratingTest(false);
            return;
        }

        setTestQuestions(shuffleArray(validMcqs)); 
        setIsTestModeActive(true);
        setCurrentTestQuestionIndex(0);
        setUserAnswers([]);
        setShowTestSummary(false);
    } catch (err) {
        console.error("Failed to generate test questions:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while generating the test.");
    } finally {
        setIsGeneratingTest(false);
    }
};


  const handleAnswerSelect = (questionId: string, selectedOptionText: string, isCorrect: boolean) => {
    setUserAnswers(prevAnswers => [...prevAnswers, { questionId, selectedOptionText, isCorrect }]);
  };

  const handleNextTestQuestion = () => {
    if (currentTestQuestionIndex < testQuestions.length - 1) {
      setCurrentTestQuestionIndex(prev => prev + 1);
    } else {
      setIsTestModeActive(false);
      setShowTestSummary(true);
    }
  };
  
  const handleEndTest = () => { 
    resetToFlashcardMode();
  };

  const handleRetryTest = () => {
    setShowTestSummary(false);
    setIsTestModeActive(true);
    setCurrentTestQuestionIndex(0);
    setUserAnswers([]);
    setTestQuestions(prev => shuffleArray([...prev])); 
  };


  useEffect(() => {
    if (!isTestModeActive) { 
      setIsFlipped(false);
    }
  }, [currentIndex, isTestModeActive]);

  const calculateTestScore = () => userAnswers.filter(ans => ans.isCorrect).length;

  return (
    <div className="container mx-auto p-4 flex flex-col items-center min-h-screen justify-center">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500 pb-2">
          LingoFlip AI
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Master English with AI-Powered Flashcards</p>
      </header>

      <main className="w-full max-w-lg">
        {!isTestModeActive && !showTestSummary && !isGeneratingTest && (
             <GenerateDeckForm 
                onGenerate={handleGenerateDeck} 
                isLoading={isLoading} 
                onClearDeck={handleClearDeck}
                hasCards={flashcards !== INITIAL_FLASHCARDS} // Condition for "Start New Deck" button
                isTestActiveOrGenerating={isTestModeActive || isGeneratingTest}
            />
        )}

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        {isLoading && <LoadingSpinner message="Generating Flashcards..." />}
        {isGeneratingTest && <LoadingSpinner message="Generating Test Questions..." />}
        
        {!isLoading && !isGeneratingTest && (
          <>
            {isTestModeActive && currentTestQuestion && (
              <TestView
                questionItem={currentTestQuestion}
                questionNumber={currentTestQuestionIndex + 1}
                totalQuestions={testQuestions.length}
                onAnswerSelect={handleAnswerSelect}
                onNextQuestion={handleNextTestQuestion}
                userAnswer={userAnswers.find(ans => ans.questionId === currentTestQuestion.id)}
              />
            )}

            {showTestSummary && (
              <TestSummaryView
                score={calculateTestScore()}
                totalQuestions={testQuestions.length}
                onRetryTest={handleRetryTest}
                onBackToFlashcards={handleEndTest}
              />
            )}

            {!isTestModeActive && !showTestSummary && (
              <>
                <FlashcardView card={currentFlashcard} isFlipped={isFlipped} onFlip={handleFlipCard} />
                <DeckControls
                  onNext={handleNextCard}
                  onPrevious={handlePreviousCard}
                  onFlip={handleFlipCard}
                  onShuffle={handleShuffleDeck}
                  onStartTest={handleStartTest}
                  canPrevious={currentIndex > 0}
                  canNext={currentIndex < flashcards.length - 1}
                  isDeckEmpty={flashcards === INITIAL_FLASHCARDS} // Simplified: deck is "empty" of generated cards if it's the initial set
                  deckSize={flashcards.length} // Pass the actual deck size
                  isTestModeActive={isTestModeActive}
                  isGeneratingTest={isGeneratingTest}
                />
                {flashcards.length > 0 && ( // Always show count if cards exist
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                        Card {currentIndex + 1} of {flashcards.length}
                        {flashcards === INITIAL_FLASHCARDS && " (Sample Deck)"}
                    </p>
                )}
              </>
            )}
          </>
        )}
      </main>
      
      <footer className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} LingoFlip AI. Enhance your vocabulary journey.</p>
      </footer>
    </div>
  );
};

export default App;
