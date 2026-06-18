# Renters Upgrade — Batch 5: Visit Booking Scheduler

This batch adds a calendar-based visit scheduling system: property owners define 
available time slots, tenants book a visit directly from the property detail page, 
and confirmed bookings surface in chat (Batch 3) and in each user's dashboard.

This is a genuinely new feature (no existing UI to refactor), so it starts with data 
model + backend, then builds the owner-facing and tenant-facing UI, then wires it into 
chat and dashboards.

Run in order.

---

## Prompt 1 — Data Model & Backend Endpoints

```
Add backend support for visit scheduling. Examine the existing server structure 
(/server/routes/, /server/models/ or equivalent ORM schema files) and follow the 
existing conventions (naming, validation middleware, auth middleware) when adding the 
following.

New models/collections:
- `AvailabilitySlot`: { ownerId, propertyId, dayOfWeek (0-6) OR specific date, 
  startTime, endTime, slotDurationMinutes (default 30), isActive }
  — supports either a recurring weekly pattern (dayOfWeek + time range, auto-generates 
  slots) or specific one-off date overrides (specific date + time range). Keep both 
  options simple: a `type: "recurring" | "override"` field.
- `VisitBooking`: { propertyId, ownerId, tenantId, slotStart (datetime), slotEnd 
  (datetime), status ("pending" | "confirmed" | "cancelled" | "completed"), 
  createdAt, notes (optional tenant message) }

New endpoints (protected by existing auth middleware):
- `POST /api/properties/:id/availability` — owner sets/updates availability rules for 
  a property.
- `GET /api/properties/:id/availability` — public: returns computed available time 
  slots for the next N days (default 14), expanding recurring rules into concrete 
  date/time slots and excluding any already-booked or cancelled-by-owner slots.
- `POST /api/properties/:id/bookings` — tenant books a slot; validates the slot is 
  still available (prevent double-booking via a transaction or unique index on 
  propertyId+slotStart for non-cancelled bookings).
- `GET /api/bookings/me` — returns the logged-in user's bookings (as tenant) or 
  bookings for their properties (as owner), depending on role.
- `PATCH /api/bookings/:id` — update status (owner can confirm/cancel; tenant can 
  cancel their own pending/confirmed booking).

Constraints:
- Follow existing error-handling and response-shape conventions from other routes in 
  the project.
- Add basic validation: slots must be in the future, slotEnd > slotStart, booking 
  must align with an existing availability slot.

Verify by: using the existing API client/Postman setup (or a quick test script) to 
create availability for a property, fetch computed slots, create a booking, confirm a 
double-booking attempt on the same slot is rejected, and fetch /api/bookings/me as 
both the owner and the tenant.
```

---

## Prompt 2 — Owner Availability Settings UI

```
Add an "Availability" management UI for property owners.

Create /client/src/components/scheduling/AvailabilityEditor.jsx and add it as a new 
section/tab on the property management view (likely within the owner's dashboard, 
e.g. /client/src/pages/Dashboard.jsx or a per-property edit page — find where owners 
currently manage their listings).

UI requirements:
- A weekly template grid: rows for each day of the week, allowing the owner to toggle 
  a day "on" and set a start time, end time, and slot duration (15/30/60 min dropdown) 
  for that day. Use the upgraded Card/Input/Select components and rt-sys tokens.
- A simple list/calendar of upcoming date-specific overrides (e.g. "Block Dec 25" or 
  "Add extra slots on Dec 31, 6-9pm") with add/remove controls.
- A live preview panel showing the next 7 days of computed available slots as a 
  read-only list/grid, so the owner can sanity-check their settings (call 
  `GET /api/properties/:id/availability` and render the result).
- Save button that calls `POST /api/properties/:id/availability`, with a success toast.

Constraints:
- This UI should be reachable only by the property's owner (check existing 
  role/ownership guards used elsewhere in the dashboard).
- Keep the weekly template simple — no need for per-slot custom pricing or complex 
  recurrence rules beyond weekly + date overrides.

Verify by: as a property owner, setting weekly availability (e.g. Mon-Fri 10am-6pm, 
30-min slots), adding one date override, saving, and confirming the preview panel 
shows the correct expanded slots for the next 7 days.
```

---

## Prompt 3 — Tenant-Facing Booking Widget on Property Detail Pages

```
Add a "Schedule a Visit" widget to /client/src/pages/RentPropertyDetail.jsx and 
/client/src/pages/BuyPropertyDetail.jsx (place it near the contact/message section, 
using the glass Card variant consistent with the EMI calculator from Batch 1).

Create /client/src/components/scheduling/BookingWidget.jsx:
- On mount, fetch `GET /api/properties/:id/availability` and display a horizontal 
  date picker (next 14 days, scrollable chips showing day + date) and, below it, a 
  grid of available time slot buttons for the selected date.
- If no slots are available for a date, show "No slots available this day" and 
  highlight the date chip as disabled/greyed.
- Selecting a time slot and clicking "Request Visit" opens a confirmation Dialog: 
  shows the chosen date/time, an optional notes textarea ("Add a note for the owner — 
  optional"), and a "Confirm Booking" button.
- On confirm, call `POST /api/properties/:id/bookings`. On success, show a success 
  state within the widget ("Visit requested for [date/time] — you'll be notified once 
  the owner confirms") and replace the widget's interactive state with this 
  confirmation (don't allow double-booking the same property from the same widget 
  instance without refresh).
- If the user isn't logged in, clicking any slot should redirect to /login with a 
  return URL back to this property page (match existing auth-redirect patterns in the 
  codebase).

Constraints:
- Handle the loading state with the `.skeleton-wave` utility while availability is 
  being fetched.
- If a property has zero availability configured at all (owner hasn't set it up), 
  hide the widget entirely or show a fallback "Contact owner to arrange a visit" 
  message linking to the chat/contact form instead.

Verify by: as a tenant, viewing a property with availability configured, selecting a 
date and time slot, submitting a booking request with a note, and confirming the 
success state appears and the booking shows up via `GET /api/bookings/me`.
```

---

## Prompt 4 — Chat Integration: Visit Booking Messages

```
Integrate the booking flow with the chat system from Batch 3:

- Extend the message schema (from Batch 3, Prompt 2's attachment field pattern) to 
  support a new message type: `type: "booking_request" | "booking_update"`, with a 
  payload referencing the `VisitBooking` id, property summary (thumbnail, title), and 
  date/time.
- When a tenant submits a booking request (Prompt 3), automatically send a structured 
  message into the conversation between the tenant and the property owner (create the 
  conversation if it doesn't exist yet, reusing whatever "start conversation" logic 
  exists from the property detail page's "Message Owner" button).
- In /client/src/components/messaging/MessageBubble.jsx, add a rendering branch for 
  `booking_request` messages: a card showing the property thumbnail, requested 
  date/time, the tenant's note (if any), and — if the viewer is the owner and the 
  booking is still "pending" — two inline buttons: "Confirm" and "Decline".
- Clicking Confirm/Decline calls `PATCH /api/bookings/:id` with the new status, then 
  sends a follow-up `booking_update` message in the same conversation 
  (auto-generated text: "Visit confirmed for [date/time]" or "Visit request declined"), 
  rendered as a simpler status card (no buttons) for both participants.
- If the tenant cancels their own booking later (from their dashboard, Prompt 5), also 
  send a `booking_update` message to the conversation.

Constraints:
- Reuse the existing Socket.IO message emission so these structured messages appear in 
  real time, just like regular chat messages.
- Ensure `booking_request`/`booking_update` messages are excluded from any "unread 
  count" logic if that would be confusing, OR included consistently — pick whichever 
  matches how attachment messages (Batch 3) are currently counted, for consistency.

Verify by: as a tenant, booking a visit on a property with no prior conversation with 
that owner — confirm a new conversation is created with a booking_request card; then 
as the owner, clicking "Confirm" in that card and confirming both sides see the 
updated status card.
```

---

## Prompt 5 — Booking Management Views (Dashboard)

```
Add booking management views for both roles:

Tenant view — create /client/src/components/scheduling/MyVisits.jsx and add it as a 
new tab/section in the tenant's dashboard (e.g. /client/src/pages/Dashboard.jsx):
- List upcoming bookings (status pending/confirmed) as cards: property thumbnail, 
  title, date/time, status badge (pending = warning/amber token, confirmed = success 
  token), and a "Cancel" button (with confirmation Dialog) for pending/confirmed 
  bookings.
- A collapsed/secondary section for past bookings (status completed/cancelled), shown 
  with muted styling.

Owner view — create /client/src/components/scheduling/IncomingVisits.jsx and add it as 
a new tab/section in the owner's dashboard:
- List incoming booking requests grouped by property, sorted by date/time, with 
  Confirm/Decline buttons for pending requests (same action as the chat card from 
  Prompt 4 — calling the same `PATCH /api/bookings/:id` endpoint, so confirming here 
  also triggers the chat status message).
- A simple weekly calendar view (use a lightweight calendar grid component — check if 
  one already exists in the project for the admin analytics date pickers before adding 
  a new dependency) showing confirmed visits as blocks across the week, with a 
  property name + tenant name on hover/click.

Constraints:
- Both views call `GET /api/bookings/me` and filter/group client-side by role and 
  status — no new backend endpoints needed beyond what Prompt 1 created.
- Status badges and calendar blocks should use the rt-sys success/warning/destructive 
  tokens consistently with badges used elsewhere in the app (check existing Badge 
  component usage for consistency).

Verify by: as a tenant, viewing "My Visits" with at least one pending and one past 
booking; as an owner, viewing "Incoming Visits", confirming a pending request from 
this view, and seeing it move to the confirmed section and appear on the weekly 
calendar.
```

---

## Prompt 6 — Reminders, Notifications & Polish

```
Finish the scheduler with notification touches and final polish:

- If the project has an existing notification system (in-app notification bell, email, 
  or push — check for a Notification model/component before adding anything new), hook 
  into it to send notifications for: new booking request (to owner), booking 
  confirmed/declined (to tenant), and a reminder ~1 hour before a confirmed visit (to 
  both parties) — implement only the channels that already exist in the codebase; do 
  not introduce a new email/push service from scratch in this task.
- Add the booking widget's "Request Visit" button and the dashboard "Incoming 
  Visits"/"My Visits" tabs to the global motion utilities (`.animate-page-enter` for 
  tab content, `.hover-pop` for booking cards) for consistency with the rest of the 
  app.
- Accessibility: ensure date chips and time slot buttons in BookingWidget.jsx are 
  keyboard-navigable (arrow keys or Tab between them) and have clear `aria-label`s 
  (e.g. "Tuesday, June 16, 2026, 10:30 AM — available"), and that the confirmation 
  Dialog traps focus.
- Responsive check: confirm BookingWidget.jsx's date chip row scrolls horizontally 
  cleanly on mobile (no layout overflow), and that IncomingVisits' weekly calendar 
  collapses to a vertical day-by-day list on small screens.

Verify by: triggering each notification scenario (if a notification system exists) and 
confirming it fires correctly; then testing the full booking flow end-to-end on a 
375px viewport using keyboard navigation only.
```

---

## After Batch 5

Remaining items from the gap analysis roadmap:
- **Batch 6 — Neighborhood Analytics Widget**: walk score / nearby amenities on 
  property detail pages (Polish & Delight tier).
- **Batch 7 — Document Vault & Lease Drafting** (Long-Term).
- **Batch 8 — Virtual 3D Tour Embeds** (Long-Term).

Let me know once Batch 5 is verified and I'll write Batch 6 — the neighborhood 
analytics widget.
