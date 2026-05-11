// Settings — profile + family + theme picker (4 palettes × 2 modes) + premium upsell.
// Mirrors the revamp ProfileScreen; theme picker is the centerpiece for this rebuild.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import useAuthStore from '../../stores/authStore';
import useChildStore from '../../stores/childStore';
import { useAuth } from '../../hooks/useAuth';
import useThemeStore from '../../stores/themeStore';
import { PALETTES, PALETTE_KEYS } from '../../components/cb/theme';
import { useChildren, useSelectedChild } from '../../hooks/useChild';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Chip, Button, ProgressBar,
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, ChromeBtn,
  Avatar, BloomFlower,
} from '../../components/cb/primitives';
import { differenceInDays } from 'date-fns';

function calcAge(dob) {
  if (!dob) return '';
  const days = differenceInDays(new Date(), new Date(dob));
  if (days < 30) return `${days} days old`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months} months old`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} yr ${m} mo old` : `${y} years old`;
}

function PaletteSwatch({ id, name, brand, brandSoft, accent, gold, active, onClick }) {
  return (
    <button onClick={onClick} aria-label={name} aria-pressed={active}
      style={{
        position: 'relative', flex: 1, height: 64, padding: 0, border: 0,
        borderRadius: RADIUS.md, overflow: 'hidden', cursor: 'pointer',
        background: brand,
        boxShadow: active
          ? `0 0 0 2.5px ${T.ink900}, 0 4px 16px rgba(11,23,20,0.18)`
          : `0 0 0 1px ${T.line}, 0 1px 3px rgba(11,23,20,0.06)`,
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}>
      {/* Right strip — sub-colors */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '36%',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-1px 0 0 rgba(0,0,0,0.1)',
      }}>
        <div style={{ flex: 1, background: brandSoft }} />
        <div style={{ flex: 1, background: accent }} />
        <div style={{ flex: 1, background: gold }} />
      </div>
      {/* Active check */}
      {active && (
        <div style={{ position: 'absolute', top: 6, left: 6, width: 16, height: 16, borderRadius: 999,
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          <CBIcon name="check" size={11} stroke={2.6} style={{ color: brand }} />
        </div>
      )}
      {/* Name pill */}
      <div style={{
        position: 'absolute', left: 6, bottom: 6, padding: '2px 8px', borderRadius: 999,
        background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
        fontFamily: FONTS.sans, fontSize: 9, color: '#fff', fontWeight: 600,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        {name}
      </div>
    </button>
  );
}

function SettingsRow({ icon, label, right, onClick, danger = false, last = false }) {
  return (
    <>
      <HRow gap={12} style={{ padding: '14px 16px', cursor: onClick ? 'pointer' : 'default' }} align="center" onClick={onClick}>
        {icon && <CBIcon name={icon} size={18} style={{ color: danger ? T.danger : T.ink500 }} />}
        <Body size={14} color={danger ? T.danger : T.ink900} weight={500} style={{ flex: 1 }}>{label}</Body>
        {right && <Mono size={10} color={T.ink400}>{right}</Mono>}
        {onClick && <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} />}
      </HRow>
      {!last && <Divider />}
    </>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const { data: children = [] } = useChildren();
  const child = useSelectedChild();
  const { setSelectedChildId } = useChildStore();

  const palette = useThemeStore((s) => s.palette);
  const mode    = useThemeStore((s) => s.mode);
  const setPalette = useThemeStore((s) => s.setPalette);
  const toggleMode = useThemeStore((s) => s.toggleMode);

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => navigate('/auth'),
  });

  const parentInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'P';
  const parentName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Parent';

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingTop: 56 }}>

      {/* Top */}
      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Body size={12} color={T.ink400}>Account, family, premium</Body>
          <Display size={26} italic weight={400} lh={1.1}>You</Display>
        </div>
        <ChromeBtn icon="search" />
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Profile card */}
        <Card p={20}>
          <HRow gap={14}>
            <Avatar name={parentInitial} size={56} tone="brand" />
            <Stack gap={2}>
              <Display size={22} italic weight={400}>{parentName}</Display>
              <Body size={12} color={T.ink500}>parent · {children.length} child{children.length !== 1 ? 'ren' : ''}</Body>
            </Stack>
          </HRow>
          <Spacer h={16} />
          <HRow gap={20}>
            {[
              { l: 'Logs',       v: '—' },
              { l: 'Insights',   v: '—' },
              { l: 'Milestones', v: '—' },
              { l: 'Streak',     v: '—' },
            ].map((s, i) => (
              <Stack key={i} gap={2}>
                <Mono size={9} color={T.ink400}>{s.l.toUpperCase()}</Mono>
                <div style={{ fontFamily: FONTS.serif, fontSize: 16, color: T.ink900 }}>{s.v}</div>
              </Stack>
            ))}
          </HRow>
        </Card>

        <Spacer h={18} />

        {/* Premium upsell */}
        <Card p={18} tone="warm" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -24, opacity: 0.3, pointerEvents: 'none' }}>
            <BloomFlower size={140} />
          </div>
          <Eyebrow color={T.gold}>Premium · Bloom Path</Eyebrow>
          <Spacer h={6} />
          <Display size={22} italic weight={400} style={{ maxWidth: 240 }}>
            Unlock {child?.name || 'your child'}'s personalized journey.
          </Display>
          <Spacer h={12} />
          <HRow gap={8}>
            <Button size="sm" variant="primary" icon="crown" disabled>Coming soon</Button>
            <Body size={11} color={T.ink500}>₹300/mo</Body>
          </HRow>
        </Card>

        <Spacer h={20} />

        {/* THEME PICKER — the heart of this rebuild */}
        <SectionLabel title="Appearance" />
        <Card p={18}>
          <Eyebrow color={T.ink400}>Palette</Eyebrow>
          <Spacer h={10} />
          <HRow gap={8}>
            {PALETTE_KEYS.map((key) => {
              const p = PALETTES[key].light;
              return (
                <PaletteSwatch
                  key={key}
                  id={key}
                  name={PALETTES[key].name}
                  brand={p.brand}
                  brandSoft={p.brandSoft}
                  accent={p.accent}
                  gold={p.gold}
                  active={palette === key}
                  onClick={() => setPalette(key)}
                />
              );
            })}
          </HRow>

          <Spacer h={18} />
          <Divider />
          <Spacer h={14} />

          <HRow justify="space-between" align="center">
            <Stack gap={2}>
              <Body size={14} weight={600} color={T.ink900}>Dark mode</Body>
              <Body size={11} color={T.ink500}>Switches every screen to a dark variant of the current palette.</Body>
            </Stack>
            <button
              onClick={toggleMode}
              aria-pressed={mode === 'dark'}
              aria-label="Toggle dark mode"
              style={{
                position: 'relative',
                width: 44, height: 26, borderRadius: 999, border: 'none',
                background: mode === 'dark' ? T.brand : T.ink200,
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: mode === 'dark' ? 20 : 2,
                width: 22, height: 22, borderRadius: 999, background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }} />
            </button>
          </HRow>
        </Card>

        <Spacer h={20} />

        {/* Family */}
        {children.length > 0 && (
          <>
            <HRow justify="space-between" align="center" style={{ marginBottom: 8 }}>
              <SectionLabel title="Family" style={{ marginBottom: 0 }} />
              <Chip tone="surface" onClick={() => navigate('/family')} style={{ fontSize: 11, height: 26 }}>Manage</Chip>
            </HRow>
            <Card p={0}>
              {children.map((c, i) => (
                <div key={c.id}>
                  <HRow
                    gap={12}
                    style={{ padding: '14px 16px', cursor: 'pointer' }}
                    align="center"
                    onClick={() => setSelectedChildId(c.id)}
                  >
                    <Avatar name={(c.name || 'A')[0]} size={36} tone={child?.id === c.id ? 'brand' : 'soft'} />
                    <Stack gap={1} style={{ flex: 1 }}>
                      <Body size={14} weight={600} color={T.ink900}>{c.name}{child?.id === c.id ? '  ·  selected' : ''}</Body>
                      <Body size={11} color={T.ink500}>{calcAge(c.date_of_birth)}</Body>
                    </Stack>
                    <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} />
                  </HRow>
                  {i < children.length - 1 && <Divider />}
                </div>
              ))}
              <Divider />
              <HRow gap={12} style={{ padding: '14px 16px', cursor: 'pointer' }} align="center" onClick={() => navigate('/onboarding')}>
                <div style={{
                  width: 36, height: 36, borderRadius: 999, border: `1px dashed ${T.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink500,
                }}>
                  <CBIcon name="plus" size={16} />
                </div>
                <Body size={14} weight={500} color={T.ink900} style={{ flex: 1 }}>Add another child</Body>
              </HRow>
            </Card>
            <Spacer h={20} />
          </>
        )}

        {/* Settings */}
        <SectionLabel title="Settings" />
        <Card p={0}>
          <SettingsRow icon="bell" label="Notifications" right="Smart" onClick={() => {}} />
          <SettingsRow icon="shield" label="Privacy" onClick={() => navigate('/privacy')} />
          <SettingsRow icon="globe" label="Language" right="EN" onClick={() => {}} />
          <SettingsRow icon="book" label="Guides" onClick={() => navigate('/guides')} last />
        </Card>

        <Spacer h={20} />

        {/* Account */}
        <SectionLabel title="Account" />
        <Card p={0}>
          <SettingsRow
            icon="logout"
            label={logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
            onClick={() => !logoutMutation.isPending && logoutMutation.mutate()}
            danger
            last
          />
        </Card>

        <Spacer h={32} />
      </div>
    </div>
  );
}
