import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, PlusCircle, Bell, Check, Truck, Sun, Pill, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const MedicalView = () => {
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
                  <p className="text-on-surface-variant text-xl">{med.description} • {formatTime(med.scheduled_time)}</p>
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
          let progressWidth = 'w-1/3';
          let orderedClass = 'text-secondary font-extrabold';
          let deliveringClass = 'text-on-surface-variant opacity-30';
          let deliveredClass = 'text-on-surface-variant opacity-30';

          if (delivery.status === 'delivering') {
            progressWidth = 'w-2/3';
            orderedClass = 'text-secondary opacity-70';
            deliveringClass = 'text-secondary font-extrabold';
            deliveredClass = 'text-on-surface-variant opacity-30';
          } else if (delivery.status === 'delivered') {
            progressWidth = 'w-full';
            orderedClass = 'text-secondary opacity-70';
            deliveringClass = 'text-secondary opacity-70';
            deliveredClass = 'text-secondary font-extrabold';
          }

          return (
            <div key={i} className="bg-surface border-2 border-surface-container-highest rounded-xl p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-xl uppercase">訂單編號 {delivery.order_number}</p>
                  <p className="text-on-surface-variant text-xl">{delivery.items}</p>
                </div>
                <Truck size={40} className="text-secondary" />
              </div>
              <div className="space-y-3">
                <div className="w-full bg-surface-container-highest h-4 rounded-full overflow-hidden">
                  <div className={`bg-secondary h-full ${progressWidth} rounded-full transition-all duration-500`}></div>
                </div>
                <div className="flex justify-between text-lg">
                  <span className={orderedClass}>已訂購</span>
                  <span className={deliveringClass}>配送中</span>
                  <span className={deliveredClass}>已送達</span>
                </div>
              </div>
              <p className="bg-secondary-container p-4 rounded-lg text-on-secondary-container text-xl text-center border-2 border-secondary">
                預計送達：<strong>{new Date(delivery.expected_delivery).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
              </p>
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
