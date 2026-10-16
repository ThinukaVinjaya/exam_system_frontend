import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Lock, User, AlertCircle, Award, BookOpen, GraduationCap, CheckCircle2, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ username: username.trim(), password });
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'MARKING_PANEL') {
        navigate('/panel/dashboard');
      } else {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || sessionStorage.getItem('quizRedirect');
        sessionStorage.removeItem('quizRedirect');
        if (redirect && redirect.startsWith('/student/')) {
          navigate(redirect);
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 relative overflow-hidden font-sans">
      {/* Background ambient decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Platform Features Showcase Card (Desktop) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col items-center text-center p-8 dark:bg-slate-900/85 bg-white/90 backdrop-blur-2xl rounded-3xl border dark:border-slate-800 border-slate-200/90 shadow-xl shadow-slate-900/5 dark:shadow-2xl space-y-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center shadow-xl shadow-blue-500/25 border border-blue-400/40 transition-transform group-hover:scale-105 duration-300">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <h2 className="text-2xl font-black dark:text-white text-slate-900 font-display">ExamPortal</h2>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Online Examination & Assessment</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Standardized testing platform with automatic evaluation, multi-window schedules, and analytics.
            </p>
          </div>

          <div className="w-full space-y-2.5 pt-2 border-t dark:border-slate-800/80 border-slate-200 text-left text-xs dark:text-slate-300 text-slate-600 font-medium">
            <div className="flex items-center gap-2.5 p-2.5 dark:bg-slate-950/60 bg-slate-50 rounded-xl border dark:border-slate-800/60 border-slate-200">
              <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>Multi-Subject & Model Examinations</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 dark:bg-slate-950/60 bg-slate-50 rounded-xl border dark:border-slate-800/60 border-slate-200">
              <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Island & Institutional Merit Rankings</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 dark:bg-slate-950/60 bg-slate-50 rounded-xl border dark:border-slate-800/60 border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Secure Timed Exam Sessions</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="lg:col-span-7 dark:bg-slate-900/85 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-2xl border dark:border-slate-800/90 border-slate-200/90 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25 border border-blue-400/30 mx-auto">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black dark:text-white text-slate-900 font-display tracking-tight">
                ExamPortal Sign In
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your Username and Password to access examinations
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username (e.g. student123)"
                  className="w-full pl-10 pr-4 py-3 dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t dark:border-slate-800/80 border-slate-200">
            New Student?{' '}
            <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline underline-offset-2">
              Create Student Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
