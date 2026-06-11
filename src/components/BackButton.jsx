export function BackButton({ onClick, text = '← Назад', width, height, fontSize }) {
  const customStyles = {
    width: width ? `${width}px` : 'auto',
    height: height ? `${height}px` : 'auto',
    fontSize: fontSize ? `${fontSize}px` : 'inherit',
  };

  const baseStyles =
    'mb-6 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 transform transition-all duration-200 active:scale-98';

  const paddingStyles = !width && !height ? 'px-4 py-2 text-sm' : 'px-3';

  return (
    <button onClick={onClick} style={customStyles} className={`${baseStyles} ${paddingStyles}`}>
      {text}
    </button>
  );
}