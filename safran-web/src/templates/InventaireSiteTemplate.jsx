import React from 'react';

const OFFICIAL_STATUSES = ['En production', 'En étuvage', 'En maintenance', 'Perdu'];

const normalizeStatus = (statut) => {
  if (statut === 'En etuvage') return 'En étuvage';
  if (OFFICIAL_STATUSES.includes(statut)) return statut;
  return 'En production';
};

const statusStyle = (statut) => {
  const normalized = normalizeStatus(statut);
  if (normalized === 'En production') return { background: '#dbeafe', color: '#3b82f6' };
  if (normalized === 'En étuvage') return { background: '#ffedd5', color: '#d97706' };
  if (normalized === 'En maintenance') return { background: '#fef9c3', color: '#eab308' };
  if (normalized === 'Perdu') return { background: '#fee2e2', color: '#dc2626' };
  return { background: '#dbeafe', color: '#3b82f6' };
};

const countByStatus = (data, statut) => data.filter((row) => normalizeStatus(row.statut) === statut).length;

const InventaireSiteTemplate = ({ data = [], filtres = {}, periode = {}, dateGeneration }) => (
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
      <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '2px' }}>INVENTAIRE PAR SITE</div>
      <div style={{ fontSize: '11px', color: '#cbd5e1', textAlign: 'right', lineHeight: 1.8 }}>
        <div>Généré le : {dateGeneration}</div>
        <div>Période : {periode.debut} → {periode.fin}</div>
      </div>
    </div>

    <div style={{ background: '#eff6ff', padding: '10px 32px', fontSize: '12px', display: 'flex', gap: '24px' }}>
      <span><strong>Site :</strong> {filtres.site || 'Tous'}</span>
      <span><strong>Projet :</strong> {filtres.projet || 'Tous'}</span>
      <span><strong>Atelier :</strong> {filtres.atelier || 'Tous'}</span>
      <span><strong>Période :</strong> {periode.debut} → {periode.fin}</span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', padding: '24px 32px', background: '#f2f4f7' }}>
      {[
        { icon: '🔧', value: data.length, label: 'Total outillages' },
        { icon: '🔵', value: countByStatus(data, 'En production'), label: 'En production' },
        { icon: '🟠', value: countByStatus(data, 'En étuvage'), label: 'En étuvage' },
        { icon: '🟡', value: countByStatus(data, 'En maintenance'), label: 'En maintenance' },
        { icon: '🔴', value: countByStatus(data, 'Perdu'), label: 'Perdus' }
      ].map((kpi) => (
        <div key={kpi.label} style={{ background: '#fff', border: '1px solid #c5c6ce', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px' }}>{kpi.icon}</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#04122e' }}>{kpi.value}</div>
          <div style={{ fontSize: '10px', color: '#45464d', marginTop: '6px' }}>{kpi.label}</div>
        </div>
      ))}
    </div>

    <div style={{ padding: '20px 32px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#04122e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', borderBottom: '2px solid #3b82f6', display: 'inline-block', paddingBottom: '6px' }}>Détail Inventaire</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#1a2744', color: '#fff' }}>
            {['Référence', 'Désignation', 'Site', 'Atelier', 'Projet', 'Statut', 'Dernier scan'].map((h) => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const statut = normalizeStatus(row.statut);
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f2f4f7' }}>
                {['reference', 'designation', 'site', 'atelier', 'projet'].map((key) => <td key={key} style={{ padding: '9px 12px', borderBottom: '1px solid #c5c6ce' }}>{row[key]}</td>)}
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #c5c6ce' }}><span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, ...statusStyle(statut) }}>{statut}</span></td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #c5c6ce' }}>{row.dernierScan}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <div style={{ background: '#f2f4f7', borderTop: '3px solid #3b82f6', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#45464d' }}>
      <span>SAFRAN SMART TRACK — Inventaire par Site</span><span>Page 1/1</span><span>Confidentiel — Usage interne uniquement</span>
    </div>
  </div>
);

export default InventaireSiteTemplate;
