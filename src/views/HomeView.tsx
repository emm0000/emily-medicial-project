import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Sun, Pill, ChevronRight, Image as ImageIcon, Calendar, Stethoscope, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../App';

export const HomeView = ({ setView, onSOSClick, currentUser, onTourClick }: { setView: (v: 'home' | 'health' | 'family' | 'medical' | 'manage') => void, onSOSClick?: () => void, currentUser?: UserProfile, onTourClick?: () => void }) => {
  const [nextMed, setNextMed] = useState<any>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let timeGreeting = '您好';
      if (hour >= 5 && hour < 12) {
        timeGreeting = '早安';
      } else if (hour >= 12 && hour < 18) {
        timeGreeting = '午安';
      } else {
        timeGreeting = '晚安';
      }

      const name = currentUser?.name || '長者';
      let displayName = name;
      
      const parenMatch = name.match(/\(([^)]+)\)/);
      if (parenMatch && parenMatch[1]) {
        const relation = parenMatch[1];
        if (['奶奶', '爺爺', '外公', '外婆', '爸爸', '媽媽', '阿公', '阿嬤', '孫子', '專業照護', '照護'].includes(relation)) {
          displayName = relation;
        } else {
          displayName = name.split(/\s+\(/)[0];
        }
      } else {
        displayName = name.split(/[\s(]/)[0];
      }

      setGreeting(`${timeGreeting}，${displayName}！`);
    };

    updateGreeting();
    
    // Check and update greeting every 10 seconds to keep time greeting ultra-responsive
    const interval = setInterval(updateGreeting, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const fetchNextMed = async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('taken', false)
        .order('scheduled_time', { ascending: true });
      
      if (!error && data && data.length > 0) {
        // Filter medications by today's day of week to only show today's schedule
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const todayDay = days[new Date().getDay()];
        
        const nextTodayMed = data.find(med => {
          const desc = med.description || '';
          if (desc.includes('每週')) {
            return desc.includes(todayDay);
          }
          // "每天" or "長期服用" applies to every day
          return true;
        });

        if (nextTodayMed) {
          setNextMed(nextTodayMed);
        } else {
          setNextMed(null);
        }
      } else {
        setNextMed(null);
      }
    };
    fetchNextMed();
  }, [currentUser]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const markAsTaken = async () => {
    if (nextMed) {
      await supabase.from('medications').update({ taken: true }).eq('id', nextMed.id);
      setNextMed(null); // Simple optimistic update
    }
  };

  const exportHealthReport = async () => {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert('無法獲取健康數據：' + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert('目前沒有任何健康數據可以匯出！請先到「管理」分頁新增一些數據。');
      return;
    }

    // Generate CSV
    const headers = ['記錄時間', '今日步數', '目標步數', '心率 (BPM)', '收縮壓 (高壓)', '舒張壓 (低壓)'];
    const rows = data.map(item => [
      new Date(item.created_at).toLocaleString('zh-TW'),
      item.steps,
      item.target_steps,
      item.heart_rate,
      item.systolic,
      item.diastolic
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `健康報告_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-32"
    >
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold">{greeting}</h2>
          <p className="text-on-surface-variant text-2xl">今天是 {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <div className="bg-secondary-container text-on-secondary-container p-4 rounded-xl border-2 border-outline-variant flex flex-col items-center min-w-[120px]">
          <Sun size={40} className="mb-1" />
          <span className="font-bold">72°F</span>
        </div>
      </section>

      {/* 🎬 Premium Interactive Video Tour Invitation Card */}
      <section className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 border-2 border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Glowing visual effect in background */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        
        <div className="space-y-2 z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              <Sparkles size={10} fill="currentColor" /> Premium Tour
            </span>
            <span className="text-xs text-indigo-300 font-bold">全新多媒體介紹</span>
          </div>
          <h3 className="text-2xl font-black text-white">🎬 網站功能互動式影音導覽</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            長者安心、子女放心。一秒鐘自動播放全站功能動態演示，配合專業中英語音朗讀旁白與擬真手機畫面操作！
          </p>
        </div>

        <button 
          onClick={onTourClick} 
          className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-lg px-8 py-4 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 hover:scale-[1.03] transition-all cursor-pointer border-none z-10 whitespace-nowrap flex items-center justify-center gap-2"
        >
          <span>立即播放影音介紹</span>
          <ChevronRight size={20} />
        </button>
      </section>

      <section>
        <button onClick={onSOSClick || (() => setView('family'))} className="w-full bg-error text-on-error h-[120px] rounded-xl flex items-center justify-center gap-6 border-4 border-on-error-container shadow-lg active:scale-95 transition-transform animate-pulse">
          <AlertCircle size={64} fill="currentColor" className="text-white" />
          <span className="text-3xl font-extrabold uppercase tracking-widest text-white">緊急求助 SOS</span>
        </button>
      </section>

      {nextMed && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-on-surface-variant flex items-center gap-2">
            <Pill className="text-primary" /> 下次服藥時間
          </h3>
          <div className="bg-surface-container-lowest border-2 border-surface-container-highest p-6 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-primary-container text-on-primary-container w-[64px] h-[64px] rounded-full flex items-center justify-center">
                <Calendar size={32} strokeWidth={3} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{formatTime(nextMed.scheduled_time)}</p>
                <p className="text-2xl">{nextMed.description}</p>
              </div>
            </div>
            <button onClick={markAsTaken} className="bg-tertiary text-on-tertiary px-8 py-4 rounded-xl font-bold text-xl active:scale-95 transition-transform text-white">
              確認服用
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4">
        <button onClick={exportHealthReport} className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 border-none shadow-lg text-white font-extrabold h-16 rounded-xl flex items-center justify-between px-8 active:scale-[0.98] hover:opacity-95 hover:scale-[1.01] transition-all cursor-pointer">
          <span className="flex items-center gap-4">
            <Stethoscope className="text-white" />
            <span className="font-bold text-xl text-white">匯出健康報告 (CSV)</span>
          </span>
          <ChevronRight className="text-white" />
        </button>
        <button 
          onClick={() => {
            localStorage.setItem('scroll_to_album', 'true');
            setView('family');
          }} 
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 border-none shadow-lg text-white font-extrabold h-16 rounded-xl flex items-center justify-between px-8 active:scale-[0.98] hover:opacity-95 hover:scale-[1.01] transition-all cursor-pointer"
        >
          <span className="flex items-center gap-4">
            <ImageIcon className="text-white" />
            <span className="font-bold text-xl text-white">家庭相簿</span>
          </span>
          <ChevronRight className="text-white" />
        </button>
      </div>
    </motion.div>
  );
};
