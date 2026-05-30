import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildren, useSelectedChild } from '../../hooks/useChild';
import useChildStore from '../../stores/childStore';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, Avatar,
} from '../../components/cb/primitives';
import { differenceInDays } from 'date-fns';
import { usePremium } from '../../hooks/usePremium';

function calcAge(dob) {
  if (!dob) return '';
  const days = differenceInDays(new Date(), new Date(dob));
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

function calcAgeVerbose(dob) {
  if (!dob) return null;
  const days = differenceInDays(new Date(), new Date(dob));
  if (days < 30) return `${days} days old`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months} months old`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} yr ${m} mo old` : `${y} years old`;
}

function DetailCell({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Mono size={10} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>
        {label}
      </Mono>
      <Body size={14} color={T.ink900} weight={500}>{value || '—'}</Body>
    </div>
  );
}

function EditSheet({ child, onClose, onSave }) {
  const [form, setForm] = useState({
    name:                      child.name || '',
    gender:                    child.gender || '',
    birth_weight_grams:        child.birth_weight_grams ?? '',
    gestational_age_at_birth:  child.gestational_age_at_birth ?? '',
    blood_group:               child.blood_group || '',
    known_allergies:           (child.known_allergies || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name:                      form.name.trim(),
        gender:                    form.gender || null,
        birth_weight_grams:        form.birth_weight_grams !== '' ? parseInt(form.birth_weight_grams) : null,
        gestational_age_at_birth:  form.gestational_age_at_birth !== '' ? parseInt(form.gestational_age_at_birth) : null,
        blood_group:               form.blood_group.trim() || null,
        known_allergies:           form.known_allergies ? form.known_allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      const { error: err } = await supabase.from('children').update(payload).eq('id', child.id);
      if (err) throw err;
      onSave();
    } catch (err) {
      setError(err?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1px solid ${T.line}`, background: T.surface, outline: 'none',
    fontSize: 14, color: T.ink900, fontFamily: FONTS.sans, boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: T.ink400, textTransform: 'uppercase',
    letterSpacing: '0.07em', display: 'block', marginBottom: 6,
  };

  const sheetRef = useRef(null);
  useFocusTrap(sheetRef, true, onClose);

  return (
    <>
      {/* Backdrop */}
      <div aria-hidden="true" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(11,23,20,0.4)', zIndex: 80 }} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Edit child profile"
        tabIndex={-1}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 90,
          background: T.bg, borderRadius: '20px 20px 0 0',
          padding: '0 16px', paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 24px, 32px)',
          maxHeight: '85dvh', overflowY: 'auto',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.line, margin: '12px auto 20px' }} />
        <HRow justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <Body size={17} weight={700} color={T.ink900}>Edit child profile</Body>
          <button onClick={onClose} aria-label="Close edit dialog" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.ink400 }}>
            <CBIcon name="x" size={20} aria-hidden="true" />
          </button>
        </HRow>

        <Stack gap={16}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={form.name} onChange={e => update('name', e.target.value)} placeholder="Child's name" />
          </div>

          <div>
            <label style={labelStyle}>Gender</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['male', 'female', 'other'].map(g => (
                <button key={g}
                  type="button"
                  aria-pressed={form.gender === g}
                  aria-label={`Gender: ${g}`}
                  onClick={() => update('gender', g)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${form.gender === g ? T.brand : T.line}`,
                    background: form.gender === g ? T.brandTint : T.surface,
                    color: form.gender === g ? T.brand : T.ink700, fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <HRow gap={12}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Birth weight (g)</label>
              <input style={inputStyle} type="number" value={form.birth_weight_grams} onChange={e => update('birth_weight_grams', e.target.value)} placeholder="e.g. 3100" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Gestational age (wk)</label>
              <input style={inputStyle} type="number" value={form.gestational_age_at_birth} onChange={e => update('gestational_age_at_birth', e.target.value)} placeholder="e.g. 38" />
            </div>
          </HRow>

          <div>
            <label style={labelStyle}>Blood group</label>
            <input style={inputStyle} value={form.blood_group} onChange={e => update('blood_group', e.target.value)} placeholder="e.g. A+, O-, AB+" />
          </div>

          <div>
            <label style={labelStyle}>Known allergies (comma-separated)</label>
            <input style={inputStyle} value={form.known_allergies} onChange={e => update('known_allergies', e.target.value)} placeholder="e.g. Peanuts, Milk" />
          </div>
        </Stack>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: `0.5px solid rgba(220,38,38,0.2)` }}>
            <Body size={13} color="#DC2626">{error}</Body>
          </div>
        )}

        <Spacer h={24} />
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          style={{
            width: '100%', height: 50, borderRadius: 14, border: 'none',
            background: saving || !form.name.trim() ? T.ink200 : T.brand,
            color: saving || !form.name.trim() ? T.ink400 : '#fff',
            fontSize: 15, fontWeight: 600, cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
          }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </>
  );
}

export default function FamilyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: children = [] } = useChildren();
  const child = useSelectedChild();
  const { setSelectedChildId } = useChildStore();
  const { isPremium } = usePremium();
  const [editOpen, setEditOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleSave = async () => {
    await queryClient.invalidateQueries({ queryKey: ['children'] });
    setEditOpen(false);
  };

  const handleDownloadReport = async () => {
    if (!child?.id || downloading) return;
    if (!isPremium) { navigate('/premium'); return; }
    setDownloading(true);
    try {
      const { downloadChildReport } = await import('../../lib/childReportPdf');
      await downloadChildReport(child.id);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const birthWeightDisplay = child?.birth_weight_grams
    ? `${(child.birth_weight_grams / 1000).toFixed(1)} kg`
    : null;

  const gestAgeDisplay = child?.gestational_age_at_birth
    ? `${child.gestational_age_at_birth} weeks`
    : null;

  const allergiesDisplay = child?.known_allergies?.length
    ? child.known_allergies.join(', ')
    : 'None';

  const genderDisplay = child?.gender
    ? child.gender.charAt(0).toUpperCase() + child.gender.slice(1)
    : null;

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingTop: 52 }}>

      {/* Header */}
      <div style={{ padding: '4px 20px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow color={T.ink300}>FAMILY</Eyebrow>
          <Spacer h={4} />
          <Display size={30} italic weight={500} lh={1.05}>Your family</Display>
        </div>
        <button onClick={() => navigate(-1)}
          aria-label="Close family page"
          style={{ width: 34, height: 34, borderRadius: 999, background: T.surfaceDim, border: 'none',
                   cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink500 }}>
          <CBIcon name="x" size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Children horizontal scroll */}
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: 10, paddingRight: 16, width: 'max-content' }}>
          {children.map(c => {
            const active = child?.id === c.id;
            return (
              <button key={c.id} onClick={() => setSelectedChildId(c.id)}
                aria-pressed={active}
                aria-label={`${active ? 'Currently selected: ' : 'Switch to '}${c.name}, ${calcAge(c.date_of_birth)}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '14px 16px', borderRadius: 16, border: `1.5px solid ${active ? T.brand : T.line}`,
                  background: active ? T.brandTint : T.surface, cursor: 'pointer',
                  transition: 'all 0.18s', minWidth: 80,
                }}>
                <Avatar name={(c.name || 'A')[0]} size={44} tone={active ? 'brand' : 'soft'} />
                <Body size={13} weight={600} color={active ? T.brand : T.ink900}>{c.name}</Body>
                <Mono size={10} color={active ? T.brand : T.ink400}>{calcAge(c.date_of_birth)}</Mono>
              </button>
            );
          })}

          {/* Add child */}
          <button onClick={() => navigate('/onboarding')}
            aria-label="Add another child"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '14px 16px', borderRadius: 16, border: `1.5px dashed ${T.line}`,
              background: 'transparent', cursor: 'pointer', minWidth: 80,
            }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, border: `1.5px dashed ${T.line}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink400 }}>
              <CBIcon name="plus" size={18} />
            </div>
            <Body size={13} weight={500} color={T.ink400}>Add</Body>
          </button>
        </div>
      </div>

      <Spacer h={20} />

      {/* Child details */}
      {child ? (
        <div style={{ padding: '0 16px' }}>
          <Card p={18}>
            {/* Top row: avatar + name + edit */}
            <HRow gap={14} align="flex-start">
              <Avatar name={(child.name || 'A')[0]} size={56} tone="brand" />
              <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                <Display size={20} italic weight={500}>{child.name}</Display>
                <Body size={12} color={T.ink500}>{calcAgeVerbose(child.date_of_birth)}</Body>
              </Stack>
              <button onClick={() => setEditOpen(true)}
                style={{ width: 34, height: 34, borderRadius: 999, background: T.surfaceDim, border: 'none',
                         cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink500 }}>
                <CBIcon name="edit" size={15} />
              </button>
            </HRow>

            <Spacer h={20} />
            <Divider />
            <Spacer h={16} />

            <Eyebrow color={T.ink300} style={{ marginBottom: 14 }}>Profile details</Eyebrow>

            <Stack gap={16}>
              <HRow gap={12}>
                <DetailCell label="Birthday"
                  value={child.date_of_birth
                    ? new Date(child.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : null} />
                <DetailCell label="Gender" value={genderDisplay} />
              </HRow>
              <Divider />
              <HRow gap={12}>
                <DetailCell label="Gestational age" value={gestAgeDisplay} />
                <DetailCell label="Birth weight" value={birthWeightDisplay} />
              </HRow>
              <Divider />
              <HRow gap={12}>
                <DetailCell label="Blood group" value={child.blood_group} />
                <DetailCell label="Allergies" value={allergiesDisplay} />
              </HRow>
            </Stack>
          </Card>

          <Spacer h={20} />

          <Card p={0}>
            <button onClick={() => navigate(`/child/${child.id}/bloom`)}
              aria-label="Open Bloom Path"
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <HRow gap={12} align="center" style={{ padding: '14px 16px' }}>
                <CBIcon name="sparkle" size={18} style={{ color: T.brand }} aria-hidden="true" />
                <Body size={14} weight={500} color={T.ink900} style={{ flex: 1 }}>Bloom Path</Body>
                <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} aria-hidden="true" />
              </HRow>
            </button>
            <Divider />
            <button onClick={() => navigate(`/child/${child.id}/growth`)}
              aria-label="Open growth records"
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <HRow gap={12} align="center" style={{ padding: '14px 16px' }}>
                <CBIcon name="growth" size={18} style={{ color: T.brand }} aria-hidden="true" />
                <Body size={14} weight={500} color={T.ink900} style={{ flex: 1 }}>Growth records</Body>
                <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} aria-hidden="true" />
              </HRow>
            </button>
            <Divider />
            <button onClick={() => navigate(`/child/${child.id}/vaccinations`)}
              aria-label="Open vaccinations"
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <HRow gap={12} align="center" style={{ padding: '14px 16px' }}>
                <CBIcon name="shield" size={18} style={{ color: T.brand }} aria-hidden="true" />
                <Body size={14} weight={500} color={T.ink900} style={{ flex: 1 }}>Vaccinations</Body>
                <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} aria-hidden="true" />
              </HRow>
            </button>
            <Divider />
            <button onClick={() => navigate(`/child/${child.id}/health`)}
              aria-label="Open health records"
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <HRow gap={12} align="center" style={{ padding: '14px 16px' }}>
                <CBIcon name="heart-pulse" size={18} style={{ color: T.brand }} aria-hidden="true" />
                <Body size={14} weight={500} color={T.ink900} style={{ flex: 1 }}>Health records</Body>
                <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} aria-hidden="true" />
              </HRow>
            </button>
          </Card>

          <Spacer h={20} />

          {/* Doctor-ready PDF */}
          <Card p={18} tone="warm">
            <HRow gap={12} align="flex-start">
              <div style={{
                width: 38, height: 38, borderRadius: RADIUS.md, background: T.brandWash,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: T.brand,
              }}>
                <CBIcon name="note" size={18} stroke={1.8} />
              </div>
              <Stack gap={4} style={{ flex: 1 }}>
                <Body size={14} weight={700} color={T.ink900}>Doctor-ready report</Body>
                <Body size={12} color={T.ink500} lh={1.5}>
                  Download a printable PDF with {child.name}'s full record — growth, vaccinations, weekly check-ins, feeding logs, and health history.
                </Body>
              </Stack>
            </HRow>
            <Spacer h={14} />
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              style={{
                width: '100%', height: 46, borderRadius: 999, border: 'none',
                background: downloading ? T.ink200 : T.brand,
                color: downloading ? T.ink400 : '#fff',
                fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600,
                cursor: downloading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.18s',
              }}>
              {downloading ? (
                <>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Generating PDF…
                </>
              ) : (
                <>
                  <CBIcon name="share" size={15} stroke={1.8} />
                  Download PDF for pediatrician
                </>
              )}
            </button>
          </Card>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          <Card p={24} style={{ textAlign: 'center' }}>
            <Body size={15} color={T.ink500}>No child selected. Tap a child above or add one.</Body>
          </Card>
        </div>
      )}

      <Spacer h={32} />

      {/* Edit sheet */}
      {editOpen && child && (
        <EditSheet child={child} onClose={() => setEditOpen(false)} onSave={handleSave} />
      )}
    </div>
  );
}
