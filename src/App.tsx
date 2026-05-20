import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Home, Heart, Users, Calendar, AlertCircle, Edit2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from './lib/supabase';
import { HomeView } from './views/HomeView';
import { FamilyView } from './views/FamilyView';
import { HealthView } from './views/HealthView';
import { MedicalView } from './views/MedicalView';
import { ManageView } from './views/ManageView';
import { Settings } from 'lucide-react';

type View = 'home' | 'health' | 'family' | 'medical' | 'manage';

export interface UserProfile {
  name: string;
  avatar: string;
  role: string;
  roleLabel: string;
}

export const FAMILY_PROFILES: UserProfile[] = [
  {
    name: '陳小明 (孫子)',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'family',
    roleLabel: '主要聯絡人 / 孫子'
  },
  {
    name: '王春花 (奶奶)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'elder',
    roleLabel: '長者 (受照護對象)'
  },
  {
    name: '林美玲 (專業照護)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'caregiver',
    roleLabel: '日照中心 / 護理師'
  },
  {
    name: '陳阿德 (爸爸)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'family',
    roleLabel: '家屬 / 大兒子'
  }
];

const TopBar = ({ currentUser, onAvatarClick, onSOSClick }: { currentUser: UserProfile, onAvatarClick: () => void, onSOSClick: () => void }) => (
  <header className="fixed top-0 left-0 right-0 h-16 bg-surface border-b-2 border-surface-container-highest flex justify-between items-center px-4 z-50">
    <div className="flex items-center gap-3">
      <h1 className="text-primary font-extrabold text-2xl">SeniorCare</h1>
      <span className="hidden sm:inline bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full text-xs font-bold">長者關懷</span>
    </div>
    <div className="flex items-center gap-3">
      {/* Account Switcher Button */}
      <button 
        onClick={onAvatarClick}
        className="flex items-center gap-2 px-3 py-1 rounded-full border border-outline hover:bg-surface-container-low transition-all active:scale-95 cursor-pointer shadow-sm"
      >
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name} 
          className="w-8 h-8 rounded-full border border-primary object-cover" 
        />
        <span className="text-sm font-bold text-on-surface truncate max-w-[80px] sm:max-w-none">
          {currentUser.name.split(' ')[0]}
        </span>
      </button>

      <button 
        onClick={onSOSClick}
        className="touch-target text-error hover:bg-red-50 hover:text-red-700 rounded-xl transition-all active:scale-90 cursor-pointer p-2 flex items-center justify-center border border-transparent hover:border-error"
        title="緊急求助 SOS"
      >
        <AlertCircle size={36} className="animate-pulse text-red-600" />
      </button>
    </div>
  </header>
);

const BottomNav = ({ currentView, setView }: { currentView: View, setView: (v: View) => void }) => {
  const items = [
    { id: 'home', label: '首頁', icon: Home },
    { id: 'health', label: '健康', icon: Heart },
    { id: 'family', label: '家庭', icon: Users },
    { id: 'medical', label: '醫療', icon: Calendar },
    { id: 'manage', label: '管理', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-24 bg-surface border-t-2 border-surface-container-highest flex justify-around items-center px-4 z-50">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`flex flex-col items-center justify-center gap-1 transition-all rounded-xl px-4 py-2 ${
              isActive ? 'bg-primary-container text-on-primary-container min-w-[100px]' : 'text-on-surface-variant'
            }`}
          >
            <Icon size={isActive ? 36 : 32} fill={isActive ? 'currentColor' : 'none'} />
            <span className="text-xl font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default function App() {
  const [currentView, setView] = useState<View>('home');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  
  // Dynamic profiles list state loaded from localStorage
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('senior_care_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return FAMILY_PROFILES;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('senior_care_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return FAMILY_PROFILES[0]; // default to 陳小明
  });

  // Switcher Modal UI states
  const [modalMode, setModalMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingOldName, setEditingOldName] = useState<string>('');
  const [memberForm, setMemberForm] = useState({
    name: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'family',
    roleLabel: ''
  });

  const handleUserChange = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('senior_care_current_user', JSON.stringify(user));
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) return;

    const newProfile: UserProfile = {
      name: memberForm.name.trim(),
      avatar: memberForm.avatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120',
      role: memberForm.role,
      roleLabel: memberForm.roleLabel.trim() || (memberForm.role === 'elder' ? '長者 (受照護對象)' : memberForm.role === 'caregiver' ? '照護人員' : '家屬')
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem('senior_care_profiles', JSON.stringify(updated));
    handleUserChange(newProfile);
    setModalMode('list');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) return;

    const updatedProfile: UserProfile = {
      name: memberForm.name.trim(),
      avatar: memberForm.avatar.trim(),
      role: memberForm.role,
      roleLabel: memberForm.roleLabel.trim() || (memberForm.role === 'elder' ? '長者 (受照護對象)' : memberForm.role === 'caregiver' ? '照護人員' : '家屬')
    };

    const updated = profiles.map(p => p.name === editingOldName ? updatedProfile : p);
    setProfiles(updated);
    localStorage.setItem('senior_care_profiles', JSON.stringify(updated));

    if (currentUser.name === editingOldName) {
      setCurrentUser(updatedProfile);
      localStorage.setItem('senior_care_current_user', JSON.stringify(updatedProfile));
    }
    setModalMode('list');
  };

  const handleDeleteProfile = (nameToDelete: string) => {
    if (profiles.length <= 1) {
      alert('無法刪除：系統必須保留至少一個家庭角色！');
      return;
    }
    if (!window.confirm(`確定要將成員「${nameToDelete}」從家庭名單中移除嗎？`)) return;

    const updated = profiles.filter(p => p.name !== nameToDelete);
    setProfiles(updated);
    localStorage.setItem('senior_care_profiles', JSON.stringify(updated));

    if (currentUser.name === nameToDelete) {
      handleUserChange(updated[0]);
    }
    setModalMode('list');
  };

  const handleSOSClick = async () => {
    if (!window.confirm(`🚨 【緊急警示確認】確定要觸發 SOS 求助系統，並向所有家人聊天室發出紅色警報嗎？`)) return;
    
    // Redirect to family view (chat room) immediately
    setView('family');
    
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const sosMsgContent = `🚨【SOS 緊急救援警報】長者 ${currentUser.name} 於 ${timeStr} 按下了緊急求助按鈕！請所有家人與專業照護人員儘速確認長者身體安全、與所在位置狀況！`;

    const { error } = await supabase.from('chat_messages').insert([{
      sender_name: currentUser.name,
      sender_avatar: currentUser.avatar,
      content: sosMsgContent,
      is_me: false // categorize as dynamic other sender for immediate left-side red-bubble visualization, or fallback
    }]);

    if (error) {
      alert(`🚨 發送警示失敗：${error.message}`);
    } else {
      alert(`✅ SOS 緊急求助警報已發佈！已自動跳轉至家人聊天室。`);
    }
  };

  const PRESET_AVATARS = [
    { label: '👵 奶奶', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120' },
    { label: '👦 孫子', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120&h=120' },
    { label: '👩‍⚕️ 照護', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120' },
    { label: '👨 爸爸', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar currentUser={currentUser} onAvatarClick={() => { setModalMode('list'); setIsSwitcherOpen(true); }} onSOSClick={handleSOSClick} />
      
      <main className="max-w-4xl mx-auto px-5 pt-24 min-h-screen">
        <AnimatePresence mode="wait">
          {currentView === 'home' && <HomeView key="home" setView={setView} />}
          {currentView === 'health' && <HealthView key="health" />}
          {currentView === 'family' && <FamilyView key="family" currentUser={currentUser} />}
          {currentView === 'medical' && <MedicalView key="medical" />}
          {currentView === 'manage' && <ManageView key="manage" currentUser={currentUser} />}
        </AnimatePresence>
      </main>
      
      <BottomNav currentView={currentView} setView={setView} />

      {/* Account Switcher Glassmorphism Modal */}
      {isSwitcherOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-pointer animate-fade-in"
          onClick={() => setIsSwitcherOpen(false)}
        >
          <div 
            className="bg-surface-container-lowest border-2 border-surface-container-highest rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 cursor-default animate-zoom-in overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {modalMode === 'list' && (
              <>
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-2xl font-extrabold flex items-center gap-2">
                    👤 切換家庭角色
                  </h3>
                  <button 
                    className="text-on-surface-variant hover:text-primary transition-colors text-2xl font-bold w-10 h-10 flex items-center justify-center bg-surface-container-high rounded-full cursor-pointer"
                    onClick={() => setIsSwitcherOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {profiles.map((profile) => {
                    const isSelected = profile.name === currentUser.name;
                    return (
                      <div
                        key={profile.name}
                        className={`w-full p-4 rounded-2xl flex items-center gap-3 border-2 transition-all relative group ${
                          isSelected 
                            ? 'border-primary bg-primary-container text-on-primary-container shadow-md' 
                            : 'border-outline-variant hover:bg-surface-container-high'
                        }`}
                      >
                        <button
                          onClick={() => {
                            handleUserChange(profile);
                            setIsSwitcherOpen(false);
                          }}
                          className="flex-grow flex items-center gap-3 text-left cursor-pointer select-none"
                        >
                          <img 
                            src={profile.avatar} 
                            alt={profile.name} 
                            className="w-14 h-14 rounded-full border-2 border-primary object-cover shadow-sm" 
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-lg truncate">{profile.name}</p>
                            <p className={`text-xs truncate ${isSelected ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                              {profile.roleLabel}
                            </p>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {isSelected && (
                            <span className="bg-primary text-on-primary font-bold text-xs px-2 py-0.5 rounded-full shadow-sm mr-1 hidden sm:inline">
                              使用中
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditingOldName(profile.name);
                              setMemberForm({
                                name: profile.name,
                                avatar: profile.avatar,
                                role: profile.role,
                                roleLabel: profile.roleLabel
                              });
                              setModalMode('edit');
                            }}
                            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors cursor-pointer text-secondary"
                            title="修改資料"
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setMemberForm({
                      name: '',
                      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120',
                      role: 'family',
                      roleLabel: ''
                    });
                    setModalMode('add');
                  }}
                  className="w-full py-3.5 border-2 border-dashed border-outline hover:border-primary rounded-2xl flex items-center justify-center gap-2 text-lg font-bold text-primary hover:bg-primary-container/20 transition-all active:scale-[0.98] cursor-pointer mt-4"
                >
                  <Plus size={22} />
                  新增家庭成員
                </button>
              </>
            )}

            {(modalMode === 'add' || modalMode === 'edit') && (
              <form onSubmit={modalMode === 'add' ? handleAddProfile : handleUpdateProfile} className="space-y-5">
                <div className="flex items-center gap-3 border-b pb-4">
                  <button 
                    type="button" 
                    onClick={() => setModalMode('list')}
                    className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
                  >
                    <ArrowLeft size={22} />
                  </button>
                  <h3 className="text-2xl font-extrabold">
                    {modalMode === 'add' ? '➕ 新增家庭成員' : '✏️ 編輯成員資料'}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-bold text-sm text-on-surface-variant">成員姓名</label>
                    <input 
                      required 
                      type="text" 
                      value={memberForm.name} 
                      onChange={e => setMemberForm({...memberForm, name: e.target.value})} 
                      className="w-full p-3 rounded-xl border-2 border-outline-variant bg-surface outline-none focus:border-primary text-base"
                      placeholder="例如: 陳大明"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-sm text-on-surface-variant">身份類別</label>
                    <select 
                      value={memberForm.role} 
                      onChange={e => setMemberForm({...memberForm, role: e.target.value})} 
                      className="w-full p-3 rounded-xl border-2 border-outline-variant bg-surface outline-none focus:border-primary text-base appearance-none"
                    >
                      <option value="family">家屬 (Family)</option>
                      <option value="elder">長者 / 受照護對象 (Elder)</option>
                      <option value="caregiver">專業照護者 (Caregiver)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-sm text-on-surface-variant">關係/標籤 (選填)</label>
                    <input 
                      type="text" 
                      value={memberForm.roleLabel} 
                      onChange={e => setMemberForm({...memberForm, roleLabel: e.target.value})} 
                      className="w-full p-3 rounded-xl border-2 border-outline-variant bg-surface outline-none focus:border-primary text-base"
                      placeholder="例如: 長者 (受照護對象) 或 主要聯絡人 / 孫子"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface-variant block">成員頭像</label>
                    
                    {/* Shortcut preset avatars */}
                    <div className="grid grid-cols-4 gap-2 pb-2">
                      {PRESET_AVATARS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setMemberForm({...memberForm, avatar: preset.url})}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold hover:bg-surface-container-high transition-all cursor-pointer ${
                            memberForm.avatar === preset.url ? 'border-primary bg-primary-container/30' : 'border-outline-variant'
                          }`}
                        >
                          <img src={preset.url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          <span>{preset.label.split(' ')[1]}</span>
                        </button>
                      ))}
                    </div>

                    <input 
                      type="text" 
                      value={memberForm.avatar} 
                      onChange={e => setMemberForm({...memberForm, avatar: e.target.value})} 
                      className="w-full p-3 rounded-xl border-2 border-outline-variant bg-surface outline-none focus:border-primary text-sm font-mono"
                      placeholder="自訂圖片網址 (URL)..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setModalMode('list')}
                      className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl text-base active:scale-95 transition-transform cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl text-base active:scale-95 transition-transform cursor-pointer shadow-md"
                    >
                      {modalMode === 'add' ? '儲存新增' : '儲存修改'}
                    </button>
                  </div>
                  
                  {modalMode === 'edit' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(editingOldName)}
                      className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-base flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer border border-red-200 mt-2"
                    >
                      <Trash2 size={18} />
                      將此成員自家庭移除
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
