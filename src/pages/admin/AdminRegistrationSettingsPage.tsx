import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, API_BASE_URL } from '../../services/api.js';
import { RegistrationCategory, RegisteredStudentInfo, Institute } from '../../types/index.js';
import {
  GraduationCap,
  Plus,
  Trash2,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Search,
  MessageCircle,
  FileSpreadsheet,
  RefreshCw,
  Phone,
  Mail,
  School,
  Building,
  X,
  ExternalLink,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Filter,
  RotateCcw,
  Calendar,
  UserCheck,
} from 'lucide-react';

export const AdminRegistrationSettingsPage: React.FC = () => {
  const [categories, setCategories] = useState<RegistrationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<RegistrationCategory | null>(null);

  // Institutes management state
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [institutesLoading, setInstitutesLoading] = useState(true);
  const [instName, setInstName] = useState('');
  const [instDescription, setInstDescription] = useState('');
  const [instSubmitting, setInstSubmitting] = useState(false);
  const [deletingInstId, setDeletingInstId] = useState<string | null>(null);
  const [confirmDeleteInst, setConfirmDeleteInst] = useState<Institute | null>(null);

  // Registered students directory state (Enterprise 4,000+ scale)
  const [students, setStudents] = useState<RegisteredStudentInfo[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('ALL');
  const [selectedInstituteFilter, setSelectedInstituteFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalMatchingStudents, setTotalMatchingStudents] = useState(0);
  const [totalOverallStudents, setTotalOverallStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Feedback states
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

  // Password reset modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<RegisteredStudentInfo | null>(null);
  const [customIdentifier, setCustomIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Search input debouncer (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
  };

  const openResetModalForStudent = (student: RegisteredStudentInfo) => {
    setResetTarget(student);
    setCustomIdentifier(student.username);
    setNewPassword('');
    setShowPassword(true);
    setResetSuccessMsg('');
    setResetErrorMsg('');
    setCopiedPassword(false);
    setResetModalOpen(true);
  };

  const openQuickResetModal = () => {
    setResetTarget(null);
    setCustomIdentifier('');
    setNewPassword('');
    setShowPassword(true);
    setResetSuccessMsg('');
    setResetErrorMsg('');
    setCopiedPassword(false);
    setResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    const identifier = (resetTarget ? resetTarget.username : customIdentifier).trim();
    if (!identifier) {
      setResetErrorMsg('Please enter a username or email address.');
      return;
    }

    setResetErrorMsg('');
    setResetSuccessMsg('');
    setResetSubmitting(true);

    try {
      const payload: any = {
        newPassword: newPassword.trim(),
      };
      if (resetTarget?.userId) {
        payload.userId = resetTarget.userId;
      } else if (resetTarget?._id) {
        payload.studentId = resetTarget._id;
      } else {
        payload.username = identifier;
      }

      const res = await api.post('/admin/users/reset-password', payload);
      setResetSuccessMsg(res.data?.message || `Password for ${identifier} was reset successfully!`);
      setSuccessMsg(`Password for user "${identifier}" reset successfully.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setResetErrorMsg(err.response?.data?.message || 'Failed to reset password. Please check the username or email.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedFieldId(id);
    setTimeout(() => setCopiedFieldId(null), 2000);
  };

  const fetchCategories = () => {
    setLoading(true);
    api
      .get('/admin/categories')
      .then((res) => {
        setCategories(res.data?.data || []);
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || 'Failed to load categories.');
      })
      .finally(() => setLoading(false));
  };

  const fetchInstitutes = () => {
    setInstitutesLoading(true);
    api
      .get('/admin/institutes')
      .then((res) => {
        setInstitutes(res.data?.data || []);
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || 'Failed to load institutes.');
      })
      .finally(() => setInstitutesLoading(false));
  };

  // Enterprise Server-Side Students Fetching with pagination
  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (selectedBatchFilter && selectedBatchFilter !== 'ALL') {
        params.set('category', selectedBatchFilter);
      }
      if (selectedInstituteFilter && selectedInstituteFilter !== 'ALL') {
        params.set('institute', selectedInstituteFilter);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await api.get(`/admin/students?${params.toString()}`);
      const data = res.data?.data;
      setStudents(data?.students || []);
      setTotalMatchingStudents(data?.total || 0);
      if (data?.totalOverall !== undefined) {
        setTotalOverallStudents(data.totalOverall);
      } else if (!selectedBatchFilter || selectedBatchFilter === 'ALL') {
        setTotalOverallStudents((prev) => Math.max(prev, data?.total || 0));
      }
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setStudentsLoading(false);
    }
  }, [page, pageSize, selectedBatchFilter, selectedInstituteFilter, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
    fetchInstitutes();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await api.post('/admin/categories', {
        name: name.trim(),
        description: description.trim(),
      });
      setSuccessMsg(res.data?.message || `Category "${name}" created successfully!`);
      setName('');
      setDescription('');
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to add category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: RegistrationCategory) => {
    const catId = category._id || category.id;
    if (!catId) return;
    setErrorMsg('');
    setSuccessMsg('');
    setDeletingId(catId);

    try {
      const res = await api.delete(`/admin/categories/${catId}`);
      setSuccessMsg(res.data?.message || `Category "${category.name}" removed successfully.`);
      setConfirmDeleteCat(null);
      fetchCategories();
      fetchStudents();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim()) return;

    setErrorMsg('');
    setSuccessMsg('');
    setInstSubmitting(true);

    try {
      const res = await api.post('/admin/institutes', {
        name: instName.trim(),
        description: instDescription.trim(),
      });
      setSuccessMsg(res.data?.message || `Institute "${instName}" created successfully!`);
      setInstName('');
      setInstDescription('');
      fetchInstitutes();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to add institute.');
    } finally {
      setInstSubmitting(false);
    }
  };

  const handleDeleteInstitute = async (inst: Institute) => {
    const instId = inst._id || inst.id;
    if (!instId) return;
    setErrorMsg('');
    setSuccessMsg('');
    setDeletingInstId(instId);

    try {
      const res = await api.delete(`/admin/institutes/${instId}`);
      setSuccessMsg(res.data?.message || `Institute "${inst.name}" removed successfully.`);
      setConfirmDeleteInst(null);
      fetchInstitutes();
      fetchStudents();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete institute.');
    } finally {
      setDeletingInstId(null);
    }
  };

  const handleDownloadStudentsPdf = (batch = selectedBatchFilter, inst = selectedInstituteFilter) => {
    const token = localStorage.getItem('accessToken') || '';
    const params = new URLSearchParams();
    if (batch && batch !== 'ALL') params.set('batch', batch);
    if (inst && inst !== 'ALL') params.set('institute', inst);
    if (token) params.set('token', token);
    window.open(`${API_BASE_URL}/admin/students/pdf?${params.toString()}`, '_blank');
  };

  // Full dataset CSV Export across all 4,000+ students
  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      const params = new URLSearchParams();
      params.set('export', 'true');
      if (selectedBatchFilter && selectedBatchFilter !== 'ALL') {
        params.set('category', selectedBatchFilter);
      }
      if (selectedInstituteFilter && selectedInstituteFilter !== 'ALL') {
        params.set('institute', selectedInstituteFilter);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await api.get(`/admin/students?${params.toString()}`);
      const exportList: RegisteredStudentInfo[] = res.data?.data?.students || [];

      if (exportList.length === 0) {
        alert('No registered students found matching current filters to export.');
        return;
      }

      const headers = ['#', 'Student Name', 'School', 'Institute', 'Username', 'Email', 'WhatsApp Number', 'SMS Contact Number', 'A/L Batch', 'Registered Date'];
      const rows = exportList.map((s, idx) => [
        idx + 1,
        `"${(s.fullName || '').replace(/"/g, '""')}"`,
        `"${(s.school || '').replace(/"/g, '""')}"`,
        `"${(s.institute || 'None').replace(/"/g, '""')}"`,
        `"${(s.username || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${s.whatsappNumber || ''}"`,
        `"${s.phoneNumber || ''}"`,
        `"${s.alYear || ''}"`,
        `"${s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : ''}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      const filterSuffix = `${selectedBatchFilter === 'ALL' ? 'AllBatches' : selectedBatchFilter.replace(/\s+/g, '_')}_${selectedInstituteFilter === 'ALL' ? 'AllInstitutes' : selectedInstituteFilter.replace(/\s+/g, '_')}`;
      link.setAttribute('download', `BS_Registered_Students_${filterSuffix}_${exportList.length}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Failed to export students. Please try again.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedBatchFilter('ALL');
    setSelectedInstituteFilter('ALL');
    setSearchQuery('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setPage(p);
      setJumpPageInput('');
    }
  };

  // Smart page numbers array generator with ellipsis
  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (typeof i === 'number' && i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (typeof i === 'number' && i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      if (typeof i === 'number') l = i;
    }

    return rangeWithDots;
  }, [page, totalPages]);

  // Helpers for avatars and institute styles
  const getInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-purple-600 to-pink-600',
      'from-emerald-600 to-teal-600',
      'from-amber-600 to-orange-600',
      'from-rose-600 to-red-600',
      'from-cyan-600 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  };

  const getInstituteBadgeStyle = (inst?: string) => {
    const norm = (inst || 'none').toLowerCase();
    if (norm.includes('dakme')) {
      return 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30';
    }
    if (norm.includes('online')) {
      return 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30';
    }
    if (norm === 'none') {
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
    return 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30';
  };

  const totalCategoryStudents = categories.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const totalCategoryQuizzes = categories.reduce((sum, c) => sum + (c.quizCount || 0), 0);
  const isFilterActive = selectedBatchFilter !== 'ALL' || selectedInstituteFilter !== 'ALL' || searchQuery.trim().length > 0;

  const startRecord = totalMatchingStudents === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalMatchingStudents);

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-60 h-60 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Registration Configuration &amp; Enterprise Registry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
              Registration Settings &amp; Student Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sinhala leading-relaxed max-w-2xl">
              Student batch categories and institutes management. Search, paginate, filter, and export official PDF/CSV student directories.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleDownloadStudentsPdf(selectedBatchFilter, selectedInstituteFilter)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-102"
              title="Download registered students as an official PDF table"
            >
              <Download className="w-4 h-4 text-emerald-100" />
              Download Students PDF
            </button>

            <button
              onClick={() => {
                fetchCategories();
                fetchInstitutes();
                fetchStudents();
              }}
              disabled={loading || studentsLoading || institutesLoading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || studentsLoading || institutesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Registered Students
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-display">
                {(totalOverallStudents || totalMatchingStudents || totalCategoryStudents).toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Enrolled
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Active A/L Batches
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
              {categories.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <School className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Class Institutes
            </span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-display">
              {institutes.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Batch-Targeted Quizzes
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-display">
              {totalCategoryQuizzes}
            </span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/40 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/40 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 1: Registered Students Information Directory (Scalable Enterprise View) */}
      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* Header Strip with Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-50 dark:bg-emerald-500/15 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Registered Students Directory
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    High-volume registry built for 4,000+ students.
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-mono">
                    {totalMatchingStudents.toLocaleString()} Matching
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={openQuickResetModal}
              className="px-3.5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              title="Directly reset any user's password without requiring previous password"
            >
              <Key className="w-3.5 h-3.5 text-amber-200" /> Reset Password
            </button>

            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
              title="Export all matching records to CSV Excel file"
            >
              {isExportingCsv ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Export CSV</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownloadStudentsPdf(selectedBatchFilter, selectedInstituteFilter)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title="Download official PDF table with Name, School, Institute, Username, Email, and WhatsApp No"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Search, Filter & Sorter Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, school, email, phone..."
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* A/L Batch Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedBatchFilter}
                onChange={(e) => {
                  setSelectedBatchFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">🎓 All Batches</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    🎓 {c.name} ({c.studentCount || 0} students)
                  </option>
                ))}
              </select>
            </div>

            {/* Institute Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedInstituteFilter}
                onChange={(e) => {
                  setSelectedInstituteFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="ALL">🏛️ All Institutes</option>
                {institutes.map((inst) => (
                  <option key={inst._id} value={inst.name}>
                    🏛️ {inst.name} ({inst.studentCount || 0} students)
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div className="relative flex items-center gap-1.5">
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order as 'desc' | 'asc');
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="createdAt:desc">⏱️ Newest Registered</option>
                <option value="createdAt:asc">⏱️ Oldest Registered</option>
                <option value="fullName:asc">🔤 Name (A → Z)</option>
                <option value="fullName:desc">🔤 Name (Z → A)</option>
                <option value="alYear:asc">🎓 Batch (Ascending)</option>
                <option value="institute:asc">🏛️ Institute (A → Z)</option>
              </select>

              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  title="Clear all filters & search"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Badges Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-blue-500" />
                Quick Filters:
              </span>

              <button
                type="button"
                onClick={() => {
                  setSelectedBatchFilter('ALL');
                  setSelectedInstituteFilter('ALL');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedBatchFilter === 'ALL' && selectedInstituteFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                All ({totalOverallStudents || totalMatchingStudents})
              </button>

              {categories.slice(0, 4).map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    setSelectedBatchFilter(c.name);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    selectedBatchFilter === c.name
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  🎓 {c.name}
                </button>
              ))}

              {institutes.slice(0, 4).map((inst) => (
                <button
                  key={inst._id}
                  type="button"
                  onClick={() => {
                    setSelectedInstituteFilter(inst.name);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    selectedInstituteFilter === inst.name
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  🏛️ {inst.name}
                </button>
              ))}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
          </div>
        </div>

        {/* Record Counters & Status Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Showing <strong className="text-slate-900 dark:text-white font-bold">{startRecord}</strong> to{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{endRecord}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{totalMatchingStudents.toLocaleString()}</strong> students
            </span>
            {isFilterActive && (
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                (filtered from {(totalOverallStudents || totalCategoryStudents).toLocaleString()} total)
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Page</span>
            <span className="font-bold text-slate-900 dark:text-white">{page}</span>
            <span>of</span>
            <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
          </div>
        </div>

        {/* High-Performance Registered Students Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-inner">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                <th className="p-3.5 text-center w-12">#</th>
                <th className="p-3.5 min-w-[200px]">Student Name</th>
                <th className="p-3.5 min-w-[150px]">School</th>
                <th className="p-3.5 whitespace-nowrap min-w-[130px]">Institute</th>
                <th className="p-3.5 min-w-[130px]">Username</th>
                <th className="p-3.5 whitespace-nowrap min-w-[170px]">Email Address</th>
                <th className="p-3.5 whitespace-nowrap min-w-[150px]">WhatsApp No</th>
                <th className="p-3.5 text-center whitespace-nowrap min-w-[100px]">A/L Batch</th>
                <th className="p-3.5 text-center whitespace-nowrap min-w-[110px]">Registered On</th>
                <th className="p-3.5 text-center whitespace-nowrap min-w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs bg-white dark:bg-slate-900/40">
              {studentsLoading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold">Loading registered student records...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto opacity-70" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No students found matching the selected filters.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:underline"
                    >
                      Clear search &amp; filters
                    </button>
                  </td>
                </tr>
              ) : (
                students.map((st, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1;
                  const cleanPhone = (st.whatsappNumber || st.phoneNumber || '').replace(/[^0-9]/g, '');
                  const waLink = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith('0') ? '94' + cleanPhone.slice(1) : cleanPhone}`
                    : null;
                  const regDate = st.createdAt ? new Date(st.createdAt).toLocaleDateString('si-LK') : '-';

                  return (
                    <tr
                      key={st._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="p-3.5 text-center font-mono font-bold text-slate-400 dark:text-slate-500 text-[11px]">
                        {rowNumber}
                      </td>

                      {/* Student Name with Avatar */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                              st.fullName
                            )} flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm`}
                          >
                            {getInitials(st.fullName)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {st.fullName}
                          </span>
                        </div>
                      </td>

                      {/* School */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {st.school || '-'}
                      </td>

                      {/* Institute */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 ${getInstituteBadgeStyle(
                            st.institute
                          )}`}
                        >
                          <School className="w-3 h-3 shrink-0" />
                          <span>{st.institute || 'None'}</span>
                        </span>
                      </td>

                      {/* Username (Copiable) */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold text-xs">
                            {st.username}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(st.username, `user_${st._id}`)}
                            className="text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-0.5 rounded cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Copy Username"
                          >
                            {copiedFieldId === `user_${st._id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Email (Copiable) */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{st.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(st.email, `mail_${st._id}`)}
                            className="text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Copy Email"
                          >
                            {copiedFieldId === `mail_${st._id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* WhatsApp & SMS with 1-click chat link */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1 text-[11px]">
                              <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{st.whatsappNumber || st.phoneNumber || '-'}</span>
                            </span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                title="Open WhatsApp Chat directly"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {st.phoneNumber && st.phoneNumber !== st.whatsappNumber && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              <Phone className="w-2.5 h-2.5 text-teal-500 shrink-0" />
                              <span>SMS: {st.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* A/L Batch Badge */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 whitespace-nowrap inline-flex items-center justify-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          <span>{st.alYear || 'General'}</span>
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="p-3.5 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {regDate}
                      </td>

                      {/* Reset Password Action */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openResetModalForStudent(st)}
                          className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] cursor-pointer whitespace-nowrap"
                          title="Reset this user's password directly (no previous password needed)"
                        >
                          <Key className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Reset Password</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Enterprise Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            {/* Quick Record Indicator */}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong>{startRecord}</strong> - <strong>{endRecord}</strong> of{' '}
              <strong>{totalMatchingStudents.toLocaleString()}</strong> students (Page {page} of {totalPages})
            </div>

            {/* Pagination Button Navigation */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* First Page */}
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page === 1 || studentsLoading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || studentsLoading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
                {paginationRange.map((item, i) => {
                  if (item === '...') {
                    return (
                      <span
                        key={`dots_${i}`}
                        className="px-2 py-1 text-slate-400 text-xs font-bold"
                      >
                        ...
                      </span>
                    );
                  }
                  const pageNum = item as number;
                  const isActive = pageNum === page;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      disabled={studentsLoading}
                      className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || studentsLoading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || studentsLoading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              {/* Jump to Page Form */}
              <form onSubmit={handleJumpToPage} className="flex items-center gap-1.5 ml-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="Page"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  className="w-16 px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!jumpPageInput.trim()}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Go
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Add New Category Section */}
      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New A/L Category / Batch</h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Auto-normalizes e.g. "2027 al" to "2027 A/L"
          </span>
        </div>

        <form onSubmit={handleAddCategory} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Category / A/L Batch Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2027 A/L or 2028 A/L"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Standard format: [Year] A/L. You can also type "2027 al" and it will be normalized.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. G.C.E. Advanced Level 2027 Examination Batch"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Optional note explaining what students belong to this batch.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add Category
              </>
            )}
          </button>
        </form>
      </div>

      {/* SECTION 3: Current Active Categories List */}
      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Current Registered A/L Categories ({categories.length})</h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Click trash to delete any category
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No categories found.</p>
            <p>Add a new A/L batch using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat._id || cat.id}
                className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-md group relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-mono">
                        🎓 {cat.name}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCat(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title={`Delete category ${cat.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{cat.studentCount || 0} Students</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{cat.quizCount || 0} Quizzes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Add New Class Institute */}
      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Add New Educational Institute
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            e.g. "Dakme - Matara", "Online", "None"
          </span>
        </div>

        <form onSubmit={handleAddInstitute} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Institute Name *
              </label>
              <input
                type="text"
                required
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="e.g. Dakme - Matara, Apex - Matara, Online"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Name of the educational institute where tuition/classes take place.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={instDescription}
                onChange={(e) => setInstDescription(e.target.value)}
                placeholder="e.g. Physical Class Center - Matara or Online Platform"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Optional notes or details about this institute.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={instSubmitting || !instName.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {instSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add Institute
              </>
            )}
          </button>
        </form>
      </div>

      {/* SECTION 5: Current Active Institutes List */}
      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Current Active Institutes ({institutes.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Click trash to delete any institute
          </span>
        </div>

        {institutesLoading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading institutes...
          </div>
        ) : institutes.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No institutes found.</p>
            <p>Add a new institute using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutes.map((inst) => (
              <div
                key={inst._id || inst.id}
                className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-3 hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-sm dark:shadow-md group relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-mono">
                        🏛️ {inst.name}
                      </span>
                    </div>
                    {inst.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {inst.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteInst(inst)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title={`Delete institute ${inst.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{inst.studentCount || 0} Students</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Institute Confirmation Modal */}
      {confirmDeleteInst && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Delete Institute "{confirmDeleteInst.name}"?
              </h3>
              <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 rounded-2xl text-xs space-y-1.5 text-rose-900 dark:text-slate-300">
                <p className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  Institute Removal
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Removing <strong>"{confirmDeleteInst.name}"</strong> will remove this option from student registration. Any registered students currently in this institute will have their institute reset to <strong>"None"</strong>. Student accounts and quiz records will <strong>NOT</strong> be deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteInst(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteInstitute(confirmDeleteInst)}
                disabled={deletingInstId === confirmDeleteInst._id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {deletingInstId === confirmDeleteInst._id ? 'Deleting...' : 'Delete Institute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDeleteCat && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Delete Category "{confirmDeleteCat.name}" & Purge Batch?
              </h3>
              <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 rounded-2xl text-xs space-y-1.5 text-rose-900 dark:text-slate-300">
                <p className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  Database Memory Management & Batch Purge
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Deleting the <strong>"{confirmDeleteCat.name}"</strong> category will automatically and permanently delete all student accounts registered under this batch along with all their historical records (quiz results, marks, attempts, and submissions) to reclaim database storage.
                </p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                Only proceed when the {confirmDeleteCat.name} examination cycle has fully concluded and this cohort has graduated.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteCat(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteCat)}
                disabled={deletingId === confirmDeleteCat._id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {deletingId === confirmDeleteCat._id ? 'Purging Batch...' : 'Delete & Purge Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Direct Password Reset Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Reset User Password
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Previous password is not required
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target info */}
            {resetTarget ? (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Student Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{resetTarget.fullName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Username:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{resetTarget.username}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Email:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{resetTarget.email}</span>
                </div>
                {resetTarget.whatsappNumber && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">WhatsApp:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {resetTarget.whatsappNumber}
                    </span>
                  </div>
                )}
                {resetTarget.alYear && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Batch:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-300">{resetTarget.alYear}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Target Username or Email Address *
                </label>
                <input
                  type="text"
                  required
                  value={customIdentifier}
                  onChange={(e) => setCustomIdentifier(e.target.value)}
                  placeholder="e.g. kasun123 or student@email.com"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            )}

            {resetSuccessMsg ? (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/40 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{resetSuccessMsg}</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Assigned New Password:
                  </span>
                  <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400 tracking-wider">
                      {newPassword}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-transparent"
                    >
                      {copiedPassword ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* WhatsApp Direct Share Button */}
                {(() => {
                  const targetUser = resetTarget?.username || customIdentifier;
                  const rawPhone = resetTarget?.whatsappNumber || resetTarget?.phoneNumber || '';
                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                  if (!cleanPhone) return null;
                  const intlPhone = cleanPhone.startsWith('0') ? '94' + cleanPhone.slice(1) : cleanPhone;
                  const waMessage = encodeURIComponent(
                    `Hello ${resetTarget?.fullName || targetUser},\nYour ExamPortal account password has been updated successfully.\n\n👤 Username: ${targetUser}\n🔑 New Password: ${newPassword}\n\nPlease log in to the portal using your new password.`
                  );
                  return (
                    <a
                      href={`https://wa.me/${intlPhone}?text=${waMessage}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Send New Password to Student on WhatsApp</span>
                    </a>
                  );
                })()}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-transparent"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      New Password *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Generate Strong Password
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter minimum 6 characters..."
                      className="w-full pl-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    The user will be able to log in immediately with this new password. Previous password is NOT required.
                  </p>
                </div>

                {resetErrorMsg && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                    <span>{resetErrorMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5 text-amber-200" />
                        <span>Reset Password Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
