import React, { useState } from 'react';
import { 
  Presentation, 
  ArrowLeft, 
  Save, 
  Download, 
  Sparkles, 
  Play, 
  Plus, 
  Trash2, 
  Type, 
  Square, 
  Image as ImageIcon, 
  Send, 
  Loader2, 
  CheckCircle2
} from 'lucide-react';
import type { OfficeDocument } from '../../types/office';

interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  bgColor?: string;
  borderRadius?: number;
}

interface SlideItem {
  id: string;
  title: string;
  bgColor: string;
  elements: SlideElement[];
}

interface SlidesEditorProps {
  document: OfficeDocument;
  onBack: () => void;
  onSave: (content: any) => void;
  onUseAiCredit: () => boolean;
  aiCredits: number;
}

export const SlidesEditor: React.FC<SlidesEditorProps> = ({
  document,
  onBack,
  onSave,
  onUseAiCredit,
  aiCredits
}) => {
  const [title, setTitle] = useState(document.title);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);

  // Initial presentation slides
  const [slides, setSlides] = useState<SlideItem[]>([
    {
      id: 'slide-1',
      title: 'Slide Giới thiệu',
      bgColor: '#0f172a', // Dark Navy
      elements: [
        {
          id: 'el-1',
          type: 'text',
          content: 'KAOLA OFFICE 2026',
          x: 80,
          y: 120,
          width: 600,
          height: 60,
          fontSize: 36,
          fontWeight: 'bold',
          color: '#ffffff'
        },
        {
          id: 'el-2',
          type: 'text',
          content: 'Nền tảng Văn phòng Thông minh Tích hợp Trợ lý Trí tuệ Nhân tạo',
          x: 80,
          y: 190,
          width: 580,
          height: 50,
          fontSize: 18,
          fontWeight: 'normal',
          color: '#94a3b8'
        },
        {
          id: 'el-3',
          type: 'shape',
          content: '',
          x: 80,
          y: 260,
          width: 140,
          height: 40,
          bgColor: '#2563eb',
          borderRadius: 8
        },
        {
          id: 'el-4',
          type: 'text',
          content: 'Bắt đầu ngay →',
          x: 95,
          y: 270,
          width: 110,
          height: 25,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ffffff'
        }
      ]
    },
    {
      id: 'slide-2',
      title: 'Slide Tính năng Cốt lõi',
      bgColor: '#ffffff',
      elements: [
        {
          id: 'el-2-1',
          type: 'text',
          content: '3 Trụ Cột Đột Phá Của Kaola Office',
          x: 60,
          y: 40,
          width: 600,
          height: 45,
          fontSize: 26,
          fontWeight: 'bold',
          color: '#0f172a'
        },
        {
          id: 'el-2-2',
          type: 'shape',
          content: '',
          x: 60,
          y: 110,
          width: 200,
          height: 220,
          bgColor: '#eff6ff',
          borderRadius: 16
        },
        {
          id: 'el-2-3',
          type: 'text',
          content: '1. Kaola Docs\nChuẩn văn bản NĐ 30\nSoạn hợp đồng tự động',
          x: 75,
          y: 130,
          width: 170,
          height: 120,
          fontSize: 14,
          fontWeight: 'normal',
          color: '#1e3a8a'
        },
        {
          id: 'el-2-4',
          type: 'shape',
          content: '',
          x: 280,
          y: 110,
          width: 200,
          height: 220,
          bgColor: '#ecfdf5',
          borderRadius: 16
        },
        {
          id: 'el-2-5',
          type: 'text',
          content: '2. Kaola Sheets\nBảng tính 300+ hàm\nAI viết công thức tự động',
          x: 295,
          y: 130,
          width: 170,
          height: 120,
          fontSize: 14,
          fontWeight: 'normal',
          color: '#065f46'
        },
        {
          id: 'el-2-6',
          type: 'shape',
          content: '',
          x: 500,
          y: 110,
          width: 200,
          height: 220,
          bgColor: '#fffbeb',
          borderRadius: 16
        },
        {
          id: 'el-2-7',
          type: 'text',
          content: '3. Kaola Slides\nThiết kế kiểu Canva\nKéo thả đồ họa tự do',
          x: 515,
          y: 130,
          width: 170,
          height: 120,
          fontSize: 14,
          fontWeight: 'normal',
          color: '#92400e'
        }
      ]
    }
  ]);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState('');

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleAddSlide = () => {
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}`,
      title: `Slide ${slides.length + 1}`,
      bgColor: '#ffffff',
      elements: [
        {
          id: `el-${Date.now()}-1`,
          type: 'text',
          content: 'Tiêu Đề Slide Mới',
          x: 60,
          y: 50,
          width: 500,
          height: 45,
          fontSize: 26,
          fontWeight: 'bold',
          color: '#0f172a'
        },
        {
          id: `el-${Date.now()}-2`,
          type: 'text',
          content: 'Bấm đúp để chỉnh sửa nội dung hoặc kéo thả vật thể theo ý muốn.',
          x: 60,
          y: 120,
          width: 600,
          height: 40,
          fontSize: 15,
          fontWeight: 'normal',
          color: '#64748b'
        }
      ]
    };
    setSlides(prev => [...prev, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const handleDeleteSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== index));
    if (currentSlideIndex >= slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, slides.length - 2));
    }
  };

  const handleAddElement = (type: 'text' | 'shape') => {
    const newEl: SlideElement = {
      id: `el-${Date.now()}`,
      type,
      content: type === 'text' ? 'Văn bản mới' : '',
      x: 100 + Math.random() * 80,
      y: 100 + Math.random() * 80,
      width: type === 'text' ? 220 : 120,
      height: type === 'text' ? 40 : 100,
      fontSize: 18,
      fontWeight: 'normal',
      color: '#0f172a',
      bgColor: type === 'shape' ? '#3b82f6' : undefined,
      borderRadius: type === 'shape' ? 8 : undefined
    };

    setSlides(prev => {
      const updated = [...prev];
      updated[currentSlideIndex].elements.push(newEl);
      return updated;
    });
    setSelectedElementId(newEl.id);
  };

  const handleAiGenerateSlideDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    if (!onUseAiCredit()) return;

    setIsAiLoading(true);
    setAiStatusMsg(`AI đang phác thảo bố cục Canva cho: "${aiPrompt}"...`);

    setTimeout(() => {
      const generatedSlide: SlideItem = {
        id: `slide-ai-${Date.now()}`,
        title: `Slide: ${aiPrompt.slice(0, 18)}...`,
        bgColor: '#0f172a',
        elements: [
          {
            id: `ai-el-1`,
            type: 'text',
            content: aiPrompt.toUpperCase(),
            x: 60,
            y: 50,
            width: 650,
            height: 45,
            fontSize: 24,
            fontWeight: 'bold',
            color: '#38bdf8'
          },
          {
            id: `ai-el-2`,
            type: 'text',
            content: `• Luận điểm 1: Phân tích cơ hội thị trường và mục tiêu chiến lược.\n• Luận điểm 2: Tối ưu quy trình vận hành và ứng dụng AI tự động.\n• Luận điểm 3: Dự toán kết quả kinh doanh và chỉ số tăng trưởng ROI.`,
            x: 60,
            y: 120,
            width: 600,
            height: 150,
            fontSize: 16,
            fontWeight: 'normal',
            color: '#e2e8f0'
          },
          {
            id: `ai-el-3`,
            type: 'shape',
            content: '',
            x: 60,
            y: 280,
            width: 240,
            height: 38,
            bgColor: '#38bdf8',
            borderRadius: 8
          },
          {
            id: `ai-el-4`,
            type: 'text',
            content: '✨ Được tạo bởi Kaola AI Copilot',
            x: 75,
            y: 288,
            width: 210,
            height: 25,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#0f172a'
          }
        ]
      };

      setSlides(prev => [...prev, generatedSlide]);
      setCurrentSlideIndex(slides.length);
      setAiPrompt('');
      setIsAiLoading(false);
      setAiStatusMsg('');
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-slate-100 overflow-hidden">
      {/* Top Action Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            title="Quay lại Tổng quan"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-sm text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-amber-500 rounded px-1.5 py-0.5"
              />
              <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                <span>Lõi: PPTist (Canva-Style Drag & Drop, Apache-2.0)</span>
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
            onClick={() => setIsPresenting(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trình chiếu (F5)</span>
          </button>

          <button
            onClick={() => onSave(slides)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu Slide</span>
          </button>

          <button
            onClick={() => alert('Xuất file PPTX / PDF thành công!')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất .pptx</span>
          </button>
        </div>
      </div>

      {/* Canva-Style Floating Asset Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex items-center gap-2 text-xs shrink-0">
        <button
          onClick={() => handleAddElement('text')}
          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-amber-400 rounded-md font-semibold text-slate-700 shadow-2xs transition-colors"
        >
          <Type className="w-3.5 h-3.5 text-amber-600" />
          <span>Thêm Chữ</span>
        </button>

        <button
          onClick={() => handleAddElement('shape')}
          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-amber-400 rounded-md font-semibold text-slate-700 shadow-2xs transition-colors"
        >
          <Square className="w-3.5 h-3.5 text-blue-600" />
          <span>Thêm Hình khối</span>
        </button>

        <button
          onClick={() => alert('Đã mở thư viện hình ảnh & icon!')}
          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-amber-400 rounded-md font-semibold text-slate-700 shadow-2xs transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>Kho Ảnh & Icon</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1"></div>

        <span className="text-[11px] text-slate-400">
          Slide hiện tại: <strong>{currentSlideIndex + 1} / {slides.length}</strong>
        </span>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>AI Slide Generator Sẵn sàng</span>
        </div>
      </div>

      {/* Main Workspace: Left Slide Thumbnails + Center 16:9 Canvas + Right AI Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Slide Thumbnails List */}
        <div className="w-52 bg-white border-r border-slate-200 flex flex-col p-3 overflow-y-auto space-y-3 shrink-0">
          <button
            onClick={handleAddSlide}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 text-amber-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Slide Mới</span>
          </button>

          {slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`group relative rounded-xl border p-2 transition-all cursor-pointer ${
                currentSlideIndex === idx
                  ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>{idx + 1}. {s.title}</span>
                {slides.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteSlide(idx, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 transition-opacity"
                    title="Xóa slide"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Mini Preview Box */}
              <div 
                className="w-full h-24 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 overflow-hidden relative"
                style={{ backgroundColor: s.bgColor }}
              >
                <span className="truncate max-w-[80%] text-center text-xs opacity-60">
                  {s.elements[0]?.content || 'Slide Trống'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Center: 16:9 Canvas Stage (Free-form Drag & Drop Area) */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-slate-200/80">
          <div 
            className="w-[800px] h-[450px] shadow-2xl rounded-xl relative overflow-hidden transition-all border border-slate-300"
            style={{ backgroundColor: currentSlide.bgColor }}
            onClick={() => setSelectedElementId(null)}
          >
            {/* Slide Elements rendered in free-form */}
            {currentSlide.elements.map((el) => {
              const isSelected = selectedElementId === el.id;

              return (
                <div
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(el.id);
                  }}
                  className={`absolute select-none cursor-move transition-shadow ${
                    isSelected ? 'ring-2 ring-amber-500 shadow-md' : 'hover:ring-1 hover:ring-slate-300'
                  }`}
                  style={{
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    backgroundColor: el.bgColor || 'transparent',
                    borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                    color: el.color || 'inherit',
                    fontSize: el.fontSize ? `${el.fontSize}px` : 'inherit',
                    fontWeight: el.fontWeight || 'normal'
                  }}
                >
                  {el.type === 'text' && (
                    <div className="w-full h-full p-1 whitespace-pre-wrap leading-tight">
                      {el.content}
                    </div>
                  )}

                  {/* Resize handles if selected */}
                  {isSelected && (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Kaola AI Slide Generator Panel */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-lg">
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/70 to-orange-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Kaola AI Slide Maker</h3>
                <p className="text-[10px] text-amber-700 font-semibold">{aiCredits} Credits khả dụng</p>
              </div>
            </div>
          </div>

          {/* AI Generator Presets */}
          <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tạo Slide Canva Tự Động
            </span>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              <p className="font-semibold mb-1">💡 Bí quyết vượt trội Canva:</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Chỉ cần nhập tên đề tài, Kaola AI sẽ tự động phân tích dàn ý, chọn phối màu Canva và chèn nội dung hoàn chỉnh vào từng slide.
              </p>
            </div>

            <button
              onClick={() => {
                setAiPrompt('Kế hoạch kinh doanh và mở rộng thị trường Q4/2026');
              }}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-xs text-slate-700 transition-colors"
            >
              📌 Kế hoạch kinh doanh & mở rộng Q4
            </button>

            <button
              onClick={() => {
                setAiPrompt('Pitch Deck giới thiệu giải pháp Kaola Office cho nhà đầu tư');
              }}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-xs text-slate-700 transition-colors"
            >
              🚀 Pitch Deck gọi vốn khởi nghiệp
            </button>

            <button
              onClick={() => {
                setAiPrompt('Báo cáo tổng kết hiệu quả dự án và bài học kinh nghiệm');
              }}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-xs text-slate-700 transition-colors"
            >
              📊 Báo cáo tổng kết dự án quý 3
            </button>

            {isAiLoading && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>{aiStatusMsg}</span>
              </div>
            )}
          </div>

          {/* AI Generator Input */}
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <form onSubmit={handleAiGenerateSlideDeck} className="relative">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Nhập chủ đề slide bạn muốn tạo..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiPrompt.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <span className="text-[10px] text-slate-400 mt-1.5 block text-center">
              Tạo slide đồ họa thông minh chỉ với một cú nhấp chuột.
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Presenter Mode Modal */}
      {isPresenting && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
          onClick={() => {
            if (currentSlideIndex < slides.length - 1) {
              setCurrentSlideIndex(prev => prev + 1);
            } else {
              setIsPresenting(false);
            }
          }}
        >
          <div 
            className="w-[100vw] h-[56.25vw] max-h-[100vh] max-w-[177.78vh] relative"
            style={{ backgroundColor: currentSlide.bgColor }}
          >
            {currentSlide.elements.map((el) => (
              <div
                key={el.id}
                className="absolute"
                style={{
                  left: `${(el.x / 800) * 100}%`,
                  top: `${(el.y / 450) * 100}%`,
                  width: `${(el.width / 800) * 100}%`,
                  height: `${(el.height / 450) * 100}%`,
                  backgroundColor: el.bgColor || 'transparent',
                  borderRadius: el.borderRadius ? `${el.borderRadius * 1.5}px` : undefined,
                  color: el.color || 'inherit',
                  fontSize: el.fontSize ? `${el.fontSize * 1.4}px` : 'inherit',
                  fontWeight: el.fontWeight || 'normal'
                }}
              >
                {el.type === 'text' && (
                  <div className="w-full h-full p-2 whitespace-pre-wrap leading-tight">
                    {el.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 left-6 text-xs text-white/50 bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span>Slide {currentSlideIndex + 1} / {slides.length}</span>
            <span>•</span>
            <span>Click chuột để chuyển tiếp • Nhấn ESC để thoát</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPresenting(false);
            }}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1 text-xs"
          >
            Thoát trình chiếu
          </button>
        </div>
      )}
    </div>
  );
};
