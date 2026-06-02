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

const getMetric = (data, statut, field, fallback = 0) => {
  const row = data.find((item) => normalizeStatus(item.statut) === statut);
  return row?.[field] ?? fallback;
};

const TauxDisponibiliteTemplate = ({ data = [], filtres = {}, periode = {}, dateGeneration }) => {
  const normalizedData = OFFICIAL_STATUSES.map((statut) => {
    const existing = data.find((row) => normalizeStatus(row.statut) === statut);
    return {
      statut,
      nombre: Number(existing?.nombre || 0),
      pourcentage: existing?.pourcentage || '0%',
      projetsConcernes: existing?.projetsConcernes || existing?.projets || '-',
      tendance: existing?.tendance || 'Stable'
    };
  });
  const total = normalizedData.reduce((sum, row) => sum + Number(row.nombre || 0), 0);
  const productionRate = getMetric(normalizedData, 'En production', 'pourcentage', '0%');
  const conicSegments = normalizedData.reduce(
    (acc, row) => {
      const percent = total > 0 ? (Number(row.nombre || 0) / total) * 100 : 0;
      const start = acc.current;
      const end = start + percent;
      acc.parts.push(`${STATUS_COLORS[row.statut]} ${start}% ${end}%`);
      acc.current = end;
      return acc;
    },
    { current: 0, parts: [] }
  ).parts.join(', ');

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
        <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '2px' }}>RÉPARTITION DES STATUTS</div>
        <div style={{ fontSize: '11px', color: '#cbd5e1', textAlign: 'right', lineHeight: 1.8 }}><div>Généré le : {dateGeneration}</div><div>Période : {periode.debut} → {periode.fin}</div></div>
      </div>
      <div style={{ background: '#eff6ff', padding: '10px 32px', fontSize: '12px', display: 'flex', gap: '24px' }}>
        <span><strong>Site :</strong> {filtres.site || 'Tous'}</span><span><strong>Projet :</strong> {filtres.projet || 'Tous'}</span><span><strong>Période :</strong> {periode.debut} → {periode.fin}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', padding: '24px 32px', background: '#f2f4f7' }}>
        {[
          ['En production', productionRate],
          ['En étuvage', getMetric(normalizedData, 'En étuvage', 'nombre')],
          ['En maintenance', getMetric(normalizedData, 'En maintenance', 'nombre')],
          ['Perdus', getMetric(normalizedData, 'Perdu', 'nombre')]
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #c5c6ce', borderRadius: '10px', padding: '18px', textAlign: 'center' }}><div style={{ fontSize: '30px', fontWeight: 700, color: '#04122e' }}>{value}</div><div style={{ fontSize: '12px', color: '#45464d', marginTop: '6px' }}>{label}</div></div>
        ))}
      </div>
      <div style={{ padding: '22px 32px', display: 'flex', gap: '32px', alignItems: 'center', borderBottom: '1px solid #c5c6ce' }}>
        <div style={{ width: 180, height: 180, borderRadius: '50%', background: conicSegments ? `conic-gradient(${conicSegments})` : '#e5e7eb' }} />
        <div style={{ display: 'grid', gap: '10px', fontSize: '12px' }}>
          {normalizedData.map((row) => <div key={row.statut} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ width: 12, height: 12, borderRadius: 99, background: STATUS_COLORS[row.statut] }} />{row.statut} — {row.pourcentage}</div>)}
          <div style={{ marginTop: 8, color: '#45464d' }}>Total outillages suivis : {total}</div>
        </div>
      </div>
      <div style={{ padding: '20px 32px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#04122e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', borderBottom: '2px solid #3b82f6', display: 'inline-block', paddingBottom: '6px' }}>Détail statuts</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead><tr style={{ background: '#1a2744', color: '#fff' }}>{['Statut', 'Nombre', '%', 'Projets concernés', 'Tendance'].map((h) => <th key={h} style={{ padding: '10px 12px', textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>{normalizedData.map((row, i) => <tr key={row.statut} style={{ background: i % 2 === 0 ? '#fff' : '#f2f4f7' }}><td style={{ padding: '9px 12px', borderBottom: '1px solid #c5c6ce' }}>{row.statut}</td><td style={{ padding: '9px 12px', borderBottom: '1px solid #c5c6ce' }}>{row.nombre}</td><td style={{ padding: '9px 12px', borderBottom: '1px solid #c5c6ce' }}>{row.pourcentage}</td><td style={{ padding: '9px 12px', borderBottom: '1px solid #c5c6ce' }}>{row.projetsConcernes}</td><td style={{ padding: '9px 12px', borderBottom: '1px solid #c5c6ce' }}>{row.tendance}</td></tr>)}</tbody>
        </table>
      </div>
      <div style={{ background: '#f2f4f7', borderTop: '3px solid #3b82f6', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#45464d' }}><span>SAFRAN SMART TRACK — Répartition des statuts</span><span>Page 1/1</span><span>Confidentiel — Usage interne uniquement</span></div>
    </div>
  );
};

export default TauxDisponibiliteTemplate;
