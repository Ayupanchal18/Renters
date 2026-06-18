# Renters Admin Panel — Complete Upgrade Implementation Plan

> **Scope:** Full-depth, production-ready implementation plan covering all 3 upgrade phases.
> **Stack:** React (client/src/pages/admin/) · Express.js (server/routes/) · MongoDB + Mongoose · JWT RBAC
> **Audit baseline:** 14 modules · 67% feature complete · 8 missing modules · 23 UI/UX gaps

---

## Table of Contents

1. [Phase 1 — Polish & Harden Existing (Week 1–2)](#phase-1)
2. [Phase 2 — Build Missing Critical Modules (Week 3–5)](#phase-2)
3. [Phase 3 — Intelligence Layer (Week 6–8)](#phase-3)
4. [Cross-Cutting Concerns](#cross-cutting)
5. [DB Schema Additions Reference](#schemas)
6. [API Endpoint Master Index](#api-index)

---

## Phase 1 — Polish & Harden Existing (Week 1–2) {#phase-1}

### 1.1 Bulk Action Toolbar

**Affected files:**
- `client/src/components/admin/BulkActionToolbar.jsx` ← new shared component
- `client/src/pages/admin/UserManagement.jsx` ← integrate
- `client/src/pages/admin/PropertyManagement.jsx` ← integrate
- `client/src/pages/admin/ReviewModeration.jsx` ← integrate

**Component spec — `BulkActionToolbar.jsx`:**
```jsx
// Props: selectedIds[], entityType, actions[], onAction(actionKey, ids), onClear
// Renders: floating bar at bottom of viewport (position sticky at table foot)
// States: hidden (0 selected), visible (≥1 selected)
// Transitions: slide-up 200ms ease-out on appear
```

**Behaviour:**
- Each table gains a `<th>` checkbox column (index 0); header checkbox = select/deselect all on current page
- `selectedIds` state lives in parent page component, passed down to toolbar
- Toolbar shows: `"{N} selected · [Action 1] · [Action 2] · [Export] · [Clear]"`
- Destructive bulk actions open a `<BulkConfirmModal>` showing count and a red warning banner
- Bulk export: POST body `{ ids: [...] }` → server returns streamed CSV blob

**New API endpoints for bulk:**
```
PATCH /api/admin/users/bulk/status          { ids, action: 'block'|'unblock'|'deactivate' }
DELETE /api/admin/users/bulk                { ids }          (soft delete)
POST  /api/admin/users/bulk/export          { ids, format: 'csv'|'json' }

PATCH /api/admin/properties/bulk/status     { ids, status, reason }
POST  /api/admin/properties/bulk/export     { ids, format: 'csv'|'json' }

PATCH /api/admin/reviews/bulk/reject        { ids, reason }  (already have bulk approve)
POST  /api/admin/reviews/bulk/export        { ids, format: 'csv'|'json' }
```

**Validation rules (server-side):**
- `ids` must be non-empty array, max 100 items, all valid ObjectId format
- Rate limit: 10 bulk operations per minute per admin IP
- Each bulk operation creates a single `AuditLog` entry with `metadata: { count, ids, action }`

---

### 1.2 Dark / Light Mode Toggle

**Affected files:**
- `client/src/context/ThemeContext.jsx` ← new
- `client/src/components/admin/AdminSidebar.jsx` ← add toggle button
- `client/src/index.css` ← add `[data-theme="dark"]` overrides
- `client/src/main.jsx` ← wrap with `<ThemeProvider>`

**Implementation:**
```jsx
// ThemeContext.jsx
const ThemeContext = createContext();
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('adminTheme') || 'light'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('adminTheme', theme);
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () =>
      setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**CSS token approach — `index.css`:**
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-sidebar: #1a1d23;
  --text-primary: #0f1117;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --accent: #4f46e5;
}
[data-theme="dark"] {
  --bg-primary: #0f1117;
  --bg-secondary: #1a1d23;
  --bg-sidebar: #0a0c10;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --border: #2d3139;
  --accent: #6366f1;
}
```

**Sidebar toggle:** Icon button (sun/moon lucide icon) pinned at sidebar footer beside admin avatar. No page reload required.

---

### 1.3 WebSocket Live Dashboard (Replace Polling)

**Affected files:**
- `server/src/services/socketService.js` ← new
- `server/src/app.js` ← attach socket.io to HTTP server
- `client/src/hooks/useAdminSocket.js` ← new custom hook
- `client/src/pages/admin/AdminOverview.jsx` ← replace setInterval with hook

**Server setup:**
```js
// server/src/services/socketService.js
const { Server } = require('socket.io');

let io;
function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL } });
  io.use(socketAuthMiddleware); // verify JWT from handshake.auth.token
  io.on('connection', (socket) => {
    socket.join('admin-room');
    socket.on('disconnect', () => {});
  });
}

function emitDashboardUpdate(eventType, payload) {
  if (io) io.to('admin-room').emit('dashboard:update', { type: eventType, payload });
}

module.exports = { initSocket, emitDashboardUpdate };
```

**Emit triggers:** Call `emitDashboardUpdate` from:
- `server/routes/adminUsers.js` → after POST (new user), PATCH status
- `server/routes/adminProperties.js` → after POST, PATCH status
- `server/routes/adminReviews.js` → after PATCH approve/reject

**Client hook:**
```js
// client/src/hooks/useAdminSocket.js
export function useAdminSocket(onUpdate) {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token: localStorage.getItem('adminToken') }
    });
    socket.on('dashboard:update', onUpdate);
    return () => socket.disconnect();
  }, []);
}
```

**Dashboard indicator:** Green pulsing dot labelled "Live" in dashboard header. Amber "Reconnecting…" on disconnect. Falls back to 60s polling if socket fails after 3 retries.

---

### 1.4 Undo Snackbar for Destructive Actions

**Affected files:**
- `client/src/components/admin/UndoSnackbar.jsx` ← new
- `client/src/context/SnackbarContext.jsx` ← new
- All admin pages that perform delete/block/deactivate

**Architecture:** Deferred execution pattern.
1. User clicks "Delete user"
2. Snackbar appears immediately: `"User deleted · Undo (4s)"` with countdown
3. After 5 seconds, if no undo: actual `DELETE /api/admin/users/:id` fires
4. If undo clicked: snackbar dismisses, no API call made

```jsx
// SnackbarContext.jsx
export function showUndo({ message, onConfirm, duration = 5000 }) {
  // Sets snackbar state, starts countdown timer
  // onConfirm = the real destructive API call
  // Returns cancel function to stop countdown
}
```

**Snackbar position:** Fixed bottom-left, 16px from edges. Stack up to 3 simultaneous snackbars.

---

### 1.5 Command Palette (⌘K / Ctrl+K)

**Affected files:**
- `client/src/components/admin/CommandPalette.jsx` ← new
- `client/src/hooks/useCommandPalette.js` ← new
- `client/src/components/admin/AdminSidebar.jsx` ← register keydown listener

**Search scope:**
```
GET /api/admin/search?q=<query>&limit=5&entities=users,properties,content,audit
```
Returns unified results:
```json
{
  "users": [{ "id", "name", "email", "role" }],
  "properties": [{ "id", "title", "city", "status" }],
  "content": [{ "id", "title", "type" }],
  "auditLogs": [{ "id", "action", "resourceType", "timestamp" }]
}
```

**Static quick-actions (no API needed):**
- "Go to dashboard" → navigate('/admin')
- "Add new user" → navigate('/admin/users') + open AddUserModal
- "View audit logs" → navigate('/admin/audit-logs')
- "Toggle dark mode" → dispatch theme toggle
- "Maintenance mode" → navigate('/admin/settings?tab=maintenance')

**UI behaviour:**
- Opens as centered modal overlay on `⌘K`/`Ctrl+K`
- Input auto-focused, debounce 150ms
- Arrow up/down to navigate results, Enter to execute
- Recent items (last 8) shown when query is empty, stored in localStorage
- `Esc` or click-outside to close

---

### 1.6 Empty State Components

**Affected files:**
- `client/src/components/admin/EmptyState.jsx` ← new shared component
- All list-view pages ← replace null/blank renders

**Component API:**
```jsx
<EmptyState
  icon="users"                    // lucide icon name
  title="No users found"
  description="Try adjusting your search filters"
  action={{ label: "Clear filters", onClick: clearFilters }}
  variant="filtered" | "empty" | "error"
/>
```

**Variants:**
- `empty` — no data at all yet, primary CTA to create first record
- `filtered` — search/filter returned nothing, CTA to clear filters
- `error` — API fetch failed, CTA to retry

**Per-module copy:**

| Module | Empty title | Description | CTA |
|--------|-------------|-------------|-----|
| Users | "No users yet" | "Add your first admin or user account" | "Add user" |
| Properties | "No listings found" | "Properties submitted by owners appear here" | "Add property" |
| Reviews | "No reviews pending" | "All caught up — review queue is clear" | "View approved" |
| Audit Logs | "No activity logged" | "Admin actions will appear here in real time" | — |
| Campaigns | "No campaigns sent" | "Create your first notification campaign" | "New campaign" |

---

### 1.7 Security Hardening (Critical)

**Files:**
- `server/src/middleware/adminAuth.js` ← remove dev bypass or hard-gate it
- `server/routes/adminSettings.js` ← harden API key reveal endpoint
- `server/src/middleware/rateLimiter.js` ← new
- `server/src/middleware/sanitize.js` ← new
- `server/app.js` ← apply new middleware globally

**Fix 1 — Dev bypass header removal:**
```js
// adminAuth.js — replace current fallback block with:
if (process.env.NODE_ENV !== 'development') {
  // Strip bypass headers at application layer (belt + nginx suspenders)
  if (req.headers['x-user-id'] || req.headers['x-user-role']) {
    return res.status(400).json({ error: 'Invalid request headers' });
  }
}
```
Also add to nginx config: `proxy_set_header x-user-id ""; proxy_set_header x-user-role "";`

**Fix 2 — API key reveal hardening:**
```js
// Endpoint: GET /api/admin/settings/api-keys/:key/reveal
// Add guards:
requireRole(['superadmin']),           // new superadmin tier
requireRecentAuth(15),                 // must have authed within 15 mins
rateLimiter({ max: 3, window: '1h' }), // 3 reveals/hour per admin
// Audit log: always, even on failed attempts
```

**Fix 3 — Input sanitization middleware:**
```js
// server/src/middleware/sanitize.js
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
// Apply in app.js:
app.use(helmet());
app.use(mongoSanitize({ replaceWith: '_' }));
```

**Fix 4 — Global soft-delete Mongoose plugin:**
```js
// server/src/plugins/softDeleteFilter.js
module.exports = function softDeleteFilter(schema) {
  schema.pre(/^find/, function(next) {
    if (!this._conditions.includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  });
};
// Apply to: User, Property, Location, Category, Review, Testimonial schemas
```

**Fix 5 — Rate limiting:**
```js
// server/src/middleware/rateLimiter.js — express-rate-limit presets:
exports.adminWriteLimit  = rateLimit({ windowMs: 60000, max: 60 });
exports.passwordLimit    = rateLimit({ windowMs: 3600000, max: 5 });
exports.bulkLimit        = rateLimit({ windowMs: 60000, max: 10 });
exports.exportLimit      = rateLimit({ windowMs: 3600000, max: 20 });
```

---

### 1.8 Enhanced KPI Cards with Sparklines

**Affected files:**
- `client/src/components/admin/KpiCard.jsx` ← upgrade existing or new
- `client/src/pages/admin/AdminOverview.jsx`
- `server/routes/adminDashboard.js` ← add trend data to stats endpoint

**API enhancement:**
```
GET /api/admin/dashboard/stats
```
Now returns per-metric 7-day sparkline array:
```json
{
  "totalUsers": 1247,
  "usersDelta": "+12%",
  "usersSparkline": [41, 38, 52, 47, 61, 58, 71],
  "totalProperties": 892,
  "propertiesDelta": "+5%",
  "propertiesSparkline": [22, 19, 28, 31, 25, 33, 29],
  "pendingReview": 14,
  "newUsersToday": 8
}
```

**`KpiCard.jsx` upgrade:**
```jsx
// Props: label, value, delta, deltaDirection, sparklineData, icon, onClick
// Renders: metric card + inline SVG sparkline (no library dep, ~12 lines)
// Delta colour: green if positive, red if negative, gray if zero
// Hover state: expand card height to show 30-day chart in collapsible section
```

---

## Phase 2 — Build Missing Critical Modules (Week 3–5) {#phase-2}

### 2.1 Conversation Moderation UI

**Backend already exists.** Frontend is completely missing.

**New files:**
```
client/src/pages/admin/ConversationModeration.jsx     ← main page
client/src/components/admin/ConversationList.jsx      ← left panel table
client/src/components/admin/ConversationThread.jsx    ← right panel thread reader
client/src/components/admin/ConversationActions.jsx   ← action sidebar
client/src/components/admin/FlagModal.jsx             ← flag/reason form
```

**Add to sidebar (`AdminSidebar.jsx`):**
```jsx
{ label: 'Conversations', icon: MessageSquare, path: '/admin/conversations' }
// Place under: Management group
```

**Page layout:** Split panel — 38% left (conversation list), 62% right (thread reader + action bar)

**Conversation list columns:** Participants · Property · Messages · Last active · Flag status · Actions

**Thread reader features:**
- Chat bubble UI: owner messages right-aligned (blue), tenant left-aligned (gray)
- Timestamps on each bubble
- Flagged messages highlighted with amber left border
- Auto-scroll to most recent / most flagged message on open
- Participant info bar at top: avatars, names, roles, property link

**Moderation action panel (right sidebar):**
```
[Flag conversation]      → opens FlagModal (severity: low/medium/high, reason text)
[Escalate]               → assigns to senior admin, changes flag status to 'escalated'
[Resolve]                → marks flagged conversation as resolved
[Warn participants]      → triggers notification to both parties via existing notification engine
[Block participant]      → links to existing block-user flow in User Management
[Export transcript]      → POST /api/admin/messages/conversations/:id/export → PDF
```

**Auto-flag rules (server-side, `server/src/services/conversationFlagService.js`):**
```js
// Triggers auto-flag and emits admin notification on:
// 1. Message contains keyword from configurable blocklist (stored in Settings)
// 2. >20 messages sent in 10 minutes by one user (rate anomaly)
// 3. User-reported flag (from tenant/owner report button on main app)
```

**New API endpoints:**
```
GET    /api/admin/messages/conversations/:id/export       → PDF transcript
POST   /api/admin/messages/conversations/:id/flag         { severity, reason }
PATCH  /api/admin/messages/conversations/:id/escalate     { assignedTo }
PATCH  /api/admin/messages/conversations/:id/resolve      { resolution }
GET    /api/admin/messages/flagged                        → flagged queue list
PUT    /api/admin/messages/flagrules                      { keywords[], rateThreshold }
```

**Audit log additions:** All actions (`FLAG`, `ESCALATE`, `RESOLVE`, `EXPORT`) logged with `resourceType: 'conversation'`

---

### 2.2 RBAC Visual Permission Matrix

**New files:**
```
client/src/pages/admin/RolePermissions.jsx             ← main page
client/src/components/admin/PermissionMatrix.jsx       ← interactive grid
client/src/components/admin/RoleBuilderModal.jsx       ← create/edit custom role
client/src/components/admin/PermissionGuard.jsx        ← HOC for frontend gating
client/src/hooks/usePermissions.js                     ← hook to read current admin's perms
server/models/Role.js                                  ← new schema
server/routes/adminRoles.js                            ← new router
server/src/middleware/requirePermission.js             ← new fine-grained guard
```

**New DB schema — `server/models/Role.js`:**
```js
const roleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  isSystem: { type: Boolean, default: false },  // system roles are read-only
  inheritsFrom: { type: String, default: null }, // parent role name
  permissions: {
    // Map: module → actions → boolean
    users:         { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean, export: Boolean },
    properties:    { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean, export: Boolean, approve: Boolean },
    content:       { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean, publish: Boolean },
    reviews:       { view: Boolean, approve: Boolean, reject: Boolean, delete: Boolean },
    settings:      { view: Boolean, edit: Boolean, apiKeys: Boolean },
    reports:       { view: Boolean, export: Boolean },
    audit:         { view: Boolean, export: Boolean },
    conversations: { view: Boolean, flag: Boolean, escalate: Boolean },
    notifications: { view: Boolean, send: Boolean, broadcast: Boolean },
    roles:         { view: Boolean, edit: Boolean }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});
```

**Permission matrix UI:**
- Rows: modules (10 rows)
- Columns: system roles + custom roles
- Cells: checkbox toggles
- System roles (admin, agent, owner, user): read-only display columns
- Custom roles: editable toggles
- "Create role" button → `RoleBuilderModal`

**`PermissionGuard.jsx`:**
```jsx
// Usage: <PermissionGuard module="users" action="delete">
//          <DeleteButton />
//        </PermissionGuard>
// Reads permissions from auth context, renders null if not permitted
// Can also be used as a hook: const can = usePermissions();  can('users', 'delete')
```

**New API endpoints:**
```
GET    /api/admin/roles                         list all roles + their permissions
POST   /api/admin/roles                         create custom role
PUT    /api/admin/roles/:id                     update permissions
DELETE /api/admin/roles/:id                     delete (only non-system)
GET    /api/admin/roles/:id/history             changelog of permission changes
POST   /api/admin/users/:id/assign-role         assign custom role (ROLE_CHANGE audit)
```

**`requirePermission` middleware upgrade:**
```js
// server/src/middleware/requirePermission.js
// Usage: router.delete('/:id', requirePermission('users', 'delete'), handler)
module.exports = (module, action) => async (req, res, next) => {
  const role = await Role.findOne({ name: req.user.role });
  if (!role?.permissions?.[module]?.[action]) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```

---

### 2.3 Media Library / Asset Manager

**New files:**
```
client/src/pages/admin/MediaLibrary.jsx              ← main page
client/src/components/admin/MediaGrid.jsx            ← masonry asset grid
client/src/components/admin/MediaUploadZone.jsx      ← drag-and-drop uploader
client/src/components/admin/MediaDetailPanel.jsx     ← right-slide asset inspector
client/src/components/admin/MediaImageEditor.jsx     ← canvas-based basic editor
server/routes/adminMedia.js                          ← new router
server/models/MediaAsset.js                          ← new schema
server/src/services/mediaService.js                  ← upload, compress, CDN helpers
```

**New DB schema — `server/models/MediaAsset.js`:**
```js
const mediaAssetSchema = new Schema({
  filename:      { type: String, required: true },
  originalName:  String,
  mimeType:      String,
  sizeBytes:     Number,
  dimensions:    { width: Number, height: Number },
  cdnUrl:        { type: String, required: true },
  thumbnailUrl:  String,
  module:        { type: String, enum: ['property', 'banner', 'content', 'testimonial', 'misc'] },
  usedIn:        [{ resourceType: String, resourceId: Schema.Types.ObjectId }],
  uploadedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  tags:          [String],
  isOrphaned:    { type: Boolean, default: false },
  createdAt:     { type: Date, default: Date.now }
});
```

**Upload flow:**
1. Client: drag files onto `MediaUploadZone` → browser Canvas API compresses images >2MB to ≤1.5MB JPEG
2. Client: shows per-file progress bar (using XHR `onprogress`)
3. Server: `POST /api/admin/media/upload` (multipart, up to 20 files)
4. Server: saves to cloud storage (S3/Cloudinary), stores `MediaAsset` doc, returns CDN URLs

**Asset grid:** CSS masonry (CSS `columns: 4`) with lazy-loaded thumbnails. Hover overlay: filename + size + action icons (view, copy URL, delete).

**Detail panel (right slide-in):**
- Full preview (image) or file icon (PDF/doc)
- Metadata: filename, size, dimensions, upload date, uploader name
- Module tag badge
- "Used in" list: linked resource names
- Copy CDN URL button
- "Replace file" (upload new version, updates all `usedIn` references)
- Delete button (blocked if usedIn.length > 0, unless force-delete)

**Storage dashboard (top of page):**
```
[Used: 2.4 GB / 10 GB] [████████░░] 24%
Breakdown: Properties 1.8GB · Banners 0.3GB · Content 0.2GB · Misc 0.1GB
[Find orphaned assets (47)]   [Bulk delete orphaned]
```

**Image editor:** Open in modal. Canvas API operations: crop (aspect ratio lock), rotate 90°, brightness slider, contrast slider. "Save as new" or "Overwrite" on confirm.

**New API endpoints:**
```
GET    /api/admin/media?module=&search=&sort=newest|oldest|largest   paginated list
POST   /api/admin/media/upload                                        multipart upload
GET    /api/admin/media/:id                                           asset detail + usedIn
DELETE /api/admin/media/:id                                           delete (check usedIn)
DELETE /api/admin/media/bulk/orphaned                                 bulk delete orphaned
GET    /api/admin/media/storage/stats                                 storage breakdown
PATCH  /api/admin/media/:id/replace                                   upload new version
```

---

### 2.4 Admin Real-Time Notification Center

**New files:**
```
client/src/components/admin/NotificationBell.jsx        ← sidebar bell icon + tray
client/src/components/admin/NotificationTray.jsx        ← dropdown notification list
client/src/context/AdminNotificationContext.jsx         ← global notification state
client/src/hooks/useAdminNotifications.js               ← socket subscription hook
server/src/services/adminNotificationService.js         ← trigger + emit service
server/models/AdminNotification.js                      ← new schema
server/routes/adminNotificationCenter.js                ← CRUD + mark-read endpoints
```

**New DB schema — `server/models/AdminNotification.js`:**
```js
const adminNotificationSchema = new Schema({
  type:        { type: String, enum: ['system', 'user', 'property', 'review', 'report', 'security'] },
  severity:    { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  title:       String,
  body:        String,
  actionUrl:   String,          // deep-link: e.g. '/admin/users?highlight=userId'
  relatedId:   Schema.Types.ObjectId,
  relatedType: String,
  recipients:  [{ type: Schema.Types.ObjectId, ref: 'User' }],  // admin IDs
  readBy:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt:   { type: Date, default: Date.now }
});
```

**Automatic trigger events:**
```
New user registered           → type:'user',     title: 'New user: {name}',    severity: 'info'
Property submitted            → type:'property', title: '{N} properties pending review', severity: 'info'
Review flagged                → type:'review',   title: 'Review flagged for moderation', severity: 'warning'
System alert (gateway down)   → type:'system',   title: 'SMS gateway degraded', severity: 'critical'
Audit anomaly (10+ fail auth) → type:'security', title: 'Suspicious login activity', severity: 'critical'
Scheduled report ready        → type:'report',   title: 'Weekly report ready',  severity: 'info'
```

**Bell icon in sidebar:** Red badge showing unread count. Clicking opens `<NotificationTray>` dropdown (max-height 480px, scrollable). Each notification: icon (color-coded by severity) + title + body snippet + time ago + "Go →" link.

**Tray actions:** "Mark all read" · "Notification preferences" link to settings tab

**New API endpoints:**
```
GET    /api/admin/notification-center?page=1&limit=20    admin's notifications
PATCH  /api/admin/notification-center/:id/read           mark one read
PATCH  /api/admin/notification-center/read-all           mark all read
DELETE /api/admin/notification-center/:id                dismiss
GET    /api/admin/notification-center/unread-count       for bell badge polling fallback
```

---

### 2.5 CMS Rich Text Editor + Publishing Workflow

**Affected files:**
```
client/src/pages/admin/ContentManagement.jsx
client/src/components/admin/RichTextEditor.jsx           ← new (Tiptap wrapper)
client/src/components/admin/PageEditor.jsx               ← upgrade to use RichTextEditor
client/src/components/admin/BannerEditor.jsx             ← minor updates
client/src/components/admin/VersionHistoryModal.jsx      ← new
client/src/components/admin/SchedulePublishModal.jsx     ← new
server/models/ContentPage.js                            ← add versioning fields
server/routes/adminContent.js                           ← add version + schedule endpoints
server/src/jobs/publishScheduler.js                     ← new cron job
```

**Tiptap editor setup:**
```js
// Install: @tiptap/react @tiptap/starter-kit @tiptap/extension-image
// @tiptap/extension-link @tiptap/extension-table @tiptap/extension-code-block

const editor = useEditor({
  extensions: [StarterKit, Image, Link, Table, CodeBlock, Placeholder],
  content: initialContent,
  onUpdate: ({ editor }) => debounce(() => onAutoSave(editor.getJSON()), 2000)
});
```

**Auto-save:** Debounced 2s after last keystroke → `PATCH /api/admin/content/pages/:id/autosave` (saves as draft, never increments version)

**Version history:**
```js
// server/models/ContentPage.js additions:
versions: [{
  versionNumber: Number,
  content:       Schema.Types.Mixed,  // Tiptap JSON snapshot
  savedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  savedAt:       Date,
  label:         String               // optional label: 'Before SEO update'
}]
publishedAt:  Date
scheduledFor: Date        // null if not scheduled
status:       { type: String, enum: ['draft', 'scheduled', 'published', 'archived'] }
```

**Version history modal:** List of versions (number, date, author). Click version → shows diff view (green text = added, red = removed). "Restore this version" button creates new version from it.

**Scheduled publish:** Date-time picker in page editor sidebar. `POST /api/admin/content/pages/:id/schedule { publishAt: ISO8601 }`. Server cron (node-cron, runs every minute) checks for `scheduledFor <= now && status === 'scheduled'` and sets `status = 'published'`.

**Preview mode:** `GET /api/admin/content/pages/:id/preview-token` returns a signed JWT valid 24h. Preview URL: `https://renters.app/preview?token=<jwt>` — main app reads token, renders draft content with preview banner.

**New API endpoints:**
```
POST   /api/admin/content/pages/:id/autosave        save draft (no version bump)
POST   /api/admin/content/pages/:id/publish         publish immediately (new version)
POST   /api/admin/content/pages/:id/schedule        { publishAt }
GET    /api/admin/content/pages/:id/versions        list all versions
GET    /api/admin/content/pages/:id/versions/:vNum  fetch specific version content
POST   /api/admin/content/pages/:id/versions/:vNum/restore
GET    /api/admin/content/pages/:id/preview-token   signed preview URL
```

---

### 2.6 User Profile Drawer (Deep User Inspection)

**Affected files:**
```
client/src/pages/admin/UserManagement.jsx
client/src/components/admin/UserProfileDrawer.jsx        ← new
client/src/components/admin/UserTimeline.jsx             ← new
client/src/components/admin/UserSessionHistory.jsx       ← new
server/routes/adminUsers.js                             ← add session + timeline endpoints
server/models/UserSession.js                            ← new schema
```

**New DB schema — `server/models/UserSession.js`:**
```js
const userSessionSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jti:       String,           // JWT ID for revocation
  ipAddress: String,
  userAgent: String,
  device:    { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'] },
  browser:   String,
  os:        String,
  city:      String,           // from geo-IP lookup
  country:   String,
  loginAt:   Date,
  logoutAt:  Date,
  isActive:  { type: Boolean, default: true }
});
```

**Drawer layout — 480px right slide-in:**
```
[Avatar] [Name]  [Role badge]  [Status badge]
Tabs: Overview | Properties | Activity | Sessions | Audit trail

Overview:
  Joined: 14 Mar 2024 · Last login: 2 hours ago
  Email verified: Yes · Phone verified: No
  Total properties: 3 · Total reviews: 12
  Block history: [Blocked 3 Jan for spam] [Unblocked 5 Jan]

Properties tab:
  Table: title · city · status · listed date

Activity tab:
  Chronological list of: reviews submitted, properties listed, messages sent

Sessions tab:
  Table: device icon · browser/OS · IP · City · Login time · [Revoke]
  [Revoke all sessions] button at top

Audit trail tab:
  All AuditLog entries where resourceId = this user's _id
```

**New API endpoints:**
```
GET    /api/admin/users/:id/detail         full profile + stats
GET    /api/admin/users/:id/sessions       active + recent sessions
DELETE /api/admin/users/:id/sessions       revoke all (invalidate JTIs in Redis/DB)
DELETE /api/admin/users/:id/sessions/:jti  revoke single session
GET    /api/admin/users/:id/timeline       chronological activity events
```

---

## Phase 3 — Intelligence Layer (Week 6–8) {#phase-3}

### 3.1 Revenue & Financial Analytics Module

**New files:**
```
client/src/pages/admin/Analytics.jsx                    ← main analytics hub
client/src/components/admin/RevenueChart.jsx
client/src/components/admin/UserFunnelChart.jsx
client/src/components/admin/GeographicHeatMap.jsx
client/src/components/admin/CohortRetentionTable.jsx
server/routes/adminAnalytics.js                        ← new router
server/models/Transaction.js                           ← new schema (if payments exist)
```

**New DB schema — `server/models/Transaction.js`:**
```js
const transactionSchema = new Schema({
  userId:        { type: Schema.Types.ObjectId, ref: 'User' },
  propertyId:    { type: Schema.Types.ObjectId, ref: 'Property', default: null },
  type:          { type: String, enum: ['subscription', 'listing_fee', 'featured_boost', 'refund'] },
  amount:        Number,
  currency:      { type: String, default: 'INR' },
  status:        { type: String, enum: ['pending', 'completed', 'failed', 'refunded'] },
  gateway:       { type: String, enum: ['razorpay', 'stripe', 'manual'] },
  gatewayTxnId:  String,
  description:   String,
  createdAt:     { type: Date, default: Date.now }
});
```

**Analytics page layout — 4 sections:**

**Section A — Business KPIs (top row of 6 cards):**
MRR · ARR · Total transactions (30d) · Avg. transaction value · Refund rate · Active paid users

**Section B — Revenue chart (Recharts):**
- Area chart: daily revenue last 30/60/90 days (toggle)
- Stacked by transaction type (subscription vs listing fee vs boost)
- Comparison line: previous equivalent period
- Hover tooltip: date, breakdown, total

**Section C — User funnel:**
```
Registered (5,420)
    ↓ 72%
Email Verified (3,902)
    ↓ 38%
Listed a Property (1,482)
    ↓ 61%
Received Enquiry (904)
    ↓ 44%
Converted (398)
```
Recharts `<FunnelChart>` with drop-off % labels.

**Section D — Geographic heatmap:**
SVG India map with states filled by property count (lighter = fewer, darker = more). Click state → city breakdown bar chart slides in below.

**Section E — Cohort retention table:**
Rows = weekly registration cohorts (8 weeks). Columns = weeks 0–7. Cells = % still active. Color-coded: green >40%, amber 20–40%, red <20%.

**New API endpoints:**
```
GET /api/admin/analytics/revenue?period=30d|60d|90d    revenue timeseries
GET /api/admin/analytics/funnel                         conversion funnel counts
GET /api/admin/analytics/geographic                     property count by state/city
GET /api/admin/analytics/cohort?weeks=8                 cohort retention matrix
GET /api/admin/analytics/transactions?page=1&status=    transaction log
GET /api/admin/analytics/kpis                           headline numbers
```

---

### 3.2 Support Ticket & Dispute Resolution System

**New files:**
```
client/src/pages/admin/SupportTickets.jsx
client/src/components/admin/TicketList.jsx
client/src/components/admin/TicketDetail.jsx
client/src/components/admin/TicketReplyBox.jsx
client/src/components/admin/DisputePanel.jsx
client/src/components/admin/SlaTimer.jsx
server/models/Ticket.js
server/models/TicketReply.js
server/routes/adminTickets.js
server/src/jobs/slaMonitor.js
```

**New DB schema — `server/models/Ticket.js`:**
```js
const ticketSchema = new Schema({
  ticketNumber:  { type: String, unique: true },   // e.g. TKT-2024-0042
  subject:       String,
  type:          { type: String, enum: ['enquiry', 'dispute', 'report', 'bug', 'other'] },
  priority:      { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status:        { type: String, enum: ['open', 'in_progress', 'awaiting_user', 'resolved', 'closed'] },
  submittedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  assignedTo:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
  relatedProperty: { type: Schema.Types.ObjectId, ref: 'Property', default: null },
  // Dispute fields (when type === 'dispute'):
  disputeParties:  [{ userId: Schema.Types.ObjectId, role: String, submission: String }],
  disputeDecision: { type: String, enum: ['favour_owner', 'favour_tenant', 'partial', 'escalated', null] },
  decisionReason:  String,
  decisionBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  slaDeadline:     Date,
  slaBreached:     { type: Boolean, default: false },
  tags:            [String],
  createdAt:       { type: Date, default: Date.now },
  resolvedAt:      Date
});
```

**New DB schema — `server/models/TicketReply.js`:**
```js
const ticketReplySchema = new Schema({
  ticketId:   { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
  author:     { type: Schema.Types.ObjectId, ref: 'User' },
  body:       String,
  isInternal: { type: Boolean, default: false },   // admin-only note, not shown to user
  attachments: [{ filename: String, cdnUrl: String }],
  createdAt:  { type: Date, default: Date.now }
});
```

**SLA configuration (in System Settings > General):**
```
low priority:      72 hours
medium priority:   24 hours
high priority:     8 hours
critical priority: 2 hours
```

**SLA monitor cron (`slaMonitor.js`):** Runs every 15 minutes. Finds tickets where `slaDeadline <= now + 20%` and status not resolved. Emits admin notification. Sets `slaBreached: true` at deadline.

**`SlaTimer.jsx`:** Visual countdown bar in ticket list row and detail. Green → amber at 80% elapsed → red when breached.

**New API endpoints:**
```
GET    /api/admin/tickets?status=&type=&priority=&assignedTo=&page=
POST   /api/admin/tickets                                create ticket (admin-side)
GET    /api/admin/tickets/:id                            detail + replies
POST   /api/admin/tickets/:id/reply                      { body, isInternal, attachments }
PATCH  /api/admin/tickets/:id/status                     { status }
PATCH  /api/admin/tickets/:id/assign                     { adminId }
PATCH  /api/admin/tickets/:id/priority                   { priority }
POST   /api/admin/tickets/:id/dispute-decision           { decision, reason }
GET    /api/admin/tickets/analytics/summary              avg resolution time, breach rate
```

---

### 3.3 Campaign A/B Testing & Analytics

**Affected files:**
```
client/src/pages/admin/CampaignManagement.jsx          ← major upgrade
client/src/components/admin/CampaignAnalytics.jsx      ← new
client/src/components/admin/ABTestSetup.jsx            ← new
server/routes/adminNotifications.js                    ← extend
server/models/Campaign.js                              ← new/upgrade schema
server/src/services/trackingService.js                 ← new (link wrapper + open pixel)
```

**New DB schema — `server/models/Campaign.js`:**
```js
const campaignSchema = new Schema({
  name:         String,
  type:         { type: String, enum: ['broadcast', 'targeted', 'automated'] },
  channel:      { type: String, enum: ['email', 'sms', 'in_app', 'push'] },
  status:       { type: String, enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'] },
  scheduledFor: Date,
  sentAt:       Date,
  audience:     { type: Schema.Types.Mixed },          // segmentation config
  isABTest:     { type: Boolean, default: false },
  variants: [{
    label:     String,                                 // 'A' or 'B'
    subject:   String,
    body:      String,
    splitPct:  Number,                                 // 50/50 or 70/30 etc.
    stats: {
      sent: Number, delivered: Number, opened: Number,
      clicked: Number, failed: Number, unsubscribed: Number
    }
  }],
  winnerVariant:  String,                              // 'A' | 'B' | null
  winnerCriteria: { type: String, enum: ['open_rate', 'click_rate'] },
  winnerPickedAt: Date,
  createdBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt:  { type: Date, default: Date.now }
});
```

**A/B test flow:**
1. Toggle "A/B test" in campaign builder
2. Configure: Variant A subject/body, Variant B subject/body, split % (default 50/50), winner criteria (open rate vs click rate), auto-pick winner after N hours
3. On send: audience split randomly by `splitPct`
4. After `winnerPickedAt` time: auto-send winning variant to remaining audience (if auto-pick enabled)
5. Analytics tab: side-by-side bar chart comparing open rate, click rate, CTR per variant

**Tracking service:**
- Email opens: 1×1 transparent PNG tracking pixel embedded in email HTML
- Link clicks: all URLs in campaign body wrapped to `/track/click?campaignId=&variantId=&userId=&url=<encoded>` → redirect to real URL + log click event

**New API endpoints:**
```
POST   /api/admin/notifications/campaigns                   create campaign
GET    /api/admin/notifications/campaigns/:id/analytics     variant stats
POST   /api/admin/notifications/campaigns/:id/send          start send job
POST   /api/admin/notifications/campaigns/:id/pick-winner   { variant }
GET    /api/admin/notifications/unsubscribes                suppression list
DELETE /api/admin/notifications/unsubscribes/:userId        re-subscribe user
GET    /track/open                                          email open pixel handler
GET    /track/click                                         link click redirect + log
```

---

### 3.4 Scheduled Reports with PDF Export & Email Delivery

**Affected files:**
```
client/src/pages/admin/Reports.jsx                     ← add schedule + PDF features
client/src/components/admin/ScheduleReportModal.jsx    ← new
server/routes/adminReports.js                          ← extend
server/models/ReportSchedule.js                        ← new schema
server/src/jobs/reportScheduler.js                     ← cron job
server/src/services/pdfReportService.js                ← Puppeteer/PDFKit report generator
```

**New DB schema — `server/models/ReportSchedule.js`:**
```js
const reportScheduleSchema = new Schema({
  name:       String,
  type:       { type: String, enum: ['users', 'properties', 'activity', 'revenue'] },
  filters:    Schema.Types.Mixed,          // saved filter config
  frequency:  { type: String, enum: ['daily', 'weekly', 'monthly'] },
  dayOfWeek:  Number,                      // 0-6 for weekly
  dayOfMonth: Number,                      // 1-31 for monthly
  format:     { type: String, enum: ['csv', 'json', 'pdf'] },
  recipients: [String],                    // email addresses
  lastRunAt:  Date,
  nextRunAt:  Date,
  isActive:   { type: Boolean, default: true },
  createdBy:  { type: Schema.Types.ObjectId, ref: 'User' }
});
```

**PDF report generation (`pdfReportService.js`):**
- Uses `pdfkit` (no headless browser needed)
- Template: Renters logo header, report title, generated date, filter summary, summary stats section, data table (up to 500 rows), charts as PNG (generated server-side with `chartjs-node-canvas`)
- Attach to email via existing Nodemailer setup

**Report scheduler cron:** Runs every hour. Checks `ReportSchedule` docs where `nextRunAt <= now && isActive`. Generates report → emails to `recipients` → updates `lastRunAt`, calculates next `nextRunAt`.

**New API endpoints:**
```
GET    /api/admin/reports/schedules                         list schedules
POST   /api/admin/reports/schedules                         create schedule
PUT    /api/admin/reports/schedules/:id
DELETE /api/admin/reports/schedules/:id
POST   /api/admin/reports/schedules/:id/run-now            manual trigger
GET    /api/admin/reports/:type/export?format=pdf&[filters] PDF download
POST   /api/admin/reports/:type/snapshot                   export chart as PNG
```

---

### 3.5 Multi-Admin Session Monitor

**New files:**
```
client/src/pages/admin/Settings/AdminSessions.jsx     ← tab in System Settings
client/src/components/admin/ActiveSessionsTable.jsx   ← new
server/routes/adminSessions.js                        ← new
server/src/services/sessionTracker.js                 ← Redis-backed presence
```

**Architecture:** On successful admin login, write to Redis: `admin:session:{adminId}:{jti}` with TTL = token expiry. Value: `{ name, email, role, ip, userAgent, loginAt }`.

**Active sessions view (tab in Settings):**
```
Active admins right now (3):
┌──────────────────┬──────────┬──────────────┬────────────┬──────────────────┐
│ Admin            │ Role     │ IP Address   │ Login at   │ Actions          │
├──────────────────┼──────────┼──────────────┼────────────┼──────────────────┤
│ ● Ravi Sharma    │ admin    │ 203.x.x.45   │ 2h ago     │ [Force logout]   │
│ ● Priya Mehta    │ agent    │ 117.x.x.12   │ 45m ago    │ [Force logout]   │
│ ● You            │ superadmin│ 49.x.x.8    │ 10m ago    │ —                │
└──────────────────┴──────────┴──────────────┴────────────┴──────────────────┘
```

**Concurrent edit conflict warning:** When two admins open the same entity (e.g., same user profile), WebSocket room `entity:user:{id}` fires `edit:conflict` event showing: "Priya Mehta is also editing this record." Non-blocking warning banner in the form.

**Force logout:** `DELETE /api/admin/sessions/:adminId/:jti` → deletes Redis key, adds JTI to blacklist set (checked on every `authenticateAdmin` call).

**New API endpoints:**
```
GET    /api/admin/sessions/active                   all active admin sessions from Redis
DELETE /api/admin/sessions/:adminId/:jti            force logout specific session
DELETE /api/admin/sessions/:adminId                 force logout all sessions for admin
GET    /api/admin/sessions/history?adminId=&days=7  historical session log
```

---

## Cross-Cutting Concerns {#cross-cutting}

### Read Action Audit Logging (Fills Current Gap)

Currently only write actions are logged. Add `VIEW` logging for sensitive reads:

```js
// server/src/middleware/auditRead.js
module.exports = (resourceType, getResourceId) => async (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400) {
      auditLog.create({
        adminId: req.user._id,
        action: 'VIEW',
        resourceType,
        resourceId: getResourceId(req),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date()
      });
    }
  });
  next();
};

// Apply to:
router.get('/messages/conversations/:id', auditRead('conversation', r=>r.params.id), handler);
router.get('/settings/api-keys/:key/reveal', auditRead('settings', r=>r.params.key), handler);
router.get('/users/:id', auditRead('user', r=>r.params.id), handler);
router.get('/reports/:type/export', auditRead('report', r=>r.params.type), handler);
```

### JWT Refresh Token Architecture

```
Short-lived access token:  15 minutes (in Authorization header)
Long-lived refresh token:  7 days (in httpOnly Secure cookie)

POST /api/admin/auth/refresh   → validates refresh token cookie → issues new access token
POST /api/admin/auth/logout    → blacklists refresh token JTI in Redis, clears cookie
```

User schema additions:
```js
refreshTokenJti: String,    // current valid refresh token JTI
lastLoginAt:     Date,
lastLoginIp:     String
```

### Notification Preference Schema Addition

```js
// Add to User schema:
adminNotificationPrefs: {
  email:    { type: Boolean, default: true },
  inPanel:  { type: Boolean, default: true },
  quietHoursStart: { type: Number, default: 22 },  // 22:00
  quietHoursEnd:   { type: Number, default: 7 },   // 07:00
  disabledTypes:   [String]  // e.g. ['user', 'property'] — still get 'security' and 'critical'
}
```

---

## DB Schema Additions Reference {#schemas}

| Schema | File | Phase | Purpose |
|--------|------|-------|---------|
| `Role` | `server/models/Role.js` | Phase 2 | Custom RBAC roles + permissions matrix |
| `MediaAsset` | `server/models/MediaAsset.js` | Phase 2 | Centralized file/image registry |
| `AdminNotification` | `server/models/AdminNotification.js` | Phase 2 | Real-time admin alert records |
| `UserSession` | `server/models/UserSession.js` | Phase 2 | Login session + device history |
| `Transaction` | `server/models/Transaction.js` | Phase 3 | Financial transaction log |
| `Campaign` | `server/models/Campaign.js` | Phase 3 | Campaign + A/B test records |
| `ReportSchedule` | `server/models/ReportSchedule.js` | Phase 3 | Scheduled report config |
| `Ticket` | `server/models/Ticket.js` | Phase 3 | Support & dispute tickets |
| `TicketReply` | `server/models/TicketReply.js` | Phase 3 | Ticket thread messages |

**Existing schema modifications:**
- `User` → add `refreshTokenJti`, `lastLoginAt`, `lastLoginIp`, `adminNotificationPrefs`
- `ContentPage` → add `versions[]`, `publishedAt`, `scheduledFor`, `status`
- `AuditLog` → no changes needed; new action types (`VIEW`, `FLAG`, `ESCALATE`, `RESOLVE`, `EXPORT`) already supported by `VALID_ACTIONS` enum

---

## API Endpoint Master Index {#api-index}

### Phase 1 — New endpoints

| Method | Path | Purpose |
|--------|------|---------|
| PATCH | `/api/admin/users/bulk/status` | Bulk block/deactivate users |
| DELETE | `/api/admin/users/bulk` | Bulk soft-delete users |
| POST | `/api/admin/users/bulk/export` | Bulk export users CSV/JSON |
| PATCH | `/api/admin/properties/bulk/status` | Bulk property moderation |
| POST | `/api/admin/properties/bulk/export` | Bulk export properties |
| PATCH | `/api/admin/reviews/bulk/reject` | Bulk reject reviews |
| GET | `/api/admin/search` | Global cross-entity command palette search |
| GET | `/api/admin/dashboard/stats` | Extended with sparkline arrays |

### Phase 2 — New endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/messages/flagged` | Flagged conversation queue |
| POST | `/api/admin/messages/conversations/:id/flag` | Flag conversation |
| PATCH | `/api/admin/messages/conversations/:id/escalate` | Escalate to senior admin |
| PATCH | `/api/admin/messages/conversations/:id/resolve` | Resolve flag |
| GET | `/api/admin/messages/conversations/:id/export` | PDF transcript |
| GET | `/api/admin/roles` | List all roles |
| POST | `/api/admin/roles` | Create custom role |
| PUT | `/api/admin/roles/:id` | Update role permissions |
| DELETE | `/api/admin/roles/:id` | Delete custom role |
| POST | `/api/admin/users/:id/assign-role` | Assign role to user |
| GET | `/api/admin/media` | List media assets |
| POST | `/api/admin/media/upload` | Upload files (multipart) |
| GET | `/api/admin/media/:id` | Asset detail + usedIn |
| DELETE | `/api/admin/media/:id` | Delete asset |
| DELETE | `/api/admin/media/bulk/orphaned` | Bulk delete orphaned |
| GET | `/api/admin/media/storage/stats` | Storage breakdown |
| GET | `/api/admin/notification-center` | Admin notification list |
| PATCH | `/api/admin/notification-center/:id/read` | Mark one read |
| PATCH | `/api/admin/notification-center/read-all` | Mark all read |
| GET | `/api/admin/users/:id/sessions` | User session history |
| DELETE | `/api/admin/users/:id/sessions` | Revoke all sessions |
| GET | `/api/admin/users/:id/timeline` | User activity timeline |
| POST | `/api/admin/content/pages/:id/publish` | Publish page immediately |
| POST | `/api/admin/content/pages/:id/schedule` | Schedule publish |
| GET | `/api/admin/content/pages/:id/versions` | Version history list |
| POST | `/api/admin/content/pages/:id/versions/:v/restore` | Restore version |
| GET | `/api/admin/content/pages/:id/preview-token` | Signed preview URL |

### Phase 3 — New endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/analytics/revenue` | Revenue timeseries |
| GET | `/api/admin/analytics/funnel` | User conversion funnel |
| GET | `/api/admin/analytics/geographic` | Property map data |
| GET | `/api/admin/analytics/cohort` | Cohort retention matrix |
| GET | `/api/admin/analytics/kpis` | Headline KPI numbers |
| GET | `/api/admin/tickets` | Ticket list |
| POST | `/api/admin/tickets` | Create ticket |
| GET | `/api/admin/tickets/:id` | Ticket detail |
| POST | `/api/admin/tickets/:id/reply` | Reply to ticket |
| PATCH | `/api/admin/tickets/:id/status` | Update ticket status |
| POST | `/api/admin/tickets/:id/dispute-decision` | Record dispute outcome |
| POST | `/api/admin/notifications/campaigns` | Create campaign |
| GET | `/api/admin/notifications/campaigns/:id/analytics` | Campaign stats |
| POST | `/api/admin/notifications/campaigns/:id/pick-winner` | Pick A/B winner |
| GET | `/api/admin/reports/schedules` | List report schedules |
| POST | `/api/admin/reports/schedules` | Create schedule |
| POST | `/api/admin/reports/schedules/:id/run-now` | Trigger immediately |
| GET | `/api/admin/reports/:type/export?format=pdf` | PDF export |
| GET | `/api/admin/sessions/active` | All active admin sessions |
| DELETE | `/api/admin/sessions/:adminId/:jti` | Force logout session |
| GET | `/track/open` | Email open tracking pixel |
| GET | `/track/click` | Campaign link click tracker |
| POST | `/api/admin/auth/refresh` | JWT refresh token exchange |

---

*This document was generated from a full codebase audit of the Renters admin panel. All file paths, schema field names, and API route patterns match the existing architecture. Implement phases sequentially — Phase 1 has zero new dependencies and can begin immediately.*
