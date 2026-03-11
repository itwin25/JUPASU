'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Send, ChevronLeft } from 'lucide-react';

interface Message {
  id: number;
  type: 'bot' | 'user';
  text: string;
  recommendation?: {
    name: string;
    category: string;
    price: string;
    match: number;
  };
  options?: string[];
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      text: '어떤 와인을 추천해드릴까요?',
      options: ['뭐랑 먹을까?', '비슷한 다른 와인', '칼로리가 궁금해'],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newUserMsg: Message = { id: Date.now(), type: 'user', text: inputValue };
    setMessages([...messages, newUserMsg]);
    setInputValue('');

    setTimeout(() => {
      const botRes: Message = {
        id: Date.now() + 1,
        type: 'bot',
        text: '달콤한 와인을 좋아하시는군요! 모스카토 다스티나 리슬링같은 와인이 딱입니다. 과일 디저트랑 같이 드시면 환상이에요!',
        recommendation: {
          name: 'Riesling Kabinett',
          category: 'German White',
          price: '32,000',
          match: 90,
        }
      };
      setMessages(prev => [...prev, botRes]);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/chatbot.svg" 
          alt="Chatbot Background" 
          fill 
          className="object-cover opacity-80"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 text-white">
        <button 
          onClick={() => router.push('/home')}
          className="flex items-center gap-1 font-bold hover:text-white/70 transition-colors"
        >
          <ChevronLeft size={20} /> 뒤로가기
        </button>
        <Link href="/chat/history" className="font-bold">
          전체 대화 보기
        </Link>
      </header>

      {/* Chat Area */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar pb-10">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`relative max-w-[85%] p-5 rounded-[32px] ${
              msg.type === 'bot' 
                ? 'bg-white/95 text-text-main rounded-tl-none ml-2' 
                : 'bg-white/90 text-text-main rounded-tr-none mr-2'
            }`}>
              {msg.type === 'bot' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-sm font-black text-[#8B4513]">소믈리에</span>
                </div>
              )}
              <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
              
              {msg.recommendation && (
                <div className="mt-4 p-4 bg-[#FFF9EB] rounded-3xl border border-[#FFD700]/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-2xl text-[#8B4513]">
                      I
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-sm">{msg.recommendation.name}</h4>
                      <p className="text-[10px] text-text-main/40 font-bold">{msg.recommendation.category}</p>
                      <p className="text-xs font-black text-[#B36262] mt-0.5">₩{msg.recommendation.price}</p>
                    </div>
                    <div className="bg-[#B36262] text-white text-[8px] font-black px-2 py-1 rounded-full whitespace-nowrap">
                      {msg.recommendation.match}% match
                    </div>
                  </div>
                </div>
              )}

              {msg.options && (
                <div className="mt-4 flex flex-col gap-2">
                  {msg.options.map((opt) => (
                    <button 
                      key={opt}
                      className="bg-gray-100/80 hover:bg-white px-5 py-3 rounded-full text-xs font-bold text-text-main/60 transition-colors text-left"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {msg.type === 'bot' && (
                <div className="absolute -left-2 top-0 w-4 h-4 bg-white/95 clip-path-bot-tail" />
              )}
            </div>
            
            {msg.recommendation && (
              <button className="mt-3 ml-6 flex items-center gap-1.5 text-xs font-bold text-white/70">
                <span className="text-rose-400">❤</span> 위시리스트에 추가하기
              </button>
            )}
          </div>
        ))}
      </main>

      {/* Input Area */}
      <div className="relative z-10 p-4 bg-transparent pb-8">
        {showMenu && (
          <div className="absolute bottom-20 left-4 w-48 bg-white rounded-2xl shadow-xl border border-primary-100 p-2 animate-in slide-in-from-bottom-2">
            <button className="w-full text-left px-4 py-3 text-sm font-bold text-text-main hover:bg-primary-100/30 rounded-xl">
              메뉴판 스캔
            </button>
            <div className="h-px bg-gray-100 mx-2" />
            <button className="w-full text-left px-4 py-3 text-sm font-bold text-[#7B4D9B] hover:bg-primary-100/30 rounded-xl">
              라벨 스캔
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg border border-primary-100">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full border border-primary-100 flex items-center justify-center text-[#B36262] active:scale-90 transition-transform"
          >
            <Plus size={24} />
          </button>
          <input 
            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold text-text-main placeholder:text-text-main/30"
            placeholder="소믈리에에게 물어보세요... (@김친구)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="text-[#B36262] active:scale-90 transition-transform"
          >
            <Send size={24} fill="currentColor" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .clip-path-bot-tail {
          clip-path: polygon(100% 0, 0 0, 100% 100%);
        }
      `}</style>
    </div>
  );
}
