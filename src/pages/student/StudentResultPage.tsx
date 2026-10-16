import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../../services/api.js';
import { QuizResult } from '../../types/index.js';
import { MathRenderer } from '../../components/MathRenderer.js';
import {
  Award,
  Trophy,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Clock,
  Sparkles,
  FileText,
  Download,
  UploadCloud,
  Check,
  AlertCircle,
  ExternalLink,
  Paperclip,
  Eye,
  EyeOff,
  Maximize2,
  X,
} from 'lucide-react';
import { QuestionImageViewer } from '../../components/QuestionImageViewer.js';
import { getQuestionImageUrl } from '../../utils/imageUrl.js';
import { formatSriLankanTime } from '../../utils/sriLankanTime.js';
import logoImg from '../../assets/logo.jpeg';

export const StudentResultPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [mcqCountdownSeconds, setMcqCountdownSeconds] = useState<number | null>(null);
  const [essayCountdownSeconds, setEssayCountdownSeconds] = useState<number | null>(null);
  const [isRefreshingRank, setIsRefreshingRank] = useState(false);

  // Dual Ranking View Tab: 'BOTH' | 'QUIZ' | 'FULL_PAPER'
  const [activeRankView, setActiveRankView] = useState<'BOTH' | 'QUIZ' | 'FULL_PAPER'>('BOTH');

  // Essay State
  const [essayInfo, setEssayInfo] = useState<any | null>(null);
  const [essayAnswerFile, setEssayAnswerFile] = useState<File | null>(null);
  const [uploadingEssay, setUploadingEssay] = useState(false);
  const [essayUploadSuccess, setEssayUploadSuccess] = useState<string | null>(null);
  const [essayUploadError, setEssayUploadError] = useState<string | null>(null);
  const [isViewingQuestionPaper, setIsViewingQuestionPaper] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [paperBlobUrl, setPaperBlobUrl] = useState<string | null>(null);
  const [loadingPaperBlob, setLoadingPaperBlob] = useState<boolean>(false);
  const [paperBlobError, setPaperBlobError] = useState<string | null>(null);
  const [showReuploadForm, setShowReuploadForm] = useState(false);
  // Real-time ticking time to automatically disable essay submission when deadline reached
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [loadError, setLoadError] = useState<string | null>(null);

  // Authoritative essay deadline timestamp
  const essayDeadlineTimestamp = useMemo(() => {
    if (essayInfo?.essayEndTime) {
      return new Date(essayInfo.essayEndTime).getTime();
    }
    const qQuiz = result?.quizId as any;
    if (qQuiz?.essayEndTime) {
      return new Date(qQuiz.essayEndTime).getTime();
    }
    if ((result as any)?.essayEndTime) {
      return new Date((result as any).essayEndTime).getTime();
    }
    const qEndTime = qQuiz?.endTime || (result as any)?.endTime;
    if (qEndTime) {
      const durMins = qQuiz?.essayDurationMinutes || (result as any)?.essayDurationMinutes || 120;
      return new Date(new Date(qEndTime).getTime() + durMins * 60 * 1000).getTime();
    }
    return null;
  }, [essayInfo?.essayEndTime, result]);

  // Submissions are closed when rankings are calculated
  const isSubmissionsClosed = Boolean(
    result?.isFullPaperRankingsCalculated ||
    essayInfo?.isRankingsCalculated
  );

  const isEssayDeadlinePassed = Boolean(
    (essayDeadlineTimestamp && currentTime >= essayDeadlineTimestamp) ||
    essayInfo?.isDeadlinePassed ||
    essayInfo?.isEnded ||
    isSubmissionsClosed
  );

  const fetchEssayInfo = (quizId: string) => {
    api
      .get(`/quizzes/${quizId}/essay-info`)
      .then((res) => {
        if (res.data?.success) {
          setEssayInfo(res.data.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    api
      .get(`/quizzes/results/${resultId}`)
      .then((res) => {
        const data = res.data.data;
        setResult(data);
        const qId = (data?.quizId as any)?._id || data?.quizId;
        if (qId) {
          fetchEssayInfo(qId);
        }
      })
      .catch((err: any) => {
        setLoadError(err.response?.data?.message || 'Failed to load examination results.');
      })
      .finally(() => setLoading(false));
  }, [resultId]);

  const fetchPaperBlob = async (qId: string) => {
    if (paperBlobUrl || loadingPaperBlob) return;
    setLoadingPaperBlob(true);
    setPaperBlobError(null);
    try {
      const res = await api.get(`/quizzes/${qId}/essay-paper`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPaperBlobUrl(url);
    } catch (err: any) {
      console.error('Failed to load essay paper blob:', err);
      setPaperBlobError(
        err.response?.data?.message ||
          'Unable to load question paper. Please use the Download button.'
      );
    } finally {
      setLoadingPaperBlob(false);
    }
  };

  useEffect(() => {
    const qId = (result?.quizId as any)?._id || result?.quizId;
    if ((isViewingQuestionPaper || isPaperModalOpen) && qId && !paperBlobUrl && !loadingPaperBlob) {
      fetchPaperBlob(qId);
    }
  }, [isViewingQuestionPaper, isPaperModalOpen, result]);

  useEffect(() => {
    return () => {
      if (paperBlobUrl) {
        URL.revokeObjectURL(paperBlobUrl);
      }
    };
  }, [paperBlobUrl]);

  const handleUploadAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayAnswerFile) return;

    if (isSubmissionsClosed || isEssayDeadlinePassed) {
      setEssayUploadError('The submission deadline for this essay paper has expired. Submissions are closed.');
      return;
    }

    const qId = (result?.quizId as any)?._id || result?.quizId;
    if (!qId) return;

    setUploadingEssay(true);
    setEssayUploadError(null);
    setEssayUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', essayAnswerFile);

    try {
      const res = await api.post(`/quizzes/${qId}/essay-submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEssayUploadSuccess(res.data?.message || 'Answer file uploaded successfully!');
      setEssayAnswerFile(null);
      setShowReuploadForm(false);
      fetchEssayInfo(qId);
      api.get(`/quizzes/results/${resultId}`).then((r) => setResult(r.data.data));
    } catch (err: any) {
      setEssayUploadError(err.response?.data?.message || 'Failed to upload answer file.');
    } finally {
      setUploadingEssay(false);
    }
  };

  // Initialize countdown seconds for MCQ (Quiz Rank) and Essay (Full Paper Rank)
  useEffect(() => {
    if (!result) return;

    if (result.rankPublished) {
      setMcqCountdownSeconds(0);
    } else {
      let initialMcq = 0;
      if (typeof result.mcqTimeRemainingSeconds === 'number' && result.mcqTimeRemainingSeconds > 0) {
        initialMcq = result.mcqTimeRemainingSeconds;
      } else if (result.mcqEndTime) {
        initialMcq = Math.max(0, Math.floor((new Date(result.mcqEndTime).getTime() - Date.now()) / 1000));
      } else if (result.endTime) {
        initialMcq = Math.max(0, Math.floor((new Date(result.endTime).getTime() - Date.now()) / 1000));
      }
      setMcqCountdownSeconds(initialMcq);
    }

    if (result.isQuizEnded) {
      setEssayCountdownSeconds(0);
    } else {
      let initialEssay = 0;
      if (typeof result.timeRemainingSeconds === 'number' && result.timeRemainingSeconds > 0) {
        initialEssay = result.timeRemainingSeconds;
      } else if (result.endTime) {
        initialEssay = Math.max(0, Math.floor((new Date(result.endTime).getTime() - Date.now()) / 1000));
      }
      setEssayCountdownSeconds(initialEssay);
    }
  }, [result]);

  // Live countdown intervals and auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());

      setMcqCountdownSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          triggerRankRefresh();
          return 0;
        }
        return prev - 1;
      });

      setEssayCountdownSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          triggerRankRefresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resultId]);

  const triggerRankRefresh = async () => {
    if (isRefreshingRank) return;
    setIsRefreshingRank(true);

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/quizzes/results/${resultId}`);
        if (res.data?.data) {
          setResult(res.data.data);
          if (res.data.data.rankPublished) {
            setIsRefreshingRank(false);
            clearInterval(interval);
          }
        }
      } catch (err) {
        // continue polling
      }

      if (attempts >= 6) {
        setIsRefreshingRank(false);
        clearInterval(interval);
      }
    }, 3000);
  };

  const formatCountdown = (secs: number | null) => {
    if (secs === null || secs <= 0) return '00m 00s';
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (d > 0) return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
    if (h > 0) return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Generating examination performance report...</span>
      </div>
    );
  }

  if (loadError || !result) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Examination Results Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {loadError || 'No recorded results found for this examination.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/student/dashboard"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const mins = Math.floor(result.timeTakenSeconds / 60);
  const secs = result.timeTakenSeconds % 60;

  // Format countdown numbers for MCQ Quiz Rank
  const cdSecs = mcqCountdownSeconds !== null && mcqCountdownSeconds > 0 ? mcqCountdownSeconds : 0;
  const cdDays = Math.floor(cdSecs / 86400);
  const cdHours = Math.floor((cdSecs % 86400) / 3600);
  const cdMins = Math.floor((cdSecs % 3600) / 60);
  const cdSeconds = cdSecs % 60;

  const countdownText = formatCountdown(mcqCountdownSeconds);
  const essayCountdownText = formatCountdown(essayCountdownSeconds);

  const quizNum = (result as any)?.quizNumber || (result.quizId as any)?.quizNumber || 1;
  const rawTitle = result.quizId?.title || 'Examination Result';
  const hasQuizPrefix = rawTitle.trim().toLowerCase().startsWith('quiz #') || rawTitle.trim().toLowerCase().startsWith('exam #');

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <Link
        to="/student/dashboard"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Main Score Hero Card */}
      <div className="dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-indigo-950/85 dark:to-slate-900/90 bg-white/95 rounded-3xl p-6 sm:p-8 border dark:border-slate-800 border-slate-200/90 shadow-xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-8 px-2 py-0.5 bg-white rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-center">
                <img src={logoImg} alt="ExamPortal" className="h-full w-auto object-contain max-h-6" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-500/20">
                Official Assessment Performance
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="px-3.5 py-1 rounded-xl text-xs sm:text-sm font-mono font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border border-blue-400/40 shadow-md shadow-blue-500/20 flex items-center gap-1.5 flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                Exam #{quizNum}
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sinhala">
                {(rawTitle || '').replace(/^((quiz|exam)\s*#?\d+\s*[-:]?\s*)+/i, '').trim()}
              </h1>
            </div>
          </div>
          <div className="w-full sm:w-auto sm:text-right bg-slate-50/90 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex sm:block items-center justify-between">
            <span className="text-3xl sm:text-5xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
              {result.percentage}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              {result.score} / {result.totalMarks} Marks
            </span>
          </div>
        </div>

        {/* Live Countdown Timer Banner for MCQ session if still ongoing */}
        {!result.rankPublished && (
          <div className="relative overflow-hidden p-5 sm:p-7 rounded-3xl dark:bg-gradient-to-br dark:from-indigo-950/95 dark:via-slate-900 dark:to-indigo-950/90 bg-blue-50/80 border-2 border-blue-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                  <Clock className="w-5 h-5 animate-pulse text-blue-600 dark:text-blue-400" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sinhala leading-snug">
                    MCQ Exam Session Active
                  </h3>
                  <p className="text-[11px] sm:text-xs text-blue-700 dark:text-blue-300/80">
                    Countdown to Official Quiz (MCQ) Rank Release
                  </p>
                </div>
              </div>

              {(result.mcqScheduledSriLankanEndTime || result.scheduledSriLankanEndTime) && (
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                  🗓️ MCQ End: {result.mcqScheduledSriLankanEndTime || result.scheduledSriLankanEndTime}
                </span>
              )}
            </div>

            {/* Countdown Digits Grid */}
            {cdSecs > 0 ? (
              <div className={`grid ${cdDays > 0 ? 'grid-cols-4 gap-1.5 sm:gap-4' : 'grid-cols-3 gap-2 sm:gap-4'} max-w-md mx-auto py-2`}>
                {cdDays > 0 && (
                  <div className="bg-white dark:bg-slate-950/90 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-2 sm:p-4 text-center shadow-inner">
                    <span className="text-xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono block">
                      {cdDays.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5 sm:mt-1">
                      Days
                    </span>
                  </div>
                )}
                <div className="bg-white dark:bg-slate-950/90 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-2 sm:p-4 text-center shadow-inner">
                  <span className="text-xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono block">
                    {cdHours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5 sm:mt-1">
                    Hours
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-950/90 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-2 sm:p-4 text-center shadow-inner">
                  <span className="text-xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono block">
                    {cdMins.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5 sm:mt-1">
                    Mins
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-950/90 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-2 sm:p-4 text-center shadow-inner">
                  <span className="text-xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono block animate-pulse">
                    {cdSeconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5 sm:mt-1">
                    Secs
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-500/50 flex items-center justify-center gap-3 text-center">
                <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs sm:text-sm font-bold text-blue-800 dark:text-blue-300 font-sinhala">
                  MCQ Session Ended. Computing official rankings...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Live Countdown Banner for Essay Section if quiz has essay and exam still active */}
        {(result.hasEssay || (result.quizId as any)?.hasEssay || essayInfo?.hasEssay) && !result.isFullPaperRankingsCalculated && !essayInfo?.hasSubmitted && !result.hasEssaySubmission && !isEssayDeadlinePassed && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-300 block font-sinhala">
                  Time remaining to submit Essay Section & qualify for Full Paper Rank:
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Full Paper Examination Deadline: <strong className="text-slate-900 dark:text-white font-mono">{essayCountdownText}</strong> remaining.
                </span>
              </div>
            </div>
            {result.scheduledSriLankanEndTime && (
              <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300 bg-white dark:bg-slate-950/80 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-500/30 shrink-0">
                🗓️ Essay Deadline: {result.scheduledSriLankanEndTime}
              </span>
            )}
          </div>
        )}

        {/* Dual Ranking Selector Tabs if Quiz has Essay */}
        {(result.hasEssay || (result.quizId as any)?.hasEssay || essayInfo?.hasEssay) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setActiveRankView('BOTH')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeRankView === 'BOTH'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🏆 Both Ranks
              </button>
              <button
                type="button"
                onClick={() => setActiveRankView('QUIZ')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeRankView === 'QUIZ'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1. Quiz Rank (MCQ)
              </button>
              <button
                type="button"
                onClick={() => setActiveRankView('FULL_PAPER')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeRankView === 'FULL_PAPER'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                2. Full Paper (MCQ+Essay)
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Two Distinct Official Assessment Rankings</span>
            </div>
          </div>
        )}

        {/* Dual Rankings Container */}
        <div className="space-y-6">
          {/* Rank 1: Quiz (MCQ) Card */}
          {(activeRankView === 'BOTH' || activeRankView === 'QUIZ') && (
            <div className="bg-slate-50/80 dark:bg-slate-950/80 border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Quiz Rank (MCQ Section)
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Official ranking based on MCQ score & completion time.
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl text-xs font-mono text-blue-700 dark:text-blue-300 font-bold self-start sm:self-auto">
                  MCQ Score: {result.score} / {result.totalMarks} ({result.percentage}%)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Quiz Island Rank</span>
                    {result.rankPublished && result.islandRank ? (
                      <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-display">
                        #{result.islandRank}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/30 font-mono">
                        ⏳ In: {countdownText}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Quiz Province Rank ({result.provinceName || 'Province'})</span>
                    {result.rankPublished && result.provinceRank ? (
                      <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-display">
                        #{result.provinceRank}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400/90 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-500/30 font-mono">
                        ⏳ In: {countdownText}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Quiz District Rank ({result.districtName || 'District'})</span>
                    {result.rankPublished && result.districtRank ? (
                      <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                        #{result.districtRank}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400/90 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 font-mono">
                        ⏳ In: {countdownText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rank 2: Full Paper (MCQ + Essay) Card */}
          {(result.hasEssay || (result.quizId as any)?.hasEssay || essayInfo?.hasEssay) &&
            (activeRankView === 'BOTH' || activeRankView === 'FULL_PAPER') && (
              <div className="bg-amber-50/50 dark:bg-slate-950/80 border border-amber-300 dark:border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl shadow-amber-500/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Full Paper Rank (Comprehensive Standing)
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Composite ranking combining MCQ Quiz score and Marking Panel evaluated Essay marks.
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const isNotAttendedFp = Boolean(
                      result.isFullPaperNotAttended ||
                      (result.isFullPaperRankingsCalculated && !result.fullPaperIslandRank && !essayInfo?.hasSubmitted && !result.hasEssaySubmission)
                    );

                    if (isNotAttendedFp) {
                      return (
                        <div className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs flex items-center gap-2 self-start sm:self-auto shadow-sm">
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">Full Paper Status:</span>
                          <strong className="text-rose-700 dark:text-rose-300 font-bold">Not Attended</strong>
                        </div>
                      );
                    }

                    return (
                      <div className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs flex items-center gap-2 self-start sm:self-auto shadow-sm">
                        <span className="text-slate-500 dark:text-slate-400">Combined:</span>
                        <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                          {result.fullPaperScore || result.score} / {result.fullPaperTotalMarks || (result.totalMarks + (result.essayTotalMarks || 100))}
                        </strong>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-display">({result.fullPaperPercentage || 0}%)</span>
                      </div>
                    );
                  })()}
                </div>

                {result.fullPaperIslandRank && result.fullPaperIslandRank > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="bg-white dark:bg-slate-900/80 border border-amber-300 dark:border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-amber-700 dark:text-amber-400/90 block font-bold">Full Paper Island Rank</span>
                          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                            #{result.fullPaperIslandRank}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-indigo-700 dark:text-indigo-300 block font-bold">Full Paper Province Rank</span>
                          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                            #{result.fullPaperProvinceRank}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-bold">Full Paper District Rank</span>
                          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                            #{result.fullPaperDistrictRank}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <span>Score Breakdown:</span>
                        <strong className="text-slate-900 dark:text-white">MCQ ({result.score}) + Essay ({result.essayMarks || 0})</strong>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Evaluated & Confirmed by Marking Panel</span>
                    </div>
                  </div>
                ) : (result.isFullPaperNotAttended || (result.isFullPaperRankingsCalculated && !essayInfo?.hasSubmitted && !result.hasEssaySubmission) || (essayInfo?.isEnded && !essayInfo?.hasSubmitted && !result.hasEssaySubmission)) ? (
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                            Full Paper Rank (Comprehensive Standing)
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 font-display">
                              Not Attended
                            </span>
                            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-lg border border-rose-200 dark:border-rose-800">
                              Essay Absent
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm sm:text-right">
                        <span>
                          You did not submit an essay paper for this examination, so a Full Paper Rank was not calculated. (Your MCQ Quiz Rank is recorded above).
                        </span>
                      </div>
                    </div>
                  </div>
                ) : essayInfo?.hasSubmitted || result.hasEssaySubmission ? (
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
                    <div className="space-y-0.5">
                      <strong className="block font-bold">Essay Answer Sheet Received (Grading in Progress)</strong>
                      <span className="text-slate-600 dark:text-slate-300">
                        Your essay submission is currently being evaluated by the Marking Panel. Your Full Paper Rank will appear here automatically once grading is completed.
                      </span>
                    </div>
                  </div>
                ) : isEssayDeadlinePassed ? (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <div className="space-y-0.5">
                      <strong className="block font-bold">Essay Submission Deadline Ended</strong>
                      <span className="text-slate-600 dark:text-slate-300">
                        The deadline has passed and answer submissions are now closed.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="space-y-0.5">
                      <strong className="block font-bold">Essay Answer Sheet Not Submitted Yet</strong>
                      <span className="text-slate-600 dark:text-slate-300">
                        To qualify for a Full Paper Rank, download the essay question paper below and upload your completed answer sheet before {result.scheduledSriLankanEndTime ? `(${result.scheduledSriLankanEndTime})` : ''}.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Full Paper Essay Question Paper & Answer Sheet Card */}
      {(result.hasEssay || (result.quizId as any)?.hasEssay || essayInfo?.hasEssay) && (
        <div className="bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-200 dark:border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                    Full Paper Essay Section
                  </h2>
                  <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-lg uppercase">
                    Paper #{quizNum}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Download question paper, solve questions, and submit your answer document before deadline.
                </p>
              </div>
            </div>

            {/* Question Paper Action Buttons (View & Download) */}
            {(essayInfo?.hasQuestionPaper || (result as any)?.hasQuestionPaper) && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsViewingQuestionPaper(!isViewingQuestionPaper)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md ${
                    isViewingQuestionPaper
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/25 ring-2 ring-amber-400/50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
                  }`}
                >
                  {isViewingQuestionPaper ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{isViewingQuestionPaper ? 'Hide Question Paper' : 'View Question Paper'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaperModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold transition-colors"
                  title="Open Fullscreen Viewer"
                >
                  <Maximize2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </button>

                <a
                  href={`${API_BASE_URL}/quizzes/${(result.quizId as any)?._id || result.quizId}/essay-paper?download=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold transition-colors"
                  title="Download PDF directly"
                >
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Download</span>
                </a>
              </div>
            )}
          </div>

          {/* Embedded Interactive PDF Viewer */}
          {isViewingQuestionPaper && (essayInfo?.hasQuestionPaper || (result as any)?.hasQuestionPaper) && (
            <div className="rounded-2xl border border-blue-500/30 bg-slate-50 dark:bg-slate-950 p-4 space-y-3 shadow-xl animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span
                    className="font-semibold text-slate-900 dark:text-white truncate block"
                    title={essayInfo?.questionPaperFilename || 'Essay Question Paper (PDF Document)'}
                  >
                    {essayInfo?.questionPaperFilename || 'Essay Question Paper (PDF Document)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPaperModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-500 font-semibold bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20 transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Fullscreen View
                  </button>
                  <a
                    href={`${API_BASE_URL}/quizzes/${(result.quizId as any)?._id || result.quizId}/essay-paper`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> New Tab
                  </a>
                  <a
                    href={`${API_BASE_URL}/quizzes/${(result.quizId as any)?._id || result.quizId}/essay-paper?download=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Download
                  </a>
                </div>
              </div>

              <div className="relative w-full h-[600px] sm:h-[750px] rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
                {loadingPaperBlob ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Loading question paper...</span>
                  </div>
                ) : paperBlobError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                    <p className="text-xs text-rose-500 max-w-sm">{paperBlobError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const qId = (result?.quizId as any)?._id || result?.quizId;
                        if (qId) fetchPaperBlob(qId);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                    >
                      Retry
                    </button>
                  </div>
                ) : paperBlobUrl ? (
                  <iframe
                    src={paperBlobUrl}
                    className="w-full h-full border-0 rounded-xl"
                    title="Essay Question Paper Viewer"
                  />
                ) : (
                  <iframe
                    src={`${API_BASE_URL}/quizzes/${(result?.quizId as any)?._id || result?.quizId}/essay-paper`}
                    className="w-full h-full border-0 rounded-xl"
                    title="Essay Question Paper Viewer"
                  />
                )}
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="min-w-0 flex-1">
                  💡 <strong>Tip:</strong> If the PDF does not display inside the frame in your browser or phone, click "Open in New Tab" or "Download".
                </span>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <a
                    href={`${API_BASE_URL}/quizzes/${(result.quizId as any)?._id || result.quizId}/essay-paper`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                  </a>
                  <a
                    href={`${API_BASE_URL}/quizzes/${(result.quizId as any)?._id || result.quizId}/essay-paper?download=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Timing details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Essay Max Marks</span>
              <strong className="text-slate-900 dark:text-white text-sm font-display block mt-1">
                {essayInfo?.essayTotalMarks || result.essayTotalMarks || 100} Marks
              </strong>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Essay Start Time</span>
              <strong className="text-slate-800 dark:text-slate-200 block mt-1 font-mono text-[11px]">
                {essayInfo?.essayStartTime ? formatSriLankanTime(new Date(essayInfo.essayStartTime)) : 'Scheduled after quiz'}
              </strong>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Submission Deadline</span>
              <div className="flex items-center gap-1.5 mt-1">
                <strong className={`${isEssayDeadlinePassed ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} block font-mono text-[11px]`}>
                  {essayInfo?.essayEndTime ? formatSriLankanTime(new Date(essayInfo.essayEndTime)) : 'N/A'}
                </strong>
                {isSubmissionsClosed ? (
                  <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded">
                    Closed (Rankings Published)
                  </span>
                ) : isEssayDeadlinePassed ? (
                  <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded">
                    Closed (Deadline Passed)
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Submission Status or Upload Box */}
          {essayInfo?.submission ? (
            <div className="p-5 bg-slate-50 dark:bg-slate-950/80 border border-emerald-500/30 rounded-2xl space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase shrink-0">
                      Submitted
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5 min-w-0 max-w-full">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md block" title={essayInfo.submission.fileName}>
                        {essayInfo.submission.fileName}
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Uploaded on: {formatSriLankanTime(new Date(essayInfo.submission.submittedAt))}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <a
                    href={`${API_BASE_URL}/quizzes/essay-submissions/${essayInfo.submission.id}/file?token=${encodeURIComponent(localStorage.getItem('accessToken') || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors w-fit shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download My File</span>
                  </a>

                  {!essayInfo.submission.isMarked && !isSubmissionsClosed && !isEssayDeadlinePassed && (
                    <button
                      type="button"
                      onClick={() => setShowReuploadForm(!showReuploadForm)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{showReuploadForm ? 'Cancel Replace' : 'Replace Answer File'}</span>
                    </button>
                  )}

                  {(isSubmissionsClosed || isEssayDeadlinePassed) && (
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700">
                      Submissions Closed
                    </span>
                  )}
                </div>
              </div>

              {/* Evaluation Status Banner */}
              {essayInfo.submission.isMarked ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Marked by Evaluation Panel
                    </span>
                    <strong className="text-base font-black text-emerald-700 dark:text-emerald-300 font-display">
                      {essayInfo.submission.marksAwarded} / {essayInfo.essayTotalMarks || 100} Marks
                    </strong>
                  </div>
                  {essayInfo.submission.feedback && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-emerald-200 dark:border-emerald-500/20">
                      Examiner Remarks: "{essayInfo.submission.feedback}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Your answer document is queued for grading by the Marking Panel. Marks and ranking will appear once confirmed.
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {/* If deadline expired / submissions closed and student never submitted */}
          {(isEssayDeadlinePassed || isSubmissionsClosed) && !essayInfo?.submission && (
            <div className="p-5 bg-rose-50/80 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 font-sinhala">
                    Submission Deadline Ended
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    The submission deadline has expired. Answer sheet submissions are now closed.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-300 dark:border-rose-800 shrink-0">
                Submissions Closed
              </span>
            </div>
          )}

          {/* Upload Form: ONLY visible when deadline has NOT passed AND submissions are NOT closed */}
          {!isEssayDeadlinePassed && !isSubmissionsClosed && (!essayInfo?.submission || showReuploadForm) && (
            <form onSubmit={handleUploadAnswer} className="p-5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Upload Answer Sheet File (PDF / Word Document / Image)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  System will automatically name and organize your submission using your student username.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors w-fit bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 cursor-pointer shrink-0"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{essayAnswerFile ? 'Change Selected File' : 'Select Answer File (PDF / Docs)'}</span>
                    <input
                      type="file"
                      disabled={isSubmissionsClosed || isEssayDeadlinePassed}
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={(e) => {
                        if (isSubmissionsClosed || isEssayDeadlinePassed) return;
                        if (e.target.files && e.target.files[0]) {
                          setEssayAnswerFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  {essayAnswerFile && (
                    <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 font-mono bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-full min-w-0">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="truncate min-w-0 flex-1 max-w-[180px] sm:max-w-xs" title={essayAnswerFile.name}>
                        {essayAnswerFile.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                        ({(essayAnswerFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {essayUploadError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>{essayUploadError}</span>
                </div>
              )}

              {essayUploadSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>{essayUploadSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!essayAnswerFile || uploadingEssay || isSubmissionsClosed || isEssayDeadlinePassed}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {uploadingEssay
                    ? 'Uploading...'
                    : 'Submit Essay Answer Sheet'}
                </span>
              </button>
            </form>
          )}

          {/* If Rankings Calculated and student never submitted */}
          {result.isFullPaperRankingsCalculated && !essayInfo?.submission && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>Full paper rankings have concluded for this examination.</span>
              <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-bold text-xs rounded-xl">
                Not Attended
              </span>
            </div>
          )}
        </div>
      )}

      {/* Answer Metrics Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/95 dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Correct</span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">{result.correctCount}</span>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500 dark:text-rose-400 flex-shrink-0" />
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Incorrect</span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">{result.incorrectCount}</span>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 dark:text-amber-400 flex-shrink-0" />
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Unanswered</span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">{result.unansweredCount}</span>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Time Taken</span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">
              {mins}m {secs}s
            </span>
          </div>
        </div>
      </div>

      {/* Topic-Wise Breakdown */}
      {result.topicBreakdown && result.topicBreakdown.length > 0 && (
        <div className="bg-white/95 dark:bg-slate-900/70 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">Curriculum Topic Performance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Detailed performance breakdown analyzed by syllabus topics</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {result.topicBreakdown.length} Topics Analyzed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {result.topicBreakdown.map((t, idx) => {
              const isMastered = t.percentage >= 75;
              const isModerate = t.percentage >= 45 && t.percentage < 75;
              return (
                <div key={idx} className="bg-slate-50/80 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-sinhala text-sm block">{t.topicName}</span>
                      <div className="pt-1 flex items-center gap-1.5">
                        {isMastered ? (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-md">
                            Mastered
                          </span>
                        ) : isModerate ? (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-md">
                            Moderate
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded-md">
                            Needs Focus
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-lg font-black font-display block ${
                          isMastered ? 'text-emerald-600 dark:text-emerald-400' : isModerate ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {t.percentage}%
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {t.correctCount} / {t.totalQuestions} Correct
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMastered
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : isModerate
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-600 to-pink-500'
                      }`}
                      style={{ width: `${Math.max(4, t.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question by Question Review */}
      <div className="bg-white/95 dark:bg-slate-900/70 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">Question Review & Explanations</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Question Review, Correct Answers & Explanations (Available for 7 days after exam completion)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold rounded-xl flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> 7-Day Review
            </span>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-mono font-black rounded-xl text-xs shadow-sm border border-blue-400/40">
              Exam #{quizNum}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {!result.questionReview || result.questionReview.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400/80 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">
                Results, Standings & Performance Breakdown Preserved
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                The 7-day post-exam detailed review window has completed. Your overall score, percentage, topic mastery breakdown, and official rankings remain permanently preserved.
              </p>
            </div>
          ) : (
            result.questionReview.map((qr, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  qr.isCorrect
                    ? 'bg-emerald-50/30 dark:bg-slate-950/60 border-emerald-500/30'
                    : 'bg-rose-50/30 dark:bg-slate-950/60 border-rose-500/30'
                }`}
              >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Question {idx + 1}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        qr.questionType === 'SHORT_ANSWER'
                          ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {qr.questionType === 'SHORT_ANSWER' ? '✍️ Short Answer' : '🔘 MCQ'}
                    </span>
                    {qr.topicName && (
                      <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/20 font-sinhala">
                        {qr.topicName}
                      </span>
                    )}
                    {qr.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                    {qr.marksAwarded !== undefined && (
                      <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 ml-auto sm:ml-0">
                        {qr.marksAwarded} Marks
                      </span>
                    )}
                  </div>

                  <div className="font-medium text-slate-900 dark:text-slate-100 font-sinhala leading-relaxed text-base pt-1">
                    <MathRenderer text={qr.questionText} />
                  </div>

                  {/* Question Diagram / Image */}
                  {qr.imageUrl && (
                    <QuestionImageViewer
                      imageUrl={qr.imageUrl}
                      imageCaption={qr.imageCaption}
                      altText={`Question ${idx + 1} Diagram`}
                      maxHeightClass="max-h-64"
                    />
                  )}

                  {/* MCQ Options List Review */}
                  {(!qr.questionType || qr.questionType === 'MCQ') && qr.options && qr.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {qr.options.map((opt: any) => {
                        const isStudentChoice = opt.key === qr.selectedOption;
                        const isCorrectChoice = opt.key === qr.correctAnswer;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                              isCorrectChoice
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/60 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/30'
                                : isStudentChoice && !qr.isCorrect
                                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/60 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500/30'
                                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isCorrectChoice
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : isStudentChoice && !qr.isCorrect
                                  ? 'bg-rose-500 text-white shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <div className="pt-0.5 leading-relaxed font-sinhala flex-1">
                              <MathRenderer text={opt.text} />
                              {opt.imageUrl && (
                                <div className="mt-1.5 max-w-xs">
                                  <img
                                    src={getQuestionImageUrl(opt.imageUrl)}
                                    alt={`Option ${opt.key}`}
                                    className="max-h-24 rounded-lg object-contain border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 p-1"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                            </div>
                            {isCorrectChoice && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 flex-shrink-0">
                                Correct Answer
                              </span>
                            )}
                            {isStudentChoice && !isCorrectChoice && (
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-500/20 flex-shrink-0">
                                Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* MCQ Answer Summary */}
                  {(!qr.questionType || qr.questionType === 'MCQ') && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2">
                      <p>
                        Your Answer:{' '}
                        <span
                          className={`font-bold ${
                            qr.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {qr.selectedOption || 'Not answered'}
                        </span>
                      </p>
                      <p>
                        Correct Answer:{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{qr.correctAnswer}</span>
                      </p>
                    </div>
                  )}

                  {/* Short Answer Review */}
                  {qr.questionType === 'SHORT_ANSWER' && (
                    <div className="pt-2 space-y-3">
                      {/* Student Submitted Answer */}
                      <div
                        className={`p-3.5 rounded-xl border ${
                          qr.isCorrect
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40'
                            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            ✍️ Your Submitted Answer:
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              qr.isCorrect
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {qr.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold font-sinhala text-slate-900 dark:text-white px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                          {qr.textAnswer ? (
                            qr.textAnswer
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">Not answered</span>
                          )}
                        </div>
                      </div>

                      {/* Official Model Answer & Acceptable Synonyms */}
                      <div className="p-3.5 rounded-xl border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 space-y-2">
                        <div>
                          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Official Model Answer:
                          </div>
                          <div className="text-sm font-bold font-sinhala text-emerald-950 dark:text-emerald-200 bg-white/80 dark:bg-slate-900/80 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                            {qr.correctAnswer}
                          </div>
                        </div>

                        {qr.acceptableAnswers && qr.acceptableAnswers.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                              Alternative acceptable answers / synonyms:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {qr.acceptableAnswers.map((ans, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="text-xs font-sinhala px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
                                >
                                  {ans}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Semantic Evaluation Feedback */}
                      {qr.evaluationFeedback && (
                        <div className="p-3 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-500/30 text-xs">
                          <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            AI Evaluation Breakdown:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 font-sinhala leading-relaxed">
                            {qr.evaluationFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {qr.explanation && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Explanation:</span>
                      <div className="font-sinhala leading-relaxed">
                        <MathRenderer text={qr.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

      {/* Fullscreen PDF Modal Viewer */}
      {isPaperModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-t-2xl border border-b-0 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Exam #{quizNum} - Essay Question Paper
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={essayInfo?.questionPaperFilename || 'PDF Document'}>
                  {essayInfo?.questionPaperFilename || 'PDF Document'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
              <a
                href={`${API_BASE_URL}/quizzes/${(result?.quizId as any)?._id || result?.quizId}/essay-paper`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
              <a
                href={`${API_BASE_URL}/quizzes/${(result?.quizId as any)?._id || result?.quizId}/essay-paper?download=true`}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                type="button"
                onClick={() => setIsPaperModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-b-2xl overflow-hidden relative">
            {loadingPaperBlob ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Loading question paper...</span>
              </div>
            ) : paperBlobError ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-xs text-rose-500 max-w-sm">{paperBlobError}</p>
                <button
                  type="button"
                  onClick={() => {
                    const qId = (result?.quizId as any)?._id || result?.quizId;
                    if (qId) fetchPaperBlob(qId);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  Retry
                </button>
              </div>
            ) : paperBlobUrl ? (
              <iframe
                src={paperBlobUrl}
                className="w-full h-full border-0"
                title="Essay Question Paper Fullscreen"
              />
            ) : (
              <iframe
                src={`${API_BASE_URL}/quizzes/${(result?.quizId as any)?._id || result?.quizId}/essay-paper`}
                className="w-full h-full border-0"
                title="Essay Question Paper Fullscreen"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
