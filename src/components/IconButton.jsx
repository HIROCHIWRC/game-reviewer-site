export function IconButton({ 
  children, 
  onClick, 
  disabled = false,
  size = 'md',
  variant = 'default',
  className = '',
  'aria-label': ariaLabel,
  title,
}) {
  const sizeStyles = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const variants = {
    default: 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500',
    violet: 'bg-violet-500/20 border-violet-400 text-violet-400 hover:bg-violet-500/30 hover:text-violet-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 border-rose-600',
    ghost: 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
    white: 'bg-white text-slate-900 hover:bg-slate-100 border-slate-200',
  };

  const baseStyles = 'rounded-full border flex items-center justify-center font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizeStyles[size]} ${className}`}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}