import React, { useState } from 'react';
import { api } from '../services/api.js';
import { EssayQuestionItem } from '../types/index.js';
import {
  X,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Save,
  HelpCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface EssayMarkingSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId?: string;
  initialQuestions?: EssayQuestionItem[];
  initialTotalMarks?: number;
  apiEndpointPrefix?: 'admin' | 'panel';
  onSaved: (questions: EssayQuestionItem[], totalMarks: number) => void;
}

export const EssayMarkingSchemeModal: React.FC<EssayMarkingSchemeModalProps> = ({
  isOpen,
  onClose,
  quizId,
  initialQuestions = [],
  initialTotalMarks = 100,
  apiEndpointPrefix = 'admin',
  onSaved,
}) => {
  const [questions, setQuestions] = useState<EssayQuestionItem[]>(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      return JSON.parse(JSON.stringify(initialQuestions));
    }
    return getStandardALQuestions();
  });

  const [essayTotalMarks, setEssayTotalMarks] = useState<number>(initialTotalMarks || 100);
  const [requiredToAnswer, setRequiredToAnswer] = useState<number>(5);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({ 1: true, 2: true });

  // Custom Quick Builder Controls
  const [customTotalQuestions, setCustomTotalQuestions] = useState<number>(8);
  const [customMarksPerQuestion, setCustomMarksPerQuestion] = useState<number>(20);
  const [customPartsPerQuestion, setCustomPartsPerQuestion] = useState<number>(5);

  if (!isOpen) return null;

  // Authentic 8-question standard examination scheme
  function getStandardALQuestions(): EssayQuestionItem[] {
    const list: EssayQuestionItem[] = [];
    const titles = [
      'Question 1 (Part I - Foundational Concepts & Definitions)',
      'Question 2 (Part I - Core Principles & Classification)',
      'Question 3 (Part I - Structural Mechanisms & Procedures)',
      'Question 4 (Part I - Functional Analysis & Practical Applications)',
      'Question 5 (Part II - Advanced Theoretical Principles)',
      'Question 6 (Part II - Problem Solving & Quantitative Analysis)',
      'Question 7 (Part II - Comparative Assessment & Case Studies)',
      'Question 8 (Part II - Synthesis, Critical Evaluation & Conclusions)',
    ];

    for (let q = 1; q <= 8; q++) {
      list.push({
        questionNumber: q,
        title: titles[q - 1] || `Question ${q}`,
        questionText: `Question ${q} (Total 20 marks, 5 sub-parts)`,
        maxMarks: 20,
        parts: [
          { partId: `q${q}_1`, partLabel: '(i)', description: 'Basic definition and classification', maxMarks: 4 },
          { partId: `q${q}_2`, partLabel: '(ii)', description: 'Key principles and direct explanation', maxMarks: 4 },
          { partId: `q${q}_3`, partLabel: '(iii)', description: 'Comparative analysis and examples', maxMarks: 4 },
          { partId: `q${q}_4`, partLabel: '(iv)', description: 'Practical implications and constraints', maxMarks: 4 },
          { partId: `q${q}_5`, partLabel: '(v)', description: 'Critical evaluation and conclusion', maxMarks: 4 },
        ],
      });
    }
    return list;
  }

  // Apply 8-Question Standard Preset (Answer 5, 20 Marks Each = 100)
  const applyALStandardPreset = () => {
    setQuestions(getStandardALQuestions());
    setRequiredToAnswer(5);
    setEssayTotalMarks(100);
    setNotification({
      type: 'success',
      message: 'Standard 8-Question Scheme (5 out of 8, 20 marks each = 100) applied successfully!',
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Apply 6-Question Preset (Answer 4, 25 Marks Each = 100)
  const applyAL6QuestionsPreset = () => {
    const list: EssayQuestionItem[] = [];
    for (let q = 1; q <= 6; q++) {
      list.push({
        questionNumber: q,
        title: `Question ${q}`,
        questionText: `Question ${q} (Total 25 marks, 5 sub-parts)`,
        maxMarks: 25,
        parts: [
          { partId: `q${q}_1`, partLabel: '(i)', description: 'Part 1', maxMarks: 5 },
          { partId: `q${q}_2`, partLabel: '(ii)', description: 'Part 2', maxMarks: 5 },
          { partId: `q${q}_3`, partLabel: '(iii)', description: 'Part 3', maxMarks: 5 },
          { partId: `q${q}_4`, partLabel: '(iv)', description: 'Part 4', maxMarks: 5 },
          { partId: `q${q}_5`, partLabel: '(v)', description: 'Part 5', maxMarks: 5 },
        ],
      });
    }
    setQuestions(list);
    setRequiredToAnswer(4);
    setEssayTotalMarks(100);
    setNotification({
      type: 'success',
      message: 'Standard 6-Question Scheme (4 out of 6, 25 marks each = 100) applied successfully!',
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Apply 5-Question Preset (Answer all 5, 20 Marks Each = 100)
  const applyOL5QuestionsPreset = () => {
    const list: EssayQuestionItem[] = [];
    for (let q = 1; q <= 5; q++) {
      list.push({
        questionNumber: q,
        title: `Question ${q}`,
        questionText: `Question ${q} (Total 20 marks)`,
        maxMarks: 20,
        parts: [
          { partId: `q${q}_1`, partLabel: '(i)', description: 'Part 1', maxMarks: 4 },
          { partId: `q${q}_2`, partLabel: '(ii)', description: 'Part 2', maxMarks: 4 },
          { partId: `q${q}_3`, partLabel: '(iii)', description: 'Part 3', maxMarks: 4 },
          { partId: `q${q}_4`, partLabel: '(iv)', description: 'Part 4', maxMarks: 4 },
          { partId: `q${q}_5`, partLabel: '(v)', description: 'Part 5', maxMarks: 4 },
        ],
      });
    }
    setQuestions(list);
    setRequiredToAnswer(5);
    setEssayTotalMarks(100);
    setNotification({
      type: 'success',
      message: 'Standard 5-Question Scheme (All 5 questions, 20 marks each = 100) applied successfully!',
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Build custom scheme
  const handleGenerateCustomScheme = () => {
    const list: EssayQuestionItem[] = [];
    const partMarks = Math.max(1, Math.round(customMarksPerQuestion / Math.max(1, customPartsPerQuestion)));

    for (let q = 1; q <= customTotalQuestions; q++) {
      const parts: any[] = [];
      let currentSum = 0;
      for (let p = 1; p <= customPartsPerQuestion; p++) {
        const isLast = p === customPartsPerQuestion;
        const marks = isLast ? customMarksPerQuestion - currentSum : partMarks;
        currentSum += marks;
        parts.push({
          partId: `q${q}_${p}`,
          partLabel: `(${p <= 10 ? ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][p - 1] : p})`,
          description: `Part ${p}`,
          maxMarks: Math.max(1, marks),
        });
      }

      list.push({
        questionNumber: q,
        title: `Question ${q}`,
        questionText: `Question ${q} (${customMarksPerQuestion} marks)`,
        maxMarks: customMarksPerQuestion,
        parts,
      });
    }

    setQuestions(list);
    setNotification({
      type: 'success',
      message: `Custom scheme (${customTotalQuestions} questions, ${customMarksPerQuestion} marks each) generated successfully!`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Add a new question
  const handleAddQuestion = () => {
    const nextQNum = questions.length + 1;
    const marksPerQ = questions[0]?.maxMarks || 20;
    setQuestions((prev) => [
      ...prev,
      {
        questionNumber: nextQNum,
        title: `Question ${nextQNum}`,
        questionText: `Question ${nextQNum} (${marksPerQ} marks)`,
        maxMarks: marksPerQ,
        parts: [
          { partId: `q${nextQNum}_1`, partLabel: '(i)', description: 'Part 1', maxMarks: 4 },
          { partId: `q${nextQNum}_2`, partLabel: '(ii)', description: 'Part 2', maxMarks: 4 },
          { partId: `q${nextQNum}_3`, partLabel: '(iii)', description: 'Part 3', maxMarks: 4 },
          { partId: `q${nextQNum}_4`, partLabel: '(iv)', description: 'Part 4', maxMarks: 4 },
          { partId: `q${nextQNum}_5`, partLabel: '(v)', description: 'Part 5', maxMarks: 4 },
        ],
      },
    ]);
    setExpandedQuestions((prev) => ({ ...prev, [nextQNum]: true }));
  };

  // Delete a question
  const handleDeleteQuestion = (qNum: number) => {
    if (questions.length <= 1) {
      alert('At least one question must remain.');
      return;
    }
    const filtered = questions.filter((q) => q.questionNumber !== qNum);
    const renumbered = filtered.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setQuestions(renumbered);
  };

  // Edit question field
  const handleUpdateQuestion = (qNum: number, field: string, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.questionNumber === qNum ? { ...q, [field]: value } : q))
    );
  };

  // Add part to question
  const handleAddPart = (qNum: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.questionNumber !== qNum) return q;
        const currentParts = q.parts || [];
        const nextPartIdx = currentParts.length + 1;
        const romanLabels = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
        const label = nextPartIdx <= romanLabels.length ? `(${romanLabels[nextPartIdx - 1]})` : `(${nextPartIdx})`;
        return {
          ...q,
          parts: [
            ...currentParts,
            {
              partId: `q${qNum}_${nextPartIdx}`,
              partLabel: label,
              description: `Part ${nextPartIdx}`,
              maxMarks: 4,
            },
          ],
        };
      })
    );
  };

  // Delete part
  const handleDeletePart = (qNum: number, partIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.questionNumber !== qNum) return q;
        const filteredParts = q.parts.filter((_, idx) => idx !== partIdx);
        return { ...q, parts: filteredParts };
      })
    );
  };

  // Update part
  const handleUpdatePart = (qNum: number, partIdx: number, field: string, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.questionNumber !== qNum) return q;
        const nextParts = [...q.parts];
        nextParts[partIdx] = {
          ...nextParts[partIdx],
          [field]: field === 'maxMarks' ? Number(value) || 0 : value,
        };
        // Auto-recalculate question max marks from parts sum
        const partsSum = nextParts.reduce((a, b) => a + (Number(b.maxMarks) || 0), 0);
        return { ...q, maxMarks: partsSum > 0 ? partsSum : q.maxMarks, parts: nextParts };
      })
    );
  };

  // Save to database or local parent state
  const handleSaveScheme = async () => {
    if (!questions || questions.length === 0) {
      alert('Please add at least one question.');
      return;
    }

    setSaving(true);
    try {
      if (!quizId) {
        setNotification({
          type: 'success',
          message: 'Essay questions and marking scheme applied!',
        });
        onSaved(questions, essayTotalMarks);
        setTimeout(() => {
          setNotification(null);
          onClose();
        }, 800);
        return;
      }

      const endpoint =
        apiEndpointPrefix === 'panel'
          ? `/panel/quizzes/${quizId}/essay-questions`
          : `/admin/quizzes/${quizId}/essay-questions`;

      const res = await api.put(endpoint, {
        questions,
        essayTotalMarks,
      });

      setNotification({
        type: 'success',
        message: 'Essay marking scheme saved successfully!',
      });

      onSaved(res.data?.data?.essayQuestions || questions, essayTotalMarks);

      setTimeout(() => {
        setNotification(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save essay marking scheme.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-2xl text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 font-sinhala">
                <span>Configure Essay Marking Scheme</span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  Marking Scheme Configurator
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sinhala">
                Configure total questions, required student questions, and parts/marks per question.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`px-4 py-2.5 text-xs font-bold text-center border-b transition-all flex items-center justify-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-950/70 text-rose-300 border-rose-500/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1-Click Sri Lankan Exam Presets */}
          <div className="p-4 bg-gradient-to-r from-blue-950/50 via-slate-850 to-indigo-950/50 border border-blue-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sinhala">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Standard Exam Presets (1-Click):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-sinhala">
                Apply standard examination question scheme templates instantly
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Preset 1: A/L 8 Questions, 20 marks each */}
              <button
                type="button"
                onClick={applyALStandardPreset}
                className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border-2 border-blue-500/50 hover:border-blue-400 text-left rounded-xl transition-all cursor-pointer group shadow-sm"
              >
                <div className="text-xs font-black text-white group-hover:text-blue-300 flex items-center justify-between">
                  <span>🎯 Standard 8-Question Scheme</span>
                  <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-mono">100m</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sinhala mt-1">
                  Choose 5 out of 8 questions. <strong>20 marks</strong> per question (5 parts each).
                </p>
              </button>

              {/* Preset 2: A/L 6 Questions, 25 marks each */}
              <button
                type="button"
                onClick={applyAL6QuestionsPreset}
                className="p-3 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left rounded-xl transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-white group-hover:text-blue-300 flex items-center justify-between">
                  <span>🎯 Standard 6-Question Scheme</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">100m</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sinhala mt-1">
                  Choose 4 out of 6 questions. <strong>25 marks</strong> per question.
                </p>
              </button>

              {/* Preset 3: O/L 5 Questions, 20 marks each */}
              <button
                type="button"
                onClick={applyOL5QuestionsPreset}
                className="p-3 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left rounded-xl transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-white group-hover:text-blue-300 flex items-center justify-between">
                  <span>🎯 Standard 5-Question Scheme</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">100m</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sinhala mt-1">
                  All 5 questions compulsory. <strong>20 marks</strong> per question (100 total marks).
                </p>
              </button>
            </div>
          </div>

          {/* Quick Custom Scheme Builder */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-sinhala">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Custom Scheme Builder:</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Total Questions:</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={customTotalQuestions}
                  onChange={(e) => setCustomTotalQuestions(Number(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Marks per Question:</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  step={5}
                  value={customMarksPerQuestion}
                  onChange={(e) => setCustomMarksPerQuestion(Number(e.target.value) || 20)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Parts per Question:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={customPartsPerQuestion}
                  onChange={(e) => setCustomPartsPerQuestion(Number(e.target.value) || 5)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-white font-mono font-bold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGenerateCustomScheme}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-blue-300 hover:text-white border border-blue-500/40 rounded-xl font-bold transition-all cursor-pointer text-center"
                >
                  Generate Scheme
                </button>
              </div>
            </div>
          </div>

          {/* Scheme Summary Bar */}
          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-300">
                Total Questions: <strong className="text-white font-mono">{questions.length}</strong>
              </span>
              <span className="text-slate-300">
                Questions to Answer:
                <input
                  type="number"
                  min={1}
                  max={questions.length}
                  value={requiredToAnswer}
                  onChange={(e) => setRequiredToAnswer(Number(e.target.value) || 1)}
                  className="w-14 ml-1.5 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono text-white font-bold inline-block"
                />
              </span>
              <span className="text-slate-300">
                Maximum Total Marks:
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={essayTotalMarks}
                  onChange={(e) => setEssayTotalMarks(Number(e.target.value) || 100)}
                  className="w-16 ml-1.5 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono text-emerald-400 font-bold inline-block"
                />
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Question
            </button>
          </div>

          {/* Questions & Parts List */}
          <div className="space-y-3">
            {questions.map((q) => {
              const isExpanded = expandedQuestions[q.questionNumber] !== false;
              const partsSum = (q.parts || []).reduce((acc, p) => acc + (Number(p.maxMarks) || 0), 0);
              const isBalanced = partsSum === q.maxMarks;

              return (
                <div
                  key={q.questionNumber}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-sm"
                >
                  {/* Question Header Bar */}
                  <div
                    onClick={() =>
                      setExpandedQuestions((prev) => ({
                        ...prev,
                        [q.questionNumber]: !isExpanded,
                      }))
                    }
                    className="px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-850"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xs font-black text-white bg-blue-600/30 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/40 font-mono">
                        Q{q.questionNumber}
                      </span>
                      <span className="text-xs font-bold text-white truncate">{q.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({q.parts?.length || 0} Parts)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                          isBalanced
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                        }`}
                      >
                        {partsSum} / {q.maxMarks} Marks
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(q.questionNumber);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Question Body & Subparts */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-slate-900/40">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-1">Question Title:</label>
                          <input
                            type="text"
                            value={q.title}
                            onChange={(e) => handleUpdateQuestion(q.questionNumber, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-755 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Max Marks Allocated:</label>
                          <input
                            type="number"
                            min={1}
                            value={q.maxMarks}
                            onChange={(e) =>
                              handleUpdateQuestion(q.questionNumber, 'maxMarks', Number(e.target.value) || 0)
                            }
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-755 rounded-xl text-white font-mono font-bold text-center focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Sub-parts List */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Sub-parts & Criteria ({q.parts?.length || 0}):</span>
                          <button
                            type="button"
                            onClick={() => handleAddPart(q.questionNumber)}
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> + Add Sub-part
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {q.parts?.map((part, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-2.5 bg-slate-950/80 border border-slate-755 rounded-xl flex items-center gap-2 flex-wrap"
                            >
                              <div className="w-18 shrink-0">
                                <input
                                  type="text"
                                  value={part.partLabel}
                                  placeholder="(i)"
                                  onChange={(e) =>
                                    handleUpdatePart(q.questionNumber, pIdx, 'partLabel', e.target.value)
                                  }
                                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-center text-amber-300 focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="flex-1 min-w-[140px]">
                                <input
                                  type="text"
                                  value={part.description || ''}
                                  placeholder="Criteria / description..."
                                  onChange={(e) =>
                                    handleUpdatePart(q.questionNumber, pIdx, 'description', e.target.value)
                                  }
                                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  min={0.5}
                                  step={0.5}
                                  value={part.maxMarks}
                                  onChange={(e) =>
                                    handleUpdatePart(q.questionNumber, pIdx, 'maxMarks', e.target.value)
                                  }
                                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-black text-center text-emerald-400 focus:outline-none focus:border-blue-500"
                                />
                                <span className="text-[11px] text-slate-400 font-mono">marks</span>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePart(q.questionNumber, pIdx)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                                  title="Delete part"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-sinhala">
              Examiners will evaluate only the questions attempted by each candidate.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveScheme}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Scheme...' : 'Save Scheme'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
