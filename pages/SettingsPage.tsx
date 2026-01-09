
import React, { useState } from 'react';
import Card from '../components/Card';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { Theme } from '../types';

const Toggle: React.FC<{ label: string; enabled: boolean; onChange: () => void }> = ({ label, enabled, onChange }) => (
  <div className="flex items-center justify-between py-4">
    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</span>
    <button
      onClick={onChange}
      className={`${
        enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
      } relative inline-flex items-center h-7 rounded-full w-12 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 shadow-inner`}
    >
      <span
        className={`${
          enabled ? 'translate-x-6' : 'translate-x-1'
        } inline-block w-5 h-5 transform bg-white rounded-full transition-transform shadow-md`}
      />
    </button>
  </div>
);

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  
  // Local state for demonstration purposes
  const [shareResume, setShareResume] = useState(true);
  const [shareScores, setShareScores] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const handleDeleteAccount = () => {
      const confirmed = window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.");
      if (confirmed) {
          alert("Account deleted. You will be logged out now.");
          logout();
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
          <h1 className="text-4xl font-black tracking-tight">Settings</h1>
          <p className="text-gray-500 font-medium">Customize your AI Career Coach experience.</p>
      </header>
      
      <div className="space-y-6">
        <Card title="Appearance" icon="eye">
          <Toggle
            label="Dark Mode"
            enabled={theme === Theme.Dark}
            onChange={toggleTheme}
          />
        </Card>

        <Card title="Notifications" icon="bell">
            <Toggle
                label="Email Career Alerts"
                enabled={emailNotifs}
                onChange={() => setEmailNotifs(!emailNotifs)}
            />
        </Card>

        <Card title="Privacy" icon="lock">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle 
                    label="Share resume with trusted recruiters" 
                    enabled={shareResume} 
                    onChange={() => setShareResume(!shareResume)} 
                />
                <Toggle 
                    label="Share interview mastery scores" 
                    enabled={shareScores} 
                    onChange={() => setShareScores(!shareScores)} 
                />
            </div>
        </Card>

        <Card title="Danger Zone" icon="alert-triangle" className="border-2 border-red-50 dark:border-red-900/10">
            <p className="text-xs font-bold text-gray-500 mb-6 leading-relaxed">
                Deleting your account will remove all your data, including parsed resumes, interview history, and skill progress.
            </p>
            <button 
                onClick={handleDeleteAccount}
                className="w-full py-4 text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-900/20 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
                Permanently Delete My Account
            </button>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
