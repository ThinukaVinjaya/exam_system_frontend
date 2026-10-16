import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Quiz, Question, QuizAttemptStart } from '../../types/index.js';
import { MathRenderer } from '../../components/MathRenderer.js';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  CheckCircle2,
  Bookmark,
  Play,
  ArrowRight,
  Award,
  CheckCircle,
  ShieldCheck,
  HelpCircle,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { formatSriLankanTimePeriod, formatSriLankanClockTime } from '../../utils/sriLankanTime.js';
import { QuestionImageViewer } from '../../components/QuestionImageViewer.js';
import { getQuestionImageUrl } from '../../utils/imageUrl.js';
import logoImg from '../../assets/logo.jpeg';
import { ThemeToggle } from '../../components/ThemeToggle.js';

export const QuizExamPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptStart | null>(null);
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [startingAttempt, setStartingAttempt] = useState<boolean>(false);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = React.useRef(false);
  submittingRef.current = submitting;

  const handleAutoSubmitRef = React.useRef<() => void>(() => {});

  const [autoSubmittedModal, setAutoSubmittedModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unansweredWarningModal, setUnansweredWarningModal] = useState(false);
  const [firstUnansweredIdx, setFirstUnansweredIdx] = useState<number>(-1);

  const [initError, setInitError] = useState<string | null>(null);

  // Check quiz status: if student already started an attempt, resume it; otherwise show briefing screen
  useEffect(() => {
    if (!quizId) return;
    let isCancelled = false;
    setLoading(true);
    setInitError(null);

    async function checkExamStatus() {
      try {
        const quizRes = await api.get(`/quizzes/${quizId}`);
        if (isCancelled) return;

        const qData: Quiz = quizRes.data.data;
        setQuiz(qData);

        // 1. If student has already completed this quiz, redirect directly to official results
        if (qData.hasCompleted && qData.resultId) {
          navigate(`/student/results/${qData.resultId}`);
          return;
        }

        // 2. If student ALREADY has an in-progress attempt, resume it immediately!
        if (qData.hasStarted) {
          const attemptRes = await api.post(`/quizzes/${quizId}/attempt`);
          if (isCancelled) return;

          if (attemptRes.data.alreadyCompleted || attemptRes.data.autoSubmitted) {
            navigate(`/student/results/${attemptRes.data.resultId}`);
            return;
          }

          const attData: QuizAttemptStart = attemptRes.data.data;
          if (attData) {
            if (attData.questions && attData.questions.length > 0) {
              qData.questions = attData.questions;
              setQuiz({ ...qData, questions: attData.questions });
            }
            setAttempt(attData);
            setSelectedAnswers(attData.savedAnswers || {});

            const initialSeconds = (typeof attData.timeRemainingSeconds === 'number' && attData.timeRemainingSeconds > 0)
              ? attData.timeRemainingSeconds
              : Math.max(0, Math.floor((new Date(attData.expectedEndTime).getTime() - Date.now()) / 1000));
            setTimeLeftSeconds(initialSeconds);
            setIsExamStarted(true);
          }
        } else {
          // 3. Student has NOT started yet. Show the Briefing Screen so countdown starts only on button click!
          setIsExamStarted(false);
        }
      } catch (err: any) {
        if (isCancelled) return;
        const msg = err.response?.data?.message || err.message || 'Unable to load examination session.';
        setInitError(msg);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    checkExamStatus();

    return () => {
      isCancelled = true;
    };
  }, [quizId, navigate]);

  // Handle explicit Start Exam click: Student's individual timer begins right now!
  const handleStartExam = async () => {
    if (startingAttempt || !quizId) return;
    setStartingAttempt(true);
    setInitError(null);

    try {
      const attemptRes = await api.post(`/quizzes/${quizId}/attempt`);
      if (attemptRes.data.alreadyCompleted || attemptRes.data.autoSubmitted) {
        navigate(`/student/results/${attemptRes.data.resultId}`);
        return;
      }

      const attData: QuizAttemptStart = attemptRes.data.data;
      if (!attData) {
        throw new Error('Examination attempt could not be initialized.');
      }

      let questionsList = attData.questions;
      if (!questionsList || questionsList.length === 0) {
        const quizRes = await api.get(`/quizzes/${quizId}`);
        questionsList = quizRes.data.data.questions;
        setQuiz(quizRes.data.data);
      } else {
        setQuiz((prev) => (prev ? { ...prev, questions: questionsList! } : prev));
      }

      setAttempt(attData);
      setSelectedAnswers(attData.savedAnswers || {});

      const initialSeconds = (typeof attData.timeRemainingSeconds === 'number' && attData.timeRemainingSeconds > 0)
        ? attData.timeRemainingSeconds
        : Math.max(0, Math.floor((new Date(attData.expectedEndTime).getTime() - Date.now()) / 1000));
      setTimeLeftSeconds(initialSeconds);
      setIsExamStarted(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to start examination.';
      setInitError(msg);
    } finally {
      setStartingAttempt(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (submittingRef.current || !attempt) return;
    submittingRef.current = true;
    setSubmitting(true);
    setAutoSubmittedModal(true);
    try {
      const res = await api.post(`/quizzes/attempts/${attempt.attemptId}/submit`);
      const resultId = res.data?.data?.resultId || res.data?.resultId;
      setTimeout(() => navigate(`/student/results/${resultId}`), 1800);
    } catch (err: any) {
      console.error('Auto submit error', err);
      try {
        const checkRes = await api.post(`/quizzes/${quizId}/attempt`);
        if (checkRes.data?.resultId) {
          setTimeout(() => navigate(`/student/results/${checkRes.data.resultId}`), 1500);
          return;
        }
      } catch (e) {
        // fallback
      }
      setTimeout(() => navigate('/student/dashboard'), 2000);
    }
  };

  handleAutoSubmitRef.current = handleAutoSubmit;

  // Monotonic timer based on attempt.timeRemainingSeconds and attempt.expectedEndTime
  useEffect(() => {
    if (!attempt) return;

    const initialSec =
      typeof attempt.timeRemainingSeconds === 'number' && attempt.timeRemainingSeconds > 0
        ? attempt.timeRemainingSeconds
        : Math.max(0, Math.floor((new Date(attempt.expectedEndTime).getTime() - Date.now()) / 1000));

    const startLocalMs = Date.now();

    const updateTimer = () => {
      const elapsedSec = Math.floor((Date.now() - startLocalMs) / 1000);
      const remainingSecs = Math.max(0, initialSec - elapsedSec);
      setTimeLeftSeconds(remainingSecs);

      if (remainingSecs <= 0) {
        if (!submittingRef.current) {
          handleAutoSubmitRef.current();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [attempt?.attemptId]);

  const textAnswerTimeoutRef = React.useRef<Record<string, any>>({});

  const handleSelectOption = async (questionId: string, optionKey: string) => {
    if (submitting) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionKey }));

    try {
      const res = await api.post(`/quizzes/attempts/${attempt?.attemptId}/answer`, {
        questionId,
        selectedOption: optionKey,
      });

      if (res.data.autoSubmitted) {
        setAutoSubmittedModal(true);
        setTimeout(() => navigate(`/student/results/${res.data.resultId}`), 2200);
      }
    } catch (err) {
      console.error('Failed to autosave answer', err);
    }
  };

  const handleTextAnswerChange = (questionId: string, text: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: text }));

    if (textAnswerTimeoutRef.current[questionId]) {
      clearTimeout(textAnswerTimeoutRef.current[questionId]);
    }
    textAnswerTimeoutRef.current[questionId] = setTimeout(() => {
      saveTextAnswer(questionId, text);
    }, 800);
  };

  const saveTextAnswer = async (questionId: string, text: string) => {
    if (submitting || !attempt?.attemptId) return;
    try {
      const res = await api.post(`/quizzes/attempts/${attempt.attemptId}/answer`, {
        questionId,
        textAnswer: text,
        selectedOption: text,
      });
      if (res.data.autoSubmitted) {
        setAutoSubmittedModal(true);
        setTimeout(() => navigate(`/student/results/${res.data.resultId}`), 2200);
      }
    } catch (err) {
      console.error('Failed to autosave short answer', err);
    }
  };

  const handleOpenSubmitCheck = () => {
    if (!quiz?.questions) return;
    const unansweredIndices: number[] = [];
    quiz.questions.forEach((q, idx) => {
      if (!selectedAnswers[q._id]) {
        unansweredIndices.push(idx);
      }
    });

    if (unansweredIndices.length > 0) {
      setFirstUnansweredIdx(unansweredIndices[0]);
      setUnansweredWarningModal(true);
      return;
    }

    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);
    try {
      const res = await api.post(`/quizzes/attempts/${attempt?.attemptId}/submit`);
      navigate(`/student/results/${res.data.data.resultId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit examination.');
      setSubmitting(false);
    }
  };

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Examination Notice</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sinhala">{initError}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-base text-slate-300">
            Loading examination details...
          </span>
        </div>
      </div>
    );
  }

  // Pre-Exam Briefing View: Shown before student starts. Their individual countdown begins ONLY on clicking Start Exam Now!
  if (!isExamStarted) {
    const quizNum = quiz.quizNumber || 1;
    const rawTitle = quiz.title || 'Curriculum Examination';
    const hasQuizPrefix = rawTitle.trim().toLowerCase().startsWith('quiz #');

    return (
      <div className="min-h-screen dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-800 flex flex-col justify-center items-center p-3 sm:p-6 font-sans select-none relative transition-colors duration-200">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <div className="max-w-2xl w-full dark:bg-slate-900/90 bg-white/95 backdrop-blur-2xl rounded-3xl border dark:border-slate-800 border-slate-200/90 shadow-xl shadow-slate-900/5 dark:shadow-2xl p-5 sm:p-8 space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b dark:border-slate-800 border-slate-200 pb-4">
            <div className="h-10 sm:h-12 px-2 py-1 bg-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center flex-shrink-0">
              <img src={logoImg} alt="ExamPortal Logo" className="h-full w-auto object-contain max-h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-3.5 py-1 rounded-xl text-xs sm:text-sm font-mono font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border border-blue-400/40 shadow-md shadow-blue-500/20 flex items-center gap-1.5 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  Exam #{quizNum}
                </span>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                  {((quiz as any).subjectId as any)?.nameEn || ((quiz as any).subjectId as any)?.nameSi || 'General Subject'}
                </span>
                {quiz.currentWindow ? (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Session Active
                  </span>
                ) : null}
              </div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-white font-sinhala leading-snug">
                {(rawTitle || '').replace(/^(quiz\s*#\d+\s*[-:]?\s*)+/i, '').trim()}
              </h1>
            </div>
          </div>

          {/* 3 Core Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 text-center space-y-1">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {quiz.durationMinutes} <span className="text-xs font-normal text-slate-400">Mins</span>
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Duration
              </div>
              <p className="text-[10px] text-blue-300/80 font-sinhala pt-1">
                Personal countdown begins once started
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 text-center space-y-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {quiz.totalQuestions || quiz.questions?.length || 0}
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Questions
              </div>
              <p className="text-[10px] text-emerald-300/80 font-sinhala pt-1">
                All questions compulsory
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 text-center space-y-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {quiz.totalMarks}
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Marks
              </div>
              <p className="text-[10px] text-amber-300/80 font-sinhala pt-1">
                Auto-submits on timer expiry
              </p>
            </div>
          </div>

          {/* Active Period / Multi-Day Schedule Notice */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/90 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300 flex-wrap gap-1">
              <span className="flex items-center gap-1.5 font-bold text-blue-300 text-[11px] sm:text-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {quiz.currentWindow?.label ? `Active Window (${quiz.currentWindow.label}):` : 'Exam Window:'}
              </span>
              <span className="font-mono font-bold text-emerald-400 text-[11px] sm:text-xs">
                {quiz.currentWindow
                  ? formatSriLankanTimePeriod(quiz.currentWindow.startTime, quiz.currentWindow.endTime)
                  : quiz.startTime && quiz.endTime
                  ? formatSriLankanTimePeriod(quiz.startTime, quiz.endTime)
                  : 'Open Period'}
              </span>
            </div>
            {quiz.scheduleWindows && quiz.scheduleWindows.length > 1 && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5">
                <span className="text-blue-300 font-bold">Multi-Day Schedule:</span>
                {quiz.scheduleWindows.map((w, idx) => (
                  <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300 font-mono text-[10px]">
                    {w.label || `Day ${idx + 1}`}: {formatSriLankanTimePeriod(w.startTime, w.endTime)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Exam Rules & Guidelines */}
          <div className="p-3.5 sm:p-4 bg-blue-950/20 border border-blue-500/20 rounded-2xl space-y-2 text-xs text-slate-300 font-sinhala leading-relaxed">
            <h4 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Rules & Instructions:
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-[11px] sm:text-xs">
              <li>Your personal <strong>{quiz.durationMinutes}</strong>-minute countdown starts immediately upon clicking <strong>'Start Exam Now'</strong>.</li>
              <li>All questions must be answered to complete the examination.</li>
              <li>Questions and answer options are randomly shuffled for each candidate.</li>
              <li>Answers are automatically submitted when your timer expires (Auto-Submit).</li>
              <li>Official National, Provincial, and District rankings are computed automatically after the final scheduled window closes.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-semibold text-xs transition-colors text-center order-2 sm:order-1"
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              onClick={handleStartExam}
              disabled={startingAttempt}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 order-1 sm:order-2"
            >
              {startingAttempt ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting examination...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Exam Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">No Questions Found</h2>
          <p className="text-xs text-slate-400">No questions available for this examination.</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion: Question = quiz.questions[currentQuestionIdx];
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeftSeconds < 180; // Less than 3 minutes remaining
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = quiz.questions.length;
  const examQuizNum = quiz.quizNumber || 1;
  const examRawTitle = quiz.title || 'Curriculum Examination';
  const examHasQuizPrefix = examRawTitle.trim().toLowerCase().startsWith('quiz #');

  return (
    <div className="min-h-screen dark:bg-slate-950/75 bg-slate-50 dark:text-slate-100 text-slate-800 flex flex-col font-sans select-none transition-colors duration-200">
      {/* Top Fixed Header with Timer & Closes At */}
      <header className="dark:bg-slate-900/90 bg-white/95 backdrop-blur-xl border-b dark:border-slate-800 border-slate-200 dark:text-white text-slate-900 px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-md shadow-slate-900/5 dark:shadow-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 sm:h-9 px-1.5 py-0.5 bg-white rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-center flex-shrink-0">
              <img src={logoImg} alt="ExamPortal Logo" className="h-full w-auto object-contain max-h-6" />
            </div>
            <span className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-mono font-black text-xs sm:text-sm rounded-xl shadow-md border border-blue-400/40 flex items-center gap-1 flex-shrink-0">
              Exam #{examQuizNum}
            </span>
            <div className="min-w-0">
              <h1 className="font-bold text-xs sm:text-base dark:text-white text-slate-900 font-sinhala leading-tight truncate">
                {(examRawTitle || '').replace(/^(quiz\s*#\d+\s*[-:]?\s*)+/i, '').trim()}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>
                  Q {currentQuestionIdx + 1} / {totalQuestions}
                </span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {answeredCount} / {totalQuestions} Answered
                </span>
                {quiz.currentWindow ? (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 font-mono text-[10px] sm:text-xs dark:bg-emerald-950/60 bg-emerald-50 border dark:border-emerald-800/60 border-emerald-200 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      {quiz.currentWindow.label ? `${quiz.currentWindow.label}: ` : ''}
                      {formatSriLankanTimePeriod(quiz.currentWindow.startTime, quiz.currentWindow.endTime)}
                    </span>
                  </>
                ) : quiz.startTime && quiz.endTime ? (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-300 font-mono text-[10px] sm:text-xs dark:bg-blue-950/60 bg-blue-50 border dark:border-blue-800/60 border-blue-200 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-blue-500" />
                      {formatSriLankanTimePeriod(quiz.startTime, quiz.endTime)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Student Individual Countdown Timer Capsule + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeToggle />
            <div className="flex flex-col items-end">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-sinhala">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Time Remaining
              </span>
              <div
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl font-mono text-sm sm:text-2xl font-black border transition-all ${
                  isLowTime
                    ? 'dark:bg-rose-950/90 bg-rose-50 border-rose-500 text-rose-600 dark:text-rose-300 animate-pulse shadow-lg shadow-rose-900/40'
                    : 'dark:bg-slate-950/90 bg-slate-100/90 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-md'
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-current animate-pulse" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Active Exam Status & Instructions Banner */}
      <div className="dark:bg-slate-900/60 bg-slate-100/90 border-b dark:border-slate-800/80 border-slate-200 px-3 sm:px-6 py-2 text-[11px] sm:text-xs dark:text-slate-300 text-slate-600 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2 font-sinhala truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span>⏱️ Auto-submits on timer expiry. All questions must be completed.</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex-shrink-0 font-bold hidden sm:block">
          1 Attempt
        </div>
      </div>

      {/* Main Examination Work Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
        {/* Question Panel */}
        <div className="lg:col-span-3 dark:bg-slate-900/70 bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border dark:border-slate-800 border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4 sm:space-y-6">
            {/* Mobile Horizontal Question Strip */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 border-b dark:border-slate-800/60 border-slate-200 scrollbar-none">
              {quiz.questions.map((q, idx) => {
                const isAnswered = Boolean(selectedAnswers[q._id]);
                const isCurrent = idx === currentQuestionIdx;
                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold text-xs flex-shrink-0 transition-all flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-blue-500 bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : isAnswered
                        ? 'dark:bg-emerald-500/20 bg-emerald-100 text-emerald-700 dark:text-emerald-300 border dark:border-emerald-500/40 border-emerald-300'
                        : 'dark:bg-slate-950 bg-slate-100 text-slate-600 dark:text-slate-400 border dark:border-slate-800 border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-xs pb-3 sm:pb-4 border-b dark:border-slate-800/80 border-slate-200">
              <span className="font-extrabold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2.5 sm:px-3 py-1 rounded-xl uppercase tracking-wider text-[11px] sm:text-xs">
                Question {currentQuestionIdx + 1}
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-semibold dark:bg-slate-950/60 bg-slate-100 px-2.5 py-1 rounded-lg border dark:border-slate-800 border-slate-200 text-[11px] sm:text-xs">
                Marks: {currentQuestion.marks || 1}
              </span>
            </div>

            {/* Question Text (Supports Sinhala Unicode & LaTeX) */}
            <div className="text-base sm:text-xl font-medium dark:text-slate-100 text-slate-800 leading-relaxed font-sinhala">
              <MathRenderer text={currentQuestion.questionText} />
            </div>

            {/* Question Diagram / Image */}
            {currentQuestion.imageUrl && (
              <QuestionImageViewer
                imageUrl={currentQuestion.imageUrl}
                imageCaption={currentQuestion.imageCaption}
                altText={`Question ${currentQuestionIdx + 1} Diagram`}
              />
            )}

            {/* Answer Interface: Short Answer Text Input vs MCQ Options Grid */}
            {currentQuestion.questionType === 'SHORT_ANSWER' ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2.5 text-left">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <span>✍️</span> Short Answer Question
                  </div>
                  <p className="text-xs text-amber-900/90 dark:text-amber-200/90 font-sinhala leading-relaxed">
                    Enter a concise answer. Answers will be evaluated and scored accurately using natural language evaluation.
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Your Answer *
                  </label>
                  <textarea
                    rows={3}
                    value={selectedAnswers[currentQuestion._id] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleTextAnswerChange(currentQuestion._id, val);
                    }}
                    onBlur={(e) => {
                      saveTextAnswer(currentQuestion._id, e.target.value);
                    }}
                    placeholder="Type your answer here..."
                    className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm sm:text-base font-sinhala leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Auto-saved</span>
                    {selectedAnswers[currentQuestion._id] && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Answer recorded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Answer Options Grid */
              <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedAnswers[currentQuestion._id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion._id, opt.key)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex items-start gap-3 sm:gap-4 active:scale-[0.99] cursor-pointer ${
                        isSelected
                          ? 'dark:bg-blue-600/15 bg-blue-50 border-blue-500 dark:text-white text-slate-900 shadow-md shadow-blue-500/10'
                          : 'dark:bg-slate-950/50 bg-white dark:border-slate-800/80 border-slate-200 dark:text-slate-300 text-slate-700 dark:hover:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : 'dark:bg-slate-800 bg-slate-100 dark:border-slate-700 border-slate-200 dark:text-slate-400 text-slate-600'
                        }`}
                      >
                        {opt.key}
                      </div>
                      <div className="text-sm sm:text-base dark:text-slate-200 text-slate-800 pt-0.5 leading-relaxed font-sinhala flex-1">
                        <MathRenderer text={opt.text} />
                        {opt.imageUrl && (
                          <div className="mt-2 max-w-xs">
                            <img
                              src={getQuestionImageUrl(opt.imageUrl)}
                              alt={`Option ${opt.key}`}
                              className="max-h-32 rounded-lg object-contain border border-slate-700/60 bg-slate-900/60 p-1"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 sm:pt-8 mt-4 sm:mt-8 border-t border-slate-800/80 flex justify-between items-center gap-2">
            <button
              onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
              disabled={currentQuestionIdx === 0}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-2">
              {answeredCount === totalQuestions && currentQuestionIdx < totalQuestions - 1 && (
                <button
                  onClick={handleOpenSubmitCheck}
                  disabled={submitting}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" /> Submit Now
                </button>
              )}

              {currentQuestionIdx < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleOpenSubmitCheck}
                  disabled={submitting}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4" /> Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar (Hidden on mobile as top horizontal question strip is active) */}
        <div className="hidden lg:block bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-800 shadow-2xl h-fit space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">Question Palette</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Jump directly to any question</p>
          </div>

          {/* Time Window Strict Notice */}
          {quiz.startTime && quiz.endTime && (
            <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-2xl text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>Exam Window (SLST)</span>
              </div>
              <p className="font-mono text-white text-[11px] font-semibold">
                {formatSriLankanTimePeriod(quiz.startTime, quiz.endTime)}
              </p>
              <p className="text-[10px] text-amber-300/90 leading-tight">
                ⚠️ All candidates must submit answers before the official closing time ({formatSriLankanClockTime(quiz.endTime)}).
              </p>
            </div>
          )}

          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((q, idx) => {
              const isAnswered = Boolean(selectedAnswers[q._id]);
              const isCurrent = idx === currentQuestionIdx;
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-950 border border-slate-800" />
              <span>Unanswered ({totalQuestions - answeredCount})</span>
            </div>
          </div>

          <button
            onClick={handleOpenSubmitCheck}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" /> Complete & Submit
          </button>
        </div>
      </main>

      {/* Unanswered Questions Warning Modal (Mandatory Questions Requirement) */}
      {unansweredWarningModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-white font-sinhala">
                All questions must be answered!
              </h2>
              <p className="text-xs text-amber-300 font-semibold font-sinhala">
                You still have {totalQuestions - answeredCount} unanswered questions.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sinhala">
                Under examination regulations, each candidate must provide an answer for every question. Please complete all questions and try again.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  if (firstUnansweredIdx >= 0) {
                    setCurrentQuestionIdx(firstUnansweredIdx);
                  }
                  setUnansweredWarningModal(false);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                Go to Question {firstUnansweredIdx + 1}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white font-display">Submit Examination?</h2>
              <p className="text-xs text-slate-400">
                You have answered <span className="font-bold text-emerald-400">{answeredCount}</span> out of{' '}
                <span className="font-bold text-white">{totalQuestions}</span> questions.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Review Answers
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Submit Modal */}
      {autoSubmittedModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white font-display">Time Expired!</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your allotted time has finished. Your answers have been automatically submitted to the system. Redirecting to your performance results...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
