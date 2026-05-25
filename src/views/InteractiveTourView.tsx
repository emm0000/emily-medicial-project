import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, X, 
  ArrowLeft, ArrowRight, Sparkles, Hand, Heart, AlertCircle, Pill, MessageSquare, Calendar, Users
} from 'lucide-react';

interface StoryboardStep {
  title: string;
  subtitle: string;
  narration: string;
  duration: number; // milliseconds
  icon: any;
  color: string;
}

const TOUR_STEPS: StoryboardStep[] = [
  {
    title: '歡迎來到 SeniorCare',
    subtitle: '為愛設計的長者全方位智慧關懷平台',
    narration: '歡迎來到 SeniorCare 長者關懷系統。這是一個專門為家庭、長輩以及專業照護人員所量身打造的智慧溫馨平台，旨在讓全家人隨時隨地攜手守護長者的安全與健康。',
    duration: 8000,
    icon: Sparkles,
    color: 'from-blue-600 to-indigo-600'
  },
  {
    title: '一鍵 SOS 緊急警報',
    subtitle: '秒級推播通知，拉起全家人的安全防護網',
    narration: '安全至上。遇到緊急狀況時，長者只需按下一鍵 SOS 紅色按鈕。系統會立即對所有家人與專業照護人員發出高分貝紅色警訊通知，並響起同步警報，讓救援不延遲。',
    duration: 9000,
    icon: AlertCircle,
    color: 'from-red-600 to-rose-600'
  },
  {
    title: '每日用藥與健康記錄',
    subtitle: '貼心提醒，隨時匯出健康趨勢報告',
    narration: '健康第一。系統清晰列出每日用藥時程。長者確認服用後，家屬端將同步收到打勾通知。平台亦支援記錄血壓與步數指標，並可一鍵匯出完整健康報告檔案。',
    duration: 9000,
    icon: Pill,
    color: 'from-emerald-600 to-teal-600'
  },
  {
    title: '家庭聊天室與共享相簿',
    subtitle: '多角色群聊與即時動態照片上傳',
    narration: '愛不缺席。內建專屬私密家庭聊天室，支援即時文字互動。您還能共享溫馨相簿，將出遊照片即時傳遞給長輩，讓愛與關懷無時差傳遞。',
    duration: 8000,
    icon: MessageSquare,
    color: 'from-purple-600 to-indigo-600'
  },
  {
    title: '專業照護日誌與就醫日程',
    subtitle: '資訊透明，專業與家庭的無縫接軌',
    narration: '照護無縫接軌。完整的醫療就醫日程與專業照護人員日誌登載，讓出門在外的家屬，也能對長者在日照中心或家中的專業護理狀況瞭若指掌，加倍安心。',
    duration: 8000,
    icon: Calendar,
    color: 'from-amber-600 to-orange-600'
  },
  {
    title: '多角色一鍵智慧切換',
    subtitle: '長者、家屬與護理師的最佳視角優化',
    narration: '我們貼心支援孫子、奶奶與照護師等多種角色介面。切換為奶奶角色時，介面會一秒變為大字體、高對比的無障礙貼心版面。現在，邀請您立即體驗 SeniorCare 的溫暖細節！',
    duration: 8500,
    icon: Users,
    color: 'from-pink-600 to-rose-600'
  }
];

export function InteractiveTourView({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Custom synthetic text variables for rendering replicas inside the mockup
  const [simulatedMedsTaken, setSimulatedMedsTaken] = useState(false);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [showSOSAlert, setShowSOSAlert] = useState(false);
  const [activeRole, setActiveRole] = useState<'grandson' | 'grandma' | 'nurse'>('grandson');
  
  const stepStartTime = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize browser speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopSpeech();
    };
  }, []);

  // Audio synthesizer helper for UI sound effects
  const playSynthSound = (type: 'click' | 'siren' | 'success' | 'swoosh') => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'swoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'siren') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn('Audio Context failed', e);
    }
  };

  const speakNarration = (text: string) => {
    stopSpeech();
    if (isMuted || !synthRef.current) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.05; // Slightly faster for natural flow
      utterance.pitch = 1.1; // Friendly tone
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn('TTS Speech Synthesis failed:', e);
    }
  };

  const stopSpeech = () => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (e) {}
    }
  };

  // Main stepper playback control loop
  useEffect(() => {
    stopSpeech();
    if (isInteractiveMode) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (isPlaying) {
      speakNarration(TOUR_STEPS[currentStep].narration);
      stepStartTime.current = Date.now() - (progress / 100) * TOUR_STEPS[currentStep].duration;
      
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - stepStartTime.current;
        const total = TOUR_STEPS[currentStep].duration;
        const newProgress = Math.min((elapsed / total) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          clearInterval(timerRef.current);
          if (currentStep < TOUR_STEPS.length - 1) {
            playSynthSound('swoosh');
            setCurrentStep(prev => prev + 1);
            setProgress(0);
          } else {
            setIsPlaying(false);
          }
        }
      }, 30);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentStep, isInteractiveMode]);

  // Handle Mute triggers
  useEffect(() => {
    if (isMuted) {
      stopSpeech();
    } else if (isPlaying && !isInteractiveMode) {
      const currentNarration = TOUR_STEPS[currentStep].narration;
      // Restart speech from beginning of sentence
      speakNarration(currentNarration);
    }
  }, [isMuted]);

  // Reset simulated sub-states on step change to show animations fresh
  useEffect(() => {
    setSimulatedMedsTaken(false);
    setShowSOSAlert(false);
    
    if (currentStep === 1) {
      // Step 1: SOS
      const t = setTimeout(() => {
        playSynthSound('siren');
        setShowSOSAlert(true);
      }, 3000);
      return () => clearTimeout(t);
    } else if (currentStep === 2) {
      // Step 2: Medication Check
      const t = setTimeout(() => {
        playSynthSound('success');
        setSimulatedMedsTaken(true);
      }, 4000);
      return () => clearTimeout(t);
    } else if (currentStep === 3) {
      // Step 3: Family Chat messages incoming sequentially
      setChatMessages([]);
      const msgs = [
        '陳小明：奶奶，今天血壓量了嗎？❤️',
        '王春花 (奶奶)：量過囉！收縮壓 125，小明不用擔心 👵',
        '陳小明：太好了！我把今天全家出遊的照片上傳到相簿囉！',
        '林美玲 (護理師)：奶奶今天在中心精神很好，下午還做了手工香包喔！🌸'
      ];
      
      const timers = msgs.map((msg, i) => {
        return setTimeout(() => {
          playSynthSound('click');
          setChatMessages(prev => [...prev, msg]);
        }, 1500 + i * 1800);
      });
      
      return () => timers.forEach(clearTimeout);
    } else if (currentStep === 5) {
      // Step 5: Role swap simulation
      setActiveRole('grandson');
      const t1 = setTimeout(() => {
        playSynthSound('click');
        setActiveRole('grandma');
      }, 3000);
      const t2 = setTimeout(() => {
        playSynthSound('click');
        setActiveRole('nurse');
      }, 6000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [currentStep]);

  const handlePlayPause = () => {
    playSynthSound('click');
    setIsPlaying(prev => !prev);
  };

  const handleNext = () => {
    playSynthSound('swoosh');
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setProgress(0);
    }
  };

  const handlePrev = () => {
    playSynthSound('swoosh');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleRestart = () => {
    playSynthSound('success');
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
    setIsInteractiveMode(false);
  };

  const toggleInteractive = () => {
    playSynthSound('success');
    setIsInteractiveMode(prev => {
      const next = !prev;
      if (next) {
        stopSpeech();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
      return next;
    });
  };

  const ActiveIcon = TOUR_STEPS[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[99999] flex flex-col items-center justify-between p-4 md:p-8 text-slate-100 font-sans overflow-y-auto min-h-screen">
      
      {/* Dynamic Animated Glowing blobs for background premium aesthetics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[90px] animate-pulse delay-1000"></div>
      </div>

      {/* Header Bar */}
      <div className="w-full max-w-6xl flex justify-between items-center z-10 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Heart className="text-white fill-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              SeniorCare 互動式影音介紹
            </h1>
            <p className="text-xs text-slate-400 font-bold hidden sm:inline">
              ⚡️ 原生互動技術・智慧長者守護導覽
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute toggle button */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-full hover:bg-slate-800 transition-all active:scale-90 text-slate-300 border border-slate-800 ${isMuted ? 'bg-slate-900 text-rose-400 border-rose-900/30' : ''}`}
            title={isMuted ? "開啟旁白音效" : "靜音旁白音效"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* Skip / Close Tour Button */}
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/80 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-900/50 font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <X size={16} />
            <span>結束導覽</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Screen Showcase on Left, Storyboard Captions on Right */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 my-auto z-10 py-6">
        
        {/* Left Side: Dynamic Device Mockup Box */}
        <div className="relative flex flex-col items-center flex-shrink-0">
          
          {/* Device Mockup Shell Container */}
          <div className="relative w-[310px] h-[610px] bg-slate-900 rounded-[50px] border-4 border-slate-700 p-2.5 shadow-2xl flex flex-col select-none overflow-hidden transition-all duration-500 ring-4 ring-indigo-500/10">
            
            {/* Camera notch / Speaker grill */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
              <div className="w-2.5 h-2.5 bg-slate-800 rounded-full ml-2 mb-1"></div>
            </div>

            {/* Inner Phone Screen */}
            <div className="w-full h-full rounded-[38px] bg-slate-950 overflow-hidden relative border border-slate-800 flex flex-col justify-between">
              
              {/* Screen Mockup Header */}
              <div className="bg-slate-900 px-4 pt-6 pb-2 text-slate-300 border-b border-slate-800/50 flex justify-between items-center text-xs font-bold font-mono">
                <span>09:41 AM</span>
                <span className="flex items-center gap-1 text-[10px]">
                  <span>5G</span>
                  <div className="w-4.5 h-2 border.5 border-slate-400 rounded-sm bg-slate-300"></div>
                </span>
              </div>

              {/* SCREEN CONTENT AREA (Changes per step) */}
              <div className="flex-1 overflow-hidden relative flex flex-col text-slate-900 font-sans">
                
                {/* Step 0: Welcome Frame */}
                {currentStep === 0 && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200 animate-bounce mb-4">
                      <Heart size={44} fill="currentColor" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">SeniorCare</h3>
                    <p className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-extrabold mt-1">智慧長者關懷</p>
                    <div className="w-full bg-slate-100 rounded-2xl p-4 mt-6 border text-left space-y-2 text-xs">
                      <div className="h-3 bg-slate-200 rounded-full w-2/3 animate-pulse"></div>
                      <div className="h-3 bg-slate-200 rounded-full w-5/6 animate-pulse"></div>
                      <div className="h-3 bg-slate-200 rounded-full w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                )}

                {/* Step 1: SOS Alarm Trigger */}
                {currentStep === 1 && (
                  <div className={`absolute inset-0 bg-slate-50 flex flex-col p-4 justify-between transition-colors duration-500 ${showSOSAlert ? 'bg-red-50' : ''}`}>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-extrabold text-indigo-900">王春花 (奶奶)</span>
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">連線中</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                      <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 shadow-xl cursor-pointer transition-all duration-300 ${
                        showSOSAlert 
                          ? 'bg-red-600 border-red-200 scale-105 text-white animate-pulse' 
                          : 'bg-red-500 border-red-300 text-white'
                      }`}>
                        <AlertCircle size={56} className={showSOSAlert ? 'animate-bounce' : ''} />
                      </div>
                      <p className="text-sm font-extrabold text-slate-700">
                        {showSOSAlert ? '🚨 警報已傳送！家人通訊錄呼叫中...' : '長輩專用「緊急求助 SOS」鈕'}
                      </p>
                    </div>

                    {showSOSAlert && (
                      <div className="bg-red-600 text-white rounded-2xl p-3 text-xs font-bold space-y-1 shadow-lg animate-zoom-in">
                        <p className="font-black text-center text-sm border-b border-red-500 pb-1 mb-1">🚨 紅色警報</p>
                        <p>奶奶於 09:41 觸發一鍵求助！</p>
                        <p className="text-[10px] text-red-200">所有家人手機已發出警報器鳴笛...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Medications & Health Metrics */}
                {currentStep === 2 && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col p-4 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800 text-sm">今日健康概要</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">已同步</span>
                    </div>

                    {/* Med Card */}
                    <div className="bg-white border rounded-2xl p-3.5 shadow-sm space-y-2 relative overflow-hidden">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${simulatedMedsTaken ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          <Pill size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500">下次服藥時間</p>
                          <p className="text-sm font-black text-slate-800">12:30 PM (飯後藥)</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t text-xs">
                        <span className="text-slate-600">降血壓、葉黃素等</span>
                        <button className={`px-4 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-all ${
                          simulatedMedsTaken 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-teal-600 text-white'
                        }`}>
                          {simulatedMedsTaken ? '✓ 已確認服用' : '確認服用'}
                        </button>
                      </div>

                      {simulatedMedsTaken && (
                        <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white p-2 animate-fade-in">
                          <p className="text-xl">🎉</p>
                          <p className="font-extrabold text-sm">今日用藥已全部完成！</p>
                          <p className="text-[10px] text-emerald-100">已自動向全家發送確認通知</p>
                        </div>
                      )}
                    </div>

                    {/* Stats Widget */}
                    <div className="bg-white border rounded-2xl p-3.5 shadow-sm space-y-3">
                      <p className="text-xs font-bold text-slate-500">本日健康指標數據</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 p-2 rounded-xl border text-center">
                          <p className="text-[10px] text-slate-400 font-bold">步數計數</p>
                          <p className="text-lg font-black text-teal-700">6,520</p>
                          <p className="text-[9px] text-slate-500">目標 8,000 步</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border text-center">
                          <p className="text-[10px] text-slate-400 font-bold">心率/血壓</p>
                          <p className="text-lg font-black text-rose-600">72 / 125</p>
                          <p className="text-[9px] text-slate-500">收縮壓優良</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Family Room Chat & Album */}
                {currentStep === 3 && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col p-3 justify-between animate-fade-in">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2 text-center text-xs font-bold text-indigo-800">
                      👨‍👩‍👧‍👦 家庭聊天室 (與奶奶春花)
                    </div>

                    {/* Chat Bubble scroll replica container */}
                    <div className="flex-1 overflow-y-auto space-y-2 py-3 px-1 flex flex-col justify-end">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-8 text-slate-300 text-xs font-bold">
                          ⏳ 等待聊天對話滑入...
                        </div>
                      ) : (
                        chatMessages.map((msg, i) => {
                          const isGrandma = msg.includes('王春花');
                          const isNurse = msg.includes('林美玲');
                          return (
                            <div 
                              key={i} 
                              className={`p-2.5 rounded-2xl text-xs max-w-[85%] shadow-sm animate-zoom-in ${
                                isGrandma 
                                  ? 'bg-amber-100 text-slate-800 self-start border-l-4 border-amber-500 rounded-tl-none' 
                                  : isNurse
                                    ? 'bg-rose-100 text-slate-800 self-start border-l-4 border-rose-500 rounded-tl-none'
                                    : 'bg-indigo-600 text-white self-end rounded-tr-none'
                              }`}
                            >
                              <p className="font-extrabold text-[10px] opacity-80 mb-0.5">
                                {isGrandma ? '王春花 (奶奶)' : isNurse ? '林美玲 (護理師)' : '陳小明 (孫子)'}
                              </p>
                              <p>{msg.split('：')[1] || msg}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Album Thumbnail preview */}
                    <div className="bg-white border rounded-xl p-2 flex items-center gap-2">
                      <img 
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=60&h=60" 
                        alt="Grandma" 
                        className="w-10 h-10 rounded-lg object-cover shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-800 truncate">🖼️ 相簿：奶奶的插花課照片</p>
                        <p className="text-[8px] text-slate-500">陳小明 上傳於 3分鐘前</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Medical Schedule & Day Care Logs */}
                {currentStep === 4 && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col p-3 space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center pb-1 border-b">
                      <span className="font-extrabold text-slate-800 text-sm">醫療日程與照護誌</span>
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[9px] font-bold">5月24日</span>
                    </div>

                    {/* Event calendar mock widget */}
                    <div className="bg-white border rounded-xl p-2.5 shadow-sm space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400">📅 就醫提醒事項</p>
                      <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-2 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-extrabold text-amber-900">5月26日 門診回診</p>
                          <p className="text-[10px] text-amber-700">台大醫院 骨科門診</p>
                        </div>
                        <span className="bg-amber-600 text-white px-2 py-1 rounded-md text-[9px] font-bold">林護師隨行</span>
                      </div>
                    </div>

                    {/* Caretaker Day Log Mock Widget */}
                    <div className="bg-white border rounded-xl p-2.5 shadow-sm space-y-2 flex-1 flex flex-col">
                      <p className="text-[10px] font-black text-slate-400">📝 日照中心照護日誌</p>
                      <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700 space-y-1 border flex-1">
                        <div className="flex items-center gap-1.5 border-b pb-1 mb-1">
                          <img 
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=40&h=40" 
                            alt="Nurse" 
                            className="w-5 h-5 rounded-full object-cover border" 
                          />
                          <div>
                            <p className="font-extrabold text-slate-900 text-[10px]">護理師 林美玲</p>
                            <p className="text-[8px] text-slate-500">更新於 今日 16:30</p>
                          </div>
                        </div>
                        <p className="font-extrabold leading-snug">
                          「王奶奶今天下午完成了手作香草香包，參與度非常高。血壓測量穩定，午餐順利吃完，精神狀況優良。」
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Multi-Role Switcher Dynamic Mock */}
                {currentStep === 5 && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col animate-fade-in">
                    
                    {/* User profile details layout change simulation based on active role */}
                    <div className={`p-4 border-b text-white transition-all duration-500 ${
                      activeRole === 'grandson' 
                        ? 'bg-gradient-to-r from-blue-700 to-indigo-600' 
                        : activeRole === 'grandma'
                          ? 'bg-gradient-to-r from-amber-600 to-rose-600 font-extrabold'
                          : 'bg-gradient-to-r from-teal-700 to-emerald-600'
                    }`}>
                      <div className="flex items-center gap-3">
                        <img 
                          src={
                            activeRole === 'grandson' 
                              ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=80&h=80' 
                              : activeRole === 'grandma'
                                ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80&h=80'
                                : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=80&h=80'
                          } 
                          alt="Avatar" 
                          className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-sm">
                            {activeRole === 'grandson' ? '陳小明' : activeRole === 'grandma' ? '王春花 (奶奶)' : '林美玲 (護師)'}
                          </p>
                          <p className="text-[10px] opacity-90">
                            {activeRole === 'grandson' ? '主要聯絡人 / 孫子' : activeRole === 'grandma' ? '長者大字體無障礙版面' : '專業日照中心護師'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-4 space-y-4 bg-slate-100">
                      
                      {/* Big elder button visualization if Grandma */}
                      {activeRole === 'grandma' ? (
                        <div className="space-y-3 animate-zoom-in">
                          <div className="bg-white p-4 rounded-2xl shadow border-2 border-rose-200 text-center">
                            <p className="text-xl font-black text-red-600 animate-pulse">🚨 按我叫救護車 (SOS)</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl shadow border text-center">
                            <p className="text-xl font-black text-teal-700">💊 我吃飽藥了</p>
                          </div>
                          <p className="text-center text-xs font-black text-slate-500">大按鈕・高對比・超好按</p>
                        </div>
                      ) : activeRole === 'nurse' ? (
                        <div className="space-y-2 animate-zoom-in text-xs">
                          <div className="bg-white p-3 rounded-xl border shadow-sm">
                            <p className="font-extrabold text-slate-800">✍ 新增今日照護記錄</p>
                            <p className="text-[10px] text-slate-500 mt-1">體溫：36.5℃ | 血壓：125/80</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border shadow-sm">
                            <p className="font-extrabold text-slate-800">📋 指派奶奶服藥提醒</p>
                          </div>
                          <p className="text-center text-[10px] text-slate-500 font-bold">專為照護機構與巡房護師設計</p>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-zoom-in text-xs">
                          <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center justify-between">
                            <span>奶奶今日步數</span>
                            <span className="font-extrabold text-blue-700">6,520 步</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center justify-between">
                            <span>奶奶健康狀態</span>
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold text-[9px]">十分優良</span>
                          </div>
                          <p className="text-center text-[10px] text-slate-500 font-bold">家屬隨時關心遠端長輩近況</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Screen Mockup Tab Navigation */}
              <div className="bg-slate-900 border-t border-slate-800/80 px-4 py-3 text-slate-400 text-center flex justify-around items-center text-[11px] font-bold font-sans">
                <span className={currentStep === 0 || currentStep === 2 ? 'text-indigo-400 font-black' : ''}>🏠 首頁</span>
                <span className={currentStep === 3 ? 'text-indigo-400 font-black' : ''}>💬 聊天</span>
                <span className={currentStep === 4 ? 'text-indigo-400 font-black' : ''}>📅 日程</span>
              </div>
            </div>

            {/* Virtual Simulated Interactive Pointer Overlay (Only visible in auto-play video mode) */}
            {!isInteractiveMode && isPlaying && (
              <motion.div 
                className="absolute w-8 h-8 pointer-events-none z-50 rounded-full border border-white/60 bg-red-500/50 shadow-lg flex items-center justify-center text-white"
                initial={{ x: 150, y: 300 }}
                animate={
                  currentStep === 1 
                    ? { x: [150, 150, 150], y: [450, 280, 280], scale: [1, 1, 0.8, 1.2, 1] } 
                    : currentStep === 2
                      ? { x: [260, 260], y: [180, 180], scale: [1, 0.8, 1.2, 1] }
                      : { x: [100, 200, 150], y: [200, 400, 300], scale: [1, 1, 1] }
                }
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
              >
                <Hand size={14} className="fill-white rotate-[270deg]" />
              </motion.div>
            )}

            {/* Virtual Glass Reflection Shine Effect */}
            <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 rounded-[50px] skew-x-[-15deg] origin-top"></div>
          </div>

          {/* Device Mockup Status badge */}
          <div className="mt-4 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isInteractiveMode ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
            <span className="text-xs font-bold text-slate-400">
              {isInteractiveMode ? '🎮 互動模式已開啟：您可直接點擊內側畫面！' : '🎬 模擬播放中：虛擬游標演示自動操作'}
            </span>
          </div>

          {/* Manual / Interactive Toggle button */}
          <button
            onClick={toggleInteractive}
            className={`mt-3 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-md border cursor-pointer ${
              isInteractiveMode 
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
            }`}
          >
            <span>{isInteractiveMode ? '🎬 切換為影片自動介紹' : '🎮 暫停並親自手動體驗'}</span>
          </button>
        </div>

        {/* Right Side: Step Titles, Captons, Voice tracks, Navigation */}
        <div className="flex-1 w-full flex flex-col justify-between space-y-6">
          
          {/* Progress Tracker Steps (0/1/2/3/4/5) */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={idx}
                onClick={() => {
                  playSynthSound('click');
                  setCurrentStep(idx);
                  setProgress(0);
                  setIsInteractiveMode(false);
                }}
                className={`flex-1 h-2.5 rounded-full transition-all relative overflow-hidden ${
                  idx === currentStep 
                    ? 'bg-indigo-500' 
                    : idx < currentStep 
                      ? 'bg-indigo-950/80 border border-indigo-900/40' 
                      : 'bg-slate-800'
                }`}
                title={step.title}
              >
                {idx === currentStep && !isInteractiveMode && (
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-white"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Active Step Details Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/80 border border-slate-800 backdrop-blur-md p-6 md:p-8 rounded-3xl space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${TOUR_STEPS[currentStep].color} text-white shadow-lg`}>
                  <ActiveIcon size={24} />
                </div>
                <div>
                  <span className="text-xs font-black text-indigo-400 tracking-widest uppercase">
                    第 {currentStep + 1} 幕 / 共 {TOUR_STEPS.length} 幕
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {TOUR_STEPS[currentStep].title}
                  </h2>
                </div>
              </div>

              <p className="text-base font-bold text-slate-300">
                {TOUR_STEPS[currentStep].subtitle}
              </p>

              <div className="bg-slate-950/80 border border-slate-800/80 p-4 md:p-6 rounded-2xl relative overflow-hidden">
                <span className="absolute top-3 left-3 text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">
                  🎙️ 旁白語音字幕軌 (Narration)
                </span>
                
                {/* Audio Wave anim if playing speech */}
                {isPlaying && !isMuted && !isInteractiveMode && (
                  <div className="absolute top-3.5 right-4 flex items-end gap-0.5 h-3">
                    <div className="w-0.5 h-1.5 bg-indigo-500 rounded-full animate-[pulse_0.4s_infinite_alternate]"></div>
                    <div className="w-0.5 h-3 bg-indigo-500 rounded-full animate-[pulse_0.3s_infinite_alternate_0.1s]"></div>
                    <div className="w-0.5 h-2 bg-indigo-500 rounded-full animate-[pulse_0.5s_infinite_alternate_0.2s]"></div>
                  </div>
                )}

                <p className="text-base md:text-lg text-slate-100 font-bold leading-relaxed pt-2">
                  {TOUR_STEPS[currentStep].narration}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Player Controller Bar */}
          <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4">
            
            {/* Playback action items */}
            <div className="flex items-center gap-2">
              <button
                disabled={isInteractiveMode}
                onClick={handlePrev}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all active:scale-95 disabled:opacity-30 disabled:scale-100 border border-slate-700 cursor-pointer"
                title="上一幕"
              >
                <ArrowLeft size={18} />
              </button>

              <button
                disabled={isInteractiveMode}
                onClick={handlePlayPause}
                className={`p-4 rounded-2xl transition-all active:scale-95 shadow-md flex items-center justify-center border cursor-pointer ${
                  isPlaying 
                    ? 'bg-amber-600/90 text-white border-amber-500 hover:bg-amber-700' 
                    : 'bg-emerald-600/90 text-white border-emerald-500 hover:bg-emerald-700'
                }`}
                title={isPlaying ? "暫停" : "播放"}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>

              <button
                disabled={isInteractiveMode}
                onClick={handleNext}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all active:scale-95 disabled:opacity-30 disabled:scale-100 border border-slate-700 cursor-pointer"
                title="下一幕"
              >
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Subtitle Sync slider / scrubber */}
            <div className="flex-1 min-w-[200px] flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold font-mono">0:0{currentStep}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-indigo-400"
                  style={{ width: `${isInteractiveMode ? 100 : progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-bold font-mono">0:0{TOUR_STEPS.length}</span>
            </div>

            {/* Restart buttons */}
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all active:scale-95 font-bold text-xs border border-slate-700 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>重新播放</span>
            </button>

          </div>

        </div>

      </div>

      {/* Footer tips */}
      <p className="text-xs text-slate-500 font-bold text-center z-10 select-none">
        💡 提示：本影音導覽整合 Web Speech Synthesis API 語音技術與網頁自動控制核心。建議開啟麥克風與系統音量以獲取極佳沉浸感。
      </p>

    </div>
  );
}
