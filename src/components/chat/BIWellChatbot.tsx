import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  RotateCcw,
  Key,
  Bot,
  User,
  Copy,
  Check,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  ChatMessage,
  sendChatMessageToGemini,
  getOfflineDemoResponse
} from '../../lib/geminiChat';
import { getGeminiApiKey } from '../../lib/geminiParser';
import { ApiKeyConfigModal } from '../upload/ApiKeyConfigModal';
import { AuthUser } from '../../types/auth';

interface BIWellChatbotProps {
  activeYear?: number;
  currentUser?: AuthUser | null;
  selectedNip?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: `Halo! Saya adalah **BI-WELL AI Copilot**. 
Saya dapat membantu Anda dengan:
- **Analitik Data Korporasi**: Menganalisis statistik kesehatan pegawai BI, perbandingan risiko antar departemen, dan tren tahun berjalan.
- **Edukasi Medis & Hasil Lab**: Memahami arti 11 parameter MCU, batas normal, serta rekomendasi pola hidup sehat.

*Silakan tanyakan apa saja atau pilih pertanyaan cepat di bawah ini.*`,
    timestamp: new Date()
  }
];

const SUGGESTED_CHIPS = [
  { label: '💡 Arti Klaster A - D', query: 'Jelaskan klasifikasi klaster kesehatan Kelas A sampai D dan perhitungannya di BI-WELL' },
  { label: '📊 Ringkasan MCU 2026', query: 'Bagaimana ringkasan statistik kesehatan pegawai tahun 2026 dan distribusi klasternya?' },
  { label: '🏢 Departemen Risiko Tertinggi', query: 'Departemen mana yang memiliki risiko kesehatan atau pegawai Kelas D terbanyak di 2026?' },
  { label: '🥗 Tips Kolesterol & Asam Urat', query: 'Berikan tips praktis pola makan dan gaya hidup untuk pegawai dengan kolesterol dan asam urat tinggi' }
];

export const BIWellChatbot: React.FC<BIWellChatbotProps> = ({
  activeYear = 2026,
  currentUser,
  selectedNip
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('bi_well_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {
      // ignore
    }
    return INITIAL_MESSAGES;
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => Boolean(getGeminiApiKey()));
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll ke pesan terbaru
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom('auto');
    }
  }, [isOpen, isMinimized, messages]);

  // Simpan riwayat chat ke sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('bi_well_chat_history', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Update status API key saat modal dibuka/ditutup
  const handleKeyModalClose = () => {
    setIsApiKeyModalOpen(false);
    setHasApiKey(Boolean(getGeminiApiKey()));
  };

  // Kirim pesan
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      let aiResponseText = '';
      const apiKey = getGeminiApiKey();

      if (apiKey) {
        aiResponseText = await sendChatMessageToGemini(
          updatedMessages,
          activeYear,
          currentUser,
          selectedNip
        );
      } else {
        // Fallback pintar untuk demo cepat jika user belum setup API key
        await new Promise(r => setTimeout(r, 800));
        aiResponseText = getOfflineDemoResponse(text, activeYear);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: aiResponseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const isLimit =
        err.message?.includes('429') ||
        err.message?.toLowerCase().includes('quota') ||
        err.message?.toLowerCase().includes('rate limit') ||
        err.message?.toLowerCase().includes('resource');

      const fallbackResponse = getOfflineDemoResponse(text, activeYear);
      let fallbackText = '';
      if (isLimit) {
        fallbackText =
          fallbackResponse +
          '\n\n---\n> ⚠️ **Catatan Kuota AI**: *Batas permintaan per menit (15 RPM) akun Google AI Studio sedang cooling down. Jawaban di atas disajikan langsung dari basis data internal BI-WELL agar demonstrasi tetap berjalan lancar. Kuota akan pulih otomatis dalam ~60 detik, atau Anda dapat memasukkan API Key cadangan di ikon 🔑 di atas.*';
      } else {
        fallbackText =
          fallbackResponse +
          '\n\n---\n> ℹ️ *Catatan: Jawaban di atas disajikan dari basis pengetahuan cerdas BI-WELL (layanan AI dialihkan ke sistem cadangan internal).*';
      }

      const fallbackMsg: ChatMessage = {
        id: `ai-fb-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Hapus seluruh riwayat percakapan chat?')) {
      setMessages(INITIAL_MESSAGES);
      sessionStorage.removeItem('bi_well_chat_history');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper render formatted markdown sederhana (bold, italic, lists, headings)
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');

    return lines.map((line, idx) => {
      // Heading ###
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-xs mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }

      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const bulletText = line.trim().replace(/^[\*\-]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-bi-900 text-[10px] leading-tight mt-1">•</span>
            <span className="flex-1">{parseInlineFormatting(bulletText)}</span>
          </div>
        );
      }

      // Numbered list
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="font-bold text-bi-900 text-[11px] shrink-0">{numMatch[1]}.</span>
            <span className="flex-1">{parseInlineFormatting(numMatch[2])}</span>
          </div>
        );
      }

      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="my-0.5">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  // Parse inline bold **text** and italic *text*
  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-slate-700">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center gap-3 bg-bi-900 hover:bg-bi-800 text-white pl-4 pr-5 py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/20"
            aria-label="Buka Chatbot BI-WELL AI"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="text-left">
              <span className="block text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>Tanya BI-WELL AI</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </span>
              <span className="block text-[10px] text-slate-300 leading-tight">
                Copilot Analitik & Medis
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${
            isMinimized
              ? 'w-80 h-14'
              : 'w-[430px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-5rem)]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-bi-950 via-bi-900 to-bi-800 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-bi-900" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs truncate">BI-WELL AI Copilot</span>
                  <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded font-mono font-medium">
                    Gemini 1.5
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 block truncate">
                  {hasApiKey ? 'Koneksi AI Aktif' : 'Mode Demo Cepat'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                title="Konfigurasi API Key"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                title="Reset Percakapan"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Perbesar' : 'Kecilkan'}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Tutup Chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Body (Hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Quick Suggestions Carousel */}
              <div className="bg-slate-50/80 border-b border-slate-200 px-3 py-2 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-bi-900" />
                  Saran:
                </span>
                {SUGGESTED_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip.query)}
                    disabled={isLoading}
                    className="text-[11px] font-medium whitespace-nowrap bg-white hover:bg-bi-50 text-slate-700 hover:text-bi-900 border border-slate-200 hover:border-bi-300 px-2.5 py-1 rounded-full shadow-2xs transition-all shrink-0 disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40 text-xs">
                {messages.map(msg => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-bi-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-2xs ${
                          isUser
                            ? 'bg-bi-900 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <div className="text-slate-800 space-y-1">
                            {renderFormattedText(msg.text)}
                          </div>
                        )}

                        <div
                          className={`flex items-center justify-between gap-2 mt-1.5 pt-1 text-[10px] ${
                            isUser ? 'text-slate-300' : 'text-slate-400 border-t border-slate-100'
                          }`}
                        >
                          <span>
                            {msg.timestamp.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>

                          {!isUser && (
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.text, msg.id)}
                              className="opacity-0 group-hover:opacity-100 hover:text-bi-900 flex items-center gap-1 transition-opacity text-[10px]"
                              title="Salin teks"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading typing indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 justify-start animate-fade-in">
                    <div className="w-6 h-6 rounded-full bg-bi-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-200 text-slate-600 rounded-2xl rounded-tl-xs px-3.5 py-2.5 flex items-center gap-2 shadow-2xs">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-bi-900 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-bi-900 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-bi-900 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        BI-WELL AI sedang menganalisis...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <div className="relative flex items-end bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-bi-900 focus-within:border-bi-900 focus-within:bg-white transition-all">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tanya analisis data atau penjelasan hasil MCU..."
                    rows={1}
                    className="w-full text-xs px-3 py-2.5 bg-transparent resize-none focus:outline-none max-h-24 leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="m-1.5 p-2 rounded-lg bg-bi-900 hover:bg-bi-800 disabled:opacity-40 disabled:hover:bg-bi-900 text-white transition-colors shrink-0"
                    title="Kirim Pesan"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
                  <span>Enter untuk kirim • Shift+Enter baris baru</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Info className="w-2.5 h-2.5" />
                    <span>Edukasi & Analitik</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal Pengaturan API Key jika diklik */}
      <ApiKeyConfigModal
        isOpen={isApiKeyModalOpen}
        onClose={handleKeyModalClose}
        onSaved={handleKeyModalClose}
      />
    </>
  );
};
