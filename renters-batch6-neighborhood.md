# Renters Upgrade — Batch 6: Neighborhood Analytics Widget

This batch adds a "Neighborhood" section to property detail pages: walk/transit score 
badges, nearby amenities (schools, transit, groceries, hospitals, etc.) with 
distances, and a small map overlay — using the coordinates captured in Batch 4's 
geotag picker.

Since dedicated paid APIs (WalkScore, Google Places) may not be configured, this batch 
defaults to free/open data (OpenStreetMap Overpass API for nearby amenities) with a 
simple custom walkability score calculation, and notes where a paid provider could be 
swapped in later.

Run in order.

---

## Prompt 1 — Backend: Nearby Amenities Endpoint

```
Add a backend endpoint that returns nearby points of interest for a property's 
coordinates. Follow existing route/controller conventions in /server/routes/.

Create `GET /api/properties/:id/neighborhood`:
- Look up the property's `coordinates: { lat, lng }` (added in Batch 4).
- Query the OpenStreetMap Overpass API (https://overpass-api.de/api/interpreter) for 
  points of interest within a 1.5km radius across these categories: schools, hospitals/
  clinics, supermarkets/grocery, restaurants/cafes, parks, and public transit stops 
  (bus/train/metro stations).
- For each category, return the 3-5 nearest results with: name, category, distance 
  in meters (calculate using the Haversine formula from the property's coordinates), 
  and lat/lng.
- Cache results server-side (in-memory or existing cache layer if one exists, e.g. 
  Redis) for ~24 hours per property, keyed by property id and rounded coordinates, to 
  avoid hammering the Overpass API on every page view.
- Compute a simple "Walkability Score" (0-100): start at a base score and add points 
  based on the count and proximity of amenities found within 500m/1km/1.5km across 
  categories (define a simple weighted formula — e.g. each amenity within 500m = +3, 
  within 1km = +1.5, within 1.5km = +0.5, capped at 100). Also compute a basic 
  "Transit Score" using only the transit-stop category with the same distance-tiered 
  approach.
- Return shape: `{ walkScore, transitScore, categories: { schools: [...], hospitals: 
  [...], groceries: [...], restaurants: [...], parks: [...], transit: [...] } }`.

Constraints:
- Handle Overpass API timeouts/failures gracefully — return a response with 
  `available: false` and empty categories rather than erroring the whole request, so 
  the frontend can show a fallback state.
- Add a code comment noting this Overpass-based implementation can be swapped for 
  Google Places/WalkScore APIs later by replacing this endpoint's data source while 
  keeping the same response shape.

Verify by: calling /api/properties/:id/neighborhood for a property with valid 
coordinates and confirming it returns categorized amenities with distances and two 
scores within a reasonable response time (cached on second call).
```

---

## Prompt 2 — Walk/Transit Score Badges with Visual Gauges

```
Create /client/src/components/neighborhood/ScoreGauge.jsx — a small circular/arc 
gauge component that displays a 0-100 score with:
- A colored arc (using SVG `stroke-dasharray`) that fills proportionally to the score, 
  using --rt-sys-destructive for low scores (0-39), --rt-sys-warning/amber for medium 
  (40-69), and --rt-sys-success for high (70-100).
- The numeric score in the center, and a label below ("Walk Score" / "Transit Score").
- A short qualitative label based on score range (e.g. "Car-Dependent" / "Somewhat 
  Walkable" / "Very Walkable" / "Walker's Paradise" — use standard WalkScore-style 
  bands).
- A subtle entrance animation: the arc should animate from 0 to its final value when 
  it scrolls into view (use an IntersectionObserver or existing scroll-animation 
  utility if one exists).

Add this component to a new "Neighborhood" section on 
/client/src/pages/RentPropertyDetail.jsx and /client/src/pages/BuyPropertyDetail.jsx, 
fetching from `GET /api/properties/:id/neighborhood` and rendering two ScoreGauge 
instances (Walk Score, Transit Score) side by side in a glass Card.

If the API returns `available: false`, hide the gauges and show a small note: 
"Neighborhood data unavailable for this location."

Verify by: viewing a property detail page and confirming both score gauges render, 
animate in on scroll, and show appropriate colors/labels for their score ranges.
```

---

## Prompt 3 — Nearby Amenities List with Category Tabs

```
Extend the Neighborhood section on the property detail pages with a categorized 
amenities list below the score gauges from Prompt 2.

Create /client/src/components/neighborhood/AmenitiesList.jsx:
- Render category tabs/pills (Schools, Hospitals, Groceries, Restaurants, Parks, 
  Transit) using the upgraded pill-button style from Batch 2's filter refresh, each 
  with an appropriate icon from the existing icon library.
- For the active category, list the returned amenities as rows: icon, name, and 
  distance (formatted as "350 m" or "1.2 km"), sorted nearest-first.
- If a category has zero results, show "No [category] found within 1.5km" instead of 
  an empty list.
- Default to the category with the most results on initial load.

Constraints:
- Keep this section collapsible — wrap the whole Neighborhood section (gauges + 
  amenities) in a collapsible Card that's expanded by default on desktop and collapsed 
  by default on mobile (to avoid pushing the contact/booking widgets too far down on 
  small screens), using existing Accordion/Collapsible components if available.

Verify by: viewing the Neighborhood section, switching between category tabs, and 
confirming amenities and distances display correctly, with appropriate empty-category 
messaging where relevant.
```

---

## Prompt 4 — Mini Map Overlay with Amenity Pins

```
Add a small embedded map to the Neighborhood section showing the property's location 
plus pins for the currently selected amenity category from Prompt 3.

Create /client/src/components/neighborhood/NeighborhoodMap.jsx:
- A compact Leaflet map (reuse map setup/styling conventions from Batch 2's 
  PropertyMap, but smaller — e.g. 300-400px height, rounded corners matching rt-sys 
  radius tokens), centered on the property's coordinates with a distinct "home" marker 
  icon (different style/color from amenity pins).
- Render small category-specific icon pins for each amenity in the currently active 
  category (from AmenitiesList.jsx — pass the active category's data down or lift 
  state up to a shared parent).
- Clicking an amenity row in AmenitiesList.jsx should pan the map to that pin and 
  briefly highlight it (pulse animation).
- Clicking a pin on the map should show a small popup with the amenity's name and 
  distance.

Constraints:
- Keep this map non-interactive for zoom/pan beyond basic Leaflet defaults (no need 
  for clustering here — amenity counts are small, max 3-5 per category).
- Ensure the map only renders once its container has a defined height (same Leaflet 
  sizing caveat as Batch 2).

Verify by: switching amenity categories and confirming the map pins update 
accordingly, clicking an amenity row to pan/highlight its pin, and clicking a pin to 
see its popup.
```

---

## Prompt 5 — Loading, Error & Empty States + Caching Awareness

```
Polish the Neighborhood section's edge cases across ScoreGauge.jsx, 
AmenitiesList.jsx, and NeighborhoodMap.jsx:

- While `GET /api/properties/:id/neighborhood` is loading, show skeleton placeholders 
  (`.skeleton-wave` from Batch 1) for the score gauges, category tabs, amenity list 
  rows, and the map area — matching their final dimensions to avoid layout shift.
- If the API call fails entirely (network error, not just `available: false`), show a 
  retry button ("Couldn't load neighborhood info — Retry") that re-fetches on click.
- If `available: false` (from Prompt 1's graceful fallback), show a single friendly 
  message in place of the whole section: "Neighborhood insights aren't available for 
  this location yet" with a small icon — don't render empty gauges/tabs/map.
- Add a small "Data from OpenStreetMap" attribution line at the bottom of the section 
  in muted-foreground text (required for Overpass/OSM data usage).

Verify by: simulating a slow network (loading skeletons appear correctly sized), 
simulating an API error (retry button works), and testing a property with no 
coordinates set (graceful "not available" message, no broken UI).
```

---

## Prompt 6 — Responsive Layout & Accessibility

```
Finish the Neighborhood widget with responsive and accessibility refinements:

- Desktop: lay out the section as gauges + amenities list side-by-side on the left 
  (or top) and the mini map on the right (or below), within the existing property 
  detail page's content width — don't let it overflow the main content column used by 
  other sections (gallery, description, EMI calculator from Batch 1).
- Mobile: stack vertically — gauges first, then category tabs (horizontally 
  scrollable if they overflow), then amenities list, then the map.
- Ensure category tab buttons are reachable via keyboard (Tab + Enter/Space to switch), 
  with `aria-selected` reflecting the active tab and `role="tablist"`/`role="tab"` 
  applied appropriately.
- Ensure ScoreGauge.jsx's SVG includes an accessible text alternative (e.g. 
  `aria-label="Walk Score: 78 out of 100, Very Walkable"`) so screen readers get the 
  value without relying on the visual arc.
- Ensure the collapsible section header (from Prompt 3) has proper 
  `aria-expanded`/`aria-controls` attributes.

Verify by: viewing the full Neighborhood section on a 375px viewport (correct stacking 
order, no overflow), and navigating it with keyboard + a screen reader (or browser 
accessibility tree inspector) to confirm tabs and gauges announce correctly.
```

---

## After Batch 6

Remaining items from the gap analysis roadmap (Long-Term tier):
- **Batch 7 — Document Vault & Lease Drafting**: secure ID/document uploads and basic 
  lease draft + e-signature flow.
- **Batch 8 — Virtual 3D Tour Embeds**: Matterport/panorama embeds on property detail 
  pages.

Let me know once Batch 6 is verified and I'll write Batch 7 — the document vault and 
lease drafting tools.
