/**
 * Synthetic bank statement PDF, shared by the Express API (Replit/local dev)
 * and the Cloudflare Worker (production). Plain TypeScript, no Node APIs.
 */

/** Byte length of a string that only holds chars 0-255 (pdfEscape guarantees it). */
function latin1Length(value: string): number {
  return value.length;
}

function latin1Bytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index) & 0xff;
  return bytes;
}

export type StatementTransaction = {
  date: string;
  merchant: string;
  type: "credit" | "debit";
  amount: number;
  balance: number;
};

export type StatementPayload = {
  businessName: string;
  currency: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  transactions: StatementTransaction[];
};


function pdfEscape(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function money(value: number, currency: string): string {
  return `${currency} ${value.toFixed(2)}`;
}

export function buildStatementPdf(payload: StatementPayload): Uint8Array {
  const rowsPerPage = 30;
  const chunks: StatementTransaction[][] = [];
  for (let index = 0; index < payload.transactions.length; index += rowsPerPage) {
    chunks.push(payload.transactions.slice(index, index + rowsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  const objects: string[] = [];
  const pageIds = chunks.map((_, index) => 4 + index * 2);
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  chunks.forEach((transactions, pageIndex) => {
    const pageId = pageIds[pageIndex];
    const contentId = pageId + 1;
    const lines = [
      "ABC BANK - FICTIONAL / SYNTHETIC DATA",
      "Synthetic Account Statement - Not issued by a real financial institution",
      `Business: ${payload.businessName}`,
      `Statement period: ${payload.startDate} to ${payload.endDate}`,
      `Opening balance: ${money(payload.openingBalance, payload.currency)}    Closing balance: ${money(payload.closingBalance, payload.currency)}`,
      "",
      "Date         Description                         Debit          Credit         Balance",
      "--------------------------------------------------------------------------------------",
      ...transactions.map(transaction => {
        const date = transaction.date.slice(0, 10).padEnd(12);
        const merchant = transaction.merchant.slice(0, 32).padEnd(36);
        const debit = (transaction.type === "debit" ? transaction.amount.toFixed(2) : "").padStart(12);
        const credit = (transaction.type === "credit" ? transaction.amount.toFixed(2) : "").padStart(12);
        const balance = transaction.balance.toFixed(2).padStart(14);
        return `${date}${merchant}${debit}${credit}${balance}`;
      }),
      "",
      `Page ${pageIndex + 1} of ${chunks.length} - FOR DEMONSTRATION AND AGENT TRAINING ONLY`,
    ];
    const commands = lines
      .map((line, index) => `${index === 0 ? "50 780 Td" : "0 -18 Td"} (${pdfEscape(line)}) Tj`)
      .join("\n");
    const stream = `BT\n/F1 9 Tf\n${commands}\nET`;
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] = `<< /Length ${latin1Length(stream)} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = latin1Length(pdf);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = latin1Length(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return latin1Bytes(pdf);
}

export const MAX_PAYLOAD_LENGTH = 1_500_000;

/** Validates the form field the app posts; returns null when it is not a usable statement. */
export function parseStatementPayload(raw: unknown): StatementPayload | null {
  if (typeof raw !== "string" || raw.length > MAX_PAYLOAD_LENGTH) return null;
  const payload = JSON.parse(raw) as StatementPayload;
  if (
    !payload ||
    typeof payload.businessName !== "string" ||
    typeof payload.currency !== "string" ||
    !Array.isArray(payload.transactions) ||
    payload.transactions.length > 2_000
  ) {
    return null;
  }
  return payload;
}

export function statementFileName(payload: StatementPayload): string {
  const safeName = payload.businessName.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60);
  return `ABC_Bank_${safeName}_Statement.pdf`;
}
