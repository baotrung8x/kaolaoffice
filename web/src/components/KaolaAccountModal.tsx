import { X, Sparkles, CheckCircle2, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import type { KaolaUser } from '../types/office';

interface KaolaAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: KaolaUser;
  onUpgradeToPro: () => void;
}

export const KaolaAccountModal: React.FC<KaolaAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeToPro
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{user.name}</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  user.plan === 'pro' 
                    ? 'bg-amber-400 text-slate-950' 
                    : 'bg-white/20 text-white'
                }`}>
                  {user.plan === 'pro' ? '★ Pro AI Member' : 'Free Member'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Liên kết cổng xác thực: <strong>id.kaola.vn</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Credits Meter */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">Hạn mức Kaola AI Copilot</span>
            </div>
            <span className="text-sm font-bold text-indigo-700">
              {user.aiCreditsRemaining} / {user.aiCreditsTotal} Credits
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (user.aiCreditsRemaining / user.aiCreditsTotal) * 100)}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Mỗi yêu cầu tạo văn bản NĐ 30, viết công thức Excel hoặc sinh slide Canva tiêu hao 1 - 2 credits.
          </p>
        </div>

        {/* Plan Comparison & Upgrade */}
        <div className="p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-4">Các gói dịch vụ Kaola Office</h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Free Tier */}
            <div className={`border rounded-xl p-4 transition-all ${
              user.plan === 'free' 
                ? 'border-blue-400 bg-blue-50/40' 
                : 'border-slate-200 bg-white opacity-80'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Gói Miễn Phí</span>
                <span className="text-xs font-semibold text-slate-500">0 đ / vĩnh viễn</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dùng Word, Excel, Slide không giới hạn</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Lưu trữ trên Kaola Cloud</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>10 AI Credits trải nghiệm</span>
                </li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className={`border rounded-xl p-4 relative transition-all ${
              user.plan === 'pro' 
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20' 
                : 'border-indigo-300 bg-white hover:border-indigo-500 shadow-sm'
            }`}>
              <div className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                KHUYÊN DÙNG
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Gói Pro AI</span>
                <span className="text-xs font-bold text-indigo-700">199.000 đ / tháng</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span><strong>1.000 AI Credits</strong> hàng tháng</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Tự động soạn văn bản NĐ 30/2020</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>AI sinh slide đồ họa Canva tự động</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Ưu tiên tốc độ xử lý AI cao nhất</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <a 
              href="https://id.kaola.vn" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1"
            >
              Quản lý tài khoản tại id.kaola.vn
              <ExternalLink className="w-3 h-3" />
            </a>

            {user.plan === 'free' ? (
              <button
                onClick={() => {
                  onUpgradeToPro();
                  onClose();
                }}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Nâng cấp gói Pro (Kích hoạt 1.000 Credits)
              </button>
            ) : (
              <button
                disabled
                className="bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-default"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Đang sử dụng gói Pro AI
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
