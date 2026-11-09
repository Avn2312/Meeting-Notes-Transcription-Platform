'use client';

import React, { useState } from 'react';
import { Upload, FileText, Sparkles, X, AlertCircle } from 'lucide-react';
import { uploadTranscript } from '@/lib/api';
import { MeetingDetail } from '@/types/meeting';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMeeting: MeetingDetail) => void;
}

const SAMPLE_TRANSCRIPT = `[00:00] Maya Lin: Good morning everyone, let's review the Q3 customer feedback for our AI transcription feature.
[00:15] Carlos Gomez: Thanks Maya. We found that users especially love the interactive audio player where clicking a sentence jumps straight to that timestamp.
[00:32] Priya Patel: Absolutely. However, several enterprise customers requested the ability to export summaries to Markdown and PDF for their weekly documentation.
[00:50] Maya Lin: Great point Priya. Carlos, could you prepare the export endpoint and test file downloads by next Tuesday?
[01:05] Carlos Gomez: Sure, I will build the Markdown and plain text export handlers.
[01:18] Priya Patel: I will also update the frontend toast notification when an action item is marked completed.
[01:35] Maya Lin: Perfect. Let's make sure our meeting search indexes transcript lines so users can locate discussions instantly. Thanks all!`;

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'paste' | 'file'>('paste');
  const [title, setTitle] = useState<string>('');
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFillSample = () => {
    setTitle('Product Feedback & Export Roadmap Sync');
    setTranscriptText(SAMPLE_TRANSCRIPT);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a meeting title.');
      return;
    }
    if (mode === 'paste' && !transcriptText.trim()) {
      setError('Please paste your transcript content.');
      return;
    }
    if (mode === 'file' && !file) {
      setError('Please select a transcript file (.txt, .vtt, .json).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (mode === 'paste') {
        formData.append('transcript_text', transcriptText);
      } else if (file) {
        formData.append('transcript_file', file);
      }

      const created = await uploadTranscript(formData);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process transcript');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">New Meeting / Upload Transcript</h3>
              <p className="text-xs text-slate-500">Auto-generate AI summaries, action items, and chapters</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Meeting Title <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleFillSample}
                className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Fill Demo Sample</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. Q4 Executive Strategy Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Mode Selector */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Paste Transcript Text
            </button>
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'file'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Upload File (.txt, .vtt, .json)
            </button>
          </div>

          {mode === 'paste' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Transcript Content
              </label>
              <textarea
                rows={6}
                placeholder="[00:15] Speaker Name: The transcript text goes here..."
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Choose Transcript File
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-violet-500 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <input
                  type="file"
                  accept=".txt,.vtt,.json"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing AI Insights...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Meeting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
