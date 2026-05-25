import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Footprints, Heart as HeartIcon, Activity, Calendar, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const HealthView = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data } = await supabase.from('health_metrics').select('*').order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        setMetrics(data[0]);
      }
    };
    fetchMetrics();
  }, []);

  const displayMetrics = metrics || {
    steps: 0,
    target_steps: 8000,
    heart_rate: '--',
    systolic: '--',
    diastolic: '--'
  };

  const stepsPercent = displayMetrics.steps ? Math.min(100, Math.round((displayMetrics.steps / displayMetrics.target_steps) * 100)) : 0;

  // Helpers for dynamic status
  const getStepsStatus = (steps: number, target: number) => {
    if (steps >= target) return { label: '達標', type: 'success' };
    if (steps < target * 0.3) return { label: '偏低', type: 'warning' };
    return { label: '正常', type: 'normal' };
  };

  const getHeartRateStatus = (bpm: number | string) => {
    if (bpm === '--') return { label: '--', type: 'normal' };
    const num = Number(bpm);
    if (num < 60 || num > 100) return { label: '異常', type: 'warning' };
    return { label: '正常', type: 'normal' };
  };

  const getBPStatus = (sys: number | string, dia: number | string) => {
    if (sys === '--' || dia === '--') return { label: '--', type: 'normal' };
    const s = Number(sys);
    const d = Number(dia);
    if (s > 140 || d > 90) return { label: '偏高', type: 'warning' };
    if (s < 90 || d < 60) return { label: '偏低', type: 'warning' };
    return { label: '正常', type: 'normal' };
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-error text-white';
      case 'success': return 'bg-primary text-white';
      default: return 'bg-tertiary-fixed text-on-tertiary-fixed';
    }
  };

  const getCardContainerClass = (type: string) => {
    switch (type) {
      case 'warning': return 'border-2 border-error-container bg-error-container';
      default: return 'border-2 border-surface-container-highest bg-surface-container-lowest';
    }
  };

  const getTextColorClass = (type: string) => {
    switch (type) {
      case 'warning': return 'text-on-error-container';
      default: return 'text-on-surface';
    }
  };

  const stepsStatus = getStepsStatus(displayMetrics.steps, displayMetrics.target_steps);
  const hrStatus = getHeartRateStatus(displayMetrics.heart_rate);
  const bpStatus = getBPStatus(displayMetrics.systolic, displayMetrics.diastolic);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-8 pb-32"
    >
      <section className="space-y-2">
        <h2 className="text-4xl font-extrabold">健康數據追蹤</h2>
        <p className="text-on-surface-variant text-2xl">查看您的健康指數，並與醫療團隊分享。</p>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {/* Steps Card */}
        <div className={`${getCardContainerClass(stepsStatus.type)} p-6 rounded-xl space-y-4 shadow-sm`}>
          <div className="flex justify-between items-start">
            <div className={`flex items-center gap-3 ${getTextColorClass(stepsStatus.type)}`}>
              <Footprints size={32} className={stepsStatus.type === 'warning' ? 'text-error' : 'text-primary'} />
              <span className="font-bold text-xl uppercase">今日步數</span>
            </div>
            <div className={`${getBadgeClass(stepsStatus.type)} px-4 py-1 rounded-full font-bold text-lg`}>{stepsStatus.label}</div>
          </div>
          <div className={`flex items-baseline gap-2 ${getTextColorClass(stepsStatus.type)}`}>
            <span className="text-5xl font-extrabold">{displayMetrics.steps.toLocaleString()}</span>
            <span className="opacity-70 text-2xl">/ {displayMetrics.target_steps.toLocaleString()} 步</span>
          </div>
          <div className="w-full bg-surface-container-highest h-4 rounded-full overflow-hidden">
            <div className={`${stepsStatus.type === 'warning' ? 'bg-error' : 'bg-primary'} h-full transition-all duration-1000`} style={{ width: `${stepsPercent}%` }}></div>
          </div>
          <p className={`text-xl ${getTextColorClass(stepsStatus.type)} opacity-80`}>
            已完成每日目標的 {stepsPercent}%！
          </p>
        </div>

        {/* Heart Rate Card */}
        <div className={`${getCardContainerClass(hrStatus.type)} p-6 rounded-xl space-y-4 shadow-sm`}>
          <div className="flex justify-between items-start">
            <div className={`flex items-center gap-3 ${getTextColorClass(hrStatus.type)}`}>
              <HeartIcon size={32} className={hrStatus.type === 'warning' ? 'text-error' : 'text-primary'} fill="currentColor" />
              <span className="font-bold text-xl uppercase">心率</span>
            </div>
            <div className={`${getBadgeClass(hrStatus.type)} px-4 py-1 rounded-full font-bold text-lg`}>{hrStatus.label}</div>
          </div>
          <div className={`flex items-baseline gap-2 ${getTextColorClass(hrStatus.type)}`}>
            <span className="text-5xl font-extrabold">{displayMetrics.heart_rate}</span>
            <span className="opacity-70 text-2xl">BPM</span>
          </div>
          <div className="h-24 w-full flex items-center justify-center pt-4">
             <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
               <path d="M0,50 Q25,10 50,45 T100,20 T150,40 T200,30" fill="none" stroke={hrStatus.type === 'warning' ? '#ba1a1a' : '#65558f'} strokeWidth="4" strokeLinecap="round" />
             </svg>
          </div>
          <p className={`text-xl ${getTextColorClass(hrStatus.type)} opacity-80`}>
            {hrStatus.type === 'warning' ? '您的心率出現異常波動，請多加留意。' : '靜止心率穩定。'}
          </p>
        </div>

        {/* Blood Pressure Card */}
        <div className={`${getCardContainerClass(bpStatus.type)} p-6 rounded-xl space-y-4 shadow-sm`}>
          <div className="flex justify-between items-start">
            <div className={`flex items-center gap-3 ${getTextColorClass(bpStatus.type)}`}>
              <Activity size={32} />
              <span className="font-bold text-xl uppercase">血壓</span>
            </div>
            <div className={`${getBadgeClass(bpStatus.type)} px-4 py-1 rounded-full font-bold text-lg`}>{bpStatus.label}</div>
          </div>
          <div className={`flex items-baseline gap-2 ${getTextColorClass(bpStatus.type)}`}>
            <span className="text-5xl font-extrabold">{displayMetrics.systolic}/{displayMetrics.diastolic}</span>
            <span className="text-2xl uppercase opacity-70">mmHg</span>
          </div>
          <div className={`bg-surface/50 p-4 rounded-lg ${getTextColorClass(bpStatus.type)}`}>
            <p className="font-bold">數據解析：</p>
            {bpStatus.type === 'warning' ? (
              <p>您今天的血壓數值不尋常。請靜坐休息，並在 15 分鐘後重新測量。</p>
            ) : (
              <p>您今天的血壓數值在正常範圍內，請繼續保持良好的作息！</p>
            )}
          </div>
        </div>
      </div>

      <section className="border-2 border-surface-container-highest bg-surface-container-low p-6 rounded-xl space-y-6">
        <div className="flex items-center gap-3">
          <Calendar size={32} className="text-secondary" />
          <h3 className="text-3xl font-extrabold">每週摘要</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: '每日平均步數', val: '5,820', color: 'text-primary' },
            { label: '睡眠品質', val: '優良', color: 'text-tertiary' },
            { label: '數據穩定度', val: '92%', color: 'text-on-surface-variant' }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-surface rounded-lg">
              <span className="text-2xl text-on-surface-variant">{item.label}</span>
              <span className={`font-bold text-xl ${item.color}`}>{item.val}</span>
            </div>
          ))}
        </div>
        <div className="bg-secondary-container p-6 rounded-xl flex flex-col gap-4">
          <p className="text-on-secondary-container text-xl">您的活動量比上週增加了 12%！請繼續保持。</p>
          <img className="w-full h-48 object-cover rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCn2r8072sbaQN4RBZIy8qhUqujv03pXsTaVHglhkKjjTYCMb0VhhzLZYkfBqekYfW2dRT7ZPyXy-nhd-EMzmlQHh9bNa-OXOw35iLkf8bYZy5fiVG0sfCGcYmdIf8aF9GYFs5mHmWACPHBruiwPws3hQZdSQUm7FNyWZxv4WeOtnubBKhuZOjIrfW9VO1eJKbCqBMQSvzmoASxoOFP6SU7Y2Mhu8_fQO1bjwSfTa4P8pnheABMWC7q_7ng19N9B_ohoiN4fe2D8Io" alt="Healthy Lifestyle" />
        </div>
      </section>

      <button className="w-full bg-primary text-on-primary text-3xl font-extrabold py-6 rounded-xl shadow-lg flex items-center justify-center gap-4 transition-all hover:brightness-110 active:scale-[0.98]">
        <Share2 size={32} strokeWidth={3} className="text-white" />
        <span className="text-white">分享報告</span>
      </button>
    </motion.div>
  );
};
