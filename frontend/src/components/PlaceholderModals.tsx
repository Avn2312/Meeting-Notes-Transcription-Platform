'use client';

import React, { useState } from 'react';
import {
  Radio,
  Share2,
  Video,
  CheckCircle,
  Users,
  Settings,
  Mail,
  Link2,
  Shield,
  Copy,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// Modal 1: Live Bot Call Join
interface LiveBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveBotModal: React.FC<LiveBotModalProps> = ({ isOpen, onClose }) => {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSendBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingUrl.trim()) return;
    setSent(true);
    showToast('Fireflies Bot dispatched to live call!', 'success');
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Add Fireflies to Live Call</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
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
              <span>Real-time bot integration placeholder per assignment requirements.</span>
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
  const { showToast } = useToast();
  if (!isOpen) return null;

  const integrations = [
    { name: 'Google Calendar & Meet', desc: 'Auto-join meetings on your calendar', status: 'Connected', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    { name: 'Zoom', desc: 'Sync cloud recordings and AI transcripts', status: 'Connected', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    { name: 'Slack', desc: 'Send meeting recaps & action items to channels', status: 'Available', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { name: 'Notion', desc: 'Export executive summaries directly into team docs', status: 'Available', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { name: 'Salesforce / HubSpot', desc: 'Log sales call highlights automatically to CRM', status: 'Available', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
            <Share2 className="w-4 h-4" />
            <span>Integrations & Apps</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
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

              <button
                onClick={() => showToast(`${item.name} settings updated`, 'info')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${item.color}`}
              >
                {item.status}
              </button>
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


// Modal 3: Team Sharing & Collaboration
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingTitle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, meetingTitle }) => {
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Meeting link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    showToast(`Invite sent to ${emailInput} as ${role}!`, 'success');
    setEmailInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
            <Users className="w-4 h-4" />
            <span>Share & Team Collaboration</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Invite teammates or share notes for <strong className="text-slate-700 dark:text-slate-300">&ldquo;{meetingTitle}&rdquo;</strong>.
        </p>

        {/* Invite by email form */}
        <form onSubmit={handleInvite} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="colleague@company.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full pl-9 pr-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <select
            value={role}
            onChange={(e: any) => setRole(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="viewer">Can View</option>
            <option value="editor">Can Edit</option>
          </select>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
          >
            Invite
          </button>
        </form>

        {/* Shareable Link Box */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 truncate">
            <Link2 className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="truncate">{typeof window !== 'undefined' ? window.location.href : 'https://fireflies.ai/meeting/...'}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 border border-slate-200 dark:border-slate-600 flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 text-white cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};


// Modal 4: Settings & Workspace Preferences
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [botName, setBotName] = useState('Fireflies Notetaker (Fred)');
  const [autoJoin, setAutoJoin] = useState(true);
  const [transcribeAudio, setTranscribeAudio] = useState(true);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Workspace settings saved successfully!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
            <Settings className="w-4 h-4" />
            <span>Workspace Settings</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              AI Notetaker Bot Name
            </label>
            <input
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Auto-join calendar meetings with video link
              </span>
              <input
                type="checkbox"
                checked={autoJoin}
                onChange={(e) => setAutoJoin(e.target.checked)}
                className="w-4 h-4 text-violet-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Enable multi-speaker diarization analytics
              </span>
              <input
                type="checkbox"
                checked={transcribeAudio}
                onChange={(e) => setTranscribeAudio(e.target.checked)}
                className="w-4 h-4 text-violet-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900 text-xs text-violet-700 dark:text-violet-300">
            Current user: <strong>Alex Vance</strong> (Workspace Admin)
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
