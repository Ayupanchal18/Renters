# Renters Upgrade — Batch 7: Document Vault & Lease Drafting

This batch adds secure document storage (ID proofs, salary slips, reference letters), 
a "Verified" trust badge based on uploaded/approved documents, and a basic digital 
lease drafting + e-signature flow — the highest-value items from the "Long-Term" tier 
of the gap analysis.

This is sensitive data (identity documents), so security and access control get their 
own dedicated prompt (Prompt 6) rather than being an afterthought.

Run in order.

---

## Prompt 1 — Data Model & Secure Upload Endpoints

```
Add backend support for a personal document vault. Follow existing conventions in 
/server/routes/ and /server/models/, and reuse the existing file-storage pipeline 
identified in Batch 3 (chat attachments) — store vault documents in a separate, 
non-publicly-listable storage path/prefix (e.g. `vault-documents/{userId}/`).

New model `VaultDocument`: { userId, type (enum: "id_proof" | "address_proof" | 
"income_proof" | "reference_letter" | "other"), filename, storageUrl, status (enum: 
"pending" | "verified" | "rejected"), uploadedAt, reviewedAt, reviewedBy (admin user 
id), rejectionReason (optional) }.

New endpoints:
- `POST /api/vault/documents` — authenticated user uploads a document with a `type`; 
  stores file via existing upload pipeline, creates a VaultDocument record with status 
  "pending".
- `GET /api/vault/documents` — returns the logged-in user's own documents only.
- `DELETE /api/vault/documents/:id` — user deletes their own document (only if status 
  is "pending" or "rejected" — verified documents shouldn't be silently deletable 
  without re-verification implications; return 403 if status is "verified").
- `GET /api/vault/documents/:id/file` — returns a short-lived signed URL (or proxies 
  the file) for viewing the document — must check the requester is the document owner 
  OR an admin.
- Admin-only: `GET /api/admin/vault/pending` — list all pending documents across users 
  for review.
- Admin-only: `PATCH /api/admin/vault/documents/:id` — set status to "verified" or 
  "rejected" (with optional rejectionReason), check existing admin auth middleware.

Constraints:
- File access must never be served via permanently-public URLs — use signed/expiring 
  URLs or an authenticated proxy route, matching whatever pattern the existing storage 
  pipeline supports (note in code comments if the current storage provider doesn't 
  support signed URLs, and a proxy-download route is used instead).
- Enforce file type (PDF, JPG, PNG) and size limits consistent with other uploads in 
  the app.

Verify by: uploading a document as a regular user, confirming it appears with status 
"pending" via GET /api/vault/documents, confirming another user cannot access it via 
GET /api/vault/documents/:id/file (403), and as an admin, verifying it via the admin 
endpoint and confirming status updates.
```

---

## Prompt 2 — Document Vault UI (User Dashboard)

```
Create /client/src/components/vault/DocumentVault.jsx and add it as a new 
"Documents"/"Verification" tab in the user dashboard 
(/client/src/pages/Dashboard.jsx), using the upgraded Card/Button/Dialog components 
and rt-sys tokens.

UI requirements:
- A section per document type (ID Proof, Address Proof, Income Proof, Reference 
  Letter, Other), each showing: current upload (if any) as a thumbnail/file-card with 
  filename and a status badge (pending = warning token, verified = success token, 
  rejected = destructive token with the rejection reason shown on hover/click), and an 
  "Upload" or "Replace" button.
- Uploading opens a file picker (reuse drag-drop pattern/component from Batch 4's 
  photo upload where applicable, simplified for single-file, any-type-allowed 
  uploads), calls `POST /api/vault/documents` with the selected type, and shows upload 
  progress.
- A "View" button on each uploaded document opens it in a new tab/Dialog via 
  `GET /api/vault/documents/:id/file`.
- A "Delete" button (only enabled for pending/rejected documents per Prompt 1's rules) 
  with a confirmation Dialog.
- A small info banner at the top explaining why verification matters: "Verified users 
  get a trust badge on their listings and messages, increasing booking requests."

Constraints:
- Do not display raw storage URLs anywhere in the UI — always go through the signed/
  proxied file endpoint.

Verify by: uploading one document per category, confirming status badges show 
"pending", viewing an uploaded document opens it correctly, and deleting a pending 
document removes it.
```

---

## Prompt 3 — "Verified" Trust Badges on Profiles & Listings

```
Add a derived "Verified" status for users based on their VaultDocument records, and 
surface it as a trust badge across the app.

Backend:
- Add a computed field (either a virtual/derived field on the User model, or a small 
  helper function used wherever user profiles are returned) `isVerified: boolean` — 
  true if the user has at least an "id_proof" AND one of ("address_proof" or 
  "income_proof") with status "verified".
- Ensure `isVerified` is included in API responses for: user profile endpoints, 
  property listing responses (include the owner's `isVerified` status), and 
  conversation/message participant info (for the chat header from Batch 3).

Frontend:
- Create /client/src/components/common/VerifiedBadge.jsx — a small badge (checkmark 
  icon in a circle, using --rt-sys-success or primary color) with a tooltip "Identity 
  Verified".
- Add this badge next to: the owner's name on property detail pages 
  (Rent/BuyPropertyDetail.jsx), property cards in listings (small badge overlay or 
  inline next to price, if owner is verified — PropertyCard.jsx), and the chat header/
  conversation list (next to the contact's name, MessageBubble/ConversationList from 
  Batch 3).
- In the user's own dashboard (DocumentVault.jsx from Prompt 2), show their current 
  verification status prominently at the top: "✓ Verified" badge if true, or a 
  progress indicator ("2 of 2 required documents verified") if not yet verified.

Constraints:
- Do not show the badge for unverified users — absence of the badge is the "unverified" 
  state (no negative badge needed).

Verify by: as an admin, verifying both required document types for a test user; 
confirming the VerifiedBadge then appears on that user's property listings, property 
detail page, and chat conversations; and confirming it doesn't appear for users 
without both verified documents.
```

---

## Prompt 4 — Lease Draft Generator

```
Add a basic digital lease drafting tool, accessible from a confirmed booking or an 
active conversation between a tenant and owner (place an entry point — e.g. a 
"Create Lease Agreement" button — in the IncomingVisits/MyVisits views from Batch 5, 
or in the chat header for a conversation tied to a property).

Backend:
- New model `LeaseDraft`: { propertyId, ownerId, tenantId, status (enum: "draft" | 
  "sent" | "signed_by_tenant" | "signed_by_owner" | "completed"), terms: { rentAmount, 
  securityDeposit, leaseStartDate, leaseEndDate, noticePeriodDays, additionalClauses 
  (free text) }, ownerSignature (optional), tenantSignature (optional), createdAt, 
  updatedAt }.
- `POST /api/leases` — owner creates a draft for a property + tenant (must be 
  associated via an existing conversation or completed booking — validate this 
  relationship exists).
- `GET /api/leases/:id` — accessible by the owner or tenant on the lease only.
- `PATCH /api/leases/:id` — update terms (only while status is "draft", only by 
  owner).
- `POST /api/leases/:id/send` — owner marks status "sent" (locks terms editing).

Frontend — create /client/src/components/lease/LeaseDraftEditor.jsx:
- A form (owner-only, while status is "draft") for rent amount, deposit, lease 
  start/end dates (date pickers), notice period, and a free-text "Additional Terms" 
  textarea, pre-filled with the property's price where applicable.
- A read-only "Lease Preview" panel rendered alongside/below the form, formatted as a 
  simple lease document layout (property address, parties' names, terms in a 
  structured list, additional clauses) using rt-sys typography tokens for a 
  document-like feel (serif or clean sans body text, clear section headings).
- A "Send to Tenant" button (calls `/send`), after which the form becomes read-only 
  for the owner and the tenant gains access to view the same preview.

Constraints:
- This is a draft/agreement tool for convenience, not a legally binding contract 
  generator — include a small disclaimer text at the bottom of the preview: "This 
  document is a template for convenience and does not constitute legal advice. 
  Consult local regulations before signing."

Verify by: as an owner with a confirmed booking, creating a lease draft with terms, 
previewing it, sending it, and confirming the tenant can now view (but not edit) the 
same lease via GET /api/leases/:id.
```

---

## Prompt 5 — E-Signature Capture & Signed PDF

```
Extend the lease flow from Prompt 4 with signature capture and a downloadable signed 
PDF.

Frontend — create /client/src/components/lease/SignaturePad.jsx:
- A canvas-based signature pad (use `react-signature-canvas` if not already a 
  dependency) where the user draws their signature with mouse/touch, with "Clear" and 
  "Save Signature" buttons styled with rt-sys tokens.
- Add this to LeaseDraftEditor.jsx (or a new LeaseSignStep.jsx) for both 
  owner and tenant once the lease status is "sent": each party can draw and save their 
  signature, which is converted to a base64 PNG and sent to the backend.

Backend:
- `POST /api/leases/:id/sign` — accepts the signature image (base64) for the 
  requesting user's role (owner or tenant), stores it on the LeaseDraft record 
  (`ownerSignature` / `tenantSignature`), and updates status accordingly 
  ("signed_by_tenant" / "signed_by_owner" → "completed" once both are present).
- `GET /api/leases/:id/pdf` — once status is "completed", generate a PDF combining the 
  lease terms (from Prompt 4's preview layout) and both signature images, and return 
  it for download. Check if a PDF generation library is already used elsewhere in the 
  project (e.g. for invoices/receipts) and reuse it; otherwise add a lightweight 
  library like `pdf-lib` or `puppeteer` (prefer `pdf-lib` for simplicity if no headless 
  browser is already in use).

Frontend:
- Once status is "completed", show a "Download Signed Lease (PDF)" button on the lease 
  view for both parties, calling `GET /api/leases/:id/pdf`.
- Show a status timeline at the top of the lease view (Draft → Sent → Signed by Tenant 
  → Signed by Owner → Completed) with the current step highlighted using rt-sys 
  primary/success tokens.

Constraints:
- Once a party has signed, their portion of the lease (terms + their own signature) 
  becomes read-only — only the not-yet-signed party can still act.

Verify by: completing the full flow as both roles (draft → send → tenant signs → 
owner signs), confirming status updates to "completed" after both signatures, and 
downloading the resulting PDF to confirm it contains the lease terms and both 
signature images.
```

---

## Prompt 6 — Security, Access Control & Admin Review Queue

```
Harden and complete the vault/lease features with a dedicated security and admin 
pass:

1. Access control audit:
   - Re-check every endpoint added in Prompts 1, 4, and 5 to confirm: vault documents 
     are only readable by their owner or an admin; lease drafts are only readable/
     writable by the specific owner/tenant pair on that lease; signature images are 
     never exposed via any public/listing endpoint.
   - Add rate limiting to `POST /api/vault/documents` and `POST /api/leases/:id/sign` 
     if a rate-limiting middleware already exists in the project (reuse it); otherwise 
     note this as a follow-up rather than building new infrastructure.

2. Admin review queue UI:
   - Create /client/src/pages/admin/VaultReview.jsx (new admin route, following 
     existing admin route/layout conventions from /admin) listing pending 
     VaultDocuments with: user name, document type, uploaded date, a "View" button 
     (signed URL), and "Verify"/"Reject" buttons (reject requires a short reason, shown 
     to the user in their DocumentVault.jsx from Prompt 2).
   - Add a small badge/count in the admin nav indicating the number of pending 
     documents awaiting review.

3. Privacy & UX details:
   - Add a "Delete my data" affordance in the user's DocumentVault.jsx: a button that, 
     with confirmation, deletes all of the user's non-verified vault documents (and 
     clarify that verified ones tied to active leases cannot be deleted while a lease 
     references them).
   - Ensure rejected document status shown to users includes the admin's 
     rejectionReason text so users know how to fix and re-upload.

Verify by: as an admin, navigating to the Vault Review queue, verifying and rejecting 
sample documents (with a reason), and confirming the rejected user sees the reason in 
their dashboard; then confirming a non-admin user gets a 403 if attempting to call any 
admin-only vault/lease endpoint directly.
```

---

## After Batch 7

The final remaining item from the gap analysis is:
- **Batch 8 — Virtual 3D Tour Embeds**: Matterport/panorama/video walkthrough support 
  on property detail pages and the post-property wizard (Batch 4).

Let me know once Batch 7 is verified and I'll write Batch 8 — at that point all items 
from the original gap analysis roadmap will be covered, and we can move into a final 
cross-cutting QA pass (Phase 3's "Final QA Pass Prompts" from the original execution 
plan) across the whole upgraded site.
