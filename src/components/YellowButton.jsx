

export function YellowButton({ text, onClick, width, height, fontSize, className = '', children }) {
  const customStyles = {};
  if (width) customStyles.width = `${width}px`;
  if (height) customStyles.height = `${height}px`;
  if (fontSize) customStyles.fontSize = `${fontSize}px`;

  const baseStyles =
    'bg-gradient-to-r from-[#FFDD3C] to-[#FF751B] hover:from-[#FFE76C] hover:to-[#FF8936] text-white font-bold rounded-xl shadow-lg shadow-[#FF751B]/30 transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2';

  const paddingStyles = !width && !height ? 'px-8 py-4 text-lg' : 'px-4';

  return (
    <button onClick={onClick} style={customStyles} className={`${baseStyles} ${paddingStyles} ${className}`}>
      {children || text}
    </button>
  );
}