import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { MathRenderer } from '../../components/MathRenderer.js';
import {
  Clock,
  Award,
  BookOpen,
  LogIn,
  UserPlus,
  Share2,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { formatSriLankanTime, formatSriLankanTimePeriod } from '../../utils/sriLankanTime.js';

const cleanQuizTitle = (title: string) => {
  return (title || '').replace(/^(quiz\s*#\d+\s*[-:]?\s*)+/i, '').trim() || title;
};

export const PublicQuizJoinPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!quizId) return;

    // Save target redirect in session storage
    sessionStorage.setItem('quizRedirect', `/student/quiz/${quizId}/take`);

    // If student is already logged in, redirect directly to the exam
    if (!authLoading && user && user.role === 'STUDENT') {
      navigate(`/student/quiz/${quizId}/take`, { replace: true });
      return;
    }

    // Fetch public quiz info
    api
      .get(`/quizzes/public/${quizId}`)
      .then((res) => {
        setQuiz(res.data.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Examination not found or link has expired.');
      })
      .finally(() => setLoading(false));
  }, [quizId, user, authLoading, navigate]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const quizNumPrefix = quiz?.quizNumber ? `Exam #${quiz.quizNumber} - ` : '';
    const text = encodeURIComponent(
      `Join the online quiz: ${quizNumPrefix}${quiz?.title || 'Online Examination'}\n${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading examination invitation...</span>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans">
        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Quiz Link Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error || 'This examination link is no longer valid.'}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const examTakeUrl = `/student/quiz/${quizId}/take`;

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-between py-10 px-4 relative overflow-hidden font-sans">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="max-w-xl mx-auto w-full text-center space-y-3 relative z-10">
        <div className="inline-flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-blue-500/30 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
              Exam<span className="text-blue-400">Portal</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Online Examination System</span>
          </div>
        </div>
      </div>

      {/* Quiz Card */}
      <div className="max-w-xl mx-auto w-full bg-slate-900/85 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800/90 p-6 sm:p-8 space-y-6 relative z-10 my-auto">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border border-blue-400/40 text-xs sm:text-sm font-mono font-black rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 flex-shrink-0 tracking-tight">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              Exam #{quiz.quizNumber || 1}
            </span>
            {quiz.isBetweenWindows && quiz.nextWindow ? (
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold rounded-xl flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" />
                ⏸️ Session Paused · Next: {quiz.nextWindow.label || 'Next Slot'}
              </span>
            ) : quiz.status === 'SCHEDULED' || !quiz.isCurrentlyOpen ? (
              <span className="px-2.5 py-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[11px] font-bold rounded-xl flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-400" />
                Scheduled Exam (SLST)
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold rounded-xl flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Online Now {quiz.currentWindow?.label ? `(${quiz.currentWindow.label})` : ''}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
            {!quiz.title?.trim().toLowerCase().startsWith('quiz #') && !quiz.title?.trim().toLowerCase().startsWith('exam #') && (
              <span className="text-blue-400 font-mono font-black mr-2">Exam #{quiz.quizNumber || 1} -</span>
            )}
            <MathRenderer text={cleanQuizTitle(quiz.title)} />
          </h1>

          {/* Schedule Window Card */}
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/25 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-blue-300 font-bold">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>
                {quiz.scheduleWindows && quiz.scheduleWindows.length > 1
                  ? `Multi-Day Examination Schedule (${quiz.scheduleWindows.length} Days):`
                  : 'Official Examination Window:'}
              </span>
            </div>

            {quiz.scheduleWindows && quiz.scheduleWindows.length > 1 ? (
              <div className="space-y-1.5 pl-2">
                {quiz.scheduleWindows.map((w: any, idx: number) => {
                  const isCurrent =
                    quiz.currentWindow &&
                    new Date(quiz.currentWindow.startTime).getTime() === new Date(w.startTime).getTime();
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 ${
                        isCurrent
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                        {w.label || `Slot ${idx + 1}`}:
                      </span>
                      <strong className="font-mono text-[11px] sm:text-xs">
                        {formatSriLankanTimePeriod(w.startTime, w.endTime)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white font-mono text-sm pl-5 font-bold">
                {formatSriLankanTimePeriod(quiz.startTime, quiz.endTime)}
              </p>
            )}

            <p className="text-[11px] text-amber-300/90 pl-1 leading-relaxed">
              ⚠️ Each candidate may attempt the exam within {quiz.durationMinutes} minutes during any active scheduled slot.
            </p>
            <p className="text-[10px] text-blue-300/90 pl-1 leading-relaxed">
              🏆 Official National & District rankings are computed automatically after the final scheduled window closes.
            </p>
          </div>

          {quiz.description && (
            <p className="text-xs text-slate-400 leading-relaxed">
              {quiz.description}
            </p>
          )}
        </div>

        {/* Exam Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Duration</span>
            <span className="text-base font-black text-white font-display">
              {quiz.durationMinutes} mins
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Questions</span>
            <span className="text-base font-black text-blue-400 font-display">
              {quiz.totalQuestions || 'Multiple'}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Marks</span>
            <span className="text-base font-black text-emerald-400 font-display">
              {quiz.totalMarks || 100}
            </span>
          </div>
        </div>

        {/* Action Buttons for Logged In or Guest */}
        {user ? (
          <div className="space-y-3">
            <Link
              to={examTakeUrl}
              className={`w-full py-4 text-white font-extrabold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider ${
                quiz.status === 'SCHEDULED'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
              }`}
            >
              {quiz.status === 'SCHEDULED' ? (
                <>
                  <Clock className="w-4 h-4" /> Check Scheduled Exam <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Start Examination Now <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                Please log in to your student account or create a free account to take this test. Your answers and island rank will be saved.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to={`/login?redirect=${encodeURIComponent(examTakeUrl)}`}
                className="py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
              >
                <LogIn className="w-4 h-4" /> Login & Start
              </Link>
              <Link
                to={`/register?redirect=${encodeURIComponent(examTakeUrl)}`}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-2xl text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
              >
                <UserPlus className="w-4 h-4" /> Create Account
              </Link>
            </div>
          </div>
        )}

        {/* Share Section */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-medium">Share Quiz with Friends:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex items-center gap-1.5 transition-all"
            >
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 relative z-10 pt-4">
        © 2026 ExamPortal • Online Examination Platform • All Rights Reserved
      </footer>
    </div>
  );
};
