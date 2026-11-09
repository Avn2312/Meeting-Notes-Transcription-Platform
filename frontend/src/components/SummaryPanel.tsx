'use client';

import React, { useState } from 'react';
import {
  ActionItem,
  TopicChapter,
  Participant,
  ChatMessage
} from '@/types/meeting';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  Bot,
  User,
  ListTodo,
  Layers,
  BarChart2,
  ArrowRight
} from 'lucide-react';

interface SummaryPanelProps {
  meetingId: string;
  summaryOverview?: string;
  bulletPoints?: string;
  actionItems: ActionItem[];
  topicChapters: TopicChapter[];
  participants: Participant[];
  chatMessages: ChatMessage[];
  onSeek: (time: number) => void;
  onToggleActionItem: (item: ActionItem) => void;
  onAddActionItem: (task: string, assignee?: string, dueDate?: string) => void;
  onEditActionItem?: (id: string, task: string) => void;
  onDeleteActionItem: (id: string) => void;
  onSendChatMessage: (question: string) => Promise<void>;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  meetingId,
  summaryOverview,
  bulletPoints,
  actionItems,
  topicChapters,
  participants,
  chatMessages,
  onSeek,
  onToggleActionItem,
  onAddActionItem,
  onEditActionItem,
  onDeleteActionItem,
  onSendChatMessage
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'chapters' | 'chat'>('summary');
  const [newTaskInput, setNewTaskInput] = useState<string>('');
  const [newAssigneeInput, setNewAssigneeInput] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);

  // Parse bullet points if JSON
  const parsedBullets: string[] = React.useMemo(() => {
    if (!bulletPoints) return [];
    try {
      const data = JSON.parse(bulletPoints);
      return Array.isArray(data) ? data : [bulletPoints];
    } catch {
      return bulletPoints.split('\n').filter((l) => l.trim().length > 0);
    }
  }, [bulletPoints]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    onAddActionItem(newTaskInput.trim(), newAssigneeInput.trim() || undefined);
    setNewTaskInput('');
    setNewAssigneeInput('');
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;
    const query = chatInput.trim();
    setChatInput('');
    setIsSendingChat(true);
    try {
      await onSendChatMessage(query);
    } finally {
      setIsSendingChat(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const completedTasks = actionItems.filter((a) => a.completed).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-3 bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'summary'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'actions'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Action Items</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {completedTasks}/{actionItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chapters')}
          className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'chapters'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Outline</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span>Ask Fred</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Executive Overview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Overview</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {summaryOverview || 'No summary generated yet.'}
              </p>
            </div>

            {/* Key Takeaways */}
            {parsedBullets.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Key Takeaways
                </h4>
                <ul className="space-y-2">
                  {parsedBullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-normal"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-1.5 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Speaker Talk-Time Analytics */}
            {participants.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Speaker Talk Time</span>
                  </h4>
                </div>

                {/* Combined Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {participants.map((p, idx) => (
                    <div
                      key={p.id}
                      style={{
                        width: `${p.talk_time_percentage || 25}%`,
                        backgroundColor: p.avatar_color || '#6366F1'
                      }}
                      title={`${p.name}: ${p.talk_time_percentage}%`}
                      className="h-full transition-all"
                    />
                  ))}
                </div>

                {/* Individual Speaker Legend */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.avatar_color || '#6366F1' }}
                      />
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                        {p.name}
                      </span>
                      <span className="ml-auto font-mono text-[11px] text-slate-400">
                        {p.talk_time_percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTION ITEMS */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            {/* Add Action Item Input Form */}
            <form onSubmit={handleCreateTask} className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <input
                type="text"
                placeholder="Add a new action item..."
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Assignee (e.g. Sarah)"
                  value={newAssigneeInput}
                  onChange={(e) => setNewAssigneeInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            {/* List of Action Items */}
            <div className="space-y-2">
              {actionItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No action items found.</p>
              ) : (
                actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      item.completed
                        ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-70'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-xs'
                    }`}
                  >
                    <button
                      onClick={() => onToggleActionItem(item)}
                      className="mt-0.5 text-slate-400 hover:text-violet-600 cursor-pointer transition-colors"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-1.5 mb-1">
                          <input
                            type="text"
                            value={editingItemText}
                            onChange={(e) => setEditingItemText(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingItemText.trim() && onEditActionItem) {
                                  onEditActionItem(item.id, editingItemText.trim());
                                }
                                setEditingItemId(null);
                              } else if (e.key === 'Escape') {
                                setEditingItemId(null);
                              }
                            }}
                            className="w-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg border border-violet-500 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                          />
                          <button
                            onClick={() => {
                              if (editingItemText.trim() && onEditActionItem) {
                                onEditActionItem(item.id, editingItemText.trim());
                              }
                              setEditingItemId(null);
                            }}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p
                          className={`text-xs leading-normal font-medium ${
                            item.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.task}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                        {item.assignee && (
                          <span className="font-semibold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900">
                            {item.assignee}
                          </span>
                        )}
                        {item.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.due_date}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingItemId(item.id);
                          setEditingItemText(item.task);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-violet-600 transition-opacity p-1 cursor-pointer"
                        title="Edit task"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => onDeleteActionItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-1 cursor-pointer"
                        title="Delete action item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CHAPTERS / OUTLINE */}
        {activeTab === 'chapters' && (
          <div className="space-y-3">
            {topicChapters.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No chapters indexed.</p>
            ) : (
              topicChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  onClick={() => onSeek(chapter.timestamp)}
                  className="group p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-violet-400 dark:hover:border-violet-600 transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {chapter.title}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold shrink-0">
                      {formatTime(chapter.timestamp)}
                    </span>
                  </div>
                  {chapter.summary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                      {chapter.summary}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: ASK FRED AI CHAT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center gap-2 p-2.5 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900 text-xs text-violet-700 dark:text-violet-300">
              <Bot className="w-4 h-4 shrink-0 text-violet-600" />
              <span>Ask Fred any question grounded in this meeting transcript!</span>
            </div>

            {/* Quick suggestion chips */}
            {chatMessages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What are the key deadlines?',
                  'Summarize the technical decisions',
                  'Who spoke the most?'
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setChatInput(prompt);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Message History */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-line'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-lg bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isSendingChat && (
                <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                  <Bot className="w-4 h-4 animate-bounce" />
                  <span className="italic">Fred is analyzing the meeting transcript...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                placeholder="Ask about action items, speakers, or topics..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isSendingChat}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingChat}
                className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

