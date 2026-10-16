import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  Award,
  AlertCircle,
  BookOpen,
  Target,
  Sparkles,
  FileText,
  Trophy,
  Clock,
  Layers,
} from 'lucide-react';

interface TopicPerf {
  topicName: string;
  totalQuestions?: number;
  correctCount?: number;
  quizzesCount?: number;
  averagePercentage: number;
}

export const StudentAnalyticsPage: React.FC = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartTrendFilter, setChartTrendFilter] = useState<'OVERLAY' | 'MCQ' | 'FULL_PAPER'>('OVERLAY');

  useEffect(() => {
    Promise.all([
      api.get('/student/monthly-report').then((res) => res.data.data),
      api.get('/student/performance').then((res) => res.data.data).catch(() => null),
    ])
      .then(([monthly, perf]) => {
        setData(monthly);
        setPerformanceData(perf);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading student performance analytics...</span>
      </div>
    );
  }

  const topicPerformance: TopicPerf[] = performanceData?.topicPerformance || [];
  const strongTopics = topicPerformance.filter((t) => t.averagePercentage >= 75);
  const weakTopics = topicPerformance.filter((t) => t.averagePercentage < 50);

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900 font-display tracking-tight">
          Performance & Topic Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historical overview of your assessment progression, Full Paper composite performance, and topic mastery
        </p>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dark:bg-slate-900/70 bg-white/95 p-6 rounded-3xl border dark:border-slate-800 border-slate-200/90 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Available Quizzes
          </span>
          <span className="text-3xl font-black dark:text-white text-slate-900 font-display">
            {data.summary.availableQuizzes}
          </span>
        </div>

        <div className="dark:bg-slate-900/70 bg-white/95 p-6 rounded-3xl border dark:border-slate-800 border-slate-200/90 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Completed Quizzes
          </span>
          <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-display">
            {data.summary.attendedQuizzes}
          </span>
        </div>

        <div className="dark:bg-slate-900/70 bg-white/95 p-6 rounded-3xl border dark:border-slate-800 border-slate-200/90 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Missed Quizzes
          </span>
          <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-display">
            {data.summary.missedQuizzes}
          </span>
        </div>

        <div className="dark:bg-slate-900/70 bg-white/95 p-6 rounded-3xl border dark:border-slate-800 border-slate-200/90 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            MCQ Average Score
          </span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-display">
            {data.summary.averageScore}%
          </span>
        </div>
      </div>

      {/* Full Paper & Essay Mark Analysis Cards (if student took full papers) */}
      {data.summary.fullPaperAttended > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold dark:text-white text-slate-900 font-display">
              Full Paper & Essay Mark Diagnostics
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="dark:bg-slate-900/70 bg-white/95 p-6 rounded-3xl border dark:border-amber-500/30 border-amber-300/80 shadow-sm space-y-2">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400/90 uppercase tracking-wider block">
                Full Papers Completed
              </span>
              <span className="text-3xl font-black dark:text-white text-slate-900 font-display">
                {data.summary.fullPaperAttended}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">MCQ + Essay Evaluated</span>
            </div>

            <div className="dark:bg-slate-900/70 bg-white/95 p-6 rounded-3xl border dark:border-amber-500/30 border-amber-300/80 shadow-sm space-y-2">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400/90 uppercase tracking-wider block">
                Full Paper Average
              </span>
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-display">
                {data.summary.fullPaperAveragePercentage}%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Combined Composite Mark</span>
            </div>

            <div className="dark:bg-slate-900/70 bg-white/95 p-6 rounded-3xl border dark:border-violet-500/30 border-violet-300/80 shadow-sm space-y-2">
              <span className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider block">
                Essay Average Mark
              </span>
              <span className="text-3xl font-black text-violet-700 dark:text-violet-300 font-display">
                {data.summary.essayAverageMarks}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Panel Evaluated Score</span>
            </div>

            <div className="dark:bg-slate-900/70 bg-white/95 p-6 rounded-3xl border dark:border-emerald-500/30 border-emerald-300/80 shadow-sm space-y-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Best Full Paper Rank
              </span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                {data.summary.bestFullPaperRank ? `#${data.summary.bestFullPaperRank}` : '-'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">All-Island Standings</span>
            </div>
          </div>
        </div>
      )}

      {/* Topic-Based Analysis Section */}
      <div className="dark:bg-slate-900/70 bg-white/95 rounded-3xl p-6 sm:p-8 shadow-sm border dark:border-slate-800 border-slate-200/90 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-slate-800/80 border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-lg font-bold dark:text-white text-slate-900 font-display">
                Curriculum Topic Mastery & Breakdown
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed accuracy analysis evaluated across all individual quiz topics
              </p>
            </div>
          </div>
          {topicPerformance.length > 0 && (
            <span className="text-xs font-bold dark:text-slate-300 text-slate-700 dark:bg-slate-800 bg-slate-100 px-3 py-1 rounded-xl border dark:border-slate-700 border-slate-200 self-start sm:self-auto">
              {topicPerformance.length} Topics Evaluated
            </span>
          )}
        </div>

        {topicPerformance.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-slate-950/50 rounded-2xl border border-slate-800/80">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs">Complete examination quizzes with multiple topics to generate topic analysis.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Insights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-emerald-300/80 font-bold uppercase tracking-wider block">
                    Mastered Topics ({strongTopics.length})
                  </span>
                  <span className="text-sm font-bold text-emerald-300 font-sinhala">
                    {strongTopics.length > 0
                      ? strongTopics.map((t) => t.topicName).join(', ')
                      : 'Keep practicing to master topics!'}
                  </span>
                </div>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-rose-300/80 font-bold uppercase tracking-wider block">
                    Focus Needed ({weakTopics.length})
                  </span>
                  <span className="text-sm font-bold text-rose-300 font-sinhala">
                    {weakTopics.length > 0
                      ? weakTopics.map((t) => t.topicName).join(', ')
                      : 'Great job! No weak topics detected.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Topic Progress Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topicPerformance.map((t, idx) => {
                const isMastered = t.averagePercentage >= 75;
                const isModerate = t.averagePercentage >= 45 && t.averagePercentage < 75;

                return (
                  <div
                    key={idx}
                    className="dark:bg-slate-950/50 bg-slate-50/80 p-4 rounded-2xl border dark:border-slate-800/80 border-slate-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold dark:text-slate-100 text-slate-800 font-sinhala text-sm block">
                          {t.topicName}
                        </span>
                        <div className="pt-1 flex items-center gap-1.5">
                          {isMastered ? (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              Mastered
                            </span>
                          ) : isModerate ? (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                              Moderate
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                              Needs Focus
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-lg font-black font-display block ${
                            isMastered
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isModerate
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {t.averagePercentage}%
                        </span>
                        {t.totalQuestions !== undefined && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t.correctCount} / {t.totalQuestions} Questions Correct
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full dark:bg-slate-900 bg-slate-200 h-2 rounded-full overflow-hidden border dark:border-slate-800 border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMastered
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : isModerate
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : 'bg-gradient-to-r from-rose-600 to-pink-500'
                        }`}
                        style={{ width: `${Math.max(4, t.averagePercentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Score Trend Line Chart */}
      <div className="dark:bg-slate-900/70 bg-white/95 rounded-3xl p-6 sm:p-8 shadow-sm border dark:border-slate-800 border-slate-200/90 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-lg font-bold dark:text-white text-slate-900 font-display">Score Progression Trajectory</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track your continuous assessment scores across all examinations</p>
            </div>
          </div>

          {/* Trend Line Filter Tabs */}
          {data.summary.fullPaperAttended > 0 && (
            <div className="flex items-center gap-1.5 p-1 dark:bg-slate-950/80 bg-slate-100 border dark:border-slate-800 border-slate-200 rounded-2xl">
              <button
                type="button"
                onClick={() => setChartTrendFilter('OVERLAY')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  chartTrendFilter === 'OVERLAY'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900'
                }`}
              >
                Both Lines
              </button>
              <button
                type="button"
                onClick={() => setChartTrendFilter('MCQ')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  chartTrendFilter === 'MCQ'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900'
                }`}
              >
                MCQ Quiz %
              </button>
              <button
                type="button"
                onClick={() => setChartTrendFilter('FULL_PAPER')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  chartTrendFilter === 'FULL_PAPER'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900'
                }`}
              >
                Full Paper %
              </button>
            </div>
          )}
        </div>

        {data.scoreTrend.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:bg-slate-950/50 bg-slate-50 rounded-2xl border dark:border-slate-800/80 border-slate-200">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
            <p className="text-xs">No examination history available to plot trend line yet.</p>
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
                <YAxis domain={[0, 100]} stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} unit="%" />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="dark:bg-slate-900 bg-white dark:border-slate-700 border-slate-200 p-3 rounded-2xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
                          <p className="font-bold dark:text-white text-slate-900 border-b dark:border-slate-800 border-slate-200 pb-1">{d.quizTitle}</p>
                          <p className="dark:text-slate-400 text-slate-500 font-mono text-[11px]">Date: {label}</p>
                          <div className="space-y-1 pt-1">
                            <p className="text-blue-500 font-semibold flex items-center justify-between">
                              <span>MCQ Score:</span>
                              <strong>{d.score} / {d.totalMarks} ({d.percentage}%)</strong>
                            </p>
                            {d.islandRank && (
                              <p className="text-blue-500 text-[11px] flex items-center justify-between">
                                <span>MCQ Island Rank:</span>
                                <strong>#{d.islandRank}</strong>
                              </p>
                            )}
                            {d.hasEssay && d.isEssayMarked && d.fullPaperPercentage != null && (
                              <p className="text-amber-500 font-semibold flex items-center justify-between border-t dark:border-slate-800/80 border-slate-200 pt-1">
                                <span>Full Paper (MCQ+Essay):</span>
                                <strong>{d.fullPaperScore} / {d.fullPaperTotalMarks} ({d.fullPaperPercentage}%)</strong>
                              </p>
                            )}
                            {d.fullPaperIslandRank ? (
                              <p className="text-amber-500 text-[11px] flex items-center justify-between">
                                <span>Full Paper Rank:</span>
                                <strong>#{d.fullPaperIslandRank}</strong>
                              </p>
                            ) : d.hasEssay && (d.isFullPaperNotAttended || (d.isFullPaperRankingsCalculated && !d.fullPaperIslandRank)) ? (
                              <p className="text-rose-400 text-[11px] flex items-center justify-between">
                                <span>Full Paper:</span>
                                <strong>Not Attended</strong>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {(chartTrendFilter === 'OVERLAY' || chartTrendFilter === 'MCQ') && (
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#3b82f6' }}
                    name="MCQ Score %"
                  />
                )}
                {(chartTrendFilter === 'OVERLAY' || chartTrendFilter === 'FULL_PAPER') && (
                  <Line
                    type="monotone"
                    dataKey="fullPaperPercentage"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#f59e0b' }}
                    connectNulls={true}
                    name="Full Paper %"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Individual Assessment Marks Breakdown Table */}
      {data.scoreTrend && data.scoreTrend.length > 0 && (
        <div className="dark:bg-slate-900/70 bg-white/95 rounded-3xl p-6 sm:p-8 shadow-sm border dark:border-slate-800 border-slate-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-slate-800/80 border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-blue-500" />
              <div>
                <h2 className="text-lg font-bold dark:text-white text-slate-900 font-display">
                  Individual Assessment Mark Analysis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive breakdown of Quiz MCQ score, Essay marks, combined full paper marks, and official island ranks.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="dark:bg-slate-950/80 bg-slate-100/90 border-b dark:border-slate-800 border-slate-200 text-[11px] font-bold dark:text-slate-400 text-slate-600 uppercase tracking-wider">
                  <th className="p-3.5">Assessment</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">MCQ Score</th>
                  <th className="p-3.5">Quiz Rank (MCQ)</th>
                  <th className="p-3.5">Essay Mark</th>
                  <th className="p-3.5">Full Paper Score</th>
                  <th className="p-3.5">Full Paper Rank (MCQ+Essay)</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800/80 divide-slate-200 text-sm">
                {data.scoreTrend.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold dark:text-white text-slate-900 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-mono font-bold rounded-lg shrink-0">
                        Exam #{item.quizNumber}
                      </span>
                      <span className="truncate max-w-[200px]" title={item.quizTitle}>
                        {item.quizTitle.replace(/^((quiz|exam)\s*#?\d+\s*[-:]?\s*)+/i, '')}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs dark:text-slate-400 text-slate-500 font-mono whitespace-nowrap">{item.date}</td>
                    <td className="p-3.5 font-mono text-xs whitespace-nowrap">
                      <span className="font-bold text-blue-400 font-mono">
                        {item.score} / {item.totalMarks}
                      </span>
                      <span className="ml-1.5 text-slate-400 text-[11px]">({item.percentage}%)</span>
                    </td>
                    <td className="p-3.5 font-mono text-xs whitespace-nowrap">
                      {item.islandRank ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold font-mono rounded-xl text-xs shadow-sm">
                          <Trophy className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          #{item.islandRank}
                        </span>
                      ) : !item.isMcqEnded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 text-slate-400 text-[11px] rounded-xl font-sans">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" /> In Progress
                        </span>
                      ) : (
                        <span className="text-slate-500 font-sans text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-xs whitespace-nowrap">
                      {item.hasEssay ? (
                        item.isEssayMarked && item.essayMarks != null ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/15 border border-violet-500/30 text-violet-300 font-bold rounded-xl text-xs shadow-sm">
                            <FileText className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            {item.essayMarks} / {item.essayTotalMarks}
                          </span>
                        ) : item.isFullPaperNotAttended || (item.isFullPaperRankingsCalculated && !item.essayAttended) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl font-sans">
                            Not Attended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-[11px] rounded-xl font-sans">
                            <Clock className="w-3 h-3 text-amber-400/80 shrink-0" /> Evaluating...
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600 font-sans text-xs">N/A</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-xs whitespace-nowrap">
                      {item.hasEssay ? (
                        item.isEssayMarked && item.fullPaperScore != null ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-400 font-display">
                              {item.fullPaperScore} / {item.fullPaperTotalMarks}
                            </span>
                            <span className="text-slate-400 text-[11px]">({item.fullPaperPercentage}%)</span>
                          </div>
                        ) : item.isFullPaperNotAttended || (item.isFullPaperRankingsCalculated && !item.fullPaperIslandRank) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl font-sans">
                            Not Attended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-[11px] rounded-xl font-sans">
                            <Clock className="w-3 h-3 text-amber-400/80 shrink-0" /> Evaluating...
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600 font-sans text-xs">N/A</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-xs whitespace-nowrap">
                      {item.hasEssay ? (
                        item.fullPaperIslandRank ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black font-display rounded-xl text-xs shadow-md">
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            #{item.fullPaperIslandRank}
                          </span>
                        ) : item.isFullPaperNotAttended || (item.isFullPaperRankingsCalculated && !item.fullPaperIslandRank) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-medium text-[11px] rounded-xl font-sans" title="Did not attend essay paper">
                            Not Attended
                          </span>
                        ) : item.isEssayMarked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] rounded-xl font-sans" title="Essay marked; rankings being computed">
                            <Clock className="w-3 h-3 text-amber-400/80 shrink-0" /> Ranking...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-[11px] rounded-xl font-sans" title="Essay is currently being evaluated by marking panel">
                            <Clock className="w-3 h-3 text-amber-400/70 shrink-0" /> In Evaluation
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600 font-sans text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
