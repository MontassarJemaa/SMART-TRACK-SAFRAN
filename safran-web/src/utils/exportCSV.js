export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]).join(';');
  const rows = data
    .map((row) => Object.values(row).map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const csvContent = '\uFEFF' + headers + '\n' + rows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
