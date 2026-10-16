import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Subject, Topic, EssayQuestionItem } from '../../types/index.js';
import { UnicodeSymbolToolbar } from '../../components/UnicodeSymbolToolbar.js';
import { Plus, Trash2, Save, ArrowLeft, HelpCircle, Calendar, Clock, CheckCircle, Award, GraduationCap, Users, Hash, FileText, UploadCloud, Paperclip, CheckSquare, Square, Settings, Sparkles, Brain, Loader2, ListChecks, Layers } from 'lucide-react';
import { toSriLankanInputString, fromSriLankanInputString, formatSriLankanTimePeriod } from '../../utils/sriLankanTime.js';
import { MultiDaySchedulePicker, IScheduleSlot } from '../../components/MultiDaySchedulePicker.js';
import { QuestionImageUploader } from '../../components/QuestionImageUploader.js';
import { AddSubjectModal } from '../../components/AddSubjectModal.js';
import { EssayMarkingSchemeModal } from '../../components/EssayMarkingSchemeModal.js';

interface QuestionFormItem {
  questionType?: 'MCQ' | 'SHORT_ANSWER';
  questionText: string;
  imageUrl?: string;
  imageCaption?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
  acceptableAnswersInput?: string;
  marks: number;
  explanation: string;
}

export const AdminQuizEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const isEditMode = Boolean(quizId);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ _id: string; name: string }[]>([]);
  const [targetCategory, setTargetCategory] = useState<string>('ALL');
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [publishMode, setPublishMode] = useState<'LIVE' | 'SCHEDULED'>('LIVE');
  const [scheduledStartTime, setScheduledStartTime] = useState<string>(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    return toSriLankanInputString(d);
  });
  const [scheduledEndTime, setScheduledEndTime] = useState<string>(() => {
    const d = new Date(Date.now() + 90 * 60 * 1000);
    return toSriLankanInputString(d);
  });
  const [scheduleType, setScheduleType] = useState<'continuous' | 'discrete'>('continuous');
  const [scheduleSlots, setScheduleSlots] = useState<IScheduleSlot[]>(() => [
    {
      startTime: toSriLankanInputString(new Date(Date.now() + 30 * 60 * 1000)),
      endTime: toSriLankanInputString(new Date(Date.now() + (14 * 60 + 30) * 60 * 1000)),
      label: 'Day 1',
    },
    {
      startTime: toSriLankanInputString(new Date(Date.now() + (48 * 60 + 30) * 60 * 1000)),
      endTime: toSriLankanInputString(new Date(Date.now() + (62 * 60 + 30) * 60 * 1000)),
      label: 'Day 2',
    },
  ]);

  const [questions, setQuestions] = useState<QuestionFormItem[]>([
    {
      questionType: 'MCQ',
      questionText: '',
      imageUrl: '',
      imageCaption: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      optionE: '',
      correctAnswer: 'A',
      acceptableAnswers: [],
      acceptableAnswersInput: '',
      marks: 1,
      explanation: '',
    },
  ]);

  const [focusedInput, setFocusedInput] = useState<{ qIdx: number; field: string } | null>(null);
  const [defaultMarksPerQuestion, setDefaultMarksPerQuestion] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [nextQuizNumber, setNextQuizNumber] = useState<number | null>(null);
  const [customQuizNumber, setCustomQuizNumber] = useState<string>('');

  // Full Paper Essay Configuration
  const [hasEssay, setHasEssay] = useState(false);
  const [essayTotalMarks, setEssayTotalMarks] = useState<number>(100);
  const [essayStartTime, setEssayStartTime] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return toSriLankanInputString(d);
  });
  const [essayEndTime, setEssayEndTime] = useState<string>(() => {
    const d = new Date(Date.now() + 180 * 60 * 1000);
    return toSriLankanInputString(d);
  });
  const [essayInstructions, setEssayInstructions] = useState('Download the essay question paper, write answers clearly, and upload your answer file (PDF/document) before the deadline.');
  const [essayFile, setEssayFile] = useState<File | null>(null);
  const [essayQuestions, setEssayQuestions] = useState<EssayQuestionItem[]>([]);
  const [essayAnalysisStatus, setEssayAnalysisStatus] = useState<'IDLE' | 'ANALYZING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [existingEssayFilename, setExistingEssayFilename] = useState<string>('');
  const [analyzingEssayPdf, setAnalyzingEssayPdf] = useState(false);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  useEffect(() => {
    api.get('/meta/subjects').then((res) => {
      const data = res.data?.data || [];
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectId((prev) => prev || data[0]._id);
        setSubjectName((prev) => prev || data[0].nameSi || data[0].nameEn);
      }
    });
    api.get('/quizzes/next-number').then((res) => {
      if (res.data?.success && res.data?.data?.nextQuizNumber) {
        setNextQuizNumber(res.data.data.nextQuizNumber);
        setCustomQuizNumber((prev) => prev || String(res.data.data.nextQuizNumber));
      }
    }).catch(() => {});
    api.get('/meta/categories').then((res) => {
      if (res.data?.success && res.data?.data) {
        setAvailableCategories(res.data.data);
      }
    }).catch(() => {});

    if (quizId) {
      api.get(`/admin/quizzes/${quizId}`).then((res) => {
        const q = res.data?.data;
        if (!q) return;
        setTitle(q.title || '');
        setCustomQuizNumber(String(q.quizNumber || ''));
        setDescription(q.description || '');
        const subId = typeof q.subjectId === 'object' && q.subjectId !== null ? q.subjectId._id : q.subjectId;
        if (subId) setSelectedSubjectId(subId);
        setTargetCategory(q.targetCategory || 'ALL');
        setDurationMinutes(q.durationMinutes || 30);
        setPublishMode(q.status === 'SCHEDULED' ? 'SCHEDULED' : 'LIVE');
        if (q.startTime) setScheduledStartTime(toSriLankanInputString(new Date(q.startTime)));
        if (q.endTime) setScheduledEndTime(toSriLankanInputString(new Date(q.endTime)));
        if (q.scheduleWindows && q.scheduleWindows.length > 0) {
          setScheduleType('discrete');
          setScheduleSlots(
            q.scheduleWindows.map((w: any, idx: number) => ({
              startTime: toSriLankanInputString(new Date(w.startTime)),
              endTime: toSriLankanInputString(new Date(w.endTime)),
              label: w.label || `Day ${idx + 1}`,
            }))
          );
        }
        setHasEssay(Boolean(q.hasEssay));
        if (q.essayTotalMarks) setEssayTotalMarks(q.essayTotalMarks);
        if (q.essayStartTime) setEssayStartTime(toSriLankanInputString(new Date(q.essayStartTime)));
        if (q.essayEndTime) setEssayEndTime(toSriLankanInputString(new Date(q.essayEndTime)));
        if (q.essayInstructions) setEssayInstructions(q.essayInstructions);
        setEssayQuestions(q.essayQuestions || []);
        setEssayAnalysisStatus(q.essayAnalysisStatus || 'IDLE');
        setExistingEssayFilename(q.essayQuestionPaperFilename || '');

        if (Array.isArray(q.questions) && q.questions.length > 0) {
          setQuestions(
            q.questions.map((item: any) => ({
              _id: item._id,
              questionType: item.questionType || 'MCQ',
              questionText: item.questionText || '',
              imageUrl: item.imageUrl || '',
              imageCaption: item.imageCaption || '',
              optionA: item.options?.find((o: any) => o.key === 'A')?.text || '',
              optionB: item.options?.find((o: any) => o.key === 'B')?.text || '',
              optionC: item.options?.find((o: any) => o.key === 'C')?.text || '',
              optionD: item.options?.find((o: any) => o.key === 'D')?.text || '',
              optionE: item.options?.find((o: any) => o.key === 'E')?.text || '',
              correctAnswer: item.correctAnswer || (item.questionType === 'SHORT_ANSWER' ? '' : 'A'),
              acceptableAnswers: item.acceptableAnswers || [],
              acceptableAnswersInput: (item.acceptableAnswers || []).join(', '),
              marks: item.marks || 1,
              explanation: item.explanation || '',
            }))
          );
        }
      }).catch(() => {
        alert('Failed to load quiz details for editing.');
      });
    }
  }, [quizId]);

  const activeSubject = subjects.find((s) => s._id === selectedSubjectId) ||
    subjects.find((subject) =>
      [subject.nameEn, subject.nameSi, subject.code].some(
        (name) => name.toLowerCase() === subjectName.trim().toLowerCase()
      )
    ) || subjects[0];

  useEffect(() => {
    const subId = selectedSubjectId || activeSubject?._id;
    if (subId) {
      api.get(`/meta/topics?subjectId=${subId}`).then((res) => setTopics(res.data?.data || []));
    } else {
      setTopics([]);
      setTopicName('');
    }
  }, [selectedSubjectId, activeSubject?._id]);

  const handleReanalyzeQuestions = async () => {
    if (!quizId) {
      alert('Please save the examination first before analyzing the question paper.');
      return;
    }
    setAnalyzingEssayPdf(true);
    try {
      const res = await api.post(`/admin/quizzes/${quizId}/analyze-essay-paper`);
      const data = res.data?.data;
      if (data) {
        setEssayQuestions(data.essayQuestions || []);
        if (data.essayTotalMarks) setEssayTotalMarks(data.essayTotalMarks);
        setEssayAnalysisStatus(data.essayAnalysisStatus || 'COMPLETED');
        alert(res.data?.message || 'Questions and marks analyzed successfully by AI!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to analyze essay questions with AI.');
    } finally {
      setAnalyzingEssayPdf(false);
    }
  };

  const handleInsertSymbol = (symbol: string) => {
    if (!focusedInput) return;
    const { qIdx, field } = focusedInput;
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIdx] };
      (q as any)[field] = ((q as any)[field] || '') + symbol;
      copy[qIdx] = q;
      return copy;
    });
  };

  const handleApplyMarksToAll = (newMarks: number) => {
    if (newMarks <= 0) return;
    setDefaultMarksPerQuestion(newMarks);
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        marks: newMarks,
      }))
    );
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionType: 'MCQ',
        questionText: '',
        imageUrl: '',
        imageCaption: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        acceptableAnswers: [],
        acceptableAnswersInput: '',
        marks: defaultMarksPerQuestion || 1,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('A quiz must contain at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjectId = selectedSubjectId || activeSubject?._id;
    if (!subjectId) {
      alert('Please select a curriculum subject.');
      return;
    }

    const selectedTopic = topics.find((topic) =>
      [topic.nameEn, topic.nameSi].some(
        (name) => name.toLowerCase() === topicName.trim().toLowerCase()
      )
    );
    const topicId = selectedTopic?._id || '';

    setSubmitting(true);
    try {
      const formattedQuestions = questions.map((q) => {
        const isShort = q.questionType === 'SHORT_ANSWER';
        const options = isShort
          ? []
          : [
              { key: 'A', text: q.optionA },
              { key: 'B', text: q.optionB },
              { key: 'C', text: q.optionC },
              { key: 'D', text: q.optionD },
            ];
        if (!isShort && q.optionE && q.optionE.trim()) {
          options.push({ key: 'E', text: q.optionE.trim() });
        }
        const acceptable = q.acceptableAnswersInput
          ? q.acceptableAnswersInput.split(/[,;/|]+/).map((s) => s.trim()).filter(Boolean)
          : (q.acceptableAnswers || []);

        return {
          questionType: q.questionType || 'MCQ',
          questionText: q.questionText,
          imageUrl: q.imageUrl || undefined,
          imageCaption: q.imageCaption || undefined,
          options,
          correctAnswer: q.correctAnswer || (isShort ? '' : 'A'),
          acceptableAnswers: acceptable,
          marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
          explanation: q.explanation,
          topicId: topicId || undefined,
        };
      });

      // Ensure all selection (MCQ) questions are continuous first, followed strictly by all Short Answer questions
      const mcqList = formattedQuestions.filter((q) => q.questionType !== 'SHORT_ANSWER');
      const shortAnswerList = formattedQuestions.filter((q) => q.questionType === 'SHORT_ANSWER');
      const orderedQuestions = [...mcqList, ...shortAnswerList];

      const payload: any = {
        title,
        description,
        subjectId,
        subjectName: activeSubject?.nameSi || activeSubject?.nameEn || subjectName,
        topicIds: topicId ? [topicId] : [],
        topicName: topicName.trim() || undefined,
        questions: orderedQuestions,
        durationMinutes: Number(durationMinutes),
        instructions: description || 'Select the most accurate answer for each question.',
        publishMode,
        targetCategory: targetCategory || 'ALL',
        quizNumber: customQuizNumber && Number(customQuizNumber) > 0 ? Number(customQuizNumber) : undefined,
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
        payload.scheduledStartTime = fromSriLankanInputString(scheduledStartTime).toISOString();
        payload.scheduledEndTime = fromSriLankanInputString(scheduledEndTime).toISOString();
      }

      if (hasEssay) {
        payload.hasEssay = true;
        payload.essayTotalMarks = Number(essayTotalMarks);
        payload.essayStartTime = fromSriLankanInputString(essayStartTime).toISOString();
        payload.essayEndTime = fromSriLankanInputString(essayEndTime).toISOString();
        payload.essayInstructions = essayInstructions;
      }

      let targetQuizId = quizId;
      if (isEditMode) {
        await api.put(`/admin/quizzes/${quizId}`, payload);
      } else {
        const res = await api.post('/admin/quizzes', payload);
        targetQuizId = res.data?.data?._id;
      }

      if (hasEssay && essayFile && targetQuizId) {
        const formData = new FormData();
        formData.append('file', essayFile);
        formData.append('essayTotalMarks', String(essayTotalMarks));
        formData.append('essayStartTime', fromSriLankanInputString(essayStartTime).toISOString());
        formData.append('essayEndTime', fromSriLankanInputString(essayEndTime).toISOString());
        formData.append('essayInstructions', essayInstructions);
        await api.post(`/admin/quizzes/${targetQuizId}/essay-paper`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (isEditMode) {
        alert('Examination settings and questions updated successfully!');
      } else if (publishMode === 'SCHEDULED') {
        alert('Quiz created and scheduled successfully in Sri Lankan Time!');
      } else {
        alert('Quiz created and published live successfully!');
      }
      navigate('/admin/quizzes');
    } catch (err: any) {
      alert(err.response?.data?.message || (isEditMode ? 'Failed to update quiz.' : 'Failed to create quiz.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/quizzes')}
          className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                {isEditMode ? 'Edit Examination' : 'Create Examination'}
              </h1>
              <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-lg shadow-sm font-mono border border-blue-400/40">
                ✨ Exam #{customQuizNumber || nextQuizNumber || 1}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditMode
                ? 'Update exam settings, schedule period, batches, and question details'
                : 'Write questions in Sinhala or English with full mathematical LaTeX notation ($...$)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                document.getElementById('general-settings-card')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Jump to edit quiz settings"
            >
              <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Edit Quiz Settings</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz General Details Card */}
        <div id="general-settings-card" className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            General Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Exam Number (#) *
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
                  Exam #
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={customQuizNumber}
                  onChange={(e) => setCustomQuizNumber(e.target.value)}
                  placeholder={nextQuizNumber ? String(nextQuizNumber) : '1'}
                  className="w-full pl-16 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Sequential exam number (e.g. #1).
              </p>
            </div>

            <div className="md:col-span-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Quiz Title *
                </label>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Practice Test or General Examination"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala font-medium"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Display name for examination.
              </p>
            </div>

            <div className="md:col-span-4">
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Curriculum Subject *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(true)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-500/25 transition-all cursor-pointer"
                  title="Add new curriculum subject"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Subject</span>
                </button>
              </div>
              <select
                required
                value={selectedSubjectId}
                onChange={(e) => {
                  const newId = e.target.value;
                  if (newId === '__ADD_NEW__') {
                    setIsAddSubjectModalOpen(true);
                    return;
                  }
                  setSelectedSubjectId(newId);
                  const found = subjects.find((s) => s._id === newId);
                  if (found) {
                    setSubjectName(found.nameSi || found.nameEn);
                  }
                }}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala font-semibold"
              >
                <option value="" disabled>-- Select Curriculum Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.nameSi || sub.nameEn} ({sub.code})
                  </option>
                ))}
                <option value="__ADD_NEW__" className="text-blue-600 dark:text-blue-400 font-bold">
                  ➕ + Add New Subject...
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Topic / Unit
              </label>
              {topics.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala font-medium"
                  >
                    <option value="">-- Choose Existing Topic (or enter new below) --</option>
                    {topics.map((top) => (
                      <option key={top._id} value={top.nameSi || top.nameEn}>
                        {top.nameSi || top.nameEn}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="Or type a custom topic name..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-sinhala"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Cell Biology, Genetics, Mechanics"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala font-medium"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                min="5"
                max="240"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description / Examination Instructions
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions for students taking this examination..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala"
            />
          </div>

          {/* Target Audience / Batch Category */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Target Audience / Student Batch *
              </label>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20">
                {targetCategory === 'ALL' ? '🌍 Open to Everyone' : `🎓 Only for ${targetCategory}`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setTargetCategory('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  targetCategory === 'ALL'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-950/60 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Everyone (All Batches)
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setTargetCategory(cat.name)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    targetCategory === cat.name
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/25'
                      : 'bg-slate-100 dark:bg-slate-950/60 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select who can view and take this examination. Choose "Everyone" for all students or specify an A/L batch like 2027 A/L.
            </p>
          </div>

          {/* Publishing Mode & Sri Lankan Time Period Scheduling */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Publishing Mode & Time Window *
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Set the exact examination time period (e.g. 11:00 PM - 12:00 AM). Every student must answer within this window.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPublishMode('LIVE');
                  const now = new Date();
                  setScheduledStartTime(toSriLankanInputString(now));
                  setScheduledEndTime(toSriLankanInputString(new Date(now.getTime() + durationMinutes * 60000)));
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  publishMode === 'LIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${publishMode === 'LIVE' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">Publish Live Immediately</span>
                  <span className="block text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Publish Live Immediately</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Quiz activates immediately for the set duration.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPublishMode('SCHEDULED');
                  const futureStart = new Date(Date.now() + 30 * 60000);
                  setScheduledStartTime(toSriLankanInputString(futureStart));
                  setScheduledEndTime(toSriLankanInputString(new Date(futureStart.getTime() + durationMinutes * 60000)));
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  publishMode === 'SCHEDULED'
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${publishMode === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">Schedule Quiz Period (SLST)</span>
                  <span className="block text-xs text-blue-600 dark:text-blue-400 mt-0.5">Schedule for Specific Time Window</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Unlocks at scheduled start time and closes at end time.</p>
                </div>
              </button>
            </div>

            {/* Time Window Settings Card */}
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
        </div>

        {/* Full Paper Essay Configuration Card */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                    Full Paper Essay
                  </h2>
                  <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-lg uppercase">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Attach an essay paper for students to download, solve, and upload answer sheets for marking.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHasEssay(!hasEssay)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                hasEssay
                  ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {hasEssay ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              <span>{hasEssay ? 'Essay Paper Enabled' : 'Enable Essay Paper'}</span>
            </button>
          </div>

          {hasEssay && (
            <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-300">
              {/* Question Paper File Upload */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Upload Essay Question Paper File (PDF / Word Document)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 rounded-xl text-xs font-bold cursor-pointer transition-colors w-fit">
                    <UploadCloud className="w-4 h-4" />
                    <span>{essayFile ? 'Change File' : 'Select Question Paper (PDF)'}</span>
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
                      <Paperclip className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="truncate min-w-0 flex-1 max-w-[180px] sm:max-w-xs" title={essayFile.name}>
                        {essayFile.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                        ({(essayFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  ) : existingEssayFilename ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 max-w-full min-w-0">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate min-w-0 flex-1 max-w-[180px] sm:max-w-xs" title={existingEssayFilename}>
                        {existingEssayFilename}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold shrink-0">(Active Question Paper)</span>
                    </div>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500">
                  Students will download this document during their allocated essay time window.
                </p>
              </div>

              {/* AI Paper Question Breakdown & Trigger */}
              <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl space-y-3">
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
                        AI analyzes the PDF to extract every question, subparts (a, b, c), and their individual marks for marking panels.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSchemeModalOpen(true)}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Marking Scheme & Presets</span>
                    </button>

                    {isEditMode && (existingEssayFilename || essayQuestions.length > 0) && (
                      <button
                        type="button"
                        disabled={analyzingEssayPdf}
                        onClick={handleReanalyzeQuestions}
                        className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shrink-0"
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
                  <div className="space-y-2.5 pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <ListChecks className="w-4 h-4 text-indigo-500" />
                        Extracted {essayQuestions.length} Questions
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                        Sum: {essayQuestions.reduce((acc, q) => acc + (q.maxMarks || q.marks || q.parts?.reduce((pa, p) => pa + (p.maxMarks || p.marks || 0), 0) || 0), 0)} Marks
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {essayQuestions.map((q) => (
                        <div
                          key={q.questionNumber}
                          className="p-3 bg-white/90 dark:bg-slate-900/90 border border-indigo-100 dark:border-indigo-900/60 rounded-xl shadow-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200">
                              Question {q.questionNumber}
                            </span>
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800">
                              {q.maxMarks || q.marks || 0} Marks
                            </span>
                          </div>
                          {(q.title || q.questionTitle || q.questionText) && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                              {q.title || q.questionTitle || q.questionText}
                            </p>
                          )}
                          {q.parts && q.parts.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {q.parts.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
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
                    {isEditMode && existingEssayFilename
                      ? 'Click "Analyze PDF with AI" above to automatically extract question numbers, sub-parts, and marks from your uploaded paper.'
                      : 'When you upload an essay paper (PDF) and save, AI will automatically analyze the questions and marks.'}
                  </p>
                )}
              </div>

              {/* Total Marks & Time Window */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Essay Total Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required={hasEssay}
                    value={essayTotalMarks}
                    onChange={(e) => setEssayTotalMarks(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">e.g. 50 or 100 marks</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Essay Start Time (SLST) *
                  </label>
                  <input
                    type="datetime-local"
                    required={hasEssay}
                    value={essayStartTime}
                    onChange={(e) => setEssayStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">When students can start downloading</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Essay End Time / Deadline (SLST) *
                  </label>
                  <input
                    type="datetime-local"
                    required={hasEssay}
                    value={essayEndTime}
                    onChange={(e) => setEssayEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Final submission deadline</p>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Essay Instructions for Students
                </label>
                <textarea
                  rows={2}
                  value={essayInstructions}
                  onChange={(e) => setEssayInstructions(e.target.value)}
                  placeholder="Instructions for essay writing and answer sheet upload..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala"
                />
              </div>
            </div>
          )}
        </div>

        {/* Global Toolbar for quick symbols */}
        <div className="sticky top-20 z-30">
          <UnicodeSymbolToolbar onInsertSymbol={handleInsertSymbol} />
        </div>

        {/* Questions Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Examination Questions ({questions.length})
            </h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Add Question
            </button>
          </div>

          {/* Bulk Marks Configuration Toolbar */}
          <div className="bg-gradient-to-r from-slate-50 via-indigo-50/50 to-slate-50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/25 rounded-2xl p-4 sm:p-5 shadow-md dark:shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Default Marks per Question</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Change the mark once to update all questions simultaneously.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  Total Questions: <strong className="text-emerald-600 dark:text-emerald-400">{questions.length}</strong>
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  Total Marks: <strong className="text-amber-600 dark:text-amber-400">{questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mark value:</label>
                <input
                  type="number"
                  min="1"
                  value={defaultMarksPerQuestion}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDefaultMarksPerQuestion(val);
                  }}
                  className="w-20 px-3 py-1.5 bg-white dark:bg-slate-950/80 border border-indigo-300 dark:border-indigo-500/40 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleApplyMarksToAll(defaultMarksPerQuestion)}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> Apply to All Questions
              </button>

              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Quick presets:</span>
                {[1, 2, 4, 5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyMarksToAll(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      defaultMarksPerQuestion === preset
                        ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/50 shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {preset} {preset === 1 ? 'Mark' : 'Marks'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 relative"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20">
                    Question {idx + 1}
                  </span>

                  {/* Question Type Switcher */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setQuestions((prev) => {
                          const copy = [...prev];
                          copy[idx].questionType = 'MCQ';
                          if (!['A', 'B', 'C', 'D', 'E'].includes(copy[idx].correctAnswer)) {
                            copy[idx].correctAnswer = 'A';
                          }
                          return copy;
                        });
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        (q.questionType || 'MCQ') === 'MCQ'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      🔘 Multiple Choice (MCQ)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuestions((prev) => {
                          const copy = [...prev];
                          copy[idx].questionType = 'SHORT_ANSWER';
                          return copy;
                        });
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        q.questionType === 'SHORT_ANSWER'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ✍️ Short Answer
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Remove this question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Question Text (Sinhala Unicode or English) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={q.questionText}
                  onFocus={() => setFocusedInput({ qIdx: idx, field: 'questionText' })}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuestions((prev) => {
                      const copy = [...prev];
                      copy[idx].questionText = val;
                      return copy;
                    });
                  }}
                  placeholder="Type question stem here... (For math use $x = \frac{a}{b}$)"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala leading-relaxed"
                />
              </div>

              {/* Question Diagram / Image Uploader */}
              <QuestionImageUploader
                imageUrl={q.imageUrl}
                imageCaption={q.imageCaption}
                questionNumberLabel={`Question ${idx + 1}`}
                onChange={(newUrl, newCaption) => {
                  setQuestions((prev) => {
                    const copy = [...prev];
                    copy[idx].imageUrl = newUrl;
                    copy[idx].imageCaption = newCaption;
                    return copy;
                  });
                }}
              />

              {q.questionType === 'SHORT_ANSWER' ? (
                /* Short Answer Configuration */
                <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1.5">
                      Model Short Answer / Expected Answer *
                    </label>
                    <input
                      type="text"
                      required
                      value={q.correctAnswer}
                      onFocus={() => setFocusedInput({ qIdx: idx, field: 'correctAnswer' })}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuestions((prev) => {
                          const copy = [...prev];
                          copy[idx].correctAnswer = val;
                          return copy;
                        });
                      }}
                      placeholder="e.g. Photosynthesis, Mitochondria, or CO2"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950/90 border border-amber-300 dark:border-amber-700/60 rounded-xl text-slate-900 dark:text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-sinhala"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1.5">
                      Acceptable Alternatives / Synonyms (English, Sinhala, Singlish)
                    </label>
                    <input
                      type="text"
                      value={q.acceptableAnswersInput !== undefined ? q.acceptableAnswersInput : (q.acceptableAnswers || []).join(', ')}
                      onFocus={() => setFocusedInput({ qIdx: idx, field: 'acceptableAnswersInput' })}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuestions((prev) => {
                          const copy = [...prev];
                          copy[idx].acceptableAnswersInput = val;
                          return copy;
                        });
                      }}
                      placeholder="e.g. photosynthesis, prahasansleshana (comma separated)"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950/90 border border-amber-200 dark:border-amber-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-sinhala"
                    />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-1.5 flex items-center gap-1.5">
                      <span>💡</span> Answers provided in English, Sinhala, or Singlish are analyzed by natural language processing and scored automatically.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={q.marks}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setQuestions((prev) => {
                          const copy = [...prev];
                          copy[idx].marks = val;
                          return copy;
                        });
                      }}
                      className="w-32 px-4 py-2 bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>
              ) : (
                /* MCQ options & correct answer select */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const fieldName = `option${key}` as keyof QuestionFormItem;
                      return (
                        <div key={key}>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Option {key} *
                          </label>
                          <input
                            type="text"
                            required={q.questionType !== 'SHORT_ANSWER'}
                            value={q[fieldName] as string}
                            onFocus={() => setFocusedInput({ qIdx: idx, field: fieldName })}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuestions((prev) => {
                                const copy = [...prev];
                                (copy[idx] as any)[fieldName] = val;
                                return copy;
                              });
                            }}
                            placeholder={`Option ${key} text`}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala"
                          />
                        </div>
                      );
                    })}

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Option E (Optional / A/L 5-Choice Exam)
                      </label>
                      <input
                        type="text"
                        value={q.optionE || ''}
                        onFocus={() => setFocusedInput({ qIdx: idx, field: 'optionE' })}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions((prev) => {
                            const copy = [...prev];
                            copy[idx].optionE = val;
                            return copy;
                          });
                        }}
                        placeholder="Option E text (optional for 5-choice papers)"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala"
                      />
                    </div>
                  </div>

                  {/* Correct answer & marks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Correct Answer *
                      </label>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setQuestions((prev) => {
                            const copy = [...prev];
                            copy[idx].correctAnswer = val;
                            return copy;
                          });
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                        <option value="E">Option E</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Marks
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={q.marks}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setQuestions((prev) => {
                            const copy = [...prev];
                            copy[idx].marks = val;
                            return copy;
                          });
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Explanation / Solution (Optional)
                </label>
                <input
                  type="text"
                  value={q.explanation}
                  onFocus={() => setFocusedInput({ qIdx: idx, field: 'explanation' })}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuestions((prev) => {
                      const copy = [...prev];
                      copy[idx].explanation = val;
                      return copy;
                    });
                  }}
                  placeholder="Solution steps or reference..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/30 hover:bg-blue-50/50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white font-bold rounded-3xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Add Another Question
          </button>
        </div>

        {/* Submit Bar */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {submitting
              ? (isEditMode ? 'Updating Examination...' : 'Publishing Examination...')
              : (isEditMode ? 'Save & Update Examination' : 'Save & Publish Examination')}
          </button>
        </div>
      </form>

      {/* Add Curriculum Subject Modal */}
      <AddSubjectModal
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        onSubjectCreated={(newSub) => {
          setSubjects((prev) => {
            if (prev.some((s) => s._id === newSub._id)) return prev;
            return [...prev, newSub];
          });
          setSelectedSubjectId(newSub._id);
          setSubjectName(newSub.nameSi || newSub.nameEn);
        }}
      />

      {/* Marking Scheme & Presets Modal */}
      <EssayMarkingSchemeModal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        quizId={quizId}
        initialQuestions={essayQuestions}
        initialTotalMarks={essayTotalMarks}
        apiEndpointPrefix="admin"
        onSaved={(newQuestions, newTotal) => {
          setEssayQuestions(newQuestions);
          if (newTotal) setEssayTotalMarks(newTotal);
        }}
      />
    </div>
  );
};
