
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FlashcardItem, MCQItem, MCQOption } from '../types';

const API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY environment variable not set. Gemini API features will be disabled. Using placeholder data.");
}

const parseGeminiJsonResponse = <T,>(responseText: string): T | null => {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const fenceMatch = jsonStr.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.warn("Failed to parse JSON response (attempt 1):", error, "Raw string (after fence removal):", jsonStr.substring(0, 500));

    // Fallback for flashcard array (if previous attempt failed)
    if (jsonStr.startsWith('[') && jsonStr.endsWith(']')) {
        const objects: Record<string, string>[] = [];
        const objectRegex = /\{\s*"word"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"definition"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"exampleSentence"\s*:\s*"((?:\\.|[^"\\])*)"\s*\}/g;
        let match;
        while ((match = objectRegex.exec(jsonStr)) !== null) {
          objects.push({
            word: match[1].replace(/\\"/g, '"'),
            definition: match[2].replace(/\\"/g, '"'),
            exampleSentence: match[3].replace(/\\"/g, '"'),
          });
        }
        if (objects.length > 0) {
          console.warn(`Successfully extracted ${objects.length} individual flashcard objects via regex fallback for array.`);
          return objects as T; // Assuming T is FlashcardItem[]
        }
    }
    // Fallback for single MCQItem (if previous attempt failed)
     try {
        // More flexible regex for MCQ, handling potential variations in spacing or optional quotes around keys
        const mcqObjectRegex = /\{\s*(?:"?word"?:\s*"((?:\\.|[^"\\])*)"\s*,)?\s*"?questionSentence"?\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"?correctAnswer"?\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"?distractors"?\s*:\s*\[\s*("((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)")\s*\]\s*,\s*"?explanation"?\s*:\s*"((?:\\.|[^"\\])*)"\s*\}/is;
        const mcqMatch = jsonStr.match(mcqObjectRegex);
        if (mcqMatch) {
            const extractedMCQ = {
                questionSentence: mcqMatch[2]?.replace(/\\"/g, '"') || "",
                correctAnswer: mcqMatch[3]?.replace(/\\"/g, '"') || "",
                distractors: [
                    mcqMatch[5]?.replace(/\\"/g, '"') || "Distractor1",
                    mcqMatch[6]?.replace(/\\"/g, '"') || "Distractor2",
                    mcqMatch[7]?.replace(/\\"/g, '"') || "Distractor3",
                ],
                explanation: mcqMatch[8]?.replace(/\\"/g, '"') || "",
            };
            console.warn("Successfully extracted single MCQ object via regex fallback.");
            return extractedMCQ as T; // Assuming T is compatible with this structure
        }
    } catch (e) {
        console.error("Error during MCQ regex extraction attempt:", e);
    }


    console.error("Failed to parse JSON with direct parse and specific fallbacks. Full string:", jsonStr);
    return null;
  }
};

export const generateFlashcardsFromAPI = async (topic: string, count: number): Promise<FlashcardItem[]> => {
  if (!ai) {
    console.warn("Gemini AI client not initialized. API key might be missing.");
    return Promise.resolve(
        Array.from({ length: count }, (_, i) => ({
            id: `dummy-${topic.replace(/\s+/g, '-')}-${i}-${Date.now()}`,
            word: `Dummy Word ${i + 1} for ${topic}`,
            definition: "This is a placeholder definition as the API key is not configured.",
            exampleSentence: `This is a dummy example sentence for word ${i + 1}.`
        }))
    );
  }

  const prompt = `Generate ${count} English vocabulary flashcards for a learner.
For each flashcard, provide the word, its definition, and an example sentence.
The words should be related to the topic: "${topic}".
Return the response as a JSON array, where each object has keys: "word", "definition", "exampleSentence".
Ensure each "word" is concise, ideally one or two words.
Ensure "definition" is clear and suitable for an English learner.
Ensure "exampleSentence" effectively uses the word.
Example of a single item in the array:
{
  "word": "Ephemeral",
  "definition": "Lasting for a very short time.",
  "exampleSentence": "The beauty of the cherry blossoms is ephemeral, lasting only a week."
}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7, 
      },
    });

    const responseText = response.text;
    if (!responseText) {
      console.error("Gemini API returned an empty response text for flashcards.");
      throw new Error("Gemini API returned an empty response for flashcards.");
    }
    
    const parsedData = parseGeminiJsonResponse<any>(responseText);

    if (!parsedData) {
        console.error("Failed to parse flashcards data from Gemini response text (even with fallbacks):", responseText);
        throw new Error("Failed to parse flashcards data from Gemini response.");
    }
    
    let rawFlashcards: any[];

    if (Array.isArray(parsedData)) {
        rawFlashcards = parsedData;
    } else if (typeof parsedData === 'object' && parsedData !== null) {
        const arrayKey = Object.keys(parsedData).find(key => Array.isArray(parsedData[key]));
        if (arrayKey && Array.isArray(parsedData[arrayKey])) {
            rawFlashcards = parsedData[arrayKey];
        } else {
            console.error("Parsed JSON for flashcards is not an array and no array property found:", parsedData);
            throw new Error("Parsed JSON response for flashcards is not in the expected format (array not found).");
        }
    } else {
        console.error("Parsed JSON for flashcards is not an array or a suitable object:", parsedData);
        throw new Error("Parsed JSON response for flashcards is not in the expected format.");
    }

    if (!Array.isArray(rawFlashcards)) {
      console.error("Parsed flashcards data is not an array:", rawFlashcards);
      throw new Error("Formatted flashcards data is not an array.");
    }
    
    const flashcards: FlashcardItem[] = rawFlashcards.map((item: any, index: number) => ({
      id: `${topic.replace(/\s+/g, '-')}-flashcard-${index}-${Date.now()}`,
      word: item.word || "N/A - Check Format",
      definition: item.definition || "N/A - Check Format",
      exampleSentence: item.exampleSentence || "N/A - Check Format",
    })).filter(card => card.word !== "N/A - Check Format" && card.definition !== "N/A - Check Format" && card.exampleSentence !== "N/A - Check Format");

    if (flashcards.length === 0 && rawFlashcards.length > 0) {
        console.warn("All flashcards were filtered out as malformed. Original data:", rawFlashcards);
        throw new Error("Generated flashcards were malformed or empty after validation.");
    }
    if (flashcards.length === 0 && count > 0) {
       throw new Error("No valid flashcards were generated. The model returned an empty list or an unexpected format.");
    }
    return flashcards;

  } catch (error) {
    console.error("Error generating flashcards with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating flashcards.";
    throw new Error(`Failed to generate flashcards: ${errorMessage}`);
  }
};


export const generateMCQForFlashcard = async (flashcard: FlashcardItem): Promise<Omit<MCQItem, 'id' | 'flashcardId'>> => {
  if (!ai) {
    console.warn("Gemini AI client not initialized for MCQ. API key might be missing.");
    // Provide a dummy MCQ if API is not available
    const dummyDistractors = ["Option A", "Option B", "Option C"];
    const options: MCQOption[] = [
      { text: flashcard.word, isCorrect: true },
      ...dummyDistractors.map(d => ({ text: d, isCorrect: false }))
    ].sort(() => Math.random() - 0.5); // Shuffle options

    return Promise.resolve({
      questionSentence: flashcard.exampleSentence.replace(new RegExp(`\\b${flashcard.word}\\b`, 'gi'), "______") + " (Dummy MCQ - API Key Missing)",
      options: options,
      explanation: "This is a dummy explanation because the API key is not configured.",
      originalWord: flashcard.word
    });
  }

  const prompt = `
Given the flashcard:
Word: "${flashcard.word}"
Definition: "${flashcard.definition}"
Example Sentence: "${flashcard.exampleSentence}"

Generate a multiple-choice question (MCQ) to test the understanding of the word "${flashcard.word}" in the context of its example sentence.
The question should be a "fill in the blank" style, where the blank replaces the word "${flashcard.word}" in the example sentence.

Provide:
1. "questionSentence": The example sentence with ALL instances of "${flashcard.word}" (case-insensitive) replaced by "______" (a blank).
2. "correctAnswer": The original word "${flashcard.word}".
3. "distractors": An array of 3 plausible but incorrect words that could fit the blank grammatically but not contextually or semantically, considering the definition. These should be different from the correct answer and from each other. Ensure they are single words or very short phrases if the original word is.
4. "explanation": A brief explanation (1-2 sentences) of why "${flashcard.word}" is the correct answer for the sentence, ideally referencing its definition or contextual clues in the sentence.

Return this information as a single JSON object with keys: "questionSentence", "correctAnswer", "distractors" (an array of 3 strings), and "explanation".

Example for word "Ephemeral" and sentence "The beauty of the cherry blossoms is ephemeral, lasting only a week. This ephemeral sight is cherished.":
{
  "questionSentence": "The beauty of the cherry blossoms is ______, lasting only a week. This ______ sight is cherished.",
  "correctAnswer": "Ephemeral",
  "distractors": ["Permanent", "Lasting", "Eternal"],
  "explanation": "'Ephemeral' means lasting for a very short time. This fits the context of cherry blossoms lasting only a week and the sight being cherished because it's temporary."
}
A real example:
{
  "questionSentence": "The company decided to ______ its new product line next month.",
  "correctAnswer": "launch",
  "distractors": ["eat", "sleep", "justify"],
  "explanation": "'Launch' means to introduce a new product, which fits the context of a company and its new product line."
}
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6, // Slightly lower temperature for more predictable MCQ generation
      },
    });

    const responseText = response.text;
    if (!responseText) {
      console.error(`Gemini API returned an empty response text for MCQ generation for word: "${flashcard.word}".`);
      throw new Error(`Gemini API returned an empty response for MCQ for word: "${flashcard.word}".`);
    }

    const parsedMCQData = parseGeminiJsonResponse<{
      questionSentence: string;
      correctAnswer: string;
      distractors: string[];
      explanation: string;
    }>(responseText);

    if (!parsedMCQData || !parsedMCQData.correctAnswer || !parsedMCQData.distractors || parsedMCQData.distractors.length < 3) {
      console.error(`Failed to parse valid MCQ data from Gemini response for word "${flashcard.word}". Response text:`, responseText, "Parsed data:", parsedMCQData);
      throw new Error(`Failed to parse valid MCQ data for word "${flashcard.word}".`);
    }
    
    // Ensure the correctAnswer from API matches the flashcard's word, with flexibility for minor variations (e.g. case) if necessary, though prompt asks for original.
    // For stricter matching, use: if (parsedMCQData.correctAnswer !== flashcard.word) { // throw error or log warning }
    
    const options: MCQOption[] = [
      { text: parsedMCQData.correctAnswer, isCorrect: true },
      ...parsedMCQData.distractors.slice(0, 3).map(d => ({ text: d, isCorrect: false }))
    ];
    
    // Shuffle options client-side to ensure randomness if API doesn't shuffle
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
      questionSentence: parsedMCQData.questionSentence,
      options,
      explanation: parsedMCQData.explanation,
      originalWord: flashcard.word // Store the original word for reference
    };

  } catch (error) {
    console.error(`Error generating MCQ for flashcard word "${flashcard.word}" with Gemini:`, error);
    const errorMessage = error instanceof Error ? error.message : `An unknown error occurred while generating MCQ for "${flashcard.word}".`;
    // Fallback to a dummy/error MCQ to avoid breaking the entire test generation
     const dummyDistractors = ["Option A", "Option B", "Option C"];
      const fallbackOptions: MCQOption[] = [
        { text: flashcard.word, isCorrect: true },
        ...dummyDistractors.map(d => ({ text: d, isCorrect: false }))
      ].sort(() => Math.random() - 0.5);

    return {
      questionSentence: flashcard.exampleSentence.replace(new RegExp(`\\b${flashcard.word}\\b`, 'gi'), "______") + ` (Error generating: ${errorMessage})`,
      options: fallbackOptions,
      explanation: `Could not generate explanation due to error: ${errorMessage}`,
      originalWord: flashcard.word
    };
  }
};
