'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TranscriptSegment, HighlightNote } from '@/types/meeting';
import {
  Search,
  ChevronDown,
  Highlighter,
  MessageSquarePlus,
  Bookmark,
  Filter,
  Check,
  X
} from 'lucide-react';

interface InteractiveTranscriptProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  highlights: HighlightNote[];
  onAddHighlight: (data: { selected_text: string; note?: string; color?: string; segment_id?: string }) => void;
  onDeleteHighlight?: (id: string) => void;
}

export const InteractiveTranscript: React.FC<InteractiveTranscriptProps> = ({
  segments,
  currentTime,
  onSeek,
  highlights,
  onAddHighlight,
  onDeleteHighlight
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('all');
  const [highlightModalOpen, setHighlightModalOpen] = useState<boolean>(false);
  const [activeHighlightText, setActiveHighlightText] = useState<string>('');
  const [activeHighlightSegmentId, setActiveHighlightSegmentId] = useState<string>('');
  const [highlightNoteInput, setHighlightNoteInput] = useState<string>('');
  const [highlightColor, setHighlightColor] = useState<string>('purple');

  const segmentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Unique speakers
  const speakers = useMemo(() => {
    const set = new Set<string>();
    segments.forEach((s) => set.add(s.speaker_name));
    return Array.from(set);
  }, [segments]);

  // Current active segment based on audio currentTime
  const activeSegmentId = useMemo(() => {
    const found = segments.find(
      (s) => currentTime >= s.start_time && currentTime <= s.end_time
    );
    return found ? found.id : null;
  }, [segments, currentTime]);

  // Auto-scroll to active segment smoothly if playing
  useEffect(() => {
    if (activeSegmentId && segmentRefs.current[activeSegmentId]) {
      const el = segmentRefs.current[activeSegmentId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeSegmentId]);

  // Filtered segments
  const filteredSegments = useMemo(() => {
    return segments.filter((s) => {
      const matchesSpeaker = selectedSpeaker === 'all' || s.speaker_name === selectedSpeaker;
      const matchesSearch =
        searchTerm.trim() === '' ||
        s.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.speaker_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSpeaker && matchesSearch;
    });
  }, [segments, selectedSpeaker, searchTerm]);

  // Helper to format timestamp
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to render text with highlighted search terms
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 dark:bg-amber-500/40 text-slate-900 dark:text-amber-200 px-1 py-0.5 rounded font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleOpenHighlight = (text: string, segmentId: string) => {
    setActiveHighlightText(text);
    setActiveHighlightSegmentId(segmentId);
    setHighlightNoteInput('');
    setHighlightModalOpen(true);
  };

  const handleSaveHighlight = () => {
    if (!activeHighlightText) return;
    onAddHighlight({
      selected_text: activeHighlightText,
      note: highlightNoteInput,
      color: highlightColor,
      segment_id: activeHighlightSegmentId
    });
    setHighlightModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Search inside transcript */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Speaker Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedSpeaker}
            onChange={(e) => setSelectedSpeaker(e.target.value)}
            className="px-2.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
          >
            <option value="all">All Speakers ({speakers.length})</option>
            {speakers.map((spk) => (
              <option key={spk} value={spk}>
                {spk}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transcript List Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {filteredSegments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No transcript segments match your filter.</p>
          </div>
        ) : (
          filteredSegments.map((segment) => {
            const isActive = segment.id === activeSegmentId;
            const segmentHighlights = highlights.filter(h => h.segment_id === segment.id);

            return (
              <div
                key={segment.id}
                ref={(el) => {
                  segmentRefs.current[segment.id] = el;
                }}
                className={`group relative flex gap-4 p-3.5 rounded-2xl transition-all duration-150 border ${
                  isActive
                    ? 'bg-violet-50/70 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700/60 shadow-xs'
                    : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                {/* Speaker Avatar & Timestamp Button */}
                <div className="flex flex-col items-center shrink-0 w-16">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                    {segment.speaker_name.slice(0, 2).toUpperCase()}
                  </div>

                  <button
                    onClick={() => onSeek(segment.start_time)}
                    title={`Click to jump to ${formatTime(segment.start_time)}`}
                    className={`mt-2 font-mono text-[11px] px-1.5 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-violet-100 group-hover:text-violet-700 dark:group-hover:bg-violet-900/40 dark:group-hover:text-violet-300'
                    }`}
                  >
                    {formatTime(segment.start_time)}
                  </button>
                </div>

                {/* Speaker Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {segment.speaker_name}
                    </span>

                    {/* Quick Action Toolbar on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenHighlight(segment.text, segment.id)}
                        title="Highlight or create soundbite note"
                        className="p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors cursor-pointer"
                      >
                        <Highlighter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onSeek(segment.start_time)}
                        title="Play from here"
                        className="text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                      >
                        Play
                      </button>
                    </div>
                  </div>

                  {/* Transcript Paragraph */}
                  <p
                    onClick={() => onSeek(segment.start_time)}
                    className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 cursor-pointer selection:bg-violet-200 dark:selection:bg-violet-900"
                  >
                    {renderHighlightedText(segment.text, searchTerm)}
                  </p>

                  {/* Render any attached highlights or soundbites */}
                  {segmentHighlights.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {segmentHighlights.map((hl) => (
                        <div
                          key={hl.id}
                          className="flex items-start justify-between gap-2 p-2 rounded-xl bg-violet-100/70 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/60 text-xs"
                        >
                          <div className="flex items-center gap-1.5 text-violet-800 dark:text-violet-300">
                            <Bookmark className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium italic">{hl.note || 'Highlighted note'}</span>
                          </div>
                          {onDeleteHighlight && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteHighlight(hl.id);
                              }}
                              className="text-violet-400 hover:text-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Highlight & Soundbite Modal */}
      {highlightModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
                <Bookmark className="w-4 h-4" />
                <span>Save Soundbite / Highlight</span>
              </div>
              <button
                onClick={() => setHighlightModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 italic max-h-24 overflow-y-auto">
                &ldquo;{activeHighlightText}&rdquo;
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Add a comment or tag:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Critical architecture decision, follow up"
                  value={highlightNoteInput}
                  onChange={(e) => setHighlightNoteInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setHighlightModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHighlight}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                >
                  Save Highlight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

