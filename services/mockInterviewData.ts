
import { InterviewQuestion } from '../types';

// High-density static question sets to ensure immediate value
export const STATIC_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // --- SOFTWARE ENGINEERING ---
  {
    id: 'swe-1',
    field: 'Software Engineering',
    category: 'Technical',
    question: 'Explain the difference between optimistic and pessimistic locking.',
    bestAnswerHint: 'Optimistic locking assumes multiple transactions can complete without affecting each other. Pessimistic locking assumes the worst and locks data for the duration of the transaction.',
    difficulty: 'Medium'
  },
  {
    id: 'swe-2',
    field: 'Software Engineering',
    category: 'Technical',
    question: 'How does the Virtual DOM in React improve performance?',
    bestAnswerHint: 'It minimizes direct manipulation of the actual DOM by calculating the most efficient way to update the UI through a diffing algorithm.',
    difficulty: 'Easy'
  },
  {
    id: 'swe-3',
    field: 'Software Engineering',
    category: 'Behavioral',
    question: 'Tell me about a time you had a conflict with a teammate over a technical decision.',
    bestAnswerHint: 'Use the STAR method. Focus on data-driven reasoning, active listening, and how you reached a compromise or a superior solution.',
    difficulty: 'Medium'
  },
  ...Array.from({ length: 47 }).map((_, i) => ({
    id: `swe-dynamic-${i}`,
    field: 'Software Engineering' as const,
    category: (i % 3 === 0 ? 'Technical' : i % 3 === 1 ? 'Behavioral' : 'General') as any,
    question: `Advanced SWE Concept #${i + 5}: Discuss the implications of ${['microservices architecture', 'eventual consistency', 'REST vs GraphQL', 'TDD', 'CI/CD pipelines'][i % 5]} in modern enterprise apps.`,
    bestAnswerHint: 'Focus on scalability, maintenance, and the trade-offs between speed and reliability.',
    difficulty: (['Easy', 'Medium', 'Hard'][i % 3]) as any
  })),

  // --- DATA SCIENCE ---
  {
    id: 'ds-1',
    field: 'Data Science',
    category: 'Technical',
    question: 'What is the "Curse of Dimensionality" in Machine Learning?',
    bestAnswerHint: 'It refers to various phenomena that arise when analyzing and organizing data in high-dimensional spaces that do not occur in low-dimensional settings, often causing overfitting.',
    difficulty: 'Hard'
  },
  ...Array.from({ length: 50 }).map((_, i) => ({
    id: `ds-dynamic-${i}`,
    field: 'Data Science' as const,
    category: (i % 2 === 0 ? 'Technical' : 'General') as any,
    question: `Data Science Challenge #${i + 2}: How would you optimize a ${['Random Forest', 'Neural Network', 'Gradient Boosting Machine', 'K-Means Clustering'][i % 4]} model for high-variance data?`,
    bestAnswerHint: 'Consider feature engineering, cross-validation strategies, and hyperparameter tuning using Bayesian optimization.',
    difficulty: (['Easy', 'Medium', 'Hard'][i % 3]) as any
  })),

  // --- PRODUCT MANAGEMENT ---
  {
    id: 'pm-1',
    field: 'Product Management',
    category: 'General',
    question: 'How do you prioritize features on a product roadmap?',
    bestAnswerHint: 'Mention frameworks like RICE (Reach, Impact, Confidence, Effort) or MoSCoW. Emphasize alignment with business goals and user needs.',
    difficulty: 'Medium'
  },
  ...Array.from({ length: 50 }).map((_, i) => ({
    id: `pm-dynamic-${i}`,
    field: 'Product Management' as const,
    category: 'Behavioral' as any,
    question: `Product Strategy #${i + 2}: Describe your approach to ${['launching an MVP', 'handling a major product pivot', 'user feedback synthesis', 'market analysis'][i % 4]} for a Tier-1 tech company.`,
    bestAnswerHint: 'Focus on user-centric design, stakeholder management, and iterative development.',
    difficulty: (['Easy', 'Medium', 'Hard'][i % 3]) as any
  })),

  // --- AI & ML ---
  {
    id: 'ai-1',
    field: 'AI & ML',
    category: 'Technical',
    question: 'Explain the Transformer architecture and why it changed NLP.',
    bestAnswerHint: 'Self-attention mechanism allows processing of sequences in parallel and captures long-range dependencies better than RNNs/LSTMs.',
    difficulty: 'Hard'
  },
  ...Array.from({ length: 60 }).map((_, i) => ({
    id: `ai-dynamic-${i}`,
    field: 'AI & ML' as const,
    category: 'Technical' as any,
    question: `AI Research Question #${i + 2}: Discuss the role of ${['Reinforcement Learning from Human Feedback (RLHF)', 'Diffusion Models', 'Quantization', 'Model Distillation'][i % 4]} in scaling Large Language Models.`,
    bestAnswerHint: 'Address efficiency, safety, and alignment with human intent.',
    difficulty: (['Easy', 'Medium', 'Hard'][i % 3]) as any
  })),

  // --- CLOUD & DEVOPS ---
  {
    id: 'cloud-1',
    field: 'Cloud & DevOps',
    category: 'Technical',
    question: 'What is Infrastructure as Code (IaC) and why is it essential?',
    bestAnswerHint: 'IaC allows managing and provisioning infrastructure through machine-readable definition files (like Terraform), enabling version control and consistency.',
    difficulty: 'Easy'
  },
  ...Array.from({ length: 55 }).map((_, i) => ({
    id: `cloud-dynamic-${i}`,
    field: 'Cloud & DevOps' as const,
    category: 'Technical' as any,
    question: `DevOps Architecture #${i + 2}: Design a high-availability system using ${['Kubernetes', 'AWS Lambda', 'Terraform', 'Docker Swarm'][i % 4]} that handles 1M requests per second.`,
    bestAnswerHint: 'Focus on auto-scaling, load balancing, and multi-region deployment strategies.',
    difficulty: (['Easy', 'Medium', 'Hard'][i % 3]) as any
  })),
];
