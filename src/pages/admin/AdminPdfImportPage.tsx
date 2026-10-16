import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { PdfImport, ParsedQuestionItem } from '../../types/index.js';
import { MathRenderer } from '../../components/MathRenderer.js';
import { UnicodeSymbolToolbar } from '../../components/UnicodeSymbolToolbar.js';
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  FileText,
  ArrowRight,
  Save,
  Sparkles,
  Copy,
  Check,
  FileCode,
  Info,
  Download,
  Layers,
  Target,
  Clock,
  Type,
  Calendar,
  Award,
  ShieldCheck,
  GraduationCap,
  Users,
  Hash,
  CheckSquare,
  Square,
  UploadCloud,
  Paperclip,
} from 'lucide-react';
import { toSriLankanInputString, fromSriLankanInputString, formatSriLankanTimePeriod } from '../../utils/sriLankanTime.js';
import { MultiDaySchedulePicker, IScheduleSlot } from '../../components/MultiDaySchedulePicker.js';
import { QuestionImageUploader } from '../../components/QuestionImageUploader.js';
import { AddSubjectModal } from '../../components/AddSubjectModal.js';

export const AdminPdfImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [availableCategories, setAvailableCategories] = useState<{ _id: string; name: string }[]>([]);
  const [targetCategory, setTargetCategory] = useState<string>('ALL');
  const [importMode, setImportMode] = useState<'text' | 'pdf'>('text');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfImport, setPdfImport] = useState<PdfImport | null>(null);
  const [editingQuestions, setEditingQuestions] = useState<ParsedQuestionItem[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedFont, setSelectedFont] = useState<'noto-regular' | 'noto-bold' | 'arial'>('noto-regular');
  const [activeTab, setActiveTab] = useState<'multi-topic' | 'sinhala' | 'english' | 'math' | 'short-answer' | 'mixed'>('multi-topic');
  const [copied, setCopied] = useState(false);
  const [publishMode, setPublishMode] = useState<'LIVE' | 'SCHEDULED'>('LIVE');
  const [scheduledStartTime, setScheduledStartTime] = useState<string>(() => {
    return toSriLankanInputString(new Date());
  });
  const [scheduledEndTime, setScheduledEndTime] = useState<string>(() => {
    return toSriLankanInputString(new Date(Date.now() + 30 * 60 * 1000));
  });
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
  const [publishing, setPublishing] = useState(false);
  const [nextQuizNumber, setNextQuizNumber] = useState<number | null>(null);
  const [customQuizNumber, setCustomQuizNumber] = useState<string>('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [bulkMarks, setBulkMarks] = useState<number>(1);
  const [maxPdfSizeMb, setMaxPdfSizeMb] = useState<number>(20);
  const [fileSizeError, setFileSizeError] = useState<string>('');
  const [pdfUploadConfig, setPdfUploadConfig] = useState<any>(null);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Full Paper Essay State
  const [hasEssay, setHasEssay] = useState(false);
  const [essayFile, setEssayFile] = useState<File | null>(null);
  const [essayTotalMarks, setEssayTotalMarks] = useState<number>(100);
  const [essayStartTime, setEssayStartTime] = useState<string>(() => {
    return toSriLankanInputString(new Date(Date.now() + 60 * 60 * 1000));
  });
  const [essayEndTime, setEssayEndTime] = useState<string>(() => {
    return toSriLankanInputString(new Date(Date.now() + 4 * 60 * 60 * 1000));
  });
  const [essayInstructions, setEssayInstructions] = useState<string>('');

  const handleResetImport = () => {
    setPdfImport(null);
    setFile(null);
    setFileSizeError('');
    setHasEssay(false);
    setEssayFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const autoMatchSubject = (subjectName?: string, subjectList: any[] = subjects) => {
    if (!subjectName || subjectList.length === 0) return '';
    const norm = subjectName.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (!norm) return '';
    const matched = subjectList.find((s) => {
      const sSi = (s.nameSi || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      const sEn = (s.nameEn || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      const sCode = (s.code || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      return (
        (norm && sSi.includes(norm)) ||
        (sSi && norm.includes(sSi)) ||
        (norm && sEn.includes(norm)) ||
        (sEn && norm.includes(sEn)) ||
        (norm && sCode.includes(norm)) ||
        (sCode && norm.includes(sCode))
      );
    });
    return matched ? matched._id : '';
  };

  useEffect(() => {
    api.get('/quizzes/next-number').then((res) => {
      if (res.data?.success && res.data?.data?.nextQuizNumber) {
        setNextQuizNumber(res.data.data.nextQuizNumber);
        setCustomQuizNumber((prev) => prev || String(res.data.data.nextQuizNumber));
      }
    }).catch(() => {});

    api.get('/meta/subjects').then((res) => {
      if (res.data?.success && res.data?.data) {
        setSubjects(res.data.data);
      }
    }).catch(() => {});

    api.get('/meta/categories').then((res) => {
      if (res.data?.success && res.data?.data) {
        setAvailableCategories(res.data.data);
      }
    }).catch(() => {});

    api.get('/admin/pdf/config').then((res) => {
      if (res.data?.success && res.data?.data) {
        setPdfUploadConfig(res.data.data);
        if (res.data.data.maxPdfSizeMb) {
          setMaxPdfSizeMb(res.data.data.maxPdfSizeMb);
        }
      }
    }).catch(() => {});
  }, []);

  const handleApplyBulkMarks = (newMarks: number) => {
    if (newMarks <= 0) return;
    setBulkMarks(newMarks);
    setEditingQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        marks: newMarks,
      }))
    );
  };

  const getFontClass = () => {
    switch (selectedFont) {
      case 'noto-bold':
        return 'font-sinhala-bold font-bold';
      case 'arial':
        return 'font-sinhala-arial';
      case 'noto-regular':
      default:
        return 'font-sinhala-regular font-normal';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const sizeMb = selected.size / (1024 * 1024);
      if (sizeMb > maxPdfSizeMb) {
        setFileSizeError(
          `Selected PDF file size (${sizeMb.toFixed(2)} MB) exceeds the administrator limit of ${maxPdfSizeMb} MB. Please select a smaller document.`
        );
        setFile(selected);
      } else {
        setFileSizeError('');
        setFile(selected);
      }
    }
  };

  const sortQuestionsMcqFirst = (list: ParsedQuestionItem[]) => {
    const mcqs = list.filter((q) => q.questionType !== 'SHORT_ANSWER');
    const shortAnswers = list.filter((q) => q.questionType === 'SHORT_ANSWER');
    return [...mcqs, ...shortAnswers].map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    }));
  };

  const handleUploadAndParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxPdfSizeMb) {
      alert(`Selected PDF file size (${sizeMb.toFixed(2)} MB) exceeds the administrator limit of ${maxPdfSizeMb} MB.`);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await api.post('/admin/pdf/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data: PdfImport = res.data.data;
      setPdfImport(data);
      const rawQuestionsList = (data.parsedQuestions || []).map((q) => ({
        ...q,
        marks: Number(bulkMarks || q.marks || 1),
      }));
      const questionsList = sortQuestionsMcqFirst(rawQuestionsList);
      setEditingQuestions(questionsList);
      const calculatedDuration = questionsList.length > 0 ? Math.max(15, Math.ceil(questionsList.length * 1.5)) : 30;
      setDurationMinutes(calculatedDuration);
      const now = new Date();
      setScheduledStartTime(toSriLankanInputString(now));
      setScheduledEndTime(toSriLankanInputString(new Date(now.getTime() + calculatedDuration * 60000)));
      setEssayStartTime(toSriLankanInputString(new Date(now.getTime() + calculatedDuration * 60000)));
      setEssayEndTime(toSriLankanInputString(new Date(now.getTime() + (calculatedDuration + 180) * 60000)));
      setQuizTitle(
        `${data.subjectName || 'Science'} - ${data.topicName || 'Model Examination'}`
      );
      const matchedSub = autoMatchSubject(data.subjectName);
      if (matchedSub) {
        setSelectedSubjectId(matchedSub);
      }
      api.get('/quizzes/next-number').then((resNum) => {
        if (resNum.data?.success && resNum.data?.data?.nextQuizNumber) {
          setNextQuizNumber(resNum.data.data.nextQuizNumber);
          setCustomQuizNumber((prev) => prev || String(resNum.data.data.nextQuizNumber));
        }
      }).catch(() => {});
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to parse PDF document.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      alert('Please paste question text.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/pdf/text', { text: rawText });
      const data: PdfImport = res.data.data;
      setPdfImport(data);
      const rawQuestionsList = (data.parsedQuestions || []).map((q) => ({
        ...q,
        marks: Number(bulkMarks || q.marks || 1),
      }));
      const questionsList = sortQuestionsMcqFirst(rawQuestionsList);
      setEditingQuestions(questionsList);
      const calculatedDuration = questionsList.length > 0 ? Math.max(15, Math.ceil(questionsList.length * 1.5)) : 30;
      setDurationMinutes(calculatedDuration);
      const now = new Date();
      setScheduledStartTime(toSriLankanInputString(now));
      setScheduledEndTime(toSriLankanInputString(new Date(now.getTime() + calculatedDuration * 60000)));
      setEssayStartTime(toSriLankanInputString(new Date(now.getTime() + calculatedDuration * 60000)));
      setEssayEndTime(toSriLankanInputString(new Date(now.getTime() + (calculatedDuration + 180) * 60000)));
      setQuizTitle(
        `${data.subjectName || 'Science'} - ${data.topicName || 'Model Examination'}`
      );
      const matchedSub = autoMatchSubject(data.subjectName);
      if (matchedSub) {
        setSelectedSubjectId(matchedSub);
      }
      api.get('/quizzes/next-number').then((resNum) => {
        if (resNum.data?.success && resNum.data?.data?.nextQuizNumber) {
          setNextQuizNumber(resNum.data.data.nextQuizNumber);
          setCustomQuizNumber((prev) => prev || String(resNum.data.data.nextQuizNumber));
        }
      }).catch(() => {});
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to parse questions text.');
    } finally {
      setLoading(false);
    }
  };

  const handleInsertSymbolToText = (symbol: string) => {
    setRawText((prev) => prev + symbol);
  };

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    setEditingQuestions((prev) => {
      const copy = [...prev];
      (copy[idx] as any)[field] = value;
      return copy;
    });
  };

  const handleOptionChange = (qIdx: number, optKey: string, value: string) => {
    setEditingQuestions((prev) => {
      const copy = [...prev];
      const options = copy[qIdx].options.map((opt) => (opt.key === optKey ? { ...opt, text: value } : opt));
      copy[qIdx] = { ...copy[qIdx], options };
      return copy;
    });
  };

  const handlePublishAsQuiz = async () => {
    if (!pdfImport || publishing) return;
    const finalDuration = parseInt(String(durationMinutes), 10);
    if (isNaN(finalDuration) || finalDuration <= 0) {
      alert('Please enter a valid quiz duration in minutes.');
      return;
    }

    setPublishing(true);
    try {
      // First save edited questions
      await api.put(`/admin/pdf/${pdfImport._id}/questions`, {
        subjectName: pdfImport.subjectName,
        topicName: pdfImport.topicName,
        parsedQuestions: editingQuestions.map((q) => ({
          ...q,
          marks: Number(q.marks) || 1,
        })),
      });

      const payload: any = {
        title: quizTitle,
        durationMinutes: finalDuration,
        publishMode,
        subjectId: selectedSubjectId || undefined,
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

      // Convert to quiz with user-adjusted duration & Sri Lankan scheduling options
      const res = await api.post(`/admin/pdf/${pdfImport._id}/publish-quiz`, payload);
      const createdQuiz = res.data?.data;
      const newQuizId = createdQuiz?._id;

      if (hasEssay && essayFile && newQuizId) {
        const formData = new FormData();
        formData.append('file', essayFile);
        formData.append('essayTotalMarks', String(essayTotalMarks));
        formData.append('essayStartTime', fromSriLankanInputString(essayStartTime).toISOString());
        formData.append('essayEndTime', fromSriLankanInputString(essayEndTime).toISOString());
        formData.append('essayInstructions', essayInstructions);
        await api.post(`/admin/quizzes/${newQuizId}/essay-paper`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const qNum = createdQuiz?.quizNumber || nextQuizNumber || '';

      if (publishMode === 'SCHEDULED') {
        alert(`Quiz #${qNum} created and scheduled successfully in Sri Lankan Time!`);
      } else {
        alert(`Quiz #${qNum} created and published live successfully!`);
      }
      navigate('/admin/quizzes');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish examination.');
    } finally {
      setPublishing(false);
    }
  };

  const sampleTemplates = {
    'multi-topic': `SUBJECT: General Science

TOPIC: Biology

QUESTION 1: What is the primary gas absorbed by plants during photosynthesis?
A: Oxygen (O2)
B: Carbon Dioxide (CO2)
C: Nitrogen (N2)
D: Hydrogen (H2)
CORRECT: B
EXPLANATION: Plants absorb carbon dioxide from the atmosphere during photosynthesis.

QUESTION 2: What is the largest internal organ in the human body?
A: Heart
B: Lungs
C: Liver
D: Kidney
CORRECT: C

TOPIC: Physics

QUESTION 3: What is the standard SI unit of electric current?
A: Volt
B: Ampere
C: Ohm
D: Watt
CORRECT: B

QUESTION 4: What is the approximate acceleration due to gravity on the Earth's surface?
A: 9.8 m/s²
B: 3.0 × 10⁸ m/s
C: 6.67 × 10⁻¹¹ N
D: 1.6 × 10⁻¹⁹ C
CORRECT: A

TOPIC: Chemistry

QUESTION 5: What is the chemical formula of water?
A: H2O
B: CO2
C: NaCl
D: CH4
CORRECT: A`,

    sinhala: `SUBJECT: Biology
TOPIC: Cell Biology

QUESTION 1: What is the primary organelle responsible for ATP production in eukaryotic cells?
A: Ribosome
B: Mitochondria
C: Endoplasmic Reticulum
D: Golgi Apparatus
CORRECT: B

QUESTION 2: What is the largest internal organ in the human body?
A: Heart
B: Lungs
C: Liver
D: Kidney
CORRECT: C`,

    english: `SUBJECT: Science
TOPIC: Physics

QUESTION 1: What is the standard SI unit of electric current?
A: Volt
B: Ampere
C: Ohm
D: Watt
CORRECT: B

QUESTION 2: What is the approximate acceleration due to gravity on the Earth's surface?
A: 9.8 m/s²
B: 3.0 × 10⁸ m/s
C: 6.67 × 10⁻¹¹ N
D: 1.6 × 10⁻¹⁹ C
CORRECT: A`,

    math: `SUBJECT: Mathematics
TOPIC: Algebra & Geometry

QUESTION 1: If 2x + 5 = 15, what is the value of x?
A: 4
B: 5
C: 6
D: 10
CORRECT: B

QUESTION 2: What is the formula for the area of a circle with radius r?
A: 2πr
B: πr²
C: 4/3 πr³
D: 2πr²
CORRECT: B`,

    'short-answer': `SUBJECT: General Science
TOPIC: Plant Physiology

QUESTION 1: What is the primary pigment essential for photosynthesis in plants?
TYPE: SHORT_ANSWER
ANSWER: Chlorophyll
SYNONYMS: chlorophyll, chlorophyll a
EXPLANATION: Solar light is absorbed by chlorophyll during photosynthesis.

QUESTION 2: What protein carries oxygen throughout human blood?
TYPE: SHORT_ANSWER
ANSWER: Hemoglobin
SYNONYMS: hemoglobin, haemoglobin
EXPLANATION: Hemoglobin in red blood cells binds and transports oxygen molecules.

QUESTION 3: What is the powerhouse of the biological cell?
TYPE: SHORT_ANSWER
ANSWER: Mitochondria
SYNONYMS: mitochondrion, ATP powerhouse
EXPLANATION: Mitochondria produce ATP which is the cellular energy currency.

QUESTION 4: What is the chemical formula of carbon dioxide?
TYPE: SHORT_ANSWER
ANSWER: CO2
SYNONYMS: carbon dioxide, carbon dioxide gas
EXPLANATION: Chemical formula representing one carbon and two oxygen atoms.`,

    mixed: `SUBJECT: Science Examination
TOPIC: Biology & Physics

-- Part 1: Multiple Choice Questions --

QUESTION 1: What is the primary gas absorbed by plants during photosynthesis?
A: Oxygen (O2)
B: Carbon Dioxide (CO2)
C: Nitrogen (N2)
D: Hydrogen (H2)
CORRECT: B
EXPLANATION: Carbon dioxide is required for photosynthesis.

QUESTION 2: What is the largest internal organ in the human body?
A: Heart
B: Lungs
C: Liver
D: Kidney
CORRECT: C

QUESTION 3: What is the standard SI unit of electric current?
A: Volt
B: Ampere
C: Ohm
D: Watt
CORRECT: B

-- Part 2: Short Answer Questions --

QUESTION 4: What vascular tissue transports water and minerals up from plant roots?
TYPE: SHORT_ANSWER
ANSWER: Xylem
SYNONYMS: xylem, xylem tissue
EXPLANATION: Xylem vessels conduct water and dissolved minerals from roots to leaves.

QUESTION 5: What chemical formula represents carbon dioxide gas?
TYPE: SHORT_ANSWER
ANSWER: CO2
SYNONYMS: carbon dioxide, CO2 gas
EXPLANATION: Carbon dioxide molecule consists of one carbon and two oxygen atoms.`
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(sampleTemplates[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleTemplates[activeTab]], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab}_quiz_template.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            PDF Examination Question Import
          </h1>
          {nextQuizNumber && (
            <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-lg shadow-sm font-mono border border-blue-400/40">
              ✨ Next Exam #{nextQuizNumber}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload curriculum test papers to extract, verify, and publish Sinhala and English multiple choice questions with multi-topic support
        </p>
      </div>

      {/* Mode Selector & Input Area */}
      {!pdfImport && (
        <>
          <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 p-1.5 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setImportMode('text')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  importMode === 'text'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-200" />
                <span>Direct Text / Document Paste</span>
                <span className="hidden md:inline px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full border border-emerald-500/30">
                  100% Clean Sinhala
                </span>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('pdf')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  importMode === 'pdf'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900'
                }`}
              >
                <Upload className="w-4 h-4 text-blue-200" />
                <span>Upload PDF Document</span>
                <span className="px-2 py-0.5 bg-blue-400/20 text-blue-200 text-[10px] rounded-full border border-blue-400/30 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Auto-Parser
                </span>
              </button>
            </div>

            {/* Direct Text Paste Mode */}
            {importMode === 'text' && (
              <form onSubmit={handleTextParse} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      Paste Examination Questions Text
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Copy questions straight from Microsoft Word or Google Docs. Special characters, mathematical notations, and formatting remain preserved.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRawText(sampleTemplates['multi-topic'])}
                    className="self-start sm:self-auto px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Load Sample Sinhala Quiz
                  </button>
                </div>

                {/* Unicode Symbol Toolbar */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Sinhala Diacritics & Math Symbols Quick Inserter:
                  </span>
                  <UnicodeSymbolToolbar onInsertSymbol={handleInsertSymbolToText} />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Question Text & Multi-Topic Structure:
                  </label>
                  <textarea
                    rows={12}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="SUBJECT: Science&#10;&#10;TOPIC: Biology&#10;&#10;QUESTION 1: What gas is essential for photosynthesis in plants?&#10;A: Oxygen (O2)&#10;B: Carbon Dioxide (CO2)&#10;C: Nitrogen (N2)&#10;D: Hydrogen (H2)&#10;CORRECT: B&#10;EXPLANATION: Carbon dioxide is fixed during photosynthesis.&#10;&#10;TOPIC: Physics&#10;QUESTION 2: ..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-sinhala font-mono leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !rawText.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Parsing & Normalizing Sinhala Text...
                    </span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                      Extract & Verify Questions
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Upload PDF Mode */}
            {importMode === 'pdf' && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-md">
                  <Upload className="w-8 h-8" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    Automatic PDF Question Extraction
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Choose Examination PDF Document</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upload any examination PDF paper. The system reads Sinhala fonts (both modern Unicode & FM-Abhaya), cleans complex ligatures (kombuwa, bandi akuru), and extracts questions with 100% accuracy.
                  </p>

                  {/* Prominent Admin PDF Upload Limit & AI badges */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Admin PDF Upload Limit: <strong className="text-slate-900 dark:text-white">{maxPdfSizeMb} MB</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-sm">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      AI Multimodal Engine
                    </span>
                  </div>
                </div>

                <form onSubmit={handleUploadAndParse} className="max-w-md mx-auto space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    required
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-600 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer cursor-pointer bg-slate-50 dark:bg-slate-950/60 p-2 rounded-2xl border border-slate-200 dark:border-slate-800"
                  />

                  {/* Selected File Details / Size Indicator */}
                  {file && (
                    <div
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 text-left transition-all ${
                        file.size / (1024 * 1024) > maxPdfSizeMb
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-bold block truncate">{file.name}</span>
                          <span className="text-[11px] opacity-80">
                            Size: {(file.size / (1024 * 1024)).toFixed(2)} MB / Max {maxPdfSizeMb} MB
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase flex-shrink-0 border ${
                          file.size / (1024 * 1024) > maxPdfSizeMb
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        }`}
                      >
                        {file.size / (1024 * 1024) > maxPdfSizeMb ? 'Exceeds Limit' : 'Ready'}
                      </span>
                    </div>
                  )}

                  {fileSizeError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2 text-left">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      <span>{fileSizeError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !file || (file && file.size / (1024 * 1024) > maxPdfSizeMb)}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Extracting & Processing Sinhala Questions...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Upload & Extract Questions
                      </span>
                    )}
                  </button>
                </form>

                {/* AI & Account Limits Information Card */}
                <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 text-left space-y-3 max-w-xl mx-auto shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Document Upload & AI System Limits
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
                      System Quota
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                      <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Admin PDF Upload Limit
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold">
                        Maximum <strong className="text-slate-900 dark:text-white">{maxPdfSizeMb} MB</strong> per file
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        Configured in server environment. Covers full exam papers with diagrams and Sinhala typography.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        AI Engine Limits
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold">
                        Standard: <strong className="text-slate-900 dark:text-white">15 RPM / 1,500 RPD</strong>
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        Standard AI API keys allow 20MB inline payloads. 1-30 pages per PDF is recommended for fast extraction.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-[11px] text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span>
                      💡 <strong>Tip for very large documents (&gt;{maxPdfSizeMb}MB):</strong> Use the <strong>Raw Text Import</strong> tab to paste questions directly with zero file size restrictions!
                    </span>
                    <button
                      type="button"
                      onClick={() => setImportMode('text')}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex-shrink-0 text-[11px] transition-all self-start sm:self-auto cursor-pointer"
                    >
                      Use Text Mode
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive PDF Template Guide */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">PDF Question Format Template</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Copy or download this format to prepare your paper before saving as PDF</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  title="Download template as text file"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Download .TXT</span>
                </button>
                <button
                  onClick={handleCopyTemplate}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Template Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('multi-topic')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'multi-topic'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Multi-Topic Structure
              </button>
              <button
                onClick={() => setActiveTab('short-answer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'short-answer'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>✍️ Short Answer Only</span>
              </button>
              <button
                onClick={() => setActiveTab('mixed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'mixed'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>⚖️ Mixed Paper (MCQ + Short Answer)</span>
              </button>
              <button
                onClick={() => setActiveTab('sinhala')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sinhala'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Standard MCQ Format
              </button>
              <button
                onClick={() => setActiveTab('english')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'english'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                English Template
              </button>
              <button
                onClick={() => setActiveTab('math')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'math'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Math & Formulas (x², π)
              </button>
            </div>

            {/* Code / Text Block */}
            <div className="relative">
              <pre className="p-4 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-xs font-mono text-slate-900 dark:text-slate-200 overflow-x-auto leading-relaxed whitespace-pre font-sinhala">
                {sampleTemplates[activeTab]}
              </pre>
            </div>

            {/* Key Formatting Guidelines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-300 block flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Supported Fonts
                </span>
                <span>Fully supports <strong>Noto Sans Sinhala</strong>, <strong>Arial</strong>, Iskoola Pota, and FM-Abhaya with Unicode auto-recovery.</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-300 block flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> 1. Multiple Topics
                </span>
                <span>Place <code>TOPIC: Name</code> above question block to group by curriculum topic.</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-300 block">2. MCQ Selection Format</span>
                <span>Use <code>QUESTION 1:</code> with <code>A:</code>, <code>B:</code>, <code>C:</code>, <code>D:</code> and <code>CORRECT: A</code>.</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-1 sm:col-span-2 lg:col-span-3">
                <span className="font-bold text-purple-800 dark:text-purple-300 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> 3. Short Answer Questions & Synonym Evaluation
                </span>
                <span>
                  Use <code>TYPE: SHORT_ANSWER</code>, <code>ANSWER: Model Answer</code>, and optional <code>SYNONYMS: s1, s2</code>.
                  MCQ questions always stay continuous first, followed by all short answer questions. The system automatically detects similar answers, typos, transliterated Singlish, and English synonyms!
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Question Verification & Publishing View */}
      {pdfImport && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                    Parsing Completed
                  </span>
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-500/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-300" /> Auto Extracted
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display mt-2">
                  Verify Extracted Questions ({editingQuestions.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={handleResetImport}
                className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Upload Different / Re-upload PDF
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Exam # *
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
                  Sequential ID (e.g. #1)
                </p>
              </div>

              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Subject *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectModalOpen(true)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-500/25 transition-all cursor-pointer"
                  >
                    + Add New
                  </button>
                </div>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    const newSubId = e.target.value;
                    if (newSubId === '__ADD_NEW__') {
                      setIsAddSubjectModalOpen(true);
                      return;
                    }
                    setSelectedSubjectId(newSubId);
                    const found = subjects.find((s) => s._id === newSubId);
                    if (found && pdfImport) {
                      setQuizTitle(`${found.nameEn || found.nameSi} - ${pdfImport.topicName || 'Model Examination'}`);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 font-sinhala"
                >
                  <option value="">-- Auto-detect ({pdfImport.subjectName || 'Curriculum'}) --</option>
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

              <div className="lg:col-span-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Quiz Title *
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold ${getFontClass()}`}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Exams can share title — tracked as Exam #{customQuizNumber || nextQuizNumber || 1}.
                </p>
              </div>

              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Quiz Time (Minutes) *
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {editingQuestions.length > 0
                      ? `~${(durationMinutes / editingQuestions.length).toFixed(1)}m / Q`
                      : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    required
                    value={durationMinutes}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      setDurationMinutes(val);
                      const start = fromSriLankanInputString(scheduledStartTime);
                      const end = new Date(start.getTime() + val * 60000);
                      setScheduledEndTime(toSriLankanInputString(end));
                    }}
                    className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-bold text-center focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1 flex-wrap">
                    {[15, 30, 45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setDurationMinutes(mins);
                          const start = fromSriLankanInputString(scheduledStartTime);
                          const end = new Date(start.getTime() + mins * 60000);
                          setScheduledEndTime(toSriLankanInputString(end));
                        }}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          durationMinutes === mins
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Audience / Batch Category */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Target Audience / Student Batch *
                </label>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20">
                  {targetCategory === 'ALL' ? '🌍 Open to Everyone' : `🎓 Only for ${targetCategory}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetCategory('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
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
            </div>

            {/* Sinhala Font Preview Selector */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sinhala Font Display:
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  (Toggle font to preview extracted text)
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedFont('noto-regular')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedFont === 'noto-regular'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Noto Sans Sinhala Regular
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFont('noto-bold')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedFont === 'noto-bold'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Noto Sans Sinhala Bold
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFont('arial')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedFont === 'arial'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Arial (Sinhala)
                </button>
              </div>
            </div>
          </div>

          {/* Detected Topics Summary */}
          {editingQuestions.length > 0 && (
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Identified Quiz Topics ({Array.from(new Set(editingQuestions.map((q) => q.topicName || 'General').filter(Boolean))).length}):
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from(new Set(editingQuestions.map((q) => q.topicName || 'General').filter(Boolean))).map((topic, i) => (
                  <span key={i} className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-lg font-sinhala">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Marks Configuration Toolbar */}
          {editingQuestions.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 via-amber-50/50 to-slate-50 dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 border border-amber-200 dark:border-amber-500/25 rounded-2xl p-4 sm:p-5 shadow-md dark:shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Default Marks per Question</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Change the mark once to update all {editingQuestions.length} extracted questions simultaneously.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    Total Questions: <strong className="text-emerald-600 dark:text-emerald-400">{editingQuestions.length}</strong>
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    Total Marks: <strong className="text-amber-600 dark:text-amber-400">{editingQuestions.reduce((a, q) => a + (q.marks || 1), 0)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mark value:</label>
                  <input
                    type="number"
                    min="1"
                    value={bulkMarks}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBulkMarks(val);
                    }}
                    className="w-20 px-3 py-1.5 bg-white dark:bg-slate-950/80 border border-amber-300 dark:border-amber-500/40 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-bold text-center focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyBulkMarks(bulkMarks)}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-white" /> Apply to All {editingQuestions.length} Questions
                </button>

                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Quick presets:</span>
                  {[1, 2, 4, 5].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyBulkMarks(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        bulkMarks === preset
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
          )}

          <div className="space-y-4">
            {editingQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20">
                      Question {q.questionNumber || idx + 1}
                    </span>

                    {/* Question Type Switcher */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          handleQuestionChange(idx, 'questionType', 'MCQ');
                          if (!q.options || q.options.length === 0) {
                            handleQuestionChange(idx, 'options', [
                              { key: 'A', text: 'Option A' },
                              { key: 'B', text: 'Option B' },
                              { key: 'C', text: 'Option C' },
                              { key: 'D', text: 'Option D' },
                            ]);
                            handleQuestionChange(idx, 'correctAnswer', 'A');
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
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
                          handleQuestionChange(idx, 'questionType', 'SHORT_ANSWER');
                          handleQuestionChange(idx, 'options', []);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          q.questionType === 'SHORT_ANSWER'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        ✍️ Short Answer
                      </button>
                    </div>

                    {q.topicName && (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 font-sinhala">
                        {q.topicName}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-600 dark:text-slate-400">
                    Correct: <strong className="text-emerald-600 dark:text-emerald-400">{q.correctAnswer || '(Not set)'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Curriculum Topic *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cell Biology, Organic Chemistry"
                      value={q.topicName || ''}
                      onChange={(e) => handleQuestionChange(idx, 'topicName', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-sinhala font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Explanation
                    </label>
                    <input
                      type="text"
                      placeholder="Optional explanation shown to students after submission"
                      value={q.explanation || ''}
                      onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-sinhala"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Question Text</label>
                  <textarea
                    rows={2}
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm leading-relaxed ${getFontClass()}`}
                  />
                </div>

                {/* Question Diagram / Image Uploader */}
                <QuestionImageUploader
                  imageUrl={q.imageUrl}
                  imageCaption={q.imageCaption}
                  questionNumberLabel={`Question ${q.questionNumber || idx + 1}`}
                  onChange={(newUrl, newCaption) => {
                    setEditingQuestions((prev) => {
                      const copy = [...prev];
                      copy[idx] = {
                        ...copy[idx],
                        imageUrl: newUrl,
                        imageCaption: newCaption,
                      };
                      return copy;
                    });
                  }}
                />

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
                        onChange={(e) => handleQuestionChange(idx, 'correctAnswer', e.target.value)}
                        placeholder="e.g. Photosynthesis, Mitochondria, CO2"
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
                          handleQuestionChange(idx, 'acceptableAnswers', list);
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
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt) => (
                        <div key={opt.key}>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                            Option {opt.key}
                          </label>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionChange(idx, opt.key, e.target.value)}
                            className={`w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 text-xs ${getFontClass()}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Correct Answer
                        </label>
                        <select
                          value={q.correctAnswer}
                          onChange={(e) => handleQuestionChange(idx, 'correctAnswer', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-bold"
                        >
                          {q.options && q.options.length > 0 ? (
                            q.options.map((opt) => (
                              <option key={opt.key} value={opt.key}>
                                Option {opt.key}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="A">Option A</option>
                              <option value="B">Option B</option>
                              <option value="C">Option C</option>
                              <option value="D">Option D</option>
                              <option value="E">Option E</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Marks
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={q.marks || 1}
                          onChange={(e) => handleQuestionChange(idx, 'marks', Number(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Pre-Publish Quiz Timing Adjustment & Time Period Summary Card */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-blue-500/20 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                    Publishing Mode & Time Window *
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set the exact examination time period (e.g. 11:00 PM - 12:00 AM). Every student must answer within this window.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  Total Questions: <strong className="text-emerald-600 dark:text-emerald-400">{editingQuestions.length}</strong>
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  Total Marks: <strong className="text-amber-600 dark:text-amber-400">{editingQuestions.reduce((a, q) => a + (q.marks || 1), 0)}</strong>
                </span>
              </div>
            </div>

            {/* Publishing Mode Buttons */}
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
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Quiz activates immediately for the set duration window.</p>
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
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-blue-200 dark:border-blue-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Sri Lanka Standard Time (SLST / Asia/Colombo · UTC+05:30)
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 px-2.5 py-0.5 rounded-lg self-start sm:self-auto">
                  {publishMode === 'LIVE' ? 'Live Window Active' : 'Scheduled Window'}
                </span>
              </div>

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

              {/* Supplementary details */}
              <div className="p-4 bg-white dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs shadow-sm">
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span>⏱️ Allocated Quiz Time:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{durationMinutes} Minutes</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span>📝 Average Time Per Question:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {editingQuestions.length > 0
                      ? `${(durationMinutes / editingQuestions.length).toFixed(1)} Minutes`
                      : '0 Minutes'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span>🔤 Active Sinhala Font Preview:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {selectedFont === 'noto-bold'
                      ? 'Noto Sans Sinhala Bold'
                      : selectedFont === 'arial'
                      ? 'Arial (Sinhala)'
                      : 'Noto Sans Sinhala Regular'}
                  </span>
                </div>
              </div>
            </div>

            {/* Full Paper Essay Configuration Card */}
            <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                        Full Paper Essay
                      </h3>
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

            <div className="pt-2">
              <button
                type="button"
                onClick={handlePublishAsQuiz}
                disabled={publishing}
                className={`w-full py-4 text-white font-extrabold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer ${
                  publishing
                    ? 'bg-slate-700 cursor-not-allowed opacity-80'
                    : publishMode === 'SCHEDULED'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
                }`}
              >
                {publishing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing Quiz... Please wait</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {publishMode === 'SCHEDULED'
                      ? `Schedule Quiz (${durationMinutes} Mins Student Timer · ${editingQuestions.length} Questions)`
                      : `Publish Examination as Live Quiz (${durationMinutes} Mins Student Timer · ${editingQuestions.length} Questions)`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
          if (pdfImport) {
            setQuizTitle(`${newSub.nameEn || newSub.nameSi} - ${pdfImport.topicName || 'Model Examination'}`);
          }
        }}
      />
    </div>
  );
};
