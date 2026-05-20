import { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Activity, Users, Calendar, Pill, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ManageView = () => {
  const [activeTab, setActiveTab] = useState<'health' | 'family' | 'medical'>('health');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [health, setHealth] = useState({ steps: '', heart_rate: '', systolic: '', diastolic: '' });
  const [family, setFamily] = useState({ author_name: '照護者', content: '', image_url: '' });
  const [appointment, setAppointment] = useState({ doctor_name: '', specialty: '', appointment_time: '' });
  const [medication, setMedication] = useState({ label: '', description: '', scheduled_time: '', icon: 'pill', color: 'bg-primary-container' });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleHealthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('health_metrics').insert([{
      steps: parseInt(health.steps) || 0,
      target_steps: 8000,
      heart_rate: parseInt(health.heart_rate) || 0,
      systolic: parseInt(health.systolic) || 0,
      diastolic: parseInt(health.diastolic) || 0,
    }]);
    setLoading(false);
    if (error) {
      showSuccess(`發生錯誤：請先去 Supabase 執行 init.sql 建立資料表！(${error.message})`);
    } else {
      showSuccess('健康數據已成功新增！');
      setHealth({ steps: '', heart_rate: '', systolic: '', diastolic: '' });
    }
  };

  const handleFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('family_updates').insert([{
      author_name: family.author_name,
      content: family.content,
      image_url: family.image_url || null,
      is_icon: !family.image_url
    }]);
    setLoading(false);
    if (error) {
      showSuccess(`發生錯誤：請先去 Supabase 執行 init.sql 建立資料表！(${error.message})`);
    } else {
      showSuccess('家庭動態已成功發佈！');
      setFamily({ ...family, content: '', image_url: '' });
    }
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('medical_appointments').insert([{
      doctor_name: appointment.doctor_name,
      specialty: appointment.specialty,
      appointment_time: new Date(appointment.appointment_time).toISOString(),
      status: 'scheduled'
    }]);
    setLoading(false);
    if (error) {
      showSuccess(`發生錯誤：(${error.message})`);
    } else {
      showSuccess('看診預約已成功新增！');
      setAppointment({ doctor_name: '', specialty: '', appointment_time: '' });
    }
  };

  const handleMedicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('medications').insert([{
      label: medication.label,
      description: medication.description,
      scheduled_time: medication.scheduled_time, // e.g. "08:00"
      icon: medication.icon,
      color: medication.color,
      taken: false
    }]);
    setLoading(false);
    if (error) {
      showSuccess(`發生錯誤：(${error.message})`);
    } else {
      showSuccess('用藥排程已成功新增！');
      setMedication({ label: '', description: '', scheduled_time: '', icon: 'pill', color: 'bg-primary-container' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-8 pb-32"
    >
      <section className="space-y-2">
        <h2 className="text-4xl font-extrabold flex items-center gap-3">
          <Settings className="text-primary" size={40} />
          資料管理中心
        </h2>
        <p className="text-on-surface-variant text-xl">在此模擬家屬或照護者將最新資料寫入系統中。</p>
      </section>

      {successMsg && (
        <div className="bg-primary-container text-on-primary-container p-4 rounded-xl font-bold flex items-center gap-3">
          <CheckCircle2 size={24} />
          {successMsg}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('health')} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'health' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
          <Activity size={20} className="inline mr-2" />新增健康數據
        </button>
        <button onClick={() => setActiveTab('family')} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'family' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
          <Users size={20} className="inline mr-2" />發佈家庭動態
        </button>
        <button onClick={() => setActiveTab('medical')} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'medical' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
          <Calendar size={20} className="inline mr-2" />新增看診/用藥
        </button>
      </div>

      <div className="bg-surface-container-lowest border-2 border-surface-container-highest rounded-2xl p-6 shadow-sm">
        {activeTab === 'health' && (
          <form onSubmit={handleHealthSubmit} className="space-y-6">
            <h3 className="text-2xl font-bold border-b pb-2">新增今日健康數據</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant">今日步數</label>
                <input required type="number" value={health.steps} onChange={e => setHealth({...health, steps: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="例如: 6432" />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant">心率 (BPM)</label>
                <input required type="number" value={health.heart_rate} onChange={e => setHealth({...health, heart_rate: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="例如: 72" />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant">收縮壓 (高壓)</label>
                <input required type="number" value={health.systolic} onChange={e => setHealth({...health, systolic: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="例如: 142" />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant">舒張壓 (低壓)</label>
                <input required type="number" value={health.diastolic} onChange={e => setHealth({...health, diastolic: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="例如: 95" />
              </div>
            </div>
            <button disabled={loading} className="w-full bg-primary text-on-primary h-[64px] rounded-xl font-bold text-2xl active:scale-95 transition-transform disabled:opacity-50">
              {loading ? '儲存中...' : '儲存健康數據'}
            </button>
          </form>
        )}

        {activeTab === 'family' && (
          <form onSubmit={handleFamilySubmit} className="space-y-6">
            <h3 className="text-2xl font-bold border-b pb-2">發佈家庭動態</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant">發佈者名稱</label>
                <input required type="text" value={family.author_name} onChange={e => setFamily({...family, author_name: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant">動態內容</label>
                <textarea required rows={3} value={family.content} onChange={e => setFamily({...family, content: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="輸入想對奶奶說的話..." />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant">相片連結 (可選)</label>
                <input type="text" value={family.image_url} onChange={e => setFamily({...family, image_url: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="https://..." />
              </div>
            </div>
            <button disabled={loading} className="w-full bg-primary text-on-primary h-[64px] rounded-xl font-bold text-2xl active:scale-95 transition-transform disabled:opacity-50">
              {loading ? '發佈中...' : '確認發佈'}
            </button>
          </form>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-10">
            {/* Appointment Form */}
            <form onSubmit={handleAppointmentSubmit} className="space-y-6">
              <h3 className="text-2xl font-bold border-b pb-2">新增看診預約</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-on-surface-variant">醫師名稱</label>
                    <input required type="text" value={appointment.doctor_name} onChange={e => setAppointment({...appointment, doctor_name: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="例如: 王大明 醫師" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-on-surface-variant">科別</label>
                    <input required type="text" value={appointment.specialty} onChange={e => setAppointment({...appointment, specialty: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="例如: 心臟內科" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-on-surface-variant">預約時間</label>
                  <input required type="datetime-local" value={appointment.appointment_time} onChange={e => setAppointment({...appointment, appointment_time: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" />
                </div>
              </div>
              <button disabled={loading} className="w-full bg-primary text-on-primary h-[64px] rounded-xl font-bold text-2xl active:scale-95 transition-transform disabled:opacity-50">
                {loading ? '儲存中...' : '確認新增預約'}
              </button>
            </form>

            <hr className="border-t-2 border-dashed border-surface-container-highest" />

            {/* Medication Form */}
            <form onSubmit={handleMedicationSubmit} className="space-y-6">
              <h3 className="text-2xl font-bold border-b pb-2">新增用藥排程</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-on-surface-variant">排程名稱 (用藥時機)</label>
                    <select 
                      required 
                      value={medication.label} 
                      onChange={e => setMedication({...medication, label: e.target.value})} 
                      className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl appearance-none"
                    >
                      <option value="" disabled>請選擇用藥時機</option>
                      <option value="早餐前">早餐前</option>
                      <option value="早餐後">早餐後</option>
                      <option value="午餐前">午餐前</option>
                      <option value="午餐後">午餐後</option>
                      <option value="晚餐前">晚餐前</option>
                      <option value="晚餐後">晚餐後</option>
                      <option value="睡前">睡前</option>
                      <option value="隨餐服用">隨餐服用</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-on-surface-variant">服藥時間</label>
                    <input required type="time" value={medication.scheduled_time} onChange={e => setMedication({...medication, scheduled_time: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-on-surface-variant">用藥說明 (其他資訊)</label>
                  <select 
                    required 
                    value={medication.description} 
                    onChange={e => setMedication({...medication, description: e.target.value})} 
                    className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl appearance-none"
                  >
                    <option value="" disabled>請選擇用藥說明與劑量</option>
                    <option value="降血壓藥 1 顆">降血壓藥 1 顆</option>
                    <option value="降血糖藥 1 顆">降血糖藥 1 顆</option>
                    <option value="胃藥 1 顆">胃藥 1 顆</option>
                    <option value="感冒藥 1 包">感冒藥 1 包</option>
                    <option value="眼藥水 1 滴">眼藥水 1 滴</option>
                    <option value="維他命/保健食品 1 顆">維他命/保健食品 1 顆</option>
                    <option value="止痛藥 1 顆">止痛藥 1 顆</option>
                    <option value="心臟科藥物 1 顆">心臟科藥物 1 顆</option>
                    <option value="鈣片 1 錠">鈣片 1 錠</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-on-surface-variant">圖示選擇</label>
                  <div className="flex gap-4">
                    <label className={`flex items-center gap-2 text-xl p-3 rounded-xl border-2 cursor-pointer transition-colors ${medication.icon === 'sun' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface'}`}>
                      <input type="radio" name="icon" value="sun" checked={medication.icon === 'sun'} onChange={e => setMedication({...medication, icon: e.target.value, color: 'bg-tertiary-container'})} className="hidden" />
                      白天 (太陽)
                    </label>
                    <label className={`flex items-center gap-2 text-xl p-3 rounded-xl border-2 cursor-pointer transition-colors ${medication.icon === 'pill' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface'}`}>
                      <input type="radio" name="icon" value="pill" checked={medication.icon === 'pill'} onChange={e => setMedication({...medication, icon: e.target.value, color: 'bg-primary-container'})} className="hidden" />
                      一般 (藥丸)
                    </label>
                  </div>
                </div>
              </div>
              <button disabled={loading} className="w-full bg-secondary text-on-secondary h-[64px] rounded-xl font-bold text-2xl active:scale-95 transition-transform disabled:opacity-50">
                {loading ? '儲存中...' : '確認新增用藥'}
              </button>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
};
