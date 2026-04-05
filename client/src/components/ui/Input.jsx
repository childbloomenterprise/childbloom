import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, type = 'text', className = '', ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-caption font-semibold text-white/60 tracking-tight">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`input-field ${error ? '!border-red-500/40 focus:!border-red-400/60 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1 animate-fade-in mt-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
