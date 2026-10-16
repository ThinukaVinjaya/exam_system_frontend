import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../../services/api.js';
import { MathRenderer } from '../../components/MathRenderer.js';
import { QuestionImageViewer } from '../../components/QuestionImageViewer.js';
import {
  Download,
  ArrowLeft,
  Users,
  Award,
  TrendingUp,
  CheckCircle,
  BarChart2,
  Trophy,
  Clock,
  GraduationCap,
  FileSpreadsheet,
  AlertTriangle,
  Flame,
  CheckCircle2,
  MapPin,
  Percent,
  Layers,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Check,
  MessageSquare,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { EditQuizSettingsModal } from '../../components/EditQuizSettingsModal.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

export const AdminQuizReportPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [report, setReport] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [fullPaperRankings, setFullPaperRankings] = useState<any[]>([]);
  const [activeRankingTab, setActiveRankingTab] = useState<'QUIZ' | 'FULL_PAPER'>('QUIZ');
  const [analyticsScope, setAnalyticsScope] = useState<'ALL' | 'FULL_PAPER' | 'ESSAY' | 'MCQ'>('ALL');
  // Rankings search and pagination
  const [rankingSearch, setRankingSearch] = useState<string>('');
  const [rankingPage, setRankingPage] = useState<number>(1);
  const [rankingPageSize, setRankingPageSize] = useState<number>(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [isEditSettingsModalOpen, setIsEditSettingsModalOpen] = useState(false);

  const fetchReportData = async () => {
    if (!quizId) return;
    setLoading(true);
    setError(null);
    try {
      const repRes = await api.get(`/admin/quizzes/${quizId}/report`);
      const repData = repRes.data?.data;
      if (!repData) {
        throw new Error('Report data response is empty.');
      }
      setReport(repData);

      if (repData.rankings && repData.rankings.length > 0) {
        setRankings(repData.rankings);
      }
      if (repData.fullPaperRankings && repData.fullPaperRankings.length > 0) {
        setFullPaperRankings(repData.fullPaperRankings);
      }

      // Secondary non-blocking fetch for rankings snapshot if rankings list is empty
      try {
        const rankRes = await api.get(`/quizzes/${quizId}/rankings`);
        if ((!repData.rankings || repData.rankings.length === 0) && rankRes.data?.data) {
          if (rankRes.data.data.snapshot?.rankings) {
            setRankings(rankRes.data.data.snapshot.rankings || []);
          } else if (rankRes.data.data.rankings) {
            setRankings(rankRes.data.data.rankings || []);
          }
        }
        if (
          (!repData.fullPaperRankings || repData.fullPaperRankings.length === 0) &&
          rankRes.data?.data?.fullPaperSnapshot?.rankings
        ) {
          setFullPaperRankings(rankRes.data.data.fullPaperSnapshot.rankings || []);
        }
      } catch (rankErr) {
        console.warn('Rankings snapshot secondary fetch notice:', rankErr);
      }
    } catch (err: any) {
      console.error('Failed to load quiz report:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load examination report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [quizId]);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const res = await api.get(`/admin/reports/${quizId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const qNum = report?.quiz?.quizNumber ? `#${report.quiz.quizNumber}` : 'Exam';
      link.setAttribute('download', `Quiz_${qNum}_Official_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.warn('Direct blob PDF download failed, falling back to direct URL tab:', err);
      const token = localStorage.getItem('accessToken') || '';
      window.open(`${API_BASE_URL}/admin/reports/${quizId}/pdf?token=${encodeURIComponent(token)}`, '_blank');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportCsv = () => {
    if (activeRankingTab === 'FULL_PAPER') {
      if (!fullPaperRankings || fullPaperRankings.length === 0) {
        alert('No full paper student results available to export.');
        return;
      }
      const headers = ['Full Paper Rank', 'Student Name', 'Username', 'School', 'District', 'MCQ Score', 'Essay Score', 'Total Score', 'Total Marks', 'Percentage', 'Time Taken (Seconds)'];
      const rows = fullPaperRankings.map((r: any) => [
        r.islandRank || 'N/A',
        `"${(r.fullName || '').replace(/"/g, '""')}"`,
        `"${(r.username || '').replace(/"/g, '""')}"`,
        `"${(r.school || '').replace(/"/g, '""')}"`,
        `"${(r.districtId || '').replace(/"/g, '""')}"`,
        r.mcqScore ?? '',
        r.essayScore ?? '',
        r.totalScore ?? '',
        r.totalMarks ?? '',
        r.percentage ?? '',
        r.timeTakenSeconds ?? '',
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Quiz_${report?.quiz?.quizNumber || 1}_Full_Paper_Rankings.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const list = (report?.rankings && report.rankings.length > 0) ? report.rankings : rankings;
    if (!list || list.length === 0) {
      alert('No student results available to export.');
      return;
    }
    const headers = ['Rank', 'Student Name', 'School', 'District', 'Score', 'Total Marks', 'Percentage', 'Time Taken (Seconds)'];
    const rows = list.map((r: any) => [
      r.rank || 'N/A',
      `"${(r.fullName || '').replace(/"/g, '""')}"`,
      `"${(r.school || '').replace(/"/g, '""')}"`,
      `"${(r.districtName || '').replace(/"/g, '""')}"`,
      r.score ?? '',
      report?.quiz?.totalMarks ?? '',
      r.percentage ?? '',
      r.timeTakenSeconds ?? '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quiz_${report?.quiz?.quizNumber || 1}_Performance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedRankings = (report?.rankings && report.rankings.length > 0) ? report.rankings : rankings;
  const currentRawRankings = activeRankingTab === 'FULL_PAPER' ? fullPaperRankings : (displayedRankings || []);

  const filteredRankings = useMemo(() => {
    if (!currentRawRankings || !Array.isArray(currentRawRankings)) return [];
    if (!rankingSearch.trim()) return currentRawRankings;
    const q = rankingSearch.trim().toLowerCase();
    return currentRawRankings.filter((r: any) => {
      const name = (r.fullName || '').toLowerCase();
      const username = (r.username || '').toLowerCase();
      const school = (r.school || '').toLowerCase();
      const district = (r.districtName || r.districtId || '').toLowerCase();
      const rankStr = `#${r.rank || r.islandRank || ''}`;
      return (
        name.includes(q) ||
        username.includes(q) ||
        school.includes(q) ||
        district.includes(q) ||
        rankStr.includes(q)
      );
    });
  }, [currentRawRankings, rankingSearch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-500 dark:text-slate-400 gap-4 font-sans">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold tracking-wide">Aggregating deep examination analytics & generating graphs...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-3xl shadow-xl text-center space-y-4 font-sans">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Load Examination Report</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {error || 'The report data could not be retrieved. Please check if results or questions exist for this examination.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow cursor-pointer"
          >
            Retry Loading
          </button>
          <Link
            to="/admin/quizzes"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  const quiz = report.quiz || {};
  const summary = report.summary || {
    totalParticipants: 0,
    averageScore: 0,
    averagePercentage: 0,
    highestScore: 0,
    highestPercentage: 0,
    lowestScore: 0,
    lowestPercentage: 0,
    passRate: 0,
    passingStudents: 0,
    failingStudents: 0,
    medianScore: 0,
    scoreStandardDeviation: 0,
    averageTimeTakenSeconds: 0,
    fastestTimeTakenSeconds: 0,
    slowestTimeTakenSeconds: 0,
  };
  const provinceStats = report.provinceStats || [];
  const batchStats = report.batchStats || [];
  const questionStats = report.questionStats || [];
  const scoreBuckets = report.scoreBuckets || [];
  const gradeBreakdown = report.gradeBreakdown || [];
  const hardestQuestion = report.hardestQuestion || null;
  const easiestQuestion = report.easiestQuestion || null;
  const hasEssay = Boolean(report.hasEssay);
  const essayStats = report.essayStats || null;
  const fullPaperStats = report.fullPaperStats || null;

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 p-3 rounded-2xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="font-semibold" style={{ color: entry.color || entry.fill || '#3b82f6' }}>
              {entry.name}: <strong className="font-mono text-slate-900 dark:text-white">{entry.value}</strong>
              {entry.unit ? ` ${entry.unit}` : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalRankingPages = Math.max(
    1,
    rankingPageSize === -1 ? 1 : Math.ceil(filteredRankings.length / rankingPageSize)
  );
  const validRankingPage = Math.min(Math.max(1, rankingPage), totalRankingPages);
  const rankingStartIndex = (validRankingPage - 1) * (rankingPageSize === -1 ? filteredRankings.length : rankingPageSize);
  const rankingEndIndex =
    rankingPageSize === -1
      ? filteredRankings.length
      : Math.min(rankingStartIndex + rankingPageSize, filteredRankings.length);
  const paginatedRankings = filteredRankings.slice(
    rankingStartIndex,
    rankingEndIndex
  );
  const questionsToShow = showAllQuestions ? questionStats : questionStats.slice(0, 10);

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          to="/admin/quizzes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes List
        </Link>

        <div className="flex items-center gap-2 flex-wrap">

          {/* Edit Quiz Settings Button */}
          <button
            onClick={() => setIsEditSettingsModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Edit Quiz Settings (Title, Duration, Schedule, Essay, Deadline)"
          >
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Edit Quiz Settings</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            title="Export full leaderboard and score data to Excel CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Export CSV Data
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer hidden md:flex"
            title="Print or save as PDF"
          >
            <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Print
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            {downloadingPdf ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloadingPdf ? 'Downloading PDF...' : 'Download Official PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Examination Header Card */}
      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-3 py-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border border-blue-400/40 text-xs sm:text-sm font-mono font-black rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 flex-shrink-0 tracking-tight">
            <Trophy className="w-3.5 h-3.5 text-blue-200" />
            Exam #{quiz.quizNumber || 1}
          </span>
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-500/20">
            {quiz.subjectId?.nameEn || quiz.subjectId?.nameSi || 'Curriculum'}
          </span>
          {quiz.targetCategory && quiz.targetCategory !== 'ALL' ? (
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Target Audience: {quiz.targetCategory}
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Audience: Everyone (All Batches)
            </span>
          )}
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            {quiz.durationMinutes} Minutes · {questionStats.length} Questions
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sinhala leading-snug">
            {(quiz.title || '').replace(/^(quiz\s*#\d+\s*[-:]?\s*)+/i, '').trim()}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time performance analytics, G.C.E. A/L standard grade distributions, and question accuracy diagnostics.
          </p>
        </div>
      </div>

      {/* Analytics Scope Navigation Tabs if Quiz has Essay */}
      {(hasEssay || quiz?.hasEssay) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-lg">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAnalyticsScope('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                analyticsScope === 'ALL'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Analytics
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalyticsScope('FULL_PAPER');
                setActiveRankingTab('FULL_PAPER');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                analyticsScope === 'FULL_PAPER'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-200" />
              Full Paper Analysis (MCQ + Essay)
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalyticsScope('ESSAY');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                analyticsScope === 'ESSAY'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-violet-200" />
              Essay Paper Analysis
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalyticsScope('MCQ');
                setActiveRankingTab('QUIZ');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                analyticsScope === 'MCQ'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-blue-200" />
              MCQ Quiz Analytics
            </button>
          </div>

          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Dual Assessment Diagnostics</span>
          </div>
        </div>
      )}

      {/* FULL PAPER COMPOSITE ANALYTICS SECTION */}
      {(hasEssay || quiz?.hasEssay) && fullPaperStats && (analyticsScope === 'ALL' || analyticsScope === 'FULL_PAPER') && (
        <div className="space-y-6 pt-2">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-amber-50 dark:from-amber-950/40 via-white dark:via-slate-900/80 to-white dark:to-slate-900/80 border border-amber-200 dark:border-amber-500/40 rounded-3xl shadow-sm dark:shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 rounded-2xl text-amber-600 dark:text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
                  Full Paper Composite Analysis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive performance diagnostics combining MCQ Quiz scores and Marking Panel evaluated Essay marks.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold rounded-xl">
                Total Marks: {fullPaperStats.totalMarks} (MCQ {quiz.totalMarks} + Essay {fullPaperStats.markComparison?.essayTotalMarks || quiz.essayTotalMarks || 100})
              </span>
            </div>
          </div>

          {/* Full Paper 6 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400/90">Candidates</span>
                <Users className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display block">
                {fullPaperStats.totalParticipants}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Evaluated Full Papers
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400/90">Average</span>
                <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-display block">
                {fullPaperStats.averagePercentage}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                Avg: {fullPaperStats.averageScore} / {fullPaperStats.totalMarks}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400/90">Highest</span>
                <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display block">
                {fullPaperStats.highestScore}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                {fullPaperStats.highestPercentage}% (Max Composite)
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400/90">Lowest</span>
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-display block">
                {fullPaperStats.lowestScore}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                {fullPaperStats.lowestPercentage}% (Min Composite)
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400/90">Pass Rate</span>
                <CheckCircle className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-display block">
                {fullPaperStats.passRate}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                {fullPaperStats.passCount} Passed (≥ 35%)
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400/90">Distinction</span>
                <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display block">
                {fullPaperStats.distinctionCount}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                A Grade (≥ 75%)
              </span>
            </div>
          </div>

          {/* Mark Contribution & Weight Diagnostic Card */}
          {fullPaperStats.markComparison && (
            <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm dark:shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Paper Mark Breakdown & Weight Comparison
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Full Paper Composite: {fullPaperStats.totalMarks} Total Points
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* MCQ Contribution */}
                <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-blue-200 dark:border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Section 1: MCQ Quiz
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-500/20">
                      Weight: {fullPaperStats.markComparison.mcqWeightPercentage}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Average Candidate Score:</span>
                    <strong className="text-lg font-black text-blue-600 dark:text-blue-400 font-display">
                      {fullPaperStats.markComparison.mcqAverageScore} / {fullPaperStats.markComparison.mcqTotalMarks} ({fullPaperStats.markComparison.mcqAveragePercentage}%)
                    </strong>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, fullPaperStats.markComparison.mcqAveragePercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Essay Contribution */}
                <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-violet-200 dark:border-violet-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Section 2: Essay Paper
                    </span>
                    <span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-200 dark:border-violet-500/20">
                      Weight: {fullPaperStats.markComparison.essayWeightPercentage}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Average Candidate Mark:</span>
                    <strong className="text-lg font-black text-violet-600 dark:text-violet-400 font-display">
                      {fullPaperStats.markComparison.essayAverageScore} / {fullPaperStats.markComparison.essayTotalMarks} ({fullPaperStats.markComparison.essayAveragePercentage}%)
                    </strong>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, fullPaperStats.markComparison.essayAveragePercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Paper Graphs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Full Paper Grade Classification */}
            <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    Grade Classification Distribution
                  </h2>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {fullPaperStats.totalParticipants} Candidates
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grade A (≥75%), Grade B (65-74%), Grade C (50-64%), Grade S (35-49%), Grade F (&lt;35%)
                </p>
              </div>

              <div className="h-64 w-full">
                {fullPaperStats.totalParticipants === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                    No full paper evaluation data to render grade chart.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fullPaperStats.gradeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="grade"
                      >
                        {fullPaperStats.gradeBreakdown.map((entry: any, index: number) => (
                          <Cell key={`fp-cell-${index}`} fill={entry.color || '#f59e0b'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Grade Pills */}
              <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
                {fullPaperStats.gradeBreakdown.map((g: any, i: number) => (
                  <div key={i} className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/60">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{g.grade.split(' ')[0]}</div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{g.count}</div>
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{g.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Paper Score Histogram */}
            <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    Score Distribution Curve
                  </h2>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {fullPaperStats.totalParticipants} Candidates
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Histogram showing student concentration across 5 composite percentage score tiers.
                </p>
              </div>

              <div className="h-64 w-full">
                {fullPaperStats.totalParticipants === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                    No full paper evaluation data to render distribution curve.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fullPaperStats.scoreBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fpScoreDistGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="stroke-slate-200 dark:stroke-slate-800" />
                      <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Students"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#fpScoreDistGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bucket Pills */}
              <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
                {fullPaperStats.scoreBuckets.map((b: any, i: number) => (
                  <div key={i} className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/60">
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">{b.range}</div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{b.count}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{b.percentage || 0}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESSAY PAPER MARKS ANALYSIS SECTION */}
      {(hasEssay || quiz?.hasEssay) && essayStats && (analyticsScope === 'ALL' || analyticsScope === 'ESSAY') && (
        <div className="space-y-6 pt-2">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-violet-50 dark:from-violet-950/40 via-white dark:via-slate-900/80 to-white dark:to-slate-900/80 border border-violet-200 dark:border-violet-500/40 rounded-3xl shadow-sm dark:shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/40 rounded-2xl text-violet-600 dark:text-violet-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
                  Essay Paper & Marking Panel Diagnostics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Panel marking progress, submission receipt status, and essay mark score distributions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-violet-100 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/30 text-violet-800 dark:text-violet-300 text-xs font-mono font-bold rounded-xl">
                Max Essay Marks: {essayStats.essayTotalMarks}
              </span>
            </div>
          </div>

          {/* Essay 6 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-violet-200 dark:border-violet-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Uploads</span>
                <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display block">
                {essayStats.totalSubmissions}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Answer Sheets Received
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Marked</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display block">
                {essayStats.markedCount}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Confirmed by Panel
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending</span>
                <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-display block">
                {essayStats.pendingCount}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Awaiting Panel Review
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-violet-200 dark:border-violet-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Avg Mark</span>
                <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-violet-700 dark:text-violet-300 font-display block">
                {essayStats.averageMarks}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                {essayStats.averagePercentage}% of {essayStats.essayTotalMarks}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Highest</span>
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display block">
                {essayStats.highestMarks}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                {essayStats.highestPercentage}% (Max Mark)
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-purple-200 dark:border-purple-500/30 shadow-sm dark:shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Pass Rate</span>
                <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-display block">
                {essayStats.passRate}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                {essayStats.passCount} with ≥ 35%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MCQ QUIZ SECTION HEADER (if Dual Assessment) */}
      {(hasEssay || quiz?.hasEssay) && (analyticsScope === 'ALL' || analyticsScope === 'MCQ') && (
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900/70 border border-blue-200 dark:border-blue-500/30 rounded-2xl pt-2 shadow-sm">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              MCQ Assessment Diagnostics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Per-question accuracy diagnostics, difficulty ratings, and candidate time analytics for the MCQ session.
            </p>
          </div>
        </div>
      )}

      {/* MCQ Section Content */}
      {(analyticsScope === 'ALL' || analyticsScope === 'MCQ') && (
        <div className="space-y-8">
      {/* Summary KPI Cards Grid (6 Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Candidates */}
        <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Candidates</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display block">
            {summary.totalParticipants}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
            Total Submissions
          </span>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Average</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-display block">
            {summary.totalParticipants > 0 ? `${summary.averageScore}%` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
            Median: {summary.medianScore !== undefined ? `${summary.medianScore}%` : '-'}
          </span>
        </div>

        {/* Highest Mark */}
        <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Highest</span>
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display block">
            {summary.totalParticipants > 0 ? `${summary.highestScore}` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
            {summary.totalParticipants > 0 ? `${summary.highestPercentage}% (Max)` : '-'}
          </span>
        </div>

        {/* Lowest Mark */}
        <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Lowest</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-display block">
            {summary.totalParticipants > 0 ? `${summary.lowestScore}` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
            {summary.totalParticipants > 0 ? `${summary.lowestPercentage}% (Min)` : '-'}
          </span>
        </div>

        {/* Pass Rate */}
        <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Pass Rate</span>
            <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-display block">
            {summary.totalParticipants > 0 ? `${summary.passRate}%` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
            ≥ 35% Pass
          </span>
        </div>

        {/* Avg Duration */}
        <div className="bg-white dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Avg Time</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-display block">
            {summary.avgTimeSeconds ? `${Math.floor(summary.avgTimeSeconds / 60)}m` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
            {summary.avgTimeSeconds ? `${summary.avgTimeSeconds % 60}s per student` : 'Allocated: ' + quiz.durationMinutes + 'm'}
          </span>
        </div>
      </div>

      {/* Deep-Dive Highlights: Hardest & Easiest Questions Callout */}
      {(hardestQuestion || easiestQuestion) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hardest Question Card */}
          {hardestQuestion && (
            <div className="bg-white dark:bg-slate-900/70 border border-rose-200 dark:border-rose-500/30 rounded-3xl p-5 shadow-sm dark:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Flame className="w-4 h-4" /> Most Challenging Question
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                  {hardestQuestion.accuracyRate}% Accuracy
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                  Question #{hardestQuestion.questionNumber}
                </span>
                <div className="text-xs text-slate-700 dark:text-slate-300 font-sinhala line-clamp-2">
                  <MathRenderer text={hardestQuestion.questionText} />
                </div>
                {hardestQuestion.imageUrl && (
                  <QuestionImageViewer
                    imageUrl={hardestQuestion.imageUrl}
                    imageCaption={hardestQuestion.imageCaption}
                    maxHeightClass="max-h-36"
                  />
                )}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <span>Correct Key: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{hardestQuestion.correctAnswer}</strong></span>
                  <span>{hardestQuestion.correctCount} of {hardestQuestion.totalAttempts} answered correctly</span>
                </div>
              </div>
            </div>
          )}

          {/* Easiest Question Card */}
          {easiestQuestion && (
            <div className="bg-white dark:bg-slate-900/70 border border-emerald-200 dark:border-emerald-500/30 rounded-3xl p-5 shadow-sm dark:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Highest Mastery Question
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  {easiestQuestion.accuracyRate}% Accuracy
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                  Question #{easiestQuestion.questionNumber}
                </span>
                <div className="text-xs text-slate-700 dark:text-slate-300 font-sinhala line-clamp-2">
                  <MathRenderer text={easiestQuestion.questionText} />
                </div>
                {easiestQuestion.imageUrl && (
                  <QuestionImageViewer
                    imageUrl={easiestQuestion.imageUrl}
                    imageCaption={easiestQuestion.imageCaption}
                    maxHeightClass="max-h-36"
                  />
                )}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <span>Correct Key: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{easiestQuestion.correctAnswer}</strong></span>
                  <span>{easiestQuestion.correctCount} of {easiestQuestion.totalAttempts} answered correctly</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Analytics Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: G.C.E. A/L Standard Grade Classification */}
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Grade Classification Distribution
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {summary.totalParticipants} Candidates
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grade A (≥75%), Grade B (65-74%), Grade C (50-64%), Grade S (35-49%), Grade F (&lt;35%)
            </p>
          </div>

          <div className="h-64 w-full">
            {summary.totalParticipants === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                No attempt data to render grade chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="grade"
                  >
                    {gradeBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Grade Breakdown Pills Grid */}
          <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
            {gradeBreakdown.map((g: any, i: number) => (
              <div key={i} className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{g.grade.split(' ')[0]}</div>
                <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">{g.count}</div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{g.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Graph 2: Score Distribution Bell-Curve / Histogram */}
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Score Distribution Curve
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {scoreBuckets.reduce((acc: number, b: any) => acc + (b.count || 0), 0)} Scored
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Histogram showing student concentration across 5 score tiers (0% to 100%).
            </p>
          </div>

          <div className="h-64 w-full">
            {summary.totalParticipants === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                No attempt data to render score curve.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreDistGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Students"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreDistGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Distribution Summary */}
          <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
            {scoreBuckets.map((b: any, i: number) => (
              <div key={i} className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">{b.range}</div>
                <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">{b.count}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{b.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graph 3: Question-Level Accuracy Bar Chart */}
      {questionStats.length > 0 && (
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Question Accuracy Bar Chart
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Each bar represents the percentage of candidates who answered that question correctly.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Easy (≥70%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate (40-69%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Hard (&lt;40%)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={questionStats.map((q: any) => ({
                  name: `Q${q.questionNumber}`,
                  accuracyRate: q.accuracyRate,
                  difficultyRating: q.difficultyRating,
                  attempts: q.totalAttempts,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">{data.name}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-bold">Accuracy: {data.accuracyRate}%</p>
                          <p className="text-slate-500 dark:text-slate-400">Attempts: {data.attempts}</p>
                          <p className="text-blue-600 dark:text-blue-300">Difficulty: {data.difficultyRating}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="accuracyRate" radius={[6, 6, 0, 0]}>
                  {questionStats.map((q: any, idx: number) => {
                    const color =
                      q.accuracyRate >= 70
                        ? '#10b981'
                        : q.accuracyRate >= 40
                        ? '#f59e0b'
                        : '#ef4444';
                    return <Cell key={`bar-${idx}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* A/L Batch Category Performance Breakdown (e.g. 2027 A/L vs 2028 A/L) */}
      {batchStats && batchStats.length > 0 && (
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Student Batch Performance Comparison
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparison of average mark and pass rate across different A/L years (e.g. 2027 A/L, 2028 A/L).
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
              {batchStats.length} Batches Tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">A/L Batch Category</th>
                  <th className="p-3.5">Candidates</th>
                  <th className="p-3.5">Average Score %</th>
                  <th className="p-3.5 text-right">Pass Rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {batchStats.map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {b.batchName}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono">{b.participantCount}</td>
                    <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400 font-display">{b.averageScore}%</td>
                    <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-display">{b.passRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Top Rankers Leaderboard */}
      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              {activeRankingTab === 'FULL_PAPER' ? 'Full Paper Leaderboard' : 'Quiz Leaderboard (MCQ)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeRankingTab === 'FULL_PAPER'
                ? 'Composite ranking combining MCQ Quiz scores and evaluated Essay marks.'
                : 'Ranked by MCQ score with tie-breaker by fastest completion time.'}
            </p>
          </div>

          {/* Toggle between Quiz Rankings and Full Paper Rankings */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => {
                setActiveRankingTab('QUIZ');
                setRankingPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRankingTab === 'QUIZ'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              MCQ Quiz ({displayedRankings.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRankingTab('FULL_PAPER');
                setRankingPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRankingTab === 'FULL_PAPER'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Full Paper ({fullPaperRankings.length})
            </button>
          </div>
        </div>

        {/* Filter, Search & Page Size Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, @username, school, district, rank..."
              value={rankingSearch}
              onChange={(e) => {
                setRankingSearch(e.target.value);
                setRankingPage(1);
              }}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {rankingSearch && (
              <button
                type="button"
                onClick={() => {
                  setRankingSearch('');
                  setRankingPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-900 dark:text-white">{filteredRankings.length === 0 ? 0 : rankingStartIndex + 1}–{rankingEndIndex}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{filteredRankings.length}</strong>
              {rankingSearch && filteredRankings.length !== currentRawRankings.length && (
                <span className="text-blue-500 ml-1">({currentRawRankings.length} total)</span>
              )}
            </span>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400">Show:</span>
              {[25, 50, 100, -1].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setRankingPageSize(size);
                    setRankingPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    rankingPageSize === size
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {size === -1 ? 'All' : size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeRankingTab === 'QUIZ' && (!report.isMcqEnded && !report.rankPublished) && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start sm:items-center gap-3 text-amber-800 dark:text-amber-300 text-xs">
            <Clock className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0 animate-pulse" />
            <div className="space-y-0.5">
              <strong className="block font-bold">MCQ Exam Session in Progress</strong>
              <span>
                Official MCQ rankings will be computed once the session closes {report.mcqScheduledSriLankanEndTime || report.scheduledSriLankanEndTime ? `(${report.mcqScheduledSriLankanEndTime || report.scheduledSriLankanEndTime})` : ''} only.
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {activeRankingTab === 'FULL_PAPER' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Full Paper Rank</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">School</th>
                  <th className="p-3.5">District</th>
                  <th className="p-3.5">MCQ Score</th>
                  <th className="p-3.5">Essay Mark</th>
                  <th className="p-3.5">Total Marks</th>
                  <th className="p-3.5">Percentage</th>
                  <th className="p-3.5 text-right">Time Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {paginatedRankings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                      {rankingSearch ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-600 dark:text-slate-400">No students found matching "{rankingSearch}"</p>
                          <p className="text-slate-400 text-[11px]">Try searching with a different name, district, or registration number</p>
                        </div>
                      ) : (
                        'No full paper student submissions recorded or evaluated yet.'
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedRankings.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-black text-amber-600 dark:text-amber-400 font-display">
                        #{r.islandRank || rankingStartIndex + idx + 1}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {r.fullName}
                        <span className="block text-xs font-mono text-blue-600 dark:text-blue-400 font-normal">@{r.username}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 text-xs">{r.school || '-'}</td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 text-xs">{r.districtId || '-'}</td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-200 font-mono text-xs">{r.mcqScore}/{r.mcqTotalMarks}</td>
                      <td className="p-3.5 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold">{r.essayScore}/{r.essayTotalMarks}</td>
                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-display">
                        {r.totalScore} / {r.totalMarks}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-display">{r.percentage}%</td>
                      <td className="p-3.5 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {Math.floor((Number(r.timeTakenSeconds) || 0) / 60)}m {(Number(r.timeTakenSeconds) || 0) % 60}s
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">School</th>
                  <th className="p-3.5">District</th>
                  <th className="p-3.5">Marks</th>
                  <th className="p-3.5">Percentage</th>
                  <th className="p-3.5 text-right">Time Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {paginatedRankings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                      {rankingSearch ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-600 dark:text-slate-400">No students found matching "{rankingSearch}"</p>
                          <p className="text-slate-400 text-[11px]">Try searching with a different name, district, or index number</p>
                        </div>
                      ) : (
                        'No student submissions recorded for this quiz yet.'
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedRankings.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-black text-amber-600 dark:text-amber-400 font-display">
                        {r.rank ? `#${r.rank}` : (
                          <span className="text-[11px] text-amber-700 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/20 font-mono">
                            ⏳ Pending Final Day
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{r.fullName}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 text-xs">{r.school || '-'}</td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 text-xs">{r.districtName || '-'}</td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {r.score} / {quiz.totalMarks || summary.totalMarks}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-display">{r.percentage}%</td>
                      <td className="p-3.5 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {Math.floor((Number(r.timeTakenSeconds) || 0) / 60)}m {(Number(r.timeTakenSeconds) || 0) % 60}s
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Pagination Controls */}
        {totalRankingPages > 1 && (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page <strong className="text-slate-900 dark:text-white">{validRankingPage}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{totalRankingPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={validRankingPage <= 1}
                onClick={() => setRankingPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalRankingPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalRankingPages ||
                    Math.abs(p - validRankingPage) <= 1
                )
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && p - arr[i - 1] > 1 && (
                      <span className="px-1 text-slate-400">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setRankingPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        validRankingPage === p
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                type="button"
                disabled={validRankingPage >= totalRankingPages}
                onClick={() => setRankingPage((p) => Math.min(totalRankingPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Provincial Performance Table */}
      {provinceStats && provinceStats.length > 0 && (
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Provincial Performance Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Province</th>
                  <th className="p-3.5">Participants</th>
                  <th className="p-3.5">Average Score %</th>
                  <th className="p-3.5 text-right">Pass Rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {provinceStats.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{p.provinceName}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono">{p.participants ?? p.participantCount}</td>
                    <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400 font-display">{p.averageScore}%</td>
                    <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-display">{p.passRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question Accuracy Diagnostics */}
      {questionStats && questionStats.length > 0 && (
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Question-Level Accuracy Analysis ({questionStats.length} Questions)
            </h2>
            <button
              onClick={() => setShowAllQuestions(!showAllQuestions)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-500/20 cursor-pointer"
            >
              {showAllQuestions ? (
                <>Show Top 10 Only <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Show All ({questionStats.length}) <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {questionsToShow.map((qs: any, idx: number) => {
              const diffColor =
                qs.accuracyRate >= 70
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                  : qs.accuracyRate >= 40
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';

              return (
                <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-center text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-700 dark:text-blue-300 font-mono bg-blue-50 dark:bg-blue-600/20 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-500/30">
                        Q{qs.questionNumber || idx + 1}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg font-bold border text-[11px] ${diffColor}`}>
                        {qs.difficultyRating || 'MODERATE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        Attempts: <strong className="text-slate-900 dark:text-white">{qs.totalAttempts}</strong>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        Correct: <strong className="text-emerald-600 dark:text-emerald-400">{qs.correctCount}</strong>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white bg-slate-200/80 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                        Accuracy: <strong className="text-emerald-600 dark:text-emerald-400 font-display ml-1">{qs.accuracyRate}%</strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 font-sinhala leading-relaxed">
                    <MathRenderer text={qs.questionText} />
                  </div>

                  {qs.imageUrl && (
                    <QuestionImageViewer
                      imageUrl={qs.imageUrl}
                      imageCaption={qs.imageCaption}
                      maxHeightClass="max-h-48"
                    />
                  )}

                  {qs.correctAnswer && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span>Correct Key: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{qs.correctAnswer}</strong></span>
                      {qs.marks && <span>Marks: <strong className="text-slate-900 dark:text-white">{qs.marks}</strong></span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Quiz Settings Modal */}
      <EditQuizSettingsModal
        isOpen={isEditSettingsModalOpen}
        quiz={quiz}
        onClose={() => setIsEditSettingsModalOpen(false)}
        onQuizUpdated={() => {
          if (quizId) {
            api.get(`/admin/quizzes/${quizId}/report`).then((res) => {
              setReport(res.data?.data || null);
            });
          }
        }}
      />
    </div>
  );
};
