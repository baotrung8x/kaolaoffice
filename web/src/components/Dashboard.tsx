import React, { useState } from 'react';
import { 
  FileText, 
  Table, 
  Presentation, 
  Plus, 
  Sparkles, 
  Clock, 
  FolderOpen, 
  ArrowUpRight, 
  CheckCircle2, 
  Trash2,
  Search
} from 'lucide-react';
import type { OfficeDocument, OfficeDocType } from '../types/office';

interface DashboardProps {
  documents: OfficeDocument[];
  onCreateNew: (type: OfficeDocType, initialPrompt?: string) => void;
  onOpenDocument: (doc: OfficeDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  documents,
  onCreateNew,
  onOpenDocument,
  onDeleteDocument
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPromptInput, setAiPromptInput] = useState('');

  const filteredDocs = documents.filter(doc => {
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleInstantAiGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;

    // Detect type based on keywords
    const lower = aiPromptInput.toLowerCase();
    let targetType: OfficeDocType = 'doc';
    if (lower.includes('bảng') || lower.includes('tính') || lower.includes('doanh thu') || lower.includes('chi phí') || lower.includes('lương')) {
      targetType = 'sheet';
    } else if (lower.includes('slide') || lower.includes('thuyết trình') || lower.includes('pitch') || lower.includes('canva')) {
      targetType = 'slide';
    }

    onCreateNew(targetType, aiPromptInput);
    setAiPromptInput('');
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Banner with AI Generator Prompt */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-12 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Kaola AI Copilot Thế hệ mới</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
              Khởi tạo tài liệu thông minh trong tích tắc
            </h1>
            <p className="text-sm text-slate-300 mb-6">
              Bộ công cụ văn phòng toàn diện: Xử lý văn bản chuẩn hành chính, bảng tính tự động hóa và thiết kế slide phong cách Canva độc quyền.
            </p>

            {/* Quick AI Prompt Input */}
            <form onSubmit={handleInstantAiGenerate} className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 ml-3 shrink-0" />
              <input
                type="text"
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                placeholder="Yêu cầu Kaola AI tạo ngay (ví dụ: 'Soạn hợp đồng mua bán thiết bị văn phòng' hoặc 'Slide kế hoạch Q4')..."
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Tạo bằng AI</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* 3 Core Office Pillars (Cards) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tạo tài liệu mới</h2>
            <span className="text-xs text-slate-500">Mã nguồn mở Apache 2.0 • Hoàn toàn miễn phí</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Kaola Docs (Word) */}
            <div 
              onClick={() => onCreateNew('doc')}
              className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                  Kaola Docs (Word)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Soạn thảo văn bản, hợp đồng, biên bản. Tích hợp mẫu chuẩn hành chính Nghị định 30/2020/NĐ-CP.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>Khởi tạo tài liệu trống</span>
                <Plus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Kaola Sheets (Excel) */}
            <div 
              onClick={() => onCreateNew('sheet')}
              className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Table className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Kaola Sheets (Excel)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bảng tính hiệu năng cao, hỗ trợ 300+ hàm, phân tích số liệu tài chính & AI tự động viết công thức.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                <span>Khởi tạo bảng tính mới</span>
                <Plus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Kaola Slides (Canva Style) */}
            <div 
              onClick={() => onCreateNew('slide')}
              className="bg-white border border-slate-200 hover:border-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Presentation className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                  Kaola Slides (Canva-Style)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Thiết kế bài thuyết trình kéo thả tự do phong cách Canva. Tự động dàn trang và sinh nội dung bằng AI.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
                <span>Khởi tạo bài thuyết trình mới</span>
                <Plus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Files Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">Tài liệu gần đây</h2>
              <span className="text-xs text-slate-400">({documents.length} tệp)</span>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm tài liệu..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 w-44 md:w-56"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'all' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilterType('doc')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'doc' ? 'bg-blue-600 font-bold text-white shadow-2xs' : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  Docs
                </button>
                <button
                  onClick={() => setFilterType('sheet')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'sheet' ? 'bg-emerald-600 font-bold text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-600'
                  }`}
                >
                  Sheets
                </button>
                <button
                  onClick={() => setFilterType('slide')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'slide' ? 'bg-amber-600 font-bold text-white shadow-2xs' : 'text-slate-600 hover:text-amber-600'
                  }`}
                >
                  Slides
                </button>
              </div>
            </div>
          </div>

          {/* Files List */}
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Chưa có tài liệu nào trong danh sách</p>
              <p className="text-xs text-slate-400 mt-1">Chọn một trong các công cụ phía trên để bắt đầu tạo mới.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => {
                const isDoc = doc.type === 'doc';
                const isSheet = doc.type === 'sheet';
                const isSlide = doc.type === 'slide';

                return (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between py-3.5 hover:bg-slate-50/80 px-2 rounded-xl transition-colors group"
                  >
                    <div 
                      onClick={() => onOpenDocument(doc)} 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isDoc ? 'bg-blue-50 text-blue-600' :
                        isSheet ? 'bg-emerald-50 text-emerald-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {isDoc && <FileText className="w-4 h-4" />}
                        {isSheet && <Table className="w-4 h-4" />}
                        {isSlide && <Presentation className="w-4 h-4" />}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {doc.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span>Sửa đổi: {doc.lastModified}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          {doc.cloudSynced && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Kaola Cloud
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onOpenDocument(doc)}
                        className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold rounded-md transition-colors"
                      >
                        Mở
                      </button>
                      <button
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
