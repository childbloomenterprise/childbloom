export default function CBIcon({ name, size = 20, stroke = 1.6, fill = 'none', className = '', style }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill, stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round', className, style,
  };
  switch (name) {
    case 'home':        return <svg {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>;
    case 'home-fill':   return <svg {...p} fill="currentColor" stroke="none"><path d="M12 3 2 11.5V20a1 1 0 0 0 1 1h6v-6h6v6h6a1 1 0 0 0 1-1v-8.5z"/></svg>;
    case 'chart':       return <svg {...p}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 16l3-4 3 2 4-6"/></svg>;
    case 'chart-fill':  return <svg {...p} fill="currentColor" stroke="currentColor"><path d="M4 4v16h16" strokeWidth="2" fill="none"/><path d="M7.5 16 10 12.5l3 2 4-6" strokeWidth="2.4" fill="none"/></svg>;
    case 'shield':      return <svg {...p}><path d="M12 3.5c2.5 2 5 2.4 8 2.4 0 6-2.5 11-8 14-5.5-3-8-8-8-14 3 0 5.5-.4 8-2.4Z"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'shield-fill': return <svg {...p} fill="currentColor" stroke="none"><path d="M12 3.5c2.5 2 5 2.4 8 2.4 0 6-2.5 11-8 14-5.5-3-8-8-8-14 3 0 5.5-.4 8-2.4Z"/></svg>;
    case 'chat':        return <svg {...p}><path d="M4 5h16v11H8l-4 4z"/></svg>;
    case 'sparkle':     return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>;
    case 'bottle':      return <svg {...p}><path d="M9 4h6"/><path d="M9.5 6h5l-.5 3.4a3 3 0 0 1 1.3 2.5v6.6a2 2 0 0 1-2 2h-3.6a2 2 0 0 1-2-2v-6.6a3 3 0 0 1 1.3-2.5z"/><path d="M11 14h2"/></svg>;
    case 'clipboard':   return <svg {...p}><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6M9 15h4"/></svg>;
    case 'moon':        return <svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4 6 6 0 0 0 20 14.5z"/></svg>;
    case 'sun':         return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>;
    case 'wave':        return <svg {...p}><path d="M3 12c2 0 2-2 4-2s2 4 4 4 2-4 4-4 2 2 4 2"/></svg>;
    case 'flame':       return <svg {...p}><path d="M12 22a6 6 0 0 0 6-6c0-3-2-5-3-8-1 2-2 3-4 3 0-3 1-5 3-8-5 1-8 5-8 10a6 6 0 0 0 6 6z"/></svg>;
    case 'leaf':        return <svg {...p}><path d="M5 19c8 0 14-6 14-14 0 0-2 0-5 1-7 2-9 7-9 13z"/><path d="M5 19c0-4 3-7 7-9"/></svg>;
    case 'scale':       return <svg {...p}><path d="M5 7h14l-1.5 12a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>;
    case 'ruler':       return <svg {...p}><rect x="2" y="9" width="20" height="6" rx="1"/><path d="M6 9v3M9 9v2M12 9v3M15 9v2M18 9v3"/></svg>;
    case 'plus':        return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'check':       return <svg {...p}><path d="m5 12 5 5L20 7"/></svg>;
    case 'arrow-right': return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-up-right': return <svg {...p}><path d="M7 17 17 7M9 7h8v8"/></svg>;
    case 'chevron-right': return <svg {...p}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chevron-down':  return <svg {...p}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-left':  return <svg {...p}><path d="m15 6-6 6 6 6"/></svg>;
    case 'mic':         return <svg {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>;
    case 'bell':        return <svg {...p}><path d="M6 9a6 6 0 0 1 12 0v4l1.5 3h-15L6 13z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>;
    case 'search':      return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'settings':    return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'play':        return <svg {...p} fill="currentColor" stroke="none"><path d="M7 5v14l12-7z"/></svg>;
    case 'pause':       return <svg {...p}><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>;
    case 'globe':       return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'calendar':    return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'clock':       return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'lock':        return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'send':        return <svg {...p}><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>;
    case 'heart':       return <svg {...p}><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.7-7 10-7 10z"/></svg>;
    case 'user':        return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case 'book':        return <svg {...p}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>;
    case 'syringe':     return <svg {...p}><path d="m18 2 4 4M14 6l4 4M3 21l5-5M9 11l4 4-2 2-7-1-1-1 1-2 5-2"/><path d="m9 11 6-6 4 4-6 6"/></svg>;
    case 'menu':        return <svg {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'x':           return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'trash':       return <svg {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
    case 'edit':        return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>;
    case 'copy':        return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case 'download':    return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>;
    case 'share':       return <svg {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>;
    case 'info':        return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>;
    case 'warning':     return <svg {...p}><path d="M10.3 3.3 2 19a1.1 1.1 0 0 0 1 1.7h18a1.1 1.1 0 0 0 1-1.7L13.7 3.3a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>;
    case 'logout':      return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>;
    case 'siren':       return <svg {...p}><path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 21h14"/><path d="M5 18h14"/><path d="M12 4V2"/><path d="M19 7l1.5-1.5"/><path d="M5 7 3.5 5.5"/></svg>;
    case 'siren-fill':  return <svg {...p} fill="currentColor" stroke="currentColor"><path d="M7 18v-6a5 5 0 0 1 10 0v6z" strokeWidth="0"/><path d="M5 21h14" strokeWidth="2.4" fill="none"/><path d="M12 4V2M19 7l1.5-1.5M5 7 3.5 5.5" strokeWidth="2" fill="none"/></svg>;
    case 'heart-pulse': return <svg {...p}><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.7-7 10-7 10z"/><path d="M3 12h3l2-3 3 6 2-4 2 2h6"/></svg>;
    case 'lungs':       return <svg {...p}><path d="M12 4v10"/><path d="M9 6c-1.5 0-3 1-3 3v6a4 4 0 0 0 6 1V8a3 3 0 0 0-3-2z"/><path d="M15 6c1.5 0 3 1 3 3v6a4 4 0 0 1-6 1V8a3 3 0 0 1 3-2z"/></svg>;
    case 'droplet':     return <svg {...p}><path d="M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11z"/></svg>;
    case 'bandage':     return <svg {...p}><path d="m3 13 8-8a3.5 3.5 0 0 1 5 5l-8 8a3.5 3.5 0 0 1-5-5z"/><path d="m8 8 8 8"/><circle cx="10" cy="14" r="0.5"/><circle cx="12" cy="12" r="0.5"/><circle cx="14" cy="10" r="0.5"/></svg>;
    case 'bolt':        return <svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>;
    case 'thermometer': return <svg {...p}><path d="M14 4a2 2 0 0 0-4 0v10a4 4 0 1 0 4 0z"/><path d="M12 6v8"/></svg>;
    case 'brain':       return <svg {...p}><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-3 3 3 3 0 0 0 2 3 3 3 0 0 0 1 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 3 3 3 3 0 0 1-2 3 3 3 0 0 1-1 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3"/><path d="M12 4v15"/></svg>;
    case 'wave-water':  return <svg {...p}><path d="M3 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M3 11c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M3 21c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/></svg>;
    case 'pill':        return <svg {...p}><rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-30 12 12)"/><path d="m8.5 8.5 7 7" transform="rotate(-30 12 12)"/></svg>;
    case 'bug':         return <svg {...p}><path d="M8 6a4 4 0 0 1 8 0"/><path d="M6 10h12v4a6 6 0 0 1-12 0z"/><path d="M3 13h3M18 13h3M5 8 3 6M19 8l2-2M5 18l-2 2M19 18l2 2M12 14v8"/></svg>;
    // Nav / feature icons
    case 'bloom':       return <svg width={size} height={size} viewBox="0 0 100 105" fill="currentColor" stroke="none" className={className}><path d="M50 90 C46 80 18 76 8 57 C20 36 47 60 50 82Z"/><path d="M50 90 C54 80 82 76 92 57 C80 36 53 60 50 82Z"/><path d="M50 90 C33 77 28 40 50 8 C72 40 67 77 50 90Z"/></svg>;
    case 'care':        return <svg {...p}><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.7-7 10-7 10z"/><path d="M3 12h3l2-3 3 6 2-4 2 2h6"/></svg>;
    case 'timeline':    return <svg {...p}><circle cx="6" cy="7" r="2"/><path d="M10 7h10"/><circle cx="6" cy="12" r="2"/><path d="M10 12h10"/><circle cx="6" cy="17" r="2"/><path d="M10 17h10"/></svg>;
    case 'milestone':   return <svg {...p}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 3.9 2.4-7.4L2 9.4h7.6z"/></svg>;
    case 'diaper':      return <svg {...p}><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2l-3 4-3-2-3 2-3-2-3 4V8z"/><path d="M3 10v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/></svg>;
    case 'doctor':      return <svg {...p}><path d="M19 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path d="M13 14H8a4 4 0 0 0-4 4v2h12v-1"/><circle cx="16" cy="17" r="3"/><path d="M16 15v2M15 17h2"/></svg>;
    case 'family':      return <svg {...p}><circle cx="7" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20a5 5 0 0 1 10 0"/><path d="M12 20a5 5 0 0 1 10 0"/></svg>;
    case 'share':       return <svg {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></svg>;
    case 'crown':       return <svg {...p}><path d="M2 17 5 7l4 6 3-8 3 8 4-6 3 10H2z"/><path d="M2 17h20"/></svg>;
    case 'drop':        return <svg {...p}><path d="M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11z"/></svg>;
    case 'feed':        return <svg {...p}><path d="M9 4h6"/><path d="M9.5 6h5l-.5 3.4a3 3 0 0 1 1.3 2.5v6.6a2 2 0 0 1-2 2h-3.6a2 2 0 0 1-2-2v-6.6a3 3 0 0 1 1.3-2.5z"/><path d="M11 14h2"/></svg>;
    case 'sleep':       return <svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4 6 6 0 0 0 20 14.5z"/></svg>;
    case 'thermo':      return <svg {...p}><path d="M14 4a2 2 0 0 0-4 0v10a4 4 0 1 0 4 0z"/><path d="M12 6v8"/></svg>;
    case 'growth':      return <svg {...p}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 16l3-4 3 2 4-6"/></svg>;
    case 'medicine':    return <svg {...p}><rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-30 12 12)"/><path d="m8.5 8.5 7 7" transform="rotate(-30 12 12)"/></svg>;
    case 'mood':        return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>;
    case 'note':        return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>;
    case 'quote':       return <svg {...p}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>;
    case 'chart-up':    return <svg {...p}><path d="M22 7l-7.5 7.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>;
    case 'arrowR':      return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'close':       return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'back':        return <svg {...p}><path d="m15 6-6 6 6 6"/></svg>;
    case 'settings':    return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'minus':       return <svg {...p}><path d="M5 12h14"/></svg>;
    case 'arrow-left':  return <svg {...p}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>;
    default:            return null;
  }
}
