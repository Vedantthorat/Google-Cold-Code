
import React, { useState } from 'react';
import Card from '../components/Card';
import { Recommendation } from '../types';

const mockRecommendations: Recommendation[] = [
  { id: 'j1', type: 'Job', title: 'Frontend Developer at TechCorp', source: 'LinkedIn', summary: 'Exciting role for a React developer to build next-gen UIs.', reason: 'Matches 5/6 required skills; Strong in React.', relevance: 95 },
  { id: 'c1', type: 'Course', title: 'Advanced TypeScript', source: 'Udemy', summary: 'Deep dive into advanced TypeScript features for large-scale applications.', reason: 'Skill gap identified: Advanced TypeScript.', relevance: 92 },
  { id: 'j2', type: 'Job', title: 'Full Stack Engineer at Innovate LLC', source: 'Indeed', summary: 'Work with Node.js and React on a fast-growing platform.', reason: 'Matches 4/6 required skills; Missing: AWS.', relevance: 88 },
  { id: 'p1', type: 'Project', title: 'Build a Personal Portfolio Website', source: 'Internal', summary: 'Showcase your skills by building a dynamic portfolio with React.', reason: 'Good for demonstrating practical skills.', relevance: 85 },
];

const RecommendationCard: React.FC<{ item: Recommendation; onApply: (item: Recommendation) => void }> = ({ item, onApply }) => {
    const handleSave = () => {
        alert(`Saved ${item.title} to your profile bookmarks.`);
    };

    return (
        <Card className="mb-4 transition-transform transform hover:translate-y-[-4px] border-l-4 border-l-primary-500">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                            item.type === 'Job' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                            item.type === 'Course' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                        }`}>{item.type}</span>
                        <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase">
                            <i data-lucide="layers" className="w-3 h-3"></i>
                            {item.source}
                        </div>
                    </div>
                    <h4 className="text-xl font-black mt-3 text-gray-900 dark:text-white tracking-tight leading-none">{item.title}</h4>
                </div>
                <div className="text-right bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-2xl">
                    <p className="font-black text-2xl text-primary-600 leading-none">{item.relevance}%</p>
                    <p className="text-[10px] font-black text-primary-400 uppercase mt-1">Match</p>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 leading-relaxed font-medium">{item.summary}</p>
            <div className="mt-5 p-5 bg-gray-50 dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i data-lucide="sparkles" className="w-4 h-4 text-primary-500"></i>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Why this fits you:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{item.reason}</p>
                </div>
            </div>
            <div className="mt-6 flex gap-3">
                <button 
                    onClick={() => onApply(item)}
                    className="flex-1 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all text-xs tracking-widest uppercase shadow-lg shadow-primary-200 dark:shadow-none"
                >
                    Apply Now
                </button>
                <button 
                    onClick={handleSave}
                    className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-500 hover:border-primary-500 rounded-2xl transition-all"
                >
                    <i data-lucide="bookmark" className="w-5 h-5"></i>
                </button>
            </div>
        </Card>
    );
};

const RecommendationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [applyingItem, setApplyingItem] = useState<Recommendation | null>(null);
  const [applyStep, setApplyStep] = useState(0); // 0: Review, 1: Success
  const tabs = ['All', 'Jobs', 'Courses', 'Projects'];

  const filteredRecs = activeTab === 'All'
    ? mockRecommendations
    : mockRecommendations.filter(r => r.type === activeTab.slice(0, -1));

  const handleApply = (item: Recommendation) => {
    setApplyingItem(item);
    setApplyStep(0);
  };

  const confirmApply = () => {
    setApplyStep(1);
    setTimeout(() => {
        setApplyingItem(null);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header>
          <h1 className="text-4xl font-black tracking-tight">Personalized for You</h1>
          <p className="text-gray-500 font-medium">Opportunities analyzed by Gemini based on your skills and career goals.</p>
      </header>

      <div className="bg-white dark:bg-gray-950 p-1.5 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 inline-flex">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-[18px] text-xs font-black transition-all uppercase tracking-widest ${
              activeTab === tab
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredRecs.map(rec => <RecommendationCard key={rec.id} item={rec} onApply={handleApply} />)}
      </div>

      {applyingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-gray-950 rounded-[40px] shadow-2xl max-w-md w-full p-8 space-y-6 relative overflow-hidden">
                  {applyStep === 0 ? (
                      <>
                        <button onClick={() => setApplyingItem(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <i data-lucide="x" className="w-6 h-6"></i>
                        </button>
                        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                            <i data-lucide="send" className="w-8 h-8 text-primary-600"></i>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black leading-tight">Apply to {applyingItem.title}?</h3>
                            <p className="text-sm text-gray-500 mt-2">Gemini will automatically optimize your current resume and skills profile for this {applyingItem.type.toLowerCase()}.</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl space-y-2">
                            <div className="flex justify-between text-xs font-black uppercase">
                                <span className="text-gray-400">Target Source</span>
                                <span className="text-primary-600">{applyingItem.source}</span>
                            </div>
                            <div className="flex justify-between text-xs font-black uppercase">
                                <span className="text-gray-400">Match Confidence</span>
                                <span className="text-primary-600">{applyingItem.relevance}%</span>
                            </div>
                        </div>
                        <button onClick={confirmApply} className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-lg shadow-primary-200 uppercase tracking-widest hover:bg-primary-700 transition-all">
                            CONFIRM APPLICATION
                        </button>
                      </>
                  ) : (
                      <div className="text-center py-8 animate-in zoom-in">
                          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                              <i data-lucide="check" className="w-10 h-10 text-green-600"></i>
                          </div>
                          <h3 className="text-3xl font-black">Success!</h3>
                          <p className="text-gray-500 mt-2 font-medium">Your application has been simulated and tracked in your activity history.</p>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
