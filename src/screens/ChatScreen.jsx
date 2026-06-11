import { useState, useEffect, useRef } from 'react';
import { BackButton } from '../components/BackButton';
import { chatApi } from '../api';

const PAGE_SIZE = 30;

export function ChatScreen({ username, onBack, onViewProfile }) {
  const [messages, setMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const autoScroll = useRef(true);

  useEffect(() => {
    const fetchMessages = () => {
      chatApi.get().then((data) => {
        const msgs = data.messages || [];
        setMessages(msgs);
        if (msgs.length <= 30) {
          autoScroll.current = true;
        }
      }).catch(() => {});
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, visibleCount]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await chatApi.send(trimmed);
      setText('');
      autoScroll.current = true;
      setVisibleCount(PAGE_SIZE);
      chatApi.get().then((data) => { setMessages(data.messages || []); }).catch(() => {});
    } catch { /* ignore send error */ }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visible = messages.slice(-visibleCount);
  const hasMore = messages.length > visibleCount;

  return (
    <div className="py-2">
      <div className="mb-4"><BackButton onClick={onBack} /></div>
      <h2 className="text-xl font-bold text-slate-100 mb-4">💬 Общий чат</h2>

      <div ref={scrollRef} className="overflow-y-auto space-y-2 mb-4 pr-1" style={{ maxHeight: '60vh' }}>
        {hasMore && (
          <button
            type="button"
            onClick={() => {
              const el = scrollRef.current;
              const prevScroll = el?.scrollTop ?? 0;
              const prevHeight = el?.scrollHeight ?? 0;
              setVisibleCount((c) => c + PAGE_SIZE);
              autoScroll.current = false;
              setTimeout(() => {
                if (el) el.scrollTop = prevScroll + (el.scrollHeight - prevHeight);
              }, 0);
            }}
            className="w-full text-center text-xs text-violet-400 hover:text-violet-300 py-2 cursor-pointer"
          >
            ↑ Показать предыдущие ({messages.length - visibleCount} шт.)
          </button>
        )}
        {visible.map((m) => (
          <div
            key={m.id}
            className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
              m.username === username
                ? 'bg-violet-600/20 border border-violet-500/30 ml-8'
                : 'bg-slate-800/50 border border-slate-700/30 mr-8'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => onViewProfile?.(m.username)}
                className="text-xs font-bold text-violet-400 hover:text-violet-300 hover:underline cursor-pointer"
              >
                {m.username}
              </button>
              <span className="text-[10px] text-slate-600">{formatTime(m.created_at)}</span>
            </div>
            <p className="text-slate-200 break-words">{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Написать сообщение..."
          maxLength={500}
          className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-base text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl cursor-pointer active:scale-95 transition-all text-sm"
        >
          {sending ? '⏳' : '→'}
        </button>
      </div>
    </div>
  );
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
