'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ListTodo,
  Trash2,
  Edit2,
  Download,
  Plus,
  Play,
  ArrowUpDown,
  Filter,
  Sparkles,
  Tag,
  X
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { UploadModal } from '@/components/UploadModal';
import { ExportModal } from '@/components/ExportModal';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';
import { LiveBotModal, IntegrationsModal, SettingsModal } from '@/components/PlaceholderModals';
import { useToast } from '@/components/Toast';
import { fetchMeetings, deleteMeeting, updateMeetingMetadata } from '@/lib/api';
import { MeetingListItem } from '@/types/meeting';

export default function MeetingsDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [speakerFilter, setSpeakerFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');

  // Modals
  const [uploadOpen, setUploadOpen] = useState<boolean>(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState<boolean>(false);
  const [liveBotOpen, setLiveBotOpen] = useState<boolean>(false);
  const [integrationsOpen, setIntegrationsOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [exportMeetingTarget, setExportMeetingTarget] = useState<MeetingListItem | null>(null);

  // Edit metadata modal
  const [editingMeeting, setEditingMeeting] = useState<MeetingListItem | null>(null);
  const [editTitleInput, setEditTitleInput] = useState<string>('');
  const [editParticipantsInput, setEditParticipantsInput] = useState<string>('');

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = localStorage.getItem('theme') === 'dark';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (typeof window !== 'undefined') {
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        showToast('Switched to Dark Mode', 'info');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        showToast('Switched to Light Mode', 'info');
      }
    }
  };

  // Keyboard shortcut Cmd+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMeetings({
        search: searchQuery,
        speaker: speakerFilter,
        sort_by: sortBy
      });
      setMeetings(data);
    } catch {
      // Backend not yet reached or empty
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [searchQuery, speakerFilter, sortBy]);

  const handleDeleteMeeting = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting and its transcript records?')) return;
    try {
      await deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      showToast('Meeting deleted successfully', 'success');
    } catch {
      showToast('Failed to delete meeting', 'error');
    }
  };

  const handleOpenEdit = (meeting: MeetingListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMeeting(meeting);
    setEditTitleInput(meeting.title);
    setEditParticipantsInput(meeting.participants?.map((p) => p.name).join(', ') || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting || !editTitleInput.trim()) return;

    const names = editParticipantsInput
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];
    const updatedParticipants = names.map((name, idx) => ({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      avatar_color: colors[idx % colors.length],
      talk_time_percentage: Math.round(100 / (names.length || 1))
    }));

    try {
      const updated = await updateMeetingMetadata(editingMeeting.id, {
        title: editTitleInput.trim(),
        participants: updatedParticipants
      });
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === updated.id
            ? { ...m, title: updated.title, participants: updated.participants }
            : m
        )
      );
      setEditingMeeting(null);
      showToast('Meeting metadata updated successfully', 'success');
    } catch {
      showToast('Failed to update meeting metadata', 'error');
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s > 0 ? `${s}s` : ''}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Derive topic tags for a meeting based on title
  const getMeetingTags = (title: string): string[] => {
    const tags: string[] = [];
    const t = title.toLowerCase();
    if (t.includes('engineering') || t.includes('sprint') || t.includes('architecture')) tags.push('Engineering');
    if (t.includes('design') || t.includes('product') || t.includes('ui')) tags.push('Design');
    if (t.includes('customer') || t.includes('sales') || t.includes('enterprise')) tags.push('Sales');
    if (t.includes('1-on-1') || t.includes('leadership') || t.includes('mentorship')) tags.push('Management');
    if (tags.length === 0) tags.push('General');
    return tags;
  };

  // Filter meetings by Date and Topic Tags on client
  const filteredMeetings = useMemo(() => {
    const now = new Date().getTime();
    return meetings.filter((m) => {
      // Date filter
      if (dateFilter !== 'all') {
        const mTime = new Date(m.date).getTime();
        const diffDays = (now - mTime) / (1000 * 3600 * 24);
        if (dateFilter === 'today' && diffDays > 1) return false;
        if (dateFilter === '7days' && diffDays > 7) return false;
        if (dateFilter === '30days' && diffDays > 30) return false;
      }
      // Tag filter
      if (tagFilter) {
        const tags = getMeetingTags(m.title);
        if (!tags.includes(tagFilter)) return false;
      }
      return true;
    });
  }, [meetings, dateFilter, tagFilter]);

  // Metrics
  const totalDuration = useMemo(() => {
    return meetings.reduce((acc, m) => acc + m.duration_seconds, 0);
  }, [meetings]);

  const totalPendingTasks = useMemo(() => {
    return meetings.reduce((acc, m) => acc + (m.pending_action_items_count || 0), 0);
  }, [meetings]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Sidebar */}
      <Sidebar
        onOpenUpload={() => setUploadOpen(true)}
        onOpenLiveBot={() => setLiveBotOpen(true)}
        onOpenIntegrations={() => setIntegrationsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>My Meetings</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                {filteredMeetings.length} Showing
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Browse, search, and manage your meetings and automated AI transcripts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search Button */}
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Global Search</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Quick Upload Button */}
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Meeting</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Transcribed Meetings</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {meetings.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Audio Captured</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {Math.round(totalDuration / 60)} mins
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Pending Action Items</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {totalPendingTasks}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ListTodo className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search, Filter, Date & Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* Filter by title or overview */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Filter by Date Range */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Past 24 Hours</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            </div>

            {/* Filter by Speaker */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by participant..."
                value={speakerFilter}
                onChange={(e) => setSpeakerFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 w-36 sm:w-44"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="duration_desc">Longest Duration</option>
                <option value="title_asc">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Topic Tags Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3" />
              <span>Topics:</span>
            </span>
            {['Engineering', 'Design', 'Sales', 'Management'].map((tag) => {
              const active = tagFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setTagFilter(active ? null : tag)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
            {tagFilter && (
              <button
                onClick={() => setTagFilter(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
                <span>Clear filter</span>
              </button>
            )}
          </div>

          {/* Meeting Cards List */}
          {isLoading ? (
            <div className="py-20 text-center">
              <Sparkles className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading meetings repository...</p>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No meetings found
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No meetings match your current filters. Clear filters or create a new meeting.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSpeakerFilter('');
                  setDateFilter('all');
                  setTagFilter(null);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredMeetings.map((meeting) => {
                const tags = getMeetingTags(meeting.title);
                return (
                  <div
                    key={meeting.id}
                    onClick={() => router.push(`/meetings/${meeting.id}`)}
                    className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left Column: Meeting Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                          {meeting.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900 shrink-0">
                          {formatDuration(meeting.duration_seconds)}
                        </span>
                        {tags.map((t) => (
                          <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            #{t}
                          </span>
                        ))}
                      </div>

                      {/* Metadata chips */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(meeting.date)}</span>
                        </span>

                        {meeting.action_items_count > 0 && (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>
                              {meeting.action_items_count - meeting.pending_action_items_count}/
                              {meeting.action_items_count} tasks
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Summary snippet preview */}
                      {meeting.summary_overview && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 leading-relaxed">
                          {meeting.summary_overview}
                        </p>
                      )}
                    </div>

                    {/* Middle Column: Participants Avatar Stack */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex -space-x-2 overflow-hidden">
                        {meeting.participants.slice(0, 4).map((p, idx) => (
                          <div
                            key={p.id || idx}
                            title={`${p.name} (${p.talk_time_percentage}% talk time)`}
                            className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs"
                            style={{ backgroundColor: p.avatar_color || '#6366F1' }}
                          >
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      {meeting.participants.length > 4 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          +{meeting.participants.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Right Column: Quick Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportMeetingTarget(meeting);
                        }}
                        title="Export Meeting Notes"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleOpenEdit(meeting, e)}
                        title="Edit Title"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteMeeting(meeting.id, e)}
                        title="Delete Meeting"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="w-8 h-8 rounded-xl bg-violet-600 group-hover:bg-violet-700 text-white flex items-center justify-center shadow-xs transition-colors ml-1">
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Metadata Modal */}
      {editingMeeting && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-violet-600" />
                <span>Edit Meeting Metadata</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingMeeting(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  placeholder="e.g. Q4 Sprint Planning"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Participants (comma-separated)
                </label>
                <input
                  type="text"
                  value={editParticipantsInput}
                  onChange={(e) => setEditParticipantsInput(e.target.value)}
                  placeholder="e.g. Sarah Connor, David Miller, Elena Rostova"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Separate participant names with commas. Talk-time distribution and avatars will auto-recalculate.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMeeting(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white cursor-pointer shadow-md shadow-violet-600/25 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={(created) => {
          showToast(`Meeting "${created.title}" created!`, 'success');
          setMeetings((prev) => [
            {
              id: created.id,
              title: created.title,
              date: created.date,
              duration_seconds: created.duration_seconds,
              audio_url: created.audio_url,
              summary_overview: created.summary_overview,
              sentiment: created.sentiment,
              created_at: created.created_at,
              updated_at: created.updated_at,
              participants: created.participants,
              action_items_count: created.action_items.length,
              pending_action_items_count: created.action_items.filter((a) => !a.completed).length,
              transcript_preview: created.transcript_segments[0]?.text || ''
            },
            ...prev
          ]);
          router.push(`/meetings/${created.id}`);
        }}
      />

      {/* Export Modal */}
      {exportMeetingTarget && (
        <ExportModal
          isOpen={!!exportMeetingTarget}
          onClose={() => setExportMeetingTarget(null)}
          meetingId={exportMeetingTarget.id}
          meetingTitle={exportMeetingTarget.title}
        />
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />

      {/* Live Bot Modal */}
      <LiveBotModal
        isOpen={liveBotOpen}
        onClose={() => setLiveBotOpen(false)}
      />

      {/* Integrations Modal */}
      <IntegrationsModal
        isOpen={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
