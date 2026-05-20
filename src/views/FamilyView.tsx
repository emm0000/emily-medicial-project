import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Activity, Mic, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../App';

export const FamilyView = ({ currentUser }: { currentUser: UserProfile }) => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const albumImages = [
    { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAak75MAOjSjcmQKIbaupyP-lRUXFyK2xD8_-09taspyFlD-mj3uNFkJaX-FLl51DxbX1lLvEZ-gEDh4MQ6MK25IG87JJVckHwMiuz5prvE0JeHyxiiXwJsR8R53x3rJU82mxU94zF_TCE02lWXKHs0--E-9Ndm1rRYDh6Ms-eq_yQ6_iwGytSDR3WuAj_3JmcWHVbaxckVKeONyUImznAw5P6HJHahb0rSp0ionCpO8eIp_atLvYAhjoWY4wmdAaJKW4Bs-u5k1fY", title: "夏日野餐" },
    { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLafExggL8wYGKktNqUuRyxsq-v6bDhCXW_szM1T7Q8XCaG_qOBj30Am_7GXeGgTR_AvbluLV8f3cm1jkghc1deaRkEGTsd0aO0QsOH5enHhCyscNAAy6eUc8VxtkMauwrsOFR_WGqXZXejLuWpAS38plbgwpHzbS4mzSlnTkQ8uduOLcbCYaCD1MKepxQWMUSvSPntiGNxgax3VTswsQ5FDY21kHorfDkQg5Z9x1cLOyfAC2PN8fWbxrZL532jYxivaMPzQXxRWA", title: "家庭聚餐" },
    { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDX5QAZ4EixzruUSx3W6OchKT0er3AzAGEEi4-ygqniRQTt9r9UJa4aS9pP6CHbAxf9egLXvwpHS1sZFVYBXW7QehzBLDJ3QI2QZCd4w5LKpQm_CcXNMqqwIfBLFA8P_mm8QNZhibVu-3RBtkCFHNHERWQXuhFsZ8_6-yQOlaoGJB0H7g-Kp2s29WuwCSC1awt4AQ4j-LXTu1wmn9wPjN7ySkpnBfOEtBtiEHI19UbWJDVU7mffR2cC3crV6U_JGFH5E1ITfNQ-mrY", title: "郊外散步" },
    { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiB--f5aFg-OZl6tBiZLm8DacGHalFc3hHskgXNCSJzJlzDXq8lI4EdIGgohYDGH_KlLA3VqbubpsUgawtCyluZu2_3FPSXpiEQcX_iofutFyahk07QimKWpklqengCKOZDygjcKeAw8CWfIPyY43yUqB3eY-xzzCdHjDdhChlLoTuXMvFGn3QF8_YkMMj_IyB8VsCCh3U4mIHpqketa-x5hkTliTZqqsf3KpA9DxAR_jGX9vm4gXQ8n-AN_4mWGlRUJKnt-UwlLY", title: "生日派對" }
  ];

  const dynamicPhotos = updates
    .filter(u => u.image_url && !u.is_icon)
    .map(u => ({ url: u.image_url, title: `${u.author_name} 分享的動態` }));

  const allPhotos = [...dynamicPhotos, ...albumImages];

  useEffect(() => {
    fetchUpdates();
    fetchMessages();

    // Check if we should scroll to the album memories section
    const shouldScroll = localStorage.getItem('scroll_to_album');
    if (shouldScroll === 'true') {
      localStorage.removeItem('scroll_to_album');
      setTimeout(() => {
        const element = document.getElementById('album-memories');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages((prev) => {
          const exists = prev.find(m => m.id === payload.new.id || (m.content === payload.new.content && m.sender_name === payload.new.sender_name));
          return exists ? prev : [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  const fetchUpdates = async () => {
    const { data } = await supabase.from('family_updates').select('*').order('created_at', { ascending: false });
    if (data) setUpdates(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const msgText = newMessage;
    setNewMessage('');
    
    // Optimistic UI update for instant feedback
    const tempMsg = {
      id: Math.random().toString(),
      sender_name: currentUser.name,
      sender_avatar: currentUser.avatar,
      content: msgText,
      is_me: false,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);
    
    const { error } = await supabase.from('chat_messages').insert([{
      sender_name: currentUser.name,
      sender_avatar: currentUser.avatar,
      content: msgText,
      is_me: false
    }]);

    if (error) {
      alert(`傳送失敗：${error.message} \n請確認是否已至 Supabase 解除 RLS 安全限制！`);
      // Revert optimistic UI
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } else {
      fetchMessages(); // re-fetch to get accurate DB generated data
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pb-32"
    >
      <section>
        <h2 className="text-3xl font-extrabold mb-6">最新動態</h2>
        <div className="flex gap-4 overflow-x-scroll pb-4 scrollbar-hide">
          {updates.length > 0 ? updates.map((item, i) => (
            <div key={i} className="flex-shrink-0 w-72 bg-surface-container-lowest border-2 border-surface-container-highest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {item.is_icon ? (
                <div className="w-full h-48 bg-secondary-container flex items-center justify-center">
                  <Activity size={64} className="text-on-secondary-container" />
                </div>
              ) : (
                <img 
                  src={item.image_url} 
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                  alt="" 
                  onClick={() => {
                    setSelectedImage(item.image_url);
                    setSelectedTitle(`${item.author_name} 分享的動態`);
                  }}
                />
              )}
              <div className="p-4">
                <p className="font-bold text-primary mb-1">{item.author_name}</p>
                <p className="text-xl line-clamp-2">{item.content}</p>
              </div>
            </div>
          )) : (
            <div className="flex-shrink-0 w-72 bg-surface-container-lowest border-2 border-dashed border-surface-container-highest rounded-xl flex flex-col items-center justify-center p-6 text-center shadow-sm min-h-[16rem]">
              <Activity size={48} className="text-secondary opacity-50 mb-4" />
              <p className="text-xl font-bold text-on-surface-variant">目前沒有新動態</p>
              <p className="text-lg text-secondary">請等待家人分享更新！</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-surface-container border-2 border-surface-container-highest rounded-2xl p-6">
        <h2 className="text-3xl font-extrabold mb-6">家人聊天室</h2>
        <div className="space-y-6 mb-6 max-h-[400px] overflow-y-auto pr-2 flex flex-col scroll-smooth">
          {messages.length > 0 ? messages.map((msg, i) => {
            const isMe = msg.sender_name === currentUser.name || (msg.is_me && !msg.sender_name);
            const senderAvatar = isMe ? currentUser.avatar : (msg.sender_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120');
            const displayName = isMe ? '我' : (msg.sender_name || '未知家人');
            
            return (
              <div key={i} className={`flex items-start gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                <img 
                  className="w-16 h-16 rounded-full border-2 border-primary object-cover shadow-sm" 
                  src={senderAvatar} 
                  alt="" 
                />
                <div className="flex flex-col max-w-[80%]">
                  <span className={`text-secondary font-bold text-lg mb-1 ${isMe ? 'text-right mr-2' : 'ml-2'}`}>
                    {displayName}
                  </span>
                  <div className={`p-4 rounded-2xl shadow-sm ${isMe ? 'bg-primary-container text-on-primary-container rounded-tr-none' : 'bg-surface-container-lowest rounded-tl-none border border-surface-container-highest'}`}>
                    {msg.is_audio ? (
                      <div className="flex items-center gap-3">
                        <Mic size={24} className={isMe ? "text-white" : "text-primary"} />
                        <span className={`text-2xl ${isMe ? "text-white" : ""}`}>語音訊息 {msg.audio_duration}</span>
                      </div>
                    ) : (
                      <p className="text-2xl whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  <span className={`text-sm mt-1 text-on-surface-variant font-bold ${isMe ? 'text-right mr-2' : 'ml-2'}`}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          }) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-xl text-on-surface-variant font-bold">還沒有任何聊天訊息</p>
              <p className="text-lg text-secondary">在下方輸入訊息來與家人打個招呼吧！</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex flex-col gap-4 border-t-2 border-surface-container-highest pt-6">
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="w-full text-2xl p-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest" 
            placeholder="在此輸入文字..." 
            type="text"
          />
          <button onClick={sendMessage} className="w-full bg-primary text-on-primary h-[80px] rounded-2xl flex items-center justify-center gap-4 active:scale-95 transition-transform shadow-lg">
            <Send size={40} className="text-white" />
            <span className="text-3xl font-bold text-white">傳送訊息</span>
          </button>
        </div>
      </section>

      <section id="album-memories" className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold">相簿回憶</h2>
          <button className="text-secondary font-bold text-xl underline">查看全部</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px]">
          {allPhotos.map((photo, index) => {
            const isLarge = index % 4 === 0;
            return (
              <div 
                key={index} 
                onClick={() => {
                  setSelectedImage(photo.url);
                  setSelectedTitle(photo.title);
                }}
                className={`relative overflow-hidden rounded-xl border-2 border-surface-container-highest hover:border-primary active:scale-[0.98] transition-all cursor-pointer shadow-sm group ${
                  isLarge ? 'col-span-1 row-span-2' : 'col-span-1 row-span-1'
                }`}
              >
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={photo.url} alt={photo.title} />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white font-bold text-lg">
                  {photo.title}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 燈箱放大檢視視窗 (Lightbox Modal) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-4 cursor-pointer animate-fade-in"
          onClick={() => {
            setSelectedImage(null);
            setSelectedTitle('');
          }}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute -top-16 right-0 text-white hover:text-primary transition-colors p-2 text-3xl font-bold bg-white/10 rounded-full w-12 h-12 flex items-center justify-center active:scale-90"
              onClick={() => {
                setSelectedImage(null);
                setSelectedTitle('');
              }}
            >
              ✕
            </button>
            <img 
              src={selectedImage} 
              className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl border-2 border-white/20 select-none animate-zoom-in" 
              alt={selectedTitle} 
            />
            {selectedTitle && (
              <div className="bg-black/60 px-6 py-3 rounded-full backdrop-blur-sm shadow-lg text-white text-center">
                <p className="text-2xl font-extrabold tracking-wide">{selectedTitle}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
