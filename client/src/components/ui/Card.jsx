// Dark glass card — matches dock aesthetic from prompt
export default function Card({ children, className = '', hover = false, onClick, accent, ...props }) {
  return (
    <div
      className={`
        rounded-2xl border border-white/10
        transition-all duration-300 ease-out
        ${hover ? 'cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/20 active:scale-[0.99]' : ''}
        ${className}
      `}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
