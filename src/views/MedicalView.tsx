import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, PlusCircle, Bell, Check, Truck, Sun, Pill } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const MedicalView = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: aptData } = await supabase.from('medical_appointments').select('*').order('appointment_time', { ascending: true }).limit(1);
      if (aptData) setAppointments(aptData);

      const { data: medData } = await supabase.from('medications').select('*').order('scheduled_time', { ascending: true });
      if (medData) setMedications(medData);

      const { data: delData } = await supabase.from('prescription_deliveries').select('*').order('expected_delivery', { ascending: true }).limit(1);
      if (delData) setDeliveries(delData);
    };
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-32"
    >
      <section className="space-y-4">
        <h2 className="text-3xl font-extrabold">下次看診預約</h2>
        {appointments.length > 0 ? appointments.map((apt, i) => (
          <div key={i} className="bg-surface border-2 border-surface-container-highest rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-4">
              <img alt={apt.doctor_name} className="w-20 h-20 rounded-full border-2 border-primary object-cover" src={apt.doctor_avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuD13m5TlhYa2uc5dcRm-ajdWTQ4dks3JlpDtpFpkW4veK99SBbztQ2hOYNCsVM4Wx_-fUHQSUtjwcUhiB9hm3-Zetyyw8SHSdXhVRzvQPxxizWCD1zV4mWVnCdWGcbC-5_CMZbDULZdgMzdCAHHlwMdBg7wmgdFxW3DOvBOCMqI8OzPTjO09iOHHhTpBvERtINTd1iKoq9tNohg-I46KkVkdRogl2FLEoX2Y2Vyb6PrgmNMycD77vviE_KNp2wVqRido4eGtLbYxKM"}/>
              <div>
                <p className="text-2xl font-extrabold">{apt.doctor_name}</p>
                <p className="text-secondary font-bold text-xl uppercase">{apt.specialty}</p>
              </div>
            </div>
            <div className="bg-secondary-container rounded-lg p-4 flex items-center justify-between border-2 border-secondary">
              <div className="flex items-center gap-3">
                <Calendar size={24} className="text-secondary" />
                <span className="font-bold text-xl text-on-secondary-container">
                  {new Date(apt.appointment_time).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className="bg-white px-3 py-1 rounded-full text-secondary font-bold text-sm">已預約</span>
            </div>
          </div>
        )) : (
          <div className="bg-surface border-2 border-dashed border-surface-container-highest rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <Calendar size={48} className="text-secondary opacity-50 mb-4" />
            <p className="text-xl font-bold text-on-surface-variant">目前沒有預約看診</p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold">用藥排程</h2>
          <button className="text-primary font-bold text-xl flex items-center gap-1">
            <PlusCircle size={24} /> 修改
          </button>
        </div>
        <div className="space-y-4">
          {medications.length > 0 ? medications.map((med, i) => {
            const Icon = getIcon(med.icon);
            return (
              <div key={i} className={`bg-surface border-2 rounded-xl p-6 flex items-center gap-6 ${!med.taken ? 'border-primary' : 'border-surface-container-highest shadow-sm'}`}>
                <div className={`${med.color} w-16 h-16 rounded-full flex items-center justify-center text-white`}>
                  <Icon size={32} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xl">{med.label}</p>
                  <p className="text-on-surface-variant text-xl">{med.description} • {formatTime(med.scheduled_time)}</p>
                </div>
                <button className={`w-[64px] h-[64px] border-4 rounded-full flex items-center justify-center transition-all ${!med.taken ? 'border-primary text-primary animate-pulse' : 'border-tertiary text-tertiary'}`}>
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
        {deliveries.length > 0 ? deliveries.map((delivery, i) => (
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
                <div className="bg-secondary h-full w-3/4 rounded-full"></div>
              </div>
              <div className="flex justify-between text-on-surface-variant font-bold text-lg">
                <span>已訂購</span>
                <span className="text-secondary">配送中</span>
                <span className="opacity-30">已送達</span>
              </div>
            </div>
            <p className="bg-secondary-container p-4 rounded-lg text-on-secondary-container text-xl text-center border-2 border-secondary">
              預計送達：<strong>{new Date(delivery.expected_delivery).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
            </p>
          </div>
        )) : (
          <div className="bg-surface border-2 border-dashed border-surface-container-highest rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <Truck size={48} className="text-secondary opacity-50 mb-4" />
            <p className="text-xl font-bold text-on-surface-variant">目前沒有運送中的藥物</p>
          </div>
        )}
      </section>
    </motion.div>
  );
};
