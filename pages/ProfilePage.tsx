
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Card from '../components/Card';
import { parseResumeWithGemini, calculateResumeStrength } from '../services/geminiService';
import { ParsedResume, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { fileToBase64 } from '../utils/helpers';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [strengthData, setStrengthData] = useState<{score: number; tips: string[]} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.jobReadiness) {
        setStrengthData({ score: user.resumeStrength || 0, tips: [] });
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setResumeFile(event.target.files[0]);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      updateUser({ avatarUrl: `data:${e.target.files[0].type};base64,${base64}` });
      setSaveFeedback('Profile picture updated!');
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleParseResume = useCallback(async () => {
    if (!resumeFile) {
      setError('Please select a resume file first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseResumeWithGemini(resumeFile);
      setParsedData(data);
      
      const strength = await calculateResumeStrength(data);
      setStrengthData(strength);
      
      updateUser({ 
        name: data.personalInfo.name, 
        location: data.personalInfo.location,
        resumeStrength: strength.score
      });
      
      setSaveFeedback('Resume parsed and profile updated!');
      setTimeout(() => setSaveFeedback(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [resumeFile, updateUser]);

  const toggleJobStatus = () => {
    const statuses: User['jobStatus'][] = ['Searching', 'Open', 'Hired'];
    const nextIdx = (statuses.indexOf(user?.jobStatus || 'Searching') + 1) % 3;
    updateUser({ jobStatus: statuses[nextIdx] });
  };

  const handleSaveToggle = () => {
      if (isEditing) {
          setSaveFeedback('Profile changes saved!');
          setTimeout(() => setSaveFeedback(null), 3000);
      }
      setIsEditing(!isEditing);
  };

  const renderStrengthMeter = () => {
    if (!strengthData) return null;
    return (
        <Card title="Resume Health" icon="heart-pulse" className="mb-8 border-t-4 border-t-primary-500">
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative flex-shrink-0">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * strengthData.score) / 100} className="text-primary-500" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black">{strengthData.score}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Score</span>
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">AI Improvements:</p>
                    <div className="grid grid-cols-1 gap-2">
                        {strengthData.tips.map((tip, i) => (
                            <div key={i} className="flex gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-xs font-medium">
                                <i data-lucide="sparkles" className="w-4 h-4 text-primary-500 flex-shrink-0"></i>
                                {tip}
                            </div>
                        ))}
                        {strengthData.tips.length === 0 && <p className="text-sm text-gray-400 italic">No tips available yet. Parse a resume to get AI feedback.</p>}
                    </div>
                </div>
            </div>
        </Card>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 relative">
      {saveFeedback && (
          <div className="fixed top-20 right-8 z-50 bg-primary-600 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
              <i data-lucide="check-circle" className="w-5 h-5"></i>
              <span className="text-sm font-black uppercase tracking-widest">{saveFeedback}</span>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="relative group">
                <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-xl border-4 border-white dark:border-gray-950">
                    <img 
                        src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.email}`} 
                        className="w-full h-full object-cover" 
                        alt="Profile" 
                    />
                </div>
                <button 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                    <i data-lucide="camera" className="w-5 h-5"></i>
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
                <h1 className="text-4xl font-black tracking-tight">{user?.name}</h1>
                <p className="text-gray-500 font-medium">{user?.role} • {user?.location || 'Set your location'}</p>
            </div>
          </div>
          <div className="flex gap-3">
              <button onClick={toggleJobStatus} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all border ${
                  user?.jobStatus === 'Hired' ? 'bg-green-100 text-green-700 border-green-200' : 
                  user?.jobStatus === 'Open' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}>
                  Status: {user?.jobStatus || 'Searching'}
              </button>
              <button onClick={handleSaveToggle} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  isEditing ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600'
              }`}>
                  {isEditing ? 'Save Profile' : 'Edit Mode'}
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
              <Card title="Upload Center" icon="upload">
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl p-8 text-center hover:border-primary-300 transition-all cursor-pointer group bg-gray-50 dark:bg-gray-900/50">
                        <input
                            type="file"
                            id="resume-upload"
                            accept=".pdf,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label htmlFor="resume-upload" className="cursor-pointer block">
                            <i data-lucide="file-text" className="w-12 h-12 text-gray-300 mx-auto mb-3 group-hover:text-primary-500 transition-colors"></i>
                            <p className="text-xs font-black text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 uppercase tracking-widest">{resumeFile ? resumeFile.name : "Select File"}</p>
                        </label>
                    </div>
                    <button
                        onClick={handleParseResume}
                        disabled={isLoading || !resumeFile}
                        className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-300 text-xs tracking-widest uppercase flex items-center justify-center transition-all shadow-lg shadow-primary-100 dark:shadow-none"
                    >
                        {isLoading ? "ANALYZING..." : "PARSE WITH AI"}
                    </button>
                    {error && <p className="text-center text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
                </div>
              </Card>

              <Card title="Quick Links" icon="link">
                  <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-[20px] border border-transparent focus-within:border-primary-200 transition-all">
                          <i data-lucide="linkedin" className="w-5 h-5 text-[#0077b5]"></i>
                          <input 
                            placeholder="LinkedIn URL" 
                            className="bg-transparent border-none text-sm w-full focus:ring-0 font-medium" 
                            value={user?.linkedinUrl || ''} 
                            disabled={!isEditing}
                            onChange={e => updateUser({ linkedinUrl: e.target.value })}
                          />
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-[20px] border border-transparent focus-within:border-primary-200 transition-all">
                          <i data-lucide="map-pin" className="w-5 h-5 text-red-500"></i>
                          <input 
                            placeholder="Location" 
                            className="bg-transparent border-none text-sm w-full focus:ring-0 font-medium" 
                            value={user?.location || ''} 
                            disabled={!isEditing}
                            onChange={e => updateUser({ location: e.target.value })}
                          />
                      </div>
                  </div>
              </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
              {renderStrengthMeter()}
              
              <Card title="Professional Summary" icon="user">
                  {isEditing ? (
                      <textarea 
                        className="w-full p-6 bg-gray-50 dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 text-sm min-h-[180px] focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium leading-relaxed"
                        value={user?.bio || parsedData?.summary || ''}
                        onChange={e => updateUser({ bio: e.target.value })}
                        placeholder="Write a brief professional summary or parse your resume to generate one..."
                      />
                  ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                          {user?.bio || parsedData?.summary || "No professional summary added yet. Upload your resume or use edit mode to start your profile."}
                      </p>
                  )}
              </Card>

              {parsedData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6">
                    <Card title="Skill Matrix" icon="target">
                        <div className="flex flex-wrap gap-2 pt-2">
                            {parsedData.skills.map((skill, i) => (
                                <span key={i} className="px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-50 dark:border-gray-700 rounded-full text-[10px] font-black uppercase text-gray-700 dark:text-gray-300 shadow-sm hover:border-primary-200 transition-colors">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </Card>

                    <Card title="Work History" icon="briefcase">
                        <div className="space-y-12 pt-4">
                            {parsedData.experience.map((exp, idx) => (
                                <div key={idx} className="relative pl-10 border-l-2 border-primary-100 dark:border-primary-900/30 group">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary-500 rounded-full shadow-lg shadow-primary-200 dark:shadow-none group-hover:scale-125 transition-transform"></div>
                                    <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-2">
                                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{exp.title}</h4>
                                        <span className="text-[10px] font-black text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-xl uppercase tracking-widest">{exp.duration}</span>
                                    </div>
                                    <p className="text-xs font-black text-gray-400 uppercase mb-5 tracking-widest">{exp.company}</p>
                                    <ul className="space-y-3">
                                        {exp.responsibilities.map((r, i) => (
                                            <li key={i} className="text-sm text-gray-600 dark:text-gray-400 font-medium flex gap-3 leading-relaxed">
                                                <i data-lucide="check" className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"></i>
                                                {r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Education" icon="graduation-cap">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {parsedData.education.map((edu, idx) => (
                                <div key={idx} className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{edu.degree}</h4>
                                    <p className="text-xs text-gray-500 font-black mt-2 uppercase tracking-widest">{edu.institution}</p>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{edu.year}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default ProfilePage;
