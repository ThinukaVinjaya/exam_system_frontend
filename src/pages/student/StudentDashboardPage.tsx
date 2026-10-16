import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_BASE_URL } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Quiz } from '../../types/index.js';
import {
  Play,
  Clock,
  CheckCircle2,
  Award,
  Calendar,
  AlertCircle,
  Sparkles,
  BookOpen,
  Share2,
  Check,
  Trophy,
  Filter,
  ArrowRight,
  Phone,
  MessageCircle,
  FileText,
  Eye,
  Download,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  TrendingUp,
  BarChart3,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { formatSriLankanTime, formatSriLankanTimePeriod } from '../../utils/sriLankanTime.js';
import logoImg from '../../assets/logo.jpeg';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<{ live: Quiz[]; upcoming: Quiz[]; ended: Quiz[] }>({
    live: [],
    upcoming: [],
    ended: [],
  });
  const [studentCategory, setStudentCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Explorer & UX Controls for Handling Many (20+) Quizzes
  const [activeTab, setActiveTab] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED' | 'PAST'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>(() => {
    return (localStorage.getItem('student_dashboard_view_mode') as 'GRID' | 'LIST') || 'GRID';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'FULL_PAPER' | 'MCQ_ONLY' | 'ATTEMPTED' | 'NOT_ATTEMPTED'>('ALL');
  const [sortBy, setSortBy] = useState<'QUIZ_NUM_DESC' | 'QUIZ_NUM_ASC' | 'DATE_DESC' | 'SCORE_DESC'>('QUIZ_NUM_DESC');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(viewMode === 'GRID' ? 9 : 12);

  // In-tab Essay Question Paper Preview State
  const [previewPaperQuiz, setPreviewPaperQuiz] = useState<Quiz | null>(null);
  const [previewPaperBlobUrl, setPreviewPaperBlobUrl] = useState<string | null>(null);
  const [previewPaperLoading, setPreviewPaperLoading] = useState<boolean>(false);
  const [previewPaperError, setPreviewPaperError] = useState<string | null>(null);

  const handleOpenEssayPaperPreview = async (quiz: Quiz) => {
    setPreviewPaperQuiz(quiz);
    setPreviewPaperLoading(true);
    setPreviewPaperError(null);
    if (previewPaperBlobUrl) {
      URL.revokeObjectURL(previewPaperBlobUrl);
      setPreviewPaperBlobUrl(null);
    }

    try {
      const res = await api.get(`/quizzes/${quiz._id}/essay-paper`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setPreviewPaperBlobUrl(objectUrl);
    } catch (err: any) {
      console.error('Failed to load essay paper blob in current tab:', err);
      setPreviewPaperError(
        err.response?.data?.message ||
          'Failed to preview question paper in current tab. Please use the Download button to view the file.'
      );
    } finally {
      setPreviewPaperLoading(false);
    }
  };

  const handleCloseEssayPaperPreview = () => {
    if (previewPaperBlobUrl) {
      URL.revokeObjectURL(previewPaperBlobUrl);
    }
    setPreviewPaperBlobUrl(null);
    setPreviewPaperQuiz(null);
    setPreviewPaperLoading(false);
    setPreviewPaperError(null);
  };

  const handleCopyLink = (quizId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${quizId}`);
    setCopiedId(quizId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchQuizzes = () => {
    api
      .get('/quizzes')
      .then((res) => {
        setQuizzes(res.data.data);
        if (res.data?.data?.studentCategory) {
          setStudentCategory(res.data.data.studentCategory);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleStartQuiz = (quizId: string) => {
    navigate(`/student/quiz/${quizId}/take`);
  };

  const handleViewResult = (resultId: string) => {
    navigate(`/student/results/${resultId}`);
  };

  const handleToggleViewMode = (mode: 'GRID' | 'LIST') => {
    setViewMode(mode);
    setItemsPerPage(mode === 'GRID' ? 9 : 12);
    setCurrentPage(1);
    localStorage.setItem('student_dashboard_view_mode', mode);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('ALL');
    setSelectedType('ALL');
    setSortBy('QUIZ_NUM_DESC');
    setActiveTab('ALL');
    setCurrentPage(1);
  };

  // Collect unique completed quizzes
  const completedQuizzes = useMemo(() => {
    const list: Quiz[] = [];
    const seen = new Set<string>();
    [...quizzes.live, ...quizzes.upcoming, ...quizzes.ended].forEach((q) => {
      if ((q.hasAttempted || q.resultId || q.myScore !== undefined) && !seen.has(q._id)) {
        seen.add(q._id);
        list.push(q);
      }
    });
    return list;
  }, [quizzes]);

  // Combine all quizzes across buckets without duplicates
  const allQuizzesCombined = useMemo(() => {
    const map = new Map<string, { quiz: Quiz; category: 'LIVE' | 'UPCOMING' | 'ENDED' }>();
    quizzes.live.forEach((q) => map.set(q._id, { quiz: q, category: 'LIVE' }));
    quizzes.upcoming.forEach((q) => {
      if (!map.has(q._id)) map.set(q._id, { quiz: q, category: 'UPCOMING' });
    });
    quizzes.ended.forEach((q) => {
      if (!map.has(q._id)) map.set(q._id, { quiz: q, category: 'ENDED' });
    });
    return Array.from(map.values());
  }, [quizzes]);

  // Dynamically extract subjects for filtering
  const availableSubjects = useMemo(() => {
    const subMap = new Map<string, string>();
    allQuizzesCombined.forEach(({ quiz }) => {
      const s = quiz.subjectId as any;
      if (s && s._id) {
        subMap.set(s._id.toString(), s.nameEn || s.nameSi || 'Curriculum Subject');
      }
    });
    return Array.from(subMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allQuizzesCombined]);

  // Unattempted Live Quizzes that need immediate action
  const urgentLiveQuizzes = useMemo(() => {
    return quizzes.live.filter((q) => !q.hasAttempted);
  }, [quizzes.live]);

  // High-level KPI metrics
  const stats = useMemo(() => {
    const total = allQuizzesCombined.length;
    const live = quizzes.live.length;
    const upcoming = quizzes.upcoming.length;
    const completed = completedQuizzes.length;

    const avgScore =
      completed > 0
        ? Math.round(completedQuizzes.reduce((acc, q) => acc + (q.myPercentage || 0), 0) / completed)
        : null;

    let bestIslandRank: number | null = null;
    completedQuizzes.forEach((q) => {
      const r = q.myIslandRank || (q as any).islandRank;
      if (r && r > 0) {
        if (bestIslandRank === null || r < bestIslandRank) {
          bestIslandRank = r;
        }
      }
    });

    return { total, live, upcoming, completed, avgScore, bestIslandRank };
  }, [allQuizzesCombined, quizzes, completedQuizzes]);

  // Filter & Sort Logic
  const filteredQuizzes = useMemo(() => {
    return allQuizzesCombined
      .filter(({ quiz, category }) => {
        // Tab filter
        if (activeTab === 'LIVE' && category !== 'LIVE') return false;
        if (activeTab === 'UPCOMING' && category !== 'UPCOMING') return false;
        if (activeTab === 'PAST' && category !== 'ENDED') return false;
        if (activeTab === 'COMPLETED' && !quiz.hasAttempted && !quiz.resultId && quiz.myScore === undefined) return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const numStr = (quiz.quizNumber || '').toString();
          const rawTitle = (quiz.title || '').toLowerCase();
          const desc = (quiz.description || '').toLowerCase();
          const sub = quiz.subjectId as any;
          const subNameEn = (sub?.nameEn || '').toLowerCase();
          const subNameSi = (sub?.nameSi || '').toLowerCase();
          const cat = (quiz.targetCategory || '').toLowerCase();

          const matchNum =
            numStr.includes(q) ||
            `quiz #${numStr}`.includes(q) ||
            `quiz ${numStr}`.includes(q) ||
            `#${numStr}`.includes(q);
          const matchTitle = rawTitle.includes(q);
          const matchDesc = desc.includes(q);
          const matchSub = subNameEn.includes(q) || subNameSi.includes(q);
          const matchCat = cat.includes(q);

          if (!matchNum && !matchTitle && !matchDesc && !matchSub && !matchCat) {
            return false;
          }
        }

        // Subject filter
        if (selectedSubject !== 'ALL') {
          const sub = quiz.subjectId as any;
          const subId = typeof quiz.subjectId === 'string' ? quiz.subjectId : sub?._id?.toString();
          if (subId !== selectedSubject) return false;
        }

        // Type / Status filter
        if (selectedType === 'FULL_PAPER' && !quiz.hasEssay) return false;
        if (selectedType === 'MCQ_ONLY' && quiz.hasEssay) return false;
        if (selectedType === 'ATTEMPTED' && !quiz.hasAttempted) return false;
        if (selectedType === 'NOT_ATTEMPTED' && quiz.hasAttempted) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'QUIZ_NUM_DESC') {
          return (b.quiz.quizNumber || 0) - (a.quiz.quizNumber || 0);
        }
        if (sortBy === 'QUIZ_NUM_ASC') {
          return (a.quiz.quizNumber || 0) - (b.quiz.quizNumber || 0);
        }
        if (sortBy === 'DATE_DESC') {
          const timeA = new Date(a.quiz.firstStartTime || a.quiz.date || a.quiz.startTime).getTime();
          const timeB = new Date(b.quiz.firstStartTime || b.quiz.date || b.quiz.startTime).getTime();
          return timeB - timeA;
        }
        if (sortBy === 'SCORE_DESC') {
          const scoreA = a.quiz.myPercentage ?? -1;
          const scoreB = b.quiz.myPercentage ?? -1;
          return scoreB - scoreA;
        }
        return 0;
      });
  }, [allQuizzesCombined, activeTab, searchQuery, selectedSubject, selectedType, sortBy]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedSubject, selectedType, sortBy]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / (itemsPerPage === 9999 ? 1 : itemsPerPage)));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * (itemsPerPage === 9999 ? filteredQuizzes.length : itemsPerPage);
  const endIndex = itemsPerPage === 9999 ? filteredQuizzes.length : Math.min(startIndex + itemsPerPage, filteredQuizzes.length);
  const paginatedQuizzes = filteredQuizzes.slice(startIndex, endIndex);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedSubject !== 'ALL' || selectedType !== 'ALL' || activeTab !== 'ALL';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading available examinations...</span>
      </div>
    );
  }

  // Live ticking countdown badge component
  const LiveCountdownBadge: React.FC<{
    endTime?: string;
    initialSeconds?: number;
    onExpire?: () => void;
  }> = ({ endTime, initialSeconds, onExpire }) => {
    const [secondsLeft, setSecondsLeft] = useState<number>(() => {
      if (typeof initialSeconds === 'number' && initialSeconds > 0) return initialSeconds;
      if (endTime) return Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
      return 0;
    });

    useEffect(() => {
      if (typeof initialSeconds === 'number' && initialSeconds >= 0) {
        setSecondsLeft(initialSeconds);
      } else if (endTime) {
        setSecondsLeft(Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000)));
      }
    }, [initialSeconds, endTime]);

    useEffect(() => {
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (onExpire) {
              setTimeout(onExpire, 2000);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }, [onExpire]);

    if (secondsLeft <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 sm:px-2.5 py-1 rounded-xl animate-pulse">
          <Clock className="w-3 h-3 text-amber-400" /> Rank Calculating...
        </span>
      );
    }

    const days = Math.floor(secondsLeft / 86400);
    const hours = Math.floor((secondsLeft % 86400) / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    const timeStr =
      days > 0
        ? `${days}d ${hours}h ${minutes}m`
        : hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : `${minutes}m ${seconds}s`;

    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 sm:px-2.5 py-1 rounded-xl font-mono">
        <Clock className="w-3 h-3 text-amber-400 animate-pulse" /> Rank In: {timeStr}
      </span>
    );
  };

  // View Mode 1: Rich Visual Card (Grid)
  const renderQuizCard = (quiz: Quiz, category: 'LIVE' | 'UPCOMING' | 'ENDED') => {
    const subObj = quiz.subjectId as any;
    const subjectDisplay = subObj?.nameEn || subObj?.nameSi || 'Curriculum Assessment';
    const quizNum = quiz.quizNumber || 1;
    const rawTitle = quiz.title || 'Curriculum Examination';
    const cleanTitle = (rawTitle || '').replace(/^(quiz\s*#\d+\s*[-:]?\s*)+/i, '').trim();

    return (
      <div
        key={quiz._id}
        onClick={() => {
          if (quiz.hasAttempted && (quiz.resultId || quiz._id)) {
            handleViewResult(quiz.resultId || quiz._id);
          } else {
            handleStartQuiz(quiz._id);
          }
        }}
        className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border transition-all flex flex-col justify-between group shadow-xl cursor-pointer ${
          quiz.hasAttempted
            ? 'border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-emerald-500/10'
            : category === 'LIVE'
            ? 'border-emerald-500/40 hover:border-emerald-500/70 shadow-emerald-500/5'
            : category === 'UPCOMING'
            ? 'border-blue-500/30 hover:border-blue-500/50'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="space-y-3 sm:space-y-4">
          {/* Header Badges */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border border-blue-400/40 text-xs font-mono font-black rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 flex-shrink-0 tracking-tight">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                Exam #{quizNum}
              </span>
              <span className="px-2.5 py-1 bg-blue-500/15 text-blue-300 border border-blue-500/25 text-[11px] font-bold rounded-xl truncate max-w-[130px] sm:max-w-[180px]">
                {subjectDisplay}
              </span>
              {quiz.hasEssay && (
                <span
                  className="px-2.5 py-1 bg-violet-500/20 text-violet-300 border border-violet-500/35 text-[11px] font-bold rounded-xl flex items-center gap-1 flex-shrink-0 shadow-sm shadow-violet-500/10"
                  title="This assessment includes an Essay paper for Full Paper Rank"
                >
                  <FileText className="w-3 h-3 text-violet-300" /> Full Paper
                </span>
              )}
              {quiz.targetCategory && quiz.targetCategory !== 'ALL' ? (
                <span className="px-2.5 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-bold rounded-xl flex items-center gap-1 flex-shrink-0">
                  🎓 {quiz.targetCategory}
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold rounded-xl flex items-center gap-1 flex-shrink-0">
                  🌍 All Batches
                </span>
              )}
            </div>

            {quiz.hasAttempted ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {quiz.rankPublished && quiz.myIslandRank ? (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-black text-blue-300 bg-blue-500/20 border border-blue-500/40 px-2.5 py-1 rounded-xl shadow-sm font-mono"
                    title="MCQ Island Rank"
                  >
                    <Trophy className="w-3 h-3 text-blue-400" /> Rank #{quiz.myIslandRank}
                  </span>
                ) : null}
                {quiz.hasEssay && (quiz.isFullPaperRankingsCalculated || quiz.fullPaperRankPublished) ? (
                  (quiz as any).myFullPaperIslandRank ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-xl shadow-sm font-mono"
                      title="Full Paper Rank (MCQ + Essay)"
                    >
                      <Award className="w-3 h-3 text-amber-400" /> Full Paper #{(quiz as any).myFullPaperIslandRank}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-sm"
                      title="Full Paper (Essay Not Attended)"
                    >
                      <Award className="w-3 h-3 text-slate-500" /> Full Paper: Not Attended
                    </span>
                  )
                ) : null}
                {!quiz.myIslandRank && !(quiz as any).myFullPaperIslandRank && !((quiz as any).myFullPaperNotAttended) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed
                  </span>
                )}
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800 flex-shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {quiz.durationMinutes} mins
              </span>
            )}
          </div>

          <div>
            <h3 className="font-bold dark:text-white text-slate-900 text-base sm:text-lg leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {cleanTitle || rawTitle}
            </h3>
            {quiz.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-1.5">
                {quiz.description}
              </p>
            )}
          </div>

          {/* Attempted Performance Breakdown */}
          {(quiz.hasAttempted || quiz.resultId || quiz.myScore !== undefined) && (
            <div className="p-3 dark:bg-slate-950/80 bg-slate-50 rounded-2xl border dark:border-emerald-500/25 border-emerald-500/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>My Score:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  {quiz.myScore !== undefined ? quiz.myScore : 0} / {quiz.totalMarks || (quiz.questions?.length ? quiz.questions.length : 0)} ({quiz.myPercentage !== undefined ? quiz.myPercentage : 0}%)
                </strong>
              </div>
              {quiz.hasEssay && (
                <div className="flex items-center justify-between text-[11px] text-violet-700 dark:text-violet-300 pt-1.5 border-t dark:border-slate-800/80 border-slate-200 gap-2 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Full Paper (Essay):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEssayPaperPreview(quiz);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 dark:bg-violet-600/25 bg-violet-100 hover:bg-violet-200 dark:hover:bg-violet-600/40 text-violet-700 dark:text-violet-200 border dark:border-violet-500/35 border-violet-300 rounded-lg text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                      title="Preview Essay Question Paper in current tab"
                    >
                      <Eye className="w-3 h-3 text-violet-600 dark:text-violet-300" /> View Essay Paper
                    </button>
                  </div>
                </div>
              )}

              {quiz.rankPublished && quiz.myIslandRank ? (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px] pt-1 border-t dark:border-slate-800/60 border-slate-200">
                  <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                    <Trophy className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Exam Rank (MCQ):
                  </span>
                  <span className="text-blue-600 dark:text-blue-300 font-bold font-mono">Island Rank #{quiz.myIslandRank}</span>
                </div>
              ) : null}

              {quiz.hasEssay && (quiz.isFullPaperRankingsCalculated || quiz.fullPaperRankPublished) && (
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-300 text-[11px] pt-1 border-t dark:border-slate-800/60 border-slate-200">
                  <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <Award className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Full Paper Rank:
                  </span>
                  {(quiz as any).myFullPaperIslandRank ? (
                    <span className="text-amber-600 dark:text-amber-300 font-bold font-mono">
                      Island Rank #{(quiz as any).myFullPaperIslandRank}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      Not Attended
                    </span>
                  )}
                </div>
              )}

              {(!quiz.rankPublished || !quiz.myIslandRank) && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Exam Ranks Release In:</span>
                  <LiveCountdownBadge
                    endTime={quiz.mcqFinalEndTime || quiz.endTime}
                    initialSeconds={quiz.mcqTimeRemainingSeconds ?? quiz.timeRemainingSeconds}
                    onExpire={fetchQuizzes}
                  />
                </div>
              )}

              {quiz.hasEssay && !quiz.fullPaperRankPublished && !quiz.isFullPaperRankingsCalculated && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Full Paper Ranks Release In:</span>
                  <LiveCountdownBadge
                    endTime={quiz.finalEndTime || quiz.endTime}
                    initialSeconds={quiz.timeRemainingSeconds}
                    onExpire={fetchQuizzes}
                  />
                </div>
              )}
            </div>
          )}

          {category === 'UPCOMING' && (
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-blue-500/25 space-y-2 text-xs">
              {quiz.isBetweenWindows && quiz.nextWindow ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>⏸️ Session Paused</span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-0.5">
                    <span className="text-slate-400">Next Slot ({quiz.nextWindow.label || 'Next Slot'}):</span>
                    <strong className="text-white font-mono block">
                      {formatSriLankanTimePeriod(quiz.nextWindow.startTime, quiz.nextWindow.endTime)}
                    </strong>
                  </div>
                  <p className="text-[10px] text-amber-300/90">
                    You can participate in this exam once the next slot commences.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[11px] block font-semibold">🕒 Exam Window (SLST):</span>
                  <strong className="text-blue-300 font-mono text-xs block">
                    {formatSriLankanTimePeriod(quiz.startTime, quiz.endTime)}
                  </strong>
                </div>
              )}
              {quiz.scheduleWindows && quiz.scheduleWindows.length > 1 && (
                <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex flex-wrap gap-1">
                  <span className="text-blue-300 font-bold">Active Days:</span>
                  {quiz.scheduleWindows.map((w, idx) => (
                    <span key={idx} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                      {w.label || `Day ${idx + 1}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {category === 'LIVE' && !quiz.hasAttempted && (
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-emerald-500/25 text-xs space-y-1.5">
              <div className="flex flex-col gap-0.5 text-slate-300 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">
                    🕒{' '}
                    {quiz.hasEssay
                      ? 'Exam Window:'
                      : quiz.currentWindow?.label
                      ? `Live Slot (${quiz.currentWindow.label}):`
                      : 'Exam Window:'}
                  </span>
                  {quiz.scheduleWindows && quiz.scheduleWindows.length > 1 && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      {quiz.scheduleWindows.length} Days Exam
                    </span>
                  )}
                </div>
                <span className="text-emerald-400 font-mono font-bold text-[11px]">
                  {quiz.finalEndTime
                    ? formatSriLankanTimePeriod(quiz.firstStartTime || quiz.startTime, quiz.finalEndTime)
                    : quiz.currentWindow
                    ? formatSriLankanTimePeriod(quiz.currentWindow.startTime, quiz.currentWindow.endTime)
                    : formatSriLankanTimePeriod(quiz.startTime, quiz.endTime)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-800/80 pt-1">
                <span>Attempt Time:</span>
                <strong className="text-blue-300 font-bold">{quiz.durationMinutes} mins per student</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 sm:pt-5 border-t border-slate-800/80 mt-4 sm:mt-5 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total:{' '}
            <span className="font-bold dark:text-white text-slate-900">
              {quiz.totalMarks} {quiz.hasEssay ? `(+ ${quiz.essayTotalMarks || 0} Essay)` : ''} marks
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLink(quiz._id);
              }}
              className="p-2 sm:p-2.5 dark:bg-slate-800 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-slate-300 text-slate-700 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all border dark:border-slate-700/60 border-slate-200 flex-shrink-0 cursor-pointer shadow-sm"
              title="Copy share link to clipboard"
            >
              {copiedId === quiz._id ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            {(quiz.hasAttempted || quiz.resultId || quiz.myScore !== undefined) ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewResult(quiz.resultId || quiz._id);
                }}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-white font-bold rounded-xl text-xs shadow-lg transition-all hover:scale-105 active:scale-95 ${
                  quiz.rankPublished
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20'
                }`}
              >
                {quiz.rankPublished ? (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    <span>Results & Ranks</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                    <span>My Score</span>
                  </>
                )}
              </button>
            ) : quiz.hasActiveAttempt ? (
              <button
                type="button"
                onClick={() => handleStartQuiz(quiz._id)}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Continue Exam
              </button>
            ) : category === 'UPCOMING' ? (
              <button
                type="button"
                onClick={() => handleStartQuiz(quiz._id)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 dark:bg-blue-600/20 bg-blue-100 hover:bg-blue-200 dark:hover:bg-blue-600/30 dark:text-blue-300 text-blue-700 font-bold rounded-xl text-xs border dark:border-blue-500/30 border-blue-200 transition-all cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> View Details
              </button>
            ) : category === 'LIVE' ? (
              <button
                type="button"
                onClick={() => handleStartQuiz(quiz._id)}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Exam
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStartQuiz(quiz._id)}
                className="px-3 sm:px-4 py-2 dark:bg-slate-800 bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                Practice Exam
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // View Mode 2: Compact List Row (Ultra High-Density for 20+ Quizzes)
  const renderQuizListItem = (item: { quiz: Quiz; category: 'LIVE' | 'UPCOMING' | 'ENDED' }) => {
    const { quiz, category } = item;
    const subObj = quiz.subjectId as any;
    const subjectDisplay = subObj?.nameEn || subObj?.nameSi || 'Curriculum Assessment';
    const quizNum = quiz.quizNumber || 1;
    const rawTitle = quiz.title || 'Curriculum Examination';
    const cleanTitle = (rawTitle || '').replace(/^(quiz\s*#\d+\s*[-:]?\s*)+/i, '').trim();

    return (
      <div
        key={quiz._id}
        onClick={() => {
          if (quiz.hasAttempted && (quiz.resultId || quiz._id)) {
            handleViewResult(quiz.resultId || quiz._id);
          } else {
            handleStartQuiz(quiz._id);
          }
        }}
        className={`group p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 backdrop-blur-xl cursor-pointer ${
          quiz.hasAttempted
            ? 'bg-slate-900/80 border-emerald-500/25 hover:border-emerald-500/50 hover:bg-slate-900 shadow-lg hover:shadow-emerald-500/10'
            : category === 'LIVE'
            ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-500/5'
            : category === 'UPCOMING'
            ? 'bg-slate-900/70 border-blue-500/25 hover:border-blue-500/40'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Left: Identifier, Badges, Title & Meta */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-mono font-black text-xs sm:text-sm flex flex-col items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/25 border border-blue-400/40">
            <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-blue-200">Exam</span>
            <span>#{quizNum}</span>
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/25 text-[11px] font-bold rounded-lg truncate max-w-[140px] sm:max-w-[200px]">
                {subjectDisplay}
              </span>
              {quiz.hasEssay && (
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/35 text-[10px] font-bold rounded-lg flex items-center gap-1 flex-shrink-0">
                  <FileText className="w-3 h-3 text-violet-300" /> Full Paper
                </span>
              )}
              {quiz.targetCategory && quiz.targetCategory !== 'ALL' ? (
                <span className="px-2 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded-lg">
                  🎓 {quiz.targetCategory}
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/60 text-[10px] font-medium rounded-lg">
                  🌍 All Batches
                </span>
              )}
              {category === 'LIVE' && !quiz.hasAttempted && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold rounded-lg flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> LIVE NOW
                </span>
              )}
            </div>

            <h3 className="font-bold dark:text-white text-slate-900 text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors font-sinhala leading-snug line-clamp-1">
              {cleanTitle || rawTitle}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {quiz.durationMinutes} mins
              </span>
              <span>•</span>
              <span>
                Total Marks: <strong className="dark:text-slate-200 text-slate-800">{quiz.totalMarks} {quiz.hasEssay ? `(+ ${quiz.essayTotalMarks || 0} Essay)` : ''}</strong>
              </span>
              {quiz.hasEssay && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEssayPaperPreview(quiz);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-200 font-semibold hover:underline cursor-pointer"
                    title="Preview Essay Question Paper in current tab"
                  >
                    <Eye className="w-3 h-3 text-violet-600 dark:text-violet-400" /> Essay PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Performance / Standings / Schedule */}
        <div className="flex items-center gap-2 flex-wrap lg:justify-end">
          {(quiz.hasAttempted || quiz.resultId || quiz.myScore !== undefined) ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 dark:bg-slate-950/80 bg-slate-100 rounded-xl border dark:border-emerald-500/30 border-emerald-500/40 text-xs">
                <span className="text-slate-600 dark:text-slate-400">Score: </span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
                  {quiz.myScore !== undefined ? quiz.myScore : 0} / {quiz.totalMarks || (quiz.questions?.length ? quiz.questions.length : 0)} ({quiz.myPercentage !== undefined ? quiz.myPercentage : 0}%)
                </strong>
              </div>

              {quiz.rankPublished && quiz.myIslandRank ? (
                <span className="px-2.5 py-1.5 bg-blue-500/15 border border-blue-500/35 text-blue-600 dark:text-blue-300 font-bold rounded-xl text-xs flex items-center gap-1 font-mono">
                  <Trophy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Rank #{quiz.myIslandRank}
                </span>
              ) : null}

              {quiz.hasEssay && (quiz.isFullPaperRankingsCalculated || quiz.fullPaperRankPublished) ? (
                (quiz as any).myFullPaperIslandRank ? (
                  <span className="px-2.5 py-1.5 bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1 font-mono">
                    <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Full Paper #{(quiz as any).myFullPaperIslandRank}
                  </span>
                ) : (
                  <span className="px-2.5 py-1.5 bg-rose-500/15 border border-rose-500/35 text-rose-600 dark:text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Full Paper: Not Attended
                  </span>
                )
              ) : null}

              {(!quiz.rankPublished || !quiz.myIslandRank) && (
                <LiveCountdownBadge
                  endTime={quiz.mcqFinalEndTime || quiz.endTime}
                  initialSeconds={quiz.mcqTimeRemainingSeconds ?? quiz.timeRemainingSeconds}
                  onExpire={fetchQuizzes}
                />
              )}
            </div>
          ) : category === 'UPCOMING' ? (
            <div className="text-xs text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Scheduled:</span>
              <span className="font-mono text-blue-300 text-xs font-bold">
                {formatSriLankanTimePeriod(quiz.startTime, quiz.endTime)}
              </span>
            </div>
          ) : category === 'LIVE' ? (
            <div className="text-xs text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/25">
              <span className="text-slate-400 text-[10px] block">Live Window:</span>
              <span className="font-mono text-emerald-400 font-bold text-xs">
                {formatSriLankanTimePeriod(quiz.firstStartTime || quiz.startTime, quiz.finalEndTime || quiz.endTime)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800">
              Archived Practice Exam
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 dark:border-slate-800/80 border-slate-200 justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink(quiz._id);
            }}
            className="p-2 sm:p-2.5 dark:bg-slate-800 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-slate-300 text-slate-700 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all border dark:border-slate-700/60 border-slate-200 cursor-pointer shadow-sm"
            title="Copy examination link"
          >
            {copiedId === quiz._id ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          {(quiz.hasAttempted || quiz.resultId || quiz.myScore !== undefined) ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleViewResult(quiz.resultId || quiz._id);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-white font-bold rounded-xl text-xs shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer ${
                quiz.rankPublished
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 shadow-blue-500/20'
              }`}
            >
              {quiz.rankPublished ? (
                <>
                  <Award className="w-3.5 h-3.5" />
                  <span>Results & Ranks</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                  <span>My Score</span>
                </>
              )}
            </button>
          ) : quiz.hasActiveAttempt ? (
            <button
              type="button"
              onClick={() => handleStartQuiz(quiz._id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 whitespace-nowrap cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Continue Exam
            </button>
          ) : category === 'UPCOMING' ? (
            <button
              type="button"
              onClick={() => handleStartQuiz(quiz._id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 dark:bg-blue-600/20 bg-blue-100 hover:bg-blue-200 dark:hover:bg-blue-600/30 dark:text-blue-300 text-blue-700 font-bold rounded-xl text-xs border dark:border-blue-500/30 border-blue-200 transition-all whitespace-nowrap cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> View Details
            </button>
          ) : category === 'LIVE' ? (
            <button
              type="button"
              onClick={() => handleStartQuiz(quiz._id)}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 whitespace-nowrap cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start Exam
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStartQuiz(quiz._id)}
              className="px-4 py-2 dark:bg-slate-800 bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all whitespace-nowrap shadow-md cursor-pointer"
            >
              Practice Exam
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans pb-12">
      {/* 1. Welcome Hero Banner with Brand & Status */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl dark:bg-gradient-to-r dark:from-slate-900/90 dark:via-indigo-950/85 dark:to-slate-900/90 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 p-5 sm:p-7 md:p-8 border dark:border-slate-800 border-blue-200/80 shadow-xl shadow-slate-900/5 dark:shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-60 h-60 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-300">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                ExamPortal
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                🎓 {studentCategory || user?.alYear || 'General'} Batch
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900 font-display tracking-tight">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="dark:text-slate-300 text-slate-600 text-xs sm:text-sm leading-relaxed">
              Prepare for your online examinations and continuous assessments. Monitor your Island Rank, Provincial standing, and District performance in real time.
            </p>
          </div>

          {/* Candidate Status Card */}
          <div className="flex items-center gap-3.5 dark:bg-slate-950/70 bg-white/90 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border dark:border-slate-800/80 border-slate-200/90 shadow-lg shadow-slate-900/5 dark:shadow-xl backdrop-blur-md flex-shrink-0 self-stretch md:self-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 block">
                Candidate Account
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold dark:text-white text-slate-900 font-display">
                Active Student
              </h3>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                {user?.institute || 'General Candidate'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive KPI Overview Cards (Clickable Quick Filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => {
            setActiveTab('ALL');
            setSelectedType('ALL');
          }}
          className={`p-4 rounded-2xl sm:rounded-3xl border text-left transition-all backdrop-blur-md cursor-pointer ${
            activeTab === 'ALL' && selectedType === 'ALL'
              ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-400 dark:border-blue-500/60 shadow-lg shadow-blue-500/10'
              : 'dark:bg-slate-900/60 bg-white/95 dark:border-slate-800 border-slate-200/90 dark:hover:border-slate-700 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Exams</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black dark:text-white text-slate-900 font-display">{stats.total}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Available for your cohort</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('LIVE');
          }}
          className={`p-4 rounded-2xl sm:rounded-3xl border text-left transition-all backdrop-blur-md cursor-pointer ${
            activeTab === 'LIVE'
              ? 'bg-emerald-50 dark:bg-emerald-600/15 border-emerald-400 dark:border-emerald-500/60 shadow-lg shadow-emerald-500/10'
              : 'dark:bg-slate-900/60 bg-white/95 dark:border-slate-800 border-slate-200/90 dark:hover:border-slate-700 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Now
            </span>
            <Play className="w-4 h-4 text-emerald-500 fill-current" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">{stats.live}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active exam session(s)</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('COMPLETED');
          }}
          className={`p-4 rounded-2xl sm:rounded-3xl border text-left transition-all backdrop-blur-md cursor-pointer ${
            activeTab === 'COMPLETED'
              ? 'bg-amber-50 dark:bg-amber-600/15 border-amber-400 dark:border-amber-500/60 shadow-lg shadow-amber-500/10'
              : 'dark:bg-slate-900/60 bg-white/95 dark:border-slate-800 border-slate-200/90 dark:hover:border-slate-700 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">My Completed</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-300 font-display">
            {stats.completed}
            {stats.avgScore !== null && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-1.5 font-sans">({stats.avgScore}% avg)</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {stats.bestIslandRank ? `Best Island Rank: #${stats.bestIslandRank}` : 'Rankings recorded'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('UPCOMING');
          }}
          className={`p-4 rounded-2xl sm:rounded-3xl border text-left transition-all backdrop-blur-md cursor-pointer ${
            activeTab === 'UPCOMING'
              ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-400 dark:border-blue-500/60 shadow-lg shadow-blue-500/10'
              : 'dark:bg-slate-900/60 bg-white/95 dark:border-slate-800 border-slate-200/90 dark:hover:border-slate-700 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Upcoming</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-300 font-display">{stats.upcoming}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Scheduled examinations</div>
        </button>
      </div>

      {/* 3. Action Alert for Live Unattempted Exams */}
      {urgentLiveQuizzes.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl dark:bg-gradient-to-r dark:from-emerald-950/80 dark:via-slate-900/90 dark:to-teal-950/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live Examination Active</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold dark:text-white text-slate-900">
                You have {urgentLiveQuizzes.length} live {urgentLiveQuizzes.length === 1 ? 'examination' : 'examinations'} active right now: {urgentLiveQuizzes.map((q) => `Exam #${q.quizNumber}`).join(', ')}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleStartQuiz(urgentLiveQuizzes[0]._id)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 flex-shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> Start Live Exam (Exam #{urgentLiveQuizzes[0].quizNumber})
          </button>
        </div>
      )}

      {/* 4. Explorer Toolbar: Search, Filters, Sorters & View Switcher */}
      <div className="dark:bg-slate-900/80 bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border dark:border-slate-800 border-slate-200/90 shadow-xl shadow-slate-900/5 dark:shadow-xl space-y-4">
        {/* Top Controls: Search Bar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Exam #, Title, Subject, or Topic (e.g. 'Exam 5', 'Physics')..."
              className="w-full pl-10 pr-9 py-2.5 dark:bg-slate-950/90 bg-slate-50 border dark:border-slate-700/80 border-slate-200 focus:border-blue-500 rounded-2xl text-xs sm:text-sm dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Grid vs Compact List */}
          <div className="flex items-center gap-1.5 dark:bg-slate-950 bg-slate-100 p-1 rounded-2xl border dark:border-slate-800 border-slate-200 flex-shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleToggleViewMode('GRID')}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('LIST')}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Compact List View (Recommended for many exams)"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List Table</span>
            </button>
          </div>
        </div>

        {/* Tab Strip with Counter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b dark:border-slate-800 border-slate-200 scrollbar-none text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Exams</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              activeTab === 'ALL' ? 'bg-white/20 text-white' : 'dark:bg-slate-800 bg-slate-200 dark:text-slate-300 text-slate-700'
            }`}>{stats.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LIVE')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LIVE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Live Exams</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              activeTab === 'LIVE' ? 'bg-white/20 text-white' : 'dark:bg-emerald-400/25 bg-emerald-100 dark:text-emerald-300 text-emerald-800'
            }`}>
              {stats.live}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'COMPLETED'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>My Rankings</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              activeTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'dark:bg-amber-400/25 bg-amber-100 dark:text-amber-300 text-amber-800'
            }`}>
              {stats.completed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'UPCOMING'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-purple-400" />
            <span>Upcoming</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              activeTab === 'UPCOMING' ? 'bg-white/20 text-white' : 'dark:bg-purple-400/25 bg-purple-100 dark:text-purple-300 text-purple-800'
            }`}>
              {stats.upcoming}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PAST')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PAST'
                ? 'dark:bg-slate-800 bg-slate-900 text-white shadow-md font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Past Archive</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              activeTab === 'PAST' ? 'bg-white/20 text-white' : 'dark:bg-slate-800 bg-slate-200 dark:text-slate-300 text-slate-700'
            }`}>
              {quizzes.ended.length}
            </span>
          </button>
        </div>

        {/* Bottom Filter Controls: Subject, Paper Type, Sort Order */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Subject Selector */}
            {availableSubjects.length > 0 && (
              <div className="flex items-center gap-1.5 dark:bg-slate-950 bg-slate-100 px-2.5 py-1.5 rounded-xl border dark:border-slate-800 border-slate-200">
                <span className="text-slate-500 dark:text-slate-400">Subject:</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-transparent dark:text-slate-200 text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Subjects</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Assessment Type / Status Selector */}
            <div className="flex items-center gap-1.5 dark:bg-slate-950 bg-slate-100 px-2.5 py-1.5 rounded-xl border dark:border-slate-800 border-slate-200">
              <span className="text-slate-500 dark:text-slate-400">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="bg-transparent dark:text-slate-200 text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Types</option>
                <option value="FULL_PAPER" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Full Paper (MCQ + Essay)</option>
                <option value="MCQ_ONLY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">MCQ Only</option>
                <option value="ATTEMPTED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">My Completed</option>
                <option value="NOT_ATTEMPTED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Not Attempted</option>
              </select>
            </div>

            {/* Sort Order Selector */}
            <div className="flex items-center gap-1.5 dark:bg-slate-950 bg-slate-100 px-2.5 py-1.5 rounded-xl border dark:border-slate-800 border-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent dark:text-slate-200 text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="QUIZ_NUM_DESC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Exam # (Newest First)</option>
                <option value="QUIZ_NUM_ASC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Exam # (Oldest First)</option>
                <option value="DATE_DESC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Exam Date (Latest)</option>
                <option value="SCORE_DESC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">My Score (High to Low)</option>
              </select>
            </div>

            {/* Active Filters Reset */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 rounded-xl transition-all font-bold cursor-pointer"
                title="Reset all search queries and filters"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Result Count and Page Summary */}
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing <strong className="dark:text-white text-slate-900">{filteredQuizzes.length === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of{' '}
            <strong className="dark:text-white text-slate-900">{filteredQuizzes.length}</strong> examinations
          </div>
        </div>
      </div>

      {/* 5. Main Quizzes Content: Rendered as either Grid or Compact List */}
      <section className="space-y-4">
        {filteredQuizzes.length === 0 ? (
          <div className="bg-slate-900/60 rounded-3xl p-10 sm:p-14 text-center text-slate-400 border border-slate-800 space-y-3">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-slate-200 font-display">No examinations found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No examinations match your search for "${searchQuery}". Try adjusting your keywords or clearing active filters.`
                : 'There are currently no examinations under the selected tab or criteria.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all inline-flex items-center gap-1.5 mt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
              </button>
            )}
          </div>
        ) : viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {paginatedQuizzes.map(({ quiz, category }) => renderQuizCard(quiz, category))}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedQuizzes.map((item) => renderQuizListItem(item))}
          </div>
        )}

        {/* 6. Smart Pagination Controls */}
        {filteredQuizzes.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t dark:border-slate-800/80 border-slate-200">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Show per page:</span>
              {[viewMode === 'GRID' ? 6 : 10, viewMode === 'GRID' ? 9 : 15, viewMode === 'GRID' ? 18 : 30, 9999].map(
                (size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      itemsPerPage === size
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
                    }`}
                  >
                    {size === 9999 ? 'All' : size}
                  </button>
                )
              )}
            </div>

            {/* Page Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 2)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-400 dark:text-slate-600 font-mono text-xs">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                          validCurrentPage === p
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}

                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 7. Platform Information & Support */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl dark:bg-gradient-to-r dark:from-blue-950/70 dark:via-slate-900/90 dark:to-indigo-950/70 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-blue-50 p-4 sm:p-5 border dark:border-blue-500/30 border-blue-300/80 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 border border-blue-400/40">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider dark:bg-blue-500/20 bg-blue-100 text-blue-700 dark:text-blue-300 border dark:border-blue-500/30 border-blue-300">
                Examination Guidelines
              </span>
              <span className="text-xs dark:text-slate-300 text-slate-600 font-semibold">• Online Assessment System</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold dark:text-white text-slate-900 mt-0.5">
              Need assistance with your scheduled tests or account access?
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <span>My Profile</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/analytics')}
            className="px-3.5 py-2.5 dark:bg-slate-800 bg-white hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200 text-slate-700 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold border dark:border-slate-700 border-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        </div>
      </div>

      {/* In-Tab Essay Question Paper Preview Modal */}
      {previewPaperQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/90">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-violet-500/15 border border-violet-500/30 rounded-xl text-violet-600 dark:text-violet-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base font-display truncate">
                      Exam #{previewPaperQuiz.quizNumber || 1} - Essay Question Paper
                    </span>
                    <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-[10px] font-bold rounded-lg border border-violet-300 dark:border-violet-500/30 shrink-0">
                      In-Tab Preview
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md" title={previewPaperQuiz.title}>
                    {previewPaperQuiz.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                <a
                  href={`${API_BASE_URL}/quizzes/${previewPaperQuiz._id}/essay-paper`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  title="Open PDF in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </a>
                <a
                  href={`${API_BASE_URL}/quizzes/${previewPaperQuiz._id}/essay-paper?download=true`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  title="Download PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  type="button"
                  onClick={handleCloseEssayPaperPreview}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 flex flex-col overflow-hidden relative">
              {previewPaperLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                  <div className="w-9 h-9 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold">
                    Loading PDF document in tab...
                  </p>
                </div>
              ) : previewPaperError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Unable to load question paper preview
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {previewPaperError}
                  </p>
                  <div className="flex items-center gap-2.5 pt-2 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEssayPaperPreview(previewPaperQuiz)}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                    <a
                      href={`${API_BASE_URL}/quizzes/${previewPaperQuiz._id}/essay-paper`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in New Tab</span>
                    </a>
                    <a
                      href={`${API_BASE_URL}/quizzes/${previewPaperQuiz._id}/essay-paper?download=true`}
                      download
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  </div>
                </div>
              ) : previewPaperBlobUrl ? (
                <iframe
                  src={previewPaperBlobUrl}
                  className="w-full h-full border-0 rounded-2xl bg-white shadow-inner"
                  title="In-Tab Essay Question Paper Preview"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
