import React from 'react';

const STATUS_COLORS = {
  'En production': '#3b82f6',
  'En étuvage': '#d97706',
  'En maintenance': '#eab308',
  Perdu: '#dc2626'
};

const OFFICIAL_STATUSES = Object.keys(STATUS_COLORS);

const normalizeStatus = (statut) => {
  if (statut === 'En etuvage') return 'En étuvage';
  if (OFFICIAL_STATUSES.includes(statut)) return statut;
  return 'En production';
};

const getStatusRow = (statuts, statut) => {
  const row = statuts.find((item) => normalizeStatus(item.statut) === statut);
  return {
    statut,
    nombre: Number(row?.nombre || 0),
    pourcentage: row?.pourcentage || '0%'
  };
};

const RapportMensuelTemplate = ({ data = {}, filtres = {}, periode = {}, dateGeneration }) => {
  const inventaire = data.inventaire || [];
  const statuts = data.statuts || [];
  const scans = data.scans || [];
  const mouvements = data.mouvements || {};
  const alertes = data.alertes || {};
  const normalizedStatuts = OFFICIAL_STATUSES.map((statut) => getStatusRow(statuts, statut));
  const totalOutillages = inventaire.reduce((sum, row) => sum + Number(row.total || 0), 0);

  return (
    <div className="report-template" style={{ width: '210mm', background: '#fff', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ background: '#1a2744', color: '#fff', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/images/Logo.png"
            alt="SAFRAN SMART TRACK"
            style={{ height: '44px', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', letterSpacing: '1px', lineHeight: 1.2 }}>
              SAFRAN SMART TRACK
            </span>
            <span style={{ fontSize: '10px', color: '#828eb1', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              SAFRAN SEATS TUNISIE
            </span>
          </div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '2px' }}>RAPPORT MENSUEL</div>
        <div style={{ fontSize: '11px', color: '#cbd5e1', textAlign: 'right', lineHeight: 1.8 }}><div>Généré le : {dateGeneration}</div><div>Période : {periode.debut} → {periode.fin}</div></div>
      </div>
      <div style={{ background: '#eff6ff', padding: '10px 32px', fontSize: '12px', display: 'flex', gap: '24px' }}>
        <span><strong>Site :</strong> {filtres.site || 'Tous'}</span><span><strong>Projet :</strong> {filtres.projet || 'Tous'}</span><span><strong>Période :</strong> {periode.debut} → {periode.fin}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', padding: '24px 32px', background: '#f2f4f7' }}>
        {[
          ['Total outillages', totalOutillages],
          ['En production', getStatusRow(normalizedStatuts, 'En production').nombre],
          ['Alertes actives', alertes.enAttente || 0],
          ['Perdus', getStatusRow(normalizedStatuts, 'Perdu').nombre]
        ].map(([label, value]) => <div key={label} style={{ background: '#fff', border: '1px solid #c5c6ce', borderRadius: '10px', padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 700, color: '#04122e' }}>{value}</div><div style={{ fontSize: '11px', color: '#45464d', marginTop: '6px' }}>{label}</div></div>)}
      </div>
      <div style={{ padding: '20px 32px', display: 'grid', gap: '22px' }}>
        <Section title="Inventaire par site" headers={['Site', 'NH90', 'H160', 'Total', 'Taux production']} rows={inventaire.map((r) => [r.site, r.nh90, r.h160, r.total, `${r.tauxDispo}%`])} />
        <Section title="Mouvements" headers={['En production', 'En étuvage', 'En maintenance', 'Perdu']} rows={[[mouvements.enProduction || 0, mouvements.enEtuvage || 0, mouvements.enMaintenance || 0, mouvements.perdu || 0]]} />
        <Section title="Alertes" headers={['Générées', 'Résolues', 'En attente']} rows={[[alertes.generees, alertes.resolues, alertes.enAttente]]} />
        <Section title="Scans" headers={['Site', 'Scans', 'Outillages scannés', 'Dernier scan']} rows={scans.map((r) => [r.site, r.scans, r.outillagesScanes, r.dernierScan])} />
        <StatusSection title="Statuts" rows={normalizedStatuts} />
      </div>
      <div style={{ background: '#f2f4f7', borderTop: '3px solid #3b82f6', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#45464d' }}><span>SAFRAN SMART TRACK — Rapport mensuel</span><span>Page 1/1</span><span>Confidentiel — Usage interne uniquement</span></div>
    </div>
  );
};

const Section = ({ title, headers, rows }) => (
  <div>
    <div style={{ fontSize: '13px', fontWeight: 700, color: '#04122e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', borderBottom: '2px solid #3b82f6', display: 'inline-block', paddingBottom: '6px' }}>{title}</div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
      <thead><tr style={{ background: '#1a2744', color: '#fff' }}>{headers.map((h) => <th key={h} style={{ padding: '9px 12px', textAlign: 'left' }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f2f4f7' }}>{row.map((cell, j) => <td key={j} style={{ padding: '8px 12px', borderBottom: '1px solid #c5c6ce' }}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const StatusSection = ({ title, rows }) => (
  <div>
    <div style={{ fontSize: '13px', fontWeight: 700, color: '#04122e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', borderBottom: '2px solid #3b82f6', display: 'inline-block', paddingBottom: '6px' }}>{title}</div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
      <thead><tr style={{ background: '#1a2744', color: '#fff' }}>{['Statut', 'Nombre', 'Pourcentage'].map((h) => <th key={h} style={{ padding: '9px 12px', textAlign: 'left' }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={row.statut} style={{ background: i % 2 === 0 ? '#fff' : '#f2f4f7' }}><td style={{ padding: '8px 12px', borderBottom: '1px solid #c5c6ce' }}><span style={{ display: 'inline-flex', width: 10, height: 10, borderRadius: 999, background: STATUS_COLORS[row.statut], marginRight: 8 }} />{row.statut}</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #c5c6ce' }}>{row.nombre}</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #c5c6ce' }}>{row.pourcentage}</td></tr>)}</tbody>
    </table>
  </div>
);

export default RapportMensuelTemplate;
