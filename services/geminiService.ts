import {
  GoogleGenAI,
  Chat,
  Type,
  Modality
} from "@google/genai";

import {
  ParsedResume,
  InterviewQuestion,
  InterviewFeedback,
  InterviewField
} from "../types";

import { fileToBase64 } from "../utils/helpers";
import { STATIC_INTERVIEW_QUESTIONS } from "./mockInterviewData";

/* ======================================
   ✅ CORRECT API KEY HANDLING (VITE + TS)
====================================== */

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string;

if (!apiKey) {
  throw new Error("VITE_GOOGLE_API_KEY is missing");
}

const ai = new GoogleGenAI({ apiKey });

/* ======================================
   INTERVIEW QUESTIONS
====================================== */

export const getInterviewPrepData = async (
  field: InterviewField
): Promise<InterviewQuestion[]> => {

  const fieldQuestions = STATIC_INTERVIEW_QUESTIONS.filter(
    q => q.field === field
  );

  if (fieldQuestions.length >= 10) return fieldQuestions;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: `Generate 10 advanced interview questions for ${field}` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              category: { type: Type.STRING },
              bestAnswerHint: { type: Type.STRING }
            },
            required: ["id", "question", "category", "bestAnswerHint"]
          }
        }
      }
    });

    const dynamic = JSON.parse(response.text ?? "[]")
      .map((q: any) => ({ ...q, field }));

    return [...fieldQuestions, ...dynamic];
  } catch (err) {
    console.error("Failed to augment questions", err);
    return fieldQuestions;
  }
};

/* ======================================
   INTERVIEW FEEDBACK
====================================== */

export const getDeepAnalysisFeedback = async (
  transcript: string
): Promise<InterviewFeedback> => {

  const response = await ai.models.generateContent({
    model: "gemini-1.5-pro",
    contents: [
      {
        role: "user",
        parts: [
          { text: `Analyze this interview transcript:\n\n${transcript}` }
        ]
      }
    ],
    config: {
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          clarity: { type: Type.NUMBER },
          relevance: { type: Type.NUMBER },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["score", "clarity", "relevance", "suggestions"]
      }
    }
  });

  return JSON.parse(response.text ?? "{}");
};

/* ======================================
   RESUME STRENGTH
====================================== */

export const calculateResumeStrength = async (
  resume: ParsedResume
): Promise<{ score: number; tips: string[] }> => {

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: JSON.stringify(resume) }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text ?? '{"score":0,"tips":[]}');
};

/* ======================================
   LIVE INTERVIEW (AUDIO)
====================================== */

export const startLiveInterview = (callbacks: unknown) => {
  return ai.live.connect({
    model: "gemini-1.5-flash",
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction:
        "You are a senior hiring manager. Ask high-stakes follow-up questions."
    }
  });
};

/* ======================================
   CHAT INSTANCE
====================================== */

export const getChatInstance = (): Chat => {
  return ai.chats.create({
    model: "gemini-1.5-pro",
    config: {
      systemInstruction:
        "You are an AI Career Coach. Be precise, practical, and industry-aware."
    }
  });
};

/* ======================================
   RESUME PARSER
====================================== */

export const parseResumeWithGemini = async (
  file: File
): Promise<ParsedResume> => {

  const base64Data = await fileToBase64(file);

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: "Extract resume data in JSON format."
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text ?? "{}");
};
