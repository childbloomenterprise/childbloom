// Public landing page — first thing visitors see at "/".
// Returning users (onboarding_complete) are redirected to /dashboard.
// All styles are scoped under .cb-landing to avoid clashing with the
// theme-system CSS variables (which use the same `--brand`/`--ink` names).

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { track } from '../../lib/analytics';

const LANDING_CSS = `
.cb-landing { --lbrand:#0F3D2E; --lbrand-deep:#0A2920; --lbrand-soft:#5FB48A;
  --lbrand-wash:#D9EBE1; --lbrand-tint:#EDF4EF;
  --laccent:#D17A4F; --laccent-soft:#F0C9BB; --lgold:#C9A35A;
  --lbg:#F2F0EA; --lsurface:#FFFFFF; --lwarm:#F5EFE3; --ldim:#F4F1E8;
  --link:#0B1714; --link-700:#1F2A26; --link-500:#4B5651;
  --link-400:#6B7570; --link-300:#8E9690; --link-200:#C8CCC6; --link-100:#E5E7E1;
  --lline:rgba(11,23,20,.08);
  --lserif:'Fraunces',Georgia,serif;
  --lsans:'Inter Tight',system-ui,sans-serif;
  --lmono:'JetBrains Mono',monospace;
  --lr-md:14px; --lr-lg:20px; --lr-xl:28px; --lr-pill:999px;
  --lsh-sm:0 1px 2px rgba(11,23,20,.04);
  --lsh-md:0 2px 4px rgba(11,23,20,.03),0 12px 28px rgba(11,23,20,.06);
  --lsh-lg:0 6px 14px rgba(11,23,20,.05),0 28px 64px rgba(11,23,20,.09);
  --lsh-ring:0 0 0 1px rgba(11,23,20,.05);
  background:var(--lbg); color:var(--link); font-family:var(--lsans);
  -webkit-font-smoothing:antialiased; overflow-x:hidden; min-height:100dvh; }
.cb-landing *, .cb-landing *::before, .cb-landing *::after { box-sizing:border-box; margin:0; padding:0; }
.cb-landing a { text-decoration:none; color:inherit; }
.cb-landing button { font-family:inherit; cursor:pointer; border:none; }
.cb-landing img { max-width:100%; display:block; }
.cb-landing .wrap { max-width:1160px; margin:0 auto; padding:0 32px; }
.cb-landing .section { padding:108px 0; }
.cb-landing .eyebrow { font-size:11px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--lbrand); }
.cb-landing .btn { display:inline-flex; align-items:center; gap:8px; height:52px; padding:0 24px; border-radius:var(--lr-pill); font-family:var(--lsans); font-size:15px; font-weight:700; letter-spacing:-.01em; transition:transform .2s, box-shadow .2s; }
.cb-landing .btn:hover { transform:translateY(-2px); }
.cb-landing .btn-p { background:var(--lbrand); color:#fff; box-shadow:0 4px 20px rgba(15,61,46,.28); }
.cb-landing .btn-p:hover { box-shadow:0 8px 32px rgba(15,61,46,.38); }
.cb-landing .btn-s { background:transparent; color:var(--lbrand); border:1.5px solid rgba(15,61,46,.22); }
.cb-landing .btn-s:hover { background:var(--lbrand-wash); border-color:var(--lbrand); }
.cb-landing .btn-w { background:rgba(255,255,255,.97); color:var(--lbrand-deep); box-shadow:0 4px 24px rgba(0,0,0,.18); }
.cb-landing .btn-w:hover { box-shadow:0 8px 32px rgba(0,0,0,.24); }
.cb-landing nav.cbl-nav { position:sticky; top:0; z-index:100; height:64px; display:flex; align-items:center; justify-content:space-between; padding:0 32px; background:rgba(242,240,234,.88); backdrop-filter:blur(20px); border-bottom:1px solid var(--lline); }
.cb-landing .nav-logo { display:flex; align-items:center; gap:9px; font-family:var(--lserif); font-size:20px; font-style:italic; letter-spacing:-.02em; color:var(--link); }
.cb-landing .nav-mark { width:30px; height:30px; border-radius:50%; background:var(--lbrand); display:flex; align-items:center; justify-content:center; }
.cb-landing .nav-mark svg { width:15px; height:15px; }
.cb-landing .nav-links { display:flex; gap:30px; list-style:none; }
.cb-landing .nav-links a { font-size:14px; font-weight:500; color:var(--link-500); transition:color .15s; cursor:pointer; }
.cb-landing .nav-links a:hover { color:var(--lbrand); }
.cb-landing .nav-cta { display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 16px 0 14px; border-radius:var(--lr-pill); background:#fff; color:var(--link); font-size:13px; font-weight:600; letter-spacing:-.01em; box-shadow:0 1px 2px rgba(11,23,20,.06), 0 4px 14px rgba(11,23,20,.10), inset 0 0 0 1px rgba(11,23,20,.08); transition:box-shadow .2s, transform .2s; }
.cb-landing .nav-cta:hover { transform:translateY(-1px); box-shadow:0 2px 6px rgba(11,23,20,.08), 0 10px 26px rgba(11,23,20,.14), inset 0 0 0 1px rgba(11,23,20,.10); }
.cb-landing .nav-cta:disabled { opacity:.7; cursor:default; }
.cb-landing .nav-cta-g { width:16px; height:16px; flex-shrink:0; }
.cb-landing .hero { padding:80px 0 72px; position:relative; overflow:hidden; }
.cb-landing .hero-flower { position:absolute; right:-160px; top:-160px; opacity:.45; pointer-events:none; z-index:0; }
.cb-landing .hero-inner { position:relative; z-index:1; display:grid; grid-template-columns:1.05fr 0.95fr; gap:40px; align-items:center; }
.cb-landing .hero-label { display:inline-flex; align-items:center; gap:8px; height:28px; padding:0 12px; border-radius:var(--lr-pill); background:var(--lbrand-wash); font-size:12px; font-weight:600; color:var(--lbrand); margin-bottom:22px; }
.cb-landing .hero-dot { width:7px; height:7px; border-radius:50%; background:var(--lbrand-soft); animation:cbl-dotpulse 2.2s ease-in-out infinite; }
@keyframes cbl-dotpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.78)} }
.cb-landing .hero-h1 { font-family:var(--lserif); font-size:clamp(42px,5.6vw,74px); font-weight:300; font-style:italic; letter-spacing:-.03em; line-height:.98; text-wrap:balance; margin-bottom:22px; }
.cb-landing .hero-h1 em { font-style:normal; color:var(--lbrand); }
.cb-landing .hero-sub { font-size:17px; color:var(--link-500); line-height:1.65; max-width:460px; margin-bottom:34px; }
.cb-landing .hero-actions { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.cb-landing .hero-trust { margin-top:30px; display:flex; align-items:center; gap:14px; }
.cb-landing .stars { display:flex; gap:2px; }
.cb-landing .stars svg { width:14px; height:14px; fill:var(--lgold); }
.cb-landing .trust-text { font-size:13px; color:var(--link-400); }
.cb-landing .trust-text strong { color:var(--link-700); font-weight:600; }
.cb-landing .phones { position:relative; height:620px; display:flex; align-items:center; justify-content:center; isolation:isolate; }
.cb-landing .pw { position:absolute; will-change:transform; transform-origin:50% 50%; }
.cb-landing .pw .pf { box-shadow:0 24px 56px -16px rgba(0,0,0,.34), 0 8px 20px -6px rgba(0,0,0,.18); }
.cb-landing .pw-1 { transform:translate(-58px,-12px) rotate(-4deg); z-index:2; }
.cb-landing .pw-2 { transform:translate(78px,32px) rotate(5deg); z-index:1; opacity:.92; }
.cb-landing .pf { width:262px; background:#1c1c1e; border-radius:50px; padding:10px; position:relative; border:1px solid rgba(255,255,255,.12); }
.cb-landing .p-island { position:absolute; top:10px; left:50%; transform:translateX(-50%); width:108px; height:31px; background:#1c1c1e; border-radius:16px; z-index:6; }
.cb-landing .ps { border-radius:42px; overflow:hidden; height:548px; position:relative; background:var(--lbg); }
.cb-landing .ph-home { width:100%; height:100%; display:flex; flex-direction:column; background:var(--lbg); padding-top:40px; overflow:hidden; }
.cb-landing .ph-greeting { display:flex; align-items:center; gap:10px; padding:10px 14px 0; }
.cb-landing .ph-av { width:34px; height:34px; border-radius:50%; background:var(--lbrand); flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:var(--lserif); font-size:14px; font-style:italic; color:#fff; }
.cb-landing .ph-gr-sub { font-size:10px; color:var(--link-400); font-weight:500; margin-bottom:1px; }
.cb-landing .ph-gr-main { font-family:var(--lserif); font-size:15px; font-style:italic; color:var(--link); line-height:1.15; }
.cb-landing .ph-gr-main em { font-style:normal; }
.cb-landing .ph-hero-card { margin:12px 12px 0; background:var(--lbrand); border-radius:18px; padding:14px; position:relative; overflow:hidden; flex-shrink:0; }
.cb-landing .ph-hero-bg { position:absolute; right:-24px; top:-24px; opacity:.18; }
.cb-landing .ph-hero-ey { font-size:8px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.6); margin-bottom:4px; }
.cb-landing .ph-score { font-family:var(--lserif); font-size:38px; font-style:italic; font-weight:300; color:#fff; line-height:1; }
.cb-landing .ph-score span { font-size:16px; opacity:.5; }
.cb-landing .ph-score-sub { font-size:10px; color:rgba(255,255,255,.65); margin-top:4px; margin-bottom:10px; line-height:1.4; }
.cb-landing .ph-stats { display:flex; gap:8px; }
.cb-landing .ph-stat { flex:1; }
.cb-landing .ph-stat-lbl { font-size:8px; color:rgba(255,255,255,.55); letter-spacing:.1em; text-transform:uppercase; margin-bottom:3px; }
.cb-landing .ph-stat-val { font-family:var(--lserif); font-size:13px; font-style:italic; color:#fff; line-height:1; }
.cb-landing .ph-bar { height:3px; background:rgba(255,255,255,.18); border-radius:2px; margin-top:4px; overflow:hidden; }
.cb-landing .ph-bar-fill { height:100%; background:rgba(255,255,255,.7); border-radius:2px; }
.cb-landing .ph-tiles-row { padding:10px 12px 0; }
.cb-landing .ph-tiles-lbl { font-size:9px; font-weight:600; color:var(--link-400); letter-spacing:.12em; text-transform:uppercase; margin-bottom:7px; }
.cb-landing .ph-tiles { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
.cb-landing .ph-tile { background:var(--lsurface); border-radius:10px; padding:8px 4px; display:flex; flex-direction:column; align-items:center; gap:4px; box-shadow:var(--lsh-sm),var(--lsh-ring); }
.cb-landing .ph-tile.w { background:var(--lwarm); }
.cb-landing .ph-tile svg { width:14px; height:14px; stroke:var(--lbrand); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .ph-tile span { font-size:8px; font-weight:600; color:var(--link-700); }
.cb-landing .ph-aiblock { margin:8px 12px 0; background:var(--lsurface); border-radius:12px; padding:10px; display:flex; gap:8px; align-items:flex-start; box-shadow:var(--lsh-sm),var(--lsh-ring); }
.cb-landing .ph-ai-icon { width:20px; height:20px; border-radius:6px; background:var(--lbrand); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cb-landing .ph-ai-icon svg { width:10px; height:10px; stroke:#fff; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .ph-ai-txt { font-size:9px; color:var(--link-500); line-height:1.5; flex:1; }
.cb-landing .ph-ai-txt strong { color:var(--link); font-weight:600; }
.cb-landing .ph-nav { margin-top:auto; background:var(--lsurface); border-radius:16px; margin:8px 8px 8px; display:flex; align-items:center; justify-content:space-around; padding:8px 4px; box-shadow:var(--lsh-md),var(--lsh-ring); flex-shrink:0; }
.cb-landing .ph-nav-item { display:flex; flex-direction:column; align-items:center; gap:2px; color:var(--link-300); padding:2px 6px; }
.cb-landing .ph-nav-item.on { color:var(--lbrand); }
.cb-landing .ph-nav-item svg { width:16px; height:16px; stroke:currentColor; fill:none; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .ph-nav-item span { font-size:7px; font-weight:600; }
.cb-landing .ph-nav-bloom { width:34px; height:34px; border-radius:50%; background:var(--lbrand); display:flex; align-items:center; justify-content:center; margin-top:-14px; }
.cb-landing .ph-nav-bloom svg { width:16px; height:16px; stroke:#fff; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .ph-ai-screen { width:100%; height:100%; display:flex; flex-direction:column; background:var(--lbg); padding-top:40px; overflow:hidden; }
.cb-landing .ph-ai-hd { display:flex; align-items:center; gap:10px; padding:10px 14px 12px; border-bottom:1px solid var(--lline); }
.cb-landing .ph-ai-hd-av { width:32px; height:32px; border-radius:50%; background:var(--lbrand); display:flex; align-items:center; justify-content:center; }
.cb-landing .ph-ai-hd-av svg { width:16px; height:16px; stroke:#fff; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .ph-ai-hd-name { font-family:var(--lserif); font-size:16px; font-style:italic; color:var(--link); }
.cb-landing .ph-ai-hd-sub { font-size:9px; color:var(--link-400); }
.cb-landing .ph-chat { padding:10px 12px; display:flex; flex-direction:column; gap:10px; flex:1; }
.cb-landing .ph-bubble-u { background:var(--ldim); padding:9px 12px; border-radius:12px 12px 4px 12px; font-size:11px; color:var(--link-700); line-height:1.5; align-self:flex-end; max-width:84%; }
.cb-landing .ph-bubble-ai { background:var(--lbrand); padding:12px; border-radius:4px 12px 12px 12px; }
.cb-landing .ph-bubble-ai .ey { font-size:8px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.6); margin-bottom:6px; }
.cb-landing .ph-bubble-ai .bd { font-family:var(--lserif); font-size:13px; font-style:italic; color:#fff; line-height:1.4; }
.cb-landing .ph-reason { background:var(--lbrand-tint); border-radius:8px; padding:7px 10px; margin-top:2px; }
.cb-landing .ph-reason-t { font-size:10px; font-weight:600; color:var(--link); margin-bottom:1px; }
.cb-landing .ph-reason-s { font-size:9px; color:var(--link-500); }
.cb-landing .ph-input-bar { background:var(--lsurface); margin:0 8px 8px; border-radius:var(--lr-pill); padding:0 8px 0 14px; height:38px; display:flex; align-items:center; gap:6px; box-shadow:var(--lsh-md),var(--lsh-ring); flex-shrink:0; }
.cb-landing .ph-input-placeholder { font-size:10px; color:var(--link-300); flex:1; }
.cb-landing .ph-send { width:26px; height:26px; border-radius:50%; background:var(--lbrand); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cb-landing .ph-send svg { width:12px; height:12px; stroke:#fff; fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .trust-strip { background:var(--lbrand); height:52px; overflow:hidden; }
.cb-landing .trust-track { display:flex; align-items:center; height:100%; animation:cbl-marquee 32s linear infinite; width:max-content; }
.cb-landing .trust-item { display:inline-flex; align-items:center; gap:10px; padding:0 28px; flex-shrink:0; font-family:var(--lmono); font-size:12px; font-weight:600; letter-spacing:.06em; color:rgba(255,255,255,.78); }
.cb-landing .trust-sep { width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,.3); flex-shrink:0; }
@keyframes cbl-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.cb-landing .sec-header { margin-bottom:52px; }
.cb-landing .sec-eyebrow { margin-bottom:12px; }
.cb-landing .sec-title { font-family:var(--lserif); font-size:clamp(32px,4vw,52px); font-weight:300; font-style:italic; letter-spacing:-.025em; line-height:1.05; text-wrap:balance; color:var(--link); }
.cb-landing .sec-sub { font-size:16px; color:var(--link-500); line-height:1.6; max-width:540px; margin-top:12px; }
.cb-landing .bento { display:grid; grid-template-columns:1fr 1fr; grid-template-rows:auto auto; gap:18px; }
.cb-landing .bc { border-radius:var(--lr-xl); padding:36px; position:relative; overflow:hidden; }
.cb-landing .bc-surface { background:var(--lsurface); box-shadow:var(--lsh-md),var(--lsh-ring); }
.cb-landing .bc-warm { background:var(--lwarm); }
.cb-landing .bc-green { background:var(--lbrand); color:#fff; }
.cb-landing .bc-wash { background:var(--lbrand-wash); }
.cb-landing .bc-tall { grid-row:span 2; }
.cb-landing .bc-icon { width:48px; height:48px; border-radius:var(--lr-md); display:flex; align-items:center; justify-content:center; margin-bottom:22px; }
.cb-landing .bc-icon svg { width:24px; height:24px; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .bc-icon.gi { background:rgba(255,255,255,.14); }
.cb-landing .bc-icon.gi svg { stroke:rgba(255,255,255,.9); }
.cb-landing .bc-icon.bi { background:var(--lbrand-wash); }
.cb-landing .bc-icon.bi svg { stroke:var(--lbrand); }
.cb-landing .bc-icon.wi { background:var(--lbrand-tint); }
.cb-landing .bc-icon.wi svg { stroke:var(--lbrand); }
.cb-landing .bc-icon.ai { background:var(--laccent-soft); }
.cb-landing .bc-icon.ai svg { stroke:var(--laccent); }
.cb-landing .bc-ey { font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; margin-bottom:10px; color:var(--lbrand); }
.cb-landing .bc-green .bc-ey { color:rgba(255,255,255,.62); }
.cb-landing .bc-wash .bc-ey { color:var(--lbrand); }
.cb-landing .bc-h { font-family:var(--lserif); font-size:27px; font-style:italic; font-weight:400; letter-spacing:-.02em; line-height:1.12; margin-bottom:10px; color:var(--link); }
.cb-landing .bc-green .bc-h { color:#fff; }
.cb-landing .bc-p { font-size:15px; line-height:1.62; color:var(--link-500); }
.cb-landing .bc-green .bc-p { color:rgba(255,255,255,.65); }
.cb-landing .bc-deco { margin-top:24px; }
.cb-landing .bc-bars { display:flex; gap:5px; align-items:flex-end; height:48px; }
.cb-landing .bc-bar { flex:1; border-radius:3px 3px 0 0; min-width:6px; }
.cb-landing .bc-rings { display:flex; gap:12px; align-items:center; margin-top:20px; }
.cb-landing .bc-ring-item { display:flex; flex-direction:column; align-items:center; gap:4px; }
.cb-landing .bc-ring-lbl { font-size:10px; color:var(--link-400); font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
.cb-landing .how { background:var(--lbrand); color:#fff; }
.cb-landing .how .sec-eyebrow { color:rgba(255,255,255,.6); }
.cb-landing .how .sec-title { color:#fff; }
.cb-landing .how .sec-sub { color:rgba(255,255,255,.6); }
.cb-landing .steps { display:grid; grid-template-columns:repeat(3,1fr); gap:48px; margin-top:56px; }
.cb-landing .step-n { font-family:var(--lserif); font-size:80px; font-weight:300; font-style:italic; line-height:.9; letter-spacing:-.04em; color:rgba(255,255,255,.13); margin-bottom:20px; }
.cb-landing .step-icon-wrap { width:48px; height:48px; border-radius:var(--lr-md); background:rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; margin-bottom:20px; }
.cb-landing .step-icon-wrap svg { width:24px; height:24px; stroke:rgba(255,255,255,.85); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .step-h { font-family:var(--lserif); font-size:26px; font-style:italic; font-weight:400; color:#fff; margin-bottom:12px; line-height:1.15; }
.cb-landing .step-p { font-size:15px; color:rgba(255,255,255,.6); line-height:1.65; }
.cb-landing .ai-sec .sec-sub { max-width:480px; }
.cb-landing .ai-inner { display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:start; margin-top:56px; }
.cb-landing .ai-chat-wrap { background:var(--lsurface); border-radius:var(--lr-xl); padding:24px; box-shadow:var(--lsh-lg),var(--lsh-ring); }
.cb-landing .ai-chat-hd { display:flex; align-items:center; gap:12px; padding-bottom:16px; border-bottom:1px solid var(--lline); margin-bottom:16px; }
.cb-landing .ai-chat-av { width:38px; height:38px; border-radius:50%; background:var(--lbrand); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cb-landing .ai-chat-av svg { width:18px; height:18px; stroke:#fff; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .ai-chat-name { font-family:var(--lserif); font-size:18px; font-style:italic; color:var(--link); }
.cb-landing .ai-chat-sub { font-size:11px; color:var(--link-400); }
.cb-landing .chat-u { background:var(--ldim); padding:12px 16px; border-radius:var(--lr-lg) var(--lr-lg) 4px var(--lr-lg); font-size:14px; color:var(--link-700); line-height:1.5; max-width:82%; margin-left:auto; margin-bottom:14px; }
.cb-landing .chat-b { background:var(--lbrand); padding:18px 20px; border-radius:4px var(--lr-lg) var(--lr-lg) var(--lr-lg); margin-bottom:12px; }
.cb-landing .chat-b .ey { font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.58); margin-bottom:10px; }
.cb-landing .chat-b .bd { font-family:var(--lserif); font-size:18px; font-style:italic; color:#fff; line-height:1.35; letter-spacing:-.01em; }
.cb-landing .chat-reason { background:var(--lbrand-tint); border-radius:var(--lr-md); padding:12px 14px; margin-bottom:8px; display:flex; gap:10px; align-items:flex-start; }
.cb-landing .cr-icon { width:30px; height:30px; border-radius:8px; background:var(--lbrand-wash); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cb-landing .cr-icon svg { width:14px; height:14px; stroke:var(--lbrand); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .cr-t { font-size:13px; font-weight:600; color:var(--link); margin-bottom:2px; }
.cb-landing .cr-s { font-size:11px; color:var(--link-500); }
.cb-landing .chat-chips { display:flex; gap:8px; margin-top:16px; flex-wrap:wrap; }
.cb-landing .cc { display:inline-flex; align-items:center; gap:5px; height:28px; padding:0 12px; border-radius:var(--lr-pill); background:var(--ldim); font-size:12px; font-weight:600; color:var(--link-700); }
.cb-landing .ai-copy-h { font-family:var(--lserif); font-size:clamp(28px,3vw,40px); font-style:italic; font-weight:300; letter-spacing:-.025em; line-height:1.1; color:var(--link); margin:14px 0 16px; }
.cb-landing .ai-copy-p { font-size:15px; color:var(--link-500); line-height:1.65; margin-bottom:18px; }
.cb-landing .ai-feature-row { display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid var(--lline); }
.cb-landing .ai-feature-row:last-child { border-bottom:none; }
.cb-landing .af-icon { width:36px; height:36px; border-radius:10px; background:var(--lbrand-wash); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cb-landing .af-icon svg { width:18px; height:18px; stroke:var(--lbrand); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .af-t { font-size:14px; font-weight:600; color:var(--link); margin-bottom:2px; }
.cb-landing .af-s { font-size:12px; color:var(--link-500); line-height:1.5; }
.cb-landing .testimonials { background:var(--lwarm); }
.cb-landing .testi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:48px; }
.cb-landing .testi-card { background:var(--lsurface); border-radius:var(--lr-xl); padding:28px; box-shadow:var(--lsh-md),var(--lsh-ring); }
.cb-landing .testi-stars { display:flex; gap:2px; margin-bottom:14px; }
.cb-landing .testi-stars svg { width:14px; height:14px; fill:var(--lgold); }
.cb-landing .testi-q { font-family:var(--lserif); font-size:17px; font-style:italic; font-weight:400; letter-spacing:-.01em; line-height:1.4; color:var(--link); margin-bottom:16px; }
.cb-landing .testi-who { display:flex; align-items:center; gap:10px; }
.cb-landing .testi-av { width:34px; height:34px; border-radius:50%; background:var(--lbrand-wash); display:flex; align-items:center; justify-content:center; font-family:var(--lserif); font-size:14px; font-style:italic; color:var(--lbrand); }
.cb-landing .testi-name { font-size:13px; font-weight:600; color:var(--link); margin-bottom:1px; }
.cb-landing .testi-loc { font-size:11px; color:var(--link-400); }
.cb-landing .cta-sec { background:var(--lbrand); color:#fff; padding:108px 0; text-align:center; position:relative; overflow:hidden; }
.cb-landing .cta-bg { position:absolute; right:-160px; bottom:-140px; opacity:.12; pointer-events:none; }
.cb-landing .cta-inner { position:relative; z-index:1; max-width:680px; margin:0 auto; }
.cb-landing .cta-badge { display:inline-flex; align-items:center; gap:7px; height:26px; padding:0 12px; border-radius:var(--lr-pill); background:rgba(255,255,255,.14); font-size:11px; font-weight:600; color:rgba(255,255,255,.8); letter-spacing:.1em; text-transform:uppercase; margin-bottom:22px; }
.cb-landing .cta-h { font-family:var(--lserif); font-size:clamp(36px,5vw,62px); font-weight:300; font-style:italic; letter-spacing:-.03em; line-height:1.0; color:#fff; margin-bottom:16px; text-wrap:balance; }
.cb-landing .cta-sub { font-size:17px; color:rgba(255,255,255,.65); line-height:1.6; margin-bottom:32px; max-width:540px; margin-left:auto; margin-right:auto; }
.cb-landing .cta-chips { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-bottom:36px; }
.cb-landing .cta-chip { display:inline-flex; align-items:center; gap:6px; height:30px; padding:0 14px; border-radius:var(--lr-pill); background:rgba(255,255,255,.12); font-size:13px; font-weight:600; color:rgba(255,255,255,.85); }
.cb-landing .cta-chip svg { width:13px; height:13px; stroke:rgba(255,255,255,.75); fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .cta-actions { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
.cb-landing .cta-price { font-size:12px; color:rgba(255,255,255,.45); margin-top:14px; font-family:var(--lmono); letter-spacing:.04em; }
.cb-landing footer.cbl-footer { background:var(--lbrand-deep); padding:52px 32px; }
.cb-landing .footer-inner { max-width:1160px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:24px; }
.cb-landing .footer-logo { display:flex; align-items:center; gap:8px; font-family:var(--lserif); font-size:18px; font-style:italic; color:rgba(255,255,255,.85); letter-spacing:-.02em; }
.cb-landing .footer-logo-mark { width:26px; height:26px; border-radius:50%; background:rgba(255,255,255,.15); display:flex; align-items:center; justify-content:center; }
.cb-landing .footer-logo-mark svg { width:13px; height:13px; stroke:rgba(255,255,255,.9); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.cb-landing .footer-links { display:flex; gap:22px; flex-wrap:wrap; }
.cb-landing .footer-links a { font-size:13px; color:rgba(255,255,255,.44); transition:color .15s; }
.cb-landing .footer-links a:hover { color:rgba(255,255,255,.9); }
.cb-landing .footer-right { font-family:var(--lmono); font-size:11px; color:rgba(255,255,255,.28); letter-spacing:.04em; }
.cb-landing .fu { opacity:0; transform:translateY(26px); transition:opacity .65s ease, transform .65s ease; }
.cb-landing .fu.vis { opacity:1; transform:none; }
.cb-landing .d1 { transition-delay:.08s; } .cb-landing .d2 { transition-delay:.18s; }
.cb-landing .d3 { transition-delay:.28s; } .cb-landing .d4 { transition-delay:.38s; }
@media(max-width:960px){
  .cb-landing .nav-links { display:none; }
  .cb-landing .hero-inner { grid-template-columns:1fr; }
  .cb-landing .phones { display:none; }
  .cb-landing .bento { grid-template-columns:1fr; }
  .cb-landing .bc-tall { grid-row:auto; }
  .cb-landing .steps { grid-template-columns:1fr; gap:32px; }
  .cb-landing .ai-inner { grid-template-columns:1fr; }
  .cb-landing .testi-grid { grid-template-columns:1fr; }
  .cb-landing .footer-inner { flex-direction:column; align-items:flex-start; }
}
@media(max-width:600px){
  .cb-landing .hero { padding:52px 0 44px; }
  .cb-landing .section { padding:72px 0; }
  .cb-landing .wrap { padding:0 20px; }
  .cb-landing .bc { padding:26px; }
  .cb-landing nav.cbl-nav { padding:0 20px; }
}
`;

const BloomLogoSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6c2 0 3 1.5 3 3.5 0 1-.4 1.8-1 2.4M12 6c-2 0-3 1.5-3 3.5 0 1 .4 1.8 1 2.4M12 14c2 0 3-1.5 3-3.5M12 14c-2 0-3-1.5-3-3.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 14v6M9 19l-2 1M15 19l2 1" />
  </svg>
);

const Star = () => <svg viewBox="0 0 14 14"><path d="M7 1l1.6 3.4L12 5l-2.5 2.5.6 3.5L7 9.3l-3.1 1.7.6-3.5L2 5l3.4-.6L7 1z"/></svg>;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogle = async () => {
    if (authLoading) return;
    setAuthError('');
    setAuthLoading(true);
    track('signup_started', { method: 'google' });
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err?.message || 'Google sign-in failed. Please try again.');
      setAuthLoading(false);
    }
  };

  // Scroll-reveal observer
  useEffect(() => {
    const els = document.querySelectorAll('.cb-landing .fu');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('vis'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('vis');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="cb-landing">
      <style>{LANDING_CSS}</style>

      {/* NAV */}
      <nav className="cbl-nav">
        <a className="nav-logo" onClick={() => scrollTo('home')} style={{ cursor: 'pointer' }}>
          <div className="nav-mark"><BloomLogoSVG /></div>
          ChildBloom
        </a>
        <ul className="nav-links">
          <li><a onClick={() => scrollTo('features')}>Features</a></li>
          <li><a onClick={() => scrollTo('how')}>How it works</a></li>
          <li><a onClick={() => scrollTo('ai')}>Bloom AI</a></li>
          <li><a onClick={() => scrollTo('premium')}>Premium</a></li>
        </ul>
        <button className="nav-cta" onClick={handleGoogle} disabled={authLoading} aria-label="Continue with Google">
          <span className="nav-cta-g"><GoogleIcon /></span>
          {authLoading ? 'Signing in…' : 'Continue with Google'}
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-flower">
          <svg width="700" height="700" viewBox="0 0 700 700" fill="none" aria-hidden="true">
            <g opacity=".9">
              {[0, 60, 120, 180, 240, 300].map((r, i) => (
                <g key={i} transform={`translate(350,350) rotate(${r})`}>
                  <ellipse cx="0" cy="-200" rx="48" ry="120" fill={i === 2 ? '#D17A4F' : i === 5 ? '#C9A35A' : '#5FB48A'} fillOpacity={i === 2 ? '.10' : i === 5 ? '.11' : '.13'} />
                  <ellipse cx="0" cy="-200" rx="24" ry="70" fill={i === 2 ? '#D17A4F' : i === 5 ? '#C9A35A' : '#0F3D2E'} fillOpacity={i === 2 ? '.14' : i === 5 ? '.15' : '.18'} />
                </g>
              ))}
            </g>
            <circle cx="350" cy="350" r="46" fill="#F5EFE3" fillOpacity=".7" />
            <circle cx="350" cy="350" r="22" fill="#C9A35A" fillOpacity=".45" />
          </svg>
        </div>

        <div className="wrap">
          <div className="hero-inner">
            <div>
              <div className="hero-label">
                <span className="hero-dot"></span>
                Now in early access · iOS &amp; Android
              </div>
              <h1 className="hero-h1">Every day with<br />your baby,<br /><em>beautifully</em><br />understood.</h1>
              <p className="hero-sub">
                Bloom watches what you log — feeds, sleep, moods, milestones — and gently turns it into rhythms, reassurance, and guidance you can actually use.
              </p>
              <div className="hero-actions">
                <button className="btn btn-p" onClick={handleGoogle} disabled={authLoading}
                  style={{ background: 'white', color: '#1a1a1a', gap: 10 }}>
                  <GoogleIcon />
                  {authLoading ? 'Signing in…' : 'Continue with Google'}
                </button>
                <button className="btn btn-s" onClick={() => scrollTo('how')}>See how it works →</button>
              </div>
              {authError && (
                <p style={{ marginTop: 10, fontSize: 13, color: '#ef4444' }}>{authError}</p>
              )}
              <div className="hero-trust">
                <div className="stars"><Star /><Star /><Star /><Star /><Star /></div>
                <p className="trust-text"><strong>Loved by early parents</strong> · Free forever for the basics</p>
              </div>
            </div>

            <div className="phones">
              {/* Phone 1 — Home */}
              <div className="pw pw-1">
                <div className="pf">
                  <div className="p-island"></div>
                  <div className="ps">
                    <div className="ph-home">
                      <div className="ph-greeting">
                        <div className="ph-av">A</div>
                        <div>
                          <div className="ph-gr-sub">Good afternoon, Vaibhav</div>
                          <div className="ph-gr-main"><em>Adoa</em> had a calm afternoon.</div>
                        </div>
                      </div>
                      <div className="ph-hero-card">
                        <div className="ph-hero-ey">Today · Bloom score</div>
                        <div className="ph-score">78<span>/100</span></div>
                        <div className="ph-score-sub">Settling earlier than last week — 28 min faster on average.</div>
                        <div className="ph-stats">
                          {[
                            { l: 'Sleep', v: '12.5h', w: 89 },
                            { l: 'Feeds', v: '6', w: 75 },
                            { l: 'Mood', v: 'calm', w: 82 },
                          ].map((s) => (
                            <div key={s.l} className="ph-stat">
                              <div className="ph-stat-lbl">{s.l}</div>
                              <div className="ph-stat-val">{s.v}</div>
                              <div className="ph-bar"><div className="ph-bar-fill" style={{ width: `${s.w}%` }}></div></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="ph-tiles-row">
                        <div className="ph-tiles-lbl">Log in one tap</div>
                        <div className="ph-tiles">
                          {['Feed', 'Sleep', 'Diaper', 'Growth', 'Meds', 'Mood', 'Milestone', 'Note'].map((t, i) => (
                            <div key={t} className={`ph-tile${i === 2 || i === 4 ? ' w' : ''}`}>
                              <svg viewBox="0 0 24 24"><path d="M9 3l3 5 3-5M12 8v6M7 14a5 5 0 0010 0" /></svg>
                              <span>{t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="ph-aiblock">
                        <div className="ph-ai-icon">
                          <svg viewBox="0 0 24 24"><path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" /></svg>
                        </div>
                        <div className="ph-ai-txt"><strong>Bloom · pattern</strong> — Adoa's settling earlier. Hold the rhythm tonight.</div>
                      </div>
                      <div className="ph-nav">
                        <div className="ph-nav-item on"><svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z" /></svg><span>Home</span></div>
                        <div className="ph-nav-item"><svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="12" r="2" /><path d="M6 8v8M8 6h8M8 18h8" /></svg><span>Timeline</span></div>
                        <div className="ph-nav-bloom"><BloomLogoSVG /></div>
                        <div className="ph-nav-item"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z" /></svg><span>Care</span></div>
                        <div className="ph-nav-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-4 4-6 7-6s6 2 6 5" /></svg><span>You</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 2 — AI */}
              <div className="pw pw-2">
                <div className="pf">
                  <div className="p-island"></div>
                  <div className="ps">
                    <div className="ph-ai-screen">
                      <div className="ph-ai-hd">
                        <div className="ph-ai-hd-av">
                          <svg viewBox="0 0 24 24"><path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" /></svg>
                        </div>
                        <div>
                          <div className="ph-ai-hd-name">Dr. Bloom</div>
                          <div className="ph-ai-hd-sub">knows Adoa · 3 months</div>
                        </div>
                      </div>
                      <div className="ph-chat">
                        <div className="ph-bubble-u">Why was Adoa fussier this afternoon?</div>
                        <div className="ph-bubble-ai">
                          <div className="ey">Bloom · pattern</div>
                          <div className="bd">Two things lined up today —</div>
                        </div>
                        <div className="ph-reason">
                          <div className="ph-reason-t">Short morning nap · 32 min</div>
                          <div className="ph-reason-s">vs. 48 min average · sleep debt by noon</div>
                        </div>
                        <div className="ph-reason">
                          <div className="ph-reason-t">Feed gap of 4 hours</div>
                          <div className="ph-reason-s">longer than typical 2.5h window</div>
                        </div>
                      </div>
                      <div className="ph-input-bar">
                        <div className="ph-input-placeholder">Ask Dr. Bloom anything…</div>
                        <div className="ph-send">
                          <svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 18-3-7-7-3z" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="trust-strip" aria-hidden="true">
        <div className="trust-track">
          {[1, 2].map((dup) => (
            <>
              {[
                '3 SECONDS TO LOG A FEED',
                'ONE-TAP + VOICE LOGGING',
                'DR. BLOOM · PATTERN REASONING',
                'MILESTONES TO AGE 3',
                'FAMILY CIRCLE · UP TO 6 CAREGIVERS',
                'DOCTOR-READY PDF REPORTS',
                'FREE FOREVER FOR THE BASICS',
              ].map((t, i) => (
                <span key={`${dup}-${i}`}>
                  <span className="trust-item">{t}</span>
                  <span className="trust-sep"></span>
                </span>
              ))}
            </>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="wrap">
          <div className="sec-header fu">
            <p className="eyebrow sec-eyebrow">What makes Bloom different</p>
            <h2 className="sec-title">Built for real parenthood,<br />not a perfect spreadsheet.</h2>
            <p className="sec-sub">Logging should feel effortless. Insights should feel like a friend who's read every study so you don't have to.</p>
          </div>
          <div className="bento">
            <div className="bc bc-green bc-tall fu d1">
              <div className="bc-icon gi"><svg viewBox="0 0 24 24"><path d="M9 3l3 5 3-5M12 8v6M7 14a5 5 0 0010 0" /></svg></div>
              <p className="bc-ey">Effortless logging</p>
              <h3 className="bc-h">Log in a heartbeat — or a sentence.</h3>
              <p className="bc-p">One tap, or say "She fed for 14 minutes on the left, then I changed her." Bloom hears it and files it. No forms, no friction.</p>
              <div className="bc-deco">
                <div className="bc-bars">
                  {[60, 75, 55, 85, 70, 90, 80].map((h, i) => (
                    <div key={i} className="bc-bar" style={{ height: `${h}%`, background: `rgba(255,255,255,${0.18 + (h / 100) * 0.2})` }}></div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.06em' }}>FEED DURATION · 7 DAYS</p>
              </div>
            </div>

            <div className="bc bc-surface fu d2">
              <div className="bc-icon bi"><svg viewBox="0 0 24 24"><path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" /></svg></div>
              <p className="bc-ey">Dr. Bloom AI</p>
              <h3 className="bc-h">Insights that actually explain things.</h3>
              <p className="bc-p">Not "feed logged." But "the short nap and the 4-hour feed gap lined up — that's probably why she was fussier." Bloom shows its work.</p>
              <div className="bc-deco">
                <svg width="100%" height="44" viewBox="0 0 260 44" fill="none">
                  <defs>
                    <linearGradient id="cbl-sg1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#0F3D2E" stopOpacity=".18" />
                      <stop offset="100%" stopColor="#0F3D2E" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 36 L26 30 L52 34 L78 22 L104 26 L130 14 L156 18 L182 10 L208 14 L234 6 L260 10 L260 44 L0 44 Z" fill="url(#cbl-sg1)" />
                  <path d="M0 36 L26 30 L52 34 L78 22 L104 26 L130 14 L156 18 L182 10 L208 14 L234 6 L260 10" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ fontSize: 10, color: 'var(--link-400)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.06em' }}>SLEEP TREND · IMPROVING</p>
              </div>
            </div>

            <div className="bc bc-warm fu d3">
              <div className="bc-icon ai"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 5.4L20 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.4-.6L12 2z" /></svg></div>
              <p className="bc-ey" style={{ color: 'var(--laccent)' }}>Milestones</p>
              <h3 className="bc-h">A journey to age 3, mapped kindly.</h3>
              <p className="bc-p">Bloom tracks milestones from rolling to first sentences — and predicts what's coming next, so nothing feels like a surprise.</p>
              <div className="bc-deco bc-rings">
                <div className="bc-ring-item">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#E5E7E1" strokeWidth="6" />
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#D17A4F" strokeWidth="6" strokeLinecap="round" strokeDasharray="85 28" transform="rotate(-90 24 24)" />
                    <text x="24" y="28" textAnchor="middle" fontFamily="Fraunces,serif" fontSize="12" fontStyle="italic" fill="#0B1714">73%</text>
                  </svg>
                  <span className="bc-ring-lbl">Rolling</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--link-500)', lineHeight: 1.5 }}>Rolling over · <strong style={{ color: 'var(--link)' }}>12 days away</strong><br />73% confidence · based on her rhythm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor PDF feature card */}
          <div className="bc bc-wash fu" style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <div>
              <div className="bc-icon wi" style={{ marginBottom: 20 }}>
                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></svg>
              </div>
              <p className="bc-ey">Doctor-ready reports</p>
              <h3 className="bc-h" style={{ color: 'var(--link)' }}>One tap, full medical history PDF.</h3>
              <p className="bc-p">Vaccines, growth, weekly check-ins, feeding logs — all neatly formatted for your pediatrician. Print it, email it, walk in prepared.</p>
            </div>
            <div>
              <div style={{ background: 'var(--lsurface)', borderRadius: 'var(--lr-lg)', padding: 16, boxShadow: 'var(--lsh-sm), var(--lsh-ring)' }}>
                {[
                  { label: 'Growth records', count: '8 measurements' },
                  { label: 'Vaccinations', count: '9 of 14 complete' },
                  { label: 'Weekly check-ins', count: '6 logged' },
                  { label: 'Feed & sleep logs', count: '30 days' },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--lline)' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lbrand)' }}></div>
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--link)', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--link-400)', fontFamily: 'JetBrains Mono, monospace' }}>{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how" id="how">
        <div className="wrap">
          <div className="sec-header fu">
            <p className="eyebrow sec-eyebrow">How it works</p>
            <h2 className="sec-title">From first log to first insight<br />in three days.</h2>
            <p className="sec-sub">Bloom doesn't need months of data — a few days of logs and it starts to see your baby's rhythm.</p>
          </div>
          <div className="steps">
            {[
              { n: '01', icon: <path d="M9 3l3 5 3-5M12 8v6M7 14a5 5 0 0010 0" />, h: 'Log what happens.', p: 'One tap for a feed, a sleep, a diaper. Or speak — "she fed for 12 minutes, then fussed a bit." Bloom files it all in seconds.' },
              { n: '02', icon: <path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" />, h: 'Bloom learns the rhythm.', p: 'Dr. Bloom reads every log and notices what you might miss — when she sleeps best, how feeds cluster, what moods follow what gaps.' },
              { n: '03', icon: <><circle cx="12" cy="12" r="9" /><path d="M9 10h.01M15 10h.01M8.5 14a4 4 0 007 0" /></>, h: 'You understand everything.', p: 'Not raw charts. Gentle, plain-language insights — "the short nap lines up with the fussiness" — delivered when you need them.' },
            ].map((s, i) => (
              <div key={s.n} className={`fu d${i + 1}`}>
                <div className="step-n">{s.n}</div>
                <div className="step-icon-wrap"><svg viewBox="0 0 24 24">{s.icon}</svg></div>
                <h3 className="step-h">{s.h}</h3>
                <p className="step-p">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SHOWCASE */}
      <section className="section ai-sec" id="ai">
        <div className="wrap">
          <div className="sec-header fu">
            <p className="eyebrow sec-eyebrow">Meet Dr. Bloom</p>
            <h2 className="sec-title">Not a chatbot. A reasoning layer<br />that knows your baby.</h2>
          </div>
          <div className="ai-inner">
            <div className="ai-chat-wrap fu d1">
              <div className="ai-chat-hd">
                <div className="ai-chat-av">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" /></svg>
                </div>
                <div>
                  <div className="ai-chat-name">Dr. Bloom</div>
                  <div className="ai-chat-sub">knows Adoa · 3 months old</div>
                </div>
              </div>
              <div className="chat-u">Why was Adoa fussier this afternoon?</div>
              <div className="chat-b">
                <div className="ey">Bloom · pattern detected</div>
                <div className="bd">Two things lined up today —</div>
              </div>
              <div className="chat-reason">
                <div className="cr-icon"><svg viewBox="0 0 24 24"><path d="M21 13a9 9 0 11-10-10 7 7 0 0010 10z" /></svg></div>
                <div>
                  <div className="cr-t">Short morning nap · 32 min</div>
                  <div className="cr-s">vs. 48 min average · sleep debt building by noon</div>
                </div>
              </div>
              <div className="chat-reason">
                <div className="cr-icon"><svg viewBox="0 0 24 24"><path d="M9 3l3 5 3-5M12 8v6M7 14a5 5 0 0010 0" /></svg></div>
                <div>
                  <div className="cr-t">Feed gap of 4 hours</div>
                  <div className="cr-s">longer than her typical 2.5h window — likely hungry</div>
                </div>
              </div>
              <div style={{ padding: '14px 0 0', borderTop: '1px solid var(--lline)', marginTop: 14, fontSize: 14, color: 'var(--link-500)', lineHeight: 1.55 }}>
                Both are normal at 13 weeks. Try an earlier wind-down tonight to reset her rhythm.
              </div>
              <div className="chat-chips">
                <div className="cc">Remind me at 6:50 →</div>
                <div className="cc">Why is this normal?</div>
                <div className="cc">Sleep plan</div>
              </div>
            </div>

            <div className="fu d2">
              <p className="eyebrow">How Dr. Bloom thinks</p>
              <h3 className="ai-copy-h">It sees patterns, not just entries.</h3>
              <p className="ai-copy-p">Every log teaches Bloom something. Over days, it builds a picture of your baby's unique rhythm — and when something's off, it tells you why, not just what.</p>
              {[
                { icon: <><path d="M4 20l5-5 4 4 7-9" /><path d="M14 10h6v6" /></>, t: 'Predictive windows', s: 'Bloom predicts optimal sleep times based on her patterns — not a generic schedule.' },
                { icon: <path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" />, t: 'Leap detection', s: 'Cluster feeds? Fussier evenings? Bloom flags developmental leaps early.' },
                { icon: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>, t: 'Grounded in your data', s: "Every answer references your child's actual logs — not generic advice." },
              ].map((f) => (
                <div key={f.t} className="ai-feature-row">
                  <div className="af-icon"><svg viewBox="0 0 24 24">{f.icon}</svg></div>
                  <div><div className="af-t">{f.t}</div><div className="af-s">{f.s}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section testimonials">
        <div className="wrap">
          <div className="sec-header fu" style={{ textAlign: 'center' }}>
            <p className="eyebrow sec-eyebrow">What parents say</p>
            <h2 className="sec-title">Real parents. Real rhythms.</h2>
          </div>
          <div className="testi-grid">
            {[
              { q: '"Bloom predicted Adoa\'s 4-month sleep regression a week early. The wind-down routine it suggested actually worked the first night."', n: 'Neha R.', loc: 'Mumbai · 4-month-old', a: 'N' },
              { q: '"I used to dread the \'track everything\' apps. Bloom is the first one that feels like it\'s on my side — not asking me to prove I\'m a good parent."', n: 'Shruti K.', loc: 'Bengaluru · 8-month-old', a: 'S' },
              { q: '"The family circle changed everything. My partner and I finally stopped asking \'did she eat yet?\' — Bloom just shows us both."', n: 'Arjun M.', loc: 'Delhi · 14-month-old', a: 'A' },
            ].map((t, i) => (
              <div key={t.n} className={`testi-card fu d${i + 1}`}>
                <div className="testi-stars"><Star /><Star /><Star /><Star /><Star /></div>
                <p className="testi-q">{t.q}</p>
                <div className="testi-who">
                  <div className="testi-av">{t.a}</div>
                  <div>
                    <div className="testi-name">{t.n}</div>
                    <div className="testi-loc">{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM CTA */}
      <section className="section cta-sec" id="premium">
        <div className="cta-bg">
          <svg width="600" height="600" viewBox="0 0 600 600" fill="none" aria-hidden="true">
            <g transform="translate(300,300)">
              {[0, 60, 120, 180, 240, 300].map((r) => (
                <g key={r} transform={`rotate(${r})`}>
                  <ellipse cx="0" cy="-190" rx="44" ry="110" fill="white" fillOpacity=".08" />
                  <ellipse cx="0" cy="-190" rx="22" ry="65" fill="white" fillOpacity=".12" />
                </g>
              ))}
            </g>
          </svg>
        </div>
        <div className="wrap">
          <div className="cta-inner fu">
            <div className="cta-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z" /></svg>
              Try ChildBloom today
            </div>
            <h2 className="cta-h">Every signal, kindly explained.<br />Free to start.</h2>
            <p className="cta-sub">One subscription unlocks Dr. Bloom's full reasoning, your family circle, weekly reports, and a milestone roadmap all the way to age 3.</p>
            <div className="cta-chips">
              {[
                { icon: <path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" />, l: 'Dr. Bloom · unlimited' },
                { icon: <path d="M4 20l5-5 4 4 7-9" />, l: 'WHO/IAP growth overlays' },
                { icon: <><circle cx="8" cy="8" r="3" /><path d="M2 20c0-3 2-5 6-5s6 2 6 5" /><circle cx="17" cy="8" r="3" /><path d="M22 20c0-3-2-5-6-5" /></>, l: 'Family circle · 6 caregivers' },
                { icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><path d="M14 2v6h6" /></>, l: 'Doctor-ready PDFs' },
                { icon: <path d="M12 2l2.6 5.4L20 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.4-.6L12 2z" />, l: 'Bloom Path · age 0–3' },
              ].map((c) => (
                <div key={c.l} className="cta-chip">
                  <svg viewBox="0 0 24 24">{c.icon}</svg>
                  {c.l}
                </div>
              ))}
            </div>
            <div className="cta-actions">
              <button className="btn btn-w" onClick={handleGoogle} disabled={authLoading}
                style={{ gap: 10 }}>
                <GoogleIcon />
                {authLoading ? 'Signing in…' : 'Continue with Google — it\'s free'}
              </button>
            </div>
            <p className="cta-price">FREE FOREVER FOR BASICS · NO CARD REQUIRED · CANCEL ANYTIME</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="cbl-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <div className="footer-logo-mark"><BloomLogoSVG /></div>
            ChildBloom
          </div>
          <nav className="footer-links" aria-label="Footer">
            <a onClick={() => scrollTo('features')}>Features</a>
            <a onClick={() => scrollTo('ai')}>Dr. Bloom</a>
            <a onClick={() => navigate('/privacy')}>Privacy</a>
            <a onClick={() => navigate('/emergency')}>Emergency</a>
            <a onClick={handleGoogle} style={{ cursor: 'pointer' }}>Sign in</a>
          </nav>
          <p className="footer-right">© 2026 CHILDBLOOM · BUILT WITH CARE</p>
        </div>
      </footer>
    </div>
  );
}
