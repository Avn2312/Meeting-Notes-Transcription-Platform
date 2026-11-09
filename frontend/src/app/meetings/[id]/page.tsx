'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Share2,
  Trash2,
  Edit3,
  Check,
  Sparkles,
  Link2,
  CheckCircle2
} from 'lucide-react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { InteractiveTranscript } from '@/components/InteractiveTranscript';
import { SummaryPanel } from '@/components/SummaryPanel';
import { ExportModal } from '@/components/ExportModal';
import {
  fetchMeeting,
  updateMeetingMetadata,
  deleteMeeting,
  updateActionItem,
  addActionItem,
  deleteActionItem,
  addHighlight,
  deleteHighlight,
  askFred
} from '@/lib/api';
import { MeetingDetail, ActionItem } from '@/types/meeting';

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Inline Title Edit state
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>('');

  // Modals & Feedback
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!meetingId) return;
    loadMeeting();
  }, [meetingId]);

  // Handle URL seek query parameter (e.g. ?seek=45)
  useEffect(() => {
    const seekParam = searchParams.get('seek');
    if (seekParam) {
      const t = parseFloat(seekParam);
      if (!isNaN(t)) {
        setCurrentTime(t);
        setIsPlaying(true);
      }
    }
  }, [searchParams]);

  const loadMeeting = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMeeting(meetingId);
      setMeeting(data);
      setEditedTitle(data.title);
    } catch (err: any) {
      setError(err.message || 'Failed to load meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!meeting || !editedTitle.trim()) return;
    try {
      const updated = await updateMeetingMetadata(meeting.id, { title: editedTitle.trim() });
      setMeeting((prev) => (prev ? { ...prev, title: updated.title } : null));
      setIsEditingTitle(false);
    } catch {
      alert('Failed to update title');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await deleteMeeting(meetingId);
      router.push('/');
    } catch {
      alert('Failed to delete meeting');
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(true);
  };

  // Action Items handlers
  const handleToggleActionItem = async (item: ActionItem) => {
    try {
      const nextCompleted = !item.completed;
      const updated = await updateActionItem(item.id, { completed: nextCompleted });
      setMeeting((prev) =>
        prev
          ? {
              ...prev,
              action_items: prev.action_items.map((a) => (a.id === updated.id ? updated : a))
            }
          : null
      );
    } catch {
      alert('Failed to update action item');
    }
  };

  const handleAddActionItem = async (task: string, assignee?: string, dueDate?: string) => {
    if (!meeting) return;
    try {
      const created = await addActionItem(meeting.id, {
        task,
        assignee,
        due_date: dueDate || 'Next Week'
      });
      setMeeting((prev) =>
        prev ? { ...prev, action_items: [...prev.action_items, created] } : null
      );
    } catch {
      alert('Failed to add action item');
    }
  };

  const handleDeleteActionItem = async (id: string) => {
    try {
      await deleteActionItem(id);
      setMeeting((prev) =>
        prev ? { ...prev, action_items: prev.action_items.filter((a) => a.id !== id) } : null
      );
    } catch {
      alert('Failed to delete action item');
    }
  };

  // Highlights handlers
  const handleAddHighlight = async (data: {
    selected_text: string;
    note?: string;
    color?: string;
    segment_id?: string;
  }) => {
    if (!meeting) return;
    try {
      const created = await addHighlight(meeting.id, data);
      setMeeting((prev) =>
        prev ? { ...prev, highlights: [...prev.highlights, created] } : null
      );
    } catch {
      alert('Failed to save highlight');
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    try {
      await deleteHighlight(id);
      setMeeting((prev) =>
        prev ? { ...prev, highlights: prev.highlights.filter((h) => h.id !== id) } : null
      );
    } catch {
      alert('Failed to delete highlight');
    }
  };

  // Ask Fred AI Chat handler
  const handleSendChatMessage = async (question: string) => {
    if (!meeting) return;
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      meeting_id: meeting.id,
      role: 'user' as const,
      content: question,
      created_at: new Date().toISOString()
    };
    setMeeting((prev) =>
      prev ? { ...prev, chat_messages: [...prev.chat_messages, tempUserMsg] } : null
    );

    try {
      const assistantMsg = await askFred(meeting.id, question);
      setMeeting((prev) =>
        prev
          ? {
              ...prev,
              chat_messages: [
                ...prev.chat_messages.filter((m) => m.id !== tempUserMsg.id),
                tempUserMsg,
                assistantMsg
              ]
            }
          : null
      );
    } catch {
      alert('Failed to get answer from Fred');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Sparkles className="w-8 h-8 text-violet-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading meeting workspace...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Meeting Not Found
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          {error || "The requested meeting ID doesn't exist."}
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
        >
          Return to Meetings Library
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Meetings"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="px-2.5 py-1 text-sm font-bold bg-slate-100 dark:bg-slate-800 rounded-lg border border-violet-500 text-slate-900 dark:text-white focus:outline-hidden"
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {meeting.title}
              </h2>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-slate-400 hover:text-violet-600 p-1"
                title="Rename Title"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(meeting.date)}</span>
            </span>
            <span>•</span>
            <span className="font-semibold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
              {Math.floor(meeting.duration_seconds / 60)}m {meeting.duration_seconds % 60}s
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>

          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={handleDelete}
            title="Delete Meeting"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Pinned Audio Player Bar */}
      <AudioPlayer
        audioUrl={meeting.audio_url}
        duration={meeting.duration_seconds || 120}
        currentTime={currentTime}
        onTimeUpdate={(t) => setCurrentTime(t)}
        onSeek={handleSeek}
        isPlaying={isPlaying}
        onPlayPauseToggle={(p) => setIsPlaying(p)}
      />

      {/* Main Workspace Body: Dual Split Panes */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left / Center: Interactive Transcript */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <InteractiveTranscript
            segments={meeting.transcript_segments}
            currentTime={currentTime}
            onSeek={handleSeek}
            highlights={meeting.highlights}
            onAddHighlight={handleAddHighlight}
            onDeleteHighlight={handleDeleteHighlight}
          />
        </div>

        {/* Right Pane: Summary, Action Items, Chapters & Ask Fred AI */}
        <div className="w-full md:w-[420px] lg:w-[460px] h-full shrink-0 flex flex-col overflow-hidden">
          <SummaryPanel
            meetingId={meeting.id}
            summaryOverview={meeting.summary_overview}
            bulletPoints={meeting.bullet_points}
            actionItems={meeting.action_items}
            topicChapters={meeting.topic_chapters}
            participants={meeting.participants}
            chatMessages={meeting.chat_messages}
            onSeek={handleSeek}
            onToggleActionItem={handleToggleActionItem}
            onAddActionItem={handleAddActionItem}
            onDeleteActionItem={handleDeleteActionItem}
            onSendChatMessage={handleSendChatMessage}
          />
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
      />
    </div>
  );
}
