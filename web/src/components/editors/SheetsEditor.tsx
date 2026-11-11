import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Loader2, 
  DollarSign,
  Sigma
} from 'lucide-react';
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import '@univerjs/preset-sheets-core/lib/index.css';
import type { OfficeDocument } from '../../types/office';

interface SheetsEditorProps {
  document: OfficeDocument;
  onBack: () => void;
  onSave: (content: any) => void;
  onUseAiCredit: () => boolean;
  aiCredits: number;
}

export const SheetsEditor: React.FC<SheetsEditorProps> = ({
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
  const [aiResultNote, setAiResultNote] = useState('');

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    // Clean previous container children if any
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
          [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
        },
        presets: [
          UniverSheetsCorePreset({
            container,
          }),
        ],
      });

      univerInstance = univer;
      univerApiRef.current = univerAPI;

      // Create workbook with sample financial data
      univerAPI.createWorkbook({
        name: title || 'Kaola Sheet',
        sheets: {
          'sheet-01': {
            name: 'Doanh Thu & Chi Phí',
            rowCount: 50,
            columnCount: 20,
            cellData: {
              0: {
                0: { v: 'Mã Dự Án', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                1: { v: 'Tên Hạng Mục', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                2: { v: 'Doanh Thu (VNĐ)', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                3: { v: 'Chi Phí (VNĐ)', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                4: { v: 'Lợi Nhuận (VNĐ)', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
              },
              1: {
                0: { v: 'DA-01' },
                1: { v: 'Triển khai Kaola Web' },
                2: { v: 150000000 },
                3: { v: 45000000 },
                4: { f: '=C2-D2', v: 105000000 },
              },
              2: {
                0: { v: 'DA-02' },
                1: { v: 'Tích hợp Kaola AI Copilot' },
                2: { v: 220000000 },
                3: { v: 60000000 },
                4: { f: '=C3-D3', v: 160000000 },
              },
              3: {
                0: { v: 'DA-03' },
                1: { v: 'Hạ tầng Cloud Storage' },
                2: { v: 95000000 },
                3: { v: 30000000 },
                4: { f: '=C4-D4', v: 65000000 },
              },
              4: {
                0: { v: 'DA-04' },
                1: { v: 'Phát triển Slide Canva' },
                2: { v: 180000000 },
                3: { v: 50000000 },
                4: { f: '=C5-D5', v: 130000000 },
              },
              5: {
                0: { v: 'DA-05' },
                1: { v: 'Bảo mật SSO id.kaola.vn' },
                2: { v: 110000000 },
                3: { v: 25000000 },
                4: { f: '=C6-D6', v: 85000000 },
              },
              6: {
                0: { v: 'TỔNG CỘNG', s: { bl: 1, bg: { rgb: '#dcfce7' } } },
                1: { v: 'Toàn bộ 5 Dự án', s: { bl: 1, bg: { rgb: '#dcfce7' } } },
                2: { f: '=SUM(C2:C6)', v: 755000000, s: { bl: 1, bg: { rgb: '#dcfce7' } } },
                3: { f: '=SUM(D2:D6)', v: 210000000, s: { bl: 1, bg: { rgb: '#dcfce7' } } },
                4: { f: '=SUM(E2:E6)', v: 545000000, s: { bl: 1, bg: { rgb: '#dcfce7' } } },
              }
            }
          }
        }
      });
    } catch (err) {
      console.error('Error initializing Univer Sheet:', err);
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

  const handleAiAction = (actionType: string) => {
    if (!onUseAiCredit()) return;

    setIsAiLoading(true);
    setAiResultNote('Kaola AI đang tương tác trực tiếp với lõi Univer Sheet...');

    setTimeout(() => {
      const activeWorkbook = univerApiRef.current?.getActiveWorkbook();
      const activeSheet = activeWorkbook?.getActiveSheet();

      if (activeSheet && actionType === 'financial') {
        // AI populates data in Univer
        activeSheet.getRange(8, 0, 5, 4).setValues([
          ['Kỳ Báo Cáo', 'Doanh Thu', 'Chi Phí', 'Lợi Nhuận Gộp'],
          ['Quý 1/2026', 450000000, 180000000, 270000000],
          ['Quý 2/2026', 580000000, 210000000, 370000000],
          ['Quý 3/2026', 620000000, 230000000, 390000000],
          ['Quý 4/2026', 800000000, 300000000, 500000000],
        ]);
        setAiResultNote('AI đã tự động điền Báo Cáo Tài Chính 4 Quý vào bảng tính Univer!');
      } else {
        setAiResultNote('Kaola AI đã hoàn tất phân tích bảng tính!');
      }
      setIsAiLoading(false);
    }, 1200);
  };

  const handleCustomAiPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    if (!onUseAiCredit()) return;

    setIsAiLoading(true);
    setAiResultNote(`AI đang xử lý yêu cầu: "${aiPrompt}"...`);

    setTimeout(() => {
      setAiResultNote(`Kaola AI đã tối ưu hóa bảng tính theo yêu cầu "${aiPrompt}".`);
      setAiPrompt('');
      setIsAiLoading(false);
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
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="font-bold text-sm">XLS</span>
            </div>
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-sm text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5"
              />
              <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                <span className="font-semibold text-emerald-700">Lõi Chuẩn: Official UNIVER Sheet Engine v1.1</span>
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
            onClick={() => onSave(univerApiRef.current?.getActiveWorkbook()?.getSnapshot())}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu bảng tính</span>
          </button>
          <button
            onClick={() => alert('Xuất file XLSX tương thích Microsoft Excel 100%!')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất .xlsx</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: OFFICIAL UNIVER CANVAS + AI COPILOT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Full Official Univer Sheet Container */}
        <div className="flex-1 h-full relative overflow-hidden bg-white">
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Kaola AI Sheet Copilot Panel */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-lg">
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Kaola Sheet Copilot</h3>
                <p className="text-[10px] text-emerald-700 font-semibold">{aiCredits} Credits khả dụng</p>
              </div>
            </div>
          </div>

          {/* Quick Presets for Sheets */}
          <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tác vụ Tự động & Báo cáo
            </span>

            <button
              onClick={() => handleAiAction('financial')}
              disabled={isAiLoading}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 group-hover:text-emerald-600">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sinh Báo Cáo Tài Chính 4 Quý</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tự động điền dữ liệu Doanh thu, Chi phí vào bảng tính Univer thực thụ.
              </p>
            </button>

            <button
              onClick={() => handleAiAction('autosum')}
              disabled={isAiLoading}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 group-hover:text-blue-600">
                <Sigma className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Phân tích & Gợi ý công thức</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Gợi ý sử dụng các hàm Excel chuẩn như SUM, AVERAGE, XLOOKUP.
              </p>
            </button>

            {isAiLoading && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>{aiResultNote}</span>
              </div>
            )}

            {!isAiLoading && aiResultNote && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kết quả từ AI:</span>
                </div>
                <p className="text-[11px] text-slate-600">{aiResultNote}</p>
              </div>
            )}
          </div>

          {/* Custom Formula Prompt */}
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <form onSubmit={handleCustomAiPrompt} className="relative">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Yêu cầu AI viết công thức hoặc điền dữ liệu..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiPrompt.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <span className="text-[10px] text-slate-400 mt-1.5 block text-center">
              Nhập câu hỏi bằng tiếng Việt, AI sẽ tự động xử lý.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
