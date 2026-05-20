import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Sun, Pill, ChevronRight, Image as ImageIcon, Calendar, Stethoscope } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const HomeView = ({ setView }: { setView: (v: 'home' | 'health' | 'family' | 'medical' | 'manage') => void }) => {
  const [nextMed, setNextMed] = useState<any>(null);

  useEffect(() => {
    const fetchNextMed = async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('taken', false)
        .order('scheduled_time', { ascending: true })
        .limit(1);
      
      if (!error && data && data.length > 0) {
        setNextMed(data[0]);
      }
    };
    fetchNextMed();
  }, []);

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
          <h2 className="text-4xl font-extrabold">早安，奶奶！</h2>
          <p className="text-on-surface-variant text-2xl">今天是 {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <div className="bg-secondary-container text-on-secondary-container p-4 rounded-xl border-2 border-outline-variant flex flex-col items-center min-w-[120px]">
          <Sun size={40} className="mb-1" />
          <span className="font-bold">72°F</span>
        </div>
      </section>

      <section>
        <button onClick={() => setView('family')} className="w-full bg-error text-on-error h-[120px] rounded-xl flex items-center justify-center gap-6 border-4 border-on-error-container shadow-lg active:scale-95 transition-transform animate-pulse">
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
        <button onClick={exportHealthReport} className="w-full bg-secondary text-on-secondary h-16 rounded-xl flex items-center justify-between px-8 border-2 border-on-secondary-container active:scale-[0.98] transition-all">
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
          className="w-full bg-tertiary-container text-on-tertiary-container h-16 rounded-xl flex items-center justify-between px-8 border-2 border-on-tertiary-fixed-variant active:scale-[0.98] transition-all"
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
