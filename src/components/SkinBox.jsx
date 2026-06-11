export function SkinBox({ skin, size = 'w-56 h-56', glow = true, className = '' }) {
  const hex = skin?.hex || skin?.rarityHex || '#475569';
  const glowVal = skin?.glow || skin?.rarityGlow || 'rgba(71,85,105,0.2)';

  return (
    <div
      className={`${size} rounded-2xl flex items-center justify-center border-2 ${className}`}
      style={{
        borderColor: hex,
        backgroundColor: glowVal,
        boxShadow: glow ? `0 0 50px ${glowVal}` : 'none',
      }}
    >
      {skin?.image ? (
        <img
          src={skin.image}
          alt={skin.name}
          className="w-full h-full object-contain rounded-xl p-2"
          onError={(e) => {
            e.target.style.display = 'none';
            const f = document.createElement('span');
            f.className = 'text-5xl font-black opacity-40';
            f.style.color = hex;
            f.textContent = '?';
            e.target.parentElement.appendChild(f);
          }}
        />
      ) : (
        <span className="text-5xl font-black opacity-30 text-slate-600">?</span>
      )}
    </div>
  );
}
