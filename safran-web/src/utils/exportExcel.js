import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename, sheetName = 'Rapport') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 22 }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
};
