import { useNavigate } from 'react-router-dom';
import { EMERGENCIES, SEVERITY } from './data/emergencies';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider,
} from '../../components/cb/primitives';
import PageSEO from '../../components/seo/PageSEO';

const MEDICAL_WEB_PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'MedicalWebPage',
  name: 'Pediatric First-Aid Guide for Parents — ChildBloom',
  url: 'https://childbloom.in/emergency',
  description: 'Step-by-step pediatric first-aid guides for Indian parents. Covers infant CPR, choking, seizure, burns, fever, and 11 more emergencies. Based on WHO and IAP guidelines.',
  audience: { '@type': 'Audience', audienceType: 'Parents and Caregivers' },
  medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
  about: { '@type': 'MedicalCondition', name: 'Pediatric First Aid' },
  publisher: { '@type': 'Organization', name: 'ChildBloom', url: 'https://childbloom.in' },
  lastReviewed: '2026-05-01',
  specialty: 'Pediatrics',
};

const SEVERITY_ORDER = ['critical', 'urgent', 'manageable'];

export default function EmergencyGuidePage() {
  const navigate = useNavigate();

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>
      <PageSEO
        title="Pediatric First-Aid Guide for Indian Parents — ChildBloom"
        description="Step-by-step first-aid guides for infant CPR, choking, seizure, burns, fever and 10 more pediatric emergencies. Based on WHO and IAP guidelines. Calm, visual, and always free."
        canonical="/emergency"
        structuredData={MEDICAL_WEB_PAGE_SCHEMA}
      />

      {/* Header */}
      <div style={{ paddingTop: 52 }}>
        <div style={{ padding: '4px 20px 16px' }}>
          <Eyebrow color={T.ink300}>EMERGENCY</Eyebrow>
          <Spacer h={4} />
          <Display size={34} italic weight={600} lh={1.05}>First-Aid Guide</Display>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Reassurance banner */}
        <div style={{
          background: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)',
          borderRadius: RADIUS.lg, padding: '16px 18px', color: '#FFFFFF',
          boxShadow: '0 6px 22px rgba(185,28,28,0.22)', marginBottom: 16,
        }}>
          <HRow gap={10} align="center" style={{ marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: RADIUS.sm, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CBIcon name="siren" size={18} stroke={2} />
            </div>
            <Body size={14} color="#fff" weight={700}>You can do this</Body>
          </HRow>
          <Body size={13} color="rgba(255,255,255,0.95)" lh={1.5}>
            If your child is in immediate danger, contact your local emergency number first. Then open the right guide below — each one walks you through the steps, calmly and at your pace.
          </Body>
        </div>

        {/* Severity legend */}
        <HRow gap={16} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {SEVERITY_ORDER.map(key => {
            const s = SEVERITY[key];
            return (
              <HRow key={key} gap={6} align="center">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                <Body size={11} color={T.ink500} weight={500}>{s.label}</Body>
              </HRow>
            );
          })}
        </HRow>

        {/* Topic groups */}
        {SEVERITY_ORDER.map(severity => {
          const group = EMERGENCIES.filter(e => e.severity === severity);
          if (group.length === 0) return null;
          const sev = SEVERITY[severity];

          return (
            <div key={severity} style={{ marginBottom: 22 }}>
              <Mono size={12} color={sev.color} style={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, padding: '0 4px' }}>
                {sev.label}
              </Mono>

              <Stack gap={8}>
                {group.map(item => (
                  <button key={item.id} onClick={() => navigate(`/emergency/${item.id}`)}
                    style={{
                      width: '100%', background: T.surface, border: `1px solid ${T.line}`,
                      borderRadius: RADIUS.lg, padding: '14px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 12,
                      fontFamily: FONTS.sans, boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'transform 0.12s ease, box-shadow 0.2s ease',
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.985)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: RADIUS.md, background: sev.badgeBg, color: sev.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CBIcon name={item.icon} size={20} stroke={1.8} />
                    </div>

                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Body size={15} color={T.ink900} weight={600}>{item.title}</Body>
                      <Body size={12} color={T.ink300} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</Body>
                    </Stack>

                    <div style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, color: sev.color, background: sev.badgeBg, padding: '3px 7px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>
                      {sev.label}
                    </div>
                    <CBIcon name="chevron-right" size={14} stroke={2.2} style={{ color: T.ink300, flexShrink: 0 }} />
                  </button>
                ))}
              </Stack>
            </div>
          );
        })}

        {/* Disclaimer */}
        <div style={{ background: T.surfaceDim, border: `1px solid ${T.line}`, borderRadius: RADIUS.md, padding: '12px 14px', textAlign: 'center', marginBottom: 24 }}>
          <Body size={11} color={T.ink300} lh={1.5}>
            For first-aid reference only. Always follow the advice of your child's doctor and local emergency services.
            If your child is in immediate danger, contact your local emergency number.
          </Body>
        </div>
      </div>
    </div>
  );
}
