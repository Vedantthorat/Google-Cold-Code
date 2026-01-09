
import React from 'react';
// Fix: Import Link correctly from react-router-dom
import { Link } from 'react-router-dom';

const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-lg text-center">
        <div className="flex justify-center mb-4">
            <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full">
                <i data-lucide={icon} className="h-8 w-8 text-primary-600 dark:text-primary-400"></i>
            </div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
);


const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <header className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <i data-lucide="brain-circuit" className="h-8 w-8 text-primary-500"></i>
                    <span className="ml-2 text-2xl font-bold">AI Career Coach</span>
                </div>
                <nav className="space-x-6">
                    <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition">Login</Link>
                    <Link to="/signup" className="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-600 rounded-lg hover:bg-primary-50 dark:bg-gray-800 dark:text-primary-400 dark:border-primary-400 dark:hover:bg-gray-700 transition">Sign Up</Link>
                </nav>
            </header>

            <main>
                <section className="text-center py-20 px-6">
                    <h1 className="text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">Unlock Your Career Potential with AI</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">Get personalized guidance, from resume building to interview prep, all powered by intelligent technology.</p>
                    <Link to="/signup" className="px-8 py-3 text-lg font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition">Get Started for Free</Link>
                </section>

                <section className="py-20 bg-gray-100 dark:bg-gray-950">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Features Designed for Your Success</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <FeatureCard icon="file-text" title="AI Resume Parser" description="Instantly get feedback and extract key skills from your resume." />
                            <FeatureCard icon="target" title="Adaptive Tests" description="Practice with tests that adjust to your skill level for optimal learning." />
                            <FeatureCard icon="building" title="Company Prep" description="Access curated resources and insights for your dream companies." />
                            <FeatureCard icon="bot" title="AI Chat Coach" description="Your 24/7 career coach for any question, big or small." />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-white dark:bg-gray-950 border-t dark:border-gray-800 py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} AI Career Coach. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
