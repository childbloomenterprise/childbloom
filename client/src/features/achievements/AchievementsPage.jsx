import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAchievements } from '../../hooks/useAchievements';
import { ACHIEVEMENT_CATEGORIES } from '../../lib/achievementDefs';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, Card, ProgressBar,
} from '../../components/cb/primitives';

function AchievementCard({ achievement, unlocked, unlockedAt }) {
  const cat = ACHIEVEMENT_CATEGORIES[achievement.category];

  return (
    <Card
      p={16}
      style={{
        opacity: unlocked ? 1 : 0.45,
        transition: 'opacity 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow accent for unlocked */}
      {unlocked && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: achievement.color || T.brand,
          borderRadius: `${RADIUS.md}px ${RADIUS.md}px 0 0`,
        }} />
      )}

      <HRow gap={12} align="flex-start">
        {/* Emoji badge */}
        <div style={{
          width: 48, height: 48, borderRadius: RADIUS.md, flexShrink: 0,
          background: unlocked ? `${achievement.color}18` : T.surfaceDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          border: unlocked ? `1px solid ${achievement.color}30` : `1px solid ${T.line}`,
        }}>
          {unlocked ? achievement.emoji : '🔒'}
        </div>

        <Stack gap={3} style={{ flex: 1 }}>
          <Body size={13} weight={700} color={T.ink900}>{achievement.title}</Body>
          <Body size={11} color={T.ink500} lh={1.4}>{achievement.desc}</Body>
          {!unlocked && achievement.hint && (
            <Mono size={10} color={T.ink300} style={{ marginTop: 2 }}>
              {achievement.hint}
            </Mono>
          )}
          {unlocked && unlockedAt && (
            <Mono size={10} color={achievement.color || T.brand} style={{ marginTop: 2 }}>
              Earned · {new Date(unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Mono>
          )}
        </Stack>

        {unlocked && (
          <CBIcon name="check" size={16} stroke={2.5} style={{ color: achievement.color || T.brand, flexShrink: 0 }} />
        )}
      </HRow>
    </Card>
  );
}

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { allAchievements, unlockedKeys, unlocked, tryUnlock } = useAchievements();

  const totalCount = allAchievements.length;
  const unlockedCount = unlockedKeys.size;
  const pct = unlockedCount / Math.max(1, totalCount);

  // Auto-unlock "welcome" for authenticated users
  useEffect(() => {
    tryUnlock('welcome');
  }, [tryUnlock]);

  const categoryOrder = ['milestone', 'bloom', 'care', 'growth'];
  const byCategory = categoryOrder.map((cat) => ({
    cat,
    meta: ACHIEVEMENT_CATEGORIES[cat],
    items: allAchievements.filter((a) => a.category === cat),
  }));

  const unlockedMap = Object.fromEntries(unlocked.map((u) => [u.achievement_key, u.unlocked_at]));

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingTop: 56 }}>

      {/* Header */}
      <div style={{ padding: '0 20px 20px' }}>
        <HRow gap={8} align="center" style={{ marginBottom: 4 }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', color: T.ink400, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <CBIcon name="chevron-left" size={18} aria-hidden="true" />
          </button>
          <Eyebrow color={T.ink400}>YOUR JOURNEY</Eyebrow>
        </HRow>
        <Display size={32} italic weight={400} lh={1.1}>Achievements</Display>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Progress card */}
        <Card p={20} tone="brand" style={{ marginBottom: 20 }}>
          <HRow justify="space-between" align="flex-end" style={{ marginBottom: 12 }}>
            <div>
              <Eyebrow color="rgba(255,255,255,0.7)">Unlocked</Eyebrow>
              <Spacer h={4} />
              <div style={{ fontFamily: FONTS.serif, fontSize: 36, fontStyle: 'italic', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {unlockedCount}
                <span style={{ fontSize: 18, opacity: 0.6 }}>/{totalCount}</span>
              </div>
            </div>
            <div style={{ fontSize: 48, lineHeight: 1 }}>🏅</div>
          </HRow>
          <ProgressBar value={pct} h={6} />
          <Spacer h={8} />
          <Body size={12} color="rgba(255,255,255,0.75)">
            {unlockedCount === 0
              ? 'Start using the app to earn your first achievement'
              : unlockedCount === totalCount
              ? 'You\'ve unlocked everything — legendary parent!'
              : `${totalCount - unlockedCount} more to go — keep it up!`}
          </Body>
        </Card>

        {/* Achievement groups */}
        {byCategory.map(({ cat, meta, items }) => (
          <div key={cat} style={{ marginBottom: 24 }}>
            <HRow gap={8} align="center" style={{ marginBottom: 10, padding: '0 4px' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: meta.color, flexShrink: 0,
              }} />
              <Eyebrow color={T.ink400}>{meta.label}</Eyebrow>
              <Mono size={10} color={T.ink300} style={{ marginLeft: 'auto' }}>
                {items.filter((a) => unlockedKeys.has(a.key)).length}/{items.length}
              </Mono>
            </HRow>
            <Stack gap={8}>
              {items.map((a) => (
                <AchievementCard
                  key={a.key}
                  achievement={a}
                  unlocked={unlockedKeys.has(a.key)}
                  unlockedAt={unlockedMap[a.key]}
                />
              ))}
            </Stack>
          </div>
        ))}

        <Spacer h={32} />
      </div>
    </div>
  );
}
