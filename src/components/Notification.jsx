import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { IconButton } from './IconButton';

export function Notification({ notification, onClose }) {
  const [shake, setShake] = useState(false);
  const prevRef = useRef(null);

  useEffect(() => {
    if (!notification) return;

    const prev = prevRef.current;
    prevRef.current = notification;

    // Трясём только если это повторное уведомление (тот же type + message)
    if (prev && prev.type === notification.type && prev.message === notification.message) {
      const t = setTimeout(() => setShake(true), 0);
      const t2 = setTimeout(() => setShake(false), 400);
      return () => { clearTimeout(t); clearTimeout(t2); };
    } else {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const styles = {
    success: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
    error: 'border-rose-500/40 bg-rose-950/40 text-rose-300',
    info: 'border-violet-500/40 bg-violet-950/40 text-violet-300',
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  const el = (
    <div className={`fixed top-6 right-6 z-[100] max-w-sm animate-in slide-in-from-right-4 fade-in duration-300 ${shake ? 'animate-shake' : ''}`}>
      <div className={`flex items-start gap-3 px-5 py-4 rounded-xl border backdrop-blur-md shadow-2xl ${styles[notification.type] || styles.info}`}>
        <span className="text-lg leading-none mt-0.5">{icons[notification.type] || icons.info}</span>
        <p className="text-sm font-medium leading-snug flex-1">{notification.message}</p>
        <IconButton variant="ghost" size="sm" onClick={onClose} aria-label="Закрыть">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </IconButton>
      </div>
    </div>
  );

  return createPortal(el, document.body);
}