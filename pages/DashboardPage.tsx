
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { useAuth } from '../hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', skills: 4, tests: 2 },
  { name: 'Feb', skills: 3, tests: 5 },
  { name: 'Mar', skills: 6, tests: 4 },
  { name: 'Apr', skills: 7, tests: 6 },
  { name: 'May', skills: 8, tests: 7 },
  { name: 'Jun', skills: 10, tests: 8 },
];

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string; trend?: string }> = ({ icon, label, value, color, trend }) => (
    <Card className="flex items-center p-6 border-none shadow-md">
        <div className={`p-4 rounded-2xl mr-4 ${color}`}>
            <i data-lucide={icon} className="h-6 w-6 text-white"></i>
        </div>
        <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
                {trend && <span className="text-[10px] font-black text-green-500">+{trend}%</span>}
            </div>
        </div>
    </Card>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
          <div>
              <h1 className="text-4xl font-black tracking-tight">Career Dashboard</h1>
              <p className="text-gray-500 font-medium">Monitoring your path to {user?.jobStatus === 'Hired' ? 'Success' : 'Employment'}.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">AI Status: Optimal</span>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon="briefcase" label="Job Readiness" value={`${user?.jobReadiness || 82}%`} color="bg-blue-600" trend="5" />
          <StatCard icon="star" label="Resume Strength" value={`${user?.resumeStrength || 0}%`} color="bg-green-600" />
          <StatCard icon="award" label="Mastery Score" value={`${user?.skillsMastery || 0}`} color="bg-orange-600" />
          <StatCard icon="zap" label="Learning Hours" value="48h" color="bg-indigo-600" trend="12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card title="Performance Evolution" icon="trending-up" className="h-full">
                <div style={{ width: '100%', height: 320 }} className="mt-4">
                    <ResponsiveContainer>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" className="text-[10px] font-bold" axisLine={false} tickLine={false} />
                        <YAxis className="text-[10px] font-bold" axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                border: 'none',
                                borderRadius: '16px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                            }}
                        />
                        <Bar dataKey="skills" fill="#2563eb" radius={[6, 6, 0, 0]} name="Skills" />
                        <Bar dataKey="tests" fill="#84cc16" radius={[6, 6, 0, 0]} name="Tests" />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
        
        <div className="space-y-8">
            <Card title="Next Steps" icon="list-todo">
                <div className="space-y-4 pt-2">
                    {[
                        { label: 'Complete React Advanced Mock', icon: 'code-2', status: 'Pending', path: '/interview-prep' },
                        { label: 'Update Portfolio Link', icon: 'globe', status: 'Critical', path: '/profile' },
                        { label: 'Chat with AI Coach', icon: 'message-circle', status: 'Recommended', path: '/chatbot' }
                    ].map((step, i) => (
                        <div 
                            key={i} 
                            onClick={() => navigate(step.path)}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-[20px] group cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                    <i data-lucide={step.icon} className="w-4 h-4 text-primary-500"></i>
                                </div>
                                <div>
                                    <p className="text-xs font-bold leading-none">{step.label}</p>
                                    <p className={`text-[9px] font-black uppercase mt-1 ${step.status === 'Critical' ? 'text-red-500' : 'text-gray-400'}`}>{step.status}</p>
                                </div>
                            </div>
                            <i data-lucide="chevron-right" className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors"></i>
                        </div>
                    ))}
                </div>
            </Card>

            <div 
                onClick={() => navigate('/chatbot')}
                className="bg-primary-600 rounded-[28px] p-8 text-white relative overflow-hidden group cursor-pointer shadow-lg shadow-primary-200"
            >
                <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform">
                    <i data-lucide="bot" className="w-32 h-32"></i>
                </div>
                <h3 className="text-xl font-black mb-2">Need Guidance?</h3>
                <p className="text-sm font-medium text-primary-100 mb-6 leading-relaxed">Your AI Coach is ready with real-time market insights.</p>
                <button className="bg-white text-primary-600 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-xl transition-all">
                    START CHAT
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
