import React from 'react';
import { ExternalLink, GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="dark:bg-slate-950/85 bg-white/85 backdrop-blur-xl border-t dark:border-slate-900/90 border-slate-200/90 dark:text-slate-400 text-slate-500 py-6 mt-auto pb-20 sm:pb-6 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl border border-blue-400/30 shadow-md flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold dark:text-white text-slate-900 block font-display">ExamPortal</span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Online Examination System</span>
          </div>
        </div>

        <div className="text-center sm:text-right space-y-1 sm:pr-20">
          <p className="text-xs font-semibold dark:text-slate-300 text-slate-600">
            © {new Date().getFullYear()} ExamPortal. All rights reserved.
          </p>
          <p className="text-[11px] dark:text-slate-400 text-slate-500 flex items-center justify-center sm:justify-end gap-1.5">
            <span>Meet Developer:</span>
            <a
              href="https://thinukavinjaya.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors inline-flex items-center gap-1"
            >
              Thinuka Vinjaya
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
