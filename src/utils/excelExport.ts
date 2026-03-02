import * as XLSX from 'xlsx';

export const exportToExcel = (rows: any[], type: 'valid' | 'invalid' | 'all', filename: string) => {
  const headers = [
    'Sr. No.', 'Client Code', 'Dealer Code', 'Vendor Code & Name', "Dealer's Name",
    'State', 'City', 'District', "Dealer's Address", 'Width (Ft.)', 'Height (Ft.)', 'Dealer Board Type', 'Status/Error'
  ];

  let filteredRows = rows;
  if (type === 'valid') {
    filteredRows = rows.filter(r => r.status === 'success');
  } else if (type === 'invalid') {
    filteredRows = rows.filter(r => r.status === 'error');
  }

  const data = filteredRows.map(row => [
    row.data.srNo,
    row.data.clientCode,
    row.data.dealerCode,
    row.data.vendorCode,
    row.data.dealerName,
    row.data.state,
    row.data.city,
    row.data.district,
    row.data.address,
    row.data.width,
    row.data.height,
    row.data.boardType,
    row.status === 'success' ? '✓ Valid' : row.error
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stores');

  ws['!cols'] = [
    { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 30 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 12 },
    { wch: 12 }, { wch: 20 }, { wch: 40 }
  ];

  XLSX.writeFile(wb, filename);
};
