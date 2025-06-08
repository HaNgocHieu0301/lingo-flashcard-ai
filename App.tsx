

import React, { useState, useEffect, useCallback } from 'react';
import { Session as SupabaseSession } from '@supabase/supabase-js';
import { FlashcardItem, MCQItem, UserAnswer, Topic, User } from './types';
import { generateFlashcardsFromAPI, generateMCQForFlashcard } from './services/geminiService';
import * as supabaseService from './services/supabaseService';
import FlashcardView from './components/FlashcardView';
import DeckControls from './components/DeckControls';
import GenerateDeckForm from './components/GenerateDeckForm';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import TestView from './components/TestView';
import TestSummaryView from './components/TestSummaryView';
import AuthForm from './components/AuthForm';
import TopicDashboard from './components/TopicDashboard';
import FlashcardListView from './components/FlashcardListView';
import Modal from './components/Modal';
import ConfirmationModal from './components/ConfirmationModal';
import EditFlashcardModal from './components/EditFlashcardModal';


type AppView = 
  | 'auth' 
  | 'dashboard' 
  // | 'generate_deck' // Replaced by modal
  // | 'flashcard_list' // Replaced by practice_deck_selection and edit_deck_cards
  | 'practice_deck_selection' // For selecting cards for a test
  | 'edit_deck_cards'         // For editing/deleting cards in a deck
  | 'study_deck' 
  | 'test_active' 
  | 'test_summary';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [appView, setAppView] = useState<AppView>('auth');
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [currentFlashcards, setCurrentFlashcards] = useState<FlashcardItem[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const [isGenerating, setIsGenerating] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null); // General error
  const [modalError, setModalError] = useState<string | null>(null); // Specific for modals

  // Test Mode State
  const [testQuestions, setTestQuestions] = useState<MCQItem[]>([]);
  const [currentTestQuestionIndex, setCurrentTestQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);

  // Modal States
  const [isGenerateDeckModalOpen, setIsGenerateDeckModalOpen] = useState<boolean>(false);
  const [topicForModal, setTopicForModal] = useState<Topic | null>(null);
  const [isConfirmDeleteTopicModalOpen, setIsConfirmDeleteTopicModalOpen] = useState<boolean>(false);
  const [topicIdToDelete, setTopicIdToDelete] = useState<string | null>(null);

  // Edit/Delete Flashcard Modal States
  const [isEditFlashcardModalOpen, setIsEditFlashcardModalOpen] = useState<boolean>(false);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardItem | null>(null);
  const [isSavingFlashcard, setIsSavingFlashcard] = useState<boolean>(false);
  const [isConfirmDeleteFlashcardModalOpen, setIsConfirmDeleteFlashcardModalOpen] = useState<boolean>(false);
  const [flashcardToDeleteId, setFlashcardToDeleteId] = useState<string | null>(null);


  const activeFlashcard = currentFlashcards.length > 0 ? currentFlashcards[currentFlashcardIndex] : null;
  const activeTestQuestion = appView === 'test_active' && testQuestions.length > 0 ? testQuestions[currentTestQuestionIndex] : null;

  useEffect(() => {
    setIsLoading(true);
    supabaseService.getCurrentSession().then(activeSession => {
      setSession(activeSession);
      setCurrentUser(activeSession?.user ?? null);
      setAppView(activeSession ? 'dashboard' : 'auth');
      setIsLoading(false);
    });

    const { data: authListener } = supabaseService.onAuthStateChange((event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        setAppView('dashboard');
      } else if (event === 'SIGNED_OUT') {
        setAppView('auth');
        setTopics([]);
        setSelectedTopic(null);
        setCurrentFlashcards([]);
        // Close all modals on logout
        setIsGenerateDeckModalOpen(false);
        setIsConfirmDeleteTopicModalOpen(false);
        setIsEditFlashcardModalOpen(false);
        setIsConfirmDeleteFlashcardModalOpen(false);
      }
      setError(null); 
      setModalError(null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser && appView === 'dashboard') {
      fetchUserTopics();
    }
  }, [currentUser, appView]);

  useEffect(() => {
    if (selectedTopic && (appView === 'study_deck' || appView === 'practice_deck_selection' || appView === 'edit_deck_cards')) {
      fetchFlashcardsForSelectedTopic(selectedTopic.id);
    } else if (!selectedTopic) {
      setCurrentFlashcards([]);
    }
  }, [selectedTopic, appView]);

  const fetchUserTopics = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const userTopics = await supabaseService.fetchTopics(currentUser.id);
      setTopics(userTopics);
    } catch (err: any) {
      setError(err.message || "Failed to load topics.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFlashcardsForSelectedTopic = async (topicId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const flashcards = await supabaseService.fetchFlashcardsForTopic(topicId);
      setCurrentFlashcards(flashcards);
      setCurrentFlashcardIndex(0); // Reset for study_deck mode
      setIsFlipped(false); // Reset for study_deck mode
    } catch (err: any) {
      setError(err.message || "Failed to load flashcards for the topic.");
      setCurrentFlashcards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openGenerateDeckModal = (topicToEditOrAddCardsTo: Topic | null) => {
    setTopicForModal(topicToEditOrAddCardsTo); 
    setModalError(null);
    setIsGenerateDeckModalOpen(true);
  };

  const handleGenerateAndSaveDeck = async (
    topicName: string, 
    generationDetails: { mode: 'count', count: number } | { mode: 'list', definitionListString: string },
    existingTopicId?: string
  ) => {
    if (!currentUser) {
      setModalError("You must be logged in to create decks.");
      return;
    }
    setIsGenerating(true);
    setModalError(null);
    try {
      let targetTopicId = existingTopicId;
      let finalTopicName = topicName;

      if (!targetTopicId) { 
        const newTopic = await supabaseService.addTopic(currentUser.id, topicName);
        targetTopicId = newTopic.id;
        finalTopicName = newTopic.name; 
      } else { 
        const existingTopicDetails = topics.find(t => t.id === targetTopicId);
        if (existingTopicDetails) finalTopicName = existingTopicDetails.name;
      }
      
      const existingDefinitionsInTopic = await supabaseService.getExistingDefinitionsForTopic(targetTopicId);
      let newCardData: Omit<FlashcardItem, 'id' | 'topic_id' | 'user_id' | 'created_at' | 'updated_at'>[] = [];

      if (generationDetails.mode === 'count') {
        newCardData = await generateFlashcardsFromAPI(finalTopicName, generationDetails.count, existingDefinitionsInTopic);
      } else { // mode === 'list'
        const parsedDefinitions = generationDetails.definitionListString
          .split(',')
          .map(def => def.trim())
          .filter(def => def.length > 0);
        
        if (parsedDefinitions.length === 0) {
          throw new Error("The provided definition list is empty or contains only whitespace.");
        }

        const uniqueProvidedDefinitions = Array.from(new Set(parsedDefinitions.map(def => def.toLowerCase())));
        
        const definitionsToGenerateForAPI = uniqueProvidedDefinitions.filter(
          pdDef => !existingDefinitionsInTopic.some(edDef => edDef.toLowerCase() === pdDef)
        );

        if (definitionsToGenerateForAPI.length === 0) {
          throw new Error("All definitions provided already exist in this topic or the list was empty after filtering.");
        }
        // We need to pass the original casing of the definitions to the API, not the lowercased ones.
        // So, we find the original-cased versions from parsedDefinitions that match the lowercased unique new ones.
        const originalCasedDefinitionsToProcess = parsedDefinitions.filter(originalDef => 
          definitionsToGenerateForAPI.includes(originalDef.toLowerCase())
        );
        // Ensure uniqueness again for original cased definitions, as "Def A, def a" could both pass above filter
        const finalDefinitionsToProcess = Array.from(new Set(originalCasedDefinitionsToProcess));


        if (finalDefinitionsToProcess.length === 0) { // Should be rare if definitionsToGenerateForAPI had items
           throw new Error("No new definitions to process after final filtering. Check for case variations of existing definitions.");
        }
        
        newCardData = await generateFlashcardsFromAPI(
          finalTopicName, 
          finalDefinitionsToProcess.length, // count is length of definitions to process
          existingDefinitionsInTopic,
          finalDefinitionsToProcess // pass the actual definitions to process
        );
      }
      
      if (newCardData.length === 0) {
        throw new Error("AI did not generate any new cards. Please try again or adjust your input.");
      }

      const flashcardsToSave = newCardData.map(card => ({
        word: card.word,
        definition: card.definition,
        example_sentence: card.exampleSentence, 
        topic_id: targetTopicId!,
        user_id: currentUser.id,
      }));
      
      await supabaseService.addFlashcards(flashcardsToSave);
      
      await fetchUserTopics(); 

      if (selectedTopic && selectedTopic.id === targetTopicId && (appView === 'practice_deck_selection' || appView === 'edit_deck_cards' || appView === 'study_deck')) {
        await fetchFlashcardsForSelectedTopic(targetTopicId);
      } else if (!selectedTopic && !existingTopicId && targetTopicId && generationDetails.mode === 'count' && generationDetails.count > 0) {
        // If a new topic was created and cards added, and no topic was previously selected,
        // select this new topic and fetch its cards for study view.
        const newlyCreatedTopic = topics.find(t=> t.id === targetTopicId) || await supabaseService.fetchTopicById(targetTopicId); // Fetch if not in state yet
        if (newlyCreatedTopic) {
          setSelectedTopic(newlyCreatedTopic);
          setAppView('study_deck'); 
          // fetchFlashcardsForSelectedTopic will be triggered by useEffect for selectedTopic
        }
      }
      
      setIsGenerateDeckModalOpen(false); 
      setModalError(null);

    } catch (err: any) {
      console.error("Generation/Save failed:", err);
      const displayError = typeof err === 'string' ? err : (err?.message || "An unknown error occurred during card generation or saving.");
      setModalError(displayError); 
    } finally {
      setIsGenerating(false);
    }
  };

  const requestDeleteTopic = (topicId: string) => {
    setTopicIdToDelete(topicId);
    setIsConfirmDeleteTopicModalOpen(true);
  };

  const confirmDeleteTopic = async () => {
    if (!topicIdToDelete) return;
    setError(null);
    try {
      await supabaseService.deleteTopic(topicIdToDelete);
      setTopics(prevTopics => prevTopics.filter(t => t.id !== topicIdToDelete));
      if (selectedTopic?.id === topicIdToDelete) {
        setSelectedTopic(null);
        setCurrentFlashcards([]);
        if (appView !== 'dashboard') setAppView('dashboard'); 
      }
    } catch (err:any) {
      setError(err.message || "Failed to delete topic.");
    } finally {
      setTopicIdToDelete(null);
      setIsConfirmDeleteTopicModalOpen(false);
    }
  };

  const handleRequestDeleteFlashcard = (flashcardId: string) => {
    setFlashcardToDeleteId(flashcardId);
    setIsConfirmDeleteFlashcardModalOpen(true);
  };

  const handleConfirmDeleteFlashcard = async () => {
    if (!flashcardToDeleteId || !selectedTopic) return;
    setModalError(null);
    try {
        await supabaseService.deleteFlashcard(flashcardToDeleteId);
        await fetchFlashcardsForSelectedTopic(selectedTopic.id); // Refresh list
        await fetchUserTopics(); // Refresh topic counts
    } catch (err: any) {
        setModalError(err.message || "Failed to delete flashcard.");
    } finally {
        setFlashcardToDeleteId(null);
        setIsConfirmDeleteFlashcardModalOpen(false);
    }
  };
  
  const handleOpenEditFlashcardModal = (flashcard: FlashcardItem) => {
    setEditingFlashcard(flashcard);
    setModalError(null);
    setIsEditFlashcardModalOpen(true);
  };

  const handleSaveEditedFlashcard = async (flashcardId: string, updates: Partial<Pick<FlashcardItem, 'word' | 'definition' | 'exampleSentence'>>) => {
    if (!selectedTopic) return;
    setIsSavingFlashcard(true);
    setModalError(null);
    try {
      await supabaseService.updateFlashcard(flashcardId, updates);
      await fetchFlashcardsForSelectedTopic(selectedTopic.id); // Refresh list
      // No need to fetchUserTopics as card count doesn't change
      setIsEditFlashcardModalOpen(false);
      setEditingFlashcard(null);
    } catch (err: any) {
      console.error("Failed to save flashcard:", err);
      setModalError(err.message || "Failed to save flashcard changes.");
    } finally {
      setIsSavingFlashcard(false);
    }
  };


  const handleNextCard = () => {
    if (currentFlashcardIndex < currentFlashcards.length - 1) {
      setCurrentFlashcardIndex(prevIndex => prevIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentFlashcardIndex > 0) {
      setCurrentFlashcardIndex(prevIndex => prevIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlipCard = () => {
    if (currentFlashcards.length > 0) {
      setIsFlipped(prevFlipped => !prevFlipped);
    }
  };

  const handleShuffleDeck = () => {
    if (currentFlashcards.length > 1) {
      setCurrentFlashcards(prevCards => shuffleArray(prevCards));
      setCurrentFlashcardIndex(0);
      setIsFlipped(false);
    }
  };
  
  const handleStartTestWithSelectedCards = async (selectedFlashcardIds: string[]) => {
    if (selectedFlashcardIds.length === 0) {
        setError("Please select at least one card to start a test.");
        return;
    }
    const cardsForTest = currentFlashcards.filter(fc => selectedFlashcardIds.includes(fc.id));
    if (cardsForTest.length === 0) {
        setError("No valid cards found for the test based on selection.");
        return;
    }

    setIsGeneratingTest(true);
    setError(null);
    try {
        const mcqPromises = cardsForTest.map(async (card) => {
            const mcqData = await generateMCQForFlashcard(card);
            return {
                ...mcqData,
                id: `mcq-${card.id}-${Date.now()}`, 
                flashcardId: card.id,
            };
        });
        const generatedMcqs = await Promise.all(mcqPromises);
        const validMcqs = generatedMcqs.filter(mcq => mcq.options && mcq.options.length > 0 && mcq.questionSentence && !mcq.questionSentence.includes("(Error generating MCQ:"));

        if (validMcqs.length === 0) {
            setError("Could not generate any valid test questions for the selected cards. Some cards might have had issues during MCQ generation. Please try again or select different cards.");
            setIsGeneratingTest(false);
            return;
        }

        setTestQuestions(shuffleArray(validMcqs)); 
        setCurrentTestQuestionIndex(0);
        setUserAnswers([]);
        setAppView('test_active');
    } catch (err:any) {
        console.error("Failed to generate test questions:", err);
        setError(err.message || "An unknown error occurred while generating the test.");
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
      setAppView('test_summary');
    }
  };
  
  const handleEndTestToPracticeSelection = () => { 
    setAppView('practice_deck_selection'); 
    setTestQuestions([]);
    setUserAnswers([]);
  };

  const handleRetryTest = () => {
    setAppView('test_active');
    setCurrentTestQuestionIndex(0);
    setUserAnswers([]);
    setTestQuestions(prev => shuffleArray([...prev])); 
  };

  const calculateTestScore = () => userAnswers.filter(ans => ans.isCorrect).length;

  const navigateToDashboard = () => {
    setSelectedTopic(null);
    setCurrentFlashcards([]);
    setAppView('dashboard');
    setError(null);
    setModalError(null);
  };

  const handleAuthSuccess = () => {
    setIsLoading(true); 
  };
  
  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    setModalError(null);
    try {
      await supabaseService.signOut();
    } catch (err: any) {
      setError(err.message || "Logout failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTopicCards = (topic: Topic) => {
    setSelectedTopic(topic);
    setAppView('edit_deck_cards');
  };

  const handlePracticeTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setAppView('practice_deck_selection');
  };
  
  useEffect(() => {
    if (appView === 'study_deck') { 
      setIsFlipped(false);
    }
  }, [currentFlashcardIndex, appView]);

  const renderContent = () => {
    if (isLoading && !isGenerating && !isGeneratingTest && !isGenerateDeckModalOpen && !isConfirmDeleteTopicModalOpen && !isEditFlashcardModalOpen && !isConfirmDeleteFlashcardModalOpen) { 
        return <LoadingSpinner message="Loading App..." />;
    }

    if (isGeneratingTest) return <LoadingSpinner message="Generating Test Questions..." />;

    switch(appView) {
      case 'auth':
        return <AuthForm onAuthSuccess={handleAuthSuccess} />;
      case 'dashboard':
        return (
          <TopicDashboard 
            topics={topics}
            onSelectTopic={(topic) => { setSelectedTopic(topic); setAppView('study_deck'); }}
            onEditTopicCards={handleEditTopicCards}
            onPracticeTopic={handlePracticeTopic}
            onDeleteTopic={requestDeleteTopic}
            onCreateNewTopic={() => openGenerateDeckModal(null)}
            isLoading={isLoading && topics.length === 0}
          />
        );
      case 'practice_deck_selection':
        if (!selectedTopic) return <ErrorAlert message="No topic selected for practice." onDismiss={navigateToDashboard} />;
        return (
            <FlashcardListView 
                topic={selectedTopic}
                flashcards={currentFlashcards}
                isLoadingFlashcards={isLoading && currentFlashcards.length === 0 && !!selectedTopic}
                mode="practice"
                onStartTestWithSelected={handleStartTestWithSelectedCards}
                onBackToDashboard={navigateToDashboard}
                // These are not used in practice mode but satisfy TS; could be conditional
                onEditFlashcard={() => {}} 
                onRequestDeleteFlashcard={() => {}}
            />
        );
      case 'edit_deck_cards':
        if (!selectedTopic) return <ErrorAlert message="No topic selected to edit cards." onDismiss={navigateToDashboard} />;
        return (
            <FlashcardListView 
                topic={selectedTopic}
                flashcards={currentFlashcards}
                isLoadingFlashcards={isLoading && currentFlashcards.length === 0 && !!selectedTopic}
                mode="edit"
                onEditFlashcard={handleOpenEditFlashcardModal}
                onRequestDeleteFlashcard={handleRequestDeleteFlashcard}
                onBackToDashboard={navigateToDashboard}
                // Not used in edit mode
                onStartTestWithSelected={() => {}}
            />
        );
      case 'study_deck':
        if (!selectedTopic) return <ErrorAlert message="No topic selected to study." onDismiss={navigateToDashboard} />;
        return (
          <>
            <div className="w-full flex justify-between items-center mb-2">
                <button onClick={navigateToDashboard} className="text-sm text-sky-600 dark:text-sky-400 hover:underline">&larr; To Topics</button>
                <button 
                    onClick={() => {
                        handlePracticeTopic(selectedTopic); 
                    }} 
                    className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
                    aria-label={`Practice or edit cards for ${selectedTopic.name}`}
                >
                    Practice &rarr;
                </button>
            </div>
            <h2 className="text-2xl font-semibold text-center text-sky-700 dark:text-sky-300 mb-4">Studying: {selectedTopic.name}</h2>
            <FlashcardView card={activeFlashcard} isFlipped={isFlipped} onFlip={handleFlipCard} />
            <DeckControls
              onNext={handleNextCard}
              onPrevious={handlePreviousCard}
              onFlip={handleFlipCard}
              onShuffle={handleShuffleDeck}
              canPrevious={currentFlashcardIndex > 0}
              canNext={currentFlashcardIndex < currentFlashcards.length - 1}
              isDeckEmpty={currentFlashcards.length === 0}
              deckSize={currentFlashcards.length}
            />
            {currentFlashcards.length > 0 && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4" aria-live="polite">
                    Card {currentFlashcardIndex + 1} of {currentFlashcards.length}
                </p>
            )}
          </>
        );
      case 'test_active':
        if (!activeTestQuestion) return <ErrorAlert message="No active test question." onDismiss={handleEndTestToPracticeSelection} />;
        return (
          <TestView
            questionItem={activeTestQuestion}
            questionNumber={currentTestQuestionIndex + 1}
            totalQuestions={testQuestions.length}
            onAnswerSelect={handleAnswerSelect}
            onNextQuestion={handleNextTestQuestion}
            userAnswer={userAnswers.find(ans => ans.questionId === activeTestQuestion.id)}
          />
        );
      case 'test_summary':
        return (
          <TestSummaryView
            score={calculateTestScore()}
            totalQuestions={testQuestions.length}
            onRetryTest={handleRetryTest}
            onBackToFlashcards={handleEndTestToPracticeSelection} 
          />
        );
      default:
        return <ErrorAlert message="Invalid application state." onDismiss={navigateToDashboard} />;
    }
  };

  return (
    <div className="w-full p-4 flex flex-col items-center flex-grow">
      <header className={`mb-6 md:mb-8 w-full ${!currentUser ? 'text-center' : 'flex justify-between items-center'}`}>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500 pb-2">
          LingoFlip AI
        </h1>
        {!currentUser ? (
          <p className="text-md sm:text-lg text-slate-600 dark:text-slate-400 mt-1">
            Master English with AI-Powered Flashcards
          </p>
        ) : (
          <div className="flex items-center space-x-4">
            <p className="text-md sm:text-lg text-slate-600 dark:text-slate-400">
              Welcome, {currentUser.email?.split('@')[0] || 'User'}!
            </p>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-sm"
              disabled={isLoading}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className={`w-full flex flex-col items-center ${!currentUser ? 'justify-center flex-grow' : ''}`}>
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {renderContent()}
      </main>

      {isGenerateDeckModalOpen && (
        <Modal 
            isOpen={isGenerateDeckModalOpen} 
            onClose={() => { setIsGenerateDeckModalOpen(false); setModalError(null);}} 
            title={topicForModal ? `Add Cards to "${topicForModal.name}"` : "Add New Topic / Flashcards"}
            size="lg"
        >
          {modalError && <ErrorAlert message={modalError} onDismiss={() => setModalError(null)} />}
          <GenerateDeckForm
            onGenerateAndSave={handleGenerateAndSaveDeck}
            isLoading={isGenerating}
            userTopics={topics}
            currentTopic={topicForModal}
            onCancel={() => { setIsGenerateDeckModalOpen(false); setModalError(null); }}
          />
        </Modal>
      )}

      {isConfirmDeleteTopicModalOpen && (
        <ConfirmationModal
            isOpen={isConfirmDeleteTopicModalOpen}
            onClose={() => setIsConfirmDeleteTopicModalOpen(false)}
            onConfirm={confirmDeleteTopic}
            title="Confirm Topic Deletion"
            message={`Are you sure you want to delete the topic "${topics.find(t => t.id === topicIdToDelete)?.name || 'this topic'}"? This will also delete all its flashcards.`}
            confirmButtonText="Delete Topic"
        />
      )}

      {isEditFlashcardModalOpen && editingFlashcard && (
        <EditFlashcardModal
            isOpen={isEditFlashcardModalOpen}
            onClose={() => { setIsEditFlashcardModalOpen(false); setEditingFlashcard(null); setModalError(null);}}
            onSave={handleSaveEditedFlashcard}
            flashcard={editingFlashcard}
            isSaving={isSavingFlashcard}
            error={modalError}
            clearError={() => setModalError(null)}
        />
      )}

      {isConfirmDeleteFlashcardModalOpen && (
        <ConfirmationModal
            isOpen={isConfirmDeleteFlashcardModalOpen}
            onClose={() => { setIsConfirmDeleteFlashcardModalOpen(false); setModalError(null);}}
            onConfirm={handleConfirmDeleteFlashcard}
            title="Confirm Flashcard Deletion"
            message={`Are you sure you want to delete the flashcard "${currentFlashcards.find(fc => fc.id === flashcardToDeleteId)?.word || 'this card'}"?`}
            confirmButtonText="Delete Card"
        />
      )}
      
      <footer className="mt-auto pt-8 pb-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} LingoFlip AI. Enhance your vocabulary journey.</p>
      </footer>
    </div>
  );
};

export default App;
