import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useInbox } from '../../hooks/useInbox';
import { useChildren } from '../../hooks/useChild';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS, SPRING } from '../../components/cb/tokens';
import {
  Card, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Avatar,
} from '../../components/cb/primitives';

const STATUS_CONFIG = {
  pending:  { label: 'Awaiting your response', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  active:   { label: 'Access granted',          color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  declined: { label: 'Declined',                color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  revoked:  { label: 'Access revoked',          color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.declined;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: RADIUS.pill,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600, fontFamily: FONTS.sans,
      letterSpacing: '0.02em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.color, flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}

function ChildName({ childId, children }) {
  const child = children.find((c) => c.id === childId);
  return child?.name ?? 'your child';
}

function ConnectionCard({ request, children, onApprove, onDecline, onSaveNotes }) {
  const [submitting, setSubmitting] = useState(null);
  const [toast, setToast] = useState(null);
  // Pre-visit notes (active connections only)
  const [notesOpen,   setNotesOpen]   = useState(false);
  const [notesText,   setNotesText]   = useState(request.pre_visit_notes ?? '');
  const [notesSaving, setNotesSaving] = useState(false);

  const doctorName = request.doctor_display_name || 'A doctor';
  const specialty  = request.doctor_specialty;
  const childName  = children.find((c) => c.id === request.child_id)?.name ?? 'your child';
  const timeAgo    = formatDistanceToNow(new Date(request.created_at), { addSuffix: true });
  const isPending  = request.status === 'pending';
  const isActive   = request.status === 'active';

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      await onSaveNotes(request.id, notesText);
      setToast('Notes saved — Dr. ' + doctorName + ' will see these');
      setNotesOpen(false);
    } catch (e) {
      setToast('Error: ' + e.message);
    } finally {
      setNotesSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handle = async (action) => {
    setSubmitting(action);
    try {
      await (action === 'approve' ? onApprove(request.id) : onDecline(request.id));
      setToast(action === 'approve' ? `Access granted to Dr. ${doctorName}` : 'Request declined');
    } catch (e) {
      setToast(`Error: ${e.message}`);
    } finally {
      setSubmitting(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={SPRING.entry}
    >
      <Card p={0} style={{
        overflow: 'hidden',
        border: isPending ? `1.5px solid rgba(245,158,11,0.35)` : `1px solid ${T.line}`,
        boxShadow: isPending ? '0 2px 16px rgba(245,158,11,0.08)' : 'none',
      }}>
        {/* Doctor header */}
        <div style={{ padding: '16px 18px 14px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {/* Doctor avatar */}
          <div style={{
            width: 46, height: 46, borderRadius: RADIUS.md,
            background: 'linear-gradient(135deg, #1D6A47 0%, #0f4a32 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: '#fff',
          }}>
            <CBIcon name="doctor" size={22} stroke={1.5} />
          </div>

          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Body size={15} weight={700} color={T.ink900}>{doctorName}</Body>
            {specialty && (
              <Body size={12} color={T.ink500}>{specialty}</Body>
            )}
            <Mono size={10} color={T.ink400}>{timeAgo}</Mono>
          </Stack>

          <StatusBadge status={request.status} />
        </div>

        {/* Request body */}
        <div style={{
          padding: '0 18px 14px',
          borderTop: `1px solid ${T.line}`,
          paddingTop: 14,
        }}>
          <Body size={13.5} color={T.ink700} lh={1.5}>
            Requesting access to{' '}
            <strong style={{ color: T.ink900 }}>{childName}</strong>'s health records in Dr Bloom.
          </Body>

          {request.request_message && (
            <div style={{
              marginTop: 10, padding: '10px 14px',
              borderRadius: RADIUS.sm,
              background: T.surfaceDim,
              borderLeft: `3px solid ${T.brand}`,
            }}>
              <Body size={13} color={T.ink700} lh={1.5} style={{ fontStyle: 'italic' }}>
                "{request.request_message}"
              </Body>
            </div>
          )}

          {/* What the doctor can see */}
          {isPending && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              borderRadius: RADIUS.sm,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.15)',
            }}>
              <Body size={12} color={T.ink600} weight={600} style={{ marginBottom: 6 }}>
                If approved, Dr. {doctorName} can view:
              </Body>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                {['Sleep logs', 'Feeding logs', 'Growth data', 'Milestones', 'Symptoms', 'Prescriptions'].map((item) => (
                  <HRow key={item} gap={6} style={{ alignItems: 'center' }}>
                    <CBIcon name="check" size={11} stroke={2.5} style={{ color: '#10B981', flexShrink: 0 }} />
                    <Body size={11.5} color={T.ink600}>{item}</Body>
                  </HRow>
                ))}
              </div>
              <Body size={11} color={T.ink400} style={{ marginTop: 8 }}>
                You can revoke access at any time from this inbox.
              </Body>
            </div>
          )}
        </div>

        {/* Actions */}
        {isPending && (
          <div style={{
            padding: '12px 18px 16px',
            borderTop: `1px solid ${T.line}`,
            display: 'flex', gap: 10,
          }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handle('approve')}
              disabled={!!submitting}
              style={{
                flex: 1, height: 44, borderRadius: RADIUS.pill, border: 'none',
                background: submitting === 'approve' ? T.ink200 : 'linear-gradient(135deg, #1D6A47, #0f4a32)',
                color: submitting === 'approve' ? T.ink500 : '#fff',
                fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600,
                cursor: submitting ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'background 0.18s, opacity 0.18s',
                opacity: submitting === 'decline' ? 0.5 : 1,
              }}
            >
              {submitting === 'approve' ? (
                <Spinner />
              ) : (
                <>
                  <CBIcon name="check" size={15} stroke={2.2} />
                  Grant access
                </>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handle('decline')}
              disabled={!!submitting}
              style={{
                flex: 1, height: 44, borderRadius: RADIUS.pill,
                border: `1.5px solid ${T.line}`,
                background: submitting === 'decline' ? T.surfaceDim : T.surface,
                color: T.ink700,
                fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600,
                cursor: submitting ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'background 0.18s',
                opacity: submitting === 'approve' ? 0.5 : 1,
              }}
            >
              {submitting === 'decline' ? (
                <Spinner dark />
              ) : (
                <>
                  <CBIcon name="x" size={14} stroke={2} />
                  Decline
                </>
              )}
            </motion.button>
          </div>
        )}

        {/* Approved — pre-visit notes + revoke */}
        {isActive && (
          <div style={{ borderTop: `1px solid ${T.line}` }}>
            {/* Pre-visit notes row */}
            <div style={{ padding: '12px 18px 0' }}>
              <button
                onClick={() => setNotesOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: notesOpen ? T.brandWash : T.surfaceDim,
                  border: 'none', borderRadius: RADIUS.sm,
                  padding: '8px 14px', cursor: 'pointer',
                  fontFamily: FONTS.sans, fontSize: 12.5, fontWeight: 600,
                  color: notesOpen ? T.brand : T.ink600,
                  transition: 'background 0.15s, color 0.15s',
                  width: '100%', textAlign: 'left',
                }}
              >
                <CBIcon name="note" size={14} stroke={1.7} />
                {request.pre_visit_notes
                  ? `Edit pre-visit notes for Dr. ${doctorName}`
                  : `Add pre-visit notes for Dr. ${doctorName}`}
                {request.pre_visit_notes && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: T.brand, fontWeight: 500 }}>Saved</span>
                )}
              </button>

              <AnimatePresence>
                {notesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ paddingTop: 10 }}>
                      <textarea
                        value={notesText}
                        onChange={e => setNotesText(e.target.value)}
                        placeholder={`E.g. "Vishnu has been coughing for 3 days. Also concerned about slow weight gain."`}
                        rows={4}
                        style={{
                          width: '100%', padding: '10px 12px',
                          borderRadius: RADIUS.sm, border: `1px solid ${T.line}`,
                          background: T.surface, fontFamily: FONTS.sans,
                          fontSize: 13.5, color: T.ink900, resize: 'vertical',
                          lineHeight: 1.5, outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleSaveNotes}
                          disabled={notesSaving}
                          style={{
                            flex: 1, height: 38, borderRadius: RADIUS.pill, border: 'none',
                            background: 'linear-gradient(135deg, #1D6A47, #0f4a32)',
                            color: '#fff', fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600,
                            cursor: notesSaving ? 'wait' : 'pointer', opacity: notesSaving ? 0.6 : 1,
                          }}
                        >
                          {notesSaving ? 'Saving…' : 'Save notes'}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setNotesOpen(false)}
                          style={{
                            height: 38, padding: '0 16px', borderRadius: RADIUS.pill,
                            border: `1px solid ${T.line}`, background: T.surface,
                            fontFamily: FONTS.sans, fontSize: 13, fontWeight: 500,
                            color: T.ink600, cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Revoke row */}
            <div style={{ padding: '10px 18px 14px' }}>
              <Body size={12} color={T.ink400}>
                Granted{request.consent_signed_at
                  ? ` on ${new Date(request.consent_signed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ''}.
                {' '}
                <button
                  onClick={() => handle('decline')}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: '#DC2626', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: FONTS.sans,
                  }}
                >
                  Revoke access
                </button>
              </Body>
            </div>
          </div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                margin: '0 18px 14px',
                padding: '8px 14px',
                borderRadius: RADIUS.sm,
                background: toast.startsWith('Error') ? 'rgba(220,38,38,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${toast.startsWith('Error') ? 'rgba(220,38,38,0.2)' : 'rgba(16,185,129,0.2)'}`,
              }}
            >
              <Body size={12.5} color={toast.startsWith('Error') ? '#DC2626' : '#059669'} weight={500}>
                {toast}
              </Body>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function Spinner({ dark = false }) {
  return (
    <div style={{
      width: 16, height: 16, borderRadius: '50%',
      border: `2px solid ${dark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)'}`,
      borderTopColor: dark ? T.ink700 : '#fff',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

function EmptyState({ filter }) {
  const messages = {
    all:      { icon: 'bell',    title: 'No connection requests yet', sub: 'When a doctor requests access to your child\'s records, it will appear here.' },
    pending:  { icon: 'clock',   title: 'No pending requests',        sub: 'You\'re all caught up.' },
    approved: { icon: 'check',   title: 'No approved connections',    sub: 'Approve a doctor\'s request to see them here.' },
    messages: { icon: 'doctor',  title: 'No messages yet',            sub: 'When a connected doctor sends you a note, it will appear here.' },
  };
  const m = messages[filter] || messages.all;
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: T.surfaceDim,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
        color: T.ink300,
      }}>
        <CBIcon name={m.icon} size={28} stroke={1.4} />
      </div>
      <Body size={16} weight={600} color={T.ink700} style={{ marginBottom: 8 }}>{m.title}</Body>
      <Body size={14} color={T.ink400} lh={1.5} style={{ maxWidth: 260, margin: '0 auto' }}>{m.sub}</Body>
    </div>
  );
}

export default function InboxPage() {
  const navigate = useNavigate();
  const { requests, doctorMessages, loading, pendingCount, respond, saveNotes } = useInbox();
  const { data: children = [] } = useChildren();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'messages'
    ? []
    : requests.filter((r) => {
        if (filter === 'pending')  return r.status === 'pending';
        if (filter === 'approved') return r.status === 'active';
        return true;
      });

  const tabs = [
    { id: 'all',      label: 'All',      count: requests.length },
    { id: 'pending',  label: 'Pending',  count: requests.filter(r => r.status === 'pending').length },
    { id: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'active').length },
    { id: 'messages', label: 'Messages', count: doctorMessages.length },
  ];

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingTop: 52 }}>

      {/* Header */}
      <div style={{ padding: '4px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <HRow gap={8} align="center" style={{ marginBottom: 2 }}>
            <Eyebrow color={T.ink300}>INBOX</Eyebrow>
            {pendingCount > 0 && (
              <span style={{
                minWidth: 20, height: 20, borderRadius: RADIUS.pill,
                background: '#F59E0B', color: '#fff',
                fontSize: 11, fontWeight: 700, fontFamily: FONTS.sans,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 6px',
              }}>
                {pendingCount}
              </span>
            )}
          </HRow>
          <Display size={30} italic weight={500} lh={1.05}>Doctor requests.</Display>
        </div>
        <button
          onClick={() => navigate(-1)}
          aria-label="Close inbox"
          style={{
            width: 34, height: 34, borderRadius: RADIUS.pill,
            background: T.surfaceDim, border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: T.ink500,
          }}
        >
          <CBIcon name="x" size={16} />
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8 }}>
        {tabs.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                height: 34, padding: '0 14px', borderRadius: RADIUS.pill, border: 'none',
                background: active ? T.brand : T.surfaceDim,
                color: active ? '#fff' : T.ink500,
                fontFamily: FONTS.sans, fontSize: 13, fontWeight: active ? 600 : 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: RADIUS.pill,
                  background: active ? 'rgba(255,255,255,0.25)' : T.line,
                  color: active ? '#fff' : T.ink500,
                  fontSize: 10, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Spacer h={16} />

      {/* Content */}
      <div style={{ padding: '0 16px' }}>
        {filter === 'messages' ? (
          /* Doctor messages tab */
          loading ? <LoadingState /> :
          doctorMessages.length === 0 ? (
            <Card p={0}><EmptyState filter="messages" /></Card>
          ) : (
            <AnimatePresence mode="popLayout">
              <Stack gap={10}>
                {doctorMessages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card p={0} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: RADIUS.md,
                          background: 'linear-gradient(135deg, #1D6A47, #0f4a32)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <CBIcon name="doctor" size={18} stroke={1.5} style={{ color: '#fff' }} />
                        </div>
                        <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                          <HRow gap={6} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                            <Body size={13.5} weight={700} color={T.ink900}>
                              Dr. {msg.sender_name ?? 'Your doctor'}
                            </Body>
                            <Mono size={10} color={T.ink400}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </Mono>
                          </HRow>
                          <Body size={13.5} color={T.ink700} lh={1.55}>{msg.body}</Body>
                        </Stack>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </Stack>
            </AnimatePresence>
          )
        ) : loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <Card p={0}>
            <EmptyState filter={filter} />
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            <Stack gap={12}>
              {filtered.map((req) => (
                <ConnectionCard
                  key={req.id}
                  request={req}
                  children={children}
                  onApprove={(id) => respond(id, 'approve')}
                  onDecline={(id) => respond(id, 'decline')}
                  onSaveNotes={saveNotes}
                />
              ))}
            </Stack>
          </AnimatePresence>
        )}
      </div>

      <Spacer h={40} />

      {/* Privacy note */}
      <div style={{ padding: '0 20px 32px' }}>
        <div style={{
          padding: '12px 16px', borderRadius: RADIUS.md,
          background: T.surfaceDim,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <CBIcon name="lock" size={15} stroke={1.7} style={{ color: T.ink400, marginTop: 1, flexShrink: 0 }} />
          <Body size={12} color={T.ink500} lh={1.5}>
            Approved doctors can only read your child's health data in Dr Bloom. They cannot edit or delete anything. You can revoke access at any time.
          </Body>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <Stack gap={12}>
      {[1, 2].map((i) => (
        <div key={i} style={{
          height: 160, borderRadius: RADIUS.md,
          background: T.surfaceDim,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </Stack>
  );
}
