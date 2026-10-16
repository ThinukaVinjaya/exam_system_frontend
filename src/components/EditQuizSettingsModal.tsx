import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Quiz, Subject, EssayQuestionItem } from '../types/index.js';
import {
  X,
  Save,
  Calendar,
  Clock,
  Hash,
  BookOpen,
  GraduationCap,
  Users,
  FileText,
  UploadCloud,
  Paperclip,
  CheckSquare,
  Square,
  ExternalLink,
  Plus,
  AlertCircle,
  CheckCircle,
  Play,
  Settings,
  Sparkles,
  Brain,
  Loader2,
  ListChecks,
  Layers,
} from 'lucide-react';
import {
  toSriLankanInputString,
  fromSriLankanInputString,
} from '../utils/sriLankanTime.js';
import { MultiDaySchedulePicker, IScheduleSlot } from './MultiDaySchedulePicker.js';
import { AddSubjectModal } from './AddSubjectModal.js';
import { EssayMarkingSchemeModal } from './EssayMarkingSchemeModal.js';

interface EditQuizSettingsModalProps {
  isOpen: boolean;
  quiz: Quiz | null;
  onClose: () => void;
  onQuizUpdated: () => void;
}

export const EditQuizSettingsModal: React.FC<EditQuizSettingsModalProps> = ({
  isOpen,
  quiz,
  onClose,
  onQuizUpdated,
}) => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ _id: string; name: string }[]>([]);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [quizNumber, setQuizNumber] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [targetCategory, setTargetCategory] = useState('ALL');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED'>('LIVE');
  const [publishMode, setPublishMode] = useState<'LIVE' | 'SCHEDULED'>('LIVE');

  // Sri Lanka Time Scheduling
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('');
  const [scheduledEndTime, setScheduledEndTime] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<'continuous' | 'discrete'>('continuous');
  const [scheduleSlots, setScheduleSlots] = useState<IScheduleSlot[]>([]);

  // Full Paper Essay Settings
  const [hasEssay, setHasEssay] = useState(false);
  const [essayTotalMarks, setEssayTotalMarks] = useState<number>(100);
  const [essayStartTime, setEssayStartTime] = useState<string>('');
  const [essayEndTime, setEssayEndTime] = useState<string>('');
  const [essayDurationMinutes, setEssayDurationMinutes] = useState<number>(120);
  const [essayInstructions, setEssayInstructions] = useState('');
  const [essayFile, setEssayFile] = useState<File | null>(null);
  const [existingEssayFilename, setExistingEssayFilename] = useState<string>('');
  const [essayQuestions, setEssayQuestions] = useState<EssayQuestionItem[]>([]);
  const [essayAnalysisStatus, setEssayAnalysisStatus] = useState<'IDLE' | 'ANALYZING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [analyzingEssayPdf, setAnalyzingEssayPdf] = useState(false);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'essay'>('general');

  useEffect(() => {
    if (!isOpen) return;

    api.get('/meta/subjects').then((res) => {
      setSubjects(res.data?.data || []);
    }).catch(() => {});

    api.get('/meta/categories').then((res) => {
      if (res.data?.success && res.data?.data) {
        setAvailableCategories(res.data.data);
      }
    }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!quiz || !isOpen) return;

    setTitle(quiz.title || '');
    setQuizNumber(String(quiz.quizNumber || 1));
    const subId = typeof quiz.subjectId === 'object' && quiz.subjectId !== null
      ? (quiz.subjectId as any)._id
      : quiz.subjectId || '';
    setSelectedSubjectId(subId);
    setTargetCategory(quiz.targetCategory || 'ALL');
    setDurationMinutes(quiz.durationMinutes || 30);
    setDescription(quiz.description || '');
    setInstructions(quiz.instructions || '');
    setStatus((quiz.status as any) || 'LIVE');
    setPublishMode(quiz.status === 'SCHEDULED' ? 'SCHEDULED' : 'LIVE');

    const sTime = quiz.startTime ? new Date(quiz.startTime) : new Date();
    const eTime = quiz.endTime ? new Date(quiz.endTime) : new Date(Date.now() + 30 * 60000);
    setScheduledStartTime(toSriLankanInputString(sTime));
    setScheduledEndTime(toSriLankanInputString(eTime));

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
      setScheduleSlots([
        {
          startTime: toSriLankanInputString(sTime),
          endTime: toSriLankanInputString(new Date(sTime.getTime() + 14 * 3600000)),
          label: 'Day 1',
        },
        {
          startTime: toSriLankanInputString(new Date(sTime.getTime() + 48 * 3600000)),
          endTime: toSriLankanInputString(new Date(sTime.getTime() + 62 * 3600000)),
          label: 'Day 2',
        },
      ]);
    }

    setHasEssay(Boolean(quiz.hasEssay));
    setEssayTotalMarks(quiz.essayTotalMarks || 100);
    setEssayDurationMinutes(quiz.essayDurationMinutes || 120);
    setEssayInstructions(quiz.essayInstructions || '');
    setExistingEssayFilename(quiz.essayQuestionPaperFilename || '');
    setEssayFile(null);
    setEssayQuestions(quiz.essayQuestions || []);
    setEssayAnalysisStatus(quiz.essayAnalysisStatus || 'IDLE');

    const esTime = quiz.essayStartTime ? new Date(quiz.essayStartTime) : new Date(Date.now() + 60 * 60000);
    const eeTime = quiz.essayEndTime ? new Date(quiz.essayEndTime) : new Date(Date.now() + 240 * 60000);
    setEssayStartTime(toSriLankanInputString(esTime));
    setEssayEndTime(toSriLankanInputString(eeTime));

    setErrorMessage('');
    setActiveTab('general');
  }, [quiz, isOpen]);

  if (!isOpen || !quiz) return null;

  const handleReanalyzeQuestions = async () => {
    if (!quiz?._id) return;
    setAnalyzingEssayPdf(true);
    try {
      const res = await api.post(`/admin/quizzes/${quiz._id}/analyze-essay-paper`);
      const data = res.data?.data;
      if (data) {
        setEssayQuestions(data.essayQuestions || []);
        if (data.essayTotalMarks) setEssayTotalMarks(data.essayTotalMarks);
        setEssayAnalysisStatus(data.essayAnalysisStatus || 'COMPLETED');
        alert(res.data?.message || 'AI analysis completed! Extracted questions & marks.');
        onQuizUpdated();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to analyze essay questions with AI.');
      setEssayAnalysisStatus('FAILED');
    } finally {
      setAnalyzingEssayPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter an exam title.');
      return;
    }
    if (!selectedSubjectId) {
      setErrorMessage('Please select a curriculum subject.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const payload: any = {
        title: title.trim(),
        quizNumber: Number(quizNumber) > 0 ? Number(quizNumber) : undefined,
        subjectId: selectedSubjectId,
        targetCategory: targetCategory || 'ALL',
        durationMinutes: Number(durationMinutes) || 30,
        description: description.trim(),
        instructions: instructions.trim() || description.trim(),
        status,
        publishMode,
      };

      if (publishMode === 'SCHEDULED') {
        if (scheduleType === 'discrete' && scheduleSlots.length > 0) {
          payload.scheduleWindows = scheduleSlots.map((s) => ({
            startTime: fromSriLankanInputString(s.startTime).toISOString(),
            endTime: fromSriLankanInputString(s.endTime).toISOString(),
            label: s.label,
          }));
          payload.scheduledStartTime = payload.scheduleWindows[0].startTime;
          payload.scheduledEndTime = payload.scheduleWindows[payload.scheduleWindows.length - 1].endTime;
        } else {
          payload.scheduledStartTime = fromSriLankanInputString(scheduledStartTime).toISOString();
          payload.scheduledEndTime = fromSriLankanInputString(scheduledEndTime).toISOString();
          payload.scheduleWindows = [];
        }
      } else {
        payload.scheduledStartTime = fromSriLankanInputString(scheduledStartTime).toISOString();
        payload.scheduledEndTime = fromSriLankanInputString(scheduledEndTime).toISOString();
      }

      payload.hasEssay = hasEssay;
      if (hasEssay) {
        payload.essayTotalMarks = Number(essayTotalMarks) || 0;
        payload.essayStartTime = fromSriLankanInputString(essayStartTime).toISOString();
        payload.essayEndTime = fromSriLankanInputString(essayEndTime).toISOString();
        payload.essayDurationMinutes = Number(essayDurationMinutes) || 120;
        payload.essayInstructions = essayInstructions;
      }

      await api.put(`/admin/quizzes/${quiz._id}`, payload);

      if (hasEssay && essayFile) {
        const formData = new FormData();
        formData.append('file', essayFile);
        formData.append('essayTotalMarks', String(essayTotalMarks));
        formData.append('essayStartTime', fromSriLankanInputString(essayStartTime).toISOString());
        formData.append('essayEndTime', fromSriLankanInputString(essayEndTime).toISOString());
        formData.append('essayInstructions', essayInstructions);
        await api.post(`/admin/quizzes/${quiz._id}/essay-paper`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      onQuizUpdated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update quiz settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-y-auto font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl relative my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <Settings className="w-5 h-5 animate-[spin_6s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-display">
                  Edit Quiz Settings
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30">
                  Exam #{quizNumber || quiz.quizNumber || 1}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sinhala">
                Edit examination settings, schedule windows, and essay paper details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/admin/quizzes/${quiz._id}/edit`);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-500/30 transition-colors"
              title="Open full question and latex editor"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Full Questions Editor
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2 bg-slate-50/60 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> General Details & Batches
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Timing & Sri Lanka Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('essay')}
            className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'essay'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Full Paper Essay ({hasEssay ? 'Enabled' : 'Off'})
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[68vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: General Details */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Exam Number (#) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
                      Exam #
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quizNumber}
                      onChange={(e) => setQuizNumber(e.target.value)}
                      className="w-full pl-16 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-8">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Unit Test #1 - General Science"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-sinhala font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Curriculum Subject *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddSubjectModalOpen(true)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + New Subject
                    </button>
                  </div>
                  <select
                    required
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala font-semibold"
                  >
                    <option value="" disabled>-- Select Subject --</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.nameSi || sub.nameEn} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Target Batch / Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Target Audience / Student Batch
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetCategory('ALL')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      targetCategory === 'ALL'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/25'
                        : 'bg-slate-100 dark:bg-slate-950/60 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Everyone (All Students)
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setTargetCategory(cat.name)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        targetCategory === cat.name
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/25'
                          : 'bg-slate-100 dark:bg-slate-950/60 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" /> {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Examination Instructions / Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions for students taking this examination..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-sinhala focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Timing & Sri Lanka Schedule */}
          {activeTab === 'schedule' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Publishing Mode & State
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPublishMode('LIVE');
                      setStatus('LIVE');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      publishMode === 'LIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${publishMode === 'LIVE' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                      <Play className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">Active / Live Now</span>
                      <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-sinhala">Make Live Immediately</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPublishMode('SCHEDULED');
                      setStatus('SCHEDULED');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      publishMode === 'SCHEDULED'
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${publishMode === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">Scheduled Exam Window</span>
                      <span className="block text-[11px] text-blue-600 dark:text-blue-400 font-sinhala">Schedule for Specific Time Window</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Multi-Day Schedule Picker */}
              <div className="pt-2">
                <MultiDaySchedulePicker
                  scheduleType={scheduleType}
                  setScheduleType={setScheduleType}
                  startTime={scheduledStartTime}
                  setStartTime={setScheduledStartTime}
                  endTime={scheduledEndTime}
                  setEndTime={setScheduledEndTime}
                  slots={scheduleSlots}
                  setSlots={setScheduleSlots}
                  durationMinutes={durationMinutes}
                  setDurationMinutes={setDurationMinutes}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Essay Settings */}
          {activeTab === 'essay' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Full Paper Essay
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Allows students to download essay questions and upload answer documents.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHasEssay(!hasEssay)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    hasEssay
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/25'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {hasEssay ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  <span>{hasEssay ? 'Essay Enabled' : 'Enable Essay'}</span>
                </button>
              </div>

              {hasEssay && (
                <div className="space-y-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-in fade-in duration-200">
                  {/* File Upload / Replace */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Essay Question Paper File (PDF Document)
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 rounded-xl text-xs font-bold cursor-pointer transition-colors w-fit">
                        <UploadCloud className="w-4 h-4" />
                        <span>{essayFile ? 'Replace Selected File' : existingEssayFilename ? 'Replace Current PDF' : 'Upload Essay PDF'}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setEssayFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {essayFile ? (
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 max-w-full min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate min-w-0 flex-1 max-w-[160px] sm:max-w-xs" title={essayFile.name}>
                            {essayFile.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ({(essayFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                      ) : existingEssayFilename ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 max-w-full min-w-0">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate min-w-0 flex-1 max-w-[160px] sm:max-w-xs" title={existingEssayFilename}>
                            {existingEssayFilename}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold shrink-0">(Uploaded)</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* AI Paper Question Breakdown & Trigger */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                            AI Question & Mark Structure Analysis
                            {essayAnalysisStatus === 'COMPLETED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                ✓ Analyzed
                              </span>
                            )}
                            {essayAnalysisStatus === 'ANALYZING' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                              </span>
                            )}
                            {essayAnalysisStatus === 'FAILED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                                Analysis Failed
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            AI extracts questions, parts, and marks from your PDF for marking panel evaluation.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsSchemeModalOpen(true)}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Marking Scheme & Presets</span>
                        </button>

                        {(existingEssayFilename || essayQuestions.length > 0) && (
                          <button
                            type="button"
                            disabled={analyzingEssayPdf}
                            onClick={handleReanalyzeQuestions}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shrink-0"
                          >
                            {analyzingEssayPdf ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Analyzing PDF...</span>
                              </>
                            ) : (
                              <>
                                <Brain className="w-3.5 h-3.5" />
                                <span>{essayQuestions.length > 0 ? 'Re-Analyze with AI' : 'Analyze PDF with AI'}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Breakdown preview */}
                    {essayQuestions.length > 0 ? (
                      <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <ListChecks className="w-3.5 h-3.5 text-indigo-500" />
                            Extracted {essayQuestions.length} Questions
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                            Sum: {essayQuestions.reduce((acc, q) => acc + (q.maxMarks || q.marks || q.parts?.reduce((pa, p) => pa + (p.maxMarks || p.marks || 0), 0) || 0), 0)} Marks
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {essayQuestions.map((q) => (
                            <div
                              key={q.questionNumber}
                              className="p-2.5 bg-white/90 dark:bg-slate-900/90 border border-indigo-100 dark:border-indigo-900/60 rounded-xl shadow-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200">
                                  Q{q.questionNumber}
                                </span>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                                  {q.maxMarks || q.marks || 0} Marks
                                </span>
                              </div>
                              {(q.title || q.questionTitle || q.questionText) && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                                  {q.title || q.questionTitle || q.questionText}
                                </p>
                              )}
                              {q.parts && q.parts.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {q.parts.map((p, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                                    >
                                      {p.partLabel}: {p.maxMarks || p.marks || 0}m
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        {existingEssayFilename
                          ? 'Click "Analyze PDF with AI" above to extract questions and mark allocations.'
                          : 'When you upload an essay paper (PDF) and save, AI will automatically analyze the questions.'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Essay Total Marks *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={essayTotalMarks}
                        onChange={(e) => setEssayTotalMarks(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Start Time (SLST)
                      </label>
                      <input
                        type="datetime-local"
                        value={essayStartTime}
                        onChange={(e) => setEssayStartTime(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Submission Deadline
                      </label>
                      <input
                        type="datetime-local"
                        value={essayEndTime}
                        onChange={(e) => setEssayEndTime(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-rose-600 dark:text-rose-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Essay Instructions for Students
                    </label>
                    <textarea
                      rows={2}
                      value={essayInstructions}
                      onChange={(e) => setEssayInstructions(e.target.value)}
                      placeholder="Instructions for essay writing and answer upload..."
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-sinhala focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Action Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                onClose();
                navigate(`/admin/quizzes/${quiz._id}/edit`);
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Edit Questions & LaTeX
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Quiz Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Add Subject Nested Modal */}
        <AddSubjectModal
          isOpen={isAddSubjectModalOpen}
          onClose={() => setIsAddSubjectModalOpen(false)}
          onSubjectCreated={(newSub) => {
            setSubjects((prev) => {
              if (prev.some((s) => s._id === newSub._id)) return prev;
              return [...prev, newSub];
            });
            setSelectedSubjectId(newSub._id);
          }}
        />

        {/* Essay Marking Scheme Modal */}
        <EssayMarkingSchemeModal
          isOpen={isSchemeModalOpen}
          onClose={() => setIsSchemeModalOpen(false)}
          quizId={quiz?._id}
          initialQuestions={essayQuestions}
          initialTotalMarks={essayTotalMarks}
          apiEndpointPrefix="admin"
          onSaved={(newQuestions, newTotal) => {
            setEssayQuestions(newQuestions);
            if (newTotal) setEssayTotalMarks(newTotal);
          }}
        />
      </div>
    </div>
  );
};
