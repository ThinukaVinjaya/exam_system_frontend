import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { LogOut, User, BarChart2, BookOpen, Shield, FileText, Menu, X, GraduationCap } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.js';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="dark:bg-slate-950/85 bg-white/85 backdrop-blur-xl border-b dark:border-slate-800/80 border-slate-200/90 dark:text-white text-slate-800 sticky top-0 z-50 transition-colors duration-200 shadow-md shadow-slate-900/5 dark:shadow-black/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand Header */}
          <div
            className="flex items-center space-x-3 cursor-pointer group select-none"
            onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard')}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 rounded-xl shadow-md shadow-blue-500/25 border border-blue-400/30 flex items-center justify-center transition-all group-hover:scale-105 flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-extrabold tracking-tight dark:text-white text-slate-900 font-display">
                  ExamPortal
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Online
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block -mt-0.5 font-medium truncate max-w-[170px] sm:max-w-none">
                Examination & Assessment Platform
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop Navigation Links */}
            {user ? (
              <>
                {user.role === 'STUDENT' ? (
                  <div className="hidden md:flex items-center space-x-1">
                    <Link
                      to="/student/dashboard"
                      className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                        location.pathname.startsWith('/student/dashboard')
                          ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-blue-500" /> Exams
                    </Link>
                    <Link
                      to="/student/analytics"
                      className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                        location.pathname.startsWith('/student/analytics')
                          ? 'bg-emerald-50 dark:bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <BarChart2 className="w-4 h-4 text-emerald-500" /> Analytics
                    </Link>
                    <Link
                      to="/student/profile"
                      className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                        location.pathname.startsWith('/student/profile')
                          ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <User className="w-4 h-4 text-blue-500" /> Profile
                    </Link>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center space-x-1">
                    <Link
                      to="/admin/dashboard"
                      className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                        location.pathname === '/admin/dashboard'
                          ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-blue-500" /> Dashboard
                    </Link>
                    <Link
                      to="/admin/quizzes"
                      className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                        location.pathname.startsWith('/admin/quizzes')
                          ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-blue-500" /> Exams
                    </Link>
                    <Link
                      to="/admin/pdf-import"
                      className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                        location.pathname.startsWith('/admin/pdf-import')
                          ? 'bg-amber-50 dark:bg-amber-600/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-amber-500" /> PDF Import
                    </Link>
                    <Link
                      to="/admin/profile"
                      className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                        location.pathname.startsWith('/admin/profile')
                          ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <User className="w-4 h-4 text-blue-500" /> Profile
                    </Link>
                  </div>
                )}

                <div className="h-5 w-px dark:bg-slate-800 bg-slate-200 mx-1 hidden sm:block" />

                {/* Theme Switcher Toggle (Desktop) */}
                <ThemeToggle />

                {/* Profile Avatar / Quick Link */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    to={user.role === 'ADMIN' ? '/admin/profile' : '/student/profile'}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 dark:bg-slate-900/90 bg-slate-100/90 hover:bg-slate-200 dark:hover:bg-slate-800/90 border dark:border-slate-800 border-slate-200 rounded-xl transition-all group"
                    title="View & Edit Profile"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold dark:text-slate-200 text-slate-700 max-w-[100px] sm:max-w-[120px] truncate hidden sm:inline group-hover:text-blue-600 dark:group-hover:text-white">
                      {user.fullName || user.username}
                    </span>
                    {user.role === 'ADMIN' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        Admin
                      </span>
                    )}
                  </Link>

                  <button
                    onClick={logout}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all hidden sm:flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>

                  {/* Mobile Hamburger Menu Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 md:hidden transition-all cursor-pointer"
                    aria-label="Toggle Navigation Menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Theme Switcher for Guests */}
                <ThemeToggle />

                <Link
                  to="/login"
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t dark:border-slate-800/80 border-slate-200/90 dark:bg-slate-950/98 bg-white/98 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200 shadow-xl">
          {user ? (
            <>
              <div className="px-3 py-2.5 dark:bg-slate-900/60 bg-slate-50 rounded-xl border dark:border-slate-800/80 border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold dark:text-white text-slate-900 truncate max-w-[170px]">{user.fullName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.role.toLowerCase()} Account</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  {user.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              {user.role === 'STUDENT' ? (
                <div className="space-y-1">
                  <Link
                    to="/student/dashboard"
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname.startsWith('/student/dashboard')
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-500" /> Examinations
                  </Link>
                  <Link
                    to="/student/analytics"
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname.startsWith('/student/analytics')
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4 text-emerald-500" /> Performance Analytics
                  </Link>
                  <Link
                    to="/student/profile"
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname.startsWith('/student/profile')
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4 text-blue-500" /> Student Profile
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname === '/admin/dashboard'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-blue-500" /> Dashboard Overview
                  </Link>
                  <Link
                    to="/admin/quizzes"
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname.startsWith('/admin/quizzes')
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-500" /> Manage Exams
                  </Link>
                  <Link
                    to="/admin/pdf-import"
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname.startsWith('/admin/pdf-import')
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-amber-500" /> PDF Question Import
                  </Link>
                  <Link
                    to="/admin/profile"
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname.startsWith('/admin/profile')
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4 text-blue-500" /> Administrator Profile
                  </Link>
                </div>
              )}

              <div className="pt-2 border-t dark:border-slate-800/80 border-slate-200">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out from Account
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-200">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Appearance</span>
                <ThemeToggle showLabel />
              </div>
              <Link
                to="/login"
                className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
