import React from 'react';

interface DeckControlsProps {
  onNext: () => void;
  onPrevious: () => void;
  onFlip: () => void;
  onShuffle: () => void;
  canPrevious: boolean;
  canNext: boolean;
  isDeckEmpty: boolean;
  deckSize: number;
}

const PrevIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const NextIcon: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const FlipIcon: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ShuffleIcon: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h18m-7.5-3.75h7.5a3.75 3.75 0 1 1-7.5 0h-7.5a3.75 3.75 0 1 1 7.5 0h7.5Z" />
</svg>
);

const DeckControls: React.FC<DeckControlsProps> = ({ 
    onNext, 
    onPrevious, 
    onFlip, 
    onShuffle, 
    canPrevious, 
    canNext, 
    isDeckEmpty,
    deckSize
}) => {
  const baseButtonClass = "px-4 py-2 rounded-lg font-semibold transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex items-center justify-center space-x-2";
  const primaryButtonClass = `${baseButtonClass} bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white focus:ring-sky-400`;
  const secondaryButtonClass = `${baseButtonClass} bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 focus:ring-slate-400`;
  const disabledButtonClass = "opacity-50 cursor-not-allowed";

  return (
    <div className="flex flex-wrap justify-center gap-3 my-6 animate-fadeIn">
      <button
        onClick={onPrevious}
        disabled={!canPrevious || isDeckEmpty}
        className={`${secondaryButtonClass} ${(!canPrevious || isDeckEmpty) ? disabledButtonClass : ''}`}
        aria-label="Previous card"
      >
        <PrevIcon />
        <span>Prev</span>
      </button>
      <button
        onClick={onFlip}
        disabled={isDeckEmpty}
        className={`${primaryButtonClass} ${(isDeckEmpty) ? disabledButtonClass : ''}`}
        aria-label="Flip card"
      >
        <FlipIcon />
        <span>Flip</span>
      </button>
      <button
        onClick={onNext}
        disabled={!canNext || isDeckEmpty}
        className={`${secondaryButtonClass} ${(!canNext || isDeckEmpty) ? disabledButtonClass : ''}`}
        aria-label="Next card"
      >
        <span>Next</span>
        <NextIcon />
      </button>
      <button
        onClick={onShuffle}
        disabled={isDeckEmpty || deckSize <= 1}
        className={`${secondaryButtonClass} ${(isDeckEmpty || deckSize <= 1) ? disabledButtonClass : ''} min-w-[110px]`}
        aria-label="Shuffle deck"
      >
        <ShuffleIcon />
        <span>Shuffle</span>
      </button>
    </div>
  );
};

export default DeckControls;