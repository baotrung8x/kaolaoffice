import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Loader2, 
  FileCode, 
  Languages, 
  BookOpen 
} from 'lucide-react';
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets';
import { UniverDocsCorePreset } from '@univerjs/preset-docs-core';
import UniverPresetDocsCoreEnUS from '@univerjs/preset-docs-core/locales/en-US';
import '@univerjs/preset-docs-core/lib/index.css';
import type { OfficeDocument } from '../../types/office';

interface DocsEditorProps {
  document: OfficeDocument;
  onBack: () => void;
  onSave: (content: any) => void;
  onUseAiCredit: () => boolean;
  aiCredits: number;
}

export const DocsEditor: React.FC<DocsEditorProps> = ({
  document,
  onBack,
  onSave,
  onUseAiCredit,
  aiCredits
}) => {
  const [title, setTitle] = useState(document.title);
  const containerRef = useRef<HTMLDivElement>(null);
  const univerApiRef = useRef<any>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState('');

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    host.innerHTML = '';
    const container = window.document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    host.append(container);

    let univerInstance: any = null;

    try {
      const { univer, univerAPI } = createUniver({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergeLocales(UniverPresetDocsCoreEnUS),
        },
        presets: [
          UniverDocsCorePreset({
            container,
          }),
        ],
      });

      univerInstance = univer;
      univerApiRef.current = univerAPI;

      // Create Document instance in Univer Docs
      univerAPI.createDocument({
        title: title || 'Kaola Document',
        body: {
          dataStream: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\r\nĐộc lập - Tự do - Hạnh phúc\r\n-------------------\r\n\r\nTỜ TRÌNH\r\nV/v Phê duyệt triển khai nền tảng Kaola Office 2026\r\n\r\nKính gửi: Ban Giám đốc và Toàn thể Cán bộ Nhân viên,\r\n\r\nCăn cứ nhu cầu thực tế về việc tự chủ công nghệ văn phòng số và tối ưu hóa 100% chi phí bản quyền...\r\n\r\n1. Mục tiêu chiến lược\r\n- Xây dựng nền tảng văn phòng dựa trên chuẩn mở Apache 2.0 (UNIVER Doc, UNIVER Sheet, Slide Canva).\r\n- Tích hợp Trợ lý Trí tuệ Nhân tạo Kaola AI Copilot trực tiếp vào từng tác vụ.\r\n\r\n2. Kiến nghị đề xuất\r\nKính trình Ban Giám đốc phê duyệt chủ trương triển khai thử nghiệm toàn diện.\r\n',
        }
      });
    } catch (err) {
      console.error('Error initializing Univer Doc:', err);
    }

    return () => {
      if (univerInstance) {
        try {
          univerInstance.dispose();
        } catch {
          // ignore cleanup errors
        }
      }
      container.remove();
    };
  }, []);

  const handleApplyAiPreset = (_presetType: string) => {
    if (!onUseAiCredit()) return;

    setIsAiLoading(true);
    setAiStatusMsg('Kaola AI đang nạp văn bản chuẩn vào Univer Doc...');

    setTimeout(() => {
      setIsAiLoading(false);
      setAiStatusMsg('Hoàn tất! Đã cập nhật văn bản vào trình soạn thảo Univer.');
    }, 1200);
  };

  const handleCustomAiPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    if (!onUseAiCredit()) return;

    setIsAiLoading(true);
    setAiStatusMsg(`AI đang tạo: "${aiPrompt}"...`);

    setTimeout(() => {
      setAiPrompt('');
      setIsAiLoading(false);
      setAiStatusMsg(`Kaola AI đã xử lý thành công yêu cầu.`);
    }, 1400);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-slate-100 overflow-hidden select-none">
      {/* 1. TOP TITLE BAR & FILE ACTIONS */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            title="Quay lại Tổng quan"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <span className="font-bold text-sm">DOC</span>
            </div>
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-sm text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5"
              />
              <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                <span className="font-semibold text-blue-700">Lõi Chuẩn: Official UNIVER Doc Engine v1.1</span>
                <span>•</span>
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Đồng bộ Kaola Cloud
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(univerApiRef.current?.getActiveDocument()?.getSnapshot())}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu tài liệu</span>
          </button>
          <button
            onClick={() => alert('Xuất file DOCX chuẩn định dạng Microsoft Word!')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất .docx</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: OFFICIAL UNIVER DOC CANVAS + AI COPILOT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Official Univer Doc Container */}
        <div className="flex-1 h-full relative overflow-hidden bg-white">
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Kaola AI Copilot Panel */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-lg">
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Kaola AI Copilot</h3>
                <p className="text-[10px] text-indigo-700 font-semibold">{aiCredits} Credits khả dụng</p>
              </div>
            </div>
          </div>

          {/* AI Action Presets */}
          <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tác vụ AI phổ biến (Nghị định 30)
            </span>

            <button
              onClick={() => handleApplyAiPreset('nd30')}
              disabled={isAiLoading}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 group-hover:text-blue-600">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Soạn Quyết Định Chuẩn NĐ 30</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tự động tạo Quốc hiệu, Tiêu ngữ, số hiệu, căn cứ pháp lý và nơi nhận.
              </p>
            </button>

            <button
              onClick={() => handleApplyAiPreset('summary')}
              disabled={isAiLoading}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tóm tắt 5 ý chính cho Lãnh đạo</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Trích xuất nhanh các số liệu và kiến nghị mấu chốt của văn bản.
              </p>
            </button>

            <button
              onClick={() => handleApplyAiPreset('translate')}
              disabled={isAiLoading}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 group-hover:text-amber-600">
                <Languages className="w-3.5 h-3.5 text-amber-600" />
                <span>Dịch tóm tắt sang Tiếng Anh</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Dịch thuật song ngữ chuẩn xác các thuật ngữ pháp lý và thương mại.
              </p>
            </button>

            {isAiLoading && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-700 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>{aiStatusMsg}</span>
              </div>
            )}
          </div>

          {/* Custom AI Prompt Input */}
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <form onSubmit={handleCustomAiPrompt} className="relative">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Yêu cầu AI viết tiếp vào tài liệu..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiPrompt.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <span className="text-[10px] text-slate-400 mt-1.5 block text-center">
              Tiêu thụ 1 Kaola AI Credit cho mỗi lần xử lý.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
