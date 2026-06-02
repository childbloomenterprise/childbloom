// Capacitor Haptics wrapper — silent fallback on web.
// Apple uses haptics as a reward, not noise. Keep intensities low; never spam.

let _module = null;
async function load() {
  if (_module !== null) return _module;
  try {
    _module = await import('@capacitor/haptics');
  } catch {
    _module = false;
  }
  return _module;
}

export async function tapLight() {
  const m = await load(); if (!m) return;
  try { await m.Haptics.impact({ style: m.ImpactStyle.Light }); } catch {}
}

export async function tapMedium() {
  const m = await load(); if (!m) return;
  try { await m.Haptics.impact({ style: m.ImpactStyle.Medium }); } catch {}
}

export async function tapHeavy() {
  const m = await load(); if (!m) return;
  try { await m.Haptics.impact({ style: m.ImpactStyle.Heavy }); } catch {}
}

export async function selection() {
  const m = await load(); if (!m) return;
  try { await m.Haptics.selectionChanged(); } catch {}
}

export async function success() {
  const m = await load(); if (!m) return;
  try { await m.Haptics.notification({ type: m.NotificationType.Success }); } catch {}
}

export async function warning() {
  const m = await load(); if (!m) return;
  try { await m.Haptics.notification({ type: m.NotificationType.Warning }); } catch {}
}
