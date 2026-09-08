import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { Dataset, ExportVariant } from '../store/types';

export function generateCSV(dataset: Dataset, variant: ExportVariant): string {
  const txs = dataset.transactions;
  let headers: string[] = [];
  let rows: string[][] = [];

  if (variant === 'variant1') {
    // Standard
    headers = ['Date', 'Description', 'Amount', 'Balance'];
    rows = txs.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd'),
      t.description,
      (t.type === 'debit' ? '-' : '') + t.amount.toFixed(2),
      t.balance.toFixed(2)
    ]);
  } else if (variant === 'variant2') {
    // Detailed
    headers = ['Transaction Date', 'Posted Date', 'Type', 'Category', 'Merchant', 'Amount', 'Running Balance', 'Ref Number'];
    rows = txs.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd'),
      format(new Date(t.postedDate), 'yyyy-MM-dd'),
      t.type.toUpperCase(),
      t.category.toUpperCase(),
      t.merchant,
      t.amount.toFixed(2),
      t.balance.toFixed(2),
      t.reference
    ]);
  } else {
    // Accounting
    headers = ['TxID', 'Date', 'SignedAmount', 'Counterparty', 'Channel'];
    rows = txs.map(t => [
      t.id,
      format(new Date(t.date), 'MM/dd/yyyy'),
      (t.type === 'debit' ? -t.amount : t.amount).toFixed(2),
      t.merchant,
      t.channel.toUpperCase()
    ]);
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

export async function downloadFile(content: string | Blob, fileName: string, mimeType: string) {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: `${mimeType};charset=utf-8` });
  const file = new File([blob], fileName, { type: mimeType });
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: fileName,
      text: 'Fictional synthetic bank statement',
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  if (isMobile) link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function generatePDF(dataset: Dataset, variant: ExportVariant): Blob {
  const doc = new jsPDF();
  
  // Watermark
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(40);
  doc.text('FICTIONAL / SYNTHETIC DATA', 35, 150, { angle: 45 });
  
  doc.setTextColor(0, 0, 0);

  if (variant === 'variant1') {
    // Classic Statement
    doc.setFontSize(20);
    doc.text('ABC Bank', 14, 22);
    doc.setFontSize(12);
    doc.text('Account Statement', 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Business: ${dataset.profile.businessName}`, 14, 45);
    doc.text(`Period: ${dataset.profile.dateRange.start} to ${dataset.profile.dateRange.end}`, 14, 52);
    doc.text(`Opening Balance: ${dataset.profile.currency} ${dataset.openingBalance.toFixed(2)}`, 140, 45);
    doc.text(`Closing Balance: ${dataset.profile.currency} ${dataset.closingBalance.toFixed(2)}`, 140, 52);

    (doc as any).autoTable({
      startY: 65,
      head: [['Date', 'Description', 'Withdrawals', 'Deposits', 'Balance']],
      body: dataset.transactions.map(t => [
        format(new Date(t.date), 'MMM dd, yyyy'),
        t.merchant,
        t.type === 'debit' ? t.amount.toFixed(2) : '',
        t.type === 'credit' ? t.amount.toFixed(2) : '',
        t.balance.toFixed(2)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [34, 71, 94] }
    });

  } else if (variant === 'variant2') {
    // Modern Statement
    doc.setFontSize(24);
    doc.text('Statement', 14, 25);
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`ABC Bank | ${dataset.profile.businessName}`, 14, 33);
    
    (doc as any).autoTable({
      startY: 45,
      head: [['Date', 'Ref', 'Merchant', 'Category', 'Amount', 'Balance']],
      body: dataset.transactions.map(t => [
        format(new Date(t.date), 'MM/dd/yyyy'),
        t.reference,
        t.merchant,
        t.category,
        (t.type === 'debit' ? '-' : '+') + t.amount.toFixed(2),
        t.balance.toFixed(2)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 150, 120] },
      alternateRowStyles: { fillColor: [240, 245, 245] }
    });
  } else {
    // Audit Report
    doc.setFontSize(16);
    doc.text('Audit Transaction Log', 14, 20);
    doc.setFontSize(9);
    doc.text(`Dataset: ${dataset.id} | Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 27);
    
    (doc as any).autoTable({
      startY: 35,
      head: [['ID', 'Date', 'Type', 'Amount', 'Balance']],
      body: dataset.transactions.map(t => [
        t.id.slice(0,8),
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.type.toUpperCase(),
        t.amount.toFixed(2),
        t.balance.toFixed(2)
      ]),
      theme: 'plain',
      styles: { fontSize: 8 }
    });
  }

  return doc.output('blob');
}
