export function SecondaryButton({ 
  text, 
  onClick, 
  disabled = false, 
  width, 
  height, 
  fontSize,
  className = '',
  variant = 'default'
}) {
  const customStyles = {};
  if (width) customStyles.width = `${width}px`;
  if (height) customStyles.height = `${height}px`;
  if (fontSize) customStyles.fontSize = `${fontSize}px`;

  const baseStyles = 'font-bold rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none';
  
  const variants = {
    default: 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 shadow-lg active:scale-[0.99]',
    danger: 'bg-slate-900/20 border-slate-900/10 text-slate-700 cursor-not-allowed',
    ghost: 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
    outline: 'bg-slate-900 border-slate-800 text-violet-400 hover:text-violet-300 hover:border-violet-500/30',
    violet: 'bg-violet-600 hover:bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-600/30',
  };

  const paddingStyles = !width && !height ? 'px-4 py-3 text-sm' : 'px-3';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={customStyles}
      className={`${baseStyles} ${variants[variant]} ${paddingStyles} ${className}`}
    >
      {text}
    </button>
  );
}