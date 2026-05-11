import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';
import { formatAgeInDays, formatDate } from '../../lib/formatters';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, ChromeBtn, AIBubble, Chip,
} from '../../components/cb/primitives';
import CBSegmented from '../../components/cb/CBSegmented';
import { RECORD_TYPES } from '../../lib/constants';

const TYPE_COLORS = {
  vaccination: { color: '#0A84FF', bg: '#E5F1FF' },
  checkup:     { color: T.brand,   bg: T.brandWash },
  illness:     { color: '#FF3B30', bg: '#FFF0EE' },
  milestone:   { color: '#34C759', bg: '#EDFBE8' },
};

function typeLabel(type) {
  return RECORD_TYPES.find(r => r.value === type)?.label || type;
}

export default function HealthRecordsPage() {
  const { t } = useTranslation();
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [vaccineTip, setVaccineTip] = useState(null);
  const [formData, setFormData] = useState({
    record_date: new Date().toISOString().split('T')[0],
    record_type: 'vaccination',
    title: '', doctor_name: '', clinic_name: '', notes: '', next_due_date: '',
  });

  const TABS = [
    { id: 'all',         label: t('health.all') },
    { id: 'vaccination', label: t('health.vaccines') },
    { id: 'checkup',     label: t('health.checkups') },
    { id: 'illness',     label: t('health.illness') },
  ];

  const { data: records, isLoading } = useQuery({
    queryKey: ['health-records', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_records').select('*')
        .eq('child_id', childId)
        .order('record_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (record) => {
      const { error } = await supabase.from('health_records').insert(record);
      if (error) throw error;
    },
    onMutate: async (newRecord) => {
      await queryClient.cancelQueries({ queryKey: ['health-records', childId] });
      const previous = queryClient.getQueryData(['health-records', childId]);
      queryClient.setQueryData(['health-records', childId], (old) => [
        { ...newRecord, id: `temp-${Date.now()}`, optimistic: true }, ...(old || []),
      ]);
      return { previous };
    },
    onError: (_err, _record, context) => {
      queryClient.setQueryData(['health-records', childId], context?.previous);
    },
    onSuccess: async (_data, _record) => {
      queryClient.invalidateQueries({ queryKey: ['health-records', childId] });
      const saved = { ...formData };
      setShowForm(false);
      setFormData({ record_date: new Date().toISOString().split('T')[0], record_type: 'vaccination', title: '', doctor_name: '', clinic_name: '', notes: '', next_due_date: '' });

      if (saved.record_type === 'vaccination' && child) {
        try {
          const response = await api.post('/api/ai/ask', {
            question: `${child.name} just received the ${saved.title} vaccine. In 1-2 warm sentences, what should I expect in the next day or two?`,
            child_name: child.name,
            age_in_days: child.date_of_birth ? formatAgeInDays(child.date_of_birth) : null,
            gender: child.gender,
            language: localStorage.getItem('childbloom_voice_lang') || 'en',
          });
          setVaccineTip({ vaccine: saved.title, tip: response.answer });
        } catch {
          setVaccineTip({ vaccine: saved.title, tip: t('health.vaccineTipUnavailable', { defaultValue: 'Tip is unavailable right now — try again in a moment.' }) });
        }
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['health-records', childId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('health_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-records', childId] }),
  });

  if (isLoading) return (
    <div style={{ padding: '20px 16px' }}>
      {[1, 2, 3].map(i => <div key={i} style={{ height: 80, background: T.line, borderRadius: RADIUS.md, marginBottom: 12, opacity: 0.4 }} />)}
    </div>
  );

  const filtered = activeTab === 'all' ? (records || []) : (records || []).filter(r => r.record_type === activeTab);

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: RADIUS.md,
    border: `0.5px solid ${T.line}`, fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: FONTS.sans,
    background: T.surface, color: T.ink900, marginBottom: 12,
  };

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>

      {/* Header */}
      <div style={{ paddingTop: 52, padding: '52px 20px 0' }}>
        <HRow justify="space-between" align="flex-end">
          <div>
            {child?.name && <Eyebrow color={T.ink300}>{child.name.toUpperCase()}</Eyebrow>}
            <Spacer h={4} />
            <Display size={30} italic weight={600} lh={1.05}>Health Records</Display>
          </div>
          <Button variant="primary" size="sm" icon="plus" onClick={() => setShowForm(true)}>Add</Button>
        </HRow>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Vaccine AI tip */}
        {vaccineTip && (
          <>
            <AIBubble lead={`Dr. Bloom on ${vaccineTip.vaccine}`} sparkle>
              {vaccineTip.tip}
            </AIBubble>
            <button onClick={() => setVaccineTip(null)}
              style={{ display: 'block', margin: '8px auto 0', fontSize: 12, color: T.ink300, background: 'none', border: 'none', cursor: 'pointer' }}>
              Dismiss
            </button>
            <Spacer h={12} />
          </>
        )}

        {/* Tab toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <CBSegmented value={activeTab} onChange={setActiveTab} options={TABS.map(t => ({ id: t.id, label: t.label }))} />
        </div>

        {/* Records list */}
        {filtered.length === 0 ? (
          <Card p={24} style={{ textAlign: 'center' }}>
            <Body size={14} color={T.ink300} style={{ marginBottom: 12 }}>
              {child?.name
                ? `Everything in one place — vaccines, checkups, illnesses. Start with the first entry for ${child.name}.`
                : 'No records yet. Add your first health entry.'}
            </Body>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>Add first record</Button>
          </Card>
        ) : (
          <Card p={0}>
            {filtered.map((record, i) => {
              const tc = TYPE_COLORS[record.record_type] || { color: T.ink500, bg: T.line };
              return (
                <div key={record.id}>
                  <HRow gap={12} style={{ padding: '14px 14px' }} align="flex-start">
                    <div style={{ width: 36, height: 36, borderRadius: RADIUS.sm, background: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CBIcon name="shield" size={16} />
                    </div>
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <HRow gap={6} align="center">
                        <Body size={14} color={T.ink900} weight={600}>{record.title}</Body>
                        <div style={{ padding: '2px 7px', borderRadius: 999, background: tc.bg, color: tc.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
                          {typeLabel(record.record_type)}
                        </div>
                      </HRow>
                      <Mono size={11} color={T.ink400}>{formatDate(record.record_date)}</Mono>
                      {(record.doctor_name || record.clinic_name) && (
                        <Body size={11} color={T.ink500}>
                          {[record.doctor_name && `Dr. ${record.doctor_name}`, record.clinic_name].filter(Boolean).join(' · ')}
                        </Body>
                      )}
                      {record.notes && <Body size={11} color={T.ink500}>{record.notes}</Body>}
                      {record.next_due_date && (
                        <Body size={11} color={T.gold} weight={500}>Next due: {formatDate(record.next_due_date)}</Body>
                      )}
                    </Stack>
                    <button onClick={() => deleteMutation.mutate(record.id)}
                      style={{ padding: 6, borderRadius: RADIUS.sm, background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink300, flexShrink: 0, lineHeight: 1 }}>
                      <CBIcon name="trash" size={16} />
                    </button>
                  </HRow>
                  {i < filtered.length - 1 && <Divider />}
                </div>
              );
            })}
          </Card>
        )}

        <Spacer h={24} />
      </div>

      {/* Add record sheet */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.surface, borderRadius: '24px 24px 0 0', padding: '20px 20px max(calc(env(safe-area-inset-bottom) + 24px), 36px)', zIndex: 201, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.line, margin: '0 auto 20px' }} />
            <Display size={20} italic weight={600} style={{ marginBottom: 20 }}>Something happened — let's note it</Display>

            <Mono size={11} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Date</Mono>
            <input type="date" value={formData.record_date}
              onChange={e => setFormData({ ...formData, record_date: e.target.value })}
              style={inputStyle} />

            <Mono size={11} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Record type</Mono>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {RECORD_TYPES.map(type => (
                <button key={type.value}
                  onClick={() => setFormData({ ...formData, record_type: type.value })}
                  style={{
                    padding: '10px 12px', borderRadius: RADIUS.md, fontSize: 13, fontWeight: 500,
                    border: `2px solid ${formData.record_type === type.value ? T.brand : T.line}`,
                    background: formData.record_type === type.value ? T.brandWash : T.surface,
                    color: formData.record_type === type.value ? T.brand : T.ink500,
                    cursor: 'pointer', fontFamily: FONTS.sans,
                  }}>
                  {type.label}
                </button>
              ))}
            </div>

            {[
              { label: 'Title', key: 'title', placeholder: t('health.titlePlaceholder') },
              { label: 'Doctor name', key: 'doctor_name', placeholder: t('health.doctorPlaceholder') },
              { label: 'Clinic', key: 'clinic_name', placeholder: t('health.clinicPlaceholder') },
              { label: 'Notes (optional)', key: 'notes', placeholder: t('health.notesPlaceholder') },
            ].map(f => (
              <div key={f.key}>
                <Mono size={11} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{f.label}</Mono>
                <input type="text" value={formData[f.key]} placeholder={f.placeholder}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                  style={inputStyle} />
              </div>
            ))}

            <Mono size={11} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Next due date</Mono>
            <input type="date" value={formData.next_due_date}
              onChange={e => setFormData({ ...formData, next_due_date: e.target.value })}
              style={{ ...inputStyle, marginBottom: 20 }} />

            <Button variant="primary" full
              onClick={() => addMutation.mutate({
                child_id: childId, user_id: user.id,
                record_date: formData.record_date, record_type: formData.record_type,
                title: formData.title, doctor_name: formData.doctor_name || null,
                clinic_name: formData.clinic_name || null, notes: formData.notes || null,
                next_due_date: formData.next_due_date || null,
              })}
              disabled={addMutation.isPending || !formData.title.trim()}>
              {addMutation.isPending ? 'Saving...' : t('health.saveRecord')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
