import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';

export function Modal({ 
  visible, 
  title, 
  children, 
  onClose, 
  size = 'md',
  showCloseButton = true,
}) {
  if (!visible) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full ${sizeStyles[size]} animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50">
          <h3 className="text-xl font-black text-slate-100">{title}</h3>
          {showCloseButton && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Закрыть"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}