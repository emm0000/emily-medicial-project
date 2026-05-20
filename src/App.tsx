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

const TopBar = () => (
  <header className="fixed top-0 left-0 right-0 h-16 bg-surface border-b-2 border-surface-container-highest flex justify-between items-center px-4 z-50">
    <h1 className="text-primary font-extrabold text-2xl">SeniorCare 長者關懷</h1>
    <button className="touch-target text-error hover:bg-surface-container-low rounded-xl transition-all">
      <AlertCircle size={32} />
    </button>
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

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-4xl mx-auto px-5 pt-24 min-h-screen">
        <AnimatePresence mode="wait">
          {currentView === 'home' && <HomeView key="home" setView={setView} />}
          {currentView === 'health' && <HealthView key="health" />}
          {currentView === 'family' && <FamilyView key="family" />}
          {currentView === 'medical' && <MedicalView key="medical" />}
          {currentView === 'manage' && <ManageView key="manage" />}
        </AnimatePresence>
      </main>
      <BottomNav currentView={currentView} setView={setView} />
    </div>
  );
}
