import React from 'react';
import { 
  FileText, 
  Table, 
  Presentation, 
  LayoutDashboard, 
  Sparkles, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import type { KaolaUser, OfficeDocType } from '../types/office';

interface HeaderProps {
  activeTab: 'dashboard' | OfficeDocType;
  onSelectTab: (tab: 'dashboard' | OfficeDocType) => void;
  user: KaolaUser;
  onOpenAccountModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  user,
  onOpenAccountModal
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-xs">
      {/* Brand & Main Nav */}
      <div className="flex items-center gap-6">
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img 
            src="/logo.png" 
            alt="Kaola Office" 
            className="w-8 h-8 rounded-md object-contain shadow-xs"
            onError={(e) => {
              // Fallback if logo not found
              (e.target as HTMLElement).style.display = 'none';
            }} 
          />
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
              Kaola Office
            </span>
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest leading-tight mt-0.5">
              Next-Gen Cloud Suite
            </span>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
            Tổng quan
          </button>

          <button
            onClick={() => onSelectTab('doc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'doc' 
                ? 'bg-blue-600 text-white shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-600" />
            Văn bản (Word)
          </button>

          <button
            onClick={() => onSelectTab('sheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'sheet' 
                ? 'bg-emerald-600 text-white shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-emerald-500" />
            Bảng tính (Excel)
          </button>

          <button
            onClick={() => onSelectTab('slide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'slide' 
                ? 'bg-amber-600 text-white shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-amber-500" />
            Thuyết trình (Slide)
          </button>
        </nav>
      </div>

      {/* Right Controls: AI Credits & Kaola ID User */}
      <div className="flex items-center gap-3">
        {/* Kaola AI Credits Badge */}
        <div 
          onClick={onOpenAccountModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-full px-3 py-1 cursor-pointer hover:border-blue-400 transition-all shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-slate-700">Kaola AI:</span>
            <span className="font-bold text-indigo-700">{user.aiCreditsRemaining}</span>
            <span className="text-slate-400 text-[11px]">/{user.aiCreditsTotal} Credits</span>
          </div>
          {user.plan === 'free' && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              Nâng cấp
            </span>
          )}
          {user.plan === 'pro' && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              PRO
            </span>
          )}
        </div>

        {/* Cloud Sync indicator */}
        <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Kaola Cloud</span>
        </div>

        {/* Kaola ID Account Menu */}
        <div 
          onClick={onOpenAccountModal}
          className="flex items-center gap-2 pl-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-slate-700">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {user.name}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight flex items-center gap-0.5">
              id.kaola.vn
              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
};
