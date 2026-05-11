// Doctor-ready PDF report generator. Pulls all of a child's records and
// formats them as a clean, printable A4 document. Uses jsPDF + autoTable.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';
import { differenceInDays, format } from 'date-fns';

const BRAND = [15, 61, 46];           // forest green RGB
const INK   = [11, 23, 20];
const INK_5 = [75, 86, 81];
const INK_3 = [142, 150, 144];
const LINE  = [229, 231, 225];

function ageLabel(dob) {
  if (!dob) return '—';
  const days = differenceInDays(new Date(), new Date(dob));
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} yr ${m} mo` : `${y} years`;
}

function fmt(date) {
  if (!date) return '—';
  return format(new Date(date), 'd MMM yyyy');
}

// ─── Data fetcher ───────────────────────────────────────────────────────

export async function fetchChildReportData(childId) {
  const [
    { data: child },
    { data: growth },
    { data: vaccinations },
    { data: weeklyUpdates },
    { data: foodLogs },
    { data: healthRecords },
    { data: sleepLogs },
  ] = await Promise.all([
    supabase.from('children').select('*').eq('id', childId).single(),
    supabase.from('growth_records').select('*').eq('child_id', childId).order('record_date', { ascending: false }),
    supabase.from('vaccinations').select('*').eq('child_id', childId).order('next_due', { ascending: true }),
    supabase.from('weekly_updates').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(8),
    supabase.from('food_logs').select('*').eq('child_id', childId).order('logged_date', { ascending: false }).limit(30),
    supabase.from('health_records').select('*').eq('child_id', childId).order('record_date', { ascending: false }),
    supabase.from('sleep_logs').select('*').eq('child_id', childId).order('logged_date', { ascending: false }).limit(14),
  ]);

  return {
    child,
    growth: growth || [],
    vaccinations: vaccinations || [],
    weeklyUpdates: weeklyUpdates || [],
    foodLogs: foodLogs || [],
    healthRecords: healthRecords || [],
    sleepLogs: sleepLogs || [],
  };
}

// ─── PDF builder ────────────────────────────────────────────────────────

export function generateChildReportPdf(data) {
  const { child, growth, vaccinations, weeklyUpdates, foodLogs, healthRecords, sleepLogs } = data;
  if (!child) throw new Error('No child data');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16; // margin

  // ─── Header band ─────────────────────────────────────────────────
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 38, 'F');

  // Logo dot
  doc.setFillColor(255, 255, 255);
  doc.circle(M + 4, 18, 4, 'F');
  doc.setFillColor(...BRAND);
  doc.circle(M + 4, 18, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('CHILDBLOOM', M + 12, 16);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Pediatric Health Report', M + 12, 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255, 0.7);
  doc.text(`Generated ${format(new Date(), 'd MMM yyyy, HH:mm')}`, W - M, 16, { align: 'right' });
  doc.text('For pediatrician review', W - M, 22, { align: 'right' });

  let y = 50;

  // ─── Child profile ───────────────────────────────────────────────
  doc.setTextColor(...INK_3);
  doc.setFontSize(8);
  doc.text('CHILD PROFILE', M, y);
  y += 6;

  doc.setTextColor(...INK);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(child.name || '—', M, y + 2);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK_5);
  doc.text(`${ageLabel(child.date_of_birth)} old · born ${fmt(child.date_of_birth)}`, M, y);
  y += 8;

  // Profile fact grid
  const facts = [
    ['Gender', child.gender ? child.gender[0].toUpperCase() + child.gender.slice(1) : '—'],
    ['Pronouns', child.pronouns || '—'],
    ['Birth weight', child.birth_weight_grams ? `${(child.birth_weight_grams / 1000).toFixed(2)} kg` : '—'],
    ['Gestational age', child.gestational_age_at_birth ? `${child.gestational_age_at_birth} weeks${child.is_premature ? ' (premature)' : ''}` : '—'],
    ['Blood group', child.blood_group || '—'],
    ['Known allergies', child.known_allergies?.length ? child.known_allergies.join(', ') : 'None recorded'],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    body: facts,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 0, right: 4 }, textColor: INK },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: INK_3, cellWidth: 38 },
      1: { textColor: INK },
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── Growth records ───────────────────────────────────────────────
  y = section(doc, 'Growth records', y, M);
  if (growth.length === 0) {
    y = emptyLine(doc, 'No growth measurements recorded.', y, M);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Date', 'Weight (kg)', 'Height (cm)', 'Head (cm)', 'Notes']],
      body: growth.slice(0, 12).map(g => [
        fmt(g.record_date),
        g.weight_kg ?? '—',
        g.height_cm ?? '—',
        g.head_circumference_cm ?? '—',
        g.notes || '',
      ]),
      headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: INK },
      alternateRowStyles: { fillColor: [248, 246, 240] },
      styles: { cellPadding: 3 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── Vaccinations ────────────────────────────────────────────────
  y = ensureSpace(doc, y, 50);
  y = section(doc, 'Vaccinations', y, M);
  const completed = vaccinations.filter(v => v.date_given);
  const upcoming = vaccinations.filter(v => !v.date_given && v.next_due);

  if (completed.length === 0 && upcoming.length === 0) {
    y = emptyLine(doc, 'No vaccination records.', y, M);
  } else {
    if (completed.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(...INK_5);
      doc.text(`Completed (${completed.length})`, M, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['Vaccine', 'Date given', 'Notes']],
        body: completed.map(v => [v.vaccine_name, fmt(v.date_given), v.notes || '']),
        headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 9, textColor: INK },
        alternateRowStyles: { fillColor: [248, 246, 240] },
        styles: { cellPadding: 3 },
      });
      y = doc.lastAutoTable.finalY + 6;
    }
    if (upcoming.length > 0) {
      y = ensureSpace(doc, y, 40);
      doc.setFontSize(9);
      doc.setTextColor(...INK_5);
      doc.text(`Upcoming (${upcoming.length})`, M, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['Vaccine', 'Due date', 'Status']],
        body: upcoming.slice(0, 14).map(v => {
          const days = v.next_due ? differenceInDays(new Date(v.next_due), new Date()) : null;
          const status = days === null ? '—' : days < 0 ? `Overdue ${-days}d` : days === 0 ? 'Today' : `in ${days}d`;
          return [v.vaccine_name, fmt(v.next_due), status];
        }),
        headStyles: { fillColor: [201, 163, 90], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 9, textColor: INK },
        alternateRowStyles: { fillColor: [248, 246, 240] },
        styles: { cellPadding: 3 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }
  }

  // ─── Health records ───────────────────────────────────────────────
  y = ensureSpace(doc, y, 50);
  y = section(doc, 'Health records', y, M);
  if (healthRecords.length === 0) {
    y = emptyLine(doc, 'No health records logged.', y, M);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Date', 'Type', 'Title', 'Doctor', 'Notes']],
      body: healthRecords.slice(0, 20).map(h => [
        fmt(h.record_date),
        h.record_type || '—',
        h.title || '—',
        h.doctor_name || '—',
        h.description || '',
      ]),
      headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 9, textColor: INK },
      alternateRowStyles: { fillColor: [248, 246, 240] },
      columnStyles: { 4: { cellWidth: 50 } },
      styles: { cellPadding: 3 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── Weekly check-ins ─────────────────────────────────────────────
  y = ensureSpace(doc, y, 50);
  y = section(doc, 'Weekly check-ins', y, M);
  if (weeklyUpdates.length === 0) {
    y = emptyLine(doc, 'No weekly check-ins recorded.', y, M);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Week', 'Mood', 'Sleep', 'Milestone', 'Concerns']],
      body: weeklyUpdates.map(w => [
        fmt(w.week_date || w.created_at),
        w.mood || '—',
        w.sleep_hours ? `${w.sleep_hours}h (${w.sleep_quality || '—'})` : '—',
        w.motor_milestone || w.new_skills || '—',
        w.concerns || '—',
      ]),
      headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 9, textColor: INK },
      alternateRowStyles: { fillColor: [248, 246, 240] },
      styles: { cellPadding: 3, overflow: 'linebreak' },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── Recent feeding (last 30 logs, summarized) ────────────────────
  y = ensureSpace(doc, y, 50);
  y = section(doc, `Recent feeding logs (last ${foodLogs.length})`, y, M);
  if (foodLogs.length === 0) {
    y = emptyLine(doc, 'No feeding logs in the last 30 entries.', y, M);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Date', 'Meal', 'Food', 'Quantity', 'Notes']],
      body: foodLogs.map(f => [
        fmt(f.logged_date),
        f.meal_type || '—',
        f.food_name || '—',
        f.quantity || '—',
        f.notes || '',
      ]),
      headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 9, textColor: INK },
      alternateRowStyles: { fillColor: [248, 246, 240] },
      styles: { cellPadding: 3 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── Recent sleep logs ────────────────────────────────────────────
  if (sleepLogs.length > 0) {
    y = ensureSpace(doc, y, 50);
    y = section(doc, `Recent sleep logs (last ${sleepLogs.length})`, y, M);
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Date', 'Hours slept', 'Notes']],
      body: sleepLogs.map(s => [
        fmt(s.logged_date),
        s.hours_slept ?? '—',
        s.notes || '',
      ]),
      headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 9, textColor: INK },
      alternateRowStyles: { fillColor: [248, 246, 240] },
      styles: { cellPadding: 3 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── Footer on every page ────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...INK_3);
    doc.text(
      'Generated by ChildBloom · For reference only · Not a substitute for in-person pediatric examination',
      W / 2, H - 8, { align: 'center' }
    );
    doc.text(`Page ${i} of ${pageCount}`, W - M, H - 8, { align: 'right' });
  }

  return doc;
}

// ─── helpers ─────────────────────────────────────────────────────────

function section(doc, title, y, M) {
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(M, y, doc.internal.pageSize.getWidth() - M, y);
  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(...BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), M, y);
  doc.setFont('helvetica', 'normal');
  return y + 5;
}

function emptyLine(doc, text, y, M) {
  doc.setFontSize(9);
  doc.setTextColor(...INK_3);
  doc.setFont('helvetica', 'italic');
  doc.text(text, M, y);
  doc.setFont('helvetica', 'normal');
  return y + 8;
}

function ensureSpace(doc, y, needed) {
  const H = doc.internal.pageSize.getHeight();
  if (y + needed > H - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ─── one-shot helper ─────────────────────────────────────────────────

export async function downloadChildReport(childId) {
  const data = await fetchChildReportData(childId);
  if (!data.child) throw new Error('Child not found');
  const doc = generateChildReportPdf(data);
  const slug = (data.child.name || 'child').replace(/[^\w]+/g, '_').toLowerCase();
  const date = format(new Date(), 'yyyy-MM-dd');
  doc.save(`childbloom_${slug}_${date}.pdf`);
}
