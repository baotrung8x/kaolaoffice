import { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DocsEditor } from './components/editors/DocsEditor';
import { SheetsEditor } from './components/editors/SheetsEditor';
import { SlidesEditor } from './components/editors/SlidesEditor';
import { KaolaAccountModal } from './components/KaolaAccountModal';
import type { KaolaUser, OfficeDocument, OfficeDocType } from './types/office';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | OfficeDocType>('dashboard');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // User state linked to id.kaola.vn
  const [user, setUser] = useState<KaolaUser>({
    id: 'usr_kaola_001',
    name: 'Trung Nguyễn',
    email: 'trung.nguyen@kaola.vn',
    plan: 'free',
    aiCreditsRemaining: 15,
    aiCreditsTotal: 20,
    connectedToKaolaId: true
  });

  // Local & Cloud Documents
  const [documents, setDocuments] = useState<OfficeDocument[]>([
    {
      id: 'doc-01',
      title: 'Tờ trình triển khai Kaola Office 2026',
      type: 'doc',
      lastModified: '17/10/2026 19:30',
      size: '24 KB',
      cloudSynced: true
    },
    {
      id: 'sheet-01',
      title: 'Kế hoạch Ngân sách & Dự toán Doanh thu',
      type: 'sheet',
      lastModified: '17/10/2026 18:45',
      size: '42 KB',
      cloudSynced: true
    },
    {
      id: 'slide-01',
      title: 'Pitch Deck Giới thiệu Kaola AI Copilot',
      type: 'slide',
      lastModified: '17/10/2026 17:15',
      size: '1.2 MB',
      cloudSynced: true
    }
  ]);

  const [currentEditingDoc, setCurrentEditingDoc] = useState<OfficeDocument | null>(null);

  // AI credit consumption check
  const handleUseAiCredit = (): boolean => {
    if (user.aiCreditsRemaining <= 0) {
      alert('Bạn đã sử dụng hết lượt Kaola AI Credits miễn phí. Vui lòng nâng cấp gói Pro để tiếp tục sử dụng!');
      setIsAccountModalOpen(true);
      return false;
    }
    setUser(prev => ({
      ...prev,
      aiCreditsRemaining: Math.max(0, prev.aiCreditsRemaining - 1)
    }));
    return true;
  };

  const handleUpgradeToPro = () => {
    setUser(prev => ({
      ...prev,
      plan: 'pro',
      aiCreditsRemaining: 1000,
      aiCreditsTotal: 1000
    }));
    alert('Chúc mừng! Bạn đã kích hoạt thành công gói Pro AI với 1.000 Credits mỗi tháng.');
  };

  const handleCreateNew = (type: OfficeDocType, initialPrompt?: string) => {
    const newDocId = `${type}-${Date.now()}`;
    const defaultTitle = 
      type === 'doc' ? (initialPrompt ? `Văn bản: ${initialPrompt.slice(0, 25)}...` : 'Tài liệu Văn bản Mới') :
      type === 'sheet' ? (initialPrompt ? `Bảng tính: ${initialPrompt.slice(0, 25)}...` : 'Bảng tính Mới') :
      (initialPrompt ? `Slide: ${initialPrompt.slice(0, 25)}...` : 'Bài Thuyết trình Mới');

    const newDoc: OfficeDocument = {
      id: newDocId,
      title: defaultTitle,
      type,
      lastModified: 'Vừa xong',
      size: '12 KB',
      cloudSynced: true
    };

    setDocuments(prev => [newDoc, ...prev]);
    setCurrentEditingDoc(newDoc);
    setActiveTab(type);
  };

  const handleOpenDocument = (doc: OfficeDocument) => {
    setCurrentEditingDoc(doc);
    setActiveTab(doc.type);
  };

  const handleDeleteDocument = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (currentEditingDoc?.id === id) {
        setCurrentEditingDoc(null);
        setActiveTab('dashboard');
      }
    }
  };

  const handleSaveDocument = (content: any) => {
    if (!currentEditingDoc) return;
    setDocuments(prev => prev.map(d => {
      if (d.id === currentEditingDoc.id) {
        return {
          ...d,
          lastModified: 'Vừa xong',
          content,
          cloudSynced: true
        };
      }
      return d;
    }));
    alert('Đã lưu tài liệu vào Kaola Cloud an toàn!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-text">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'dashboard') {
            setCurrentEditingDoc(null);
          } else if (!currentEditingDoc || currentEditingDoc.type !== tab) {
            // Pick latest doc of this type or create blank
            const match = documents.find(d => d.type === tab);
            if (match) {
              setCurrentEditingDoc(match);
            } else {
              handleCreateNew(tab);
            }
          }
        }}
        user={user}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Main Content View */}
      {activeTab === 'dashboard' && (
        <Dashboard
          documents={documents}
          onCreateNew={handleCreateNew}
          onOpenDocument={handleOpenDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      )}

      {activeTab === 'doc' && currentEditingDoc && (
        <DocsEditor
          document={currentEditingDoc}
          onBack={() => {
            setActiveTab('dashboard');
            setCurrentEditingDoc(null);
          }}
          onSave={handleSaveDocument}
          onUseAiCredit={handleUseAiCredit}
          aiCredits={user.aiCreditsRemaining}
        />
      )}

      {activeTab === 'sheet' && currentEditingDoc && (
        <SheetsEditor
          document={currentEditingDoc}
          onBack={() => {
            setActiveTab('dashboard');
            setCurrentEditingDoc(null);
          }}
          onSave={handleSaveDocument}
          onUseAiCredit={handleUseAiCredit}
          aiCredits={user.aiCreditsRemaining}
        />
      )}

      {activeTab === 'slide' && currentEditingDoc && (
        <SlidesEditor
          document={currentEditingDoc}
          onBack={() => {
            setActiveTab('dashboard');
            setCurrentEditingDoc(null);
          }}
          onSave={handleSaveDocument}
          onUseAiCredit={handleUseAiCredit}
          aiCredits={user.aiCreditsRemaining}
        />
      )}

      {/* Kaola ID & AI Upgrade Modal */}
      <KaolaAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        onUpgradeToPro={handleUpgradeToPro}
      />
    </div>
  );
}

export default App;
