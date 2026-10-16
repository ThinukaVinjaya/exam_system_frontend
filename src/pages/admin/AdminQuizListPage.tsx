import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../../services/api.js';
import { Quiz } from '../../types/index.js';
import {
  FileText,
  Play,
  RefreshCw,
  BarChart2,
  Download,
  PlusCircle,
  AlertCircle,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  X,
  Sparkles,
  Calendar,
  Clock,
  Trash2,
  Search,
  GraduationCap,
  Users,
  Pencil,
  Hash,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  formatSriLankanTime,
  formatSriLankanTimePeriod,
  toSriLankanInputString,
  fromSriLankanInputString,
} from '../../utils/sriLankanTime.js';
import { MultiDaySchedulePicker, IScheduleSlot } from '../../components/MultiDaySchedulePicker.js';
import { EditQuizSettingsModal } from '../../components/EditQuizSettingsModal.js';

const cleanQuizTitle = (title: string) => {
  return (title || '').replace(/^(quiz\s*#\d+\s*[-:]?\s*)+/i, '').trim() || title;
};

export const AdminQuizListPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingQuiz, setSharingQuiz] = useState<Quiz | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'DRAFT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & Sorting Controls for Handling Large Numbers of Quizzes
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10); // 10, 25, 50, -1 for All
  const [sortBy, setSortBy] = useState<'NUM_DESC' | 'NUM_ASC' | 'DATE_DESC' | 'TITLE_ASC'>('NUM_DESC');
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const availableSubjects = Array.from(
    new Set(
      quizzes
        .map((q) => (q.subjectId as any)?.nameSi || (q.subjectId as any)?.nameEn)
        .filter(Boolean)
    )
  );

  const availableCategories = Array.from(
    new Set(
      quizzes
        .map((q) => q.targetCategory || 'ALL')
        .filter(Boolean)
    )
  );

  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedStatusFilter !== 'ALL') {
      if (q.status !== selectedStatusFilter) return false;
    }
    if (selectedSubjectFilter !== 'ALL') {
      const subName = (q.subjectId as any)?.nameSi || (q.subjectId as any)?.nameEn;
      if (subName !== selectedSubjectFilter) return false;
    }
    if (selectedCategoryFilter !== 'ALL') {
      const cat = q.targetCategory || 'ALL';
      if (cat !== selectedCategoryFilter) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const qNumStr = String(q.quizNumber || '');
      const titleStr = (q.title || '').toLowerCase();
      const subStr = (((q.subjectId as any)?.nameSi || '') + ' ' + ((q.subjectId as any)?.nameEn || '')).toLowerCase();
      const matchesNum =
        qNumStr === query ||
        `#${qNumStr}` === query ||
        `exam #${qNumStr}` === query ||
        `quiz #${qNumStr}` === query ||
        `quiz ${qNumStr}` === query;
      const matchesText = titleStr.includes(query) || subStr.includes(query);
      return matchesNum || matchesText;
    }
    return true;
  });

  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    if (sortBy === 'NUM_DESC') {
      return (b.quizNumber || 0) - (a.quizNumber || 0);
    }
    if (sortBy === 'NUM_ASC') {
      return (a.quizNumber || 0) - (b.quizNumber || 0);
    }
    if (sortBy === 'DATE_DESC') {
      return new Date(b.startTime || b.createdAt || 0).getTime() - new Date(a.startTime || a.createdAt || 0).getTime();
    }
    if (sortBy === 'TITLE_ASC') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return 0;
  });

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(sortedQuizzes.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedQuizzes = pageSize === -1
    ? sortedQuizzes
    : sortedQuizzes.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize);
  const [schedulingQuiz, setSchedulingQuiz] = useState<Quiz | null>(null);
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState<number>(30);
  const [scheduleType, setScheduleType] = useState<'continuous' | 'discrete'>('continuous');
  const [scheduleSlots, setScheduleSlots] = useState<IScheduleSlot[]>(() => [
    {
      startTime: toSriLankanInputString(new Date()),
      endTime: toSriLankanInputString(new Date(Date.now() + 14 * 3600000)),
      label: 'Day 1',
    },
    {
      startTime: toSriLankanInputString(new Date(Date.now() + 48 * 3600000)),
      endTime: toSriLankanInputString(new Date(Date.now() + 62 * 3600000)),
      label: 'Day 2',
    },
  ]);
  const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingNumberQuiz, setEditingNumberQuiz] = useState<Quiz | null>(null);
  const [newQuizNumberInput, setNewQuizNumberInput] = useState<string>('');
  const [savingQuizNumber, setSavingQuizNumber] = useState<boolean>(false);
  const [quizNumberError, setQuizNumberError] = useState<string>('');
  const [editingSettingsQuiz, setEditingSettingsQuiz] = useState<Quiz | null>(null);

  const getShareUrl = (quizId: string) => `${window.location.origin}/quiz/${quizId}`;

  const handleCopyLink = (quizId: string) => {
    navigator.clipboard.writeText(getShareUrl(quizId));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = (quiz: Quiz) => {
    const url = getShareUrl(quiz._id);
    const quizNumPrefix = quiz.quizNumber ? `Exam #${quiz.quizNumber} - ` : '';
    const text = encodeURIComponent(
      `🎯 *${quizNumPrefix}${quiz.title}* - National Curriculum Exam\n⏱️ Duration: ${quiz.durationMinutes} mins | 🏆 Marks: ${quiz.totalMarks}\n\n👉 Join & Attempt now: ${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const fetchQuizzes = () => {
    api
      .get('/admin/quizzes')
      .then((res) => setQuizzes(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handlePublish = async (quizId: string, status: string) => {
    try {
      await api.post(`/admin/quizzes/${quizId}/publish`, { status });
      fetchQuizzes();
    } catch (err) {
      alert('Failed to update publication status.');
    }
  };

  const handleOpenScheduleModal = (quiz: Quiz) => {
    setSchedulingQuiz(quiz);
    setScheduleDuration(quiz.durationMinutes || 30);
    setScheduleStartTime(toSriLankanInputString(quiz.startTime || new Date()));
    setScheduleEndTime(toSriLankanInputString(quiz.endTime || new Date(Date.now() + 48 * 3600000)));

    if (quiz.scheduleWindows && quiz.scheduleWindows.length > 0) {
      setScheduleType('discrete');
      setScheduleSlots(
        quiz.scheduleWindows.map((w, idx) => ({
          startTime: toSriLankanInputString(w.startTime),
          endTime: toSriLankanInputString(w.endTime),
          label: w.label || `Day ${idx + 1}`,
        }))
      );
    } else {
      setScheduleType('continuous');
    }
  };

  const handleSaveSchedule = async () => {
    if (!schedulingQuiz) return;
    try {
      const payload: any = {
        status: 'SCHEDULED',
        publishMode: 'SCHEDULED',
        durationMinutes: scheduleDuration,
      };

      if (scheduleType === 'discrete' && scheduleSlots.length > 0) {
        payload.scheduleWindows = scheduleSlots.map((s) => ({
          startTime: fromSriLankanInputString(s.startTime).toISOString(),
          endTime: fromSriLankanInputString(s.endTime).toISOString(),
          label: s.label,
        }));
        payload.scheduledStartTime = payload.scheduleWindows[0].startTime;
        payload.scheduledEndTime = payload.scheduleWindows[payload.scheduleWindows.length - 1].endTime;
      } else {
        payload.scheduledStartTime = fromSriLankanInputString(scheduleStartTime).toISOString();
        payload.scheduledEndTime = scheduleEndTime ? fromSriLankanInputString(scheduleEndTime).toISOString() : undefined;
      }

      await api.post(`/admin/quizzes/${schedulingQuiz._id}/publish`, payload);
      alert('Examination schedule updated successfully in Sri Lankan Time!');
      setSchedulingQuiz(null);
      fetchQuizzes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update schedule.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuiz) return;
    setIsDeleting(true);
    const targetId = deletingQuiz._id;
    try {
      await api.delete(`/admin/quizzes/${targetId}`);
      // Optimistically remove quiz from view immediately
      setQuizzes((prev) => prev.filter((q) => q._id !== targetId));
      setDeletingQuiz(null);
      fetchQuizzes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete examination.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRepublishAsNew = async (quizId: string) => {
    if (!confirm('Are you sure you want to republish this quiz as a new examination session? This will reset student rankings for the new session.')) return;
    const targetQuiz = quizzes.find((q) => q._id === quizId);
    const existingDuration = targetQuiz?.durationMinutes || 30;
    try {
      await api.post(`/admin/quizzes/${quizId}/republish`, {
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: existingDuration,
      });
      alert('Exam successfully republished as a new live session.');
      fetchQuizzes();
    } catch (err) {
      alert('Failed to republish examination.');
    }
  };

  const handleDownloadPdf = async (quizId: string) => {
    try {
      setDownloadingPdfId(quizId);
      const res = await api.get(`/admin/reports/${quizId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quiz_${quizId}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.warn('Blob PDF download fallback:', err);
      const token = localStorage.getItem('accessToken') || '';
      window.open(`${API_BASE_URL}/admin/reports/${quizId}/pdf?token=${encodeURIComponent(token)}`, '_blank');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleOpenEditNumberModal = (quiz: Quiz) => {
    setEditingNumberQuiz(quiz);
    setNewQuizNumberInput(String(quiz.quizNumber || 1));
    setQuizNumberError('');
  };

  const handleSaveQuizNumber = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingNumberQuiz) return;
    const num = parseInt(newQuizNumberInput.trim(), 10);
    if (isNaN(num) || num <= 0) {
      setQuizNumberError('Please enter a valid positive number >= 1.');
      return;
    }

    setSavingQuizNumber(true);
    setQuizNumberError('');
    try {
      const res = await api.patch(`/admin/quizzes/${editingNumberQuiz._id}/quiz-number`, {
        quizNumber: num,
      });
      if (res.data?.success) {
        setQuizzes((prev) =>
          prev.map((q) => (q._id === editingNumberQuiz._id ? { ...q, quizNumber: num } : q))
        );
        setEditingNumberQuiz(null);
      }
    } catch (err: any) {
      setQuizNumberError(err.response?.data?.message || 'Failed to update exam number.');
    } finally {
      setSavingQuizNumber(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading examinations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            Manage Examinations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, schedule, publish, and evaluate national curriculum examinations
          </p>
        </div>

        <Link
          to="/admin/quizzes/create"
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Create New Exam
        </Link>
      </div>

      {/* Controls: Search Bar, Status Filter, Batch & Subject Filters */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Exam # (e.g. 1, 2) or title..."
              className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Sort & Per-Page Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="NUM_DESC" className="dark:bg-slate-900">Exam # (Highest first)</option>
                <option value="NUM_ASC" className="dark:bg-slate-900">Exam # (Lowest first)</option>
                <option value="DATE_DESC" className="dark:bg-slate-900">Start Date (Newest first)</option>
                <option value="TITLE_ASC" className="dark:bg-slate-900">Exam Title (A - Z)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Show:</span>
              <div className="flex items-center gap-1">
                {[10, 25, 50, -1].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setPageSize(s);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pageSize === s
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {s === -1 ? 'All' : s}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Found <strong className="text-slate-900 dark:text-white font-mono">{filteredQuizzes.length}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white font-mono">{quizzes.length}</strong> exams
            </span>
          </div>
        </div>

        {/* Status Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900/40 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            Status:
          </span>
          {[
            { id: 'ALL', label: `All Statuses (${quizzes.length})` },
            { id: 'LIVE', label: `Live (${quizzes.filter((q) => q.status === 'LIVE').length})` },
            { id: 'SCHEDULED', label: `Scheduled (${quizzes.filter((q) => q.status === 'SCHEDULED').length})` },
            { id: 'DRAFT', label: `Draft (${quizzes.filter((q) => q.status === 'DRAFT').length})` },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setSelectedStatusFilter(st.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedStatusFilter === st.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-transparent'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Subject Filter Bar - One subject has many quizzes */}
        {availableSubjects.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">Curriculum Subjects:</span>
          <button
            type="button"
            onClick={() => setSelectedSubjectFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedSubjectFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-transparent'
            }`}
          >
            All Subjects ({quizzes.length})
          </button>
          {availableSubjects.map((subName) => {
            const count = quizzes.filter(
              (q) => ((q.subjectId as any)?.nameSi || (q.subjectId as any)?.nameEn) === subName
            ).length;
            return (
              <button
                key={subName}
                type="button"
                onClick={() => setSelectedSubjectFilter(subName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sinhala transition-all ${
                  selectedSubjectFilter === subName
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-transparent'
                }`}
              >
                {subName} ({count} {count === 1 ? 'quiz' : 'quizzes'})
              </button>
            );
          })}
        </div>
      )}

        {/* Category Filter Bar */}
        {availableCategories.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
              A/L Batch:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-transparent'
              }`}
            >
              All Batches ({quizzes.length})
            </button>
            {availableCategories.map((cat) => {
              if (cat === 'ALL') return null;
              const count = quizzes.filter((q) => (q.targetCategory || 'ALL') === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-transparent'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {quizzes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Quizzes Created Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You have a fresh, clean database ready for real examinations. Click &quot;Create New Quiz&quot; above or import questions directly from a PDF.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-4 sm:px-6">Quiz Title</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
                  {paginatedQuizzes.map((quiz) => (
                    <tr key={quiz._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 sm:px-6">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditNumberModal(quiz)}
                            className="group px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 font-mono shadow-sm flex-shrink-0 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                            title="Edit Exam Number (#)"
                          >
                            <span>Exam #{quiz.quizNumber || 1}</span>
                            <Pencil className="w-3 h-3 text-blue-200 opacity-70 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <div className="font-bold text-slate-900 dark:text-white font-sinhala">
                            {cleanQuizTitle(quiz.title)}
                          </div>
                          {quiz.targetCategory && quiz.targetCategory !== 'ALL' ? (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 inline-flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                              {quiz.targetCategory}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 inline-flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              Everyone
                            </span>
                          )}
                          {quiz.hasEssay && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/35 inline-flex items-center gap-1 shadow-sm">
                              <FileText className="w-3 h-3 text-violet-600 dark:text-violet-300" /> Full Paper ({quiz.essayTotalMarks || 0}m Essay)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                          <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                          <span>{formatSriLankanTimePeriod(quiz.startTime, quiz.endTime)}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        {(quiz.subjectId as any)?.nameEn || (quiz.subjectId as any)?.nameSi}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{quiz.durationMinutes} mins</td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl text-[11px] font-extrabold uppercase ${
                              quiz.status === 'LIVE'
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                : quiz.status === 'SCHEDULED'
                                ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {quiz.status}
                          </span>
                          {quiz.status === 'SCHEDULED' && (
                            <div className="text-[10px] text-blue-600 dark:text-blue-300 font-semibold flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> Starts in SLST
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap min-w-[280px]">
                          {quiz.status !== 'LIVE' && (
                            <button
                              onClick={() => handlePublish(quiz._id, 'LIVE')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1 shadow-md shadow-emerald-600/20"
                              title="Publish Live Immediately"
                            >
                              <Play className="w-3 h-3 fill-current" /> Go Live
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenScheduleModal(quiz)}
                            className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 border border-blue-200 dark:border-blue-500/30"
                            title="Schedule or adjust time in Sri Lankan Time (SLST)"
                          >
                            <Calendar className="w-3 h-3" /> Schedule
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingSettingsQuiz(quiz)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm cursor-pointer"
                            title="Edit Quiz Settings (Title, Duration, Subject, Batch, Schedule, Essay)"
                          >
                            <Settings className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Settings
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditNumberModal(quiz)}
                            className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                            title="Edit Exam Number (#)"
                          >
                            <Pencil className="w-3 h-3" /> Edit #{quiz.quizNumber || 1}
                          </button>

                          <button
                            onClick={() => handleRepublishAsNew(quiz._id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                            title="Republish as a new session"
                          >
                            <RefreshCw className="w-3 h-3" /> Republish
                          </button>

                          <Link
                            to={`/admin/quizzes/${quiz._id}/report`}
                            className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/25 border border-blue-200 dark:border-blue-500/30 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                          >
                            <BarChart2 className="w-3 h-3" /> Report
                          </Link>

                          <button
                            onClick={() => handleDownloadPdf(quiz._id)}
                            disabled={downloadingPdfId === quiz._id}
                            className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/25 disabled:opacity-50 border border-purple-200 dark:border-purple-500/30 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Download PDF Analysis Report"
                          >
                            {downloadingPdfId === quiz._id ? (
                              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span>{downloadingPdfId === quiz._id ? '...' : 'PDF'}</span>
                          </button>

                          <button
                            onClick={() => setSharingQuiz(quiz)}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                            title="Share quiz link with students"
                          >
                            <Share2 className="w-3 h-3" /> Share
                          </button>

                          <button
                            onClick={() => setDeletingQuiz(quiz)}
                            className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                            title="Delete quiz permanently"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-Based View (Below md screen size) */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800/80">
              {paginatedQuizzes.map((quiz) => (
                <div key={quiz._id} className="p-4 space-y-3 bg-white dark:bg-slate-900/40">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditNumberModal(quiz)}
                          className="group px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 font-mono shadow-sm flex-shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Edit Exam Number (#)"
                        >
                          <span>Exam #{quiz.quizNumber || 1}</span>
                          <Pencil className="w-3 h-3 text-blue-200 opacity-70 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/25">
                          {(quiz.subjectId as any)?.nameEn || (quiz.subjectId as any)?.nameSi || 'Curriculum'}
                        </span>
                        {quiz.targetCategory && quiz.targetCategory !== 'ALL' ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 inline-flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                            {quiz.targetCategory}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 inline-flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            Everyone
                          </span>
                        )}
                        {quiz.hasEssay && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/35 inline-flex items-center gap-1 shadow-sm">
                            <FileText className="w-3 h-3 text-violet-600 dark:text-violet-300" /> Full Paper ({quiz.essayTotalMarks || 0}m)
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base font-sinhala leading-snug">
                        {cleanQuizTitle(quiz.title)}
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase flex-shrink-0 ${
                        quiz.status === 'LIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                          : quiz.status === 'SCHEDULED'
                          ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {quiz.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-blue-600 dark:text-blue-300">
                      <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                      <span>{formatSriLankanTimePeriod(quiz.startTime, quiz.endTime)}</span>
                    </div>
                    <span>•</span>
                    <span>{quiz.durationMinutes} mins</span>
                    <span>•</span>
                    <span>{quiz.totalMarks} marks</span>
                  </div>

                  {/* Mobile Action Buttons Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                    {quiz.status !== 'LIVE' && (
                      <button
                        onClick={() => handlePublish(quiz._id, 'LIVE')}
                        className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" /> Go Live
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenScheduleModal(quiz)}
                      className="py-2 px-2 bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-blue-200 dark:border-blue-500/30"
                    >
                      <Calendar className="w-3 h-3" /> Schedule
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingSettingsQuiz(quiz)}
                      className="py-2 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                      title="Edit Quiz Settings"
                    >
                      <Settings className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditNumberModal(quiz)}
                      className="py-2 px-2 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-indigo-200 dark:border-indigo-500/30"
                      title="Edit Exam Number (#)"
                    >
                      <Pencil className="w-3 h-3" /> Edit #{quiz.quizNumber || 1}
                    </button>

                    <button
                      onClick={() => handleRepublishAsNew(quiz._id)}
                      className="py-2 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      <RefreshCw className="w-3 h-3" /> Republish
                    </button>

                    <button
                      onClick={() => setSharingQuiz(quiz)}
                      className="py-2 px-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Share2 className="w-3 h-3" /> Share
                    </button>

                    <Link
                      to={`/admin/quizzes/${quiz._id}/report`}
                      className="py-2 px-2 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-blue-200 dark:border-blue-500/30 text-center"
                    >
                      <BarChart2 className="w-3 h-3" /> Report
                    </Link>

                    <button
                      onClick={() => handleDownloadPdf(quiz._id)}
                      disabled={downloadingPdfId === quiz._id}
                      className="py-2 px-2 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 disabled:opacity-50 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-purple-200 dark:border-purple-500/30 cursor-pointer"
                    >
                      {downloadingPdfId === quiz._id ? (
                        <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                      <span>{downloadingPdfId === quiz._id ? '...' : 'PDF'}</span>
                    </button>

                    <button
                      onClick={() => setDeletingQuiz(quiz)}
                      className="py-2 px-2 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-500/30 col-span-2 sm:col-span-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Quizzes Pagination Bar */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="text-slate-500 dark:text-slate-400">
                  Showing{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {(validCurrentPage - 1) * (pageSize === -1 ? sortedQuizzes.length : pageSize) + 1}
                  </strong>
                  {' '}-{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {pageSize === -1 ? sortedQuizzes.length : Math.min(validCurrentPage * pageSize, sortedQuizzes.length)}
                  </strong>
                  {' '}of{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {sortedQuizzes.length}
                  </strong>
                  {' '}examinations
                </div>

                <div className="flex items-center gap-1.5 self-center sm:self-auto flex-wrap">
                  <button
                    type="button"
                    disabled={validCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 7) return true;
                      return p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1;
                    })
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && p > arr[idx - 1] + 1 && (
                          <span className="px-1 text-slate-400">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                            validCurrentPage === p
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
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
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Share Quiz Modal */}
      {sharingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 sm:space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSharingQuiz(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Public Share Link</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-sinhala leading-snug">
                {!sharingQuiz.title?.trim().toLowerCase().startsWith('quiz #') && !sharingQuiz.title?.trim().toLowerCase().startsWith('exam #') && (
                  <span className="text-blue-600 dark:text-blue-400 font-mono font-black mr-2">Exam #{sharingQuiz.quizNumber || 1} -</span>
                )}
                {sharingQuiz.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Anyone with this link can join this examination. If they are not logged in, they will be automatically prompted to log in or register and then redirected straight into the quiz.
              </p>
            </div>

            {/* Quiz Info Badges */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Subject</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sinhala">
                  {(sharingQuiz.subjectId as any)?.nameSi || (sharingQuiz.subjectId as any)?.nameEn || 'General'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Duration</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{sharingQuiz.durationMinutes} mins</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Total Marks</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{sharingQuiz.totalMarks}</span>
              </div>
            </div>

            {/* Copy Link Input Group */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Direct Examination URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl(sharingQuiz._id)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-300 text-xs font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(sharingQuiz._id)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 whitespace-nowrap"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span className="text-emerald-200">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleWhatsAppShare(sharingQuiz)}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>

              <a
                href={getShareUrl(sharingQuiz._id)}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview Join Page</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Quiz Modal (Sri Lankan Time) */}
      {schedulingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-blue-500/30 rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 sm:space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSchedulingQuiz(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Sri Lanka Standard Time Schedule</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-sinhala leading-snug">
                {schedulingQuiz.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Set or change when this examination unlocks for students. Quizzes are locked until the scheduled start time arrives, and then automatically activate as LIVE.
              </p>
            </div>

            <div className="p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Timezone:</span>
                <strong className="text-blue-700 dark:text-blue-300">Sri Lanka (Asia/Colombo · UTC+05:30)</strong>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Current Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{schedulingQuiz.status}</span>
              </div>
            </div>

            <div className="pt-2">
              <MultiDaySchedulePicker
                scheduleType={scheduleType}
                setScheduleType={setScheduleType}
                startTime={scheduleStartTime}
                setStartTime={setScheduleStartTime}
                endTime={scheduleEndTime}
                setEndTime={setScheduleEndTime}
                slots={scheduleSlots}
                setSlots={setScheduleSlots}
                durationMinutes={scheduleDuration}
                setDurationMinutes={setScheduleDuration}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSchedulingQuiz(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs border border-slate-200 dark:border-transparent transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-500/25 transition-all"
              >
                Save Schedule (SLST)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Quiz Confirmation Modal */}
      {deletingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => !isDeleting && setDeletingQuiz(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sinhala">
                Delete Examination
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold font-sinhala bg-rose-50 dark:bg-rose-500/10 py-1.5 px-3 rounded-xl border border-rose-200 dark:border-rose-500/20 inline-block max-w-full truncate">
                {deletingQuiz.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This examination and all associated questions, diagrams, candidate attempts, marks, and ranking data will be permanently deleted. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingQuiz(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs border border-slate-200 dark:border-transparent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quiz Number Modal */}
      {editingNumberQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => !savingQuizNumber && setEditingNumberQuiz(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <Hash className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Edit Quiz Number (#)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sinhala">
                  Edit Exam Number
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                Selected Examination
              </span>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-sinhala line-clamp-2">
                {cleanQuizTitle(editingNumberQuiz.title)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold pt-0.5">
                Current Identification: Exam #{editingNumberQuiz.quizNumber || 1}
              </div>
            </div>

            <form onSubmit={handleSaveQuizNumber} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  New Exam Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">Exam #</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newQuizNumberInput}
                    onChange={(e) => setNewQuizNumberInput(e.target.value)}
                    placeholder="1"
                    className="w-full pl-20 pr-4 py-3 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-2xl text-slate-900 dark:text-white font-mono text-xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Students will see this exam labeled as <strong className="text-slate-800 dark:text-slate-200 font-mono">Exam #{newQuizNumberInput || '?'}</strong> across the exam cards, leaderboards, and results.
                </p>
              </div>

              {quizNumberError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <span>{quizNumberError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={savingQuizNumber}
                  onClick={() => setEditingNumberQuiz(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs border border-slate-200 dark:border-transparent transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuizNumber}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingQuizNumber ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save #
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quiz Settings Modal */}
      <EditQuizSettingsModal
        isOpen={Boolean(editingSettingsQuiz)}
        quiz={editingSettingsQuiz}
        onClose={() => setEditingSettingsQuiz(null)}
        onQuizUpdated={() => {
          fetchQuizzes();
        }}
      />
    </div>
  );
};
