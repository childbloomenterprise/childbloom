import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CBIcon from './CBIcon';
import { FONTS } from './tokens';
import useUiStore from '../../stores/uiStore';

// Persistent floating SOS button → one tap to the emergency triage screen.
// Shown only on the two hub screens (Home + Care) to keep the rest of the app
// visually calm; global reach is also provided by the Android app-shortcut.
const HUB_ROUTES = ['/dashboard', '/care'];

export default function SosButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const modalOpen = useUiStore((s) => s.modalCount > 0);

  if (!HUB_ROUTES.includes(pathname)) return null;
  // A modal/bottom-sheet owns the screen — don't float over it.
  if (modalOpen) return null;

  const go = () => {
    try { navigator.vibrate?.(12); } catch { /* noop */ }
    navigate('/emergency', { state: { sosTrigger: 'fab' } });
  };

  return (
    <button
      onClick={go}
      aria-label={t('sos.fabAria')}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(88px + env(safe-area-inset-bottom, 0px) + 16px)',
        zIndex: 110,
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '12px 16px 12px 14px', borderRadius: 999, border: 'none',
        background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        color: '#fff', cursor: 'pointer', fontFamily: FONTS.sans,
        fontSize: 14, fontWeight: 800, letterSpacing: '0.02em',
        boxShadow: '0 6px 20px rgba(220,38,38,0.42)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <CBIcon name="siren" size={20} stroke={2.2} />
      SOS
    </button>
  );
}
