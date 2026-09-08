import { Router, type IRouter } from "express";

type StatementTransaction = {
  date: string;
  merchant: string;
  type: "credit" | "debit";
  amount: number;
  balance: number;
};

type StatementPayload = {
  businessName: string;
  currency: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  transactions: StatementTransaction[];
};

const router: IRouter = Router();

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

function buildPdf(payload: StatementPayload): Buffer {
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
    objects[contentId - 1] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf, "latin1");
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

router.post("/statements/pdf", (req, res) => {
  try {
    if (typeof req.body.payload !== "string" || req.body.payload.length > 1_500_000) {
      res.status(400).json({ error: "Invalid statement payload" });
      return;
    }
    const payload = JSON.parse(req.body.payload) as StatementPayload;
    if (
      !payload ||
      typeof payload.businessName !== "string" ||
      typeof payload.currency !== "string" ||
      !Array.isArray(payload.transactions) ||
      payload.transactions.length > 2_000
    ) {
      res.status(400).json({ error: "Invalid statement data" });
      return;
    }
    const pdf = buildPdf(payload);
    const safeName = payload.businessName.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="ABC_Bank_${safeName}_Statement.pdf"`);
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);
  } catch (error) {
    req.log.error({ err: error }, "Failed to generate statement PDF");
    res.status(400).json({ error: "Could not generate statement PDF" });
  }
});

export default router;