import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FlashcardItem, MCQItem, MCQOption } from '../types';

const GEMINI_API_KEY   = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} else {
  console.warn("GEMINI_API_KEY environment variable not set. Gemini API features will be disabled. Using placeholder data.");
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
    // Fallback for flashcard array
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
          return objects as T;
        }
    }
    // Fallback for single MCQItem
     try {
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
            return extractedMCQ as T;
        }
    } catch (e) {
        console.error("Error during MCQ regex extraction attempt:", e);
    }
    console.error("Failed to parse JSON with direct parse and specific fallbacks. Full string:", jsonStr);
    return null;
  }
};

export const generateFlashcardsFromAPI = async (
  topicName: string,
  count: number,
  existingDefinitionsInTopic: string[] = [],
  definitionsToProcess?: string[]
): Promise<Omit<FlashcardItem, 'id' | 'topic_id' | 'user_id' | 'created_at' | 'updated_at'>[]> => {
  if (!ai) {
    console.warn("Gemini AI client not initialized. API key might be missing.");
    if (definitionsToProcess && definitionsToProcess.length > 0) {
        return Promise.resolve(
            definitionsToProcess.map((def, i) => ({
                word: `Dummy Word for Def ${i + 1}`,
                definition: def,
                exampleSentence: `This is a dummy example for the provided definition: "${def.substring(0,30)}...".`
            }))
        );
    }
    return Promise.resolve(
        Array.from({ length: count }, (_, i) => ({
            word: `Dummy Word ${i + 1} for ${topicName}`,
            definition: `This is a placeholder definition for ${topicName} as the API key is not configured. Def #${i+1}`,
            exampleSentence: `This is a dummy example sentence for word ${i + 1}.`
        }))
    );
  }

  let prompt: string;

  const existingDefinitionsPrompt = 
    existingDefinitionsInTopic.length > 0 
    ? `The following definitions ALREADY EXIST for this topic. Please ensure your new flashcards (words, definitions, examples) are DIFFERENT from these existing ones:
${existingDefinitionsInTopic.map(def => `- "${def.replace(/"/g, '\\"')}"`).join('\n')}`
    : "";

  if (definitionsToProcess && definitionsToProcess.length > 0 && count === definitionsToProcess.length) {
    // Mode: Generate for a specific list of definitions
    prompt = `Generate ${count} English vocabulary flashcards for a learner.
For each flashcard, use one of the provided definitions below, then generate a suitable word and an example sentence.
The flashcards should be relevant to the topic: "${topicName}".

The ${count} definition(s) to use are:
${definitionsToProcess.map(def => `- "${def.replace(/"/g, '\\"')}"`).join('\n')}

${existingDefinitionsPrompt}

Return the response as a JSON array, where each object has keys: "word", "definition", "exampleSentence".
The "definition" field in your JSON output for each item MUST EXACTLY MATCH one of_the definitions provided in the list above.
Ensure each "word" is concise, ideally one or two words.
Ensure "exampleSentence" effectively uses the word.
Ensure the generated "word" and "exampleSentence" are distinct and not already covered by the "ALREADY EXIST" list if provided.

Example of a single item in the array for a provided definition "Lasting for a very short time.":
{
  "word": "Ephemeral",
  "definition": "Lasting for a very short time.", 
  "exampleSentence": "The beauty of the cherry blossoms is ephemeral, lasting only a week."
}`;

  } else {
    // Mode: Generate 'count' new cards for a topic
    prompt = `Generate ${count} English vocabulary flashcards for a learner.
For each flashcard, provide the word, its definition, and an example sentence.
The words should be related to the topic: "${topicName}".
${existingDefinitionsPrompt}
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
  }


  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: (definitionsToProcess && definitionsToProcess.length > 0) ? 0.6 : 0.75, // Slightly less temp for specific definitions
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
        // Attempt to find an array key if the response is an object containing the array
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
    
    const flashcards: Omit<FlashcardItem, 'id' | 'topic_id' | 'user_id' | 'created_at' | 'updated_at'>[] = rawFlashcards.map((item: any) => ({
      word: item.word || "N/A",
      definition: item.definition || "N/A",
      exampleSentence: item.exampleSentence || "N/A",
    })).filter(card => card.word !== "N/A" && card.definition !== "N/A" && card.exampleSentence !== "N/A");

    if (flashcards.length === 0 && rawFlashcards.length > 0) {
        console.warn("All flashcards were filtered out as malformed. Original data:", rawFlashcards);
        throw new Error("Generated flashcards were malformed or empty after validation.");
    }
    if (flashcards.length === 0 && count > 0) {
       // This can happen if definitionsToProcess was empty after filtering, or if AI failed to generate.
       // The error message might need to be more specific based on the calling context in App.tsx.
       throw new Error("No valid flashcards were generated. The model returned an empty list, an unexpected format, or all inputs were filtered.");
    }

    // If processing specific definitions, ensure the output count matches input count
    // and that definitions match. This is a basic sanity check.
    if (definitionsToProcess && definitionsToProcess.length > 0) {
        if (flashcards.length !== definitionsToProcess.length) {
            console.warn(`Mismatch in generated cards count. Expected: ${definitionsToProcess.length}, Got: ${flashcards.length}. This might indicate AI partial failure or misinterpretation.`);
            // Don't throw an error, but log it. App.tsx will save what was returned.
        }
        // Further validation could check if returned definitions match inputs, but can be complex if AI slightly alters them.
        // The prompt strongly requests exact match.
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
    const dummyDistractors = ["Option A (Dummy)", "Option B (Dummy)", "Option C (Dummy)"];
    const options: MCQOption[] = [
      { text: flashcard.word, isCorrect: true },
      ...dummyDistractors.map(d => ({ text: d, isCorrect: false }))
    ].sort(() => Math.random() - 0.5); 

    return Promise.resolve({
      questionSentence: flashcard.exampleSentence.replace(new RegExp(`\\b${flashcard.word}\\b`, 'gi'), "______") + " (Dummy MCQ - API Key Missing)",
      options: options,
      explanation: `Correct Answer: ${flashcard.word}. This is a dummy explanation because the API key is not configured. It should explain why '${flashcard.word}' is correct and why other options are incorrect, including their meanings.`,
      originalWord: flashcard.word
    });
  }

  const prompt = `
Given the flashcard:
Word: "${flashcard.word}"
Definition: "${flashcard.definition}"
Example Sentence: "${flashcard.exampleSentence}"

Generate a multiple-choice question (MCQ) to test the understanding of the word "${flashcard.word}" in the context of its example sentence.
The question should be a "fill in the blank" style, where the blank replaces ALL instances of the word "${flashcard.word}" (case-insensitive) in the example sentence.

Provide:
1. "questionSentence": The example sentence with ALL instances of "${flashcard.word}" (case-insensitive) replaced by "______" (a blank).
2. "correctAnswer": The original word "${flashcard.word}".
3. "distractors": An array of 3 plausible but incorrect words that could fit the blank grammatically but not contextually or semantically, considering the definition. These should be different from the correct answer and from each other. Ensure they are single words or very short phrases if the original word is.
4. "explanation": A comprehensive explanation as a single string. This explanation MUST include:
    a. Why the "correctAnswer" ("${flashcard.word}") is right, referencing its definition and the sentence context.
    b. For EACH of the 3 "distractors":
        i. Briefly state its meaning.
        ii. Explain why it is an incorrect choice for the blank in the provided "questionSentence".
    Format the explanation for readability, perhaps using newlines to separate points for the correct answer and each distractor.

Return this information as a single JSON object with keys: "questionSentence", "correctAnswer", "distractors" (an array of 3 strings), and "explanation".

Example for word "Ephemeral" and sentence "The beauty of the cherry blossoms is ephemeral, lasting only a week. This ephemeral sight is cherished.":
{
  "questionSentence": "The beauty of the cherry blossoms is ______, lasting only a week. This ______ sight is cherished.",
  "correctAnswer": "Ephemeral",
  "distractors": ["Permanent", "Ubiquitous", "Silent"],
  "explanation": "The correct answer is 'Ephemeral' because it means 'lasting for a very short time,' which perfectly describes cherry blossoms that last only a week and are cherished for their brief appearance.\\n\\nIncorrect options:\\n- 'Permanent' means 'lasting or intended to last or remain unchanged indefinitely.' This is incorrect because the sentence states the blossoms last 'only a week,' which is not permanent.\\n- 'Ubiquitous' means 'present, appearing, or found everywhere.' While cherry blossoms might be widespread, the sentence's focus ('lasting only a week') is on their short duration, not their pervasiveness.\\n- 'Silent' means 'not making or accompanied by any sound.' This is irrelevant to the context of the blossoms' lifespan and visual beauty described in the sentence."
}

A real example for a different word "launch":
Original sentence: "The company decided to launch its new product line next month."
{
  "questionSentence": "The company decided to ______ its new product line next month.",
  "correctAnswer": "launch",
  "distractors": ["eat", "sleep", "justify"],
  "explanation": "The correct answer is 'launch' because 'to launch a product' means to introduce it to the market. This fits the context of a company and its new product line being introduced next month.\\n\\nIncorrect options:\\n- 'eat' means 'to put food into the mouth and chew and swallow it.' This does not make sense in the context of a product line.\\n- 'sleep' means 'to rest your mind and body by closing your eyes and becoming unconscious.' This is also irrelevant to a company's action with a product line.\\n- 'justify' means 'to show or prove to be right or reasonable.' While a company might justify a product line, the blank describes the action of introducing it, not defending it."
}
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.75, // Increased temperature for more variability
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

    if (!parsedMCQData || !parsedMCQData.correctAnswer || !parsedMCQData.distractors || parsedMCQData.distractors.length < 3 || !parsedMCQData.explanation) {
      console.error(`Failed to parse valid MCQ data from Gemini response for word "${flashcard.word}". Response text:`, responseText, "Parsed data:", parsedMCQData);
      throw new Error(`Failed to parse valid MCQ data for word "${flashcard.word}". The AI response might be malformed or incomplete.`);
    }
        
    const options: MCQOption[] = [
      { text: parsedMCQData.correctAnswer, isCorrect: true },
      ...parsedMCQData.distractors.slice(0, 3).map(d => ({ text: d, isCorrect: false }))
    ];
    
    // Shuffle options array
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
      questionSentence: parsedMCQData.questionSentence,
      options,
      explanation: parsedMCQData.explanation,
      originalWord: flashcard.word
    };

  } catch (error) {
    console.error(`Error generating MCQ for flashcard word "${flashcard.word}" with Gemini:`, error);
    const errorMessage = error instanceof Error ? error.message : `An unknown error occurred while generating MCQ for "${flashcard.word}".`;
     const dummyDistractors = ["Option A Error", "Option B Error", "Option C Error"];
      const fallbackOptions: MCQOption[] = [
        { text: flashcard.word, isCorrect: true },
        ...dummyDistractors.map(d => ({ text: d, isCorrect: false }))
      ].sort(() => Math.random() - 0.5);

    return {
      questionSentence: flashcard.exampleSentence.replace(new RegExp(`\\b${flashcard.word}\\b`, 'gi'), "______") + ` (Error generating MCQ: ${errorMessage.substring(0,100)})`,
      options: fallbackOptions,
      explanation: `Correct Answer: ${flashcard.word}. Could not generate detailed explanation due to error: ${errorMessage.substring(0,100)}. Normally, this would explain why '${flashcard.word}' is correct and why other options are incorrect.`,
      originalWord: flashcard.word
    };
  }
};