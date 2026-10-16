import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_BASE_URL } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { EssaySubmission } from '../../types/index.js';
import {
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Search,
  Filter,
  CheckSquare,
  Square,
  Award,
  Sparkles,
  RefreshCw,
  LogOut,
  User,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Check,
  ExternalLink,
  Eye,
  Lock,
  Unlock,
  ChevronLeft,
  Maximize2,
  Minimize2,
  X,
  AlertTriangle,
  Send,
  ThumbsUp,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Brain,
  Calculator,
  ChevronDown,
  ChevronUp,
  Layers,
  Ban,
  SkipForward,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatSriLankanTime } from '../../utils/sriLankanTime.js';
import { EssayMarkingSchemeModal } from '../../components/EssayMarkingSchemeModal.js';
import logoImg from '../../assets/logo.jpeg';

export interface DynamicQuestionBox {
  id: string;
  questionNumber: string;
  marks: string;
  feedback?: string;
}

export const PanelDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<EssaySubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'MY_PAPERS' | 'AVAILABLE' | 'OTHERS' | 'MARKED'>('ALL');

  // Quizzes Overview Controls (for large number of exams)
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [quizStatusFilter, setQuizStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'RANKINGS_ACTIVE'>('ALL');
  const [quizPage, setQuizPage] = useState<number>(1);
  const quizPageSize = 9;

  // Submissions Pagination & Sorting (for large number of student papers)
  const [subPage, setSubPage] = useState<number>(1);
  const [subPageSize, setSubPageSize] = useState<number>(15); // 15, 30, 60, 100, -1 for All
  const [subSortBy, setSubSortBy] = useState<'UNMARKED_FIRST' | 'MARKED_FIRST' | 'NAME_ASC' | 'DEFAULT'>('UNMARKED_FIRST');

  // Active Marking State in Table & Studio
  const [editingMarks, setEditingMarks] = useState<
    Record<
      string,
      {
        marks: string;
        feedback: string;
        isMarked: boolean;
        boxes?: DynamicQuestionBox[];
        manualTotalOverridden?: boolean;
        questionMarks?: Record<string, { marks: string; feedback?: string }>;
      }
    >
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [generatingRanks, setGeneratingRanks] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // AI Assist State
  const [aiLoadingSubId, setAiLoadingSubId] = useState<string | null>(null);
  const [analyzingPaperQuizId, setAnalyzingPaperQuizId] = useState<string | null>(null);

  // In-Website PDF Preview & Live Marking Studio Modal State
  const [activeStudioSub, setActiveStudioSub] = useState<EssaySubmission | null>(null);
  const [studioFullscreen, setStudioFullscreen] = useState(false);
  const [studioSaving, setStudioSaving] = useState(false);
  const [studioMarkingMode, setStudioMarkingMode] = useState<'ONE_BY_ONE' | 'ALL'>('ONE_BY_ONE');
  const [studioActiveQuestionIdx, setStudioActiveQuestionIdx] = useState<number>(0);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);

  // In-Website PDF/Image Preview Loader State
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = useState<'PDF' | 'IMAGE' | 'OTHER'>('PDF');
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);

  const token = localStorage.getItem('accessToken') || '';

  const fetchQuizzes = () => {
    setLoading(true);
    api
      .get('/panel/quizzes')
      .then((res) => {
        setQuizzes(res.data?.data || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleSelectQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setLoadingSubmissions(true);
    setSearchQuery('');
    setAssignmentFilter('ALL');
    setSubPage(1);
    setSubSortBy('UNMARKED_FIRST');

    api
      .get(`/panel/quizzes/${quiz._id}/submissions`)
      .then((res) => {
        const subs: EssaySubmission[] = res.data?.data?.submissions || [];
        setSubmissions(subs);
        if (res.data?.data?.quiz) {
          setSelectedQuiz({ ...quiz, ...res.data.data.quiz });
        }
        const marksInit: Record<
          string,
          {
            marks: string;
            feedback: string;
            isMarked: boolean;
            boxes?: DynamicQuestionBox[];
            manualTotalOverridden?: boolean;
            questionMarks?: Record<string, { marks: string; feedback?: string }>;
          }
        > = {};
        subs.forEach((s) => {
          const qmMap: Record<string, { marks: string; feedback?: string }> = {};
          let boxes: DynamicQuestionBox[] = [];

          if (Array.isArray(s.questionMarks) && s.questionMarks.length > 0) {
            boxes = s.questionMarks.map((qm: any, idx: number) => {
              const key = `${qm.questionNumber}_${qm.partLabel || ''}`;
              qmMap[key] = {
                marks: qm.marksAwarded !== null && typeof qm.marksAwarded !== 'undefined' ? String(qm.marksAwarded) : '',
                feedback: qm.feedback || '',
              };
              const rawTitle = qm.title || '';
              const cleanQNum = rawTitle
                ? rawTitle.replace(/^Question\s*/i, '').replace(/^Q\s*/i, '').trim()
                : String(qm.questionNumber || idx + 1);
              return {
                id: `box-${s._id}-${idx + 1}-${Date.now()}`,
                questionNumber: cleanQNum || String(idx + 1),
                marks: qm.marksAwarded !== null && typeof qm.marksAwarded !== 'undefined' ? String(qm.marksAwarded) : '',
                feedback: qm.feedback || '',
              };
            });
          } else {
            boxes = [
              { id: `box-${s._id}-1`, questionNumber: '1', marks: '' },
              { id: `box-${s._id}-2`, questionNumber: '2', marks: '' },
              { id: `box-${s._id}-3`, questionNumber: '3', marks: '' },
              { id: `box-${s._id}-4`, questionNumber: '4', marks: '' },
              { id: `box-${s._id}-5`, questionNumber: '5', marks: '' },
            ];
          }

          const boxSum = boxes.reduce((acc, b) => acc + (Number(b.marks) || 0), 0);
          const totalVal = s.marksAwarded !== null && typeof s.marksAwarded !== 'undefined'
            ? String(s.marksAwarded)
            : (boxSum > 0 ? String(boxSum) : '');

          marksInit[s._id] = {
            marks: totalVal,
            feedback: s.feedback || '',
            isMarked: Boolean(s.isMarked),
            boxes,
            manualTotalOverridden: false,
            questionMarks: qmMap,
          };
        });
        setEditingMarks(marksInit);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoadingSubmissions(false));
  };

  // Reload submissions for current quiz
  const reloadSubmissions = async () => {
    if (!selectedQuiz) return;
    try {
      const res = await api.get(`/panel/quizzes/${selectedQuiz._id}/submissions`);
      const subs: EssaySubmission[] = res.data?.data?.submissions || [];
      setSubmissions(subs);
      const marksInit: Record<
        string,
        {
          marks: string;
          feedback: string;
          isMarked: boolean;
          boxes?: DynamicQuestionBox[];
          manualTotalOverridden?: boolean;
          questionMarks?: Record<string, { marks: string; feedback?: string }>;
        }
      > = {};
      subs.forEach((s) => {
        const qmMap: Record<string, { marks: string; feedback?: string }> = {};
        let boxes: DynamicQuestionBox[] = [];

        if (Array.isArray(s.questionMarks) && s.questionMarks.length > 0) {
          boxes = s.questionMarks.map((qm: any, idx: number) => {
            const key = `${qm.questionNumber}_${qm.partLabel || ''}`;
            qmMap[key] = {
              marks: qm.marksAwarded !== null && typeof qm.marksAwarded !== 'undefined' ? String(qm.marksAwarded) : '',
              feedback: qm.feedback || '',
            };
            const rawTitle = qm.title || '';
            const cleanQNum = rawTitle
              ? rawTitle.replace(/^Question\s*/i, '').replace(/^Q\s*/i, '').trim()
              : String(qm.questionNumber || idx + 1);
            return {
              id: `box-${s._id}-${idx + 1}-${Date.now()}`,
              questionNumber: cleanQNum || String(idx + 1),
              marks: qm.marksAwarded !== null && typeof qm.marksAwarded !== 'undefined' ? String(qm.marksAwarded) : '',
              feedback: qm.feedback || '',
            };
          });
        } else {
          boxes = [
            { id: `box-${s._id}-1`, questionNumber: '1', marks: '' },
            { id: `box-${s._id}-2`, questionNumber: '2', marks: '' },
            { id: `box-${s._id}-3`, questionNumber: '3', marks: '' },
            { id: `box-${s._id}-4`, questionNumber: '4', marks: '' },
            { id: `box-${s._id}-5`, questionNumber: '5', marks: '' },
          ];
        }

        const boxSum = boxes.reduce((acc, b) => acc + (Number(b.marks) || 0), 0);
        const totalVal = s.marksAwarded !== null && typeof s.marksAwarded !== 'undefined'
          ? String(s.marksAwarded)
          : (boxSum > 0 ? String(boxSum) : '');

        marksInit[s._id] = {
          marks: totalVal,
          feedback: s.feedback || '',
          isMarked: Boolean(s.isMarked),
          boxes,
          manualTotalOverridden: false,
          questionMarks: qmMap,
        };
      });
      setEditingMarks(marksInit);
      fetchQuizzes();
    } catch (err) {
      console.error(err);
    }
  };

  // Claim a paper exclusively
  const handleClaimPaper = async (submissionId: string, silent = false) => {
    setClaimingId(submissionId);
    try {
      const res = await api.post(`/panel/submissions/${submissionId}/claim`);
      const updatedData = res.data?.data;

      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === submissionId
            ? {
                ...s,
                claimedById: updatedData?.claimedById || user?.id,
                claimedByName: updatedData?.claimedByName || user?.fullName,
                claimedAt: updatedData?.claimedAt || new Date().toISOString(),
                isClaimedByMe: true,
                isClaimedByOther: false,
                assignedToName: updatedData?.claimedByName || user?.fullName,
              }
            : s
        )
      );

      if (activeStudioSub && activeStudioSub._id === submissionId) {
        setActiveStudioSub((prev) =>
          prev
            ? {
                ...prev,
                claimedById: updatedData?.claimedById || user?.id,
                claimedByName: updatedData?.claimedByName || user?.fullName,
                claimedAt: updatedData?.claimedAt || new Date().toISOString(),
                isClaimedByMe: true,
                isClaimedByOther: false,
                assignedToName: updatedData?.claimedByName || user?.fullName,
              }
            : null
        );
      }

      if (!silent) {
        setNotification({
          type: 'success',
          message: 'Paper locked to your account. Other examiners cannot mark this submission simultaneously.',
        });
        setTimeout(() => setNotification(null), 4000);
      }
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to claim paper.';
      setNotification({ type: 'error', message: msg });
      setTimeout(() => setNotification(null), 5000);
      return false;
    } finally {
      setClaimingId(null);
    }
  };

  // Release claimed paper back to available pool
  const handleUnclaimPaper = async (submissionId: string) => {
    setClaimingId(submissionId);
    try {
      await api.post(`/panel/submissions/${submissionId}/unclaim`);

      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === submissionId
            ? {
                ...s,
                claimedById: undefined,
                claimedByName: undefined,
                claimedAt: undefined,
                markedById: undefined,
                markedByName: undefined,
                markedAt: undefined,
                marksAwarded: undefined,
                isMarked: false,
                feedback: '',
                questionMarks: [],
                isClaimedByMe: false,
                isClaimedByOther: false,
                assignedToName: undefined,
              }
            : s
        )
      );

      // Clean local edit state
      setEditingMarks((prev) => {
        const copy = { ...prev };
        delete copy[submissionId];
        return copy;
      });

      if (activeStudioSub && activeStudioSub._id === submissionId) {
        setActiveStudioSub(null);
      }

      setNotification({
        type: 'success',
        message: 'Submission released back to the available evaluation pool.',
      });
      setTimeout(() => setNotification(null), 3500);
      fetchQuizzes();
      reloadSubmissions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to release paper.');
    } finally {
      setClaimingId(null);
    }
  };

  // Get flat list of question parts for granular question-by-question marking
  const getQuestionItems = (quiz: any) => {
    const rawQuestions = quiz?.essayQuestions || [];
    if (!rawQuestions.length) return [];
    const items: Array<{
      key: string;
      questionNumber: number;
      partLabel: string;
      title: string;
      description: string;
      maxMarks: number;
    }> = [];
    rawQuestions.forEach((q: any) => {
      const parts =
        q.parts && q.parts.length > 0
          ? q.parts
          : [{ partId: `q${q.questionNumber}_main`, partLabel: 'Full Question', maxMarks: q.maxMarks }];
      parts.forEach((p: any) => {
        items.push({
          key: `${q.questionNumber}_${p.partLabel || ''}`,
          questionNumber: q.questionNumber,
          partLabel: p.partLabel || '',
          title: q.title || `Question ${q.questionNumber}`,
          description: p.description || q.questionText || '',
          maxMarks: Number(p.maxMarks) || 0,
        });
      });
    });
    return items;
  };

  // Re-analyze or extract questions from question paper PDF using AI
  const handleAnalyzeQuestionPaper = async (quizId: string) => {
    setAnalyzingPaperQuizId(quizId);
    try {
      const res = await api.post(`/panel/quizzes/${quizId}/analyze-essay-paper`);
      const updated = res.data?.data;
      if (updated && selectedQuiz && selectedQuiz._id === quizId) {
        setSelectedQuiz({
          ...selectedQuiz,
          essayQuestions: updated.essayQuestions,
          essayTotalMarks: updated.essayTotalMarks,
          essayAnalysisStatus: updated.essayAnalysisStatus,
        });
      }
      setNotification({
        type: 'success',
        message: res.data?.message || 'Question paper analyzed with AI successfully!',
      });
      setTimeout(() => setNotification(null), 4000);
      fetchQuizzes();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to analyze question paper with AI.';
      alert(msg);
      setNotification({ type: 'error', message: msg });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setAnalyzingPaperQuizId(null);
    }
  };

  // AI examines student answer sheet and suggests marks for each question/part
  const handleAiSuggestMarks = async (submissionId: string) => {
    setAiLoadingSubId(submissionId);
    try {
      const res = await api.post(`/panel/submissions/${submissionId}/ai-suggest`);
      const aiData = res.data?.data;
      const evals = aiData?.evaluations || [];

      // Auto-populate questionMarks in editingMarks
      setEditingMarks((prev) => {
        const cur = prev[submissionId] || { marks: '', feedback: '', isMarked: false, questionMarks: {} };
        const nextQm: Record<string, { marks: string; feedback?: string }> = { ...(cur.questionMarks || {}) };
        let calculatedSum = 0;

        evals.forEach((ev: any) => {
          const key = `${ev.questionNumber}_${ev.partLabel || ''}`;
          nextQm[key] = {
            marks: String(ev.suggestedMarks ?? 0),
            feedback: ev.feedback || '',
          };
          calculatedSum += Number(ev.suggestedMarks) || 0;
        });

        return {
          ...prev,
          [submissionId]: {
            ...cur,
            marks: String(calculatedSum),
            feedback: cur.feedback ? cur.feedback : (aiData?.overallFeedback || ''),
            questionMarks: nextQm,
          },
        };
      });

      // Update activeStudioSub and submission item
      if (activeStudioSub && activeStudioSub._id === submissionId) {
        setActiveStudioSub((prev) => (prev ? { ...prev, aiEvaluation: aiData?.aiEvaluation || aiData } : null));
      }
      setSubmissions((prev) =>
        prev.map((s) => (s._id === submissionId ? { ...s, aiEvaluation: aiData?.aiEvaluation || aiData } : s))
      );

      setNotification({
        type: 'success',
        message: `🤖 AI score suggestions generated successfully! Suggested marks: ${aiData?.totalSuggestedMarks}/${selectedQuiz?.essayTotalMarks || 100}`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to generate AI mark suggestions.';
      alert(msg);
      setNotification({ type: 'error', message: msg });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setAiLoadingSubId(null);
    }
  };

  // Helper to get or initialize boxes for a submission
  const getSubmissionBoxes = (subId: string): DynamicQuestionBox[] => {
    const edit = editingMarks[subId];
    if (edit?.boxes && edit.boxes.length > 0) return edit.boxes;
    return [
      { id: `box-${subId}-1`, questionNumber: '1', marks: '' },
      { id: `box-${subId}-2`, questionNumber: '2', marks: '' },
      { id: `box-${subId}-3`, questionNumber: '3', marks: '' },
      { id: `box-${subId}-4`, questionNumber: '4', marks: '' },
      { id: `box-${subId}-5`, questionNumber: '5', marks: '' },
    ];
  };

  // Add a new question box
  const handleAddQuestionBox = (subId: string) => {
    setEditingMarks((prev) => {
      const cur = prev[subId] || { marks: '', feedback: '', isMarked: false, boxes: [] };
      const currentBoxes = cur.boxes && cur.boxes.length > 0 ? [...cur.boxes] : getSubmissionBoxes(subId);

      const numericNums = currentBoxes
        .map((b) => parseInt(b.questionNumber.replace(/[^\d]/g, ''), 10))
        .filter((n) => !isNaN(n));
      const nextNum = numericNums.length > 0 ? Math.max(...numericNums) + 1 : currentBoxes.length + 1;

      const newBox: DynamicQuestionBox = {
        id: `box-${subId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        questionNumber: String(nextNum),
        marks: '',
      };

      const updatedBoxes = [...currentBoxes, newBox];
      const sum = updatedBoxes.reduce((acc, b) => acc + (Number(b.marks) || 0), 0);

      return {
        ...prev,
        [subId]: {
          ...cur,
          boxes: updatedBoxes,
          marks: cur.manualTotalOverridden && cur.marks !== '' ? cur.marks : (sum > 0 ? String(sum) : cur.marks),
        },
      };
    });
  };

  // Delete a question box
  const handleDeleteQuestionBox = (subId: string, boxId: string) => {
    setEditingMarks((prev) => {
      const cur = prev[subId] || { marks: '', feedback: '', isMarked: false, boxes: [] };
      const currentBoxes = cur.boxes && cur.boxes.length > 0 ? [...cur.boxes] : getSubmissionBoxes(subId);
      const updatedBoxes = currentBoxes.filter((b) => b.id !== boxId);
      const sum = updatedBoxes.reduce((acc, b) => acc + (Number(b.marks) || 0), 0);

      return {
        ...prev,
        [subId]: {
          ...cur,
          boxes: updatedBoxes,
          marks: cur.manualTotalOverridden && cur.marks !== '' ? cur.marks : (sum > 0 ? String(sum) : (updatedBoxes.length === 0 ? '' : '0')),
        },
      };
    });
  };

  // Reset to default 5 boxes (Q1 to Q5)
  const handleResetFiveBoxes = (subId: string) => {
    setEditingMarks((prev) => {
      const cur = prev[subId] || { marks: '', feedback: '', isMarked: false, boxes: [] };
      const fiveBoxes: DynamicQuestionBox[] = [
        { id: `box-${subId}-1-${Date.now()}`, questionNumber: '1', marks: '' },
        { id: `box-${subId}-2-${Date.now()}`, questionNumber: '2', marks: '' },
        { id: `box-${subId}-3-${Date.now()}`, questionNumber: '3', marks: '' },
        { id: `box-${subId}-4-${Date.now()}`, questionNumber: '4', marks: '' },
        { id: `box-${subId}-5-${Date.now()}`, questionNumber: '5', marks: '' },
      ];
      return {
        ...prev,
        [subId]: {
          ...cur,
          boxes: fiveBoxes,
          marks: cur.manualTotalOverridden ? cur.marks : '',
        },
      };
    });
  };

  // Update question number of a box
  const handleUpdateBoxQNum = (subId: string, boxId: string, qNum: string) => {
    setEditingMarks((prev) => {
      const cur = prev[subId] || { marks: '', feedback: '', isMarked: false, boxes: [] };
      const currentBoxes = cur.boxes && cur.boxes.length > 0 ? [...cur.boxes] : getSubmissionBoxes(subId);
      const updatedBoxes = currentBoxes.map((b) => (b.id === boxId ? { ...b, questionNumber: qNum } : b));
      return {
        ...prev,
        [subId]: {
          ...cur,
          boxes: updatedBoxes,
        },
      };
    });
  };

  // Update marks of a box
  const handleUpdateBoxMarks = (subId: string, boxId: string, marksVal: string) => {
    setEditingMarks((prev) => {
      const cur = prev[subId] || { marks: '', feedback: '', isMarked: false, boxes: [] };
      const currentBoxes = cur.boxes && cur.boxes.length > 0 ? [...cur.boxes] : getSubmissionBoxes(subId);
      const updatedBoxes = currentBoxes.map((b) => (b.id === boxId ? { ...b, marks: marksVal } : b));
      const sum = updatedBoxes.reduce((acc, b) => acc + (Number(b.marks) || 0), 0);

      return {
        ...prev,
        [subId]: {
          ...cur,
          boxes: updatedBoxes,
          marks: cur.manualTotalOverridden && cur.marks !== '' ? cur.marks : String(sum),
        },
      };
    });
  };

  // Direct manual editing of Total Marks
  const handleDirectEditTotalMarks = (subId: string, newTotalVal: string) => {
    setEditingMarks((prev) => {
      const cur = prev[subId] || { marks: '', feedback: '', isMarked: false, boxes: [] };
      return {
        ...prev,
        [subId]: {
          ...cur,
          marks: newTotalVal,
          manualTotalOverridden: true,
        },
      };
    });
  };

  // Sync Total Marks from sum of boxes
  const handleSyncSumToTotal = (subId: string) => {
    setEditingMarks((prev) => {
      const cur = prev[subId] || { marks: '', feedback: '', isMarked: false, boxes: [] };
      const currentBoxes = cur.boxes && cur.boxes.length > 0 ? [...cur.boxes] : getSubmissionBoxes(subId);
      const sum = currentBoxes.reduce((acc, b) => acc + (Number(b.marks) || 0), 0);
      return {
        ...prev,
        [subId]: {
          ...cur,
          marks: String(sum),
          manualTotalOverridden: false,
        },
      };
    });
  };

  // Save marks (from list or studio)
  const handleSaveMark = async (submissionId: string, autoAdvance = false) => {
    const targetSub = submissions.find((s) => s._id === submissionId) || (activeStudioSub?._id === submissionId ? activeStudioSub : null);
    if (!targetSub?.isClaimedByMe && user?.role !== 'ADMIN') {
      alert('Please claim this submission before entering evaluation marks.');
      return false;
    }

    const edit = editingMarks[submissionId];
    if (!edit) return false;

    const maxMarks = selectedQuiz?.essayTotalMarks || 100;
    const boxes = edit.boxes && edit.boxes.length > 0 ? edit.boxes : getSubmissionBoxes(submissionId);
    const boxSum = boxes.reduce((acc, b) => acc + (Number(b.marks) || 0), 0);

    let numMarks = 0;
    if (edit.marks !== undefined && edit.marks.trim() !== '') {
      numMarks = Number(edit.marks);
    } else {
      numMarks = boxSum;
    }

    if (isNaN(numMarks) || numMarks < 0 || numMarks > maxMarks) {
      alert(`Marks must be between 0 and ${maxMarks}.`);
      return false;
    }

    const questionMarksPayload = boxes.map((box, idx) => {
      const extractedNum = parseInt(box.questionNumber.replace(/[^\d]/g, ''), 10);
      const qNum = !isNaN(extractedNum) && extractedNum > 0 ? extractedNum : idx + 1;
      const cleanLabel = box.questionNumber.trim();
      return {
        questionNumber: qNum,
        title: cleanLabel ? (cleanLabel.toLowerCase().startsWith('q') ? cleanLabel : `Q ${cleanLabel}`) : `Question ${qNum}`,
        marksAwarded: Number(box.marks) || 0,
        maxMarks: 20,
        feedback: box.feedback || '',
      };
    });

    setSavingId(submissionId);
    setStudioSaving(true);

    try {
      const res = await api.post(`/panel/submissions/${submissionId}/mark`, {
        marksAwarded: numMarks,
        questionMarks: questionMarksPayload,
        feedback: edit.feedback,
        confirmMarked: edit.isMarked,
      });

      const updatedSubData = res.data?.data;

      if (!edit.isMarked) {
        // Paper unmark -> AUTO UNCLAIMED
        setSubmissions((prev) =>
          prev.map((s) =>
            s._id === submissionId
              ? {
                  ...s,
                  marksAwarded: undefined,
                  questionMarks: [],
                  feedback: '',
                  isMarked: false,
                  claimedById: undefined,
                  claimedByName: undefined,
                  claimedAt: undefined,
                  markedById: undefined,
                  markedByName: undefined,
                  markedAt: undefined,
                  isClaimedByMe: false,
                  isClaimedByOther: false,
                  assignedToName: undefined,
                }
              : s
          )
        );

        // Clean local edit state
        setEditingMarks((prev) => {
          const copy = { ...prev };
          delete copy[submissionId];
          return copy;
        });

        if (activeStudioSub && activeStudioSub._id === submissionId) {
          setActiveStudioSub((prev) =>
            prev
              ? {
                  ...prev,
                  marksAwarded: undefined,
                  questionMarks: [],
                  feedback: '',
                  isMarked: false,
                  claimedById: undefined,
                  claimedByName: undefined,
                  claimedAt: undefined,
                  markedById: undefined,
                  markedByName: undefined,
                  markedAt: undefined,
                  isClaimedByMe: false,
                  isClaimedByOther: false,
                  assignedToName: undefined,
                }
              : null
          );
        }

        setNotification({
          type: 'success',
          message: 'Submission unmarked and returned to the available pool.',
        });
        setTimeout(() => setNotification(null), 3500);
        fetchQuizzes();
        reloadSubmissions();

        if (autoAdvance) {
          handleNavigateStudio('NEXT');
        }
        return true;
      }

      // Update state for confirmed marked paper
      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === submissionId
            ? {
                ...s,
                marksAwarded: numMarks,
                questionMarks: questionMarksPayload,
                feedback: edit.feedback,
                isMarked: true,
                markedById: updatedSubData?.markedById || user?.id,
                markedByName: updatedSubData?.markedByName || user?.fullName,
                markedAt: updatedSubData?.markedAt || new Date().toISOString(),
                claimedById: updatedSubData?.claimedById || user?.id,
                claimedByName: updatedSubData?.claimedByName || user?.fullName,
                isClaimedByMe: true,
                isClaimedByOther: false,
                assignedToName: updatedSubData?.markedByName || user?.fullName,
              }
            : s
        )
      );

      if (activeStudioSub && activeStudioSub._id === submissionId) {
        setActiveStudioSub((prev) =>
          prev
            ? {
                ...prev,
                marksAwarded: numMarks,
                questionMarks: questionMarksPayload,
                feedback: edit.feedback,
                isMarked: true,
                markedById: updatedSubData?.markedById || user?.id,
                markedByName: updatedSubData?.markedByName || user?.fullName,
                markedAt: updatedSubData?.markedAt || new Date().toISOString(),
                isClaimedByMe: true,
                isClaimedByOther: false,
                assignedToName: updatedSubData?.markedByName || user?.fullName,
              }
            : null
        );
      }

      setNotification({
        type: 'success',
        message: 'Marks saved and confirmed successfully.',
      });
      setTimeout(() => setNotification(null), 3500);
      fetchQuizzes();
      reloadSubmissions();

      if (autoAdvance) {
        handleNavigateStudio('NEXT');
      }
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save marks.';
      setNotification({ type: 'error', message: msg });
      alert(msg);
      return false;
    } finally {
      setSavingId(null);
      setStudioSaving(false);
    }
  };

  const fetchPreviewFile = async (subId: string) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setImageZoom(1);
    setImageRotation(0);

    try {
      const res = await api.get(`/panel/submissions/${subId}/file`, {
        responseType: 'blob',
      });
      const blob = res.data as Blob;
      const bType = (blob.type || '').toLowerCase();
      const targetSub = submissions.find((s) => s._id === subId) || activeStudioSub;
      const fName = (targetSub?.fileName || '').toLowerCase();

      let detectedType: 'PDF' | 'IMAGE' | 'OTHER' = 'PDF';
      if (bType.startsWith('image/') || fName.match(/\.(jpe?g|png|webp|gif|bmp)$/i)) {
        detectedType = 'IMAGE';
      } else if (bType.includes('pdf') || fName.endsWith('.pdf')) {
        detectedType = 'PDF';
      } else {
        detectedType = 'OTHER';
      }

      setPreviewBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setPreviewFileType(detectedType);
    } catch (err: any) {
      console.error('Failed to load student answer preview:', err);
      let errorMsg = 'Unable to load preview. Please use the Download button below to open the document.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.message) {
            errorMsg = parsed.message;
          }
        } catch {
          // ignore parsing error
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setPreviewError(errorMsg);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!activeStudioSub) {
      setPreviewBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPreviewLoading(false);
      setPreviewError(null);
      setImageZoom(1);
      setImageRotation(0);
      return;
    }

    fetchPreviewFile(activeStudioSub._id);
  }, [activeStudioSub?._id]);

  // Open In-Website Preview & Marking Studio
  const handleOpenStudio = (sub: EssaySubmission) => {
    setStudioActiveQuestionIdx(0);
    setActiveStudioSub(sub);
  };

  // Navigate studio between submissions
  const handleNavigateStudio = (direction: 'PREV' | 'NEXT') => {
    if (!activeStudioSub) return;
    const currentIdx = sortedSubmissions.findIndex((s) => s._id === activeStudioSub._id);
    if (currentIdx === -1) return;

    let targetIdx = direction === 'NEXT' ? currentIdx + 1 : currentIdx - 1;
    if (targetIdx >= 0 && targetIdx < sortedSubmissions.length) {
      const nextSub = sortedSubmissions[targetIdx];
      setStudioActiveQuestionIdx(0);
      handleOpenStudio(nextSub);
    }
  };

  const handleGenerateFullPaperRankings = async () => {
    if (!selectedQuiz) return;

    const totalSubCount = submissions.length;
    const markedSubCount = submissions.filter((s) => s.isMarked).length;
    const pendingSubCount = totalSubCount - markedSubCount;

    if (totalSubCount === 0) {
      alert('No student essay submissions found for this examination.');
      return;
    }

    if (pendingSubCount > 0) {
      alert(
        `⚠️ All student essay submissions must be marked before calculating Full Paper Rankings!\n\n` +
        `• Total Submissions: ${totalSubCount}\n` +
        `• Marked Submissions: ${markedSubCount}\n` +
        `• Pending Evaluation: ${pendingSubCount}\n\n` +
        `Please mark and confirm all remaining ${pendingSubCount} submissions first before publishing rankings.`
      );
      return;
    }

    if (
      !window.confirm(
        `Generate Full Paper Rankings now? All ${totalSubCount} student submissions have been marked.\n\n` +
        `This will combine Quiz MCQ scores and Essay marks to calculate Island, Province, and District rankings for full paper students.\n\n` +
        `⚠️ Note: After 1 week (7 days) of generating rankings, this exam card and student essay answer files will be automatically deleted from the marker portal to conserve storage.`
      )
    ) {
      return;
    }

    setGeneratingRanks(true);
    try {
      const res = await api.post(`/panel/quizzes/${selectedQuiz._id}/calculate-full-paper-rankings`);
      setNotification({
        type: 'success',
        message:
          res.data?.message ||
          'Full Paper Rankings calculated successfully! This marker exam card and student answer files will automatically delete in 1 week.',
      });
      setTimeout(() => setNotification(null), 6000);
      fetchQuizzes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to calculate rankings.');
    } finally {
      setGeneratingRanks(false);
    }
  };

  // Download student answer file
  const handleDownloadFile = async (submissionId: string, fileName?: string) => {
    try {
      const res = await api.get(`/panel/submissions/${submissionId}/file?download=true`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'student_answer_sheet.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (err) {
      const currentToken = localStorage.getItem('accessToken') || '';
      window.open(
        `${API_BASE_URL}/panel/submissions/${submissionId}/file?token=${encodeURIComponent(currentToken)}&download=true`,
        '_blank'
      );
    }
  };

  // Quick feedback template inserter
  const handleInsertFeedback = (submissionId: string, text: string) => {
    setEditingMarks((prev) => {
      const current = prev[submissionId]?.feedback || '';
      const updated = current ? `${current} | ${text}` : text;
      return {
        ...prev,
        [submissionId]: {
          ...(prev[submissionId] || { marks: '', isMarked: false }),
          feedback: updated,
        },
      };
    });
  };

  // Filter & Sort logic for Assigned Quizzes Overview
  const filteredQuizzes = quizzes.filter((q) => {
    if (quizStatusFilter === 'PENDING' && (q.pendingCount || 0) === 0) return false;
    if (quizStatusFilter === 'COMPLETED' && ((q.pendingCount || 0) > 0 || (q.totalSubmissions || 0) === 0 || q.isFullPaperRankingsCalculated)) return false;
    if (quizStatusFilter === 'RANKINGS_ACTIVE' && !q.isFullPaperRankingsCalculated) return false;

    if (quizSearchQuery.trim()) {
      const qNumStr = String(q.quizNumber || '');
      const query = quizSearchQuery.toLowerCase().trim();
      const titleStr = (q.title || '').toLowerCase();
      const subStr = (((q.subject as any)?.nameSi || '') + ' ' + ((q.subject as any)?.nameEn || '')).toLowerCase();
      const matchesNum = qNumStr === query || `#${qNumStr}` === query || `exam #${qNumStr}` === query;
      const matchesText = titleStr.includes(query) || subStr.includes(query);
      return matchesNum || matchesText;
    }
    return true;
  });

  const totalQuizPages = Math.max(1, Math.ceil(filteredQuizzes.length / quizPageSize));
  const validQuizPage = Math.min(Math.max(1, quizPage), totalQuizPages);
  const paginatedQuizzes = filteredQuizzes.slice((validQuizPage - 1) * quizPageSize, validQuizPage * quizPageSize);

  // Filter logic for Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (assignmentFilter === 'MY_PAPERS' && !sub.isClaimedByMe) return false;
    if (assignmentFilter === 'AVAILABLE' && (sub.isClaimedByMe || sub.isClaimedByOther || sub.isMarked)) return false;
    if (assignmentFilter === 'OTHERS' && !sub.isClaimedByOther) return false;
    if (assignmentFilter === 'MARKED' && !sub.isMarked) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        (sub.studentFullName || '').toLowerCase().includes(q) ||
        (sub.studentUsername || '').toLowerCase().includes(q) ||
        (sub.fileName || '').toLowerCase().includes(q) ||
        (sub.assignedToName || '').toLowerCase().includes(q) ||
        (sub.studentSchool || '').toLowerCase().includes(q) ||
        (sub.studentDistrictId || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (subSortBy === 'UNMARKED_FIRST') {
      if (!a.isMarked && b.isMarked) return -1;
      if (a.isMarked && !b.isMarked) return 1;
    } else if (subSortBy === 'MARKED_FIRST') {
      if (a.isMarked && !b.isMarked) return -1;
      if (!a.isMarked && b.isMarked) return 1;
    } else if (subSortBy === 'NAME_ASC') {
      return (a.studentFullName || '').localeCompare(b.studentFullName || '');
    }
    return 0;
  });

  const totalSubPages = subPageSize === -1 ? 1 : Math.max(1, Math.ceil(sortedSubmissions.length / subPageSize));
  const validSubPage = Math.min(Math.max(1, subPage), totalSubPages);
  const paginatedSubmissions = subPageSize === -1
    ? sortedSubmissions
    : sortedSubmissions.slice((validSubPage - 1) * subPageSize, validSubPage * subPageSize);

  const markedCount = submissions.filter((s) => s.isMarked).length;
  const pendingCount = submissions.length - markedCount;
  const myPapersCount = submissions.filter((s) => s.isClaimedByMe).length;
  const availableCount = submissions.filter((s) => !s.isClaimedByMe && !s.isClaimedByOther && !s.isMarked).length;
  const othersCount = submissions.filter((s) => s.isClaimedByOther).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white rounded-xl shadow-md border border-slate-700/60">
              <img src={logoImg} alt="Logo" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base tracking-tight font-display">
                  ExamPortal
                </span>
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                  Marking Panel
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Essay Paper Evaluation & Grading Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{user?.fullName || user?.username}</p>
              <p className="text-[10px] text-slate-400 font-mono">@{user?.username}</p>
            </div>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Admin Panel
              </button>
            )}

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm shadow-xl transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300'
                : notification.type === 'warning'
                ? 'bg-amber-950/80 border border-amber-500/30 text-amber-300'
                : 'bg-rose-950/80 border border-rose-500/30 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : notification.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Back Button if in Quiz detail */}
        {selectedQuiz ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setSelectedQuiz(null)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-colors border border-slate-700 shrink-0 mt-0.5 cursor-pointer"
                  title="Back to Quizzes List"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-lg font-mono">
                      Exam #{selectedQuiz.quizNumber || 1}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {(selectedQuiz.subject as any)?.nameSi || (selectedQuiz.subject as any)?.nameEn || ''}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1 font-display">
                    {selectedQuiz.title}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Essay Max Marks: <span className="text-white font-semibold">{selectedQuiz.essayTotalMarks} Marks</span>
                    <span className="mx-2 text-slate-600">•</span>
                    <span className="text-emerald-400 font-medium">🔒 Exclusive Marking Active (One submission assigned per examiner)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={reloadSubmissions}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-colors border border-slate-700 shrink-0 cursor-pointer"
                  title="Refresh Submissions"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGenerateFullPaperRankings}
                  disabled={generatingRanks || submissions.length === 0}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl shadow-lg transition-all cursor-pointer ${
                    pendingCount > 0
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 shadow-amber-500/5'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-500/20'
                  } disabled:opacity-50`}
                  title={
                    submissions.length === 0
                      ? 'No student submissions found'
                      : pendingCount > 0
                      ? `All submissions must be marked: ${pendingCount} pending`
                      : 'Generate Full Paper Rankings'
                  }
                >
                  <Award className="w-4 h-4" />
                  {generatingRanks
                    ? 'Calculating...'
                    : pendingCount > 0
                    ? `Need All Marked (${markedCount}/${submissions.length})`
                    : selectedQuiz.isFullPaperRankingsCalculated
                    ? 'Recalculate Rankings'
                    : 'Generate Full Paper Rankings'}
                </button>
              </div>
            </div>

            {/* Warning Banner: All submissions must be marked before rankings can be generated */}
            {pendingCount > 0 && !selectedQuiz.isFullPaperRankingsCalculated && (
              <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block font-bold text-amber-300 text-sm">
                      All Student Answers Must Be Marked Before Computing Rankings
                    </strong>
                    <span className="text-slate-300 text-[11px] block mt-0.5">
                      To accurately compute official rankings, all essay submissions must be evaluated. There are still <span className="font-bold text-amber-300 font-mono">{pendingCount}</span> submission(s) pending evaluation.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl font-mono">
                    {markedCount} / {submissions.length} Marked ({submissions.length > 0 ? Math.round((markedCount / submissions.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
            )}

            {/* 1-Week Auto-Purge Alert Banner */}
            {selectedQuiz.isFullPaperRankingsCalculated && (
              <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block font-bold text-amber-300">
                      Full Paper Rankings Published & Active
                    </strong>
                    <span className="text-slate-300 text-[11px] block mt-0.5">
                      Rankings are active. Student answer files and this exam card will archive 7 days after publication. Final student scores and rankings remain permanently preserved.
                    </span>
                  </div>
                </div>
                {selectedQuiz.daysRemaining != null && (
                  <span className="px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl whitespace-nowrap font-mono self-start sm:self-auto shrink-0 flex items-center gap-1.5 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Auto-deletes in {selectedQuiz.daysRemaining} day{selectedQuiz.daysRemaining === 1 ? '' : 's'}</span>
                  </span>
                )}
              </div>
            )}

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-[11px] text-slate-400">Total Submissions</p>
                <p className="text-xl font-bold text-white mt-1">{submissions.length}</p>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-[11px] text-indigo-400">My Claimed Papers</p>
                <p className="text-xl font-bold text-indigo-300 mt-1">{myPapersCount}</p>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-[11px] text-cyan-400">Available to Mark</p>
                <p className="text-xl font-bold text-cyan-300 mt-1">{availableCount}</p>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-[11px] text-emerald-400">Marked & Confirmed</p>
                <p className="text-xl font-bold text-emerald-300 mt-1">{markedCount}</p>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-[11px] text-amber-400">Pending to Mark</p>
                <p className="text-xl font-bold text-amber-300 mt-1 font-mono">{pendingCount}</p>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-[11px] text-purple-400">Progress</p>
                <p className="text-xl font-bold text-purple-300 mt-1">
                  {submissions.length > 0 ? `${Math.round((markedCount / submissions.length) * 100)}%` : '0%'}
                </p>
              </div>
            </div>

            {/* Search, Exclusivity Filters, Sorting & Page Size Controls */}
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student name, username, school, district, or file..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSubPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 border border-slate-800 p-1 rounded-2xl text-xs">
                  <button
                    onClick={() => {
                      setAssignmentFilter('ALL');
                      setSubPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                      assignmentFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({submissions.length})
                  </button>
                  <button
                    onClick={() => {
                      setAssignmentFilter('MY_PAPERS');
                      setSubPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                      assignmentFilter === 'MY_PAPERS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    My Papers ({myPapersCount})
                  </button>
                  <button
                    onClick={() => {
                      setAssignmentFilter('AVAILABLE');
                      setSubPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                      assignmentFilter === 'AVAILABLE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Available ({availableCount})
                  </button>
                  <button
                    onClick={() => {
                      setAssignmentFilter('MARKED');
                      setSubPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                      assignmentFilter === 'MARKED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Marked ({markedCount})
                  </button>
                  {othersCount > 0 && (
                    <button
                      onClick={() => {
                        setAssignmentFilter('OTHERS');
                        setSubPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                        assignmentFilter === 'OTHERS' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Other Markers ({othersCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-bar: Sorting & Items Per Page for Large Volume Submissions */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Sort By:</span>
                  <select
                    value={subSortBy}
                    onChange={(e) => {
                      setSubSortBy(e.target.value as any);
                      setSubPage(1);
                    }}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="UNMARKED_FIRST">Unmarked First (Pending first)</option>
                    <option value="MARKED_FIRST">Marked First (Confirmed first)</option>
                    <option value="NAME_ASC">Student Name (A to Z)</option>
                    <option value="DEFAULT">Original Submission Order</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Papers per page:</span>
                  <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 p-0.5 rounded-xl">
                    {[15, 30, 60, 100, -1].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setSubPageSize(size);
                          setSubPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          subPageSize === size ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {size === -1 ? 'All' : size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            {loadingSubmissions ? (
              <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold">Loading student answer sheets...</span>
              </div>
            ) : sortedSubmissions.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
                <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-semibold text-slate-300">No Student Answer Submissions Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || assignmentFilter !== 'ALL'
                    ? 'No submissions match your filter criteria.'
                    : 'Students have not uploaded essay answer files for this examination yet.'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedSubmissions.map((sub, idx) => {
                  const globalIdx = (subPageSize === -1 ? 0 : (validSubPage - 1) * subPageSize) + idx + 1;
                  const edit = editingMarks[sub._id] || {
                    marks: sub.marksAwarded !== null && typeof sub.marksAwarded !== 'undefined' ? String(sub.marksAwarded) : '',
                    feedback: sub.feedback || '',
                    isMarked: Boolean(sub.isMarked),
                  };

                  const isLockedByOther = Boolean(sub.isClaimedByOther);
                  const isClaimedByMe = Boolean(sub.isClaimedByMe);
                  const isAvailable = !isLockedByOther && !isClaimedByMe;

                  return (
                    <div
                      key={sub._id}
                      className={`p-5 rounded-3xl border transition-all ${
                        isLockedByOther
                          ? 'bg-slate-900/40 border-slate-800/80 opacity-80'
                          : sub.isMarked
                          ? 'bg-slate-900/70 border-emerald-500/30'
                          : isClaimedByMe
                          ? 'bg-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Student Details & Exclusivity Status */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 font-mono">
                              #{globalIdx}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                  {sub.studentFullName}
                                  <span className="text-xs font-mono text-blue-400 font-normal">
                                    (@{sub.studentUsername})
                                  </span>
                                </h3>

                                {/* Exclusivity Badges */}
                                {isLockedByOther ? (
                                  <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold rounded-lg flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-rose-400" />
                                    <span>Locked by {sub.assignedToName || 'Another Member'}</span>
                                  </span>
                                ) : isClaimedByMe ? (
                                  <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-bold rounded-lg flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                                    <span>Assigned to You</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold rounded-lg flex items-center gap-1">
                                    <Unlock className="w-3 h-3 text-cyan-400" />
                                    <span>Available to Mark</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-400 mt-0.5">
                                {sub.studentSchool ? `${sub.studentSchool} • ` : ''}
                                {sub.studentDistrictId || ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs text-slate-400">
                            {/* In-Website Preview & Mark Button (Primary) */}
                            <button
                              onClick={() => handleOpenStudio(sub)}
                              className={`flex items-center gap-2 px-3.5 py-1.5 font-bold rounded-xl transition-all shadow-sm cursor-pointer ${
                                isLockedByOther
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'
                              }`}
                              title="Preview student answer paper inside website and mark without download"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview & Mark</span>
                            </button>

                            {/* Download Button */}
                            <button
                              onClick={() => handleDownloadFile(sub._id, sub.fileName)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors font-medium text-xs cursor-pointer"
                              title="Download answer file to computer"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                              <span>Download PDF</span>
                            </button>

                            {/* Claim / Release Buttons */}
                            {isAvailable && (
                              <button
                                onClick={() => handleClaimPaper(sub._id)}
                                disabled={claimingId === sub._id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl transition-colors font-semibold text-xs cursor-pointer shadow-sm"
                                title="Lock this paper to yourself so other members cannot claim it"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>{claimingId === sub._id ? 'Claiming...' : 'Claim Paper'}</span>
                              </button>
                            )}

                            {isClaimedByMe && (
                              <button
                                onClick={() => handleUnclaimPaper(sub._id)}
                                disabled={claimingId === sub._id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl transition-colors text-xs font-semibold cursor-pointer shadow-sm"
                                title="Release back to pool for another member"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>{claimingId === sub._id ? 'Releasing...' : 'Release Paper'}</span>
                              </button>
                            )}

                            <span className="text-[11px] text-slate-500">
                              Submitted: {formatSriLankanTime(new Date(sub.submittedAt))}
                            </span>

                            {sub.mcqScore !== null && typeof sub.mcqScore !== 'undefined' && (
                              <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] rounded-lg">
                                MCQ Score: {sub.mcqScore}/{sub.mcqTotalMarks}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Grading Inputs (Disabled if locked by another member or not claimed yet) */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                          {isLockedByOther ? (
                            <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-xs text-rose-300">
                              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>Locked to {sub.assignedToName}. Evaluation restricted.</span>
                            </div>
                          ) : !isClaimedByMe && user?.role !== 'ADMIN' ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-2.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
                              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                                <Unlock className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span>Claim to Evaluate:</span>
                              </div>
                              <button
                                onClick={() => handleClaimPaper(sub._id)}
                                disabled={claimingId === sub._id}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>{claimingId === sub._id ? 'Claiming...' : 'Claim Paper to Mark'}</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Marks Input */}
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-300 whitespace-nowrap">
                                  Mark:
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    max={selectedQuiz?.essayTotalMarks || 100}
                                    placeholder="0"
                                    value={edit.marks}
                                    onChange={(e) =>
                                      setEditingMarks((prev) => ({
                                        ...prev,
                                        [sub._id]: { ...edit, marks: e.target.value },
                                      }))
                                    }
                                    className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                                  />
                                  <span className="text-xs text-slate-400 font-semibold">
                                    / {selectedQuiz?.essayTotalMarks || 100}
                                  </span>
                                </div>
                              </div>

                              {/* Feedback Input */}
                              <input
                                type="text"
                                placeholder="Remarks / Feedback..."
                                value={edit.feedback}
                                onChange={(e) =>
                                  setEditingMarks((prev) => ({
                                    ...prev,
                                    [sub._id]: { ...edit, feedback: e.target.value },
                                  }))
                                }
                                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-44"
                              />

                              {/* Tick to Confirm Toggle */}
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingMarks((prev) => ({
                                    ...prev,
                                    [sub._id]: { ...edit, isMarked: !edit.isMarked },
                                  }))
                                }
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                  edit.isMarked
                                    ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                                }`}
                                title="Tick to confirm evaluation"
                              >
                                {edit.isMarked ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                                <span className="whitespace-nowrap">
                                  {edit.isMarked ? 'Confirmed' : 'Confirm'}
                                </span>
                              </button>

                              {/* Save Button */}
                              <button
                                onClick={() => handleSaveMark(sub._id)}
                                disabled={savingId === sub._id}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{savingId === sub._id ? 'Saving...' : 'Save'}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Evaluator Stamp if already marked */}
                      {sub.isMarked && sub.markedByName && (
                        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            Evaluated by <strong className="text-slate-300">{sub.markedByName}</strong>
                            {sub.markedAt ? ` on ${formatSriLankanTime(new Date(sub.markedAt))}` : ''}
                          </span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marked & Confirmed
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submissions Pagination Bar */}
                {totalSubPages > 1 && (
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 text-xs shadow-lg">
                    <div className="text-slate-400">
                      Showing{' '}
                      <strong className="text-white font-mono">
                        {(validSubPage - 1) * subPageSize + 1}
                      </strong>
                      {' '}-{' '}
                      <strong className="text-white font-mono">
                        {Math.min(validSubPage * subPageSize, sortedSubmissions.length)}
                      </strong>
                      {' '}of{' '}
                      <strong className="text-white font-mono">
                        {sortedSubmissions.length}
                      </strong>
                      {' '}submissions
                    </div>

                    <div className="flex items-center gap-1.5 self-center sm:self-auto flex-wrap">
                      <button
                        type="button"
                        disabled={validSubPage <= 1}
                        onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>

                      {Array.from({ length: totalSubPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalSubPages <= 7) return true;
                          return (
                            p === 1 ||
                            p === totalSubPages ||
                            Math.abs(p - validSubPage) <= 1
                          );
                        })
                        .map((p, idx, arr) => (
                          <React.Fragment key={p}>
                            {idx > 0 && p > arr[idx - 1] + 1 && (
                              <span className="px-1 text-slate-600">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setSubPage(p)}
                              className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                                validSubPage === p
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        ))}

                      <button
                        type="button"
                        disabled={validSubPage >= totalSubPages}
                        onClick={() => setSubPage((p) => Math.min(totalSubPages, p + 1))}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Quizzes List View (Organized for Large Volume of Exams) */
          <div className="space-y-6">
            <div className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-2xl text-blue-400">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                    Full Paper Essay Question Papers
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Select an examination to review student answer sheets in-browser, assign marks, and confirm grades.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
                  Total Exams: <strong className="text-white font-mono">{quizzes.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={fetchQuizzes}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Refresh examinations"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Exam Search & Status Filter Controls for Large Number of Exams */}
            {quizzes.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search exam #, title, or subject..."
                    value={quizSearchQuery}
                    onChange={(e) => {
                      setQuizSearchQuery(e.target.value);
                      setQuizPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'ALL', label: `All (${quizzes.length})` },
                    {
                      id: 'PENDING',
                      label: `Pending Marking (${quizzes.filter((q) => (q.pendingCount || 0) > 0).length})`,
                    },
                    {
                      id: 'COMPLETED',
                      label: `Ready for Ranks (${quizzes.filter((q) => (q.pendingCount || 0) === 0 && (q.totalSubmissions || 0) > 0 && !q.isFullPaperRankingsCalculated).length})`,
                    },
                    {
                      id: 'RANKINGS_ACTIVE',
                      label: `Rankings Active (${quizzes.filter((q) => q.isFullPaperRankingsCalculated).length})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setQuizStatusFilter(tab.id as any);
                        setQuizPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        quizStatusFilter === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold">Loading examinations...</span>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
                <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-semibold text-slate-300">
                  {quizzes.length === 0 ? 'No Essay Papers Available' : 'No Examinations Found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {quizzes.length === 0
                    ? 'There are currently no examinations with full paper essays assigned.'
                    : 'No exams match your search or filter criteria. Try clearing the search.'}
                </p>
                {quizzes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizSearchQuery('');
                      setQuizStatusFilter('ALL');
                      setQuizPage(1);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedQuizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="p-6 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-3xl transition-all shadow-md flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-lg shadow-sm font-mono">
                            Exam #{quiz.quizNumber || 1}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {(quiz.subject as any)?.nameSi || (quiz.subject as any)?.nameEn || ''}
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                          {quiz.title}
                        </h3>

                        <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span>Essay Max Marks:</span>
                            <span className="text-white font-semibold">{quiz.essayTotalMarks} Marks</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Total Submissions:</span>
                            <span className="text-white font-semibold">{quiz.totalSubmissions || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Pending to Mark:</span>
                            <span className="text-amber-400 font-semibold">{quiz.pendingCount || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Marked & Confirmed:</span>
                            <span className="text-emerald-400 font-semibold">{quiz.markedCount || 0}</span>
                          </div>
                        </div>

                        {quiz.isFullPaperRankingsCalculated ? (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between text-[11px] text-amber-300">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Rankings Published
                            </span>
                            {quiz.daysRemaining != null && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-200 border border-amber-500/30 rounded-lg text-[10px] font-bold font-mono">
                                Archiving in {quiz.daysRemaining} days
                              </span>
                            )}
                          </div>
                        ) : (quiz.pendingCount || 0) === 0 && (quiz.totalSubmissions || 0) > 0 ? (
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between text-[11px] text-emerald-300">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> All Evaluated
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                              Ready for Rankings
                            </span>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Grading in Progress
                            </span>
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg text-[10px] font-bold font-mono">
                              {quiz.pendingCount || 0} Pending
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleSelectQuiz(quiz)}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-white text-xs font-bold rounded-2xl shadow-lg transition-all cursor-pointer ${
                          quiz.isFullPaperRankingsCalculated
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 shadow-amber-500/20'
                            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                        }`}
                      >
                        <span>
                          {quiz.isFullPaperRankingsCalculated
                            ? `Review Submissions (${quiz.totalSubmissions || 0})`
                            : `Mark Submissions (${quiz.totalSubmissions || 0})`}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quizzes Pagination Bar */}
                {totalQuizPages > 1 && (
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="text-slate-400">
                      Showing{' '}
                      <strong className="text-white font-mono">
                        {(validQuizPage - 1) * quizPageSize + 1}
                      </strong>
                      {' '}-{' '}
                      <strong className="text-white font-mono">
                        {Math.min(validQuizPage * quizPageSize, filteredQuizzes.length)}
                      </strong>
                      {' '}of{' '}
                      <strong className="text-white font-mono">
                        {filteredQuizzes.length}
                      </strong>
                      {' '}examinations
                    </div>

                    <div className="flex items-center gap-1.5 self-center sm:self-auto">
                      <button
                        type="button"
                        disabled={validQuizPage <= 1}
                        onClick={() => setQuizPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>

                      {Array.from({ length: totalQuizPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setQuizPage(p)}
                          className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                            validQuizPage === p
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={validQuizPage >= totalQuizPages}
                        onClick={() => setQuizPage((p) => Math.min(totalQuizPages, p + 1))}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* IN-WEBSITE PDF PREVIEW & LIVE MARKING STUDIO MODAL       */}
      {/* ======================================================== */}
      {activeStudioSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4">
          <div
            className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
              studioFullscreen
                ? 'w-full h-full rounded-none'
                : 'w-full max-w-[96vw] 2xl:max-w-[1850px] h-[95vh]'
            }`}
          >
            {/* Studio Header Bar */}
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm truncate">
                      {activeStudioSub.studentFullName}
                    </span>
                    <span className="text-xs font-mono text-blue-400 shrink-0">
                      @{activeStudioSub.studentUsername}
                    </span>
                    {activeStudioSub.isClaimedByOther ? (
                      <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" />
                        <span>Locked to {activeStudioSub.assignedToName}</span>
                      </span>
                    ) : activeStudioSub.isClaimedByMe ? (
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Claimed by You</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0">
                        <Unlock className="w-3 h-3" />
                        <span>Available to Mark</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-full" title={`File: ${activeStudioSub.fileName}`}>
                    {activeStudioSub.studentSchool ? `${activeStudioSub.studentSchool} • ` : ''}
                    {activeStudioSub.studentDistrictId || ''} • File: <span className="text-slate-300 font-mono font-medium">{activeStudioSub.fileName}</span>
                  </p>
                </div>
              </div>

              {/* Controls & Studio Navigation */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                {/* Claim button if unclaimed */}
                {!activeStudioSub.isClaimedByMe && !activeStudioSub.isClaimedByOther && (
                  <button
                    onClick={() => handleClaimPaper(activeStudioSub._id)}
                    disabled={claimingId === activeStudioSub._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
                    title="Claim paper to start marking"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{claimingId === activeStudioSub._id ? 'Claiming...' : 'Claim Paper to Mark'}</span>
                  </button>
                )}

                {/* Release button if claimed by me */}
                {activeStudioSub.isClaimedByMe && (
                  <button
                    onClick={() => handleUnclaimPaper(activeStudioSub._id)}
                    disabled={claimingId === activeStudioSub._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    title="Release paper back to pool for another member"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{claimingId === activeStudioSub._id ? 'Releasing...' : 'Release Paper'}</span>
                  </button>
                )}

                {/* Quick Prev / Next Student Switcher */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => handleNavigateStudio('PREV')}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
                    title="Previous Student Paper"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-slate-300 px-1.5">
                    {filteredSubmissions.findIndex((s) => s._id === activeStudioSub._id) + 1} / {filteredSubmissions.length}
                  </span>
                  <button
                    onClick={() => handleNavigateStudio('NEXT')}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
                    title="Next Student Paper"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Download PDF button */}
                <button
                  onClick={() => handleDownloadFile(activeStudioSub._id, activeStudioSub.fileName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  title="Download student answer file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {/* Open in new tab */}
                {previewBlobUrl ? (
                  <a
                    href={previewBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    title="Open answer file in new browser tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                ) : (
                  <button
                    onClick={() => handleDownloadFile(activeStudioSub._id, activeStudioSub.fileName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                    title="Open answer file"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </button>
                )}

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setStudioFullscreen(!studioFullscreen)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                  title={studioFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {studioFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Close Studio */}
                <button
                  onClick={() => setActiveStudioSub(null)}
                  className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                  title="Close Preview Studio"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Studio Body: Split View (PDF/Image Preview Left, Grading Controls Right) */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Pane: Embedded Student Answer Viewer (PDF / Image / Document) */}
              <div className="flex-1 bg-slate-950 p-2 sm:p-3 relative flex flex-col overflow-hidden">
                {previewLoading ? (
                  <div className="w-full h-full rounded-2xl border border-slate-800 bg-slate-900/90 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Preparing answer sheet preview...</span>
                  </div>
                ) : previewError ? (
                  <div className="w-full h-full rounded-2xl border border-slate-800 bg-slate-900/90 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-md">
                      <h4 className="text-sm font-bold text-white">Unable to preview answer sheet</h4>
                      <p className="text-xs text-slate-400">{previewError}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => fetchPreviewFile(activeStudioSub._id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </button>
                      <button
                        onClick={() => handleDownloadFile(activeStudioSub._id, activeStudioSub.fileName)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download File
                      </button>
                    </div>
                  </div>
                ) : previewFileType === 'IMAGE' && previewBlobUrl ? (
                  <div className="w-full h-full rounded-2xl border border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
                    {/* Image Controls Toolbar */}
                    <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" /> Image Answer Sheet
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setImageZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[11px] px-1 text-slate-400">{Math.round(imageZoom * 100)}%</span>
                        <button
                          onClick={() => setImageZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setImageRotation((r) => (r + 90) % 360)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 text-[11px] font-medium"
                          title="Rotate 90 Degrees"
                        >
                          <RotateCw className="w-3.5 h-3.5" /> Rotate
                        </button>
                        <button
                          onClick={() => {
                            setImageZoom(1);
                            setImageRotation(0);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-[11px] font-medium transition-colors"
                          title="Reset Zoom & Rotation"
                        >
                          Fit
                        </button>
                      </div>
                    </div>
                    {/* Image Viewer Container */}
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
                      <img
                        src={previewBlobUrl}
                        alt="Student Answer Sheet"
                        style={{
                          transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                          transformOrigin: 'center center',
                          transition: 'transform 0.15s ease-out',
                          maxWidth: imageZoom <= 1 ? '100%' : 'none',
                          maxHeight: imageZoom <= 1 ? '100%' : 'none',
                        }}
                        className="rounded-xl shadow-2xl object-contain select-none"
                      />
                    </div>
                  </div>
                ) : previewFileType === 'OTHER' ? (
                  <div className="w-full h-full rounded-2xl border border-slate-800 bg-slate-900/90 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-md">
                      <h4 className="text-sm font-bold text-white font-sinhala">{activeStudioSub.fileName}</h4>
                      <p className="text-xs text-slate-400">
                        This answer sheet is in a document format. Please download below to review.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(activeStudioSub._id, activeStudioSub.fileName)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download Document ({activeStudioSub.fileName})
                    </button>
                  </div>
                ) : previewBlobUrl ? (
                  <iframe
                    key={previewBlobUrl}
                    src={`${previewBlobUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    className="w-full h-full rounded-2xl border border-slate-800 bg-slate-900"
                    title="Student Answer Paper PDF Preview"
                  />
                ) : null}

                {/* Fallback Banner at bottom of preview */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="truncate min-w-0" title={`Student Answer Preview (${activeStudioSub.fileName})`}>
                    📄 Student Answer Preview ({activeStudioSub.fileName})
                  </span>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto flex-wrap">
                    {previewBlobUrl && (
                      <a
                        href={previewBlobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Open Full Tab <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDownloadFile(activeStudioSub._id, activeStudioSub.fileName)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Studio Marking Control Panel */}
              <div className="w-full lg:w-[480px] xl:w-[520px] 2xl:w-[550px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 flex flex-col overflow-y-auto p-4 sm:p-5 gap-4 min-h-0">
                {/* ======================================================== */}
                {/* DYNAMIC QUESTION BOXES & EDITABLE TOTAL MARKS            */}
                {/* ======================================================== */}
                {(() => {
                  const edit = editingMarks[activeStudioSub._id] || {
                    marks: activeStudioSub.marksAwarded !== null && typeof activeStudioSub.marksAwarded !== 'undefined' ? String(activeStudioSub.marksAwarded) : '',
                    feedback: activeStudioSub.feedback || '',
                    isMarked: Boolean(activeStudioSub.isMarked),
                    boxes: [],
                  };

                  const boxes = (edit.boxes && edit.boxes.length > 0)
                    ? edit.boxes
                    : getSubmissionBoxes(activeStudioSub._id);

                  const maxMarks = selectedQuiz?.essayTotalMarks || 100;

                  // Calculate live sum of all boxes
                  let calculatedSum = 0;
                  let filledCount = 0;
                  boxes.forEach((box) => {
                    const val = box.marks;
                    const n = Number(val);
                    if (val !== undefined && val !== '' && !isNaN(n)) {
                      filledCount++;
                      if (n > 0) calculatedSum += n;
                    }
                  });

                  // Effective total marks displayed
                  const currentTotalMarks = edit.marks !== undefined && edit.marks !== ''
                    ? edit.marks
                    : (calculatedSum > 0 ? String(calculatedSum) : '');

                  const numTotalMarks = Number(currentTotalMarks) || 0;
                  const percentage = maxMarks > 0 ? Math.min(100, Math.round((numTotalMarks / maxMarks) * 100)) : 0;
                  const isTotalMismatch = edit.marks !== '' && calculatedSum > 0 && Number(edit.marks) !== calculatedSum;

                  const canMark = Boolean(activeStudioSub.isClaimedByMe || user?.role === 'ADMIN');

                  return (
                    <div className="space-y-4">
                      {/* Unclaimed Warning Banner */}
                      {!canMark && !activeStudioSub.isClaimedByOther && (
                        <div className="p-3.5 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/90 border border-cyan-500/40 rounded-2xl space-y-2.5 shadow-lg">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400 shrink-0">
                              <Unlock className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white">Unclaimed Submission</h4>
                              <p className="text-[11px] text-slate-400 font-sinhala">
                                Please claim this submission before entering evaluation marks.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClaimPaper(activeStudioSub._id)}
                            disabled={claimingId === activeStudioSub._id}
                            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/25 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>{claimingId === activeStudioSub._id ? 'Claiming Paper...' : 'Claim Paper to Start Marking'}</span>
                          </button>
                        </div>
                      )}

                      {/* Locked by another member banner */}
                      {activeStudioSub.isClaimedByOther && (
                        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
                          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>This submission is claimed by {activeStudioSub.assignedToName}. Marking restricted.</span>
                        </div>
                      )}

                      {/* Header Bar with Add Box Actions */}
                      <div className="p-3 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-2xl flex items-center justify-between gap-2.5 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                            <Calculator className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white flex items-center gap-1.5 font-sinhala">
                              <span>Question & Mark Breakdown</span>
                              <span className="text-[10px] text-blue-300 font-mono font-bold bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                                {boxes.length} Boxes
                              </span>
                            </h4>
                            <p className="text-[10.5px] text-slate-400 font-sinhala">
                              Enter question number and allotted marks.
                            </p>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        {canMark && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleAddQuestionBox(activeStudioSub._id)}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add Box</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetFiveBoxes(activeStudioSub._id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-700 cursor-pointer font-sinhala"
                              title="Reset to standard 5 question boxes (Q1 to Q5)"
                            >
                              <span>Default 5</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* List of Dynamic Question Boxes */}
                      <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                        {boxes.length === 0 ? (
                          <div className="p-6 text-center border-2 border-dashed border-slate-700 rounded-2xl space-y-2">
                            <p className="text-xs text-slate-400">No question boxes added.</p>
                            <button
                              type="button"
                              onClick={() => handleAddQuestionBox(activeStudioSub._id)}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Question Box</span>
                            </button>
                          </div>
                        ) : (
                          boxes.map((box, bIdx) => {
                            const numVal = Number(box.marks);
                            const isFilled = box.marks !== '' && !isNaN(numVal);

                            return (
                              <div
                                key={box.id}
                                className={`p-3 rounded-2xl border transition-all space-y-2.5 shadow-sm ${
                                  isFilled
                                    ? 'bg-slate-800/90 border-emerald-500/40 shadow-emerald-950/20'
                                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {/* Row 1: Index, Question Number & Delete */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                                      #{bIdx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-slate-300">Question No:</span>
                                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                                      <span className="text-xs font-bold text-slate-400 font-mono">Q</span>
                                      <input
                                        type="text"
                                        disabled={!canMark}
                                        value={box.questionNumber}
                                        placeholder="1"
                                        onChange={(e) => handleUpdateBoxQNum(activeStudioSub._id, box.id, e.target.value)}
                                        className="w-14 bg-transparent text-center text-sm font-black text-white font-mono focus:outline-none disabled:opacity-50"
                                        title="Question number or label (e.g. 1, 2, Q5, 1(a))"
                                      />
                                    </div>
                                  </div>

                                  {canMark && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQuestionBox(activeStudioSub._id, box.id)}
                                      title="Delete this question box"
                                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer shrink-0 border border-transparent hover:border-rose-500/30"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>

                                {/* Row 2: Marks Input & Quick Presets */}
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-300">Marks:</span>
                                    <input
                                      type="number"
                                      disabled={!canMark}
                                      min={0}
                                      max={maxMarks}
                                      step={0.5}
                                      placeholder="0"
                                      value={box.marks}
                                      onChange={(e) => handleUpdateBoxMarks(activeStudioSub._id, box.id, e.target.value)}
                                      className={`w-24 px-3 py-1.5 bg-slate-950 border-2 rounded-xl text-center text-lg font-black font-mono focus:outline-none disabled:opacity-50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                        isFilled
                                          ? 'border-emerald-500 text-emerald-300'
                                          : 'border-slate-700 text-white focus:border-blue-500'
                                      }`}
                                    />
                                  </div>

                                  {/* Quick Score Chips (0, 5, 10, 15, 20) */}
                                  {canMark && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      {[0, 5, 10, 15, 20].map((score) => (
                                        <button
                                          key={score}
                                          type="button"
                                          onClick={() => handleUpdateBoxMarks(activeStudioSub._id, box.id, String(score))}
                                          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                                            box.marks === String(score)
                                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                          }`}
                                        >
                                          {score}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Bottom Add Box Button */}
                      {canMark && boxes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleAddQuestionBox(activeStudioSub._id)}
                          className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-dashed border-slate-700 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-400" />
                          <span>+ Add Question Box</span>
                        </button>
                      )}

                      {/* ======================================================== */}
                      {/* TOTAL MARKS CARD (AUTO-CALCULATED + EDITABLE DIRECTLY)   */}
                      {/* ======================================================== */}
                      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500/40 rounded-2xl shadow-xl space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="space-y-1">
                            <div className="text-xs font-black text-white flex items-center gap-1.5 font-sinhala">
                              <Calculator className="w-4 h-4 text-emerald-400" />
                              <span>Total Marks (Editable)</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-sinhala flex items-center gap-1.5">
                              <span>Box Sum:</span>
                              <strong className="text-emerald-400 font-mono text-xs">{calculatedSum}</strong>
                              <span className="text-slate-500">|</span>
                              <span>{filledCount} of {boxes.length} boxes marked</span>
                            </p>
                          </div>

                          {/* Prominent Editable Total Marks Input */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-emerald-500/50">
                              <input
                                type="number"
                                disabled={!canMark}
                                min={0}
                                max={maxMarks}
                                step={0.5}
                                placeholder="0"
                                value={edit.marks}
                                onChange={(e) => handleDirectEditTotalMarks(activeStudioSub._id, e.target.value)}
                                className="w-24 px-2 py-1 text-center text-2xl font-black text-emerald-300 bg-transparent font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-sm font-bold text-slate-400 font-mono pr-1.5">
                                / {maxMarks}
                              </span>
                            </div>

                            <span className="text-xs font-bold text-blue-400 font-mono bg-blue-500/15 px-2.5 py-1.5 rounded-xl border border-blue-500/30">
                              {percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
                          <div
                            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        {/* Mismatch Helper */}
                        {isTotalMismatch && (
                          <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-300">
                            <span className="text-[11px] font-sinhala">
                              💡 Entered total marks ({edit.marks}) differs from box sum ({calculatedSum}).
                            </span>
                            {canMark && (
                              <button
                                type="button"
                                onClick={() => handleSyncSumToTotal(activeStudioSub._id)}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold rounded-lg border border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer shrink-0 font-sinhala"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Apply Sum ({calculatedSum})</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Feedback / Teacher Remarks */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <label className="text-xs font-bold text-slate-200 block">
                          Examiner Remarks / Overall Feedback:
                        </label>
                        <textarea
                          disabled={!canMark}
                          rows={3}
                          placeholder="Add evaluation remarks or advice for student..."
                          value={edit.feedback}
                          onChange={(e) =>
                            setEditingMarks((prev) => ({
                              ...prev,
                              [activeStudioSub._id]: { ...edit, feedback: e.target.value },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 resize-none"
                        />

                        {/* Quick Sinhala Feedback Chips */}
                        {canMark && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500">Quick Remarks:</p>
                            <div className="flex flex-wrap gap-1">
                              {[
                                'Excellent answer!',
                                'Clear handwriting and structure',
                                'Provide more detailed explanation',
                                'Label question numbers correctly',
                              ].map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => handleInsertFeedback(activeStudioSub._id, chip)}
                                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-md border border-slate-700 cursor-pointer"
                                >
                                  + {chip}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirmation Toggle */}
                      <button
                        type="button"
                        disabled={!canMark}
                        onClick={() =>
                          setEditingMarks((prev) => ({
                            ...prev,
                            [activeStudioSub._id]: { ...edit, isMarked: !edit.isMarked },
                          }))
                        }
                        className={`w-full flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                          edit.isMarked
                            ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        } disabled:opacity-50`}
                      >
                        {edit.isMarked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                        <span className="text-xs font-bold">
                          {edit.isMarked ? 'Confirmed Evaluation' : 'Tick to Confirm Evaluation'}
                        </span>
                      </button>

                      {/* Save & Release Actions */}
                      {canMark ? (
                        <div className="space-y-2 pt-1">
                          <button
                            onClick={() => handleSaveMark(activeStudioSub._id, false)}
                            disabled={studioSaving}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>{studioSaving ? 'Saving...' : 'Save Marks'}</span>
                          </button>

                          <button
                            onClick={() => handleSaveMark(activeStudioSub._id, true)}
                            disabled={studioSaving}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span>Save & Next Student ➡️</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUnclaimPaper(activeStudioSub._id)}
                            disabled={claimingId === activeStudioSub._id}
                            className="w-full py-2.5 bg-slate-800 hover:bg-amber-950/40 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                            title="Release this paper back to pool for another member"
                          >
                            <Unlock className="w-4 h-4 text-amber-400" />
                            <span>{claimingId === activeStudioSub._id ? 'Releasing...' : 'Release Paper to Another Member'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-2xl text-center space-y-2.5">
                          <p className="text-xs text-slate-300 font-sinhala">
                            {activeStudioSub.isClaimedByOther
                              ? `This paper is claimed by ${activeStudioSub.assignedToName}.`
                              : 'Please claim this submission before entering marks.'}
                          </p>
                          {!activeStudioSub.isClaimedByOther && (
                            <button
                              type="button"
                              onClick={() => handleClaimPaper(activeStudioSub._id)}
                              disabled={claimingId === activeStudioSub._id}
                              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center justify-center gap-2"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Claim Paper to Start Marking</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Bottom Navigation between students */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleNavigateStudio('PREV')}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {filteredSubmissions.findIndex((s) => s._id === activeStudioSub._id) + 1} of {filteredSubmissions.length}
                  </span>

                  <button
                    onClick={() => handleNavigateStudio('NEXT')}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marking Scheme & Presets Modal */}
      {selectedQuiz && (
        <EssayMarkingSchemeModal
          isOpen={isSchemeModalOpen}
          onClose={() => setIsSchemeModalOpen(false)}
          quizId={selectedQuiz._id}
          initialQuestions={selectedQuiz.essayQuestions || []}
          initialTotalMarks={selectedQuiz.essayTotalMarks || 100}
          apiEndpointPrefix="panel"
          onSaved={(newQuestions, newTotal) => {
            setSelectedQuiz((prev: any) => ({
              ...prev,
              essayQuestions: newQuestions,
              essayTotalMarks: newTotal,
            }));
            fetchQuizzes();
          }}
        />
      )}
    </div>
  );
};
