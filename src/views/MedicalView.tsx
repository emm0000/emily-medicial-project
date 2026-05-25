import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, PlusCircle, Bell, Check, Truck, Sun, Pill, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../App';

export const MedicalView = ({ currentUser }: { currentUser?: UserProfile }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    // Fetch only upcoming appointments (time >= now)
    const nowStr = new Date().toISOString();
    const { data: aptData } = await supabase
      .from('medical_appointments')
      .select('*')
      .gte('appointment_time', nowStr)
      .order('appointment_time', { ascending: true });
    if (aptData) setAppointments(aptData);

    const { data: medData } = await supabase
      .from('medications')
      .select('*')
      .order('scheduled_time', { ascending: true });
    if (medData) setMedications(medData);

    // Fetch all active prescription deliveries
    const { data: delData } = await supabase
      .from('prescription_deliveries')
      .select('*')
      .order('expected_delivery', { ascending: true });
    if (delData) setDeliveries(delData);
  };

  useEffect(() => {
    fetchData();
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

  const getIcon = (iconName: string) => {
    if (iconName === 'sun') return Sun;
    return Pill;
  };

  const toggleTaken = async (id: any, currentTaken: boolean) => {
    const newTaken = !currentTaken;
    // Optimistic UI update
    setMedications(prev => prev.map(med => med.id === id ? { ...med, taken: newTaken } : med));
    
    const { error } = await supabase
      .from('medications')
      .update({ taken: newTaken })
      .eq('id', id);
      
    if (error) {
      console.error('Error toggling medication state:', error);
      // Rollback
      setMedications(prev => prev.map(med => med.id === id ? { ...med, taken: currentTaken } : med));
    }
  };

  const deleteMedication = async (id: any) => {
    if (!window.confirm('確定要刪除此用藥排程嗎？')) return;
    
    // Optimistic UI update
    setMedications(prev => prev.filter(med => med.id !== id));
    
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting medication:', error);
      alert('刪除用藥排程失敗：' + error.message);
      // Re-fetch
      const { data: medData } = await supabase
        .from('medications')
        .select('*')
        .order('scheduled_time', { ascending: true });
      if (medData) setMedications(medData);
    }
  };

  const handleConfirmDelivery = async (id: any, newStatus: string, deliveryObj?: any) => {
    // Optimistic UI update
    setDeliveries(prev => prev.map(del => del.id === id ? { ...del, status: newStatus } : del));

    const { error } = await supabase
      .from('prescription_deliveries')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating delivery status:', error);
      alert('更新配送狀態失敗：' + error.message);
      fetchData(); // Rollback
      return;
    }

    if (newStatus === 'not_received' && deliveryObj) {
      // Send auto-notification message in family chat room
      const userName = currentUser?.name || '長者';
      const notificationContent = `📢【藥物配送警告】提醒藥物尚未收到 並且請家人留意！\n(藥物品項: ${deliveryObj.items}，預計送達時間: ${new Date(deliveryObj.expected_delivery).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`;

      const { error: chatError } = await supabase.from('chat_messages').insert([{
        sender_name: userName,
        sender_avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120',
        content: notificationContent,
        is_me: false
      }]);

      if (chatError) {
        console.error('Error sending auto chat alert:', chatError);
        alert('已將狀態標記為未收到，但自動發送家人聊天室通知失敗：' + chatError.message);
      } else {
        alert('⚠️ 藥物配送已標記為「未收到」，已自動傳送警告通知至家人聊天室！');
      }
    } else if (newStatus === 'delivered' || newStatus === 'signed') {
      alert('✅ 藥物已順利簽收！');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-32"
    >
      <section className="space-y-4">
        <h2 className="text-3xl font-extrabold flex items-center gap-2">
          <Calendar className="text-primary" size={32} />
          看診行程安排
        </h2>
        
        {appointments.length > 0 ? (
          <div className="space-y-6">
            {/* Featured Nearest Card */}
            <div className="bg-gradient-to-r from-primary-container to-secondary-container border-2 border-primary rounded-2xl p-6 space-y-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-4 relative z-10">
                <img 
                  alt={appointments[0].doctor_name} 
                  className="w-20 h-20 rounded-full border-2 border-primary object-cover shadow-sm bg-white" 
                  src={appointments[0].doctor_avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuD13m5TlhYa2uc5dcRm-ajdWTQ4dks3JlpDtpFpkW4veK99SBbztQ2hOYNCsVM4Wx_-fUHQSUtjwcUhiB9hm3-Zetyyw8SHSdXhVRzvQPxxizWCD1zV4mWVnCdWGcbC-5_CMZbDULZdgMzdCAHHlwMdBg7wmgdFxW3DOvBOCMqI8OzPTjO09iOHHhTpBvERtINTd1iKoq9tNohg-I46KkVkdRogl2FLEoX2Y2Vyb6PrgmNMycD77vviE_KNp2wVqRido4eGtLbYxKM"}
                />
                <div>
                  <span className="bg-primary text-on-primary px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm mb-1.5 inline-block">
                    最近期看診
                  </span>
                  <p className="text-2xl font-extrabold text-on-primary-container">{appointments[0].doctor_name}</p>
                  <p className="text-secondary font-bold text-xl uppercase">{appointments[0].specialty}</p>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between border border-primary/20 shadow-inner">
                <div className="flex items-center gap-3">
                  <Calendar size={24} className="text-primary" />
                  <span className="font-extrabold text-xl text-primary">
                    {new Date(appointments[0].appointment_time).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' })}
                  </span>
                </div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black text-sm border border-primary/20">已預約</span>
              </div>
            </div>

            {/* Compact Agenda List of All Scheduled Appointments */}
            {appointments.length > 0 && (
              <div className="space-y-3 bg-surface-container-lowest border-2 border-surface-container-highest rounded-2xl p-5 shadow-sm">
                <h3 className="text-xl font-extrabold text-on-surface flex items-center gap-2 border-b pb-3 mb-1">
                  📅 所有已安排項目 ({appointments.length})
                </h3>
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {appointments.map((apt, index) => (
                    <div 
                      key={apt.id || index} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        index === 0 
                          ? 'bg-primary-container/25 border-primary/30 hover:bg-primary-container/35 shadow-sm' 
                          : 'bg-surface border-outline-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          alt={apt.doctor_name} 
                          className="w-12 h-12 rounded-full border border-outline object-cover bg-white" 
                          src={apt.doctor_avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuD13m5TlhYa2uc5dcRm-ajdWTQ4dks3JlpDtpFpkW4veK99SBbztQ2hOYNCsVM4Wx_-fUHQSUtjwcUhiB9hm3-Zetyyw8SHSdXhVRzvQPxxizWCD1zV4mWVnCdWGcbC-5_CMZbDULZdgMzdCAHHlwMdBg7wmgdFxW3DOvBOCMqI8OzPTjO09iOHHhTpBvERtINTd1iKoq9tNohg-I46KkVkdRogl2FLEoX2Y2Vyb6PrgmNMycD77vviE_KNp2wVqRido4eGtLbYxKM"}
                        />
                        <div>
                          <p className="font-bold text-lg text-on-surface flex items-center gap-1.5">
                            {apt.doctor_name}
                            {index === 0 && <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-black">最近</span>}
                          </p>
                          <p className="text-sm font-bold text-secondary uppercase">{apt.specialty}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-0.5">
                        <span className="font-bold text-base text-on-surface-variant">
                          {new Date(apt.appointment_time).toLocaleString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </span>
                        <span className="font-black text-sm text-primary">
                          {new Date(apt.appointment_time).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface border-2 border-dashed border-surface-container-highest rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <Calendar size={48} className="text-secondary opacity-50 mb-4" />
            <p className="text-xl font-bold text-on-surface-variant">目前沒有預約看診</p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold">用藥排程</h2>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`${isEditing ? 'text-tertiary' : 'text-primary'} font-bold text-xl flex items-center gap-1 hover:opacity-80 transition-all`}
          >
            <PlusCircle size={24} className={isEditing ? 'rotate-45 transition-transform' : 'transition-transform'} />
            {isEditing ? '完成' : '修改'}
          </button>
        </div>
        <div className="space-y-4">
          {medications.length > 0 ? medications.map((med, i) => {
            const Icon = getIcon(med.icon);
            // Parse details such as "降血壓藥 1 顆 • 每週一、三、五"
            const parts = med.description ? med.description.split(' • ') : [med.description];

            return (
              <div key={i} className={`bg-surface border-2 rounded-xl p-6 flex items-center gap-6 transition-all duration-300 ${!med.taken ? 'border-primary' : 'border-surface-container-highest shadow-sm'}`}>
                {isEditing && (
                  <button 
                    onClick={() => deleteMedication(med.id)}
                    className="p-3 bg-error text-on-error rounded-full hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <Trash2 size={24} />
                  </button>
                )}
                <div className={`${med.color} w-16 h-16 rounded-full flex items-center justify-center text-white`}>
                  <Icon size={32} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xl">{med.label}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-on-surface-variant text-xl">{parts[0]}</span>
                    {parts[1] && (
                      <span className={`px-2.5 py-0.5 rounded-full text-sm font-black border flex items-center gap-1 shadow-sm ${
                        parts[1].includes('每週') 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : parts[1].includes('每天')
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-surface-container-high text-on-surface-variant border-outline-variant'
                      }`}>
                        {parts[1]}
                      </span>
                    )}
                    <span className="text-on-surface-variant text-xl">• {formatTime(med.scheduled_time)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => toggleTaken(med.id, med.taken)}
                  className={`w-[64px] h-[64px] border-4 rounded-full flex items-center justify-center transition-all ${!med.taken ? 'border-primary text-primary animate-pulse' : 'border-tertiary text-tertiary hover:opacity-80'}`}
                >
                  {!med.taken ? <Bell size={32} /> : <Check size={32} />}
                </button>
              </div>
            );
          }) : (
            <div className="bg-surface border-2 border-dashed border-surface-container-highest rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <Pill size={48} className="text-secondary opacity-50 mb-4" />
              <p className="text-xl font-bold text-on-surface-variant">目前沒有用藥排程</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-extrabold">處方藥配送</h2>
        {deliveries.length > 0 ? deliveries.map((delivery, i) => {
          const isNotReceived = delivery.status === 'not_received';
          const isDelivered = delivery.status === 'delivered' || delivery.status === 'signed';

          let progressWidth = 'w-1/3';
          let orderedClass = 'text-secondary font-extrabold';
          let deliveringClass = 'text-on-surface-variant opacity-30';
          let deliveredClass = 'text-on-surface-variant opacity-30';

          if (delivery.status === 'delivering') {
            progressWidth = 'w-2/3';
            orderedClass = 'text-secondary opacity-70';
            deliveringClass = 'text-secondary font-extrabold';
            deliveredClass = 'text-on-surface-variant opacity-30';
          } else if (isDelivered) {
            progressWidth = 'w-full';
            orderedClass = 'text-secondary opacity-70';
            deliveringClass = 'text-secondary opacity-70';
            deliveredClass = 'text-green-600 font-extrabold';
          } else if (isNotReceived) {
            progressWidth = 'w-full bg-red-600';
            orderedClass = 'text-secondary opacity-50';
            deliveringClass = 'text-secondary opacity-50';
            deliveredClass = 'text-red-600 font-extrabold';
          }

          // Check if expected delivery time is reached/passed and status is not finalized
          const isOverdue = new Date() > new Date(delivery.expected_delivery);
          const needsConfirmation = isOverdue && !isDelivered && !isNotReceived;

          return (
            <div 
              key={i} 
              className={`bg-surface border-2 rounded-xl p-6 space-y-6 shadow-sm transition-all duration-300 ${
                isNotReceived 
                  ? 'border-red-500 bg-red-50/20' 
                  : isDelivered 
                    ? 'border-green-500 bg-green-50/10' 
                    : 'border-surface-container-highest'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-xl uppercase tracking-wide">訂單編號 {delivery.order_number}</p>
                    {isNotReceived && (
                      <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-0.5 rounded-full text-xs font-black shadow-sm">
                        ⚠️ 未收到
                      </span>
                    )}
                    {isDelivered && (
                      <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-0.5 rounded-full text-xs font-black shadow-sm">
                        ✅ 已簽收
                      </span>
                    )}
                    {needsConfirmation && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-0.5 rounded-full text-xs font-black animate-pulse shadow-sm flex items-center gap-1">
                        ⏰ 待確認
                      </span>
                    )}
                  </div>
                  <p className="text-on-surface-variant text-xl mt-2 font-bold">{delivery.items}</p>
                </div>
                <Truck size={40} className={isNotReceived ? "text-red-500 animate-pulse" : isDelivered ? "text-green-600" : "text-secondary"} />
              </div>
              
              {!isNotReceived ? (
                <div className="space-y-3">
                  <div className="w-full bg-surface-container-highest h-4 rounded-full overflow-hidden">
                    <div className={`h-full ${progressWidth} rounded-full transition-all duration-500 ${isDelivered ? 'bg-green-600' : 'bg-secondary'}`}></div>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className={orderedClass}>已訂購</span>
                    <span className={deliveringClass}>配送中</span>
                    <span className={isDelivered ? 'text-green-600 font-extrabold' : deliveredClass}>已簽收</span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 font-bold">
                  <AlertCircle className="text-red-600 flex-shrink-0 animate-pulse" size={24} />
                  <span>已將配送狀態標記為「未收到」，並自動向家人聊天室發出提醒警示。</span>
                </div>
              )}

              <p className={`p-4 rounded-lg text-xl text-center border-2 ${
                isNotReceived 
                  ? 'bg-red-100/50 border-red-300 text-red-900' 
                  : isDelivered 
                    ? 'bg-green-50 border-green-200 text-green-900' 
                    : 'bg-secondary-container border-secondary text-on-secondary-container'
              }`}>
                預計送達時間：<strong>{new Date(delivery.expected_delivery).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' })}</strong>
              </p>

              {/* Overdue interactive confirmation action buttons */}
              {needsConfirmation && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3 text-amber-900 font-extrabold text-xl">
                    <Bell className="text-amber-600 animate-bounce" size={24} />
                    <span>⏰ 預計配送時間已到！請問您是否已收到藥物？</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => handleConfirmDelivery(delivery.id, 'delivered')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border-b-4 border-green-800"
                    >
                      <Check size={22} />
                      已簽收 (順利送達)
                    </button>
                    <button 
                      onClick={() => handleConfirmDelivery(delivery.id, 'not_received', delivery)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg py-3.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border-b-4 border-red-800"
                    >
                      <AlertCircle size={22} fill="currentColor" className="text-white" />
                      未收到 (自動通知家人)
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="bg-surface border-2 border-dashed border-surface-container-highest rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <Truck size={48} className="text-secondary opacity-50 mb-4" />
            <p className="text-xl font-bold text-on-surface-variant">目前沒有運送中的藥物</p>
          </div>
        )}
      </section>
    </motion.div>
  );
};
