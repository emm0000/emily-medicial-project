import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Home, Heart, Users, Calendar, AlertCircle } from 'lucide-react';
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

const TopBar = ({ currentUser, onAvatarClick }: { currentUser: UserProfile, onAvatarClick: () => void }) => (
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

      <button className="touch-target text-error hover:bg-surface-container-low rounded-xl transition-all">
        <AlertCircle size={32} />
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
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('senior_care_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return FAMILY_PROFILES[0]; // default to 陳小明
  });

  const handleUserChange = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('senior_care_current_user', JSON.stringify(user));
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar currentUser={currentUser} onAvatarClick={() => setIsSwitcherOpen(true)} />
      
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
            className="bg-surface-container-lowest border-2 border-surface-container-highest rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 cursor-default animate-zoom-in"
            onClick={e => e.stopPropagation()}
          >
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
              {FAMILY_PROFILES.map((profile) => {
                const isSelected = profile.name === currentUser.name;
                return (
                  <button
                    key={profile.name}
                    onClick={() => {
                      handleUserChange(profile);
                      setIsSwitcherOpen(false);
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 border-2 text-left transition-all active:scale-[0.98] cursor-pointer ${
                      isSelected 
                        ? 'border-primary bg-primary-container text-on-primary-container shadow-md' 
                        : 'border-outline-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <img 
                      src={profile.avatar} 
                      alt={profile.name} 
                      className="w-16 h-16 rounded-full border-2 border-primary object-cover shadow-sm" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-xl truncate">{profile.name}</p>
                      <p className={`text-sm truncate ${isSelected ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                        {profile.roleLabel}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="bg-primary text-on-primary font-bold text-xs px-2.5 py-1 rounded-full shadow-sm">
                        使用中
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
