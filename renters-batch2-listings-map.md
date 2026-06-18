# Renters Upgrade — Batch 2: Listings & Map Overhaul

This batch tackles the highest-priority "Large" effort item from the gap analysis: 
`/rent-properties` and `/buy-properties`. The current Leaflet map lacks clustering, 
the layout isn't a true sticky split, and card↔map interaction is one-directional 
(pin click → highlight card, but not card hover → highlight pin).

Both pages likely share a map component — find it first (search for `Leaflet` or 
`MapContainer` imports). The prompts below assume a shared component; if 
`RentListings.jsx` and `BuyListings.jsx` each have their own inline map code, Prompt 1 
should extract a shared `PropertyMap.jsx` component as its first step.

Run in order. Prompts 1-3 are the core rebuild; 4-6 are refinement/polish.

---

## Prompt 1 — Extract Shared PropertyMap Component + Marker Clustering

```
Locate the Leaflet map implementation used in /client/src/pages/RentListings.jsx and 
/client/src/pages/BuyListings.jsx. 

If the map code is duplicated or inline in both files, extract it into a new shared 
component at /client/src/components/all_listing/PropertyMap.jsx that accepts props:
- `listings` (array of property objects with coordinates)
- `activeListingId` (currently highlighted listing, or null)
- `onMarkerClick(listingId)` callback
- `onMarkerHover(listingId | null)` callback

Install and integrate marker clustering using `react-leaflet-cluster` (or 
`leaflet.markercluster` if a non-React-Leaflet wrapper is already in use — check 
package.json first and match the existing Leaflet integration style).

Requirements:
- Wrap markers in a MarkerClusterGroup so that clusters of nearby pins collapse into a 
  single numbered cluster icon at lower zoom levels, and expand/spiderfy on click or 
  zoom-in.
- Style cluster icons using the --rt-sys-primary color tokens (custom divIcon with the 
  brand indigo background and white count text), not the default Leaflet cluster colors.
- Individual markers should show a subtle scale-up animation on hover (use a custom 
  divIcon with a CSS class and transition).
- If `activeListingId` is set, that marker should render in a visually distinct 
  "active" state (larger size or accent color) and the map should pan/center to it 
  smoothly (flyTo).

Update both RentListings.jsx and BuyListings.jsx to use the new shared <PropertyMap> 
component with their respective listing data, removing the old duplicated map code.

Constraints:
- Do not change the API calls or data shape returned from /api/properties/rent or 
  /api/properties/buy.
- Keep existing pin-click → highlight-card behavior working via onMarkerClick.

Verify by: visiting /rent-properties with 20+ listings in a city, confirming nearby 
pins group into cluster bubbles that expand on zoom/click, and that clicking an 
individual marker still highlights the corresponding listing card.
```

---

## Prompt 2 — Sticky Split Layout (List + Map)

```
Refactor the content layout of /client/src/pages/RentListings.jsx and 
/client/src/pages/BuyListings.jsx to a sticky split view on desktop (lg breakpoint 
and above):

- Left column (~55-60% width): scrollable filter bar + property list grid (existing 
  PropertyCard components), in its own scroll container.
- Right column (~40-45% width): the <PropertyMap> component, positioned with 
  `position: sticky; top: <navbar height>; height: calc(100vh - <navbar height>)` so 
  the map stays in view while the user scrolls the listing list.

Use the new --rt-sys spacing/radius tokens for the gap between columns and the map 
container's rounded corners + border.

On tablet and mobile (below lg), stack vertically: render the list first, then a 
"View on Map" toggle button (sticky at the bottom of the viewport, glass-styled) that 
opens the map in a full-screen modal/drawer using the existing Dialog component. 
Inside that drawer, the map should behave the same as desktop (clustering, active 
marker, etc.) and include a close button.

Constraints:
- Do not change the filter sidebar's existing filter logic — only its container/layout.
- Ensure the map container has explicit height set at all breakpoints (Leaflet requires 
  a sized parent or it renders blank).

Verify by: resizing the browser from 1440px down to 375px on /rent-properties — confirm 
the map stays pinned while scrolling on desktop, and collapses into a "View on Map" 
drawer on mobile that opens correctly.
```

---

## Prompt 3 — Bidirectional Card ↔ Map Hover/Highlight

```
In /client/src/pages/RentListings.jsx and /client/src/pages/BuyListings.jsx, wire up 
full bidirectional highlighting between the property list and the map:

1. Hovering a PropertyCard in the list should call `onMarkerHover(listingId)`, which 
   the <PropertyMap> component uses to visually emphasize that marker (e.g. scale up, 
   add a glow/ring using --rt-sys-shadow-glow) without changing the map's center/zoom.
2. Hovering a marker on the map should apply the existing `.hover-pop` utility (from 
   Batch 1) to the corresponding PropertyCard and scroll it into view within the list's 
   scroll container if it's not currently visible (use `scrollIntoView({ behavior: 
   'smooth', block: 'nearest' })`).
3. Clicking a marker (existing behavior) should additionally apply a more persistent 
   "active" highlight state to the card (e.g. a colored left border or ring) until 
   another marker/card is clicked.

In /client/src/components/all_listing/property-card.jsx, accept new optional props: 
`isHighlighted` and `isActive`, applying the corresponding hover/active styles using 
the rt-sys tokens.

Constraints:
- Debounce hover events (~50-100ms) to avoid flicker when the cursor moves quickly 
  across the list or map.
- Do not trigger scrollIntoView on initial page load — only on marker hover/click 
  interactions.

Verify by: hovering over property cards and watching the corresponding map marker 
highlight, then hovering a map marker and confirming the matching card glows and 
scrolls into view if needed.
```

---

## Prompt 4 — Filter Sidebar Visual Refresh

```
Refactor the filter sidebar/bar on /client/src/pages/RentListings.jsx and 
/client/src/pages/BuyListings.jsx (BHK selection, budget slider, property category 
buttons, sort dropdown) to use the upgraded UI components from Batch 1:

- Wrap the filter panel in a Card with the `glass` variant.
- Replace any raw checkbox/button groups for BHK and category filters with pill-style 
  toggle buttons (rounded-full, using --rt-sys-primary for the active/selected state 
  and a subtle border for inactive states), with `active:scale-95` press feedback.
- Style the budget range slider using the primary color for the track/thumb, and 
  display the current min/max values as live-updating labels above the slider.
- Add a "Clear all filters" text button that appears only when at least one filter is 
  active, positioned at the top-right of the filter panel.
- On mobile, collapse the filter panel into a "Filters" button that opens a bottom 
  sheet/drawer (using the Dialog component) rather than taking up vertical space above 
  the listings.

Constraints:
- Do not change the underlying filter state logic, query params, or API request 
  construction — this is a visual/structural refactor of the filter controls only.

Verify by: applying several filters on /rent-properties, confirming the pill buttons 
show correct active states, the "Clear all" button appears/disappears correctly, and 
on mobile the filters open in a drawer without breaking the page layout.
```

---

## Prompt 5 — Map Loading States & Skeletons

```
Update /client/src/components/all_listing/PropertyMap.jsx and the listing list rendering 
in RentListings.jsx / BuyListings.jsx to handle loading and empty states gracefully:

- While property data is loading, render a skeleton version of the list (use the 
  `.skeleton-wave` utility from Batch 1 on card-shaped placeholder blocks, matching 
  PropertyCard dimensions) and a skeleton/placeholder state for the map area (a 
  blurred static map image or a themed loading shimmer matching the map's rounded 
  container).
- If a search/filter combination returns zero listings, show an empty state inside the 
  list column: an icon, a message like "No properties match your filters", and a 
  "Clear filters" button — while the map remains visible showing the searched area 
  with no markers (not blank/broken).
- Ensure the map component itself (Leaflet) only initializes once its container has a 
  non-zero height, to avoid the "grey tile" rendering bug common when Leaflet mounts in 
  a hidden or zero-size container.

Constraints:
- Reuse the skeleton/shimmer utilities from Batch 1 rather than creating new animation 
  definitions.

Verify by: throttling network speed in DevTools and reloading /buy-properties — confirm 
skeletons render during load, then test a filter combination guaranteed to return zero 
results and confirm the empty state displays correctly without breaking the map.
```

---

## Prompt 6 — Accessibility Pass for Map & Listings

```
Improve accessibility on /client/src/pages/RentListings.jsx, 
/client/src/pages/BuyListings.jsx, and /client/src/components/all_listing/PropertyMap.jsx:

- Add an `aria-live="polite"` region near the listings list that announces result 
  counts when filters change (e.g. "24 properties found in Mumbai").
- Ensure each PropertyCard's primary clickable area is a single focusable element 
  (e.g. wrap in an `<a>` or apply `role="link"` + `tabIndex=0` + Enter key handler) 
  rather than relying on nested clickable children.
- For the Leaflet map, add a visually-hidden text alternative near the map container 
  that lists the same properties as a navigable list (e.g. "Map view — N properties. 
  Use the list above to browse properties; the map provides a visual reference only."), 
  since full screen-reader support for individual map pins isn't realistic with Leaflet.
- Ensure the "View on Map" mobile drawer (from Prompt 2) traps focus while open and 
  returns focus to the triggering button on close.

Verify by: navigating /rent-properties using only keyboard (Tab/Enter) — confirm every 
card and filter control is reachable and operable, and that the mobile map drawer 
correctly traps and restores focus.
```

---

## After Batch 2

Next up is **Batch 3 — Direct Chat upgrades** (`/messages`): file/image sharing, 
richer message bubbles using the new design tokens, and groundwork for the visit 
scheduler integration later. Let me know once Batch 2 is verified (especially Prompts 
1-2, since they're the highest-risk structural changes) and I'll write Batch 3.
