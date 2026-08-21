function cleanCell(value) {
  return String(value ?? '').replace(/"/g, '""')
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(header => `"${cleanCell(row[header])}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function downloadPdf(filename, title, rows) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, 40, 48)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const headers = rows.length ? Object.keys(rows[0]) : []
  let y = 78
  doc.text(headers.join(' | '), 40, y)
  y += 18
  rows.slice(0, 32).forEach(row => {
    const line = headers.map(header => String(row[header] ?? '')).join(' | ')
    doc.text(line.slice(0, 115), 40, y)
    y += 16
    if (y > 760) {
      doc.addPage()
      y = 48
    }
  })
  doc.save(filename)
}
