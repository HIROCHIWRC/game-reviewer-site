

export function RedButton({ text, onClick, width, height, fontSize }) {
  const customStyles = {
    width: width ? `${width}px` : 'auto',
    height: height ? `${height}px` : 'auto',
    fontSize: fontSize ? `${fontSize}px` : 'inherit',
  };

  const baseStyles =
    'bg-gradient-to-r from-[#FF4D4D] to-[#CC0000] hover:from-[#FF6666] hover:to-[#E60000] text-white font-bold rounded-xl shadow-lg shadow-[#CC0000]/30 transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2';

  const paddingStyles = !width && !height ? 'px-8 py-4 text-lg' : 'px-4';

  return (
    <button onClick={onClick} style={customStyles} className={`${baseStyles} ${paddingStyles}`}>
      {text}
    </button>
  );
}