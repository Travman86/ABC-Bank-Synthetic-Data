import { Router, type IRouter } from "express";
import { buildStatementPdf, parseStatementPayload, statementFileName } from "../lib/statement-pdf";

const router: IRouter = Router();

router.post("/statements/pdf", (req, res) => {
  try {
    const payload = parseStatementPayload(req.body?.payload);
    if (!payload) {
      res.status(400).json({ error: "Invalid statement data" });
      return;
    }
    const pdf = Buffer.from(buildStatementPdf(payload));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${statementFileName(payload)}"`);
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);
  } catch (error) {
    req.log.error({ err: error }, "Failed to generate statement PDF");
    res.status(400).json({ error: "Could not generate statement PDF" });
  }
});

export default router;
