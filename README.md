# LingoFlip AI: AI-Powered Flashcards & Vocabulary Builder

LingoFlip AI is an interactive web application designed to help users learn English vocabulary effectively. Leveraging the power of Google's Gemini AI and a Supabase backend, users can create accounts, generate custom flashcard decks (called "topics"), save them, and test their knowledge with AI-generated multiple-choice questions.

## ✨ Key Features

*   **User Accounts & Data Persistence (NEW):**
    *   Secure user registration and login via Supabase Authentication.
    *   All user-created topics and flashcards are saved to their personal account in a Supabase PostgreSQL database.
*   **AI-Powered Topic & Flashcard Generation:**
    *   Logged-in users can create "topics" (e.g., "Travel Vocabulary," "Business Idioms").
    *   Specify the number of flashcards to generate for a topic (1-20).
    *   The Gemini AI generates relevant words, clear definitions, and contextual example sentences.
    *   **Uniqueness Ensured (NEW):** When adding cards to an existing topic, the AI ensures newly generated definitions are unique within that topic.
*   **Topic Dashboard & Management (NEW):**
    *   View all saved topics with card counts.
    *   Option to add more AI-generated cards to an existing topic.
    *   Delete entire topics (which also deletes associated flashcards).
*   **Flashcard Management within a Topic (NEW & UPDATED):**
    *   View all flashcards for a selected topic in a list.
    *   Edit individual flashcards (word, definition, example sentence).
    *   Delete individual flashcards from a topic.
*   **Interactive Flashcard Study:**
    *   Initiate a study session for any saved topic.
    *   Click to flip cards, navigate with "Next/Previous," and shuffle the deck.
*   **Customizable AI-Generated Tests (UPDATED):**
    *   From a topic's card list, select specific flashcards (one, many, or all) to include in a test.
    *   The AI generates a unique multiple-choice question (MCQ) for each selected card (fill-in-the-blank style).
    *   Receive immediate feedback and AI-generated explanations.
*   **Test Summary & Retry:**
    *   View test scores and retry tests with the same (shuffled) questions.
*   **User-Friendly Interface:**
    *   Clean, responsive design (Tailwind CSS).
    *   Loading indicators and clear error messages.
    *   Modal-driven interface for creating/editing topics and flashcards.

## 🛠️ Technology Stack

*   **Frontend:**
    *   React (v19+) with Hooks
    *   TypeScript
*   **Backend & Database (NEW):**
    *   Supabase (Authentication, PostgreSQL Database)
    *   `@supabase/supabase-js` client library
*   **AI Integration:**
    *   Google Gemini API (`@google/genai` library)
    *   Model: `gemini-2.5-flash-preview-04-17`
*   **Styling:**
    *   Tailwind CSS (via CDN)
*   **Module Management:**
    *   ES Modules imported directly via `esm.sh` in `index.html`.

## 🚀 Getting Started

This project runs directly in a modern web browser.

### Prerequisites

*   A modern web browser.
*   An active internet connection.

### Environment Variable Setup (Crucial for API Integration)

LingoFlip AI requires environment variables to be configured for both Google Gemini AI and Supabase services.

**Required Environment Variables:**

1.  **`GEMINI_API_KEY` (Google Gemini API Key):**
    *   Obtain from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   The application code (e.g., `services/geminiService.ts`) directly tries to access `process.env.GEMINI_API_KEY`.

2.  **`SUPABASE_URL` (Supabase Project URL):**
    *   Your Supabase project URL (e.g., `https://your-project-id.supabase.co`).
    *   Found in your Supabase project settings.

3.  **`SUPABASE_ANON_KEY` (Supabase Anonymous Key):**
    *   Your Supabase project's anonymous/public key.
    *   Found in your Supabase project settings under API keys.

**Setting Environment Variables (Examples):**

*   **Local Development (using a bundler like Vite/Parcel or Node.js server):**
    *   Create a `.env` file in the project root (ensure this file is **not** committed to public version control).
      ```env
      # .env - API Keys và Database Configuration
      GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
      SUPABASE_URL="https://your-project-id.supabase.co"
      SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
      ```
*   **Simple Local `index.html` Testing (Workaround - Not Recommended for Production/Security):**
    *   For basic testing without a build process, you can *temporarily* inject these into the `window` or `process.env` object via a script tag in `index.html` **before** other scripts load. This is insecure for real API keys if the code is ever public.
    ```html
    <!-- In index.html, before other script imports -->
    <script>
      // WARNING: Only for very temporary local testing. Do NOT commit real keys like this.
      var process = process || {}; // Ensure process exists
      process.env = process.env || {}; // Ensure process.env exists
      process.env.GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
      process.env.SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
      process.env.SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";
    </script>
    ```
*   **Deployment (Vercel, Netlify, etc.):**
    *   Configure all three environment variables (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) in your hosting platform's project settings. This is the **secure and recommended** way for production.

**Note:** If the environment variables are not detected, AI generation features will fall back to dummy data and the Supabase connection will fail, preventing user authentication and data persistence.

### Supabase Setup

1.  **Environment Variables Configuration:**
    *   Set up your Supabase project URL and anonymous key as environment variables (see above).
    *   Ensure your Supabase project is active and accessible.

2.  **Database Schema:**
    *   In the Supabase SQL Editor for your project, run the SQL schema provided in the project documentation (or `docs/supabase_schema.sql` if available) to create the `topics` and `flashcards` tables and set up Row Level Security (RLS) policies. This is crucial for data security.

3.  **Authentication Settings:**
    *   Ensure Email confirmations are enabled in your Supabase project's Auth settings (Authentication -> Providers -> Email -> Enable "Confirm email").

### Running the Application

1.  Ensure all project files are in the correct directory structure.
2.  Set up all required environment variables (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) as described above.
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open your web browser and navigate to the provided local development URL (typically `http://localhost:5173`).

## 📖 How to Use

1.  **Register/Login:**
    *   Create an account or sign in to access your personalized LingoFlip AI dashboard.
2.  **Topic Dashboard:**
    *   View your existing topics or click "Add New Topic/Flashcards" (opens a modal).
3.  **Generate Flashcards for a Topic:**
    *   In the modal, if creating a new topic, provide a name. If adding to an existing one, select it.
    *   Select the number of new cards to generate.
    *   Click "Generate Cards." The AI will create new cards with unique definitions for that topic, and they will be saved.
4.  **Manage Topic Cards:**
    *   From the dashboard, click the "Edit" icon (pencil) next to a topic, or "Practice" and then navigate to the card list view.
    *   Here you can edit or delete individual flashcards. Editing opens a modal for changes.
    *   When in "Practice" mode, you can select cards for a test.
5.  **Study Flashcards:**
    *   From the dashboard, click on a topic's name to enter "Study Deck" mode.
    *   Navigate, flip, and shuffle cards.
6.  **Take a Test:**
    *   In the "Practice" view for a topic, select the cards you want to be tested on (default is all).
    *   Click "Start Test with Selected Cards."
    *   Answer AI-generated MCQs and receive immediate feedback.
7.  **Review Your Score:**
    *   After the test, view your score and choose to retry or return to the card list.

## 📁 Project Structure (Simplified)

```
/
├── index.html                # Main HTML entry point
├── index.tsx                 # React app entry point
├── App.tsx                   # Main application component (state, logic, routing)
├── types.ts                  # TypeScript type definitions
├── metadata.json             # Application metadata
│
├── components/               # UI components
│   ├── AuthForm.tsx          # User login/signup (NEW)
│   ├── TopicDashboard.tsx    # Lists user's topics (NEW)
│   ├── FlashcardListView.tsx # Lists cards in a topic, allows selection for test/editing (NEW)
│   ├── GenerateDeckForm.tsx  # Form for generating cards for a topic (UPDATED, used in modal)
│   ├── FlashcardView.tsx     # Displays a single flashcard
│   ├── DeckControls.tsx      # Controls for study mode
│   ├── TestView.tsx          # Displays MCQ and handles test interaction
│   ├── TestSummaryView.tsx   # Displays test results
│   ├── Modal.tsx             # Generic modal component (NEW)
│   ├── ConfirmationModal.tsx # Generic confirmation dialog (NEW)
│   ├── EditFlashcardModal.tsx# Modal for editing a flashcard (NEW)
│   ├── LoadingSpinner.tsx    # Loading animation
│   └── ErrorAlert.tsx        # Displays error messages
│
└── services/                 # External service integrations
    ├── supabaseService.ts    # Handles Supabase auth and database interactions (UPDATED)
    └── geminiService.ts      # Handles Google Gemini API communication (UPDATED)
```

## 🔮 Future Enhancements (from BRD v2.0)

*   Spaced repetition system (SRS).
*   Sharing decks between users.
*   Advanced user analytics.

## 📄 License

This project is open-source. (Consider adding an MIT License if sharing widely).
(No license file currently included)

---

Happy Learning with LingoFlip AI!