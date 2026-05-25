import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Activity, Users, Calendar, CheckCircle2, Truck, Trash2, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../App';

export const ManageView = ({ currentUser }: { currentUser: UserProfile }) => {
  const [activeTab, setActiveTab] = useState<'health' | 'family' | 'medical' | 'device'>('health');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [health, setHealth] = useState({ steps: '', heart_rate: '', systolic: '', diastolic: '' });
  const [family, setFamily] = useState({ author_name: currentUser?.name || '照護者', content: '', image_url: '' });
  const [appointment, setAppointment] = useState({ doctor_name: '', specialty: '', appointment_time: '' });
  const [medication, setMedication] = useState({ label: '', description: '', scheduled_time: '', icon: 'pill', color: 'bg-primary-container' });
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveryForm, setDeliveryForm] = useState({ order_number: '', items: '', expected_delivery: '', status: 'ordered' });

  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchDeliveries = async () => {
    const { data } = await supabase
      .from('prescription_deliveries')
      .select('*')
      .order('expected_delivery', { ascending: true });
    if (data) setDeliveries(data);
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setFamily(prev => ({ ...prev, author_name: currentUser.name }));
    }
  }, [currentUser]);

  const compressAndGetBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality to keep database load highly lightweight
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const base64Str = await compressAndGetBase64(file);
      setFamily(prev => ({ ...prev, image_url: base64Str }));
      setPreviewUrl(base64Str);
    } catch (err: any) {
      alert('相片載入或壓縮失敗：' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

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
      setPreviewUrl('');
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

    let finalDescription = medication.description;
    if (selectedWeekDays.length > 0) {
      if (selectedWeekDays.length === 7) {
        finalDescription = `${medication.description} • 每天`;
      } else {
        const order = ['一', '二', '三', '四', '五', '六', '日'];
        const sortedDays = [...selectedWeekDays].sort((a, b) => order.indexOf(a) - order.indexOf(b));
        finalDescription = `${medication.description} • 每週${sortedDays.join('、')}`;
      }
    } else {
      finalDescription = `${medication.description} • 長期服用`;
    }

    const { error } = await supabase.from('medications').insert([{
      label: medication.label,
      description: finalDescription,
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
      setSelectedWeekDays([]);
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('prescription_deliveries').insert([{
      order_number: deliveryForm.order_number,
      items: deliveryForm.items,
      expected_delivery: new Date(deliveryForm.expected_delivery).toISOString(),
      status: deliveryForm.status
    }]);
    setLoading(false);
    if (error) {
      showSuccess(`發生錯誤：(${error.message})`);
    } else {
      showSuccess('處方藥配送訂單已成功新增！');
      setDeliveryForm({ order_number: '', items: '', expected_delivery: '', status: 'ordered' });
      fetchDeliveries();
    }
  };

  const handleUpdateDeliveryStatus = async (id: any, newStatus: string) => {
    // Optimistic UI update
    setDeliveries(prev => prev.map(del => del.id === id ? { ...del, status: newStatus } : del));
    const { error } = await supabase
      .from('prescription_deliveries')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      console.error('Error updating status:', error);
      alert('變更配送狀態失敗：' + error.message);
      fetchDeliveries();
      return;
    }
    
    showSuccess('配送狀態已成功更新！');

    // Automatically send overdue notifications if status changes to not_received
    if (newStatus === 'not_received') {
      const deliveryObj = deliveries.find(d => d.id === id);
      if (deliveryObj) {
        const userName = currentUser?.name || '長者';
        const notificationContent = `📢【藥物配送警告】提醒藥物尚未收到 並且請家人留意！\n(藥物品項: ${deliveryObj.items}，預計送達時間: ${new Date(deliveryObj.expected_delivery).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`;

        await supabase.from('chat_messages').insert([{
          sender_name: userName,
          sender_avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120',
          content: notificationContent,
          is_me: false
        }]);
      }
    }
  };

  const handleDeleteDelivery = async (id: any) => {
    if (!window.confirm('確定要刪除此處方藥配送訂單嗎？')) return;
    // Optimistic UI update
    setDeliveries(prev => prev.filter(del => del.id !== id));
    const { error } = await supabase
      .from('prescription_deliveries')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting delivery:', error);
      alert('刪除配送訂單失敗：' + error.message);
      fetchDeliveries();
    } else {
      showSuccess('配送訂單已成功刪除！');
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
          <Calendar size={20} className="inline mr-2" />新增看診/用藥/配送
        </button>
        <button onClick={() => setActiveTab('device')} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'device' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
          <Smartphone size={20} className="inline mr-2" />📱 跨裝置連線
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
              
              {/* 本機相片上傳區 */}
              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant">選擇本機相片 (推薦，可直接上傳手機或電腦內圖片)</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    id="family-image-file" 
                  />
                  <label 
                    htmlFor="family-image-file" 
                    className="flex-grow flex items-center justify-center gap-3 border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-4 cursor-pointer hover:bg-surface-container-high transition-all text-xl font-bold text-secondary"
                  >
                    {uploadingImage ? '⏳ 正在壓縮相片中...' : (previewUrl ? '✅ 已選擇相片 (點選可更換)' : '📁 選擇手機/電腦相片')}
                  </label>
                  {previewUrl && (
                    <div className="relative">
                      <img src={previewUrl} className="w-20 h-20 object-cover rounded-xl border-2 border-outline shadow-sm" alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => {
                          setFamily(prev => ({ ...prev, image_url: '' }));
                          setPreviewUrl('');
                        }}
                        className="absolute -top-2 -right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant">支援 JPG, PNG，系統將自動進行輕量化無損壓縮以確保流暢顯示。</p>
              </div>

              {/* 外部連結選項 */}
              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant">或是手動貼上相片網址 (選填)</label>
                <input 
                  type="text" 
                  value={family.image_url.startsWith('data:') ? '' : family.image_url} 
                  onChange={e => {
                    setFamily({...family, image_url: e.target.value});
                    setPreviewUrl(e.target.value);
                  }} 
                  className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" 
                  placeholder="如：https://example.com/image.jpg" 
                  disabled={family.image_url.startsWith('data:')}
                />
                {family.image_url.startsWith('data:') && (
                  <p className="text-sm text-primary font-bold">✨ 已選用上方本機上傳圖片，欲貼上網址請先點按右上角 ✕ 移除圖片。</p>
                )}
              </div>
            </div>
            <button disabled={loading || uploadingImage} className="w-full bg-primary text-on-primary h-[64px] rounded-xl font-bold text-2xl active:scale-95 transition-transform disabled:opacity-50">
              {loading ? '發佈中...' : '確認發佈'}
            </button>
          </form>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-10">
            {/* Appointment Form */}
            <form onSubmit={handleAppointmentSubmit} className="space-y-6">
              <h3 className="text-2xl font-bold border-b pb-2 text-primary">新增看診預約</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-on-surface-variant">醫師名稱</label>
                    <input required type="text" value={appointment.doctor_name} onChange={e => setAppointment({...appointment, doctor_name: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="例如: 王大明 醫師" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-on-surface-variant">科別</label>
                    <input 
                      required 
                      type="text" 
                      value={appointment.specialty} 
                      onChange={e => setAppointment({...appointment, specialty: e.target.value})} 
                      className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" 
                      placeholder="例如: 心臟內科" 
                      list="specialty-options"
                    />
                    <datalist id="specialty-options">
                      <option value="心臟內科" />
                      <option value="新陳代謝科" />
                      <option value="眼科" />
                      <option value="牙科" />
                      <option value="骨科" />
                      <option value="神經內科" />
                      <option value="家醫科" />
                      <option value="耳鼻喉科" />
                      <option value="皮膚科" />
                    </datalist>
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
              <h3 className="text-2xl font-bold border-b pb-2 text-secondary">新增用藥排程</h3>
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-on-surface-variant text-xl">選擇用藥星期 (可複選)</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedWeekDays.length === 7) {
                          setSelectedWeekDays([]);
                        } else {
                          setSelectedWeekDays(['一', '二', '三', '四', '五', '六', '日']);
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg border border-outline hover:bg-surface-container-high text-sm font-bold transition-all text-secondary cursor-pointer"
                    >
                      {selectedWeekDays.length === 7 ? '取消全選' : '全選 (每天)'}
                    </button>
                  </div>
                  
                  <div className="flex justify-between gap-1.5 md:gap-2">
                    {['一', '二', '三', '四', '五', '六', '日'].map((day) => {
                      const isSelected = selectedWeekDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedWeekDays(prev => prev.filter(d => d !== day));
                            } else {
                              setSelectedWeekDays(prev => [...prev, day]);
                            }
                          }}
                          className={`w-12 h-12 rounded-full border-2 font-extrabold text-lg flex items-center justify-center transition-all select-none cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary text-white scale-105 shadow-md shadow-primary/20' 
                              : 'border-outline-variant hover:border-outline bg-surface text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="text-sm font-bold text-secondary mt-1 min-h-[1.25rem]">
                    {selectedWeekDays.length > 0 ? (
                      selectedWeekDays.length === 7 
                        ? '✨ 排程設定：每天服用'
                        : `✨ 排程設定：每週 ${['一', '二', '三', '四', '五', '六', '日']
                            .filter(d => selectedWeekDays.includes(d))
                            .join('、')} 服用`
                    ) : (
                      '💡 提示：未勾選星期則預設為「長期服用」'
                    )}
                  </div>
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

            <hr className="border-t-2 border-dashed border-surface-container-highest" />

            {/* Prescription Form */}
            <form onSubmit={handleDeliverySubmit} className="space-y-6">
              <h3 className="text-2xl font-bold border-b pb-2 text-tertiary">新增處方藥配送訂單</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-on-surface-variant">訂單編號</label>
                    <input required type="text" value={deliveryForm.order_number} onChange={e => setDeliveryForm({...deliveryForm, order_number: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="例如: RX99281" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-on-surface-variant">配送狀態</label>
                    <select 
                      value={deliveryForm.status} 
                      onChange={e => setDeliveryForm({...deliveryForm, status: e.target.value})} 
                      className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl appearance-none"
                    >
                      <option value="ordered">已訂購</option>
                      <option value="delivering">配送中</option>
                      <option value="delivered">已簽收 (已送達)</option>
                      <option value="not_received">未收到 (警告)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-on-surface-variant">藥物品項 / 配送內容</label>
                  <input required type="text" value={deliveryForm.items} onChange={e => setDeliveryForm({...deliveryForm, items: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" placeholder="例如: 降血壓藥、維他命 B 群 (28天份)" />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-on-surface-variant">預計送達時間</label>
                  <input required type="datetime-local" value={deliveryForm.expected_delivery} onChange={e => setDeliveryForm({...deliveryForm, expected_delivery: e.target.value})} className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none text-xl" />
                </div>
              </div>
              <button disabled={loading} className="w-full bg-tertiary text-on-tertiary h-[64px] rounded-xl font-bold text-2xl active:scale-95 transition-transform disabled:opacity-50">
                {loading ? '儲存中...' : '確認新增處方藥配送'}
              </button>
            </form>

            <hr className="border-t-2 border-dashed border-surface-container-highest" />

            {/* Prescription Deliveries List and Quick Edit */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                <Truck className="text-secondary" /> 處方藥配送狀態管理
              </h3>
              {deliveries.length > 0 ? (
                <div className="space-y-4">
                  {deliveries.map((del) => (
                    <div key={del.id} className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-lg text-primary uppercase">#{del.order_number}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm ${
                            del.status === 'delivered' || del.status === 'signed' ? 'bg-green-100 text-green-800 border border-green-200' :
                            del.status === 'not_received' ? 'bg-red-100 text-red-800 border border-red-200' :
                            del.status === 'delivering' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {del.status === 'delivered' || del.status === 'signed' ? '已簽收' : 
                             del.status === 'not_received' ? '未收到' : 
                             del.status === 'delivering' ? '配送中' : '已訂購'}
                          </span>
                        </div>
                        <p className="font-bold text-lg">{del.items}</p>
                        <p className="text-sm text-on-surface-variant">
                          預計送達：{new Date(del.expected_delivery).toLocaleString('zh-TW')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select 
                          value={del.status} 
                          onChange={(e) => handleUpdateDeliveryStatus(del.id, e.target.value)}
                          className="p-3 rounded-lg border border-outline-variant bg-surface font-bold text-base outline-none cursor-pointer focus:border-secondary"
                        >
                          <option value="ordered">已訂購</option>
                          <option value="delivering">配送中</option>
                          <option value="delivered">已簽收 (已送達)</option>
                          <option value="not_received">未收到 (警告)</option>
                        </select>
                        <button 
                          onClick={() => handleDeleteDelivery(del.id)}
                          className="p-3 text-error hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors"
                          title="刪除訂單"
                        >
                          <Trash2 size={22} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-lg text-on-surface-variant bg-surface-container-high p-4 rounded-xl text-center font-bold">
                  目前沒有任何處方藥配送訂單
                </p>
              )}
            </div>
           </div>
        )}

        {activeTab === 'device' && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Smartphone className="text-primary" /> 📱 跨裝置行動連線指南
              </h3>
              <p className="text-on-surface-variant text-lg mt-1">
                您可以直接使用智慧型手機或平板電腦掃描下方 QR Code，在其他裝置上操作與測試此照護系統。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
{(() => {
  const publicUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const isPermanent = !!import.meta.env.VITE_PUBLIC_URL;
  return (
    <div className="bg-surface-container-high border border-outline-variant rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
      <div className="bg-white p-3 rounded-xl shadow-inner border border-outline-variant flex items-center justify-center">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicUrl)}`}
          alt="Scan to Connect"
          className="w-[200px] h-[200px] object-contain"
        />
      </div>
      <div>
        <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm inline-block">
          {isPermanent ? '✨ 永久線上網站 QR Code' : '動態區域網路 QR Code'}
        </span>
        <p className="text-secondary font-mono text-sm mt-2 select-all">
          {isPermanent ? '線上網站連結：' : '本機區域網路連結：'}{publicUrl}
        </p>
      </div>
    </div>
  );
})()}

              <div className="space-y-4">
                <h4 className="text-xl font-extrabold text-primary flex items-center gap-2">
                  💡 連線三步驟
                </h4>
                <ol className="list-decimal list-inside space-y-3 text-lg font-bold text-on-surface-variant">
                  <li className="p-3 bg-surface rounded-xl border border-outline-variant shadow-sm">
                    <span className="text-primary">第一步：</span>
                    確認您的手機與目前這台電腦連線至<strong>同一個 Wi-Fi 網路</strong>。
                  </li>
                  <li className="p-3 bg-surface rounded-xl border border-outline-variant shadow-sm">
                    <span className="text-primary">第二步：</span>
                    打開手機相機，對準左側 <strong>QR Code</strong> 進行掃描。
                  </li>
                  <li className="p-3 bg-surface rounded-xl border border-outline-variant shadow-sm">
                    <span className="text-primary">第三步：</span>
                    點擊跳出的連結，即可直接在手機上進行頭貼上傳、用藥確認與 SOS 警報測試！
                  </li>
                </ol>

                <div className="bg-primary-container text-on-primary-container p-4 rounded-xl text-sm font-medium border border-primary/20 shadow-inner">
                  ⚠️ <strong>小提示</strong>：Vite 開發伺服器已自動啟用 <code>--host</code> 參數，會向區域網路廣播您的本機 IP。若無法連線，請檢查電腦的防火牆是否允許 Node.js 進行網路傳輸。
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
