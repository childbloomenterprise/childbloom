// "From your doctor" — the parent-facing view of everything a connected doctor
// authored in Dr. Bloom: the care team, prescriptions, visit notes and
// doctor-recorded vaccines. This is the data-parity surface (Stage 1 of the
// Dr. Bloom <-> ChildBloom unification): before this page, doctor-written data
// only reached the parent as a transient toast. Now it lives natively in the app
// and refreshes live the moment the doctor saves something.
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChildById } from '../../hooks/useChild';
import {
  useConnectedDoctors, useConsultations, usePrescriptions,
  useDoctorVaccines, useDoctorCareRealtime,
} from '../../hooks/useDoctorCare';
import { formatDate } from '../../lib/formatters';
import {
  buildDoctorNameMap, doctorLabel, formatRxLine,
  groupPrescriptions, visitTypeMeta, hasAnyDoctorData,
} from '../../lib/doctorCare';
import CBIcon from '../../components/cb/CBIcon';
import CBSegmented from '../../components/cb/CBSegmented';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel,
} from '../../components/cb/primitives';

const TONE_COLORS = {
  brand:  { color: T.brand,  bg: T.brandWash },
  danger: { color: T.danger, bg: '#FFF0EE' },
  blue:   { color: T.blue,   bg: '#E5F1FF' },
};

function SectionIcon({ name, tone = 'brand' }) {
  const tc = TONE_COLORS[tone] || TONE_COLORS.brand;
  return (
    <div style={{
      width: 32, height: 32, borderRadius: RADIUS.md, background: tc.bg, color: tc.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <CBIcon name={name} size={16} stroke={1.8} />
    </div>
  );
}

export default function DoctorCarePage() {
  const { t } = useTranslation();
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);

  useDoctorCareRealtime(childId);
  const { data: doctors = [],   isLoading: lD } = useConnectedDoctors(childId);
  const { data: visits = [],    isLoading: lV } = useConsultations(childId);
  const { data: rx = [],        isLoading: lR } = usePrescriptions(childId);
  const { data: vaccines = [],  isLoading: lX } = useDoctorVaccines(childId);

  const [rxTab, setRxTab] = useState('active');
  const [expanded, setExpanded] = useState({});

  const isLoading = lD || lV || lR || lX;
  const nameMap = buildDoctorNameMap(doctors);
  const { active: activeRx, past: pastRx } = groupPrescriptions(rx);
  const shownRx = rxTab === 'active' ? activeRx : pastRx;
  const childName = child?.first_name || child?.name || t('doctorcare.yourChild', { defaultValue: 'your child' });

  const tr = (key, fallback, opts) => t(key, { defaultValue: fallback, ...(opts || {}) });

  if (isLoading) {
    return (
      <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', padding: '72px 16px 0' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 84, background: T.line, borderRadius: RADIUS.md, marginBottom: 12, opacity: 0.4 }} />
        ))}
      </div>
    );
  }

  const empty = !hasAnyDoctorData({ doctors, visits, prescriptions: rx, vaccines });

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>

      {/* Header */}
      <div style={{ paddingTop: 52, padding: '52px 20px 0' }}>
        {child?.name && <Eyebrow color={T.ink300}>{(child.first_name || child.name).toUpperCase()}</Eyebrow>}
        <Spacer h={4} />
        <Display size={30} italic weight={600} lh={1.05}>{tr('doctorcare.title', 'From your doctor')}</Display>
        <Spacer h={6} />
        <Body size={13} color={T.ink500}>{tr('doctorcare.subtitle', 'Visits, prescriptions and vaccines your doctor recorded')}</Body>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {empty ? (
          <Card p={24} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <SectionIcon name="doctor" />
            </div>
            <Display size={20} italic weight={500} style={{ marginBottom: 8 }}>
              {tr('doctorcare.empty.title', 'Nothing from a doctor yet')}
            </Display>
            <Body size={13} color={T.ink500}>
              {child
                ? tr('doctorcare.empty.body', `When a doctor connects to ${childName} in Dr. Bloom and you approve, their visit notes, prescriptions and vaccines appear here automatically.`, { name: childName })
                : tr('doctorcare.empty.bodyNoChild', 'When a doctor connects to your child and you approve, their visit notes, prescriptions and vaccines appear here automatically.')}
            </Body>
          </Card>
        ) : (
          <>
            {/* Care team */}
            {doctors.length > 0 && (
              <>
                <SectionLabel title={tr('doctorcare.doctors.title', 'Your care team')} />
                <Card p={0}>
                  {doctors.map((d, i) => (
                    <div key={d.id}>
                      <HRow gap={12} style={{ padding: '14px 14px' }} align="center">
                        <SectionIcon name="doctor" />
                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <Body size={14} weight={600} color={T.ink900}>{doctorLabel(d.doctor_display_name)}</Body>
                          <Body size={11} color={T.ink500}>
                            {d.doctor_specialty || tr('doctorcare.doctors.specialtyFallback', 'Pediatrician')}
                          </Body>
                        </Stack>
                        {(d.consent_signed_at || d.created_at) && (
                          <Mono size={10} color={T.ink400}>
                            {tr('doctorcare.doctors.since', `Since ${formatDate(d.consent_signed_at || d.created_at)}`, { date: formatDate(d.consent_signed_at || d.created_at) })}
                          </Mono>
                        )}
                      </HRow>
                      {i < doctors.length - 1 && <Divider />}
                    </div>
                  ))}
                </Card>
                <Spacer h={20} />
              </>
            )}

            {/* Prescriptions */}
            <SectionLabel title={tr('doctorcare.rx.title', 'Prescriptions')} />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <CBSegmented
                value={rxTab}
                onChange={setRxTab}
                options={[
                  { id: 'active', label: `${tr('doctorcare.rx.active', 'Active')}${activeRx.length ? ` (${activeRx.length})` : ''}` },
                  { id: 'past',   label: `${tr('doctorcare.rx.past', 'Past')}${pastRx.length ? ` (${pastRx.length})` : ''}` },
                ]}
              />
            </div>
            {shownRx.length === 0 ? (
              <Card p={20} style={{ textAlign: 'center' }}>
                <Body size={13} color={T.ink400}>
                  {rxTab === 'active'
                    ? tr('doctorcare.rx.noneActive', 'No active prescriptions.')
                    : tr('doctorcare.rx.nonePast', 'No past prescriptions.')}
                </Body>
              </Card>
            ) : (
              <Card p={0}>
                {shownRx.map((p, i) => (
                  <div key={p.id}>
                    <HRow gap={12} style={{ padding: '14px 14px' }} align="flex-start">
                      <SectionIcon name="pill" tone={p.is_active ? 'brand' : 'blue'} />
                      <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                        <Body size={14} weight={600} color={T.ink900}>{formatRxLine(p)}</Body>
                        {p.generic_name && <Body size={11} color={T.ink400}>{p.generic_name}</Body>}
                        {p.instructions && (
                          <Body size={11} color={T.ink500}>
                            <span style={{ fontWeight: 600 }}>{tr('doctorcare.rx.instructions', 'Instructions')}: </span>
                            {p.instructions}
                          </Body>
                        )}
                        <Mono size={10} color={T.ink400}>
                          {[
                            tr('doctorcare.rx.by', `By ${doctorLabel(nameMap[p.doctor_id])}`, { doctor: doctorLabel(nameMap[p.doctor_id]) }),
                            p.prescribed_at ? tr('doctorcare.rx.on', `on ${formatDate(p.prescribed_at)}`, { date: formatDate(p.prescribed_at) }) : null,
                          ].filter(Boolean).join(' · ')}
                        </Mono>
                      </Stack>
                      {!p.is_active && (
                        <div style={{ padding: '2px 7px', borderRadius: 999, background: T.line, color: T.ink400, fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
                          {tr('doctorcare.rx.past', 'Past')}
                        </div>
                      )}
                    </HRow>
                    {i < shownRx.length - 1 && <Divider />}
                  </div>
                ))}
              </Card>
            )}
            <Spacer h={20} />

            {/* Visits */}
            <SectionLabel title={tr('doctorcare.visits.title', 'Visits')} />
            {visits.length === 0 ? (
              <Card p={20} style={{ textAlign: 'center' }}>
                <Body size={13} color={T.ink400}>{tr('doctorcare.visits.none', 'No visit notes yet.')}</Body>
              </Card>
            ) : (
              <Card p={0}>
                {visits.map((v, i) => {
                  const meta = visitTypeMeta(v.visit_type);
                  const tc = TONE_COLORS[meta.tone] || TONE_COLORS.brand;
                  const isOpen = !!expanded[v.id];
                  const hasDetail = v.chief_complaint || v.assessment || v.plan || v.follow_up_days;
                  const label = meta.labelKey ? tr(meta.labelKey, meta.fallback) : meta.fallback;
                  return (
                    <div key={v.id}>
                      <button
                        type="button"
                        onClick={() => hasDetail && setExpanded((e) => ({ ...e, [v.id]: !e[v.id] }))}
                        aria-expanded={hasDetail ? isOpen : undefined}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: hasDetail ? 'pointer' : 'default', padding: 0, fontFamily: FONTS.sans }}
                      >
                        <HRow gap={12} style={{ padding: '14px 14px' }} align="flex-start">
                          <SectionIcon name="clipboard" tone={meta.tone} />
                          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                            <HRow gap={6} align="center">
                              <Body size={14} weight={600} color={T.ink900}>{label}</Body>
                              <div style={{ padding: '2px 7px', borderRadius: 999, background: tc.bg, color: tc.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
                                {doctorLabel(nameMap[v.doctor_id])}
                              </div>
                            </HRow>
                            <Mono size={11} color={T.ink400}>{formatDate(v.consultation_date)}</Mono>
                            {!isOpen && v.chief_complaint && (
                              <Body size={11} color={T.ink500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {v.chief_complaint}
                              </Body>
                            )}
                          </Stack>
                          {hasDetail && (
                            <CBIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} style={{ color: T.ink300, flexShrink: 0 }} />
                          )}
                        </HRow>
                      </button>

                      {isOpen && hasDetail && (
                        <div style={{ padding: '0 14px 16px 58px' }}>
                          <Stack gap={10}>
                            {v.chief_complaint && (
                              <DetailRow label={tr('doctorcare.visits.chiefComplaint', 'Reason for visit')} value={v.chief_complaint} />
                            )}
                            {v.assessment && (
                              <DetailRow label={tr('doctorcare.visits.assessment', 'Assessment')} value={v.assessment} />
                            )}
                            {v.plan && (
                              <DetailRow label={tr('doctorcare.visits.plan', 'Plan')} value={v.plan} />
                            )}
                            {v.follow_up_days && (
                              <Body size={12} color={T.gold} weight={500}>
                                {tr('doctorcare.visits.followUp', `Follow-up in ${v.follow_up_days} days`, { days: v.follow_up_days })}
                              </Body>
                            )}
                          </Stack>
                        </div>
                      )}
                      {i < visits.length - 1 && <Divider />}
                    </div>
                  );
                })}
              </Card>
            )}
            <Spacer h={20} />

            {/* Doctor-recorded vaccines */}
            {vaccines.length > 0 && (
              <>
                <SectionLabel title={tr('doctorcare.vaccines.title', 'Vaccines recorded by your doctor')} />
                <Card p={0}>
                  {vaccines.map((vx, i) => (
                    <div key={vx.id}>
                      <HRow gap={12} style={{ padding: '14px 14px' }} align="flex-start">
                        <SectionIcon name="syringe" tone="blue" />
                        <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                          <HRow gap={6} align="center">
                            <Body size={14} weight={600} color={T.ink900}>{vx.vaccine_name}</Body>
                            {vx.dose_number != null && (
                              <Mono size={10} color={T.ink400}>{tr('doctorcare.vaccines.dose', `Dose ${vx.dose_number}`, { n: vx.dose_number })}</Mono>
                            )}
                          </HRow>
                          <Mono size={11} color={T.ink400}>{formatDate(vx.administered_at)}</Mono>
                          {(vx.administered_by || vx.facility) && (
                            <Body size={11} color={T.ink500}>
                              {[
                                vx.administered_by && tr('doctorcare.vaccines.by', `by ${vx.administered_by}`, { name: vx.administered_by }),
                                vx.facility && tr('doctorcare.vaccines.at', `at ${vx.facility}`, { facility: vx.facility }),
                              ].filter(Boolean).join(' · ')}
                            </Body>
                          )}
                          {vx.next_due_date && (
                            <Body size={11} color={T.gold} weight={500}>
                              {tr('doctorcare.vaccines.nextDue', `Next due ${formatDate(vx.next_due_date)}`, { date: formatDate(vx.next_due_date) })}
                            </Body>
                          )}
                        </Stack>
                      </HRow>
                      {i < vaccines.length - 1 && <Divider />}
                    </div>
                  ))}
                </Card>
                <Spacer h={20} />
              </>
            )}

            {/* Disclaimer */}
            <HRow gap={8} align="flex-start" style={{ padding: '4px 6px' }}>
              <CBIcon name="info" size={14} style={{ color: T.ink300, flexShrink: 0, marginTop: 2 }} />
              <Body size={11} color={T.ink400}>
                {tr('doctorcare.disclaimer', 'These records were entered by your connected doctor. For anything urgent, contact your doctor or local emergency services.')}
              </Body>
            </HRow>
          </>
        )}

        <Spacer h={32} />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack gap={2}>
      <Mono size={10} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Mono>
      <Body size={13} color={T.ink700}>{value}</Body>
    </Stack>
  );
}
