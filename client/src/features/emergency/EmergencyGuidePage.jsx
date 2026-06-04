import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEVERITY } from './data/emergencies';
import { buildTriage, moreGuides } from './data/triage';
import { useSelectedChild } from '../../hooks/useChild';
import { track } from '../../lib/analytics';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import PageSEO from '../../components/seo/PageSEO';

const MEDICAL_WEB_PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'MedicalWebPage',
  name: 'Pediatric First-Aid Guide for Parents — ChildBloom',
  url: 'https://childbloom.in/emergency',
  description: 'Step-by-step pediatric first-aid guides for Indian parents. Covers infant CPR, choking, seizure, burns, fever, and more. Based on WHO and IAP guidelines.',
  audience: { '@type': 'Audience', audienceType: 'Parents and Caregivers' },
  medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
  about: { '@type': 'MedicalCondition', name: 'Pediatric First Aid' },
  publisher: { '@type': 'Organization', name: 'ChildBloom', url: 'https://childbloom.in' },
  lastReviewed: '2026-05-01',
  specialty: 'Pediatrics',
};

export default function EmergencyGuidePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const child = useSelectedChild();

  const tiles = buildTriage(child);
  const more = moreGuides();
  const childName = child?.name;

  // One sos_opened per open, regardless of entry point (FAB / Care / shortcut /
  // direct). The trigger is passed via navigation state where known.
  useEffect(() => {
    track('sos_opened', { trigger: location.state?.sosTrigger || 'direct' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openGuided = (topicId) => navigate(`/emergency/${topicId}/guided`);

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>
      <PageSEO
        title="Pediatric First-Aid Guide for Indian Parents — ChildBloom"
        description="Step-by-step first-aid for infant CPR, choking, anaphylaxis, seizure, burns and more. Read aloud, one step at a time, fully offline. Based on WHO and IAP guidelines."
        canonical="/emergency"
        structuredData={MEDICAL_WEB_PAGE_SCHEMA}
      />

      {/* Header */}
      <div style={{ padding: '52px 20px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.ink300, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {t('sos.fab')}
        </div>
        <h1 style={{ fontFamily: FONTS.serif, fontWeight: 600, fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.025em', color: T.ink900, margin: '4px 0 0' }}>
          {t('sos.triage.title')}
        </h1>
        <div style={{ fontSize: 14, color: T.ink500, marginTop: 6, lineHeight: 1.4 }}>
          {t('sos.triage.subtitle')}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Big triage tiles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          {tiles.map((tile) => {
            const sev = SEVERITY[tile.severity];
            return (
              <button
                key={tile.key}
                onClick={() => openGuided(tile.topicId)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: FONTS.sans,
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '18px 16px', borderRadius: RADIUS.lg,
                  background: tile.pinned ? sev.tint : T.surface,
                  border: `${tile.pinned ? 2 : 1}px solid ${tile.pinned ? sev.color : T.line}`,
                  boxShadow: tile.pinned ? `0 4px 18px ${sev.color}22` : '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'transform 0.12s ease',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.985)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: RADIUS.md, flexShrink: 0,
                  background: sev.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CBIcon name={tile.icon} size={26} stroke={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.ink900, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                    {tile.label}
                  </div>
                  {tile.pinned && childName && (
                    <div style={{ fontSize: 12, color: sev.color, fontWeight: 600, marginTop: 3 }}>
                      {t('sos.triage.pinned', { name: childName })}
                    </div>
                  )}
                </div>
                <CBIcon name="chevron-right" size={18} stroke={2.4} style={{ color: T.ink300, flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

        {/* More first-aid guides (read view) */}
        {more.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink300, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
              {t('sos.triage.more')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {more.map((item) => {
                const sev = SEVERITY[item.severity];
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/emergency/${item.id}`)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: FONTS.sans,
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                      borderRadius: RADIUS.lg, background: T.surface, border: `1px solid ${T.line}`,
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: RADIUS.md, background: sev.badgeBg, color: sev.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CBIcon name={item.icon} size={18} stroke={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.ink900 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: T.ink300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</div>
                    </div>
                    <CBIcon name="chevron-right" size={14} stroke={2.2} style={{ color: T.ink300, flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ background: T.surfaceDim, border: `1px solid ${T.line}`, borderRadius: RADIUS.md, padding: '12px 14px', textAlign: 'center', margin: '24px 0' }}>
          <div style={{ fontSize: 11, color: T.ink300, lineHeight: 1.5 }}>
            {t('sos.triage.disclaimer')}
          </div>
        </div>
      </div>
    </div>
  );
}
