import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import useChildStore from '../../stores/childStore';
import { useChildren, useSelectedChild } from '../../hooks/useChild';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';
import CBLargeTitle from '../../components/cb/CBLargeTitle';
import CBCell from '../../components/cb/CBCell';
import { T } from '../../components/cb/tokens';
import { differenceInDays } from 'date-fns';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { id: 'en', name: 'English',   native: 'English' },
  { id: 'hi', name: 'Hindi',     native: 'हिन्दी' },
  { id: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { id: 'ta', name: 'Tamil',     native: 'தமிழ்' },
  { id: 'te', name: 'Telugu',    native: 'తెలుగు' },
  { id: 'pa', name: 'Punjabi',   native: 'ਪੰਜਾਬੀ' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: children = [] } = useChildren();
  const child = useSelectedChild();
  const { setSelectedChildId } = useChildStore();
  const [lang, setLang] = useState(i18n.language || 'en');

  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const handleLangChange = (id) => {
    setLang(id);
    i18n.changeLanguage(id);
    localStorage.setItem('i18nextLng', id);
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
      clearAuth();
    },
    onSuccess: () => navigate('/auth'),
  });

  const parentInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'P';
  const parentName = user?.user_metadata?.full_name || user?.email || 'Parent';

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: "-apple-system, 'Inter', system-ui, sans-serif" }}>
      <div style={{ paddingTop: 52 }}>
        <CBLargeTitle title="Settings" />
      </div>

      {/* Profile card */}
      <div style={{ margin: '0 16px 18px', background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.forest700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 600, flexShrink: 0 }}>
          {parentInitial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.ink900, letterSpacing: '-0.005em' }}>{parentName}</div>
          <div style={{ fontSize: 12, color: T.ink300, marginTop: 1 }}>{user?.email}</div>
        </div>
        <CBIcon name="chevron-right" size={16} />
      </div>

      {/* Language */}
      <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Language</div>
        <div style={{ fontSize: 11, color: T.ink300 }}>Dr. Bloom speaks 6</div>
      </div>
      <div style={{ margin: '0 16px 18px', background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
        {LANGS.map((l, i) => (
          <button key={l.id} onClick={() => handleLangChange(l.id)}
            style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: 'none', borderBottom: i < LANGS.length - 1 ? `0.5px solid ${T.ink100}` : 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: T.forest50, color: T.forest700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              {l.native[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.ink900 }}>{l.name}</div>
              <div style={{ fontSize: 12, color: T.ink300, marginTop: 1 }}>{l.native}</div>
            </div>
            {lang === l.id && <CBIcon name="check" size={17} stroke={2.4} />}
          </button>
        ))}
      </div>

      {/* Child section */}
      <div style={{ padding: '0 20px 8px', fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Child</div>
      <div style={{ margin: '0 16px 18px', background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
        {children.map((c, i) => (
          <CBCell key={c.id} icon="user" iconColor={T.forest600}
            title={c.name}
            sub={ageInDays != null && c.id === child?.id ? `${ageInDays} days · ${ageInDays <= 30 ? 'Newborn' : ageInDays <= 365 ? 'Infant' : 'Toddler'}` : c.date_of_birth}
            divider={i < children.length - 1}
            onClick={() => setSelectedChildId(c.id)}
          />
        ))}
        <CBCell icon="plus" iconColor={T.blue} title="Add another child" divider={false} onClick={() => navigate('/onboarding')} />
      </div>

      {/* Bloom AI section */}
      <div style={{ padding: '0 20px 8px', fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bloom AI</div>
      <div style={{ margin: '0 16px 18px', background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
        <CBCell icon="sparkle" iconColor={T.forest600} title="Voice & tone" value="Warm, calm" />
        <CBCell icon="bell" iconColor={T.orange} title="Daily nudges" value="9:00 AM" />
        <CBCell icon="shield" iconColor={T.red} title="Red-flag alerts" value="On" divider={false} />
      </div>

      {/* Privacy section */}
      <div style={{ padding: '0 20px 8px', fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Privacy & trust</div>
      <div style={{ margin: '0 16px 18px', background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
        <CBCell icon="lock" iconColor={T.ink500} title="Your data, your phone" sub="Stored encrypted on-device" onClick={() => navigate('/privacy')} />
        <CBCell icon="book" iconColor={T.ink500} title="Pediatrician sources" sub="IAP, WHO, AAP" divider={false} />
      </div>

      {/* Sign out */}
      <div style={{ margin: '0 16px 18px' }}>
        <button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#fff', border: `0.5px solid ${T.ink100}`, color: T.red, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CBIcon name="logout" size={18} />
          {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      <div style={{ textAlign: 'center', padding: '8px 0 24px', fontSize: 11, color: T.ink300 }}>
        ChildBloom · made with care in Bengaluru
      </div>
    </div>
  );
}
