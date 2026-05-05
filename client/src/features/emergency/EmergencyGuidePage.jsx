import { useNavigate } from 'react-router-dom';
import { EMERGENCIES, SEVERITY } from './data/emergencies';
import CBLargeTitle from '../../components/cb/CBLargeTitle';
import CBIcon from '../../components/cb/CBIcon';
import { T } from '../../components/cb/tokens';
import PageSEO from '../../components/seo/PageSEO';

const MEDICAL_WEB_PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'MedicalWebPage',
  name: 'Pediatric First-Aid Guide for Parents — ChildBloom',
  url: 'https://childbloom.in/emergency',
  description: 'Step-by-step pediatric first-aid guides for Indian parents. Covers infant CPR, choking, seizure, burns, fever, and 11 more emergencies. Based on WHO and IAP guidelines.',
  audience: {
    '@type': 'Audience',
    audienceType: 'Parents and Caregivers',
  },
  medicalAudience: {
    '@type': 'MedicalAudience',
    audienceType: 'Patient',
  },
  about: {
    '@type': 'MedicalCondition',
    name: 'Pediatric First Aid',
  },
  publisher: {
    '@type': 'Organization',
    name: 'ChildBloom',
    url: 'https://childbloom.in',
  },
  lastReviewed: '2026-05-01',
  specialty: 'Pediatrics',
};

const SEVERITY_ORDER = ['critical', 'urgent', 'manageable'];

export default function EmergencyGuidePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      background: T.bg,
      minHeight: '100dvh',
      fontFamily: "-apple-system, 'Inter', system-ui, sans-serif",
    }}>
      <PageSEO
        title="Pediatric First-Aid Guide for Indian Parents — ChildBloom"
        description="Step-by-step first-aid guides for infant CPR, choking, seizure, burns, fever and 10 more pediatric emergencies. Based on WHO and IAP guidelines. Calm, visual, and always free."
        canonical="/emergency"
        structuredData={MEDICAL_WEB_PAGE_SCHEMA}
      />
      <div style={{ paddingTop: 52 }}>
        <CBLargeTitle eyebrow="EMERGENCY" title="First-Aid Guide" />
      </div>

      {/* Reassurance banner */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{
          background: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)',
          borderRadius: 20,
          padding: '16px 18px',
          color: '#FFFFFF',
          boxShadow: '0 6px 22px rgba(185,28,28,0.22)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CBIcon name="siren" size={18} stroke={2} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
              You can do this
            </div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.95, letterSpacing: '-0.005em' }}>
            If your child is in immediate danger, contact your local emergency number first. Then open the right guide below — each one walks you through the steps, calmly and at your pace.
          </div>
        </div>
      </div>

      {/* Severity legend */}
      <div style={{ padding: '0 20px', marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {SEVERITY_ORDER.map(key => {
          const s = SEVERITY[key];
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: s.color,
              }} />
              <span style={{ fontSize: 11, color: T.ink500, fontWeight: 500, letterSpacing: '-0.005em' }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Topic groups */}
      {SEVERITY_ORDER.map(severity => {
        const group = EMERGENCIES.filter(e => e.severity === severity);
        if (group.length === 0) return null;
        const sev = SEVERITY[severity];

        return (
          <div key={severity} style={{ marginBottom: 22 }}>
            <div style={{
              padding: '0 24px',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: sev.color, marginBottom: 8,
            }}>
              {sev.label}
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/emergency/${item.id}`)}
                  style={{
                    width: '100%',
                    background: T.card,
                    border: `1px solid ${T.ink100}`,
                    borderRadius: 16,
                    padding: '14px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', textAlign: 'left',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'transform 0.12s ease, box-shadow 0.2s ease',
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.985)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: sev.badgeBg,
                    color: sev.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <CBIcon name={item.icon} size={20} stroke={1.8} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 600, color: T.ink900,
                      letterSpacing: '-0.01em',
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: 12, color: T.ink300, marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.subtitle}
                    </div>
                  </div>

                  <div style={{
                    flexShrink: 0,
                    fontSize: 9, fontWeight: 800, color: sev.color,
                    background: sev.badgeBg,
                    padding: '3px 7px', borderRadius: 999,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    marginRight: 4,
                  }}>
                    {sev.label}
                  </div>
                  <CBIcon name="chevron-right" size={14} stroke={2.2} />
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Disclaimer */}
      <div style={{ padding: '8px 16px 24px' }}>
        <div style={{
          background: T.bgWarm,
          border: `1px solid ${T.ink100}`,
          borderRadius: 14,
          padding: '12px 14px',
          fontSize: 11, color: T.ink300,
          textAlign: 'center', lineHeight: 1.5,
        }}>
          For first-aid reference only. Always follow the advice of your child's doctor and local emergency services. If your child is in immediate danger, contact your local emergency number.
        </div>
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}
