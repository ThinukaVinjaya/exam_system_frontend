import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { AiTemplate, PdfImport, ParsedQuestionItem, Subject } from '../../types/index.js';
import { MathRenderer } from '../../components/MathRenderer.js';
import { QuestionImageUploader } from '../../components/QuestionImageUploader.js';
import { AddSubjectModal } from '../../components/AddSubjectModal.js';
import { MultiDaySchedulePicker, IScheduleSlot } from '../../components/MultiDaySchedulePicker.js';
import {
  toSriLankanInputString,
  fromSriLankanInputString,
} from '../../utils/sriLankanTime.js';
import {
  Sparkles,
  Wand2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  Plus,
  Play,
  Calendar,
  Clock,
  Layers,
  GraduationCap,
  Users,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Hash,
  Award,
  Bookmark,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Paperclip,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminAiQuizGeneratorPage: React.FC = () => {
  const navigate = useNavigate();

  // Template State
  const [templates, setTemplates] = useState<AiTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isSavingTemplateModalOpen, setIsSavingTemplateModalOpen] = useState<boolean>(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState<string>('');
  const [newTemplateDesc, setNewTemplateDesc] = useState<string>('');

  // Generation Settings State
  const [title, setTitle] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('Biology');
  const [defaultTopicName, setDefaultTopicName] = useState<string>('');
  const [targetCategory, setTargetCategory] = useState<string>('2027 A/L');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [optionsCount, setOptionsCount] = useState<number>(5);
  const [questionFormat, setQuestionFormat] = useState<'MCQ_ONLY' | 'SHORT_ANSWER_ONLY' | 'MIXED'>('MCQ_ONLY');
  const [shortAnswerCount, setShortAnswerCount] = useState<number>(0);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'>('MIXED');
  const [language, setLanguage] = useState<'SINHALA' | 'ENGLISH' | 'BILINGUAL'>('SINHALA');
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // Syllabus Material Input State
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [syllabusText, setSyllabusText] = useState<string>('');

  // Subjects & Categories
  const [subjects, setSubjects] = useState<{ _id: string; nameSi: string; nameEn: string; code: string }[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ _id: string; name: string }[]>([]);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState<boolean>(false);

  // Generation Process State
  const [generating, setGenerating] = useState<boolean>(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccessMsg, setGenSuccessMsg] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  // Generated Quiz & Editing State
  const [pdfImport, setPdfImport] = useState<PdfImport | null>(null);
  const [editingQuestions, setEditingQuestions] = useState<ParsedQuestionItem[]>([]);
  const [savingQuestions, setSavingQuestions] = useState<boolean>(false);
  const [bulkMarks, setBulkMarks] = useState<number>(1);

  // Publishing State
  const [publishMode, setPublishMode] = useState<'LIVE' | 'SCHEDULED'>('SCHEDULED');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [scheduledStartTime, setScheduledStartTime] = useState<string>(() =>
    toSriLankanInputString(new Date(Date.now() + 30 * 60000))
  );
  const [scheduledEndTime, setScheduledEndTime] = useState<string>(() =>
    toSriLankanInputString(new Date(Date.now() + 60 * 60000))
  );
  const [scheduleType, setScheduleType] = useState<'continuous' | 'discrete'>('continuous');
  const [scheduleSlots, setScheduleSlots] = useState<IScheduleSlot[]>([]);
  const [publishing, setPublishing] = useState<boolean>(false);

  // Essay settings (optional)
  const [hasEssay, setHasEssay] = useState<boolean>(false);
  const [essayTotalMarks, setEssayTotalMarks] = useState<number>(100);
  const [essayStartTime, setEssayStartTime] = useState<string>(() =>
    toSriLankanInputString(new Date(Date.now() + 60 * 60 * 1000))
  );
  const [essayEndTime, setEssayEndTime] = useState<string>(() =>
    toSriLankanInputString(new Date(Date.now() + 4 * 60 * 60 * 1000))
  );
  const [essayInstructions, setEssayInstructions] = useState<string>('');
  const [essayFile, setEssayFile] = useState<File | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoadingTemplates(true);
      const [tplRes, subRes, catRes] = await Promise.all([
        api.get('/admin/ai-templates').catch(() => ({ data: { data: [] } })),
        api.get('/admin/subjects').catch(() => ({ data: { data: [] } })),
        api.get('/admin/categories').catch(() => ({ data: { data: [] } })),
      ]);

      const tpls: AiTemplate[] = tplRes.data?.data || [];
      setTemplates(tpls);

      const subs = subRes.data?.data || [];
      setSubjects(subs);

      const cats = catRes.data?.data || [];
      setAvailableCategories(cats);

      // Auto-select first template if available
      if (tpls.length > 0 && !selectedTemplateId) {
        applyTemplate(tpls[0]);
      }
    } catch (err) {
      console.error('Failed to load generator initial data:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const applyTemplate = (tpl: AiTemplate) => {
    setSelectedTemplateId(tpl._id || null);
    setTitle(tpl.title || '');
    setSubjectName(tpl.subjectName || 'Biology');
    setDefaultTopicName(tpl.defaultTopicName || '');
    setTargetCategory(tpl.targetCategory || 'ALL');
    setQuestionFormat(tpl.questionFormat || 'MCQ_ONLY');
    setShortAnswerCount(tpl.shortAnswerCount || 0);
    setQuestionCount(tpl.questionCount || 10);
    setOptionsCount(tpl.optionsCount || 5);
    setMarksPerQuestion(tpl.marksPerQuestion || 1);
    setDifficulty(tpl.difficulty || 'MIXED');
    setLanguage(tpl.language || 'SINHALA');
    setCustomInstructions(tpl.customInstructions || '');
  };

  const handleSaveAsNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) return;

    try {
      const res = await api.post('/admin/ai-templates', {
        title: newTemplateTitle.trim(),
        description: newTemplateDesc.trim(),
        subjectName,
        defaultTopicName,
        targetCategory,
        questionFormat,
        shortAnswerCount,
        questionCount,
        optionsCount,
        marksPerQuestion,
        difficulty,
        language,
        customInstructions,
      });

      const created = res.data?.data;
      if (created) {
        setTemplates((prev) => [created, ...prev]);
        setSelectedTemplateId(created._id);
      }
      setIsSavingTemplateModalOpen(false);
      setNewTemplateTitle('');
      setNewTemplateDesc('');
      alert('Template saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save template.');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Delete this template?')) return;

    try {
      await api.delete(`/admin/ai-templates/${templateId}`);
      setTemplates((prev) => prev.filter((t) => t._id !== templateId));
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete template.');
    }
  };

  // Run AI Question Generation
  const handleGenerateQuestions = async () => {
    if (!subjectName.trim()) {
      alert('Please select or enter a subject.');
      return;
    }

    if (inputMode === 'upload' && !syllabusFile) {
      alert('Please upload a syllabus PDF file.');
      return;
    }

    if (inputMode === 'text' && !syllabusText.trim()) {
      alert('Please paste syllabus notes or text.');
      return;
    }

    setGenerating(true);
    setGenError(null);
    setGenSuccessMsg(null);

    const formData = new FormData();
    formData.append('title', title.trim() || `${subjectName} - AI Model Exam`);
    formData.append('subjectName', subjectName.trim());
    formData.append('defaultTopicName', defaultTopicName.trim());
    formData.append('targetCategory', targetCategory.trim());
    formData.append('questionFormat', questionFormat);
    formData.append('shortAnswerCount', String(shortAnswerCount));
    formData.append('questionCount', String(questionCount));
    formData.append('optionsCount', String(optionsCount));
    formData.append('marksPerQuestion', String(marksPerQuestion));
    formData.append('difficulty', difficulty);
    formData.append('language', language);
    formData.append('customInstructions', customInstructions.trim());

    if (inputMode === 'upload' && syllabusFile) {
      formData.append('syllabusFile', syllabusFile);
    } else {
      formData.append('syllabusText', syllabusText.trim());
    }

    try {
      const res = await api.post('/admin/ai-generator/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data?.data;
      if (data) {
        setPdfImport(data.pdfImport);
        setEditingQuestions(data.parsedQuestions || []);
        setModelUsed(data.modelUsed || 'gemini-2.5-flash');
        setGenSuccessMsg(res.data?.message || 'AI questions generated successfully!');
        setDurationMinutes(Math.max(15, (data.parsedQuestions || []).length * 2));
      }
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setGenError(
        err.response?.data?.message ||
          'Question generation failed. Please review your syllabus file or notes and try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // Update question inline
  const handleQuestionChange = (idx: number, field: keyof ParsedQuestionItem, val: any) => {
    setEditingQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Update option inline
  const handleOptionChange = (qIdx: number, optIdx: number, text: string) => {
    setEditingQuestions((prev) => {
      const copy = [...prev];
      const optCopy = [...copy[qIdx].options];
      optCopy[optIdx] = { ...optCopy[optIdx], text };
      copy[qIdx] = { ...copy[qIdx], options: optCopy };
      return copy;
    });
  };

  // Add a new question manually
  const handleAddQuestion = () => {
    const nextQNum = editingQuestions.length + 1;
    const allowedKeys = optionsCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
    const isShort = questionFormat === 'SHORT_ANSWER_ONLY';
    const newQ: ParsedQuestionItem = {
      questionNumber: nextQNum,
      topicName: defaultTopicName || 'General',
      questionType: isShort ? 'SHORT_ANSWER' : 'MCQ',
      questionText: `Question ${nextQNum}: `,
      options: isShort ? [] : allowedKeys.map((k) => ({ key: k, text: `Option ${k}` })),
      correctAnswer: isShort ? '' : 'A',
      acceptableAnswers: [],
      marks: marksPerQuestion || 1,
      explanation: '',
      errors: [],
    };
    setEditingQuestions((prev) => [...prev, newQ]);
  };

  // Delete a question
  const handleDeleteQuestion = (idx: number) => {
    if (!window.confirm('Delete this question?')) return;
    setEditingQuestions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((q, i) => ({ ...q, questionNumber: i + 1 }))
    );
  };

  // Apply bulk marks
  const handleApplyBulkMarks = (newMarks: number) => {
    setBulkMarks(newMarks);
    setEditingQuestions((prev) => prev.map((q) => ({ ...q, marks: newMarks })));
  };

  // Save changes to the draft import
  const handleSaveDraftQuestions = async () => {
    if (!pdfImport?._id) return;
    setSavingQuestions(true);
    try {
      await api.put(`/admin/pdf/${pdfImport._id}/questions`, {
        subjectName,
        topicName: defaultTopicName,
        parsedQuestions: editingQuestions,
      });
      alert('Draft changes saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save draft questions.');
    } finally {
      setSavingQuestions(false);
    }
  };

  // Convert and Publish Quiz directly
  const handlePublishQuiz = async () => {
    if (!pdfImport?._id) return;
    if (editingQuestions.length === 0) {
      alert('No questions found. Please add questions.');
      return;
    }

    setPublishing(true);
    try {
      const payload: any = {
        title: title.trim() || `${subjectName} - AI Examination`,
        subjectId: subjects.find((s) => s.nameSi === subjectName || s.nameEn === subjectName)?._id,
        targetCategory,
        durationMinutes,
        publishMode,
        instructions: `Please answer all questions within the allocated time. Examination: ${subjectName}.`,
      };

      if (publishMode === 'SCHEDULED') {
        if (scheduleType === 'discrete' && scheduleSlots.length > 0) {
          payload.scheduleWindows = scheduleSlots.map((slot) => ({
            startTime: fromSriLankanInputString(slot.startTime).toISOString(),
            endTime: fromSriLankanInputString(slot.endTime).toISOString(),
            label: slot.label,
          }));
        } else {
          payload.scheduledStartTime = fromSriLankanInputString(scheduledStartTime).toISOString();
          payload.scheduledEndTime = fromSriLankanInputString(scheduledEndTime).toISOString();
        }
      } else {
        const now = new Date();
        payload.scheduledStartTime = now.toISOString();
        payload.scheduledEndTime = new Date(now.getTime() + durationMinutes * 60000).toISOString();
      }

      payload.hasEssay = hasEssay;
      if (hasEssay) {
        if (!essayStartTime || !essayEndTime) {
          alert('Please provide essay start and deadline times.');
          setPublishing(false);
          return;
        }
        payload.essayTotalMarks = Number(essayTotalMarks) || 0;
        payload.essayStartTime = fromSriLankanInputString(essayStartTime).toISOString();
        payload.essayEndTime = fromSriLankanInputString(essayEndTime).toISOString();
        payload.essayInstructions = essayInstructions;
      }

      // Convert and publish
      const res = await api.post(`/admin/pdf/${pdfImport._id}/publish-quiz`, payload);
      const createdQuiz = res.data?.data;
      const newQuizId = createdQuiz?._id;

      if (hasEssay && essayFile && newQuizId) {
        try {
          const essayForm = new FormData();
          essayForm.append('file', essayFile);
          essayForm.append('essayTotalMarks', String(essayTotalMarks));
          essayForm.append('essayStartTime', fromSriLankanInputString(essayStartTime).toISOString());
          essayForm.append('essayEndTime', fromSriLankanInputString(essayEndTime).toISOString());
          essayForm.append('essayInstructions', essayInstructions);
          await api.post(`/admin/quizzes/${newQuizId}/essay-paper`, essayForm, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadErr: any) {
          console.error('Failed to upload essay question paper:', uploadErr);
          alert(
            `Examination (#${createdQuiz?.quizNumber || ''}) published, but essay file upload failed: ${
              uploadErr.response?.data?.message || uploadErr.message
            }. You can upload it via the Quiz Editor.`
          );
        }
      }

      const qNum = createdQuiz?.quizNumber || '';
      alert(`Examination #${qNum} published successfully!`);
      navigate('/admin/quizzes');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish examination.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans pb-16">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-blue-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Next-Gen Gemini Multimodal AI Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              AI Examination & Question Generator
            </h1>
            <p className="text-sm text-blue-100/90 max-w-2xl font-sinhala leading-relaxed">
              Generate standard multiple choice and short answer assessments with model answers and comprehensive explanations using AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsSavingTemplateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all shadow-md cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-amber-300" />
              <span>Save Current As Template</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/quizzes')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>View Quizzes</span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP 1 & 2 CONTAINER: Configuration & Material Input */}
      {!pdfImport ? (
        <div className="space-y-6">
          {/* Template Selection Library */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/20">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Step 1: Choose or Customize Template
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a ready-made curriculum preset or tailor your question requirements below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSavingTemplateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-500/30 transition-colors w-fit"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Custom Template</span>
              </button>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl._id;
                return (
                  <div
                    key={tpl._id}
                    onClick={() => applyTemplate(tpl)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative text-left flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                          {tpl.targetCategory || 'ALL'}
                        </span>
                        {tpl.isPreset ? (
                          <span className="text-[10px] font-bold text-slate-400">System Preset</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (tpl._id) handleDeleteTemplate(tpl._id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete custom template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 font-display">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {tpl.description || tpl.customInstructions || tpl.subjectName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span>{tpl.questionCount} Questions ({tpl.optionsCount} Options)</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {isSelected ? 'Selected ✓' : 'Use Template →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Settings & Parameters */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Template Specifications & Examination Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Quiz Title */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Examination / Quiz Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Biology & Physiology - Cell Structure Unit Assessment"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala"
                />
              </div>

              {/* Target Batch / Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Audience / Student Batch *
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">🌍 Open to Everyone</option>
                  {availableCategories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      🎓 {cat.name}
                    </option>
                  ))}
                  {availableCategories.length === 0 && (
                    <>
                      <option value="2027 A/L">🎓 2027 A/L</option>
                      <option value="2026 A/L">🎓 2026 A/L</option>
                      <option value="2025 A/L">🎓 2025 A/L</option>
                    </>
                  )}
                </select>
              </div>

              {/* Subject */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Subject *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectModalOpen(true)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    + Add Subject
                  </button>
                </div>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Biology, Chemistry, Physics, Combined Mathematics"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala"
                />
              </div>

              {/* Unit / Topic Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Unit / Focus Topic
                </label>
                <input
                  type="text"
                  value={defaultTopicName}
                  onChange={(e) => setDefaultTopicName(e.target.value)}
                  placeholder="e.g. Cellular Respiration, Photosynthesis, Dynamics"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala"
                />
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Question Count: <strong className="text-blue-600">{questionCount}</strong>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[5, 10, 15, 20, 25, 40, 50].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        questionCount === count
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  MCQ Options Count
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOptionsCount(5)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      optionsCount === 5
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    5 Options (A, B, C, D, E) — A/L Style
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptionsCount(4)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      optionsCount === 4
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    4 Options (A, B, C, D) — O/L Style
                  </button>
                </div>
              </div>

              {/* Question Format */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Question Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionFormat('MCQ_ONLY')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      questionFormat === 'MCQ_ONLY'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🔘 Multiple Choice (MCQ) Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionFormat('MIXED');
                      if (shortAnswerCount === 0) setShortAnswerCount(Math.max(1, Math.floor(questionCount / 3)));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      questionFormat === 'MIXED'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🔀 Mixed (MCQ + Short Answer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionFormat('SHORT_ANSWER_ONLY')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      questionFormat === 'SHORT_ANSWER_ONLY'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    ✍️ Short Answer Only
                  </button>
                </div>

                {questionFormat === 'MIXED' && (
                  <div className="mt-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Short Answer Questions out of {questionCount}:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={questionCount - 1}
                      value={shortAnswerCount || 1}
                      onChange={(e) => setShortAnswerCount(Math.min(questionCount - 1, Math.max(1, Number(e.target.value))))}
                      className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                )}
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MIXED">⚖️ Balanced (Easy, Medium & Hard)</option>
                  <option value="EASY">🟢 Easy (Foundational Concepts)</option>
                  <option value="MEDIUM">🟡 Medium (Standard Exam Level)</option>
                  <option value="HARD">🔴 Hard (Advanced Analytical Level)</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ENGLISH">🌐 Standard English</option>
                  <option value="BILINGUAL">🌐 Bilingual (English + Sinhala Terms)</option>
                  <option value="ENGLISH">🇬🇧 English Medium</option>
                </select>
              </div>

              {/* Custom Directives / Teacher Guidelines */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Custom Instructor Directives / Instructions for AI
                </label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Focus on foundational principles and problem-solving scenarios. Include calculation and interpretation questions."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Admin's Own Essay Paper Upload (Not AI Generated) */}
              <div className="lg:col-span-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 sm:p-5 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-300 dark:border-amber-500/30">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Admin Essay Question Paper (Optional)
                          </h4>
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                            Manual Upload • Not AI
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Essay papers are uploaded directly by instructors. Attach your PDF/Word document here.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasEssay(!hasEssay)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                        hasEssay
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {hasEssay ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      <span>{hasEssay ? 'Essay Paper Enabled' : 'Enable Essay Paper'}</span>
                    </button>
                  </div>

                  {hasEssay && (
                    <div className="space-y-4 pt-3 border-t border-amber-200/60 dark:border-amber-500/20 animate-in fade-in duration-200">
                      {/* File selector for Admin's Own Essay Paper */}
                      <div className="p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Upload Your Own Essay Question Paper File (PDF / Word)
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <label className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 rounded-xl text-xs font-bold cursor-pointer transition-colors w-fit">
                            <UploadCloud className="w-4 h-4" />
                            <span>{essayFile ? 'Change Essay Paper File' : 'Select Essay Paper Document (PDF/Doc)'}</span>
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
                          {essayFile && (
                            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 max-w-full min-w-0">
                              <Paperclip className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="truncate min-w-0 flex-1 max-w-[180px] sm:max-w-xs" title={essayFile.name}>
                                {essayFile.name}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                                ({(essayFile.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Students will download this document during their allocated essay time window, solve on paper, and upload answer sheets.
                        </p>
                      </div>

                      {/* Marks & Timing Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Essay Total Marks *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={essayTotalMarks}
                            onChange={(e) => setEssayTotalMarks(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Essay Start Time (SLST) *
                          </label>
                          <input
                            type="datetime-local"
                            value={essayStartTime}
                            onChange={(e) => setEssayStartTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Essay Deadline (SLST) *
                          </label>
                          <input
                            type="datetime-local"
                            value={essayEndTime}
                            onChange={(e) => setEssayEndTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Student Instructions */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Essay Instructions for Students
                        </label>
                        <textarea
                          rows={2}
                          value={essayInstructions}
                          onChange={(e) => setEssayInstructions(e.target.value)}
                          placeholder="e.g. Answer any 4 questions. Upload your completed answer sheets as a clear PDF document."
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sinhala"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Syllabus Material Input Card */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-200 dark:border-violet-500/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Step 2: Upload Syllabus or Provide Notes
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload your syllabus document (PDF/Word) or paste syllabus modules & notes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'upload'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  📄 Upload Document (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'text'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  ✍️ Paste Notes / Outline
                </button>
              </div>
            </div>

            {inputMode === 'upload' ? (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 sm:p-8 text-center hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-950/40">
                <input
                  type="file"
                  id="syllabusFileInput"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSyllabusFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="syllabusFileInput" className="cursor-pointer space-y-3 block">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-500/20 shadow-inner">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                      {syllabusFile ? syllabusFile.name : 'Click to select Syllabus PDF or Document'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      {syllabusFile
                        ? `File size: ${(syllabusFile.size / (1024 * 1024)).toFixed(2)} MB — Ready for AI analysis`
                        : 'Supports Sri Lankan National Syllabus PDF, Teacher Guides, Past Paper Topics (Up to 25MB)'}
                    </span>
                  </div>
                  <span className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all">
                    {syllabusFile ? 'Change Syllabus File' : 'Browse File on Device'}
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Paste Syllabus Modules, Lessons, or Specific Question Topics *
                </label>
                <textarea
                  rows={8}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder={`Paste curriculum notes or syllabus topics here:

1. Cellular Biology:
- Fluid Mosaic Model of cell membrane
- Prokaryotic vs eukaryotic cell structures
- Organelle functions (Mitochondria, Chloroplasts, Ribosomes)

2. Cell Division:
- Phases of Mitosis and biological importance of Meiosis...`}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala leading-relaxed"
                />
              </div>
            )}

            {/* Error Banner */}
            {genError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Question Generation Error</strong>
                  <span>{genError}</span>
                </div>
              </div>
            )}

            {/* Trigger Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={generating}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-60 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Questions with AI...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 text-amber-300" />
                    <span>Generate {questionCount} Questions with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 3: Interactive Review & Customization Studio */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Success & Quick Bar */}
          <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 font-display">
                  {genSuccessMsg || 'AI questions generated successfully!'}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {editingQuestions.length} Questions Generated • Model: {modelUsed || 'Gemini 2.5'} • Review and customize below before publishing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Start over and generate new questions?')) {
                    setPdfImport(null);
                    setEditingQuestions([]);
                  }
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Start Over
              </button>
              <button
                type="button"
                onClick={handleSaveDraftQuestions}
                disabled={savingQuestions}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                <Save className="w-3.5 h-3.5 inline mr-1" />
                {savingQuestions ? 'Saving...' : 'Save Draft Edits'}
              </button>
            </div>
          </div>

          {/* Questions Action Controls Bar */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Total Questions: <strong className="text-blue-600 dark:text-blue-400">{editingQuestions.length}</strong>
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Total Marks:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {editingQuestions.reduce((sum, q) => sum + (q.marks || 1), 0)}
                </strong>
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Target: <strong className="text-amber-600 dark:text-amber-400">{targetCategory}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Bulk Marks:</span>
              {[1, 2, 4, 5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyBulkMarks(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    bulkMarks === preset
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {preset} {preset === 1 ? 'Mark' : 'Marks'}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors ml-2"
              >
                + Add Question
              </button>
            </div>
          </div>

          {/* Questions Cards List */}
          <div className="space-y-5">
            {editingQuestions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 text-left"
              >
                {/* Header of Question Card */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono font-black text-xs rounded-xl border border-blue-200 dark:border-blue-500/20">
                      Question #{q.questionNumber || qIdx + 1}
                    </span>

                    {/* Question Type Toggle */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          handleQuestionChange(qIdx, 'questionType', 'MCQ');
                          if (!q.options || q.options.length === 0) {
                            const allowedKeys = ['A', 'B', 'C', 'D', 'E'];
                            handleQuestionChange(
                              qIdx,
                              'options',
                              allowedKeys.slice(0, optionsCount).map((k) => ({ key: k, text: `Option ${k}` }))
                            );
                            handleQuestionChange(qIdx, 'correctAnswer', 'A');
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          (q.questionType || 'MCQ') === 'MCQ'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        🔘 MCQ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleQuestionChange(qIdx, 'questionType', 'SHORT_ANSWER');
                          handleQuestionChange(qIdx, 'options', []);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          q.questionType === 'SHORT_ANSWER'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        ✍️ Short Answer
                      </button>
                    </div>

                    <input
                      type="text"
                      value={q.topicName || ''}
                      onChange={(e) => handleQuestionChange(qIdx, 'topicName', e.target.value)}
                      placeholder="Topic Name"
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">Marks:</span>
                      <input
                        type="number"
                        min="1"
                        value={q.marks || 1}
                        onChange={(e) => handleQuestionChange(qIdx, 'marks', Number(e.target.value))}
                        className="w-14 px-2 py-0.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Stem Text Area */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Question Stem
                  </label>
                  <textarea
                    rows={3}
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-sinhala leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {q.questionText.includes('$') && (
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-400 block mb-1">LaTeX Math Live Preview:</span>
                      <MathRenderer text={q.questionText} />
                    </div>
                  )}
                </div>

                {/* Diagram / Image Uploader for Question */}
                <div className="pt-1">
                  <QuestionImageUploader
                    imageUrl={q.imageUrl}
                    imageCaption={q.imageCaption}
                    onChange={(newUrl, newCaption) => {
                      handleQuestionChange(qIdx, 'imageUrl', newUrl);
                      handleQuestionChange(qIdx, 'imageCaption', newCaption);
                    }}
                  />
                </div>

                {q.questionType === 'SHORT_ANSWER' ? (
                  /* Short Answer Configuration */
                  <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1.5">
                        Model Short Answer *
                      </label>
                      <input
                        type="text"
                        value={q.correctAnswer || ''}
                        onChange={(e) => handleQuestionChange(qIdx, 'correctAnswer', e.target.value)}
                        placeholder="e.g. Photosynthesis, Mitochondria, or CO2"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950/90 border border-amber-300 dark:border-amber-700/60 rounded-xl text-slate-900 dark:text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-sinhala"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1.5">
                        Acceptable Alternatives / Synonyms (English, Sinhala, Singlish)
                      </label>
                      <input
                        type="text"
                        value={(q.acceptableAnswers || []).join(', ')}
                        onChange={(e) => {
                          const list = e.target.value.split(/[,;/|]+/).map((s) => s.trim()).filter(Boolean);
                          handleQuestionChange(qIdx, 'acceptableAnswers', list);
                        }}
                        placeholder="e.g. photosynthesis, prahasansleshana (comma separated)"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950/90 border border-amber-200 dark:border-amber-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-sinhala"
                      />
                      <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-1 flex items-center gap-1.5">
                        <span>💡</span> Natural language processing evaluates submitted answers in English, Sinhala, or Singlish accurately.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Options List */
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Options & Correct Answer
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctAnswer === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30'
                                : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleQuestionChange(qIdx, 'correctAnswer', opt.key)}
                              className={`w-7 h-7 rounded-lg text-xs font-black shrink-0 transition-colors cursor-pointer flex items-center justify-center ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white'
                              }`}
                              title={`Click to mark option ${opt.key} as correct`}
                            >
                              {opt.key}
                            </button>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              className="flex-1 bg-transparent border-0 text-xs sm:text-sm font-sinhala text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                            {isCorrect && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                                Correct ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Explanation Box */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Detailed Explanation
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation || ''}
                    onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                    placeholder="Explanation details..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-sinhala leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* STEP 4: Examination Publishing & Scheduling Card */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/20">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                  Publishing & Examination Scheduling
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select publishing window and activate this examination for your students.
                </p>
              </div>
            </div>

            {/* Live vs Scheduled Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPublishMode('LIVE')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                  publishMode === 'LIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    publishMode === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">Publish Live Immediately</span>
                  <span className="block text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Publish Live Immediately</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Quiz becomes active right away.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPublishMode('SCHEDULED')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                  publishMode === 'SCHEDULED'
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    publishMode === 'SCHEDULED'
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">Schedule Quiz Period (SLST)</span>
                  <span className="block text-xs text-blue-600 dark:text-blue-400 mt-0.5">Schedule for Specific Time Window</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Set Sri Lankan Standard Time window.</p>
                </div>
              </button>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Quiz Allocated Duration (Minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Batch Category *
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold"
                >
                  <option value="ALL">🌍 Open to Everyone</option>
                  {availableCategories.map((c) => (
                    <option key={c._id} value={c.name}>
                      🎓 {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multi-Day Schedule Picker when SCHEDULED */}
            {publishMode === 'SCHEDULED' && (
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
            )}

            {/* Full Paper Essay Configuration (Optional) */}
            <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                        Admin Essay Question Paper (Optional)
                      </h3>
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-lg uppercase">
                        Manual Upload • Not AI
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Essay papers are uploaded directly by instructors. Attach your PDF/Word document here.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHasEssay(!hasEssay)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
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
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 animate-in fade-in duration-300">
                  {/* Question Paper File Upload */}
                  <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 shadow-sm">
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
                      {essayFile && (
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 max-w-full min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                          <span className="truncate min-w-0 flex-1 max-w-[180px] sm:max-w-xs" title={essayFile.name}>
                            {essayFile.name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                            ({(essayFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Students will download this document during their allocated essay time window.
                    </p>
                  </div>

                  {/* Total Marks & Time Window */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">When students can download</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Essay Deadline (SLST) *
                      </label>
                      <input
                        type="datetime-local"
                        required={hasEssay}
                        value={essayEndTime}
                        onChange={(e) => setEssayEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Submission deadline</p>
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
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sinhala"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* One-Click Publish Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePublishQuiz}
                disabled={publishing}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-bold text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                {publishing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing Examination to System...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Create & Publish Examination</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {isSavingTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Save Template for Reusable AI Generation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSavingTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAsNewTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  placeholder="e.g. 2027 A/L Biology - Unit 3 25 MCQs"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Optional brief notes about when to use this template..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                <p>• Subject: <strong>{subjectName}</strong></p>
                <p>• Target Category: <strong>{targetCategory}</strong></p>
                <p>• Questions: <strong>{questionCount}</strong> ({optionsCount} options)</p>
                <p>• Language: <strong>{language}</strong></p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSavingTemplateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddSubjectModalOpen && (
        <AddSubjectModal
          isOpen={isAddSubjectModalOpen}
          onClose={() => setIsAddSubjectModalOpen(false)}
          onSubjectCreated={(newSub: Subject) => {
            setSubjects((prev) => [...prev, newSub]);
            setSubjectName(newSub.nameSi || newSub.nameEn);
            setIsAddSubjectModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
