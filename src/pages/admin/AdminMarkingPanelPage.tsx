import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  MarkingPanelMember,
  PanelMemberWorkloadReport,
  PaperWorkloadReport,
  PanelWorkloadSummary,
  PanelMemberQuizWorkload,
} from '../../types/index.js';
import {
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Mail,
  User,
  Lock,
  Phone,
  FileText,
  Search,
  DollarSign,
  Calculator,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Printer,
  Award,
  Sparkles,
  TrendingUp,
  Calendar,
  Layers,
  FileSpreadsheet,
  Coins,
  RotateCcw,
  History,
  CheckCircle2,
} from 'lucide-react';
import { formatSriLankanTime } from '../../utils/sriLankanTime.js';


export const AdminMarkingPanelPage: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'SALARY_REPORT' | 'MEMBERS'>('SALARY_REPORT');

  // Members state
  const [members, setMembers] = useState<MarkingPanelMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Workload & Salary Report state
  const [workloadReport, setWorkloadReport] = useState<PanelMemberWorkloadReport[]>([]);
  const [paperWorkloadReport, setPaperWorkloadReport] = useState<PaperWorkloadReport[]>([]);
  const [workloadSummary, setWorkloadSummary] = useState<PanelWorkloadSummary | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportViewMode, setReportViewMode] = useState<'PAPERS' | 'MEMBERS'>('PAPERS');
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});
  const [expandedPapers, setExpandedPapers] = useState<Record<string, boolean>>({});

  // Pagination states
  const [paperPage, setPaperPage] = useState<number>(1);
  const [paperPageSize, setPaperPageSize] = useState<number>(10);
  const [memberReportPage, setMemberReportPage] = useState<number>(1);
  const [memberReportPageSize, setMemberReportPageSize] = useState<number>(10);
  const [memberPage, setMemberPage] = useState<number>(1);
  const [memberPageSize, setMemberPageSize] = useState<number>(12);

  // Salary calculation config
  const [ratePerPaper, setRatePerPaper] = useState<number>(75); // Default LKR 75 per paper

  // Workload Settled / Clear State
  const [includeSettledHistory, setIncludeSettledHistory] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<{
    type: 'PAPER' | 'MARKER';
    quizId: string;
    title: string;
    count: number;
    memberId?: string;
    memberName?: string;
  } | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccessAlert, setClearSuccessAlert] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<MarkingPanelMember | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);



  // Fetch Members List
  const fetchMembers = () => {
    setLoadingMembers(true);
    api
      .get('/admin/panel-members')
      .then((res) => {
        setMembers(res.data?.data || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoadingMembers(false));
  };

  // Fetch Workload and Salary Report
  const fetchWorkloadReport = (includeSettled: boolean = includeSettledHistory) => {
    setLoadingReport(true);
    api
      .get(`/admin/panel-members/workload-report${includeSettled ? '?includeSettled=true' : ''}`)
      .then((res) => {
        const reportData = res.data?.data;
        if (reportData) {
          setWorkloadReport(reportData.members || []);
          setPaperWorkloadReport(reportData.papers || []);
          setWorkloadSummary(reportData.summary || null);

          // By default expand members who have marked papers or settled papers
          const expandedInit: Record<string, boolean> = {};
          (reportData.members || []).forEach((m: PanelMemberWorkloadReport) => {
            if (m.totalMarkedCount > 0 || (m.totalSettledCount && m.totalSettledCount > 0)) {
              expandedInit[m.memberId] = true;
            }
          });
          setExpandedMembers(expandedInit);

          // By default expand papers that have submissions
          const expandedPapersInit: Record<string, boolean> = {};
          (reportData.papers || []).forEach((p: PaperWorkloadReport) => {
            if (p.markedCount > 0 || (p.settledCount && p.settledCount > 0) || p.totalSubmissions > 0) {
              expandedPapersInit[p.quizId] = true;
            }
          });
          setExpandedPapers(expandedPapersInit);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoadingReport(false));
  };

  const openClearPaperModal = (quizId: string, title: string, count: number) => {
    setClearTarget({
      type: 'PAPER',
      quizId,
      title,
      count,
    });
    setIsClearModalOpen(true);
  };

  const openClearMarkerModal = (
    quizId: string,
    memberId: string,
    memberName: string,
    title: string,
    count: number
  ) => {
    setClearTarget({
      type: 'MARKER',
      quizId,
      memberId,
      memberName,
      title,
      count,
    });
    setIsClearModalOpen(true);
  };

  const handleConfirmClear = async () => {
    if (!clearTarget) return;
    setIsClearing(true);
    try {
      if (clearTarget.type === 'PAPER') {
        const res = await api.post(`/admin/panel-members/workload/paper/${clearTarget.quizId}/clear`);
        setClearSuccessAlert(
          res.data?.message || `Marked paper count for ${clearTarget.title} cleared successfully.`
        );
      } else {
        const res = await api.post(
          `/admin/panel-members/workload/paper/${clearTarget.quizId}/marker/${clearTarget.memberId}/clear`
        );
        setClearSuccessAlert(
          res.data?.message || `Marked count for ${clearTarget.memberName} on ${clearTarget.title} cleared successfully.`
        );
      }
      setIsClearModalOpen(false);
      setClearTarget(null);
      fetchWorkloadReport(includeSettledHistory);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to clear workload count.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleRestorePaperCount = async (quizId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to restore the cleared marked count for this paper?'
      )
    ) {
      return;
    }
    try {
      const res = await api.post(`/admin/panel-members/workload/paper/${quizId}/restore`);
      setClearSuccessAlert(res.data?.message || 'Marked count restored successfully.');
      fetchWorkloadReport(includeSettledHistory);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to restore paper workload count.');
    }
  };

  const handleRestoreMarkerPaperCount = async (quizId: string, memberId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to restore the cleared marked count for this examiner?'
      )
    ) {
      return;
    }
    try {
      const res = await api.post(`/admin/panel-members/workload/paper/${quizId}/marker/${memberId}/restore`);
      setClearSuccessAlert(res.data?.message || 'Marker workload count restored successfully.');
      fetchWorkloadReport(includeSettledHistory);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to restore marker workload count.');
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchWorkloadReport();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      await api.post('/admin/panel-members', {
        name,
        email,
        username,
        password,
        phoneNumber,
        notes,
      });

      setSuccessMsg(`Marking panel member "${name}" created successfully!`);
      setName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setPhoneNumber('');
      setNotes('');
      setIsAddModalOpen(false);
      fetchMembers();
      fetchWorkloadReport();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create panel member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (member: MarkingPanelMember) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name} (${member.username}) from the marking panel?`)) {
      return;
    }

    try {
      await api.delete(`/admin/panel-members/${member._id}`);
      setMembers((prev) => prev.filter((m) => m._id !== member._id));
      fetchWorkloadReport();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete panel member.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetSubmitting(true);

    try {
      await api.post(`/admin/panel-members/${resetModalUser._id}/reset-password`, {
        newPassword,
      });
      alert(`Password updated for ${resetModalUser.username}`);
      setResetModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const toggleMemberExpand = (memberId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const togglePaperExpand = (quizId: string) => {
    setExpandedPapers((prev) => ({
      ...prev,
      [quizId]: !prev[quizId],
    }));
  };

  // Export Workload & Salary Report to CSV
  const handleExportCSV = () => {
    if (reportViewMode === 'PAPERS') {
      if (paperWorkloadReport.length === 0) {
        alert('No paper workload data available to export.');
        return;
      }

      const headers = [
        'Status',
        'Exam Number',
        'Paper Title',
        'Subject',
        'A/L Year',
        'Total Submissions',
        'Active Marked',
        'Settled / Recorded',
        'Total Pending',
        'Examiner Name',
        'Examiner Username',
        'Examiner Phone',
        'Papers Marked By Examiner',
        'Examiner Settled Count',
        'Salary Rate (LKR)',
        'Examiner Payable Salary (LKR)',
        'Last Marked Date',
      ];

      const rows: string[][] = [];

      paperWorkloadReport.forEach((paper) => {
        const paperStatus = paper.isFullySettled ? 'Settled/Recorded' : paper.markedCount > 0 ? 'Active' : 'Unmarked';
        if (paper.panelMembers.length === 0) {
          rows.push([
            paperStatus,
            `"Exam #${paper.quizNumber}"`,
            `"${paper.title.replace(/"/g, '""')}"`,
            `"${paper.subjectName || ''}"`,
            `"${paper.alYear || ''}"`,
            String(paper.totalSubmissions),
            String(paper.markedCount),
            String(paper.settledCount || 0),
            String(paper.pendingCount),
            'None',
            '-',
            '-',
            '0',
            '0',
            String(ratePerPaper),
            '0.00',
            '-',
          ]);
        } else {
          paper.panelMembers.forEach((member) => {
            const memberSalary = (member.markedCount * ratePerPaper).toFixed(2);
            const memberStatus = member.isSettled ? 'Settled/Recorded' : member.markedCount > 0 ? 'Active' : 'Unmarked';
            rows.push([
              memberStatus,
              `"Exam #${paper.quizNumber}"`,
              `"${paper.title.replace(/"/g, '""')}"`,
              `"${paper.subjectName || ''}"`,
              `"${paper.alYear || ''}"`,
              String(paper.totalSubmissions),
              String(paper.markedCount),
              String(paper.settledCount || 0),
              String(paper.pendingCount),
              `"${member.name.replace(/"/g, '""')}"`,
              `"${member.username}"`,
              `"${member.phoneNumber || ''}"`,
              String(member.markedCount),
              String(member.settledCount || 0),
              String(ratePerPaper),
              memberSalary,
              member.lastMarkedAt ? `"${formatSriLankanTime(new Date(member.lastMarkedAt))}"` : '-',
            ]);
          });
        }
      });

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `BS_Paper_Wise_Marking_Salary_Report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (workloadReport.length === 0) {
      alert('No workload data available to export.');
      return;
    }

    const headers = [
      'Member Name',
      'Username',
      'Phone Number',
      'Email',
      'Status',
      'Quiz Number',
      'Paper Title',
      'Subject',
      'A/L Year',
      'Active Marked Count',
      'Settled Count',
      'Rate Per Paper (LKR)',
      'Calculated Salary (LKR)',
      'First Marked At',
      'Last Marked At',
    ];

    const rows: string[][] = [];

    workloadReport.forEach((member) => {
      if (member.quizzes.length === 0) {
        rows.push([
          `"${member.name.replace(/"/g, '""')}"`,
          `"${member.username}"`,
          `"${member.phoneNumber || ''}"`,
          `"${member.email}"`,
          'No activity',
          'None',
          'No papers marked yet',
          '-',
          '-',
          '0',
          '0',
          String(ratePerPaper),
          '0.00',
          '-',
          '-',
        ]);
      } else {
        member.quizzes.forEach((quiz) => {
          const quizSalary = (quiz.markedCount * ratePerPaper).toFixed(2);
          const quizStatus = quiz.isSettled ? 'Settled/Recorded' : quiz.markedCount > 0 ? 'Active' : 'Unmarked';
          rows.push([
            `"${member.name.replace(/"/g, '""')}"`,
            `"${member.username}"`,
            `"${member.phoneNumber || ''}"`,
            `"${member.email}"`,
            quizStatus,
            `"Quiz #${quiz.quizNumber || 1}"`,
            `"${(quiz.title || '').replace(/"/g, '""')}"`,
            `"${(quiz.subjectName || '').replace(/"/g, '""')}"`,
            `"${quiz.alYear || ''}"`,
            String(quiz.markedCount),
            String(quiz.settledCount || 0),
            String(ratePerPaper),
            quizSalary,
            quiz.firstMarkedAt ? `"${formatSriLankanTime(new Date(quiz.firstMarkedAt))}"` : '-',
            quiz.lastMarkedAt ? `"${formatSriLankanTime(new Date(quiz.lastMarkedAt))}"` : '-',
          ]);
        });
      }
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `BS_Marking_Panel_Salary_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredMembers = members.filter((m) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.phoneNumber || '').toLowerCase().includes(q)
    );
  });

  const filteredReport = workloadReport.filter((m) => {
    if (!reportSearchQuery.trim()) return true;
    const q = reportSearchQuery.toLowerCase();
    const matchesMember =
      (m.name || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.phoneNumber || '').toLowerCase().includes(q);

    const matchesQuiz = m.quizzes.some((quiz) =>
      (quiz.title || '').toLowerCase().includes(q) ||
      (quiz.subjectName || '').toLowerCase().includes(q) ||
      `quiz #${quiz.quizNumber}`.includes(q)
    );

    return matchesMember || matchesQuiz;
  });

  const filteredPaperReport = paperWorkloadReport.filter((p) => {
    if (!reportSearchQuery.trim()) return true;
    const q = reportSearchQuery.toLowerCase();
    const matchesPaper =
      (p.title || '').toLowerCase().includes(q) ||
      (p.subjectName || '').toLowerCase().includes(q) ||
      `quiz #${p.quizNumber}`.includes(q);
    const matchesMarker = p.panelMembers.some(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        (m.phoneNumber && m.phoneNumber.includes(q))
    );

    return matchesPaper || matchesMarker;
  });

  // Paper Report Pagination
  const totalPaperPages = Math.max(
    1,
    paperPageSize === -1 ? 1 : Math.ceil(filteredPaperReport.length / paperPageSize)
  );
  const validPaperPage = Math.min(Math.max(1, paperPage), totalPaperPages);
  const paperStartIndex = (validPaperPage - 1) * (paperPageSize === -1 ? filteredPaperReport.length : paperPageSize);
  const paperEndIndex =
    paperPageSize === -1
      ? filteredPaperReport.length
      : Math.min(paperStartIndex + paperPageSize, filteredPaperReport.length);
  const paginatedPaperReport = filteredPaperReport.slice(paperStartIndex, paperEndIndex);

  // Member Report Pagination
  const totalMemberReportPages = Math.max(
    1,
    memberReportPageSize === -1 ? 1 : Math.ceil(filteredReport.length / memberReportPageSize)
  );
  const validMemberReportPage = Math.min(Math.max(1, memberReportPage), totalMemberReportPages);
  const memberReportStartIndex = (validMemberReportPage - 1) * (memberReportPageSize === -1 ? filteredReport.length : memberReportPageSize);
  const memberReportEndIndex =
    memberReportPageSize === -1
      ? filteredReport.length
      : Math.min(memberReportStartIndex + memberReportPageSize, filteredReport.length);
  const paginatedMemberReport = filteredReport.slice(memberReportStartIndex, memberReportEndIndex);

  // Members Directory Pagination
  const totalMemberPages = Math.max(
    1,
    memberPageSize === -1 ? 1 : Math.ceil(filteredMembers.length / memberPageSize)
  );
  const validMemberPage = Math.min(Math.max(1, memberPage), totalMemberPages);
  const memberStartIndex = (validMemberPage - 1) * (memberPageSize === -1 ? filteredMembers.length : memberPageSize);
  const memberEndIndex =
    memberPageSize === -1
      ? filteredMembers.length
      : Math.min(memberStartIndex + memberPageSize, filteredMembers.length);
  const paginatedMembers = filteredMembers.slice(memberStartIndex, memberEndIndex);

  // Calculate totals
  const totalMarkedPapers = workloadSummary?.totalMarkedPapers || 0;
  const totalPendingPapers = workloadSummary?.totalPendingPapers ?? 0;
  const totalSubmissions = workloadSummary?.totalSubmissions ?? (totalMarkedPapers + totalPendingPapers);
  const totalPayroll = totalMarkedPapers * ratePerPaper;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl text-indigo-500 dark:text-indigo-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
              Marking Panel & Compensation Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track paper marking counts per panel member, calculate examiner payroll, and manage member credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Panel Member
          </button>
          <a
            href="/panel/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold rounded-2xl transition-all"
          >
            <ExternalLink className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            Open Marker Portal
          </a>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('SALARY_REPORT')}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'SALARY_REPORT'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Marking Workload & Compensation Report</span>
        </button>

        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'MEMBERS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Panel Members Directory ({members.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MARKING WORKLOAD & SALARY REPORT                  */}
      {/* ======================================================== */}
      {activeTab === 'SALARY_REPORT' && (
        <div className="space-y-6">
          {/* Summary KPIs & Salary Calculator Widget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Papers Marked */}
            <div className="p-5 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Marked Papers</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {totalMarkedPapers.toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Fully evaluated & confirmed
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {/* Active Examiners */}
            <div className="p-5 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Examiners</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {workloadSummary?.activeMarkersCount || 0}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {workloadSummary?.totalMarkers || members.length}</span>
                </p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                  Assigned paper evaluation
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Total Quizzes Evaluated */}
            <div className="p-5 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Exams Evaluated</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {workloadSummary?.totalQuizzesEvaluated || 0}
                </p>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">
                  Full paper essay exams
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-600 dark:text-purple-400">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* Estimated Total Salary Payroll */}
            <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:bg-slate-900/70 border border-amber-300 dark:border-amber-500/30 rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Total Payroll Estimate
                </p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1">
                  LKR {totalPayroll.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  @ LKR {ratePerPaper} per paper
                </p>
              </div>
              <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-400">
                <Coins className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Interactive Salary Rate Calculator & Actions Bar */}
          <div className="p-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Rate setting */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Marking Compensation Rate per Paper (LKR):
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-slate-500">LKR</span>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={ratePerPaper}
                    onChange={(e) => setRatePerPaper(Math.max(0, Number(e.target.value) || 0))}
                    className="w-28 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400">/ paper</span>
                </div>
              </div>
            </div>

            {/* Search & Export Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter examiner or paper title..."
                  value={reportSearchQuery}
                  onChange={(e) => {
                    setReportSearchQuery(e.target.value);
                    setPaperPage(1);
                    setMemberReportPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                {reportSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setReportSearchQuery('');
                      setPaperPage(1);
                      setMemberReportPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                title="Export detailed salary sheet to CSV / Excel"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Print Salary Report"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !includeSettledHistory;
                  setIncludeSettledHistory(nextVal);
                  fetchWorkloadReport(nextVal);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  includeSettledHistory
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Show or hide previously cleared / recorded paper counts"
              >
                <History className="w-4 h-4" />
                <span>{includeSettledHistory ? 'Hide Cleared' : 'Show Cleared History'}</span>
                {(workloadSummary?.totalSettledPapers || 0) > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      includeSettledHistory
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {workloadSummary?.totalSettledPapers}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Success Notification Alert */}
          {clearSuccessAlert && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-200 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{clearSuccessAlert}</span>
              </div>
              <button
                type="button"
                onClick={() => setClearSuccessAlert(null)}
                className="text-emerald-600 hover:text-emerald-800 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* View Toggle: Paper-Wise vs Examiner-Wise */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setReportViewMode('PAPERS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reportViewMode === 'PAPERS'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Paper-Wise View</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-mono">
                  {paperWorkloadReport.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReportViewMode('MEMBERS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reportViewMode === 'MEMBERS'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>Examiner-Wise View</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono">
                  {workloadReport.length}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {reportViewMode === 'PAPERS'
                  ? `Showing ${filteredPaperReport.length === 0 ? 0 : paperStartIndex + 1}–${paperEndIndex} of ${filteredPaperReport.length} papers`
                  : `Showing ${filteredReport.length === 0 ? 0 : memberReportStartIndex + 1}–${memberReportEndIndex} of ${filteredReport.length} examiners`}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-semibold text-slate-400">Show:</span>
                {[10, 20, 50, -1].map((size) => {
                  const currentSize = reportViewMode === 'PAPERS' ? paperPageSize : memberReportPageSize;
                  const setSize = reportViewMode === 'PAPERS' ? setPaperPageSize : setMemberReportPageSize;
                  const setPg = reportViewMode === 'PAPERS' ? setPaperPage : setMemberReportPage;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSize(size);
                        setPg(1);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentSize === size
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {size === -1 ? 'All' : size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Itemized Workload & Salary Breakdown */}
          {loadingReport ? (
            <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold">Generating salary & paper marking report...</span>
            </div>
          ) : reportViewMode === 'PAPERS' ? (
            filteredPaperReport.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <Layers className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  No Examination Papers Found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {reportSearchQuery
                    ? 'No examination papers match your search criteria.'
                    : 'No student essay papers have been uploaded or marked yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedPaperReport.map((paper) => {
                  const isExpanded = Boolean(expandedPapers[paper.quizId]);
                  const paperTotalSalary = paper.markedCount * ratePerPaper;

                  return (
                    <div
                      key={paper.quizId}
                      className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md transition-all"
                    >
                      {/* Paper Header Card */}
                      <div
                        onClick={() => togglePaperExpand(paper.quizId)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 font-mono">
                            #{paper.quizNumber}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {paper.title}
                              </h3>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                                {paper.subjectName}
                              </span>
                              {paper.alYear && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {paper.alYear}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-mono">
                              <span>Total Uploads: <strong className="text-slate-700 dark:text-slate-200">{paper.totalSubmissions}</strong></span>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Marked: {paper.markedCount}</span>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400">Pending: {paper.pendingCount}</span>
                              <span>•</span>
                              <span>{paper.panelMembers.length} Panel Marker{paper.panelMembers.length === 1 ? '' : 's'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Badges: Marked Count, Paper Payroll, and Clear/Restore Action */}
                        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap justify-end">
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl">
                                {paper.markedCount} / {paper.totalSubmissions} Marked
                              </span>
                              <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black rounded-xl font-mono">
                                LKR {paperTotalSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Payroll for this paper @ LKR {ratePerPaper}/paper
                            </p>
                          </div>

                          {/* Paper-Wise Clear / Delete Marked Count Button */}
                          {paper.markedCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openClearPaperModal(
                                  paper.quizId,
                                  `Exam #${paper.quizNumber} - ${paper.title}`,
                                  paper.markedCount
                                );
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                              title="Delete / Clear marked paper count for this paper"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Clear Count</span>
                            </button>
                          )}

                          {/* Paper-Wise Previously Cleared / Recorded Badge & Restore */}
                          {paper.markedCount === 0 && (paper.settledCount || 0) > 0 && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2"
                            >
                              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-xl flex items-center gap-1 font-mono">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Recorded ({paper.settledCount})</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestorePaperCount(paper.quizId);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                                title="Restore cleared marked count for this paper"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Examiner Itemization Table */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-emerald-500" />
                              <span>Examiners Who Marked This Paper</span>
                            </h4>
                            <span className="text-xs text-slate-500 font-mono">
                              Rate: LKR {ratePerPaper} per paper
                            </span>
                          </div>

                          {paper.panelMembers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                              No submissions have been marked yet for this paper.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                                    <th className="py-2.5 px-3">Examiner</th>
                                    <th className="py-2.5 px-3">Username / Contact</th>
                                    <th className="py-2.5 px-3 text-center">Papers Marked</th>
                                    <th className="py-2.5 px-3 text-right">Rate</th>
                                    <th className="py-2.5 px-3 text-right">Payable Amount</th>
                                    <th className="py-2.5 px-3 text-right">Last Marking Activity</th>
                                    <th className="py-2.5 px-3 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                  {paper.panelMembers.map((member) => {
                                    const memberSalary = member.markedCount * ratePerPaper;
                                    return (
                                      <tr
                                        key={member.memberId}
                                        className="hover:bg-white/60 dark:hover:bg-slate-800/40 transition-colors"
                                      >
                                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                                          {member.name}
                                        </td>
                                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                          @{member.username} {member.phoneNumber ? `• ${member.phoneNumber}` : ''}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg font-mono">
                                            {member.markedCount} Papers
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-500 font-mono">
                                          LKR {ratePerPaper}
                                        </td>
                                        <td className="py-3 px-3 text-right font-bold text-amber-600 dark:text-amber-400 font-mono">
                                          LKR {memberSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-3 text-right text-[11px] text-slate-400 font-mono">
                                          {member.lastMarkedAt ? formatSriLankanTime(new Date(member.lastMarkedAt)) : '-'}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                          {member.markedCount > 0 ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openClearMarkerModal(
                                                  paper.quizId,
                                                  member.memberId,
                                                  member.name,
                                                  `Exam #${paper.quizNumber}`,
                                                  member.markedCount
                                                )
                                              }
                                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                                              title={`Delete / Clear count for ${member.name} on this paper`}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              <span>Clear</span>
                                            </button>
                                          ) : (member.settledCount || 0) > 0 ? (
                                            <div className="inline-flex items-center gap-1.5 justify-end">
                                              <span className="text-[10px] text-slate-400 font-mono">Recorded ({member.settledCount})</span>
                                              <button
                                                type="button"
                                                onClick={() => handleRestoreMarkerPaperCount(paper.quizId, member.memberId)}
                                                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg cursor-pointer"
                                                title="Restore cleared count"
                                              >
                                                <RotateCcw className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 text-[11px]">-</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-900/50">
                                    <td colSpan={2} className="py-2.5 px-3 text-right">
                                      Total for Exam #{paper.quizNumber}:
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400">
                                      {paper.markedCount} Papers Marked
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                                      @ LKR {ratePerPaper}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-black text-amber-600 dark:text-amber-400 font-mono text-sm">
                                      LKR {paperTotalSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2.5 px-3"></td>
                                    <td className="py-2.5 px-3"></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Paper Report Pagination Controls */}
                {totalPaperPages > 1 && (
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Page <strong className="text-slate-900 dark:text-white">{validPaperPage}</strong> of{' '}
                      <strong className="text-slate-900 dark:text-white">{totalPaperPages}</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={validPaperPage <= 1}
                        onClick={() => setPaperPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPaperPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPaperPages ||
                            Math.abs(p - validPaperPage) <= 1
                        )
                        .map((p, i, arr) => (
                          <React.Fragment key={p}>
                            {i > 0 && p - arr[i - 1] > 1 && (
                              <span className="px-1 text-slate-400">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setPaperPage(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                validPaperPage === p
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        ))}
                      <button
                        type="button"
                        disabled={validPaperPage >= totalPaperPages}
                        onClick={() => setPaperPage((p) => Math.min(totalPaperPages, p + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : filteredReport.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <Coins className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No Workload Data Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {reportSearchQuery
                  ? 'No examiners match your search.'
                  : 'No student essay papers have been marked and confirmed yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedMemberReport.map((member) => {
                const isExpanded = Boolean(expandedMembers[member.memberId]);
                const memberTotalSalary = member.totalMarkedCount * ratePerPaper;

                return (
                  <div
                    key={member.memberId}
                    className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md transition-all"
                  >
                    {/* Member Header Card */}
                    <div
                      onClick={() => toggleMemberExpand(member.memberId)}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </h3>
                            <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                              @{member.username}
                            </span>
                            {member.phoneNumber && (
                              <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {member.phoneNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {member.email} {member.notes ? `• ${member.notes}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right Badges: Marked Count & Calculated Salary */}
                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl">
                              {member.totalMarkedCount} Papers Marked
                            </span>
                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black rounded-xl font-mono">
                              LKR {memberTotalSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {member.quizzes.length} unique paper{member.quizzes.length === 1 ? '' : 's'} evaluated
                          </p>
                        </div>

                        <button
                          type="button"
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Itemized Table of Paper Titles */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-blue-500" />
                            <span>Marked Papers Breakdown</span>
                          </h4>
                          <span className="text-xs text-slate-500">
                            Calculation: {ratePerPaper} LKR / paper
                          </span>
                        </div>

                        {member.quizzes.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                            This examiner has not evaluated any papers yet.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                                  <th className="py-2.5 px-3">Quiz #</th>
                                  <th className="py-2.5 px-3">Paper Title</th>
                                  <th className="py-2.5 px-3">Subject / Batch</th>
                                  <th className="py-2.5 px-3 text-center">Papers Marked</th>
                                  <th className="py-2.5 px-3 text-right">Rate</th>
                                  <th className="py-2.5 px-3 text-right">Subtotal Salary</th>
                                  <th className="py-2.5 px-3 text-right">Marking Timeline</th>
                                  <th className="py-2.5 px-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                {member.quizzes.map((quiz) => {
                                  const quizSalary = quiz.markedCount * ratePerPaper;

                                  return (
                                    <tr
                                      key={quiz.quizId}
                                      className="hover:bg-white/60 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                        #{quiz.quizNumber}
                                      </td>
                                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                                        {quiz.title}
                                      </td>
                                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                                        {quiz.subjectName} {quiz.alYear ? `(${quiz.alYear})` : ''}
                                      </td>
                                      <td className="py-3 px-3 text-center">
                                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg font-mono">
                                          {quiz.markedCount}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-right text-slate-500 font-mono">
                                        LKR {ratePerPaper}
                                      </td>
                                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                                        LKR {quizSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-3 px-3 text-right text-[11px] text-slate-400 font-mono">
                                        {quiz.lastMarkedAt ? formatSriLankanTime(new Date(quiz.lastMarkedAt)) : '-'}
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        {quiz.markedCount > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openClearMarkerModal(
                                                quiz.quizId,
                                                member.memberId,
                                                member.name,
                                                `Exam #${quiz.quizNumber} - ${quiz.title}`,
                                                quiz.markedCount
                                              )
                                            }
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                                            title={`Delete / Clear count for ${member.name} on Exam #${quiz.quizNumber}`}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                            <span>Clear</span>
                                          </button>
                                        ) : (quiz.settledCount || 0) > 0 ? (
                                          <div className="inline-flex items-center gap-1.5 justify-end">
                                            <span className="text-[10px] text-slate-400 font-mono">Recorded ({quiz.settledCount})</span>
                                            <button
                                              type="button"
                                              onClick={() => handleRestoreMarkerPaperCount(quiz.quizId, member.memberId)}
                                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg cursor-pointer"
                                              title="Restore cleared count"
                                            >
                                              <RotateCcw className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 text-[11px]">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-900/50">
                                  <td colSpan={3} className="py-2.5 px-3 text-right">
                                    Total for {member.name}:
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400">
                                    {member.totalMarkedCount} Papers
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                                    @ LKR {ratePerPaper}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-black text-amber-600 dark:text-amber-400 font-mono text-sm">
                                    LKR {memberTotalSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-3"></td>
                                  <td className="py-2.5 px-3"></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Member Report Pagination Controls */}
              {totalMemberReportPages > 1 && (
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Page <strong className="text-slate-900 dark:text-white">{validMemberReportPage}</strong> of{' '}
                    <strong className="text-slate-900 dark:text-white">{totalMemberReportPages}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={validMemberReportPage <= 1}
                      onClick={() => setMemberReportPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalMemberReportPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalMemberReportPages ||
                          Math.abs(p - validMemberReportPage) <= 1
                      )
                      .map((p, i, arr) => (
                        <React.Fragment key={p}>
                          {i > 0 && p - arr[i - 1] > 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setMemberReportPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              validMemberReportPage === p
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}
                    <button
                      type="button"
                      disabled={validMemberReportPage >= totalMemberReportPages}
                      onClick={() => setMemberReportPage((p) => Math.min(totalMemberReportPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PANEL MEMBERS DIRECTORY                           */}
      {/* ======================================================== */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-6">
          {/* Search and count bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search member name, email, or username..."
                value={memberSearchQuery}
                onChange={(e) => {
                  setMemberSearchQuery(e.target.value);
                  setMemberPage(1);
                }}
                className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
              />
              {memberSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setMemberSearchQuery('');
                    setMemberPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing <strong className="text-slate-900 dark:text-white">{filteredMembers.length === 0 ? 0 : memberStartIndex + 1}–{memberEndIndex}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{filteredMembers.length}</strong>
              </span>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-semibold text-slate-400">Show:</span>
                {[12, 24, 48, -1].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setMemberPageSize(size);
                      setMemberPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      memberPageSize === size
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {size === -1 ? 'All' : size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Member Cards / Table */}
          {loadingMembers ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold">Loading marking panel members...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm">
              <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">No Marking Panel Members Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {memberSearchQuery
                  ? 'No members match your search criteria.'
                  : 'Click "Add Panel Member" above to create an examiner account with credentials.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedMembers.map((member) => (
                  <div
                    key={member._id}
                    className="p-5 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-3xl transition-all shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{member.name}</h3>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">@{member.username}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold rounded-full">
                          Active
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="font-mono">{member.phoneNumber}</span>
                          </div>
                        )}
                        {member.notes && (
                          <div className="flex items-center gap-2 text-slate-500 italic">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{member.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/60">
                      <button
                        onClick={() => {
                          setResetModalUser(member);
                          setNewPassword('');
                        }}
                        className="p-2 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset PW</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Members Directory Pagination Controls */}
              {totalMemberPages > 1 && (
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Page <strong className="text-slate-900 dark:text-white">{validMemberPage}</strong> of{' '}
                    <strong className="text-slate-900 dark:text-white">{totalMemberPages}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={validMemberPage <= 1}
                      onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalMemberPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalMemberPages ||
                          Math.abs(p - validMemberPage) <= 1
                      )
                      .map((p, i, arr) => (
                        <React.Fragment key={p}>
                          {i > 0 && p - arr[i - 1] > 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setMemberPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              validMemberPage === p
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}
                    <button
                      type="button"
                      disabled={validMemberPage >= totalMemberPages}
                      onClick={() => setMemberPage((p) => Math.min(totalMemberPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Add Marking Panel Member</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name / Display Name <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A.B. Perera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address <span className="text-rose-500 dark:text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="examiner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Username <span className="text-rose-500 dark:text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. perera_marker"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password <span className="text-rose-500 dark:text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile / Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="0771234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Combined Maths / Biology Paper 2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-transparent transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Reset Password for {resetModalUser.name}
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  {resetSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* CLEAR / DELETE MARKED COUNT CONFIRMATION MODAL          */}
      {/* ======================================================== */}
      {isClearModalOpen && clearTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 bg-rose-50/70 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/40 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete / Clear Marked Paper Count
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                  Clear Marked Paper Count (Administrative Action)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isClearing) {
                    setIsClearModalOpen(false);
                    setClearTarget(null);
                  }
                }}
                disabled={isClearing}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Target Details Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Target Paper:</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {clearTarget.title}
                </div>
                {clearTarget.type === 'MARKER' && clearTarget.memberName && (
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Examiner: {clearTarget.memberName}
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Marked papers to clear:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
                    {clearTarget.count} Papers
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Calculated value @ LKR {ratePerPaper}:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    LKR {(clearTarget.count * ratePerPaper).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Safety notice */}
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/70 dark:border-blue-800/50 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Student Marks and Grades are 100% Safe
                  </p>
                  <p className="text-[11px] leading-relaxed text-blue-700/90 dark:text-blue-300/80">
                    This does not delete student submissions or marks. It only resets the examiner payroll tracking count for this paper to zero.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {clearTarget.type === 'PAPER'
                  ? 'Are you sure you have recorded this paper count and want to clear it from the active report?'
                  : `Are you sure you have recorded ${clearTarget.memberName}'s count for this paper and want to clear it?`}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsClearModalOpen(false);
                  setClearTarget(null);
                }}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                {isClearing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Clear Count</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
