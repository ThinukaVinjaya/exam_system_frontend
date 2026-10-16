import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../../services/api.js';
import {
  Users,
  Activity,
  CheckCircle,
  PlusCircle,
  Upload,
  Award,
  ArrowRight,
  Download,
  ShieldCheck,
  Sparkles,
  Key,
} from 'lucide-react';

const cleanQuizTitle = (title: string) => {
  return (title || '').replace(/^((quiz|exam)\s*#\d+\s*[-:]?\s*)+/i, '').trim() || title;
};

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setStats(res.data.data))
      .finally(() => setLoading(false));

    api
      .get('/admin/system/storage-info')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setStorageInfo(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleDownloadMonthlyPdf = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const token = localStorage.getItem('accessToken') || '';
    window.open(`${API_BASE_URL}/admin/reports/monthly/${year}/${month}/pdf?token=${encodeURIComponent(token)}`, '_blank');
  };

  const handleDownloadStudentsPdf = () => {
    const token = localStorage.getItem('accessToken') || '';
    window.open(`${API_BASE_URL}/admin/students/pdf?token=${encodeURIComponent(token)}`, '_blank');
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading administration dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time management of examinations, registered students, and performance evaluations
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleDownloadStudentsPdf}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            title="Download complete registered students table with WhatsApp numbers in PDF"
          >
            <Download className="w-4 h-4 text-emerald-200" /> Students PDF Directory
          </button>
          <button
            onClick={handleDownloadMonthlyPdf}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 font-bold rounded-2xl text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-md transition-all"
            title="Download this month's aggregated PDF report"
          >
            <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Monthly Report PDF
          </button>
          <Link
            to="/admin/registration-settings"
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-bold rounded-2xl text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-md transition-all"
            title="Manage students and reset user passwords directly"
          >
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Reset Passwords & Batches
          </Link>
          <Link
            to="/admin/pdf-import"
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold rounded-2xl text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-md transition-all"
          >
            <Upload className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Import PDF
          </Link>
          <Link
            to="/admin/ai-generator"
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-violet-500/25 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> AI Quiz Generator
          </Link>
          <Link
            to="/admin/quizzes/create"
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Create Exam
          </Link>
        </div>
      </div>

      {/* System Status & Limits Quick Bar */}
      <div className="bg-white/95 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800 dark:text-slate-200">System Online</span>
          </div>
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-500 dark:text-slate-400">Admin PDF Upload Limit:</span>
            <strong className="text-slate-900 dark:text-white font-mono bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/20">
              {storageInfo?.maxPdfSizeMb || 20} MB
            </strong>
          </div>
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-slate-500 dark:text-slate-400">AI Multimodal Engine:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold text-[10px]">
              Active & Connected
            </span>
          </div>
        </div>

        <Link
          to="/admin/pdf-import"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold flex items-center gap-1 text-xs transition-colors"
        >
          View PDF Upload & AI Limits <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/95 dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Students
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-display">
              {stats.totalStudents}
            </span>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Live Exams
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
              {stats.liveQuizzes}
            </span>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Attempts
            </span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-display">
              {stats.totalAttempts}
            </span>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Average Score
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-display">
              {stats.averageScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Recent Examinations List */}
      <div className="bg-white/95 dark:bg-slate-900/70 rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">Recent Examinations</h2>
          <Link
            to="/admin/quizzes"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentQuizzes.length === 0 ? (
          <div className="text-center py-10 text-slate-500 space-y-2">
            <p className="text-xs">No examinations currently created in the real database.</p>
            <p className="text-[11px] text-slate-500">
              Click &quot;Create Exam&quot; or &quot;Import PDF&quot; above to schedule your first examination!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {stats.recentQuizzes.map((q: any) => (
              <div key={q._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border border-blue-400/40 shadow-sm flex-shrink-0">
                      Exam #{q.quizNumber || 1}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white block text-sm font-sinhala">{cleanQuizTitle(q.title)}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    {q.subjectId?.nameEn || q.subjectId?.nameSi} • {q.durationMinutes} mins
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase ${
                    q.status === 'LIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
