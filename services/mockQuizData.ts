
import { QuizQuestion, InterviewField } from '../types';

const createFieldQuestions = (field: InterviewField, startId: number): QuizQuestion[] => {
  const templates = [
    { q: "What is the primary benefit of...", o: ["Scalability", "Security", "Cost", "Simplicity"], a: 0, e: "Scalability is often the primary driver for this technology." },
    { q: "In the context of {}, which of these is best practice?", o: ["Hardcoding", "Code Reviews", "Ignoring logs", "Single point of failure"], a: 1, e: "Code reviews are essential for maintaining quality." },
    { q: "Which tool is most commonly used for...", o: ["Notepad", "Docker", "Excel", "MS Paint"], a: 1, e: "Industry standards often favor containerization." },
    { q: "The term '{}' refers to...", o: ["A bug", "A methodology", "A hardware component", "A coffee brand"], a: 1, e: "This is a key methodological concept in the field." }
  ];

  return Array.from({ length: 20 }).map((_, i) => {
    const template = templates[i % templates.length];
    return {
      id: `${field.toLowerCase().replace(/\s/g, '-')}-${startId + i}`,
      field,
      question: template.q.replace('{}', field) + ` (Q${i + 1})`,
      options: template.o,
      correctAnswer: template.a,
      explanation: template.e
    };
  });
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  ...createFieldQuestions('Software Engineering', 100),
  ...createFieldQuestions('Data Science', 200),
  ...createFieldQuestions('Product Management', 300),
  ...createFieldQuestions('AI & ML', 400),
  ...createFieldQuestions('Cloud & DevOps', 500),
];
