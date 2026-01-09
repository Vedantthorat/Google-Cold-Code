
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from '../components/Card';
import { getInterviewPrepData, startLiveInterview, getDeepAnalysisFeedback } from '../services/geminiService';
import { saveInterviewSession, getInterviewHistory } from '../services/firebaseService';
import { analyzer } from '../services/tensorflowService';
import { InterviewQuestion, InterviewFeedback, InterviewField } from '../types';
import { useAuth } from '../hooks/useAuth';

const FIELDS: InterviewField[] = ['Software Engineering', 'Data Science', 'Product Management', 'AI & ML', 'Cloud & DevOps'];
const CATEGORIES = ['All', 'Technical', 'Behavioral', 'General'];
const SORT_OPTIONS = [
    { label: 'Default', value: 'default' },
    { label: 'Difficulty: Easy to Hard', value: 'diff-asc' },
    { label: 'Difficulty: Hard to Easy', value: 'diff-desc' },
    { label: 'Mastered First', value: 'mastered-first' },
    { label: 'Not Mastered First', value: 'unmastered-first' }
];

const InterviewPrepPage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [selectedField, setSelectedField] = useState<InterviewField>('Software Engineering');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('default');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [activeTab, setActiveTab] = useState<'questions' | 'simulation' | 'history'>('questions');
    const [sessionFeedback, setSessionFeedback] = useState<InterviewFeedback | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    
    // Persistent Mastery State
    const [masteredIds, setMasteredIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('mastered_questions');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Live API Refs
    const sessionPromise = useRef<any>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                const data = await getInterviewPrepData(selectedField);
                setQuestions(data);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        fetchQuestions();
    }, [selectedField]);

    useEffect(() => {
        const fetchHistory = async () => {
            const data = await getInterviewHistory(user?.id || 'guest');
            setHistory(data);
        };
        fetchHistory();
    }, [activeTab, user?.id]);

    useEffect(() => {
        localStorage.setItem('mastered_questions', JSON.stringify(Array.from(masteredIds)));
        if (updateUser) {
            updateUser({ skillsMastery: masteredIds.size });
        }
    }, [masteredIds, updateUser]);

    const filteredQuestions = useMemo(() => {
        let result = questions.filter(q => {
            const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 q.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        const diffWeight = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

        result.sort((a, b) => {
            switch (sortBy) {
                case 'diff-asc':
                    return diffWeight[a.difficulty] - diffWeight[b.difficulty];
                case 'diff-desc':
                    return diffWeight[b.difficulty] - diffWeight[a.difficulty];
                case 'mastered-first':
                    const aM = masteredIds.has(a.id) ? 1 : 0;
                    const bM = masteredIds.has(b.id) ? 1 : 0;
                    return bM - aM;
                case 'unmastered-first':
                    const aU = masteredIds.has(a.id) ? 1 : 0;
                    const bU = masteredIds.has(b.id) ? 1 : 0;
                    return aU - bU;
                default:
                    return 0;
            }
        });

        return result;
    }, [questions, searchQuery, selectedCategory, sortBy, masteredIds]);

    // Calculate progress for current field
    const fieldStats = useMemo(() => {
        if (questions.length === 0) return { count: 0, total: 0, percent: 0 };
        const masteredInField = questions.filter(q => masteredIds.has(q.id)).length;
        return {
            count: masteredInField,
            total: questions.length,
            percent: Math.round((masteredInField / questions.length) * 100)
        };
    }, [questions, masteredIds]);

    const toggleMastery = (id: string) => {
        setMasteredIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const encode = (bytes: Uint8Array) => {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    };

    const decode = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
    };

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
        return buffer;
    }

    const startSession = async () => {
        setIsLiveActive(true);
        setSessionFeedback(null);
        analyzer.startAnalysis();

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        sessionPromise.current = startLiveInterview({
            onopen: () => {
                const source = audioContextRef.current!.createMediaStreamSource(stream);
                const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const int16 = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                    const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                    sessionPromise.current.then((s: any) => s.sendRealtimeInput({ media: pcmBlob }));
                };
                source.connect(processor);
                processor.connect(audioContextRef.current!.destination);
            },
            onmessage: async (msg: any) => {
                const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio) {
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                    const source = outputAudioContextRef.current!.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputAudioContextRef.current!.destination);
                    
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                    });

                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                }

                const interrupted = msg.serverContent?.interrupted;
                if (interrupted) {
                    for (const source of sourcesRef.current.values()) {
                        source.stop();
                        sourcesRef.current.delete(source);
                    }
                    nextStartTimeRef.current = 0;
                }
            },
            onerror: (e: any) => console.error("Gemini Error:", e),
            onclose: () => setIsLiveActive(false)
        });
    };

    const stopSession = () => {
        setIsLiveActive(false);
        analyzer.stopAnalysis();
        if (audioContextRef.current) audioContextRef.current.close();
        if (outputAudioContextRef.current) outputAudioContextRef.current.close();
        sourcesRef.current.forEach(s => {
            try { s.stop(); } catch (e) {}
        });
        sourcesRef.current.clear();
        generateFeedback();
    };

    const generateFeedback = async () => {
        setIsLoading(true);
        const feedback = await getDeepAnalysisFeedback("Detailed session transcript from the Live interaction.");
        const enrichedFeedback = { ...feedback, date: new Date().toLocaleDateString(), field: selectedField };
        setSessionFeedback(enrichedFeedback);
        await saveInterviewSession(user?.id || 'guest', enrichedFeedback);
        setIsLoading(false);
    };

    const masteredCount = masteredIds.size;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Interview Prep Suite</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full text-[10px] font-black uppercase text-primary-600">
                            <i data-lucide="zap" className="w-3 h-3"></i>
                            PRO FEATURE: GEMINI 3 & TF.JS
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-[10px] font-black uppercase text-green-600">
                            <i data-lucide="award" className="w-3 h-3"></i>
                            {masteredCount} QUESTIONS MASTERED
                        </div>
                    </div>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-[20px] shadow-inner">
                    {(['questions', 'simulation', 'history'] as const).map((t) => (
                        <button 
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-6 py-2.5 rounded-[16px] text-xs font-black transition-all uppercase tracking-widest ${activeTab === t ? 'bg-white dark:bg-gray-700 shadow-md text-primary-600 scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'questions' && (
                <div className="space-y-6">
                    <div className="flex flex-col gap-6">
                        {/* Primary Filter Bar: Field */}
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                            {FIELDS.map(field => (
                                <button
                                    key={field}
                                    onClick={() => setSelectedField(field)}
                                    className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${selectedField === field ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-2 border-transparent text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {field}
                                </button>
                            ))}
                        </div>

                        {/* Progress Bar Section */}
                        <div className="bg-white dark:bg-gray-950 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-top-4">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{selectedField} Mastery</h4>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{fieldStats.count} / {fieldStats.total} <span className="text-sm font-bold text-gray-400">Mastered</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-primary-500 leading-none">{fieldStats.percent}%</p>
                                </div>
                            </div>
                            <div className="h-4 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden relative">
                                <div 
                                    className="h-full bg-gradient-to-r from-primary-500 to-blue-400 transition-all duration-700 ease-out rounded-full shadow-inner" 
                                    style={{ width: `${fieldStats.percent}%` }}
                                >
                                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 skew-x-[-20deg] animate-pulse"></div>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mastery Level: {fieldStats.percent > 80 ? 'Expert' : fieldStats.percent > 40 ? 'Proficient' : 'Novice'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Filter & Sort & Search */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                            <div className="lg:col-span-5 flex bg-white dark:bg-gray-900 p-1 rounded-2xl shadow-sm">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${selectedCategory === cat ? 'bg-gray-100 dark:bg-gray-800 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="lg:col-span-3">
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm py-3 px-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary-500 appearance-none"
                                >
                                    {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>

                            <div className="lg:col-span-4 relative">
                                <i data-lucide="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
                                <input 
                                    type="text"
                                    placeholder="SEARCH QUESTIONS..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 text-xs font-black uppercase tracking-widest"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-[28px]"></div>)
                        ) : filteredQuestions.length > 0 ? (
                            filteredQuestions.map((q) => (
                                <div key={q.id} className={`relative p-6 bg-white dark:bg-gray-900 rounded-[28px] border-2 transition-all group ${masteredIds.has(q.id) ? 'border-green-500 shadow-lg shadow-green-100 dark:shadow-green-900/10' : 'border-transparent hover:border-primary-100 dark:hover:border-primary-900/30'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${q.category === 'Technical' ? 'bg-blue-100 text-blue-700' : q.category === 'Behavioral' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {q.category}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${q.difficulty === 'Hard' ? 'border-red-200 text-red-600 bg-red-50' : q.difficulty === 'Medium' ? 'border-yellow-200 text-yellow-600 bg-yellow-50' : 'border-green-200 text-green-600 bg-green-50'}`}>
                                                {q.difficulty}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => toggleMastery(q.id)}
                                            className={`p-2 rounded-full transition-all hover:scale-110 active:scale-90 ${masteredIds.has(q.id) ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:text-primary-500'}`}
                                        >
                                            <i data-lucide={masteredIds.has(q.id) ? "check-circle" : "circle"} className="w-4 h-4"></i>
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-4 tracking-tight uppercase">{q.question}</h3>
                                    <details className="group/details">
                                        <summary className="list-none cursor-pointer flex items-center text-[10px] font-black text-primary-500 uppercase tracking-widest">
                                            <i data-lucide="chevron-right" className="w-3 h-3 mr-1 transition-transform group-open/details:rotate-90"></i>
                                            VIEW AI STRATEGY
                                        </summary>
                                        <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-xs text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800 font-medium leading-relaxed">
                                            {q.bestAnswerHint}
                                        </div>
                                    </details>
                                    
                                    {masteredIds.has(q.id) && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-lg border-2 border-white dark:border-gray-950 animate-in zoom-in">
                                            <i data-lucide="award" className="w-4 h-4"></i>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-24 text-center">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i data-lucide="search-x" className="w-10 h-10 text-gray-300"></i>
                                </div>
                                <h3 className="text-xl font-black uppercase text-gray-400">No Questions Found</h3>
                                <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest">Try adjusting your filters or search term.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'simulation' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <Card className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border-none shadow-xl">
                        <div className="relative">
                            <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 ${isLiveActive ? 'bg-red-500 scale-110 shadow-[0_0_80px_rgba(239,68,68,0.4)]' : 'bg-primary-600 shadow-2xl'}`}>
                                <i data-lucide={isLiveActive ? "mic" : "play"} className="w-16 h-16 text-white"></i>
                                {isLiveActive && (
                                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-25"></div>
                                )}
                            </div>
                        </div>
                        <h2 className="text-3xl font-black mt-12 tracking-tight uppercase">AI Interview Expert</h2>
                        <p className="text-gray-500 text-center px-12 mt-4 leading-relaxed font-black uppercase text-xs">
                            Field: <span className="text-primary-600">{selectedField}</span>
                        </p>
                        <p className="text-gray-500 text-center px-12 mt-4 leading-relaxed font-medium text-sm">
                            Experience a high-fidelity mock interview with <span className="text-primary-600 font-bold">Gemini 2.5 Flash</span>. 
                            Your audio is processed locally via <span className="text-primary-600 font-bold">TensorFlow.js</span> for privacy-first behavioral tracking.
                        </p>
                        
                        <div className="mt-12 flex flex-col w-full px-12 gap-4">
                            {!isLiveActive ? (
                                <button onClick={startSession} className="w-full py-5 bg-black dark:bg-white dark:text-black text-white font-black rounded-[24px] hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-widest uppercase">
                                    INITIALIZE SESSION
                                </button>
                            ) : (
                                <button onClick={stopSession} className="w-full py-5 bg-red-600 text-white font-black rounded-[24px] hover:bg-red-700 transition-all text-sm tracking-widest uppercase shadow-lg shadow-red-200 dark:shadow-red-900/20">
                                    TERMINATE & ANALYZE
                                </button>
                            )}
                        </div>
                    </Card>

                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="h-[400px] flex flex-col items-center justify-center bg-white dark:bg-gray-950 rounded-[40px] border border-gray-100 dark:border-gray-800">
                                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Gemini is synthesizing performance data...</p>
                            </div>
                        ) : isLiveActive ? (
                            <Card title="Behavioral Metrics" icon="bar-chart-2">
                                <div className="space-y-6 p-2">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                                            <span>Speech Clarity (TF.js Inference)</span>
                                            <span className="text-primary-600">{Math.round(analyzer.getRealtimeConfidence() * 100)}%</span>
                                        </div>
                                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-500 transition-all duration-300 rounded-full" style={{ width: `${analyzer.getRealtimeConfidence() * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center flex-shrink-0">
                                            <i data-lucide="cpu" className="w-5 h-5 text-primary-600"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest">Edge Analysis Active</p>
                                            <p className="text-[10px] text-gray-500 mt-1 font-medium leading-relaxed">We are analyzing audio features locally to detect cognitive load and confidence spikes in real-time.</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ) : sessionFeedback ? (
                            <Card title="Performance Audit" icon="shield-check" className="border-2 border-primary-500">
                                <div className="flex justify-around py-6 border-b dark:border-gray-800 mb-6">
                                    <div className="text-center">
                                        <p className="text-5xl font-black text-primary-600 tracking-tighter">{sessionFeedback.score}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Global Score</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-5xl font-black text-indigo-500 tracking-tighter">{sessionFeedback.clarity}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Confidence</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-5xl font-black text-blue-500 tracking-tighter">{sessionFeedback.relevance}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Technical Depth</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Deep Insights by Gemini 3 Pro:</h4>
                                    {sessionFeedback.suggestions.map((s, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-black flex-shrink-0 text-xs">{idx + 1}</div>
                                            <p className="text-xs font-bold leading-relaxed text-gray-700 dark:text-gray-300">{s}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] p-16 text-center bg-white dark:bg-gray-950">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
                                    <i data-lucide="mic-2" className="w-8 h-8 text-gray-300"></i>
                                </div>
                                <h3 className="text-xl font-black uppercase text-gray-400">Ready for Session</h3>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 max-w-xs">Start a voice session to receive elite-level feedback and behavioral metrics.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-6">
                    <Card title="Progress Trajectory" icon="activity">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="p-8 bg-primary-50 dark:bg-primary-900/20 rounded-[32px] border border-primary-100">
                                <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Average Mastery</p>
                                <p className="text-5xl font-black text-primary-600 mt-2 tracking-tighter">
                                    {history.length > 0 ? Math.round(history.reduce((a, b) => a + b.score, 0) / history.length) : 0}%
                                </p>
                            </div>
                            <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-[32px] border border-green-100">
                                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Peak Performance</p>
                                <p className="text-5xl font-black text-green-600 mt-2 tracking-tighter">
                                    {history.length > 0 ? Math.max(...history.map(h => h.score)) : 0}%
                                </p>
                            </div>
                            <div className="p-8 bg-purple-50 dark:bg-purple-900/20 rounded-[32px] border border-purple-100">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Field Diversity</p>
                                <p className="text-5xl font-black text-purple-600 mt-2 tracking-tighter">{new Set(history.map(h => h.field)).size}</p>
                            </div>
                        </div>
                    </Card>

                    <Card title="Archived Assessments" icon="clock">
                        <div className="space-y-4 pt-2">
                            {history.length > 0 ? history.map((h) => (
                                <div key={h.id} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-[28px] hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-primary-100">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 flex flex-col items-center justify-center shadow-sm text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                            <span className="text-2xl font-black leading-none">{h.score}</span>
                                            <span className="text-[8px] font-black uppercase mt-1">%</span>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-gray-900 dark:text-white leading-none uppercase tracking-tight">{h.field} ASSESSMENT</p>
                                            <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest">{h.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:flex flex-col gap-1 items-end">
                                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">CONFIDENCE: {h.clarity}%</span>
                                            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded">DEPTH: {h.relevance}%</span>
                                        </div>
                                        <button className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-all">
                                            <i data-lucide="chevron-right" className="w-5 h-5"></i>
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-24">
                                    <i data-lucide="ghost" className="w-12 h-12 text-gray-200 mx-auto mb-4"></i>
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No sessions recorded in your vault.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default InterviewPrepPage;
