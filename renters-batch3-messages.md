# Renters Upgrade — Batch 3: Direct Chat (`/messages`) Overhaul

This batch upgrades the text-only chat into a premium messaging experience: visual 
refresh, file/image sharing, property-share cards, presence indicators, and a proper 
conversation-list + thread split layout (mirroring the list/map pattern from Batch 2). 
This also lays groundwork for the visit-scheduler integration in a later batch.

Find the relevant files first — likely `/client/src/pages/Messages.jsx`, a 
`SocketContext`, and any `ChatBubble`/`ConversationList` components under 
`/client/src/components/`. If chat UI is all inline inside `Messages.jsx`, Prompt 1 
should extract it into smaller components as its first step.

Run in order.

---

## Prompt 1 — Extract Chat Components + Visual Refresh

```
Locate /client/src/pages/Messages.jsx and the Socket.IO chat implementation (likely 
using SocketContext from /client/src/context/). If the conversation list, message 
thread, and message bubbles are all inline in one file, extract them into:

- /client/src/components/messaging/ConversationList.jsx (list of conversation previews 
  with avatar, name, last message snippet, timestamp, unread badge)
- /client/src/components/messaging/MessageThread.jsx (scrollable message history)
- /client/src/components/messaging/MessageBubble.jsx (single message, sent vs received)
- /client/src/components/messaging/MessageComposer.jsx (input bar + send button)

Apply the Batch 1 design tokens and components throughout:
- Sent messages: primary-colored bubble (bg-primary, light text), right-aligned, 
  rounded with one corner less rounded (chat-style "tail" corner) using --rt-sys-radius.
- Received messages: glass or muted-background bubble, left-aligned, same corner 
  treatment mirrored.
- Conversation list items: hover-pop on hover, active conversation gets a left accent 
  border in --rt-sys-primary and a subtle tinted background.
- Composer: rounded pill input with the upgraded Input component, send button using 
  the upgraded Button with active:scale-95.
- Add timestamps in a smaller, muted-foreground font under each message (or grouped 
  per cluster of consecutive messages from the same sender).

Constraints:
- Do not change the Socket.IO event names, payload shapes, or any 
  /api/conversations / /api/messages endpoint calls — UI restructuring only.
- Preserve existing scroll-to-bottom-on-new-message behavior.

Verify by: opening /messages, confirming the conversation list and thread render with 
the new bubble/list styling in both light and dark mode, and that sending a message 
still works end-to-end via the existing socket connection.
```

---

## Prompt 2 — File & Image Attachment Sharing

```
Add file and image attachment support to the chat in /client/src/pages/Messages.jsx 
and its extracted components from Prompt 1.

Frontend (MessageComposer.jsx):
- Add an attachment icon button (paperclip) that opens a file picker accepting images 
  (jpg, png, webp) and documents (pdf), max size configurable (default 10MB).
- On selection, show a preview chip (thumbnail for images, filename + icon for 
  documents) above the input with a remove "x" before sending.
- Support drag-and-drop of files directly onto the message thread area, showing a 
  themed drop-overlay (dashed border using --rt-sys-primary, "Drop file to send" text).

Frontend (MessageBubble.jsx):
- Render image attachments as a clickable thumbnail (opens in the existing photo 
  lightbox/modal if one exists from the property gallery, otherwise a simple full-size 
  Dialog).
- Render document attachments as a card showing a file-type icon, filename, file size, 
  and a "Download" button/link.

Backend:
- Identify the existing file upload mechanism used elsewhere (e.g. for property photos 
  or media library uploads — check /server/routes/ and any multer/cloud-storage config) 
  and reuse the same upload pipeline/storage bucket for chat attachments, under a 
  distinct path/prefix (e.g. `chat-attachments/`).
- Add a `POST /api/conversations/:id/attachments` endpoint (or extend the existing 
  message-send endpoint) that accepts a file, stores it, and returns a URL + metadata 
  (filename, size, mime type) to include in the message payload.
- Update the message schema/model to support an optional `attachment: { url, filename, 
  mimeType, size }` field.
- Emit the attachment data through the existing Socket.IO message event so it appears 
  in real time for both participants.

Constraints:
- Validate file type and size on both client and server; reject disallowed types with 
  a clear error toast.
- Do not break plain-text messages — attachment field should be optional/null for 
  normal messages.

Verify by: sending an image and a PDF in a conversation, confirming both participants 
see the attachment render correctly (image thumbnail opens full-size, PDF shows a 
download card), and that oversized/disallowed files are rejected with a toast message.
```

---

## Prompt 3 — Property Share Cards & Quick Reply Templates

```
Add two messaging enhancements to support the real-estate use case:

1. Property Share Cards:
   - When a user shares a property link in chat (or via a "Share" button added to 
     PropertyCard.jsx and the property detail pages), render it in MessageBubble.jsx 
     as a rich card: property thumbnail image, title, price, location, and a "View 
     Listing" button linking to /rent/:slug or /buy/:slug — instead of a plain text 
     URL.
   - Detect property URLs in plain-text messages too (regex match against the site's 
     /rent/ and /buy/ URL patterns) and auto-render them as share cards even if sent 
     as text.

2. Quick Reply Templates:
   - Add a small "Templates" button/icon in MessageComposer.jsx that opens a popover 
     with a short list of common landlord/tenant message templates, e.g.:
     - "Is this property still available?"
     - "Can I schedule a visit?"
     - "What's included in the rent (utilities, maintenance)?"
     - "I'm interested — what are the next steps?"
   - Clicking a template inserts it into the composer input (editable before sending, 
     not sent immediately).
   - Make the template list role-aware if user role (tenant/owner) is available in 
     context — show different templates for owners vs tenants (owners get e.g. "The 
     property is available, would you like to schedule a visit?").

Constraints:
- Property share card rendering must gracefully fall back to a plain link if the 
  referenced property no longer exists (fetch returns 404) — show "Listing no longer 
  available" with the original link.
- Templates list should be a simple local config array for now (no new admin UI/CMS 
  needed in this task).

Verify by: sharing a property link in a conversation and confirming it renders as a 
rich card with image/price/CTA, and opening the templates popover to insert a template 
into the composer.
```

---

## Prompt 4 — Presence, Typing Indicators & Read Receipts

```
Enhance real-time presence feedback in the chat using the existing SocketContext:

- Conversation List: show an online/offline status dot on each contact's avatar 
  (green dot for online, no dot or grey for offline), driven by existing or new 
  Socket.IO presence events (`user:online` / `user:offline` — check if these already 
  exist before adding new ones).
- Typing Indicator: when the other participant is typing, show an animated "..." 
  indicator bubble at the bottom of MessageThread.jsx (three bouncing dots using the 
  existing `animate-pulse`/bounce utilities). Emit a `typing` socket event from 
  MessageComposer.jsx on input (debounced ~1s of inactivity to stop).
- Read Receipts: show a small checkmark icon under sent messages — single check for 
  "sent", double check in --rt-sys-primary color for "read" — updated when the 
  recipient opens the conversation (emit a `message:read` event when MessageThread 
  mounts/scrolls a message into view).
- Last seen timestamp: in the conversation header, show "Online" or "Last seen X 
  minutes ago" based on presence data.

Constraints:
- If presence infrastructure doesn't exist yet, add minimal Socket.IO event 
  handlers/emitters on both client and server — keep it lightweight (in-memory map of 
  socket-id-to-user-id is fine, no need for persistence beyond the session).
- Read receipts should update existing message read-state fields in the database if 
  they exist; otherwise add a simple `readAt` timestamp field to the message schema.

Verify by: opening the same conversation in two browser sessions (or two browsers), 
typing in one and confirming the typing indicator appears in the other, and confirming 
sent messages show single→double checkmarks once the recipient views them.
```

---

## Prompt 5 — Responsive Conversation List + Thread Split Layout

```
Refactor /client/src/pages/Messages.jsx into a two-pane layout consistent with the 
Batch 2 split pattern:

- Desktop (lg+): conversation list as a fixed-width left sidebar (~320px, scrollable 
  independently), message thread filling the remaining width, composer pinned to the 
  bottom of the thread pane.
- Mobile: show only the conversation list by default (full width). Tapping a 
  conversation navigates to a full-screen thread view with a back button in the header 
  that returns to the list (can be a route param like `/messages/:conversationId` if 
  routing supports it, or a local view-state toggle if not — check existing routing 
  first and prefer adding the route param for shareable/linkable conversations).
- Add an empty state for desktop when no conversation is selected: a centered 
  illustration/icon + "Select a conversation to start chatting" message.
- Ensure the message thread auto-scrolls to the latest message on conversation switch 
  and on new incoming messages, but preserves scroll position if the user has scrolled 
  up to read history (don't yank them back down on new messages — show a "New message" 
  pill/button instead that scrolls down on click).

Constraints:
- If adding a route param (`/messages/:conversationId`), update App.jsx routing and 
  ensure deep-linking to a specific conversation works (e.g. clicking "Message Owner" 
  from a property detail page navigates directly to that conversation).

Verify by: testing /messages on desktop (list + thread side by side) and on a mobile 
viewport (list → tap → full-screen thread → back button returns to list), and 
confirming the "New message" pill appears when scrolled up and a new message arrives.
```

---

## Prompt 6 — Accessibility & Empty/Error States

```
Finish the chat overhaul with accessibility and edge-case handling across 
/client/src/pages/Messages.jsx and its sub-components:

- Add `aria-live="polite"` to the message thread container so screen readers announce 
  new incoming messages.
- Ensure the composer's send button and attachment button have descriptive 
  `aria-label`s ("Send message", "Attach file").
- Ensure keyboard users can send a message with Enter and create a newline with 
  Shift+Enter (if not already supported).
- Add an empty state for the conversation list when the user has no conversations yet: 
  icon + "No conversations yet" + a CTA linking to /listings ("Browse properties to 
  start a conversation").
- Add error handling for socket disconnection: a small banner at the top of the thread 
  ("Connection lost — reconnecting...") that disappears automatically on reconnect, 
  using the existing SnackbarContext/toast pattern if suitable, or a dedicated inline 
  banner styled with the warning token colors.
- Add loading skeletons (using the Batch 1 `.skeleton-wave` utility) for the 
  conversation list and message thread while initial data loads.

Verify by: testing keyboard-only message sending (Enter / Shift+Enter), disconnecting 
network briefly to confirm the reconnect banner appears and clears, and viewing 
/messages as a brand-new user with zero conversations to confirm the empty state 
renders correctly.
```

---

## After Batch 3

Next is **Batch 4 — Post Property Multi-Step Wizard** (`/post-property`): converting 
the current flat form into a guided wizard with drag-drop photo upload, inline image 
cropping, and a coordinate/geotag picker — the highest-priority item remaining from 
the gap analysis after maps and chat. Let me know once Batch 3 is verified and I'll 
write it.
