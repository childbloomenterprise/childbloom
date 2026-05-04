import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import useChildStore from '../../stores/childStore';
import { useChildren, useSelectedChild } from '../../hooks/useChild';
import CBIcon from '../../components/cb/CBIcon';
import CBLargeTitle from '../../components/cb/CBLargeTitle';
import CBCell from '../../components/cb/CBCell';
import { T } from '../../components/cb/tokens';
import { differenceInDays, format } from 'date-fns';

function calcAge(dob) {
  if (!dob) return '';
  const days = differenceInDays(new Date(), new Date(dob));
  const months = Math.floor(days / 30);
  if (days < 30) return `${days} days old`;
  if (months < 24) return `${months} months old`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} yr ${m} mo old` : `${y} years old`;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: children = [] } = useChildren();
  const child = useSelectedChild();
  const { setSelectedChildId } = useChildStore();
  const [expandedChildId, setExpandedChildId] = useState(null);

  const handleChildClick = (c) => {
    setSelectedChildId(c.id);
    setExpandedChildId(prev => prev === c.id ? null : c.id);
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
      </div>

      {/* Child section */}
      <div style={{ padding: '0 20px 8px', fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Child</div>
      <div style={{ margin: '0 16px 18px', background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
        {children.map((c, i) => (
          <div key={c.id}>
            {/* Child row */}
            <button
              onClick={() => handleChildClick(c)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: `0.5px solid ${T.ink100}` }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 7, background: (c.id === child?.id ? T.forest600 : T.ink300) + '1f', color: c.id === child?.id ? T.forest600 : T.ink300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CBIcon name="user" size={17} stroke={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: T.ink700 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: T.ink300, marginTop: 1 }}>{calcAge(c.date_of_birth)}</div>
              </div>
              <CBIcon name={expandedChildId === c.id ? 'chevron-down' : 'chevron-right'} size={14} stroke={2.2} />
            </button>

            {/* Expanded child detail */}
            {expandedChildId === c.id && (
              <div style={{ padding: '14px 16px 16px', background: T.forest50, borderBottom: i < children.length - 1 ? `0.5px solid ${T.ink100}` : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Name</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink900 }}>{c.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Date of birth</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink900 }}>{c.date_of_birth ? format(new Date(c.date_of_birth), 'dd MMM yyyy') : '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Age</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.forest700 }}>{calcAge(c.date_of_birth)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Days old</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink900 }}>
                      {c.date_of_birth ? differenceInDays(new Date(), new Date(c.date_of_birth)) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <CBCell icon="plus" iconColor={T.blue} title="Add another child" divider={false} onClick={() => navigate('/onboarding')} />
      </div>

      {/* Privacy section */}
      <div style={{ padding: '0 20px 8px', fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Privacy & trust</div>
      <div style={{ margin: '0 16px 18px', background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
        <CBCell icon="lock" iconColor={T.ink500} title="Your data, your phone" sub="Stored encrypted on-device" />
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
