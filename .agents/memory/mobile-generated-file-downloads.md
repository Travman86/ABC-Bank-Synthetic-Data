---
name: Mobile generated-file downloads
description: Reliable delivery approach for generated statement files in mobile in-app browsers.
---

Generate mobile PDF statements on the server and deliver them through a normal HTTP form submission with an `application/pdf` response. Do not rely on Blob URLs, download-attribute links, or Web Share file payloads for this flow.

**Why:** iOS in-app browsers can report file-sharing support while rejecting the operation, and can also block navigation to client-generated Blob URLs.

**How to apply:** For future generated document downloads, keep desktop client-side generation where useful, but route mobile PDF delivery through an HTTP endpoint opened by a synchronous form submission.