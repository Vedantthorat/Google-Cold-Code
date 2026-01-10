
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Student' | 'Recruiter' | 'Admin';
  bio?: string;
  location?: string;
  linkedinUrl?: string;
  jobStatus?: 'Searching' | 'Open' | 'Hired';
  fitScore?: number;
  jobReadiness?: number;
  skillsMastery?: number;
  resumeStrength?: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: (userUpdate?: Partial<User>) => void;
  updateUser: (data: Partial<User>) => void;
}

export enum Theme {
  Light = 'light',
  Dark = 'dark'
}

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
  };
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    responsibilities: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
}

export interface Recommendation {
  id: string;
  type: 'Job' | 'Course' | 'Project' | 'Mentor' | 'Internship';
  title: string;
  source: string;
  summary: string;
  reason: string;
  relevance: number;
}

export type InterviewField = 'Software Engineering' | 'Data Science' | 'Product Management' | 'AI & ML' | 'Cloud & DevOps';

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'Behavioral' | 'Technical' | 'General';
  field: InterviewField;
  bestAnswerHint: string;
  mastered?: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface InterviewFeedback {
  score: number;
  clarity: number;
  relevance: number;
  suggestions: string[];
  date?: string;
}

export interface QuizQuestion {
  id: string;
  field: InterviewField;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizResult {
  field: InterviewField;
  score: number;
  total: number;
  date: string;
}
