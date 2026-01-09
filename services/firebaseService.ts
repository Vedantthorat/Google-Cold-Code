
import { InterviewFeedback } from '../types';

// Mocking Firebase Firestore functionality
export const saveInterviewSession = async (userId: string, feedback: InterviewFeedback) => {
  console.log(`[Firebase] Saving session for user ${userId} to Firestore...`);
  const sessions = JSON.parse(localStorage.getItem('interview_sessions') || '[]');
  const newSession = {
    id: `session_${Date.now()}`,
    date: new Date().toISOString(),
    ...feedback
  };
  sessions.push(newSession);
  localStorage.setItem('interview_sessions', JSON.stringify(sessions));
  return newSession;
};

export const getInterviewHistory = async (userId: string) => {
  return JSON.parse(localStorage.getItem('interview_sessions') || '[]');
};
