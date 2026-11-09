'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, FileText, CheckCircle2, User, X, Clock, ArrowRight } from 'lucide-react';
import { searchGlobal } from '@/lib/api';
import { GlobalSearchResult } from '@/types/meeting';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchGlobal(query.trim());
        setResults(data);
      } catch {
        // error handling
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const formatTime = (secs?: number) => {
    if (secs === undefined || secs === null) return '';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-violet-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search meetings, transcripts, action items, or speakers across all meetings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500">
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {isSearching && (
            <p className="text-xs text-slate-400 text-center py-8">Searching across workspace...</p>
          )}

          {!isSearching && query.trim() !== '' && results.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No results found for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {!isSearching && query.trim() === '' && (
            <div className="py-6 px-2 text-center text-xs text-slate-400">
              Type keywords like <span className="text-violet-600 dark:text-violet-400 font-semibold">&ldquo;architecture&rdquo;</span>, <span className="text-violet-600 dark:text-violet-400 font-semibold">&ldquo;David&rdquo;</span>, or <span className="text-violet-600 dark:text-violet-400 font-semibold">&ldquo;export&rdquo;</span> to search globally.
            </div>
          )}

          {!isSearching &&
            results.map((item, index) => (
              <Link
                key={index}
                href={`/meetings/${item.meeting_id}${item.timestamp !== undefined ? `?seek=${item.timestamp}` : ''}`}
                onClick={onClose}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0 mt-0.5">
                  {item.match_type === 'action_item' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : item.match_type === 'transcript' ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 transition-colors truncate">
                      {item.meeting_title}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.match_type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {item.speaker && (
                      <strong className="text-slate-800 dark:text-slate-200">{item.speaker}: </strong>
                    )}
                    {item.snippet}
                  </p>

                  {item.timestamp !== undefined && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono font-semibold text-violet-600 dark:text-violet-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(item.timestamp)}</span>
                    </div>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};
