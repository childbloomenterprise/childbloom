import Button from '../ui/Button';

/**
 * EmptyState — warm, context-aware invitation.
 *
 * Props:
 *   title       string  — headline
 *   description string  — supporting copy
 *   actionLabel string? — CTA button label
 *   onAction    fn?     — CTA handler
 *   icon        node?   — icon element
 *   subtle      bool?   — smaller, less padding variant
 */
export default function EmptyState({ title, description, actionLabel, onAction, icon, subtle }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center animate-fade-in-up ${subtle ? 'py-10 px-4' : 'py-20 px-4'}`}>
      {icon && (
        <div className="w-16 h-16 bg-forest-50 rounded-2xl flex items-center justify-center mb-5">
          <div className="text-forest-500">{icon}</div>
        </div>
      )}
      <h3 className="text-h3 font-serif text-forest-700 mb-2 leading-snug">{title}</h3>
      <p className="text-body text-gray-500 max-w-sm mb-7 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg">{actionLabel}</Button>
      )}
    </div>
  );
}
