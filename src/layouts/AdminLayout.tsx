import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar.js';
import { Footer } from '../components/Footer.js';
import { LayoutDashboard, FileText, Upload, PlusCircle, ShieldCheck, User, Sliders, Users, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manage Quizzes', path: '/admin/quizzes', icon: FileText },
    { label: 'Create Quiz', path: '/admin/quizzes/create', icon: PlusCircle },
    { label: 'AI Quiz Generator', path: '/admin/ai-generator', icon: Sparkles },
    { label: 'PDF Question Import', path: '/admin/pdf-import', icon: Upload },
    { label: 'Marking Panel', path: '/admin/marking-panel', icon: Users },
    { label: 'Registration Settings', path: '/admin/registration-settings', icon: Sliders },
    { label: 'Admin Profile', path: '/admin/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-transparent dark:text-slate-100 text-slate-800 font-sans transition-colors duration-200">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        <aside className="w-64 dark:bg-slate-900/70 bg-white/90 backdrop-blur-xl rounded-3xl p-5 border dark:border-slate-800/80 border-slate-200/90 h-fit hidden md:block shadow-xl shadow-slate-900/5">
            <div className="p-3 bg-gradient-to-tr from-blue-600/15 to-indigo-600/15 rounded-2xl border border-blue-500/25 mb-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">ExamPortal Admin</span>
                <span className="text-[10px] text-slate-400 block font-medium">Management Center</span>
              </div>
            </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30'
                      : 'dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/60 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 space-y-6">
          {/* Mobile Admin Sub-Nav Pills */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 border-b dark:border-slate-800/80 border-slate-200/90 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                      : 'dark:bg-slate-900/80 bg-white dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 border dark:border-slate-800 border-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};
