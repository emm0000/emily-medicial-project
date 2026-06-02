import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, X, 
  ArrowLeft, ArrowRight, Sparkles, Hand, Heart, AlertCircle, Pill, MessageSquare, Calendar, Users, CheckCircle2, ShieldAlert
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
    duration: 9000,
    icon: Sparkles,
    color: 'from-blue-600 to-indigo-600'
  },
  {
    title: '一鍵 SOS 緊急警報',
    subtitle: '秒級推播通知，拉起全家人的安全防護網',
    narration: '安全至上。遇到緊急狀況時，長者只需按下一鍵 SOS 紅色按鈕。系統會立即對所有家人與專業照護人員發出高分貝紅色警訊通知，並響起同步警報，讓救援不延遲。',
    duration: 9500,
    icon: AlertCircle,
    color: 'from-red-600 to-rose-600'
  },
  {
    title: '每日用藥與健康記錄',
    subtitle: '貼心提醒，隨時匯出健康趨勢報告',
    narration: '健康第一。系統清晰列出每日用藥時程。長者確認服用後，家屬端將同步收到打勾通知。平台亦支援記錄血壓與步數指標，並可一鍵匯出完整健康報告檔案。',
    duration: 9500,
    icon: Pill,
    color: 'from-emerald-600 to-teal-600'
  },
  {
    title: '家庭聊天室與共享相簿',
    subtitle: '多角色群聊與即時動態照片上傳',
    narration: '愛不缺席。內建專屬私密家庭聊天室，支援即時文字互動。您還能共享溫馨相簿，將出遊照片即時傳遞給長輩，讓愛與關懷無時差傳遞。',
    duration: 9000,
    icon: MessageSquare,
    color: 'from-purple-600 to-indigo-600'
  },
  {
    title: '專業照護日誌與就醫日程',
    subtitle: '資訊透明，專業與家庭的無縫接軌',
    narration: '照護無縫接軌。完整的醫療就醫日程與專業照護人員日誌登載，讓出門在外的家屬，也能對長者在日照中心或家中的專業護理狀況瞭若指掌，加倍安心。',
    duration: 9000,
    icon: Calendar,
    color: 'from-amber-600 to-orange-600'
  },
  {
    title: '多角色一鍵智慧切換',
    subtitle: '長者、家屬與護理師的最佳視角優化',
    narration: '我們貼心支援孫子、奶奶與照護師等多種角色介面。切換為奶奶角色時，介面會一秒變為大字體、高對比的無障礙貼心版面。現在，邀請您立即體驗 SeniorCare 的溫暖細節！',
    duration: 9500,
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
  
  // Custom synthetic states for live interactive mockup animations
  const [simulatedMedsTaken, setSimulatedMedsTaken] = useState(false);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [showSOSAlert, setShowSOSAlert] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const [activeRole, setActiveRole] = useState<'grandson' | 'grandma' | 'nurse'>('grandson');
  const [isTyping, setIsTyping] = useState(false);
  const [narrationFinished, setNarrationFinished] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopSpeech();
    };
  }, []);

  // Professional audio context synthesizer
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
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'swoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'success') {
        // Sparkling C-major chord
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.06); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.18); // C6
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'siren') {
        // Pulsating alarm sirens
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.25);
        osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn('Audio Context failed', e);
    }
  };

  const getSentences = (text: string) => {
    const chars = ['。', '！', '；', '？', '，', ',', '!'];
    const sentences: string[] = [];
    let current = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      current += char;
      if (chars.includes(char)) {
        sentences.push(current.trim());
        current = '';
      }
    }
    if (current.trim().length > 0) {
      sentences.push(current.trim());
    }
    return sentences.filter(s => s.length > 0);
  };

  const speakNarration = (text: string) => {
    stopSpeech();
    setNarrationFinished(false);
    if (isMuted || !synthRef.current) {
      setNarrationFinished(true);
      return () => {};
    }
    
    let isCancelled = false;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.02;
      utterance.pitch = 1.08;
      
      // Prevent GC bug: bind to window
      if (typeof window !== 'undefined') {
        (window as any)._activeUtterances = (window as any)._activeUtterances || [];
        (window as any)._activeUtterances.push(utterance);
      }
      
      const cleanUtterance = () => {
        if (typeof window !== 'undefined' && (window as any)._activeUtterances) {
          (window as any)._activeUtterances = (window as any)._activeUtterances.filter((u: any) => u !== utterance);
        }
      };

      utterance.onend = () => {
        if (isCancelled) return;
        cleanUtterance();
        
        const sentences = getSentences(TOUR_STEPS[currentStep].narration);
        if (currentSentenceIndex < sentences.length - 1) {
          setCurrentSentenceIndex(prev => prev + 1);
        } else {
          setNarrationFinished(true);
        }
      };
      
      utterance.onerror = (err) => {
        console.warn('Speech error event:', err);
        if (isCancelled) return;
        cleanUtterance();
        stopSpeech();
        setIsPlaying(false); // Stop autoplay, stay on current page
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);

    } catch (e) {
      console.warn('TTS Synthesis blocked or failed to start:', e);
      setNarrationFinished(true);
    }

    return () => {
      isCancelled = true;
      stopSpeech();
    };
  };

  const stopSpeech = () => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (e) {}
    }
  };

  // Reset indices on step changes
  useEffect(() => {
    setCurrentSentenceIndex(0);
    setNarrationFinished(false);
    setProgress(0);
  }, [currentStep]);

  // Trigger speech synthesis or simulation of sentences
  useEffect(() => {
    if (isInteractiveMode || !isPlaying) {
      stopSpeech();
      return;
    }

    const sentences = getSentences(TOUR_STEPS[currentStep].narration);
    const text = sentences[currentSentenceIndex];

    if (!text) {
      setNarrationFinished(true);
      return;
    }

    setNarrationFinished(false);

    if (isMuted || !synthRef.current) {
      // Simulate reading time when muted (average 220ms per character, minimum 2 seconds)
      const simulatedDuration = Math.max(2000, text.length * 220);
      const timer = setTimeout(() => {
        if (currentSentenceIndex < sentences.length - 1) {
          setCurrentSentenceIndex(prev => prev + 1);
        } else {
          setNarrationFinished(true);
        }
      }, simulatedDuration);
      return () => clearTimeout(timer);
    }

    // Speaking mode
    const cancelSpeech = speakNarration(text);
    return () => {
      if (cancelSpeech) cancelSpeech();
    };
  }, [isPlaying, currentStep, currentSentenceIndex, isInteractiveMode, isMuted]);

  // Smooth progress bar animator
  useEffect(() => {
    if (isInteractiveMode || !isPlaying) return;

    const sentences = getSentences(TOUR_STEPS[currentStep].narration);
    const baseProgress = (currentSentenceIndex / sentences.length) * 100;
    const targetProgress = ((currentSentenceIndex + 1) / sentences.length) * 100;

    const stepInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < targetProgress) {
          const delta = (targetProgress - baseProgress) / 50; // increment over ~3 seconds per sentence
          return Math.min(prev + delta, targetProgress);
        }
        return prev;
      });
    }, 60);

    return () => clearInterval(stepInterval);
  }, [currentStep, currentSentenceIndex, isPlaying, isInteractiveMode]);

  // Slide transition controller
  useEffect(() => {
    if (isInteractiveMode || !isPlaying) return;

    const isSpeechSpeaking = typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking;
    const isStepDone = progress >= 99.9 && narrationFinished && !isSpeechSpeaking;
    
    if (isStepDone) {
      const transitionTimer = setTimeout(() => {
        if (currentStep < TOUR_STEPS.length - 1) {
          playSynthSound('swoosh');
          setCurrentStep(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setProgress(100);
        }
      }, 1000); // 1 second natural pause after step finishes
      
      return () => clearTimeout(transitionTimer);
    }
  }, [progress, narrationFinished, currentStep, isPlaying, isInteractiveMode]);

  // Handle Mute changes
  useEffect(() => {
    if (isMuted) {
      stopSpeech();
      setNarrationFinished(true);
    }
  }, [isMuted]);

  // Dynamic animations simulation inside the mockup screen synchronized with sentence progression
  useEffect(() => {
    setSimulatedMedsTaken(false);
    setShowSOSAlert(false);
    setSosProgress(0);
    setIsTyping(false);
    setChatMessages([]);

    if (currentStep === 1) {
      if (currentSentenceIndex === 0) {
        setSosProgress(40);
      } else if (currentSentenceIndex >= 1) {
        setSosProgress(100);
        setShowSOSAlert(true);
        playSynthSound('siren');
      }
    } else if (currentStep === 2) {
      if (currentSentenceIndex >= 1) {
        setSimulatedMedsTaken(true);
        playSynthSound('success');
      }
    } else if (currentStep === 3) {
      const msgs = [
        '陳小明：奶奶，今天血壓量了嗎？❤️',
        '王春花 (奶奶)：量過囉！收縮壓 125，小明不用擔心 👵',
        '林美玲 (護理師)：奶奶下午的手工香包課做得超棒喔！🌸'
      ];
      // Show messages up to currentSentenceIndex
      const visibleMsgs = msgs.slice(0, currentSentenceIndex + 1);
      setChatMessages(visibleMsgs);
      if (currentSentenceIndex < msgs.length - 1) {
        setIsTyping(true);
      }
    } else if (currentStep === 5) {
      if (currentSentenceIndex === 0) {
        setActiveRole('grandson');
      } else if (currentSentenceIndex === 1) {
        setActiveRole('grandma');
        playSynthSound('click');
      } else if (currentSentenceIndex >= 2) {
        setActiveRole('nurse');
        playSynthSound('click');
      }
    }
  }, [currentStep, currentSentenceIndex]);

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
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[99999] flex flex-col items-center justify-between p-4 md:p-8 text-slate-100 font-sans overflow-y-auto min-h-screen">
      
      {/* Decorative High-End Ambient Blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[15%] right-[15%] w-[450px] h-[450px] bg-rose-500/10 rounded-full blur-[140px] animate-pulse delay-700"></div>
        <div className="absolute top-[45%] right-[25%] w-[350px] h-[350px] bg-teal-500/8 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      {/* Premium Header */}
      <div className="w-full max-w-6xl flex justify-between items-center z-10 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Heart className="text-white fill-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              SeniorCare 互動式影音介紹
            </h1>
            <p className="text-xs text-indigo-400 font-bold hidden sm:inline-block tracking-wider">
              ⚡️ HIGH-FIDELITY INTERACTIVE PRESENTATION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mute button */}
          <button 
            onClick={() => { playSynthSound('click'); setIsMuted(!isMuted); }}
            className={`p-3 rounded-full hover:bg-slate-800 transition-all active:scale-90 text-slate-300 border border-slate-800 bg-slate-900/50 ${isMuted ? 'bg-rose-950/40 text-rose-400 border-rose-900/30' : ''}`}
            title={isMuted ? "開啟語音旁白" : "靜音旁白"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* Close/Skip button */}
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-900/90 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-900/40 font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <X size={16} />
            <span>結束導覽</span>
          </button>
        </div>
      </div>

      {/* Main Showcase Layout */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 my-auto z-10 py-4">
        
        {/* Left Mobile Device Mockup */}
        <div className="relative flex flex-col items-center flex-shrink-0">
          
          <div className="relative w-[320px] h-[630px] bg-slate-900 rounded-[55px] border-4 border-slate-700 p-3.5 shadow-2xl flex flex-col select-none overflow-hidden transition-all duration-500 ring-4 ring-indigo-500/10">
            
            {/* Speaker & Sensor bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
              <div className="w-2.5 h-2.5 bg-slate-800 rounded-full ml-2 mb-1"></div>
            </div>

            {/* Screen frame */}
            <div className="w-full h-full rounded-[42px] bg-slate-950 overflow-hidden relative border border-slate-800 flex flex-col justify-between">
              
              {/* Virtual Header status bar */}
              <div className="bg-slate-900 px-4 pt-6 pb-2 text-slate-300 border-b border-slate-800/40 flex justify-between items-center text-xs font-mono font-bold">
                <span>09:41 AM</span>
                <span className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-slate-400 rounded-sm bg-slate-300"></div>
                </span>
              </div>

              {/* Dynamic Screen Mockup Content */}
              <div className="flex-1 overflow-hidden relative flex flex-col text-slate-950 bg-slate-50">
                
                {/* Step 0: Welcome Mockup Screen */}
                {currentStep === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-fade-in bg-gradient-to-b from-indigo-50/50 to-white">
                    {/* Breathing animated outer ring */}
                    <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                      <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-full animate-spin duration-[8s] opacity-75"></div>
                      <div className="relative w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <Heart size={42} className="fill-white animate-[pulse_1.5s_infinite]" />
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-extrabold text-indigo-950 font-sans tracking-wide">SeniorCare</h3>
                    <p className="bg-indigo-100 text-indigo-700 px-3.5 py-0.5 rounded-full text-xs font-extrabold mt-2">智慧長者關懷</p>
                    
                    {/* Floating simulated health status card */}
                    <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-4 mt-8 shadow-sm space-y-2 text-left animate-[fadeSlideIn_0.8s_ease]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] font-black text-slate-500">系統即時監控中</p>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full w-4/5"></div>
                      <div className="h-2.5 bg-slate-100 rounded-full w-11/12"></div>
                      <div className="h-2.5 bg-slate-100 rounded-full w-2/3"></div>
                    </div>
                  </div>
                )}

                {/* Step 1: SOS Alarm Mockup Screen */}
                {currentStep === 1 && (
                  <div className={`absolute inset-0 flex flex-col p-4 justify-between transition-colors duration-500 ${showSOSAlert ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="font-extrabold text-slate-700 text-xs">王春花 (奶奶)</span>
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse">連線守護中</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                      {/* Interactive Ring Ripple */}
                      <div className="relative flex items-center justify-center">
                        {showSOSAlert && (
                          <>
                            <div className="absolute w-36 h-36 bg-red-500/20 rounded-full animate-ping"></div>
                            <div className="absolute w-28 h-28 bg-red-500/30 rounded-full animate-pulse"></div>
                          </>
                        )}
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-xl transition-all duration-300 ${
                          showSOSAlert 
                            ? 'bg-red-600 border-red-200 scale-110 text-white animate-bounce' 
                            : 'bg-red-500 border-red-300 text-white'
                        }`}>
                          <ShieldAlert size={48} />
                        </div>
                      </div>
                      
                      <p className="text-xs font-black text-slate-700">
                        {showSOSAlert ? '🚨 紅色警報發出！通話已接通' : '長輩端「一鍵 SOS」大按鈕'}
                      </p>

                      {/* Notifying progress bar */}
                      {!showSOSAlert && (
                        <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 transition-all" style={{ width: `${sosProgress}%` }}></div>
                        </div>
                      )}
                    </div>

                    {showSOSAlert && (
                      <div className="bg-red-600 text-white rounded-2xl p-3.5 text-xs font-bold space-y-1 shadow-lg animate-[zoom-in_0.3s_ease] border border-red-500">
                        <p className="font-black text-center text-sm border-b border-red-500/80 pb-1 mb-1 tracking-wider">🚨 紅色紧急通知</p>
                        <p>奶奶於 09:41 觸發一鍵求助！</p>
                        <p className="text-[10px] text-red-200">護理師與所有家屬手機已發出鳴笛警報。</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Medication Check and Heart Beat Graph */}
                {currentStep === 2 && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col p-4 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800 text-xs">健康生理指標</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-bold">同步中</span>
                    </div>

                    {/* Vitals Graph Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-extrabold text-slate-500">本日心率 / 血壓脈搏</p>
                        <p className="text-xs font-black text-rose-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          72 BPM
                        </p>
                      </div>
                      
                      {/* Beautiful heartbeat graph using SVG path animations */}
                      <div className="h-10 w-full bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                        <svg className="w-full h-full" viewBox="0 0 100 30">
                          <path
                            d="M0 15 H40 L43 5 L46 25 L49 10 L52 17 L55 15 H100"
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="animate-[dash_2s_linear_infinite]"
                            style={{ strokeDasharray: '100', strokeDashoffset: '0' }}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Pill Medication Confirmation */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-3 relative overflow-hidden">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${simulatedMedsTaken ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          <Pill size={20} className={!simulatedMedsTaken ? 'animate-[bounce_2s_infinite]' : ''} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400">下午用藥時間</p>
                          <p className="text-xs font-black text-slate-800">12:30 PM (降血壓飯後藥)</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                        <span className="text-[10px] text-slate-500">降血壓、維他命D</span>
                        <button className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold shadow-sm transition-all duration-300 ${
                          simulatedMedsTaken 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}>
                          {simulatedMedsTaken ? '✓ 奶奶已服用' : '確認服用'}
                        </button>
                      </div>

                      {simulatedMedsTaken && (
                        <div className="absolute inset-0 bg-emerald-600/95 flex flex-col items-center justify-center text-white p-2 animate-[fadeSlideIn_0.4s_ease]">
                          <CheckCircle2 size={32} className="text-white mb-1" />
                          <p className="font-black text-xs">今日用藥確認完成！</p>
                          <p className="text-[9px] text-emerald-100">已自動向家人聊天室推播</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Family Room Chat with typing bubble and photos */}
                {currentStep === 3 && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col p-3 justify-between animate-fade-in">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2 text-center text-[10px] font-black text-indigo-800 tracking-wider">
                      👨‍👩‍👧‍👦 專屬家庭聊天群
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 py-3 px-1 flex flex-col justify-end">
                      {chatMessages.length === 0 && !isTyping ? (
                        <div className="text-center py-8 text-slate-300 text-[10px] font-bold">
                          ⏳ 等待聊天對話滑入...
                        </div>
                      ) : (
                        <>
                          {chatMessages.map((msg, i) => {
                            const isGrandma = msg.includes('王春花');
                            const isNurse = msg.includes('林美玲');
                            return (
                              <div 
                                key={i} 
                                className={`p-2.5 rounded-2xl text-[10px] max-w-[85%] shadow-sm animate-[zoom-in_0.25s_ease] ${
                                  isGrandma 
                                    ? 'bg-amber-100 text-slate-800 self-start border-l-4 border-amber-500 rounded-tl-none' 
                                    : isNurse
                                      ? 'bg-rose-100 text-slate-800 self-start border-l-4 border-rose-500 rounded-tl-none'
                                      : 'bg-indigo-600 text-white self-end rounded-tr-none'
                                }`}
                              >
                                <p className="font-extrabold text-[8px] opacity-75 mb-0.5">
                                  {isGrandma ? '王春花 (奶奶)' : isNurse ? '林美玲 (護理師)' : '陳小明 (孫子)'}
                                </p>
                                <p>{msg.split('：')[1] || msg}</p>
                              </div>
                            );
                          })}
                          
                          {/* Typing indicator replica */}
                          {isTyping && (
                            <div className="bg-slate-200/80 text-slate-500 p-2 rounded-xl text-[9px] self-start rounded-tl-none flex items-center gap-1 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Album glassmorphism mock card */}
                    <div className="bg-white/80 border border-slate-200/60 backdrop-blur-md rounded-xl p-2 flex items-center gap-2">
                      <img 
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=60&h=60" 
                        alt="Grandma" 
                        className="w-8 h-8 rounded-lg object-cover shadow-sm border border-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-slate-800 truncate">🖼️ 共享相簿：奶奶的日常生活</p>
                        <p className="text-[7px] text-slate-400">陳小明 上傳於 3分鐘前</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Medical Schedule and Nurse Logs */}
                {currentStep === 4 && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col p-3 space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                      <span className="font-extrabold text-slate-800 text-xs">醫療排程與照護日誌</span>
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[8px] font-black">醫護端</span>
                    </div>

                    {/* Clinic appointment reminder widget */}
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400">📅 就醫門診提醒</p>
                      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between text-[10px]">
                        <div>
                          <p className="font-extrabold text-amber-900">5月26日 門診回診</p>
                          <p className="text-[8px] text-amber-700">台大醫院 骨科門診</p>
                        </div>
                        <span className="bg-amber-600 text-white px-2 py-1 rounded-md text-[8px] font-bold">護師隨行</span>
                      </div>
                    </div>

                    {/* Care Center Checklist Day Log */}
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm space-y-2 flex-1 flex flex-col">
                      <p className="text-[9px] font-black text-slate-400">📝 今日照護評估紀錄</p>
                      <div className="bg-slate-50 rounded-lg p-2.5 text-[10px] text-slate-700 space-y-1.5 border border-slate-200 flex-1 flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <img 
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=40&h=40" 
                            alt="Nurse" 
                            className="w-5 h-5 rounded-full object-cover border" 
                          />
                          <div>
                            <p className="font-extrabold text-slate-900 text-[8px]">日照中心護理師 林美玲</p>
                            <p className="text-[7px] text-slate-400">本日 16:30 更新</p>
                          </div>
                        </div>
                        <p className="font-bold text-slate-800 leading-snug">
                          「王奶奶今天下午完成了手工香包，精神與血壓量測指標穩定，午餐全部順利服用完畢。」
                        </p>
                        <div className="flex gap-2 text-[7px] text-emerald-700 font-extrabold">
                          <span className="bg-emerald-100 px-1.5 py-0.5 rounded">✓ 血壓正常</span>
                          <span className="bg-emerald-100 px-1.5 py-0.5 rounded">✓ 活動良好</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: High Accessibility Role Switching */}
                {currentStep === 5 && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col animate-fade-in">
                    
                    {/* Header updates dynamically based on the active role */}
                    <div className={`p-4 border-b text-white transition-all duration-500 ${
                      activeRole === 'grandson' 
                        ? 'bg-gradient-to-r from-indigo-700 to-blue-600' 
                        : activeRole === 'grandma'
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 font-black'
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
                          className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-xs">
                            {activeRole === 'grandson' ? '陳小明 (孫子)' : activeRole === 'grandma' ? '王春花 (奶奶)' : '林美玲 (護師)'}
                          </p>
                          <p className="text-[8px] opacity-90">
                            {activeRole === 'grandson' ? '家屬端視角' : activeRole === 'grandma' ? '長者無障礙特大字體' : '專業照護機構管理'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-3 space-y-3 bg-slate-100">
                      
                      {/* Big UI elements for Grandma view */}
                      {activeRole === 'grandma' ? (
                        <div className="space-y-3.5 animate-[zoom-in_0.3s_ease]">
                          <div className="bg-red-600 p-4 rounded-2xl shadow-lg border-2 border-red-400 text-center text-white cursor-pointer active:scale-95 transition-transform">
                            <p className="text-lg font-black animate-pulse flex items-center justify-center gap-1">🚨 按我叫救護車</p>
                          </div>
                          <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg border-2 border-emerald-400 text-center text-white cursor-pointer active:scale-95 transition-transform">
                            <p className="text-lg font-black">✓ 我吃飽藥了</p>
                          </div>
                          <p className="text-center text-[9px] font-extrabold text-slate-500">超大按鈕 • 高清晰度 • 極簡控制</p>
                        </div>
                      ) : activeRole === 'nurse' ? (
                        <div className="space-y-2 animate-[zoom-in_0.3s_ease] text-[10px]">
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1">
                            <p className="font-extrabold text-slate-800">📋 新增照護日誌紀錄</p>
                            <p className="text-[8px] text-slate-500">體溫：36.5℃ | 血壓：125/80</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <p className="font-extrabold text-slate-800">➕ 發布新就醫回診計畫</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-[zoom-in_0.3s_ease] text-[10px]">
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <span className="text-slate-600">奶奶今日步數</span>
                            <span className="font-black text-indigo-700">6,520 步</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <span>血壓健康狀態</span>
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[8px]">十分優良</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Virtual Tab Nav */}
              <div className="bg-slate-900 border-t border-slate-800/80 px-4 py-3 text-slate-400 text-center flex justify-around items-center text-[10px] font-bold font-sans">
                <span className={currentStep === 0 || currentStep === 2 ? 'text-indigo-400 font-extrabold' : ''}>🏠 首頁</span>
                <span className={currentStep === 3 ? 'text-indigo-400 font-extrabold' : ''}>💬 聊天</span>
                <span className={currentStep === 4 ? 'text-indigo-400 font-extrabold' : ''}>📅 日程</span>
              </div>
            </div>

            {/* Virtual Simulated Hand Pointer Pointer (Auto-Play Video Mode Only) */}
            {!isInteractiveMode && isPlaying && (
              <motion.div 
                className="absolute w-8 h-8 pointer-events-none z-50 rounded-full border border-white/60 bg-red-500/50 shadow-lg flex items-center justify-center text-white"
                initial={{ x: 160, y: 300 }}
                animate={
                  currentStep === 0
                    ? { x: [160, 160], y: [400, 160], scale: [1, 1] }
                    : currentStep === 1 
                      ? { x: [160, 160, 160, 160], y: [460, 280, 280, 280], scale: [1, 1, 0.8, 1.1] } 
                      : currentStep === 2
                        ? { x: [160, 240, 240, 240], y: [350, 220, 220, 220], scale: [1, 1, 0.8, 1.1] }
                        : currentStep === 3
                          ? { x: [160, 160, 160], y: [350, 480, 480], scale: [1, 1, 1] }
                          : currentStep === 4
                            ? { x: [160, 160], y: [350, 180], scale: [1, 1] }
                            : { x: [160, 120, 120, 200, 200], y: [300, 45, 45, 45, 45], scale: [1, 1, 0.8, 1, 0.8] }
                }
                transition={{ duration: 5, repeat: Infinity, repeatDelay: 1 }}
              >
                <Hand size={14} className="fill-white rotate-[270deg]" />
              </motion.div>
            )}

            {/* Gloss reflection shine overlay */}
            <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 rounded-[55px] skew-x-[-15deg] origin-top"></div>
          </div>

          {/* Setup status cues below mockup */}
          <div className="mt-4 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isInteractiveMode ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
            <span className="text-xs font-bold text-slate-400">
              {isInteractiveMode ? '🎮 互動模式已開啟：您可直接點擊內側畫面！' : '🎬 影片模擬中：虛擬游標演示自動操作'}
            </span>
          </div>

          {/* Interactive swap action */}
          <button
            onClick={toggleInteractive}
            className={`mt-3 px-5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-2 shadow-md border cursor-pointer ${
              isInteractiveMode 
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
            }`}
          >
            <span>{isInteractiveMode ? '🎬 切換為影片自動演示' : '🎮 暫停並親自手動點擊'}</span>
          </button>
        </div>

        {/* Right Side Controls and Captions */}
        <div className="flex-1 w-full flex flex-col justify-between space-y-6">
          
          {/* Progress Segmented Bar */}
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
                className={`flex-1 h-2 rounded-full transition-all relative overflow-hidden ${
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

          {/* Interactive Narration Details Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/50 border border-slate-800 backdrop-blur-md p-6 md:p-8 rounded-3xl space-y-5 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3.5 rounded-2xl bg-gradient-to-tr ${TOUR_STEPS[currentStep].color} text-white shadow-lg`}>
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

              <p className="text-base font-extrabold text-slate-300">
                {TOUR_STEPS[currentStep].subtitle}
              </p>

              {/* Subtitle & Dynamic Sound Equalizer Visualizer */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-5 md:p-6 rounded-2xl relative overflow-hidden min-h-[120px]">
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2 mb-3">
                  <span className="text-[9px] font-black text-indigo-400/80 uppercase tracking-widest">
                    🎙️ 旁白語音字幕軌 (Narration)
                  </span>
                  
                  {/* Dynamic Equalizer Visualizer Wave */}
                  {isPlaying && !isMuted && !isInteractiveMode ? (
                    <div className="flex items-end gap-1 h-4">
                      {[...Array(6)].map((_, i) => (
                        <div 
                          key={i} 
                          className="w-[3px] bg-gradient-to-t from-indigo-500 to-sky-400 rounded-full animate-[equalizer_0.5s_infinite_alternate]"
                          style={{
                            height: '100%',
                            animationDelay: `${i * 0.08}s`,
                            animationDuration: `${0.3 + Math.random() * 0.4}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-end gap-1 h-4 opacity-30">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-[3px] h-[3px] bg-slate-500 rounded-full"></div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-base md:text-lg text-slate-100 font-bold leading-relaxed">
                  {getSentences(TOUR_STEPS[currentStep].narration).map((sentence, idx) => (
                    <span 
                      key={idx} 
                      className={`transition-all duration-300 mr-1.5 ${
                        idx === currentSentenceIndex 
                          ? 'text-indigo-400 font-extrabold underline decoration-indigo-500/40 decoration-2 underline-offset-4' 
                          : idx < currentSentenceIndex 
                            ? 'text-slate-400 font-bold' 
                            : 'text-slate-500/50'
                      }`}
                    >
                      {sentence}
                    </span>
                  ))}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Player Controller Bar */}
          <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4">
            
            {/* Action buttons */}
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

              {currentStep === TOUR_STEPS.length - 1 ? (
                <button
                  onClick={onClose}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all active:scale-95 border border-emerald-500 cursor-pointer shadow-lg hover:shadow-emerald-500/20"
                  title="完成導覽"
                >
                  完成
                </button>
              ) : (
                <button
                  disabled={isInteractiveMode}
                  onClick={handleNext}
                  className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all active:scale-95 disabled:opacity-30 disabled:scale-100 border border-slate-700 cursor-pointer"
                  title="下一幕"
                >
                  <ArrowRight size={18} />
                </button>
              )}
            </div>

            {/* Subtitle Progress Scrubber */}
            <div className="flex-1 min-w-[200px] flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold font-mono">0:0{currentStep}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-sky-400"
                  style={{ width: `${isInteractiveMode ? 100 : progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-bold font-mono">0:0{TOUR_STEPS.length}</span>
            </div>

            {/* Restart Actions */}
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

      {/* Styled equalizers & pulse animations custom styles inject */}
      <style>{`
        @keyframes equalizer {
          0% { transform: scaleY(0.15); }
          100% { transform: scaleY(1); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -200; }
        }
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Bottom info footer */}
      <p className="text-xs text-slate-500 font-bold text-center z-10 select-none">
        💡 提示：本影音導覽整合 Web Speech Synthesis API 語音技術與網頁自動控制核心。建議開啟系統音量以獲取最佳沉浸感。
      </p>

    </div>
  );
}
