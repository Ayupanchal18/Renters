# Renters Mobile (React Native) — Porting Plan for Batches 1-8

You're on a shared monorepo with some shared logic/types between web and RN. That 
changes the strategy significantly: instead of "redo everything in RN," the first 
job is to **maximize what moves into a shared package** (tokens, types, API/data 
hooks, business logic) so each feature port is mostly "build a native UI shell around 
logic that already exists."

This document is structured as:
- **RN Batch 0** — Shared foundation (do this first, before any feature porting)
- **RN Batches 1-8** — mirror your web batches, each with a per-feature 
  implementation strategy (native / WebView / hybrid) and atomic prompts

---

## Web-Specific Feature Decision Table

Here's the case-by-case call for the tricky ones, with reasoning. Each is referenced 
in its relevant batch below.

| Feature (Web origin) | RN Approach | Reasoning |
| :--- | :--- | :--- |
| Leaflet maps (PropertyMap, NeighborhoodMap) | **Native** — `react-native-maps` | Maps are core, high-frequency UX. WebView maps feel sluggish and break gesture handling (pinch, cluster taps). Worth the native investment. |
| Marker clustering | **Native** — `react-native-map-clustering` | Pairs directly with react-native-maps, similar API shape to web clustering logic. |
| Map-based geotag picker (Batch 4) | **Native** — same `react-native-maps`, draggable marker | Same justification as above; also needed for camera/GPS "use my current location" which is a natural mobile-first improvement. |
| Drag-drop file upload (Photos step, Vault) | **Native** — `expo-image-picker` / `react-native-document-picker` + manual reorder via press-and-hold drag | Drag-and-drop web pattern doesn't map 1:1, but RN has better native equivalents (camera roll picker, long-press reorder) that feel more "at home" on mobile than a WebView upload widget. |
| Image cropping (Batch 4) | **Native** — `react-native-image-crop-picker` (has built-in crop UI) | Native crop UI is standard on mobile (matches OS photo picker conventions) and is actually less work than porting react-easy-crop's canvas logic. |
| Signature pad (Batch 7) | **Native** — `react-native-signature-canvas` (wraps a WebView internally but exposes a clean RN API) | This library is the de facto standard, handles touch input correctly, and the integration code is RN-native even though it uses a WebView under the hood. |
| Matterport / iframe 3D tour embed (Batch 8) | **WebView** — `react-native-webview` | This is exactly what WebViews are for: a third-party iframe-based embed with its own JS. No value in reimplementing natively. |
| 360° Panorama viewer (Batch 8) | **WebView** — wrap pannellum/photo-sphere-viewer HTML in a local WebView bundle | A true native WebGL panorama viewer is a big lift (three.js + RN bridge). A WebView loading a small bundled HTML/JS panorama viewer is dramatically less work and gives an identical result. |
| Video walkthrough embed (Batch 8) | **Native** — `expo-av` / `react-native-video` for self-hosted; **WebView** fallback for YouTube/Vimeo embeds if no native SDK | Native player for owned video files (better perf/controls); YouTube/Vimeo embeds are simplest via WebView unless you add their native SDKs. |
| Lease document preview (Batch 7) | **Native** — render the same structured data as RN `View`/`Text` components (no canvas/HTML needed) | The lease preview is just structured text/data — straightforward to re-render natively, no need for WebView. |
| Lease PDF download/view | **Native** — `expo-file-system` + `expo-sharing` to download and open/share the PDF the backend already generates | Backend already produces the PDF (Batch 7); RN just needs to fetch + open/share it. |
| EMI Calculator pie chart (Batch 1) | **Native** — `react-native-svg` + `victory-native` or `react-native-gifted-charts` | Charts are common in RN; pick whichever charting library is already a dependency if one exists, otherwise gifted-charts is lightweight. |
| Recharts (Admin Analytics) | **Out of scope for RN** unless your app has an admin section | Most "Renters" mobile apps target tenants/owners, not admins. Confirm whether admin screens exist in the RN app before porting Batch 1's chart-theme-sync task. |

---

# RN Batch 0 — Shared Foundation (Do This First)

This batch extracts everything reusable into a shared package so every later batch 
references it instead of duplicating logic.

## Prompt 0.1 — Audit & Extract Shared Package Structure

```
This is a shared monorepo containing a web client and a React Native app. Audit the 
repo structure first and report back (as a markdown file at /docs/rn-port/00-shared-
audit.md) before making changes:

- Identify the monorepo tool in use (Turborepo, Nx, Yarn/PNPM workspaces, etc.) and 
  the current package layout (e.g. /apps/web, /apps/mobile, /packages/*).
- Identify what, if anything, is ALREADY shared between web and mobile (types, API 
  client, validation schemas, constants).
- List which pieces of logic from the web client (added in Batches 1-8) are 
  framework-agnostic and could move into a shared package right now:
  - API client functions / React Query hooks (e.g. useProperties, useBookings, 
    useNeighborhood, useLeases, useVaultDocuments)
  - Validation schemas (Zod/Yup) for forms (post-property, lease terms, etc.)
  - Business logic: EMI calculation function (Batch 1), walkability score formula 
    references (Batch 6 — note this is server-side, just confirm), booking slot 
    expansion logic if duplicated client-side, distance/Haversine helpers
  - TypeScript types/interfaces for Property, VisitBooking, VaultDocument, LeaseDraft, 
    VirtualTour, Message, Conversation, etc.
  - Constants: quick-reply chat templates (Batch 3), property categories/filters, 
    design token VALUES (not the CSS — the raw color/spacing values as a JS object)

Do not move anything yet — just produce the audit report listing exact current file 
paths and a proposed target structure (e.g. /packages/shared-core/{api,types,hooks,
constants,utils}).

Verify by reviewing the report for accuracy before proceeding to Prompt 0.2.
```

## Prompt 0.2 — Create/Extend Shared Package & Migrate Logic

```
Based on /docs/rn-port/00-shared-audit.md, create (or extend, if one already exists) 
a shared package — e.g. /packages/shared-core — and move the identified 
framework-agnostic pieces into it:

- /packages/shared-core/types/ — all TS interfaces/types listed in the audit
- /packages/shared-core/api/ — API client functions (fetch wrappers / React Query 
  hooks), parameterized so they work with either web or RN's storage for auth tokens 
  (accept a token-getter function or use a shared auth context interface)
- /packages/shared-core/utils/ — EMI calculation, Haversine distance, slot-expansion 
  logic, URL/embed validation helpers (Matterport domain allowlist from Batch 8, etc.)
- /packages/shared-core/constants/ — chat templates, filter options, design token 
  raw values

Update the web client's imports to use the shared package instead of its local 
copies, run the web build, and confirm nothing breaks (this is a refactor with zero 
visual/behavioral change on web).

Do NOT touch the RN app in this task — this prompt only consolidates shared logic and 
re-points the web app at it.

Verify by: running the web app's build and test suite (if tests exist), and spot-
checking a few pages (property detail with EMI calculator, booking widget, messages) 
to confirm identical behavior to before.
```

## Prompt 0.3 — RN Design Token Bridge

```
Create /packages/shared-core/theme/tokens.ts (or .js) containing the same color, 
spacing, radius, typography, and shadow VALUES defined as --rt-sys-* CSS variables in 
the web client's global.css (Batch 1, Prompt 1) — but as plain JS objects with light 
and dark variants, e.g.:

export const colors = {
  light: { primary: '#...', secondary: '#...', success: '#...', warning: '#...', 
  destructive: '#...', background: '#...', card: '#...', muted: '#...', 
  mutedForeground: '#...', border: '#...' },
  dark: { ...same keys, dark values... }
};
export const radius = { sm: 6, md: 10, lg: 14, xl: 20 }; // as numbers (px) for RN
export const spacing = { sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 };
export const typography = { sm: 13, base: 15, lg: 18, xl: 22, '2xl': 28 }; // RN font 
sizes don't support clamp(), so pick sensible static values per breakpoint or use a 
responsive scaling utility if one already exists in the RN app (e.g. react-native-
size-matters)

In the RN app, set up a ThemeProvider (or extend an existing one) that reads the 
device color scheme (useColorScheme from react-native) and provides the matching 
token set from this shared file to all screens via context, with the same manual 
override capability as web (a theme toggle in settings, if the web app has one).

Verify by: in the RN app, creating a small test screen that renders a few Views/Text 
using these tokens, confirming colors match the web app's light/dark palettes, and 
toggling the device theme updates the RN screen correctly.
```

## Prompt 0.4 — RN Component Library Foundation

```
Create a shared RN UI component set at /apps/mobile/src/components/ui/ (or wherever 
RN components live — check existing structure) mirroring the upgraded web components 
from Batch 1, Prompt 3, using the tokens from Prompt 0.3:

- Button.tsx — variants: primary, secondary, outline, ghost, destructive. Use 
  `Pressable` with `style` function for press-state opacity/scale feedback 
  (equivalent to web's active:scale-95).
- Card.tsx — supports a `glass` variant using `expo-blur`'s BlurView (if Expo) or a 
  semi-transparent background + border as a fallback if not using Expo/BlurView isn't 
  available.
- Input.tsx, Select.tsx (or Picker wrapper) — styled with tokens, clear focus/active 
  border color change.
- Badge.tsx — for status badges (pending/confirmed/verified etc.) using success/
  warning/destructive token colors, matching web Batch 5/7 badge usage.
- SkeletonLoader.tsx — equivalent to web's `.skeleton-wave`, using a simple opacity-
  pulse Animated.View loop (respect reduced-motion via 
  AccessibilityInfo.isReduceMotionEnabled).

These should be the building blocks every later RN batch prompt references — keep 
prop signatures simple and consistent (variant, size, onPress, disabled, etc.).

Verify by: building a small showcase screen rendering each component in both light 
and dark mode, confirming visual consistency with the web component library's look 
and feel (not pixel-identical, but clearly "the same design language").
```

---

# RN Batch 1 — Tokens, Components, Charts, EMI Calculator, Motion

Mirrors web Batch 1. Tokens and components are mostly covered by RN Batch 0 
(Prompts 0.3-0.4). This batch covers the remaining items: chart theme sync and the 
EMI calculator.

## Prompt 1.1 — EMI Calculator Screen/Component

```
Using the EMI calculation function moved to /packages/shared-core/utils/ in Prompt 
0.2, create /apps/mobile/src/components/EmiCalculator.tsx:

- Inputs: Property Price (pre-filled from the property's price prop), Down Payment 
  (toggle between % and amount using a segmented control), Loan Tenure (use a 
  Slider — `@react-native-community/slider` — 5-30 years), Interest Rate (numeric 
  input, default 8.5).
- Output: Monthly EMI (large text, primary color), Total Interest, Total Payable — 
  update live via useState/useEffect on input change, calling the shared EMI function.
- Add a Principal vs Interest pie chart using whichever RN charting library is already 
  a dependency (check package.json — react-native-gifted-charts, victory-native, or 
  react-native-svg-charts); if none exists, add react-native-gifted-charts (lightweight, 
  no extra native linking beyond standard Expo/RN setup).
- Use Card (glass variant) and Input/Slider components from RN Batch 0.

Add this component to the property detail screen for "buy" type properties, below 
the price section.

Verify by: navigating to a buy-property detail screen, confirming the calculator 
renders with the price pre-filled, and that changing inputs updates the EMI value and 
pie chart instantly.
```

## Prompt 1.2 — Theme-Aware Chart Colors (If Admin/Analytics Screens Exist)

```
First, check if the RN app has any admin/analytics screens (search for "Analytics", 
"Dashboard" screens with charts). If NONE exist, skip this task entirely and note that 
in /docs/rn-port/01-notes.md — do not build new analytics screens as part of this port.

If chart screens DO exist, update them to read colors from the shared theme tokens 
(Prompt 0.3) for grid lines, axis labels, and tooltips, re-rendering when the device/
app theme changes — same goal as web Batch 1 Prompt 4, applied to whichever RN chart 
library is in use.

Verify by: toggling the app's theme and confirming chart colors update without 
requiring a screen remount.
```

## Prompt 1.3 — Page Transition & Press Feedback Motion

```
Using `react-native-reanimated` (check if already installed; add if not — it's 
standard for RN animations) and respecting `AccessibilityInfo.isReduceMotionEnabled`:

- Add a shared screen-transition wrapper (or configure React Navigation's screen 
  options) so screen pushes use a subtle fade+slide transition, mirroring web's 
  `.animate-page-enter` (Batch 1, Prompt 6).
- Add a reusable `AnimatedPressable` component (wrapping Pressable with a scale-down 
  animation on press, mirroring `active:scale-95`) and use it for primary CTAs across 
  the app (property card taps, booking buttons, send-message button).
- Apply a subtle "pop" animation (scale to ~1.02 + shadow) on PropertyCard press-in/
  press-out, mirroring web's `.hover-pop` (hover doesn't exist on touch, so use 
  press-in/out instead).

Verify by: navigating between screens (transition visible), pressing buttons and 
property cards (scale feedback visible), and enabling "Reduce Motion" in OS 
accessibility settings to confirm transitions/animations are minimized or skipped.
```

---

# RN Batch 2 — Listings & Map (Native Maps + Clustering)

This is the biggest native investment. Per the decision table: `react-native-maps` + 
`react-native-map-clustering`, with a split/toggle layout instead of web's sticky 
side-by-side (screen real estate doesn't allow true side-by-side on phones).

## Prompt 2.1 — Native PropertyMap Component with Clustering

```
Using /packages/shared-core/types Property type and the same listing data already 
fetched via the shared API hooks (Prompt 0.2), create 
/apps/mobile/src/components/PropertyMap.tsx:

- Install `react-native-maps` and `react-native-map-clustering` (or 
  `react-native-clusterer` if better-maintained at time of implementation — check 
  current maintenance status before choosing).
- Render a MapView with clustered markers for the provided `listings` array (each 
  with `coordinates: {lat, lng}` from Batch 4's geotag picker, already in the shared 
  Property type).
- Custom marker rendering: a small price-tag-style marker (rounded pill showing the 
  property's price, using primary color background) for individual markers; cluster 
  markers show a count in a circular badge using the same primary color.
- Accept `activeListingId` and `onMarkerPress(listingId)` props matching the web 
  component's API shape from Batch 2 Prompt 1, for consistency when shared logic is 
  later extracted.
- On marker press, animate the map region to center on that marker (`animateToRegion`).

Verify by: rendering the map screen with 20+ listings in a dense area, confirming 
clusters form and expand on zoom, and that tapping a marker centers the map and fires 
onMarkerPress.
```

## Prompt 2.2 — List/Map Toggle Layout (Mobile-Appropriate Split)

```
Create the listings screen layout at /apps/mobile/src/screens/RentListings.tsx (and 
mirror for BuyListings.tsx):

- Default view: a scrollable FlatList of PropertyCard components (port the card 
  design from web using RN Card/Badge components from Batch 0/RN Batch 1).
- A floating "Map" toggle button (bottom-center, glass-styled, using the Card glass 
  variant) that switches the screen to full-screen map mode using the PropertyMap 
  component from Prompt 2.1.
- In map mode, show a floating "List" toggle button to switch back, and render a 
  horizontally-scrollable card carousel docked at the bottom of the map (one card per 
  visible/clustered listing) — tapping a map marker scrolls this carousel to the 
  corresponding card (mirrors web's bidirectional highlight from Batch 2 Prompt 3, 
  adapted to a carousel pattern for touch).
- Persist the user's last-used view (list/map) per session using local state (no 
  need for persistence across app restarts).

Constraints:
- Reuse the shared API hooks for fetching listings (Prompt 0.2) — do not duplicate 
  fetch logic.

Verify by: switching between list and map views, confirming the bottom carousel in 
map mode syncs with marker taps, and that scrolling the carousel pans/highlights the 
corresponding marker.
```

## Prompt 2.3 — Filter Bottom Sheet

```
Create /apps/mobile/src/components/FilterBottomSheet.tsx using 
`@gorhom/bottom-sheet` (check if already installed; it's the standard for RN bottom 
sheets):

- Mirrors web Batch 2 Prompt 4's filter controls: BHK pill toggles, category pills, 
  budget range slider (using `@react-native-community/slider` as a dual-range if 
  available, or two sliders for min/max), sort options as a segmented control or radio 
  list.
- Triggered by a "Filters" button on the listings screen (badge showing active filter 
  count).
- "Clear all" button appears when filters are active.
- Use the same filter state shape as the shared API hooks expect (from Prompt 0.2) so 
  filtering reuses existing query logic.

Verify by: opening the filter sheet, applying BHK/budget/category filters, confirming 
the listings list/map updates accordingly, and that "Clear all" resets everything.
```

## Prompt 2.4 — Loading, Empty States & Accessibility

```
Mirror web Batch 2 Prompts 5-6 for RN:

- Loading: use the SkeletonLoader component (RN Batch 0) for property card 
  placeholders while listings load; show a loading overlay on the map if map data is 
  loading.
- Empty state: if filters return zero results, show an icon + "No properties match 
  your filters" + "Clear filters" button in the list view; in map view, keep the map 
  centered on the searched area with no markers.
- Accessibility: ensure PropertyCard is a single accessible element 
  (`accessible={true}`, `accessibilityRole="button"`, `accessibilityLabel` describing 
  the property), announce result counts via `AccessibilityInfo.announceForAccessibility` 
  when filters change, and ensure the map/list toggle buttons have clear 
  accessibility labels.

Verify by: testing with throttled network (skeletons appear), testing a zero-result 
filter combination, and using a screen reader (VoiceOver/TalkBack) to navigate the 
listings screen.
```

---

# RN Batch 3 — Messages / Chat

Mostly native-friendly — RN has good primitives for chat UIs. File sharing uses 
native pickers instead of drag-drop.

## Prompt 3.1 — Chat Screen Components

```
Using the shared Message/Conversation types and Socket.IO client (check if 
socket.io-client is already used in the RN app, or if a different real-time mechanism 
exists — match whatever's already there), create:

- /apps/mobile/src/components/chat/ConversationListItem.tsx — avatar, name, last 
  message preview, timestamp, unread badge, online status dot.
- /apps/mobile/src/components/chat/MessageBubble.tsx — sent (primary bg, right-
  aligned) vs received (muted/glass bg, left-aligned), using RN Batch 0 tokens, with 
  the same "tail corner" rounding approach as web Batch 3 Prompt 1.
- /apps/mobile/src/components/chat/MessageComposer.tsx — text input (auto-growing), 
  send button (AnimatedPressable from RN Batch 1), attachment button (camera/paperclip 
  icon).

Use a `FlatList` (inverted) for the message thread for performance with long 
histories.

Verify by: rendering a conversation screen with sample messages, confirming bubble 
styling matches the design language from RN Batch 0/1, and that the list is inverted 
correctly (newest at bottom, scrolls up for history).
```

## Prompt 3.2 — Native File/Image Attachments

```
Add attachment support to MessageComposer.tsx:

- Attachment button opens an action sheet (use `@expo/react-native-action-sheet` or 
  a simple Modal with options) offering: "Take Photo" (camera), "Choose Photo" 
  (gallery via `expo-image-picker`), "Choose Document" (via 
  `expo-document-picker` or `react-native-document-picker`).
- On selection, show a preview chip above the composer (thumbnail for images, 
  filename+icon for documents) with a remove option before sending.
- Reuse the `POST /api/conversations/:id/attachments` endpoint from web Batch 3 
  Prompt 2 (already built — confirm the endpoint accepts multipart uploads from RN's 
  fetch/FormData the same way).
- In MessageBubble.tsx, render image attachments as a tappable thumbnail opening a 
  full-screen image viewer (use `react-native-image-viewing` or similar for 
  pinch-zoom), and document attachments as a card with a "Download/Open" action using 
  `expo-file-system` + `expo-sharing` or `Linking.openURL` for the file URL.

Verify by: sending a photo (camera and gallery) and a PDF from the RN app, confirming 
they appear correctly in the web app's chat (Batch 3) and vice versa, and that tapping 
an image opens the full-screen pinch-zoom viewer.
```

## Prompt 3.3 — Property Share Cards, Templates, Presence & Booking Cards

```
Port the remaining chat features from web Batch 3 (Prompts 3-4) and Batch 5 (Prompt 4) 
to RN:

- Property share cards: when a message contains a property URL/reference (same 
  detection logic, ideally moved to /packages/shared-core/utils in a follow-up), 
  render MessageBubble.tsx with a rich card (thumbnail, title, price, "View Listing" 
  button navigating to the property detail screen).
- Quick reply templates: a "Templates" button opening a Modal/ActionSheet with the 
  same template list from shared constants (Prompt 0.2), inserting the chosen text 
  into the composer.
- Presence: online status dot on ConversationListItem (Prompt 3.1), typing indicator 
  (animated dots) in the thread, read receipts (single/double check icons) — using 
  the same Socket.IO events as web Batch 3 Prompt 4.
- Booking request/update cards (web Batch 5 Prompt 4): render `booking_request` 
  messages as a card with property thumbnail, date/time, and Confirm/Decline buttons 
  for owners; `booking_update` as a simpler status card.

Verify by: testing each message type (text, image, document, property share, 
template-sent text, booking request/update, typing indicator, read receipts) between 
an RN client and a web client in the same conversation.
```

## Prompt 3.4 — Navigation, Empty States & Accessibility

```
Mirror web Batch 3 Prompts 5-6 for RN:

- Conversation list screen → tapping a conversation navigates to a dedicated thread 
  screen (React Navigation stack push) with a back button — natural RN pattern, no 
  toggle needed like web's mobile view.
- Deep-link support: ensure "Message Owner" from a property detail screen navigates 
  directly to (or creates) the relevant conversation thread.
- Empty states: no conversations yet → icon + "No conversations yet" + CTA to browse 
  listings; thread loading → skeleton message bubbles.
- "New message" pill when scrolled up and a new message arrives (don't auto-scroll).
- Accessibility: composer send/attachment buttons have accessibilityLabel; new 
  messages trigger `AccessibilityInfo.announceForAccessibility`.
- Connection-lost banner using the same pattern as web (top banner, warning token 
  color, auto-dismiss on reconnect).

Verify by: testing navigation flows (list → thread → back, deep link from property), 
viewing empty states as a new user, and toggling airplane mode briefly to test the 
reconnect banner.
```

---

# RN Batch 4 — Post Property Wizard (Native Pickers & Cropping)

Per the decision table: native image picker + native crop UI replaces drag-drop + 
react-easy-crop. Native maps replace Leaflet for the geotag picker.

## Prompt 4.1 — Wizard Shell & Steps

```
Create /apps/mobile/src/screens/PostProperty/ as a stack of step screens (or a single 
screen with step state + a progress header) mirroring web Batch 4 Prompt 1's six 
steps: Basic Info, Location, Details & Amenities, Photos, Pricing, Review & Submit.

- Top of screen: a compact progress indicator ("Step 2 of 6: Location") with a thin 
  progress bar, using primary color.
- Bottom: sticky Back/Next/Submit button bar (use `KeyboardAvoidingView` so it stays 
  above the on-screen keyboard).
- Use the same shared form state shape and validation schemas from 
  /packages/shared-core (Prompt 0.2) so submission payloads match the web app exactly.
- Step transitions use the screen-transition pattern from RN Batch 1 Prompt 1.3 
  (slide right on Next, slide left on Back).

Verify by: walking through all 6 steps with valid data, confirming the submitted 
payload matches the shape expected by the existing property-creation API (same 
endpoint used by web).
```

## Prompt 4.2 — Native Photo Picker, Reordering & Cropping

```
Build the Photos step (/apps/mobile/src/screens/PostProperty/PhotosStep.tsx):

- "Add Photos" button opens an action sheet: "Take Photo" (camera) or "Choose from 
  Library" (multi-select gallery) via `expo-image-picker`.
- Each selected photo opens `react-native-image-crop-picker`'s built-in crop UI 
  (4:3 default, with rotate) — OR, if the user prefers to skip cropping, allow 
  "Use Original" (check the picker library's API for a skip option, or add a "Skip 
  crop" button in your own wrapper).
- Display photos as a grid of thumbnails. Implement reordering via long-press + drag 
  using `react-native-draggable-flatlist` (handles touch-based drag reordering well 
  on mobile, equivalent to dnd-kit on web).
- First photo = "Cover" (badge shown); tap-and-hold menu or a small star icon on each 
  thumbnail to set as cover (moves to position 1).
- Upload each photo to the same backend endpoint as web (Batch 4 Prompt 2), with 
  per-file progress indicators on thumbnails, sending the same `order`/`isCover` 
  metadata.

Verify by: adding photos via camera and gallery, cropping at least one, reordering via 
long-press drag, setting a different cover photo, and confirming the final payload's 
photo order/cover flag matches what's shown in the UI.
```

## Prompt 4.3 — Native Map Geotag Picker with GPS

```
Build the Location step's map picker 
(/apps/mobile/src/screens/PostProperty/LocationStep.tsx):

- Address text inputs (same fields as web).
- Address autosuggest: reuse whatever geocoding approach was decided for web Batch 4 
  Prompt 4 (Nominatim or a paid provider) via the shared API layer.
- A `react-native-maps` MapView with a single draggable marker, defaulting to the 
  device's current location if permission is granted 
  (`expo-location.getCurrentPositionAsync`) and no address has been entered yet — a 
  mobile-native improvement over web's address-first flow.
- Selecting an autosuggest result OR pressing "Use My Location" moves the map + marker. 
  Dragging the marker updates `coordinates` in form state (same shared shape as web).
- Reverse-geocode the final marker position for a supplementary "Pinned location" 
  text display, without overwriting the typed address fields (same rule as web).

Constraints:
- Request location permission with a clear rationale prompt 
  ("Renters needs your location to help set the property's map pin accurately") and 
  handle permission-denied gracefully (map still works via manual search/drag, just 
  no auto-center on current location).

Verify by: granting location permission and confirming the map centers on the current 
location by default, searching/selecting an address to reposition it, dragging the 
marker, and confirming the submitted coordinates match what's shown on the map.
```

## Prompt 4.4 — Details, Pricing, Review & Draft Persistence

```
Build the remaining steps:

- DetailsStep.tsx / PricingStep.tsx: straightforward form fields using RN Batch 0's 
  Input/Select/Slider components, same fields and validation as web (shared schemas 
  from Prompt 0.2).
- ReviewStep.tsx: read-only summary grouped by step (with "Edit" links jumping back), 
  including a small static map preview image for location (use 
  `react-native-maps`'s `MapView` with `scrollEnabled={false}` and a fixed region, or 
  a static map image API if simpler) and a photo grid preview.
- Draft persistence: use `@react-native-async-storage/async-storage` (RN's 
  localStorage equivalent) to auto-save form state, scoped per logged-in user. On 
  screen mount, check for an existing draft and show a confirm dialog ("Resume your 
  draft from [date]?") — mirrors web Batch 4 Prompt 5.
- "Publish" and "Save as Draft" buttons calling the same endpoints as web.

Verify by: filling out the remaining steps, force-closing and reopening the app, 
confirming the draft-resume prompt appears and restores state, then publishing and 
confirming the draft is cleared from AsyncStorage.
```

---

# RN Batch 5 — Visit Booking Scheduler

Backend (web Batch 5 Prompt 1) is already shared/reusable — RN just needs UI. Calendar 
UI uses a native date picker + RN calendar library.

## Prompt 5.1 — Booking Widget on Property Detail Screen

```
Using the shared API hooks for `/api/properties/:id/availability` and 
`/api/properties/:id/bookings` (from Prompt 0.2), create 
/apps/mobile/src/components/BookingWidget.tsx:

- A horizontally-scrollable date chip row (next 14 days) using the RN Batch 0 design 
  tokens — selected date highlighted with primary background.
- Below it, a wrap-grid of time slot buttons for the selected date (disabled/greyed if 
  none available for that day).
- Selecting a slot + "Request Visit" opens a Modal (bottom sheet via @gorhom/bottom-
  sheet, consistent with RN Batch 2's filter sheet) with date/time confirmation, an 
  optional notes TextInput, and "Confirm Booking" button calling the booking endpoint.
- Success state replaces the widget content with a confirmation message, matching web 
  Batch 5 Prompt 3's behavior.
- If unauthenticated, tapping a slot navigates to the Login screen with a return 
  target back to this property.
- If no availability is configured, show the "Contact owner to arrange a visit" 
  fallback linking to the chat thread (RN Batch 3).

Verify by: as a tenant, selecting a date/slot, submitting a booking with a note, 
confirming the success state, and verifying the booking appears via the shared 
bookings hook (also visible on web's `/dashboard`).
```

## Prompt 5.2 — Owner Availability Editor

```
Create /apps/mobile/src/screens/AvailabilityEditor.tsx, accessible from the owner's 
property management screen:

- A weekly template list: each day of the week as a row with a toggle (on/off) and, 
  when on, start/end time pickers (use `@react-native-community/datetimepicker`) and 
  a slot-duration Select (15/30/60 min).
- A simple list of date-specific overrides with add/remove (date picker + time range).
- A "Preview next 7 days" section calling the same availability endpoint as web to 
  show computed slots.
- Save button calling `POST /api/properties/:id/availability` (same endpoint as web 
  Batch 5 Prompt 1).

Verify by: setting weekly availability and one override, saving, and confirming the 
preview matches what web Batch 5 Prompt 2's preview shows for the same property.
```

## Prompt 5.3 — My Visits / Incoming Visits Screens

```
Create two screens under /apps/mobile/src/screens/:

- MyVisits.tsx (tenant view): FlatList of booking cards (property thumbnail, date/
  time, status Badge) split into "Upcoming" and "Past" sections, with a "Cancel" 
  action (confirmation Modal) on upcoming pending/confirmed bookings.
- IncomingVisits.tsx (owner view): FlatList of incoming requests grouped by property, 
  with Confirm/Decline actions on pending requests (same `PATCH /api/bookings/:id` 
  endpoint as web — also triggers the chat status message from web Batch 5 Prompt 4, 
  which will appear in RN's chat too via Batch 3).
- For the owner's weekly calendar view (web Batch 5 Prompt 5), use 
  `react-native-calendars` (Agenda or Week view) to show confirmed visits — if this 
  feels like too much for a first pass, a simple day-grouped list is an acceptable 
  fallback; note which you chose.

Both screens use the shared `/api/bookings/me` hook (Prompt 0.2), filtering/grouping 
client-side by role exactly like web Batch 5 Prompt 5.

Verify by: as a tenant, viewing My Visits with upcoming/past bookings and cancelling 
one; as an owner, viewing Incoming Visits, confirming a request, and confirming it 
appears as confirmed (and that the linked chat conversation shows the status update 
message from RN Batch 3.3).
```

## Prompt 5.4 — Notifications & Accessibility

```
- If the RN app has push notifications configured (Expo Notifications or 
  react-native-push-notification — check before adding), wire up the same 
  notification events as web Batch 5 Prompt 6: new booking request, confirmed/declined, 
  and a ~1hr reminder. If no push infrastructure exists, note this as a follow-up 
  rather than building it from scratch.
- Accessibility: date chips and time slots have accessibilityLabel describing the 
  full date/time and availability ("Tuesday, June 16, available"); Modal/bottom sheets 
  trap focus appropriately for screen readers (test with VoiceOver/TalkBack).
- Respect reduced motion for any list/card animations introduced.

Verify by: testing push notification delivery if infrastructure exists, and navigating 
the full booking flow with VoiceOver/TalkBack enabled.
```

---

# RN Batch 6 — Neighborhood Analytics

Backend (web Batch 6 Prompt 1) is shared. RN needs gauge UI, amenities list, and a 
mini native map.

## Prompt 6.1 — Score Gauges & Amenities List

```
Using the shared `/api/properties/:id/neighborhood` hook, create:

- /apps/mobile/src/components/ScoreGauge.tsx — an SVG arc gauge (use `react-native-
  svg`) showing Walk Score / Transit Score, animated fill on mount using 
  `react-native-reanimated`, with the same color-band logic (destructive/warning/
  success) and qualitative labels as web Batch 6 Prompt 2.
- /apps/mobile/src/components/AmenitiesList.tsx — horizontally-scrollable category 
  pill tabs (Schools, Hospitals, Groceries, Restaurants, Parks, Transit) and a list of 
  amenity rows (icon, name, distance), defaulting to the category with the most 
  results, with "No [category] found" empty messaging.

Add both to the property detail screen in a collapsible "Neighborhood" section 
(collapsed by default on mobile, per web Batch 6 Prompt 3's mobile behavior).

If the API returns `available: false`, hide gauges/list and show "Neighborhood 
insights aren't available for this location yet."

Verify by: viewing a property's Neighborhood section, confirming gauges animate in, 
switching category tabs updates the amenities list, and testing a property with 
unavailable data shows the fallback message.
```

## Prompt 6.2 — Native Mini Map with Amenity Pins

```
Create /apps/mobile/src/components/NeighborhoodMap.tsx using `react-native-maps`:

- Small MapView (non-scroll-jacking — set appropriate height, e.g. 250px) centered on 
  the property with a distinct "home" marker.
- Render pins for the active amenity category from AmenitiesList.tsx (max 3-5 per 
  category, no clustering needed).
- Tapping an amenity row animates the map to that pin and shows its callout (name + 
  distance); tapping a pin shows the same callout.

Add a small "Data from OpenStreetMap" attribution text below the map.

Verify by: switching amenity categories and confirming map pins update, and tapping a 
row/pin shows the correct callout.
```

## Prompt 6.3 — Loading/Error States & Accessibility

```
- Loading: SkeletonLoader placeholders for gauges, tabs, list rows, and map area 
  (matching final dimensions).
- Error (network failure, not `available:false`): "Couldn't load neighborhood info — 
  Retry" button.
- Accessibility: ScoreGauge has accessibilityLabel with the full score description 
  ("Walk Score: 78 out of 100, Very Walkable"); category tabs use 
  accessibilityRole="tab" equivalents (accessibilityState={{selected: ...}}); 
  collapsible section header has accessibilityState={{expanded: ...}}.

Verify by: testing slow network (skeletons), simulated error (retry works), and 
VoiceOver/TalkBack navigation of the section.
```

---

# RN Batch 7 — Document Vault & Lease

Backend (web Batch 7) is fully shared/reusable. RN needs native document capture, 
native signature pad, and native PDF download/share.

## Prompt 7.1 — Document Vault Screen

```
Using shared `/api/vault/documents` hooks, create 
/apps/mobile/src/screens/DocumentVault.tsx:

- One card per document type (ID Proof, Address Proof, Income Proof, Reference 
  Letter, Other) showing current upload status (Badge: pending/verified/rejected, 
  with rejection reason shown on tap if rejected) and an "Upload"/"Replace" button.
- Upload button opens an action sheet: "Take Photo", "Choose from Library" 
  (`expo-image-picker`), or "Choose File" (`expo-document-picker` for PDFs).
- "View" opens the document via the signed-URL endpoint (Linking.openURL or an 
  in-app viewer for images/PDFs — `react-native-pdf` if a dedicated PDF viewer is 
  wanted, otherwise Linking to open in the device's default viewer is acceptable).
- "Delete" with confirmation, respecting the same pending/rejected-only rule as web.
- Info banner explaining verification benefits (same copy as web Batch 7 Prompt 2).
- At the top, show overall verification status: "✓ Verified" Badge or "X of 2 required 
  documents verified" progress text (same logic as web Prompt 3).

Verify by: uploading one document per category via camera/gallery/file picker, 
confirming pending status shows, viewing and deleting a pending document.
```

## Prompt 7.2 — Verified Badges Across the App

```
Using the shared `isVerified` field on user/property responses (already added to API 
in web Batch 7 Prompt 3), create /apps/mobile/src/components/VerifiedBadge.tsx (small 
checkmark icon + tooltip-on-press explanation, since RN has no hover) and add it 
alongside:

- Owner name on property detail screens
- Property cards in listings (small badge overlay on thumbnail)
- Conversation list items and chat thread header (RN Batch 3)

Verify by: testing with a verified test user — badge appears in all three locations; 
confirming it's absent for unverified users.
```

## Prompt 7.3 — Lease Draft View & Native Signature Pad

```
Using shared `/api/leases` hooks, create /apps/mobile/src/screens/LeaseDraft.tsx:

- For owners with status "draft": a form (rent, deposit, lease dates via 
  DateTimePicker, notice period, additional terms TextInput) pre-filled from the 
  property, plus a read-only preview rendered as styled Text/View blocks (mirroring 
  web's document-like preview layout from Batch 7 Prompt 4) and a "Send to Tenant" 
  button.
- For both parties once status is "sent": read-only preview + a status timeline 
  (Draft → Sent → Signed by Tenant → Signed by Owner → Completed) as a horizontal 
  stepper using primary/success tokens.
- Signature capture: integrate `react-native-signature-canvas` in a Modal — "Clear" 
  and "Save Signature" buttons, converting to base64 PNG and POSTing to 
  `/api/leases/:id/sign` (same endpoint as web Batch 7 Prompt 5).
- Once status is "completed": a "Download Signed Lease (PDF)" button that fetches 
  `/api/leases/:id/pdf` and saves/opens it via `expo-file-system` + `expo-sharing` 
  (download to cache dir, then share sheet or open with device's PDF viewer).
- Disclaimer text matching web ("This document is a template... consult local 
  regulations").

Verify by: completing the full lease flow as both roles across web and RN (e.g. owner 
creates/sends on web, tenant signs on RN, owner signs on web), confirming status 
syncs correctly via the shared backend, and downloading the final PDF on RN.
```

## Prompt 7.4 — Admin Review (If RN Has Admin Access) & Privacy Controls

```
First check whether the RN app has any admin-facing screens at all. If not, skip the 
admin review queue (web Batch 7 Prompt 6's admin UI) — that stays web-only — and note 
this in /docs/rn-port/07-notes.md.

Regardless of admin screens, add to DocumentVault.tsx (Prompt 7.1):
- A "Delete my data" action (with confirmation) that deletes the user's non-verified 
  vault documents, same rules as web Batch 7 Prompt 6.
- Ensure rejected-document reasons are visible (already covered in 7.1, confirm here).

Verify by: testing "Delete my data" removes non-verified documents but is blocked/
explained for verified ones tied to an active lease.
```

---

# RN Batch 8 — Virtual Tours

Per the decision table: Matterport → WebView, 360° panorama → bundled WebView viewer, 
video → native player + WebView fallback for YouTube/Vimeo.

## Prompt 8.1 — Matterport WebView Embed

```
Using `react-native-webview`, create 
/apps/mobile/src/components/tour/MatterportEmbed.tsx for properties with 
`virtualTour.type === "matterport"` (shared type from Prompt 0.2):

- Show a placeholder (poster image + "Tap to load 3D tour" button) before mounting 
  the WebView, matching web Batch 8 Prompt 2's lazy-load pattern — only render 
  <WebView source={{uri: matterportUrl}}> after the button is tapped.
- Validate the URL against the same domain allowlist as web (matterport.com, 
  my.matterport.com, kuula.co, etc. — share this list via /packages/shared-core if not 
  already done).
- Handle WebView load errors with a fallback message + "Open in browser" button 
  (Linking.openURL) if the embed fails.
- Set a fixed aspect-ratio container (16:9) for the WebView.

Verify by: testing with a valid Matterport URL (placeholder → tap → loads tour) and 
an invalid URL (fallback message shown, no WebView rendered).
```

## Prompt 8.2 — Bundled 360° Panorama Viewer (WebView)

```
For properties with `virtualTour.type === "panorama_360"`:

- Create a small static HTML/JS bundle at /apps/mobile/assets/panorama-viewer/ using 
  pannellum (same library as web Batch 8 Prompt 3, for visual/behavioral consistency) — 
  a minimal HTML page that accepts panorama image URLs and scene labels via 
  postMessage or URL params.
- Create /apps/mobile/src/components/tour/PanoramaViewer.tsx that loads this bundled 
  HTML in a `react-native-webview` (via `require`'d local asset or 
  `source={{html: ...}}`), then sends the property's `panoramaImages` array (from 
  shared types) to the WebView via `postMessage` once loaded.
- Render the same scene-thumbnail strip below the WebView (native RN component, not 
  inside the WebView) — tapping a thumbnail sends a postMessage to the WebView to 
  switch scenes.
- Show a loading spinner until the WebView signals it's ready (postMessage back to RN).

Verify by: testing with 2-3 panorama images, confirming the bundled viewer loads inside 
the WebView, drag-to-look-around works via touch, and tapping native thumbnail buttons 
switches scenes inside the WebView.
```

## Prompt 8.3 — Video Walkthrough

```
For properties with `virtualTour.type === "video"`:

- If `videoUrl` is a self-hosted video file: use `expo-av`'s `Video` component (or 
  `react-native-video` if already a dependency) with native controls and a poster 
  image (property cover photo).
- If `videoUrl` is YouTube/Vimeo: use `react-native-webview` with the provider's embed 
  URL, same lazy-load placeholder pattern as Prompt 8.1.

Style both with a 16:9 aspect-ratio container matching the design tokens.

Verify by: testing a self-hosted video (native player, controls work, poster shows 
before play) and a YouTube URL (WebView embed loads on tap).
```

## Prompt 8.4 — Tour Tab Integration & Listing Badges

```
- Add a "Virtual Tour" section to the property detail screen (only rendered if 
  `virtualTour.type !== "none"`), choosing the right component from Prompts 8.1-8.3 
  based on `virtualTour.type` — same conditional logic as web Batch 8 Prompt 5.
- Add a small "3D Tour" / "Video Tour" badge overlay on PropertyCard thumbnails in 
  listing screens (RN Batch 2) for properties with tour data, matching web's listing 
  card badge.
- Code-split: ensure the WebView-based components (8.1, 8.2) and any heavy native 
  video library are lazy-loaded (React.lazy + Suspense, or conditional dynamic import) 
  so they don't add to the initial bundle/startup cost for properties without tours.

Verify by: viewing properties with each tour type and confirming correct rendering 
plus listing badges, and checking app startup isn't measurably slower with these 
components present but unused on most screens.
```

---

# Suggested Run Order

1. **RN Batch 0** (foundation) — non-negotiable first step; everything else assumes 
   this exists.
2. **RN Batch 1** — quick, mostly reuses Batch 0 work.
3. **RN Batch 2** — biggest native lift (maps); do this early since other batches 
   (5, 6, 8) depend on map components existing.
4. **RN Batch 4** — second biggest lift (wizard + native pickers/crop/geotag); 
   property creation flow is core.
5. **RN Batch 3** — chat; depends on Batch 5's booking cards being defined, but can 
   be built with placeholder booking-card UI first and wired up when Batch 5 lands.
6. **RN Batch 5** — booking scheduler; finalizes chat integration from Batch 3.
7. **RN Batch 6** — neighborhood widget; reuses map patterns from Batch 2.
8. **RN Batch 7** — vault & lease; mostly backend-reuse + native pickers/signature.
9. **RN Batch 8** — virtual tours; lowest priority, WebView-heavy, least core to daily 
   usage.

After all RN batches, run a final **cross-platform parity QA pass**: for each feature, 
verify an action taken on web (e.g. owner confirms a booking) is correctly reflected 
on RN and vice versa, since both now share the same backend from Batches 1-8.
