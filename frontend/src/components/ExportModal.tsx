'use client';

import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Code, FileCode, X } from 'lucide-react';
import { getExportUrl } from '@/lib/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  meetingId,
  meetingTitle
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyClipboard = async () => {
    try {
      const res = await fetch(getExportUrl(meetingId, 'markdown'));
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Could not copy to clipboard.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
            <Download className="w-4 h-4" />
            <span>Export Meeting Notes</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Export full transcript, executive summary, chapters, and action items for{' '}
          <strong className="text-slate-700 dark:text-slate-300">&ldquo;{meetingTitle}&rdquo;</strong>.
        </p>

        <div className="mt-4 space-y-2.5">
          {/* Markdown Download */}
          <a
            href={getExportUrl(meetingId, 'markdown')}
            download
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Markdown (.md)</p>
                <p className="text-[11px] text-slate-400">Formatted with headers, tasks, and timestamps</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-violet-600" />
          </a>

          {/* Plain Text Download */}
          <a
            href={getExportUrl(meetingId, 'txt')}
            download
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Plain Text (.txt)</p>
                <p className="text-[11px] text-slate-400">Clean ASCII text log with speaker timestamps</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-violet-600" />
          </a>

          {/* JSON Export */}
          <a
            href={getExportUrl(meetingId, 'json')}
            download
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Raw JSON (.json)</p>
                <p className="text-[11px] text-slate-400">Full structured object tree with all metadata</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-violet-600" />
          </a>
        </div>

        {/* Copy to Clipboard Button */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopyClipboard}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Markdown to Clipboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

