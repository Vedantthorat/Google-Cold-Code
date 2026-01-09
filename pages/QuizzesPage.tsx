
import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { QUIZ_QUESTIONS } from '../services/mockQuizData';
import { QuizQuestion, InterviewField } from '../types';

const FIELDS: InterviewField[] = ['Software Engineering', 'Data Science', 'Product Management', 'AI & ML', 'Cloud & DevOps'];

const QuizzesPage: React.FC = () => {
  const [selectedField, setSelectedField] = useState<InterviewField | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const fieldQuestions = useMemo(() => {
    if (!selectedField) return [];
    return QUIZ_QUESTIONS.filter(q => q.field === selectedField);
  }, [selectedField]);

  const currentQuestion = fieldQuestions[currentQuestionIndex];

  const handleStartQuiz = (field: InterviewField) => {
    setSelectedField(field);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < fieldQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  if (!selectedField) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl font-black tracking-tight">Adaptive Skill Quizzes</h1>
          <p className="text-gray-500 font-medium">Test your knowledge with 20+ industry-standard MCQs per field.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FIELDS.map(field => (
            <Card key={field} title={field} icon="book-open" className="hover:border-primary-500 transition-colors cursor-pointer group" >
              <div onClick={() => handleStartQuiz(field)}>
                <p className="text-sm text-gray-500 mb-6">Master the core concepts of {field} through curated questions.</p>
                <button className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-primary-600 font-black rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all text-xs uppercase tracking-widest">
                  Start Quiz
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
          <i data-lucide="award" className="w-12 h-12 text-primary-600"></i>
        </div>
        <h2 className="text-4xl font-black mb-4">Quiz Complete!</h2>
        <p className="text-gray-500 mb-8">You scored <span className="text-primary-600 font-black">{score}</span> out of {fieldQuestions.length} in {selectedField}.</p>
        <div className="flex gap-4 justify-center">
            <button onClick={() => setSelectedField(null)} className="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-lg shadow-primary-200">
                BACK TO LIST
            </button>
            <button onClick={() => handleStartQuiz(selectedField)} className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-black rounded-2xl">
                RETRY QUIZ
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <button onClick={() => setSelectedField(null)} className="text-sm font-black text-gray-400 hover:text-primary-600 flex items-center gap-2">
            <i data-lucide="arrow-left" className="w-4 h-4"></i> EXIT QUIZ
        </button>
        <span className="text-xs font-black bg-primary-50 dark:bg-primary-900/30 text-primary-600 px-3 py-1 rounded-full">
            QUESTION {currentQuestionIndex + 1} / {fieldQuestions.length}
        </span>
      </div>

      <Card className="p-8">
        <h3 className="text-2xl font-black mb-8 leading-tight">{currentQuestion.question}</h3>
        <div className="space-y-4">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleOptionSelect(idx)}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-medium ${
                isAnswered
                  ? idx === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700'
                    : idx === selectedOption
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700'
                    : 'border-gray-100 dark:border-gray-800 opacity-50'
                  : 'border-gray-100 dark:border-gray-800 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                    isAnswered && idx === currentQuestion.correctAnswer ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                    {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </div>
            </button>
          ))}
        </div>

        {isAnswered && (
          <div className="mt-8 animate-in fade-in slide-in-from-top-4">
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                <p className="text-xs font-black text-blue-600 uppercase mb-2">Explanation</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{currentQuestion.explanation}</p>
            </div>
            <button 
                onClick={handleNext}
                className="w-full mt-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-lg shadow-primary-200 uppercase tracking-widest"
            >
                {currentQuestionIndex + 1 < fieldQuestions.length ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuizzesPage;
