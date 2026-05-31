'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart2, Calendar, ClipboardList, Download, FileText, TrendingUp, Trash2, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import RapportMensuelTemplate from '@/src/templates/RapportMensuelTemplate';
import InventaireSiteTemplate from '@/src/templates/InventaireSiteTemplate';
import HistoriqueTransfertsTemplate from '@/src/templates/HistoriqueTransfertsTemplate';
import TauxDisponibiliteTemplate from '@/src/templates/TauxDisponibiliteTemplate';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteFilter } from '@/components/ui/SiteFilter';
import { useAppSelector } from '@/lib/redux-hooks';
import { isMagasin } from '@/src/utils/siteConfig';
import { supabase } from '@/lib/supabase';
import {
  cardItem,
  dropdownMenu,
  modalBackdrop,
  modalContent,
  spinnerMotion,
  staggerContainer,
  tableRow,
  toastMotion
} from '@/src/animations/variants';

type ReportType = 'mensuel' | 'inventaire' | 'transfert' | 'kpi';
type TemplateType = 'mensuel' | 'inventaire' | 'transferts' | 'disponibilite';
type ReportFilters = { site: string; projet: string; atelier: string; dateDebut: string; dateFin: string };
type ReportDataValue = string | number | undefined;
type ReportDataRow = Record<string, ReportDataValue>;
type InventoryTemplateRow = any;
type TransferTemplateRow = any;
type AvailabilityTemplateRow = any;
type ActiveTemplate = {
  type: TemplateType;
  donnees: any;
  filtres: ReportFilters;
  periode: { debut: string; fin: string };
  dateGeneration: string;
};
type ToastState = { message: string; tone: 'pending' | 'success' } | null;
type FilterModalState = { type: ReportType; title: string } | null;
type FilterOptions = { projets: string[]; sites: string[]; ateliers: string[] };

const RAPPORT_CARDS: { type: ReportType; icon: any; title: string; description: string }[] = [
  {
    type: 'mensuel',
    icon: FileText,
    title: 'Rapport mensuel',
    description: 'Synthèse des scans, inventaires et mouvements du mois en cours.'
  },
  {
    type: 'inventaire',
    icon: ClipboardList,
    title: 'Inventaire par site',
    description: 'État des présences par site CST, T6 et TTR — projets NH90 & H160.'
  },
  {
    type: 'transfert',
    icon: TrendingUp,
    title: 'Historique des transferts',
    description: 'Liste des transferts validés, en cours et annulés sur 90 jours.'
  },
  {
    type: 'kpi',
    icon: BarChart2,
    title: 'Taux de disponibilité',
    description: 'KPI disponibilité outillages par atelier et projet Airbus.'
  }
];

const DEFAULT_FILTERS: ReportFilters = {
  dateDebut: '',
  dateFin: '',
  projet: 'Tous',
  site: 'Tous',
  atelier: 'Tous'
};

const FALLBACK_FILTER_OPTIONS: FilterOptions = {
  projets: ['NH90', 'H160'],
  sites: ['CST 1', 'T6', 'TTR'],
  ateliers: ['Production', 'Maintenance', 'Contrôle', 'Métrologie']
};

type RecentItem = {
  id: string;
  type: ReportType;
  label: string;
  date: string;
  nom: string;
  dateGeneration: string;
  filtres: ReportFilters;
  donnees: ReportDataRow[];
};
type DownloadFormat = 'PDF' | 'Excel' | 'CSV';

const INITIAL_RECENTS: RecentItem[] = [
  {
    id: '1',
    type: 'inventaire',
    label: 'Inventaire CST 1 — Mai 2026',
    date: '28/05/2026',
    nom: 'Inventaire CST 1 — Mai 2026',
    dateGeneration: '28/05/2026',
    filtres: { site: 'CST 1', projet: 'Tous projets', atelier: 'Tous ateliers', dateDebut: '01/05/2026', dateFin: '30/05/2026' },
    donnees: [
      { Référence: 'RF-2048', Désignation: 'Gabarit perçage panneau', Site: 'CST 1', Atelier: 'A320', Projet: 'NH90', Statut: 'Disponible', 'Dernière date scan': '28/05/2026' },
      { Référence: 'RF-1982', Désignation: 'Clé dynamométrique 45Nm', Site: 'CST 1', Atelier: 'Maintenance', Projet: 'H160', Statut: 'En maintenance', 'Dernière date scan': '27/05/2026' }
    ]
  },
  {
    id: '2',
    type: 'mensuel',
    label: 'Rapport mensuel NH90',
    date: '25/05/2026',
    nom: 'Rapport mensuel NH90',
    dateGeneration: '25/05/2026',
    filtres: { site: 'Tous sites', projet: 'NH90', atelier: 'Tous ateliers', dateDebut: '01/05/2026', dateFin: '25/05/2026' },
    donnees: [
      { Indicateur: 'Total outillages', Valeur: 1248 },
      { Indicateur: 'Total transferts', Valeur: 186 },
      { Indicateur: 'Taux dispo global', Valeur: '92%' },
      { Indicateur: 'Alertes actives', Valeur: 14 }
    ]
  },
  {
    id: '3',
    type: 'transfert',
    label: 'Transferts T6 → TTR — Semaine 21',
    date: '24/05/2026',
    nom: 'Transferts T6 → TTR — Semaine 21',
    dateGeneration: '24/05/2026',
    filtres: { site: 'T6', projet: 'Tous projets', atelier: 'Tous ateliers', dateDebut: '20/05/2026', dateFin: '24/05/2026' },
    donnees: [
      { 'N° transfert': 'TR-2026-0518', Référence: 'RF-2048', 'De (site)': 'T6', 'Vers (site)': 'TTR', Projet: 'NH90', Statut: 'Validé', Date: '24/05/2026' },
      { 'N° transfert': 'TR-2026-0519', Référence: 'RF-1982', 'De (site)': 'T6', 'Vers (site)': 'TTR', Projet: 'H160', Statut: 'En cours', Date: '24/05/2026' }
    ]
  }
];

function LoadingSpinner() {
  return (
    <motion.svg
      className="h-5 w-5 text-safran-blue"
      viewBox="0 0 24 24"
      fill="none"
      variants={spinnerMotion as any}
      animate="animate"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </motion.svg>
  );
}

function StatusBadge({ children, tone }: { children: string; tone: 'green' | 'orange' | 'red' | 'blue' | 'slate' }) {
  const styles = {
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

function PreviewTable({
  columns,
  rows
}: {
  columns: string[];
  rows: (string | ReactNode)[][];
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              custom={rowIndex}
              variants={shouldReduceMotion ? undefined : (tableRow as any)}
              initial={shouldReduceMotion ? false : 'initial'}
              animate="animate"
              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function toIsoDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function toDisplayDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function DateField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const nativeInputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    const input = nativeInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      {label}
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="JJ/MM/AAAA"
          inputMode="numeric"
          pattern="\d{2}/\d{2}/\d{4}"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-11 text-sm text-slate-700 outline-none focus:border-[#3b82f6]"
        />
        <button
          type="button"
          onClick={openPicker}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg hover:bg-slate-100"
          aria-label={`Ouvrir le calendrier ${label.toLowerCase()}`}
        >
          <Calendar className="h-4 w-4" style={{ color: '#1a2744' }} />
        </button>
        <input
          ref={nativeInputRef}
          type="date"
          value={toIsoDate(value)}
          onChange={(event) => onChange(toDisplayDate(event.target.value))}
          className="pointer-events-none absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 opacity-0"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </label>
  );
}

function inferReportTypeFromLabel(label: string, fallback: ReportType): ReportType {
  const normalized = label.toLowerCase();
  if (normalized.includes('inventaire')) return 'inventaire';
  if (normalized.includes('transfert')) return 'transfert';
  if (normalized.includes('disponibilit')) return 'kpi';
  if (normalized.includes('mensuel') || normalized.includes('rapport')) return 'mensuel';
  return fallback;
}

function extractPreviewFilters(label: string) {
  const dateRange = label.match(/(\d{2}\/\d{2}\/\d{4})\s*(?:→|â†’|-)\s*(\d{2}\/\d{2}\/\d{4})/);
  const site = label.match(/\b(CST\s*1|CST|T6|TTR)\b/i)?.[1] ?? 'Tous sites';
  const project = label.match(/\b(NH90|H160)\b/i)?.[1] ?? 'Tous projets';

  return {
    site,
    project,
    atelier: label.toLowerCase().includes('atelier') ? label.split('atelier').at(-1)?.trim() || 'Tous ateliers' : 'Tous ateliers',
    period: dateRange ? `${dateRange[1]} → ${dateRange[2]}` : label.toLowerCase().includes('mai 2026') ? '01/05/2026 → 30/05/2026' : '30 derniers jours'
  };
}

const monthlyKpis = [
  ['Total outillages', '1 248'],
  ['Total transferts', '186'],
  ['Taux dispo global', '92%'],
  ['Alertes actives', '14']
];

const inventoryBySiteRows = [
  ['CST 1', '382', '214', '596'],
  ['T6', '268', '141', '409'],
  ['TTR', '156', '87', '243']
];

const movementRows = [
  ['Entrées atelier', '48', '7', '2'],
  ['Transferts inter-sites', '91', '12', '4'],
  ['Sorties production', '33', '5', '1']
];

const monthlyStatusRows = [
  ['Disponible', '924', '74%'],
  ['En production', '176', '14%'],
  ['En maintenance', '96', '8%'],
  ['Perdu', '31', '2%'],
  ['Hors service', '21', '2%']
];

const inventoryRows = [
  ['RF-2048', 'Gabarit perçage panneau', 'CST 1', 'A320', 'NH90', <StatusBadge key="s1" tone="green">🟢 Disponible</StatusBadge>, '30/05/2026'],
  ['RF-1982', 'Clé dynamométrique 45Nm', 'T6', 'Maintenance', 'H160', <StatusBadge key="s2" tone="orange">🟠 En maintenance</StatusBadge>, '29/05/2026'],
  ['RF-2117', 'Support assemblage rotor', 'TTR', 'Production', 'NH90', <StatusBadge key="s3" tone="blue">🔵 En production</StatusBadge>, '29/05/2026'],
  ['RF-1734', 'Banc contrôle faisceau', 'CST 1', 'Contrôle', 'H160', <StatusBadge key="s4" tone="red">🔴 Perdu</StatusBadge>, '27/05/2026'],
  ['RF-2206', 'Kit calibration RFID', 'T6', 'Métrologie', 'NH90', <StatusBadge key="s5" tone="green">🟢 Disponible</StatusBadge>, '30/05/2026']
];

const transferRows = [
  ['TR-2026-0518', 'RF-2048', 'CST 1', 'T6', 'NH90', <StatusBadge key="t1" tone="green">Validé</StatusBadge>, '28/05/2026'],
  ['TR-2026-0519', 'RF-1982', 'T6', 'TTR', 'H160', <StatusBadge key="t2" tone="orange">En cours</StatusBadge>, '28/05/2026'],
  ['TR-2026-0520', 'RF-2117', 'TTR', 'CST 1', 'NH90', <StatusBadge key="t3" tone="green">Validé</StatusBadge>, '29/05/2026'],
  ['TR-2026-0521', 'RF-1734', 'CST 1', 'T6', 'H160', <StatusBadge key="t4" tone="red">Annulé</StatusBadge>, '29/05/2026']
];

const availabilityRows = [
  ['En production', '176', '14%', 'NH90, H160'],
  ['Disponible', '924', '74%', 'NH90, H160'],
  ['Maintenance', '96', '8%', 'NH90'],
  ['Perdu', '31', '2%', 'H160'],
  ['Hors service', '21', '2%', 'NH90']
];

function normalizeReport(item: any): RecentItem {
  const label = item.label ?? item.nom ?? 'Rapport généré';
  const storedType = item.type === 'disponibilite' ? 'kpi' : item.type === 'transferts' ? 'transfert' : item.type;
  const type = inferReportTypeFromLabel(label, storedType ?? 'mensuel');
  const date = item.date ?? item.dateGeneration ?? new Date().toLocaleDateString('fr-FR');
  const parsed = extractPreviewFilters(label);
  const filters: ReportFilters = item.filtres ?? {
    site: parsed.site,
    projet: parsed.project,
    atelier: parsed.atelier,
    dateDebut: parsed.period.split(' → ')[0] ?? '',
    dateFin: parsed.period.split(' → ')[1] ?? ''
  };

  return {
    id: item.id ?? `${type}-${Date.now()}`,
    type,
    label,
    date,
    nom: item.nom ?? label,
    dateGeneration: item.dateGeneration ?? date,
    filtres: filters,
    donnees: Array.isArray(item.donnees) && item.donnees.length > 0 ? item.donnees : createReportData(type, filters)
  };
}

function toStoredReport(report: RecentItem) {
  return {
    id: report.id,
    nom: report.nom,
    type: report.type === 'kpi' ? 'disponibilite' : report.type === 'transfert' ? 'transferts' : report.type,
    dateGeneration: report.dateGeneration,
    filtres: report.filtres,
    donnees: report.donnees
  };
}

function createReportData(type: ReportType, filters: ReportFilters): ReportDataRow[] {
  if (type === 'mensuel') {
    return [
      { Indicateur: 'Total outillages', Valeur: 1248, Période: `${filters.dateDebut} → ${filters.dateFin}` },
      { Indicateur: 'Total transferts', Valeur: 186, Période: `${filters.dateDebut} → ${filters.dateFin}` },
      { Indicateur: 'Taux dispo global', Valeur: '92%', Période: `${filters.dateDebut} → ${filters.dateFin}` },
      { Indicateur: 'Alertes actives', Valeur: 14, Période: `${filters.dateDebut} → ${filters.dateFin}` },
      { Indicateur: 'Inventaire CST 1', NH90: 382, H160: 214, Total: 596 },
      { Indicateur: 'Inventaire T6', NH90: 268, H160: 141, Total: 409 },
      { Indicateur: 'Inventaire TTR', NH90: 156, H160: 87, Total: 243 }
    ];
  }

  if (type === 'inventaire') {
    return [
      { Référence: 'RF-2048', Désignation: 'Gabarit perçage panneau', Site: filters.site, Atelier: 'A320', Projet: filters.projet, Statut: 'Disponible', 'Dernière date scan': filters.dateFin },
      { Référence: 'RF-1982', Désignation: 'Clé dynamométrique 45Nm', Site: 'T6', Atelier: 'Maintenance', Projet: 'H160', Statut: 'En maintenance', 'Dernière date scan': filters.dateFin },
      { Référence: 'RF-2117', Désignation: 'Support assemblage rotor', Site: 'TTR', Atelier: 'Production', Projet: 'NH90', Statut: 'En production', 'Dernière date scan': filters.dateFin },
      { Référence: 'RF-1734', Désignation: 'Banc contrôle faisceau', Site: 'CST 1', Atelier: 'Contrôle', Projet: 'H160', Statut: 'Perdu', 'Dernière date scan': filters.dateDebut },
      { Référence: 'RF-2206', Désignation: 'Kit calibration RFID', Site: 'T6', Atelier: 'Métrologie', Projet: 'NH90', Statut: 'Disponible', 'Dernière date scan': filters.dateFin }
    ];
  }

  if (type === 'transfert') {
    return [
      { 'N° transfert': 'TR-2026-0518', Référence: 'RF-2048', 'De (site)': filters.site, 'Vers (site)': 'TTR', Projet: filters.projet, Statut: 'Validé', Date: filters.dateFin },
      { 'N° transfert': 'TR-2026-0519', Référence: 'RF-1982', 'De (site)': 'T6', 'Vers (site)': 'CST 1', Projet: 'H160', Statut: 'En cours', Date: filters.dateFin },
      { 'N° transfert': 'TR-2026-0520', Référence: 'RF-2117', 'De (site)': 'TTR', 'Vers (site)': 'T6', Projet: 'NH90', Statut: 'Validé', Date: filters.dateDebut },
      { 'N° transfert': 'TR-2026-0521', Référence: 'RF-1734', 'De (site)': 'CST 1', 'Vers (site)': 'T6', Projet: 'H160', Statut: 'Annulé', Date: filters.dateDebut }
    ];
  }

  return [
    { Statut: 'En production', Nombre: 176, '%': '14%', Projets: 'NH90, H160' },
    { Statut: 'Disponible', Nombre: 924, '%': '74%', Projets: 'NH90, H160' },
    { Statut: 'Maintenance', Nombre: 96, '%': '8%', Projets: 'NH90' },
    { Statut: 'Perdu', Nombre: 31, '%': '2%', Projets: 'H160' },
    { Statut: 'Hors service', Nombre: 21, '%': '2%', Projets: 'NH90' }
  ];
}

function safeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getReportHeaders(report: RecentItem) {
  return Array.from(new Set(report.donnees.flatMap((row) => Object.keys(row))));
}

function reportFileBaseName(report: RecentItem) {
  return `${safeFileName(report.nom)}_${safeFileName(report.dateGeneration)}`;
}

function waitForFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

function exportReportCsv(report: RecentItem) {
  const headers = getReportHeaders(report);
  const escapeCell = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(';'),
    ...report.donnees.map((row) => headers.map((header) => escapeCell(row[header])).join(';'))
  ].join('\n');

  downloadBlob(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' }), `${reportFileBaseName(report)}.csv`);
}

function exportReportExcel(report: RecentItem) {
  const worksheet = XLSX.utils.json_to_sheet(getFlatExportData(report));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');
  XLSX.writeFile(workbook, `${reportFileBaseName(report)}.xlsx`);
}

async function exportReportPdfFromTemplate(report: RecentItem, templateType: TemplateType) {
  await waitForFrame();

  const templateId = `template-${templateType}`;
  const template = document.getElementById(templateId);
  if (!template) {
    exportReportPdf(report);
    return;
  }

  const canvas = await html2canvas(template, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true
  });
  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageHeight = (canvas.height * pageWidth) / canvas.width;
  let heightLeft = imageHeight;
  let position = 0;

  pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imageHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imageHeight;
    pdf.addPage();
    pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imageHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${reportFileBaseName(report)}.pdf`);
}

function exportReportPdf(report: RecentItem) {
  const doc = new jsPDF();
  const headers = getReportHeaders(report);
  const body = report.donnees.map((row) => headers.map((header) => String(row[header] ?? '')));
  const period = `${report.filtres.dateDebut} → ${report.filtres.dateFin}`;

  doc.setFontSize(14);
  doc.text('SAFRAN SMART TRACK', 14, 16);
  doc.setFontSize(11);
  doc.text(report.nom, 14, 26);
  doc.setFontSize(9);
  doc.text(`Période : ${period}`, 14, 34);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 42,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26, 39, 68], textColor: 255 }
  });

  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(`Date de génération : ${report.dateGeneration}`, 14, pageHeight - 12);
  doc.text('SAFRAN SEATS TUNISIE', 150, pageHeight - 12);
  doc.save(`${reportFileBaseName(report)}.pdf`);
}

function getReportPeriod(report: RecentItem) {
  return {
    debut: report.filtres.dateDebut || extractPreviewFilters(report.label).period.split(' → ')[0] || '',
    fin: report.filtres.dateFin || extractPreviewFilters(report.label).period.split(' → ')[1] || ''
  };
}

function toTemplateType(type: ReportType): TemplateType {
  if (type === 'transfert') return 'transferts';
  if (type === 'kpi') return 'disponibilite';
  return type;
}

function normalizeInventoryData(report: RecentItem) {
  return report.donnees.map((row) => ({
    reference: String(row.reference ?? row.Référence ?? ''),
    designation: String(row.designation ?? row.Désignation ?? ''),
    site: String(row.site ?? row.Site ?? report.filtres.site ?? ''),
    atelier: String(row.atelier ?? row.Atelier ?? report.filtres.atelier ?? ''),
    projet: String(row.projet ?? row.Projet ?? report.filtres.projet ?? ''),
    statut: String(row.statut ?? row.Statut ?? 'Disponible'),
    dernierScan: String(row.dernierScan ?? row['Dernière date scan'] ?? row['Dernier scan'] ?? report.filtres.dateFin ?? '')
  }));
}

function normalizeTransferData(report: RecentItem) {
  return report.donnees.map((row) => ({
    numeroTransfert: String(row.numeroTransfert ?? row['N° transfert'] ?? row['NÂ° transfert'] ?? ''),
    referenceOutillage: String(row.referenceOutillage ?? row.Référence ?? row['RÃ©fÃ©rence'] ?? ''),
    de: String(row.de ?? row['De (site)'] ?? ''),
    vers: String(row.vers ?? row['Vers (site)'] ?? ''),
    projet: String(row.projet ?? row.Projet ?? report.filtres.projet ?? ''),
    statut: String(row.statut ?? row.Statut ?? 'En cours'),
    dateTransfert: String(row.dateTransfert ?? row.Date ?? report.filtres.dateFin ?? '')
  }));
}

function normalizeDisponibiliteData(report: RecentItem) {
  return report.donnees.map((row) => ({
    statut: String(row.statut ?? row.Statut ?? ''),
    nombre: Number(row.nombre ?? row.Nombre ?? 0),
    pourcentage: String(row.pourcentage ?? row['%'] ?? ''),
    projetsConcernes: String(row.projetsConcernes ?? row.Projets ?? row['Projets concernés'] ?? report.filtres.projet ?? ''),
    tendance: String(row.tendance ?? 'Stable')
  }));
}

function normalizeMonthlyData(report: RecentItem) {
  return {
    inventaire: [
      { site: 'CST 1', nh90: 382, h160: 214, total: 596, tauxDispo: 93 },
      { site: 'T6', nh90: 268, h160: 141, total: 409, tauxDispo: 91 },
      { site: 'TTR', nh90: 156, h160: 87, total: 243, tauxDispo: 89 }
    ],
    mouvements: { valides: 172, enCours: 24, annules: 7 },
    alertes: { generees: 42, resolues: 28, enAttente: 14 },
    scans: [
      { site: 'CST 1', scans: 924, outillagesScanes: 596, dernierScan: report.filtres.dateFin },
      { site: 'T6', scans: 611, outillagesScanes: 409, dernierScan: report.filtres.dateFin },
      { site: 'TTR', scans: 358, outillagesScanes: 243, dernierScan: report.filtres.dateFin }
    ],
    statuts: normalizeDisponibiliteData({
      ...report,
      donnees: createReportData('kpi', report.filtres)
    })
  };
}

function getTemplateData(report: RecentItem) {
  if (report.type === 'inventaire') return normalizeInventoryData(report);
  if (report.type === 'transfert') return normalizeTransferData(report);
  if (report.type === 'kpi') return normalizeDisponibiliteData(report);
  return normalizeMonthlyData(report);
}

function getFlatExportData(report: RecentItem) {
  const data = getTemplateData(report);
  if (Array.isArray(data)) return data;
  return [
    ...data.inventaire.map((row) => ({ section: 'Inventaire', ...row })),
    { section: 'Mouvements', ...data.mouvements },
    { section: 'Alertes', ...data.alertes },
    ...data.scans.map((row) => ({ section: 'Scans', ...row })),
    ...data.statuts.map((row) => ({ section: 'Statuts', ...row }))
  ];
}

export default function RapportsPage() {
  const siteFilter = useAppSelector((state) => state.dashboard.siteFilter);
  const isMagasinSite = isMagasin(siteFilter);
  const [recent, setRecent] = useState<RecentItem[]>(INITIAL_RECENTS);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | ReportType>('all');
  const [previewItem, setPreviewItem] = useState<RecentItem | null>(null);
  const [downloadOpenId, setDownloadOpenId] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<ActiveTemplate | null>(null);
  const [filterModal, setFilterModal] = useState<FilterModalState>(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ projets: [], sites: [], ateliers: [] });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const downloadDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const shouldReduceMotion = useReducedMotion();
  const motionVariants = (variants: unknown) => (shouldReduceMotion ? undefined : (variants as any));

  useEffect(() => {
    let active = true;

    async function loadFilterOptions() {
      setFilterOptionsLoading(true);

      try {
        const { data, error } = await supabase
          .from('outillages')
          .select('projet, localisation_actuelle, atelier');

        if (error) throw error;
        if (!active) return;

        const rows = data ?? [];
        setFilterOptions({
          projets: [...new Set(rows.map((row) => row.projet).filter(Boolean))],
          sites: [...new Set(rows.map((row) => row.localisation_actuelle).filter(Boolean))],
          ateliers: [...new Set(rows.map((row) => row.atelier).filter(Boolean))]
        });
      } catch {
        if (active) setFilterOptions(FALLBACK_FILTER_OPTIONS);
      } finally {
        if (active) setFilterOptionsLoading(false);
      }
    }

    loadFilterOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!downloadOpenId) return;
      const activeNode = downloadDropdownRefs.current[downloadOpenId];
      if (activeNode && !activeNode.contains(event.target as Node)) {
        setDownloadOpenId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [downloadOpenId]);

  function showToast(message: string, tone: 'pending' | 'success' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3000);
  }

  function showDownloadToastSequence() {
    setToast({ message: '⏳ Téléchargement en cours...', tone: 'pending' });
    window.setTimeout(() => {
      setToast({ message: '✅ Téléchargement terminé', tone: 'success' });
      window.setTimeout(() => setToast(null), 3000);
    }, 2000);
  }

  function todayDateString() {
    const d = new Date();
    return d.toLocaleDateString('fr-FR');
  }

  function openFilterModal(type: ReportType, title: string) {
    setFilters(DEFAULT_FILTERS);
    setFilterModal({ type, title });
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleGenerate(type: ReportType, title: string, appliedFilters = filters) {
    const key = `${type}-${Date.now()}`;
    setLoadingKey(key);
    setFilterModal(null);
    showToast('Génération en cours...', 'pending');

    setTimeout(() => {
      setLoadingKey(null);
      showToast('✅ Génération terminée', 'success');
      const reportFilters: ReportFilters = {
        dateDebut: appliedFilters.dateDebut,
        dateFin: appliedFilters.dateFin,
        projet: appliedFilters.projet,
        site: appliedFilters.site,
        atelier: appliedFilters.atelier
      };
      setRecent((prev) => [
        normalizeReport({
          id: key,
          type,
          label: title,
          date: todayDateString(),
          dateGeneration: todayDateString(),
          filtres: reportFilters,
          donnees: createReportData(type, reportFilters)
        }),
        ...prev
      ]);
    }, 2000);
  }

  function handleDownload(item: RecentItem) {
    setDownloadOpenId(downloadOpenId === item.id ? null : item.id);
  }

  async function handleDownloadFormat(id: string, format: DownloadFormat) {
    const reportId = id.replace(/^preview-/, '');
    const source = previewItem?.id === reportId ? previewItem : recent.find((item) => item.id === reportId);
    if (!source) return;

    const report = normalizeReport(source);
    const templateType = toTemplateType(report.type);
    setActiveTemplate({
      type: templateType,
      donnees: getTemplateData(report),
      filtres: report.filtres,
      periode: getReportPeriod(report),
      dateGeneration: report.dateGeneration
    });

    setDownloadOpenId(null);
    showDownloadToastSequence();

    try {
      if (format === 'PDF') await exportReportPdfFromTemplate(report, templateType);
      if (format === 'Excel') exportReportExcel(report);
      if (format === 'CSV') exportReportCsv(report);
    } catch {
      if (format === 'PDF') exportReportPdf(report);
    }
  }

  function handleDelete(id: string) {
    setRecent((prev) => prev.filter((r) => r.id !== id));
    showToast('Rapport supprimé', 'success');
  }

  const filtered = useMemo(() => {
    return recent.filter((r) => {
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (search && !r.label.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [recent, search, filterType]);

  const previewType = previewItem ? inferReportTypeFromLabel(previewItem.label, previewItem.type) : null;
  const previewFilters = previewItem ? extractPreviewFilters(previewItem.label) : null;
  const previewDownloadId = previewItem ? `preview-${previewItem.id}` : null;

  function closePreviewModal() {
    setPreviewItem(null);
    setDownloadOpenId(null);
  }

  function renderKpiCards(items: string[][]) {
    return (
      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        variants={motionVariants(staggerContainer)}
        initial={shouldReduceMotion ? false : 'initial'}
        animate="animate"
      >
        {items.map(([label, value]) => (
          <motion.div key={label} variants={motionVariants(cardItem)} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-safran-navy">{value}</p>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  function renderPreviewContent() {
    if (!previewItem || !previewType || !previewFilters) return null;

    if (previewType === 'mensuel') {
      return (
        <>
          <section className="space-y-4 border-b border-slate-200 pb-5">
            <div>
              <h3 className="text-lg font-bold text-safran-navy">{previewItem.label}</h3>
              <p className="text-sm text-slate-500">Période couverte : {previewFilters.period}</p>
            </div>
            {renderKpiCards(monthlyKpis)}
          </section>
          <section className="space-y-4 border-b border-slate-200 py-5">
            <h4 className="font-semibold text-safran-navy">Inventaire par site</h4>
            <PreviewTable columns={['Site', 'NH90', 'H160', 'Total']} rows={inventoryBySiteRows} />
          </section>
          <section className="space-y-4 border-b border-slate-200 py-5">
            <h4 className="font-semibold text-safran-navy">Mouvements</h4>
            <PreviewTable columns={['Type', 'Validés', 'En cours', 'Annulés']} rows={movementRows} />
          </section>
          <section className="space-y-4 pt-5">
            <h4 className="font-semibold text-safran-navy">Statuts</h4>
            <PreviewTable columns={['Statut', 'Nombre', 'Pourcentage']} rows={monthlyStatusRows} />
          </section>
        </>
      );
    }

    if (previewType === 'inventaire') {
      return (
        <>
          <section className="space-y-2 border-b border-slate-200 pb-5">
            <h3 className="text-lg font-bold text-safran-navy">{previewItem.label}</h3>
            <p className="text-sm text-slate-500">
              Site : {previewFilters.site} · Projet : {previewFilters.project} · Atelier : {previewFilters.atelier} · Période : {previewFilters.period}
            </p>
          </section>
          <section className="space-y-4 pt-5">
            <h4 className="font-semibold text-safran-navy">Inventaire détaillé</h4>
            <PreviewTable
              columns={['Référence', 'Désignation', 'Site', 'Atelier', 'Projet', 'Statut', 'Dernière date scan']}
              rows={inventoryRows}
            />
          </section>
        </>
      );
    }

    if (previewType === 'transfert') {
      return (
        <>
          <section className="space-y-2 border-b border-slate-200 pb-5">
            <h3 className="text-lg font-bold text-safran-navy">{previewItem.label}</h3>
            <p className="text-sm text-slate-500">
              Site : {previewFilters.site} · Projet : {previewFilters.project} · Période : {previewFilters.period}
            </p>
          </section>
          <section className="space-y-4 pt-5">
            <h4 className="font-semibold text-safran-navy">Historique des transferts</h4>
            <PreviewTable
              columns={['N° transfert', 'Référence', 'De (site)', 'Vers (site)', 'Projet', 'Statut', 'Date']}
              rows={transferRows}
            />
          </section>
        </>
      );
    }

    return (
      <>
        <section className="space-y-4 border-b border-slate-200 pb-5">
          <div>
            <h3 className="text-lg font-bold text-safran-navy">{previewItem.label}</h3>
            <p className="text-sm text-slate-500">
              Période : {previewFilters.period} · Site : {previewFilters.site} · Projet : {previewFilters.project}
            </p>
          </div>
          {renderKpiCards([
            ['Taux dispo (%)', '92%'],
            ['Outillages perdus (#)', '31'],
            ['En maintenance (#)', '96']
          ])}
        </section>
        <section className="space-y-4 border-b border-slate-200 py-5">
          <h4 className="font-semibold text-safran-navy">Répartition des statuts</h4>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="h-40 w-40 shrink-0 rounded-full"
              style={{
                background: 'conic-gradient(#2563eb 0 14%, #16a34a 14% 88%, #f97316 88% 96%, #dc2626 96% 98%, #64748b 98% 100%)'
              }}
            />
            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {[
                ['En production', '#2563eb'],
                ['Disponible', '#16a34a'],
                ['Maintenance', '#f97316'],
                ['Perdu', '#dc2626'],
                ['Hors service', '#64748b']
              ].map(([label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="space-y-4 pt-5">
          <h4 className="font-semibold text-safran-navy">Détail par statut</h4>
          <PreviewTable columns={['Statut', 'Nombre', '%', 'Projets']} rows={availabilityRows} />
        </section>
      </>
    );
  }

  return (
    <div className="page-shell h-auto min-h-0 space-y-8 bg-[#f4f6f9] p-6 pb-6 lg:p-8 lg:pb-8" style={{ minHeight: 'auto', height: 'auto', background: '#f4f6f9' }}>
      <AnimatePresence>
        {toast ? (
          <motion.div
            variants={motionVariants(toastMotion)}
            initial={shouldReduceMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            className="fixed bottom-6 right-6 z-50 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg"
            style={{ backgroundColor: toast.tone === 'success' ? '#16a34a' : '#6b7280' }}
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div id="template-inventaire">
          <InventaireSiteTemplate
            data={activeTemplate?.type === 'inventaire' && Array.isArray(activeTemplate.donnees) ? (activeTemplate.donnees as never[]) : []}
            filtres={activeTemplate?.filtres ?? { site: 'Tous', projet: 'Tous', atelier: 'Tous', dateDebut: '', dateFin: '' }}
            periode={activeTemplate?.periode ?? { debut: '', fin: '' }}
            dateGeneration={activeTemplate?.dateGeneration ?? ''}
          />
        </div>
        <div id="template-mensuel">
          <RapportMensuelTemplate
            data={activeTemplate?.type === 'mensuel' && !Array.isArray(activeTemplate.donnees) ? activeTemplate.donnees : {}}
            filtres={activeTemplate?.filtres ?? { site: 'Tous', projet: 'Tous', atelier: 'Tous', dateDebut: '', dateFin: '' }}
            periode={activeTemplate?.periode ?? { debut: '', fin: '' }}
            dateGeneration={activeTemplate?.dateGeneration ?? ''}
          />
        </div>
        <div id="template-transferts">
          <HistoriqueTransfertsTemplate
            data={activeTemplate?.type === 'transferts' && Array.isArray(activeTemplate.donnees) ? (activeTemplate.donnees as never[]) : []}
            filtres={activeTemplate?.filtres ?? { site: 'Tous', projet: 'Tous', atelier: 'Tous', dateDebut: '', dateFin: '' }}
            periode={activeTemplate?.periode ?? { debut: '', fin: '' }}
            dateGeneration={activeTemplate?.dateGeneration ?? ''}
          />
        </div>
        <div id="template-disponibilite">
          <TauxDisponibiliteTemplate
            data={activeTemplate?.type === 'disponibilite' && Array.isArray(activeTemplate.donnees) ? (activeTemplate.donnees as never[]) : []}
            filtres={activeTemplate?.filtres ?? { site: 'Tous', projet: 'Tous', atelier: 'Tous', dateDebut: '', dateFin: '' }}
            periode={activeTemplate?.periode ?? { debut: '', fin: '' }}
            dateGeneration={activeTemplate?.dateGeneration ?? ''}
          />
        </div>
      </div>

      <PageHeader 
        title="Rapports & Statistiques" 
        subtitle="Exports et analyses SAFRAN SMART TRACK"
      />

      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        variants={motionVariants(staggerContainer)}
        initial={shouldReduceMotion ? false : 'initial'}
        animate="animate"
      >
        {RAPPORT_CARDS.map((rapport) => {
          const Icon = rapport.icon;
          const key = rapport.type;
          return (
            <motion.div key={key} variants={motionVariants(cardItem)}>
              <Card className="flex h-full flex-col gap-4 !p-6">
              <Icon className="h-8 w-8 text-safran-blue" strokeWidth={1.75} />
              <div>
                <h3 className="font-bold text-safran-navy">{rapport.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{rapport.description}</p>
              </div>
              <div className="mt-auto">
                <Button
                  className="bg-gray-700 text-white hover:bg-gray-600"
                  onClick={() => openFilterModal(rapport.type, rapport.title)}
                  disabled={loadingKey !== null}
                >
                  {loadingKey && loadingKey.startsWith(rapport.type) ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner />
                      <span>Génération…</span>
                    </div>
                  ) : (
                    'Générer'
                  )}
                </Button>
              </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {filterModal ? (
          <motion.div
            variants={motionVariants(modalBackdrop)}
            initial={shouldReduceMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            onClick={() => setFilterModal(null)}
          >
            <motion.div
              variants={motionVariants(modalContent)}
              className="w-full max-w-[620px] overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 px-6 py-5 text-white" style={{ backgroundColor: '#1a2744' }}>
                <div>
                  <h2 className="text-xl font-bold">{filterModal.title}</h2>
                  <p className="mt-1 text-sm text-slate-200">Filtres de génération du rapport</p>
                </div>
                <button onClick={() => setFilterModal(null)} className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
                {filterOptionsLoading ? (
                  <div className="col-span-full flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <LoadingSpinner />
                    Chargement des filtres...
                  </div>
                ) : null}

                <DateField
                  label="Date début"
                  value={filters.dateDebut}
                  onChange={(value) => setFilters((current) => ({ ...current, dateDebut: value }))}
                />

                <DateField
                  label="Date fin"
                  value={filters.dateFin}
                  onChange={(value) => setFilters((current) => ({ ...current, dateFin: value }))}
                />

                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Projet
                  <select value={filters.projet} onChange={(event) => setFilters((current) => ({ ...current, projet: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6]">
                    <option>Tous</option>
                    {filterOptions.projets.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Site
                  <select value={filters.site} onChange={(event) => setFilters((current) => ({ ...current, site: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6]">
                    <option>Tous</option>
                    {filterOptions.sites.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Atelier
                  <select value={filters.atelier} onChange={(event) => setFilters((current) => ({ ...current, atelier: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6]">
                    <option>Tous</option>
                    {filterOptions.ateliers.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Réinitialiser les filtres
                </button>
                <button
                  onClick={() => handleGenerate(filterModal.type, filterModal.title, filters)}
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  Appliquer et générer
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {previewItem && previewType && previewFilters ? (
          <motion.div
            variants={motionVariants(modalBackdrop)}
            initial={shouldReduceMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          >
          <motion.div
            variants={motionVariants(modalContent)}
            className="flex max-h-[90vh] w-full max-w-[800px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 bg-[#1a2744] px-6 py-5 text-white">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{previewItem.label}</h2>
                  <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                    {previewType === 'mensuel'
                      ? 'Rapport mensuel'
                      : previewType === 'inventaire'
                      ? 'Inventaire'
                      : previewType === 'transfert'
                      ? 'Transferts'
                      : 'Disponibilité'}
                  </span>
                </div>
                <p className="text-sm text-slate-200">Généré le {previewItem.date} · Période : {previewFilters.period}</p>
              </div>
              <button onClick={closePreviewModal} className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white px-6 py-5">{renderPreviewContent()}</div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={closePreviewModal}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>

              <div
                ref={(node) => {
                  if (previewDownloadId) downloadDropdownRefs.current[previewDownloadId] = node;
                }}
                className="relative"
              >
                <button
                  onClick={() => previewDownloadId && setDownloadOpenId(downloadOpenId === previewDownloadId ? null : previewDownloadId)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-500 bg-white px-3 py-2 text-sm text-blue-500 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                  <span aria-hidden="true">▼</span>
                </button>

                <AnimatePresence>
                  {downloadOpenId === previewDownloadId ? (
                  <motion.div
                    variants={motionVariants(dropdownMenu)}
                    initial={shouldReduceMotion ? false : 'initial'}
                    animate="animate"
                    exit="exit"
                    className="absolute bottom-full right-0 z-50 mb-2 w-40 rounded-lg border border-slate-200 bg-white shadow-md"
                  >
                    <button onClick={() => previewDownloadId && handleDownloadFormat(previewDownloadId, 'PDF')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100">PDF</button>
                    <button onClick={() => previewDownloadId && handleDownloadFormat(previewDownloadId, 'Excel')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100">Excel (.xlsx)</button>
                    <button onClick={() => previewDownloadId && handleDownloadFormat(previewDownloadId, 'CSV')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100">CSV</button>
                  </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="h-auto">
        <h2 className="mb-4 text-lg font-bold text-safran-navy">Rapports récents</h2>

        <Card className="h-auto divide-y divide-slate-100 !p-0">
          {recent.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">Aucun rapport récent.</div>
          ) : (
            <AnimatePresence>
              {recent.map((item, index) => (
              <motion.div
                key={item.id}
                custom={index}
                variants={motionVariants(tableRow)}
                initial={shouldReduceMotion ? false : 'initial'}
                animate="animate"
                exit="exit"
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500">Généré le {item.date}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#6b7280] bg-white px-3 py-2 text-sm text-[#6b7280] hover:bg-slate-50"
                  >
                    <span aria-hidden="true">👁️</span>
                    Voir
                  </button>

                  <div
                    ref={(node) => {
                      downloadDropdownRefs.current[item.id] = node;
                    }}
                    className="relative"
                  >
                    <Button
                      variant="custom"
                      className="border bg-white px-3 text-[#1a2744] hover:bg-slate-50"
                      style={{ borderColor: '#1a2744', color: '#1a2744' }}
                      onClick={() => handleDownload(item)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                    </Button>

                    <AnimatePresence>
                      {downloadOpenId === item.id ? (
                        <motion.div
                          variants={motionVariants(dropdownMenu)}
                          initial={shouldReduceMotion ? false : 'initial'}
                          animate="animate"
                          exit="exit"
                          className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"
                        >
                          <button onClick={() => handleDownloadFormat(item.id, 'PDF')} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">📄 PDF</button>
                          <button onClick={() => handleDownloadFormat(item.id, 'Excel')} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">📊 Excel</button>
                          <button onClick={() => handleDownloadFormat(item.id, 'CSV')} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">📋 CSV</button>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                  <Button
                    className="border border-transparent bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Card>
      </section>
    </div>
  );
} 
