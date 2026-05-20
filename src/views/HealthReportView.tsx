import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Calendar, Footprints, Heart as HeartIcon, Activity, FileText, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HealthReportViewProps {
  setView: (view: string) => void;
}

export const HealthReportView = ({ setView }: HealthReportViewProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('health_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setHistory(data);
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate statistics
  const stats = history.length > 0 ? {
    avgSteps: Math.round(history.reduce((sum, h) => sum + (h.steps || 0), 0) / history.length),
    avgHR: Math.round(history.reduce((sum, h) => sum + (h.heart_rate || 0), 0) / history.length),
    avgSys: Math.round(history.reduce((sum, h) => sum + (h.systolic || 0), 0) / history.length),
    avgDia: Math.round(history.reduce((sum, h) => sum + (h.diastolic || 0), 0) / history.length),
    maxSteps: Math.max(...history.map(h => h.steps || 0)),
    minHR: Math.min(...history.filter(h => h.heart_rate > 0).map(h => h.heart_rate)),
    maxHR: Math.max(...history.map(h => h.heart_rate || 0)),
    totalRecords: history.length
  } : null;

  const getBPCategory = (sys: number, dia: number) => {
    if (sys > 140 || dia > 90) return { label: '偏高', color: 'text-error', bg: 'bg-error-container', icon: TrendingUp };
    if (sys < 90 || dia < 60) return { label: '偏低', color: 'text-tertiary', bg: 'bg-tertiary-container', icon: TrendingDown };
    return { label: '正常', color: 'text-primary', bg: 'bg-primary-container', icon: Minus };
  };

  const getHRCategory = (hr: number) => {
    if (hr < 60) return { label: '偏慢', color: 'text-tertiary' };
    if (hr > 100) return { label: '偏快', color: 'text-error' };
    return { label: '正常', color: 'text-primary' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-8 pb-32"
    >
      {/* Header with back button */}
      <section className="flex items-center gap-4">
        <button
          onClick={() => setView('home')}
          className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={28} />
        </button>
        <div>
          <h2 className="text-4xl font-extrabold flex items-center gap-3">
            <FileText className="text-secondary" size={36} />
            健康報告
          </h2>
          <p className="text-on-surface-variant text-lg">查看完整的健康數據歷史與趨勢分析</p>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl text-on-surface-variant">載入健康報告中...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={64} className="text-secondary opacity-40 mb-4" />
          <p className="text-2xl font-bold text-on-surface-variant">目前沒有健康記錄</p>
          <p className="text-lg text-secondary mt-2">請先到「管理」頁面新增健康數據</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {stats && (
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Footprints size={22} />
                  <span className="font-bold text-sm uppercase">平均步數</span>
                </div>
                <p className="text-3xl font-extrabold">{stats.avgSteps.toLocaleString()}</p>
                <p className="text-sm text-on-surface-variant">最高: {stats.maxSteps.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-error/10 to-error/5 border-2 border-error/20 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-error">
                  <HeartIcon size={22} fill="currentColor" />
                  <span className="font-bold text-sm uppercase">平均心率</span>
                </div>
                <p className="text-3xl font-extrabold">{stats.avgHR} <span className="text-lg font-normal">BPM</span></p>
                <p className="text-sm text-on-surface-variant">範圍: {stats.minHR}-{stats.maxHR}</p>
              </div>
              <div className="col-span-2 bg-gradient-to-br from-secondary/10 to-secondary/5 border-2 border-secondary/20 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-secondary mb-2">
                  <Activity size={22} />
                  <span className="font-bold text-sm uppercase">平均血壓</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-extrabold">{stats.avgSys}/{stats.avgDia} <span className="text-lg font-normal">mmHg</span></p>
                  <div className={`px-4 py-1 rounded-full font-bold text-sm ${getBPCategory(stats.avgSys, stats.avgDia).bg} ${getBPCategory(stats.avgSys, stats.avgDia).color}`}>
                    {getBPCategory(stats.avgSys, stats.avgDia).label}
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant mt-1">共 {stats.totalRecords} 筆記錄</p>
              </div>
            </section>
          )}

          {/* History Timeline */}
          <section className="space-y-4">
            <h3 className="text-2xl font-extrabold flex items-center gap-2">
              <Calendar size={24} className="text-secondary" />
              歷史記錄
            </h3>
            <div className="space-y-3">
              {history.map((record, i) => {
                const bpCat = getBPCategory(record.systolic, record.diastolic);
                const hrCat = getHRCategory(record.heart_rate);
                return (
                  <motion.div
                    key={record.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-surface-container-lowest border-2 border-surface-container-highest rounded-xl p-5 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-primary">{formatDate(record.created_at)}</span>
                      <span className="text-sm text-on-surface-variant">{formatTime(record.created_at)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <Footprints size={18} className="mx-auto text-primary mb-1" />
                        <p className="font-bold text-lg">{(record.steps || 0).toLocaleString()}</p>
                        <p className="text-xs text-on-surface-variant">步</p>
                      </div>
                      <div className="text-center">
                        <HeartIcon size={18} className={`mx-auto mb-1 ${hrCat.color}`} fill="currentColor" />
                        <p className={`font-bold text-lg ${hrCat.color}`}>{record.heart_rate || '--'}</p>
                        <p className="text-xs text-on-surface-variant">BPM</p>
                      </div>
                      <div className="text-center">
                        <Activity size={18} className={`mx-auto mb-1 ${bpCat.color}`} />
                        <p className={`font-bold text-lg ${bpCat.color}`}>{record.systolic}/{record.diastolic}</p>
                        <p className="text-xs text-on-surface-variant">mmHg</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Share Button */}
          <button className="w-full bg-primary text-on-primary text-2xl font-extrabold py-5 rounded-xl shadow-lg flex items-center justify-center gap-4 transition-all hover:brightness-110 active:scale-[0.98]">
            <Share2 size={28} strokeWidth={3} className="text-white" />
            <span className="text-white">匯出報告給醫師</span>
          </button>
        </>
      )}
    </motion.div>
  );
};
