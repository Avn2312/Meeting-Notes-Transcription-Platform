'use client';

import React, { useState } from 'react';
import {
  Radio,
  Share2,
  Video,
  CheckCircle,
  ExternalLink,
  Users,
  Settings,
  Calendar,
  X,
  Sparkles
} from 'lucide-react';

// Modal 1: Live Bot Call Join
interface LiveBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveBotModal: React.FC<LiveBotModalProps> = ({ isOpen, onClose }) => {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSendBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingUrl.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Add Fireflies to Live Call</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Invite the Fireflies AI Notetaker bot to your active Zoom, Google Meet, or Microsoft Teams call. Fireflies will join and transcribe in real-time.
          </p>

          <form onSubmit={handleSendBot} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meeting Link (Zoom, Meet, Teams)
              </label>
              <div className="relative">
                <Video className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900 text-xs text-violet-700 dark:text-violet-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Real-time bot integration is mocked for this assignment demonstration.</span>
            </div>

            <button
              type="submit"
              disabled={sent}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-violet-600/30"
            >
              {sent ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Bot Dispatched to Call!</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" />
                  <span>Send Fireflies Bot Now</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


// Modal 2: Integrations
interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const integrations = [
    { name: 'Google Calendar & Meet', desc: 'Auto-join meetings on your calendar', status: 'Connected', color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Zoom', desc: 'Sync cloud recordings and AI transcripts', status: 'Connected', color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Slack', desc: 'Send meeting recaps & action items to channels', status: 'Available', color: 'bg-slate-100 text-slate-700' },
    { name: 'Notion', desc: 'Export executive summaries directly into team docs', status: 'Available', color: 'bg-slate-100 text-slate-700' },
    { name: 'Salesforce / HubSpot', desc: 'Log sales call highlights automatically to CRM', status: 'Available', color: 'bg-slate-100 text-slate-700' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
            <Share2 className="w-4 h-4" />
            <span>Integrations & Apps</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {integrations.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
              </div>

              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${item.color}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

