'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Settings,
  Sparkles,
  BarChart3,
  Bookmark,
  Share2,
  Moon,
  Sun,
  Radio,
  Plus
} from 'lucide-react';

interface SidebarProps {
  onOpenUpload?: () => void;
  onOpenLiveBot?: () => void;
  onOpenIntegrations?: () => void;
  onOpenSettings?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenUpload,
  onOpenLiveBot,
  onOpenIntegrations,
  onOpenSettings,
  darkMode,
  onToggleDarkMode
}) => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Meetings', href: '/', icon: Calendar },
    { name: 'Soundbites', href: '/#soundbites', icon: Bookmark, badge: 'New' },
    { name: 'Analytics', href: '/#analytics', icon: BarChart3 },
    { name: 'Integrations', onClick: onOpenIntegrations, icon: Share2 },
    { name: 'Settings', onClick: onOpenSettings, icon: Settings },
  ];

  return (
    <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 select-none z-30 transition-colors">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Fireflies<span className="text-violet-600 dark:text-violet-400 font-extrabold text-sm px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800">AI</span>
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Meeting Assistant</p>
          </div>
        </Link>
      </div>

      {/* Primary Action Button */}
      <div className="p-4 space-y-2">
        <button
          onClick={onOpenUpload}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm shadow-md shadow-violet-600/25 transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Upload / New Meeting</span>
        </button>

        <button
          onClick={onOpenLiveBot}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-medium text-xs border border-violet-200/80 dark:border-violet-800/80 transition-all cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 animate-pulse" />
          <span>Join Live Call (Bot)</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' ? pathname === '/' : (item.href ? pathname.startsWith(item.href) : false);

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
              >
                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="flex-1">{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href || '#'}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Footer & Theme Toggle */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-semibold flex items-center justify-center text-xs shrink-0">
              AV
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Alex Vance</p>
              <p className="text-[10px] text-slate-400 truncate">Pro Workspace</p>
            </div>
          </div>

          <button
            onClick={onToggleDarkMode}
            title="Toggle Dark / Light Theme"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
