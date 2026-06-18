# Renters Upgrade — Batch 4: Post Property Multi-Step Wizard

This batch converts `/post-property` from a single long form into a guided multi-step 
wizard with drag-drop photo upload, inline cropping, and a map-based geotag picker — 
the highest "High priority / Medium effort" item remaining from the gap analysis.

Find the current form first — likely `/client/src/pages/PostProperty.jsx` with a 
single large form and basic file inputs. The wizard shell goes in first, then each 
step's content is upgraded individually so the page is never broken mid-refactor.

Run in order.

---

## Prompt 1 — Wizard Shell & Step Navigation

```
Refactor /client/src/pages/PostProperty.jsx into a multi-step wizard shell, without 
yet changing the content of each field — this task is about structure and navigation 
only.

Create /client/src/components/post-property/WizardShell.jsx that renders:
- A horizontal stepper at the top (desktop) / a progress bar with step label (mobile), 
  showing steps: 1. Basic Info, 2. Location, 3. Details & Amenities, 4. Photos, 
  5. Pricing, 6. Review & Submit. Use --rt-sys-primary for completed/active step 
  indicators, muted for upcoming steps, and a checkmark icon for completed steps.
- A content area below the stepper that renders the current step's component.
- A sticky footer bar with "Back" and "Next" / "Submit" buttons (using upgraded Button 
  component), disabling "Next" if the current step's required fields are invalid.

Move the existing form fields into six step components under 
/client/src/components/post-property/steps/:
- BasicInfoStep.jsx (title, description, property type, BHK/size — whatever currently 
  exists)
- LocationStep.jsx (address fields — map picker comes in Prompt 3)
- DetailsStep.jsx (amenities, furnishing, floor, etc.)
- PhotosStep.jsx (current photo input — upgraded in Prompt 2)
- PricingStep.jsx (rent/price, deposit, negotiable toggle, etc.)
- ReviewStep.jsx (read-only summary of all entered data + final submit button)

Manage all form state in PostProperty.jsx using a single state object (or existing 
form library if one is already used — check for react-hook-form/formik before adding 
a new one) and pass values + onChange handlers down to each step.

Constraints:
- Do not change field names, validation rules, or the final submit payload sent to 
  the backend — purely restructuring into steps.
- Preserve any existing draft-saving (localStorage/sessionStorage) if present.

Verify by: walking through all 6 steps on /post-property, confirming Back/Next 
navigation works, the stepper highlights the correct step, and submitting from the 
Review step sends the same payload as before.
```

---

## Prompt 2 — Drag-and-Drop Photo Upload with Reordering & Cover Selection

```
Rebuild /client/src/components/post-property/steps/PhotosStep.jsx with a premium 
multi-photo upload experience:

- A large drop zone (dashed border, --rt-sys-primary on drag-over) supporting 
  drag-and-drop of multiple image files, plus a "Browse files" button as a fallback.
- After selection, display photos as a responsive grid of thumbnail tiles. Each tile 
  shows: image preview, a remove "x" button, and a drag handle.
- Implement drag-to-reorder of the thumbnail grid (use `@dnd-kit/core` + 
  `@dnd-kit/sortable` if not already a dependency — install if needed; otherwise reuse 
  an existing DnD library in the project).
- The first photo in the order is the "Cover Photo" — mark it with a badge ("Cover") 
  and allow any other photo to be set as cover via a small star/button on hover, which 
  moves it to position 1.
- Show upload progress per file (simple progress bar or percentage overlay on the 
  thumbnail) while uploading to the existing media storage pipeline (reuse whatever 
  /server/routes upload endpoint is already used for property photos).
- Enforce existing file count/size limits (check current validation rules) and show 
  inline error messages for rejected files (too large, wrong type, exceeds max count).

Constraints:
- Do not change the backend upload endpoint's request/response contract — only the 
  client-side UI and the order/cover metadata sent alongside it (if the schema doesn't 
  support photo order/cover yet, add an `order` index and `isCover` boolean to the 
  photos array in the property schema).

Verify by: dragging multiple images onto /post-property's Photos step, reordering them 
via drag, setting a different photo as cover, removing one, and confirming the final 
submitted payload reflects the correct order and cover flag.
```

---

## Prompt 3 — Inline Image Cropping

```
Add inline cropping to the photo upload flow from Prompt 2:

- When a user adds a new photo (or clicks an "Edit" icon on an existing thumbnail in 
  PhotosStep.jsx), open a Dialog containing a cropping interface using `react-easy-crop` 
  (install if not present).
- Provide a fixed aspect ratio toggle relevant to listing photos (e.g. 4:3 and 16:9 
  options, with 4:3 as default for property photos), plus zoom and rotate controls.
- On "Apply", generate a cropped image (canvas-based crop using the library's utility 
  pattern), replace the thumbnail preview with the cropped version, and use the cropped 
  output as the file uploaded to the server (re-run the upload for that file with the 
  cropped blob).
- Style the cropping dialog using the glass Card/Dialog variants and rt-sys tokens — 
  crop controls (zoom slider, rotate buttons, aspect toggle) should match the rest of 
  the upgraded UI.

Constraints:
- Cropping is optional — users can skip it and the original image is used as-is.
- Ensure cropped image file size/format stays within existing upload validation limits.

Verify by: uploading a photo, opening the crop dialog, adjusting zoom/aspect/rotation, 
applying the crop, and confirming the thumbnail updates to the cropped version and 
that version is what gets uploaded.
```

---

## Prompt 4 — Map-Based Location & Geotag Picker

```
Rebuild /client/src/components/post-property/steps/LocationStep.jsx to include an 
interactive map picker alongside the existing address fields:

- Keep existing text inputs for address line, city, state, pincode/zip (whatever 
  currently exists).
- Add an address autosuggest on the main address input (reuse whatever geocoding 
  service/API is already used on the home page search — check for an existing 
  autosuggest implementation before adding a new dependency/API key).
- Below the address fields, render a Leaflet map (reuse the <PropertyMap> component 
  pattern from Batch 2 if applicable, or a simpler single-marker map component) with a 
  single draggable marker.
- Selecting an address from autosuggest geocodes it and moves the map + marker to that 
  location. The user can then fine-tune the exact pin position by dragging the marker.
- On marker drag-end, reverse-geocode the new coordinates to update a "Pinned location" 
  display text (e.g. "Lat: 19.0760, Lng: 72.8777 — near [nearest known place]"), but do 
  not overwrite the user's typed address fields automatically (avoid surprising field 
  overwrites — show the reverse-geocoded text as supplementary info only).
- Store the final `{ lat, lng }` in the form state and include it in the submission 
  payload (add `coordinates: { lat, lng }` to the property schema if not already 
  present — this is required for the marker clustering/map features built in Batch 2).

Constraints:
- If no geocoding API is currently configured, default to a free option (e.g. 
  Nominatim/OpenStreetMap geocoding) rather than requiring a new paid API key, and note 
  in code comments that it can be swapped for a paid provider for production scale.
- Validate that coordinates are present before allowing progression to the next step 
  (Pricing) — show an inline message "Please confirm the property location on the map" 
  if missing.

Verify by: typing a partial address and selecting an autosuggest result, confirming 
the map centers and drops a marker there, dragging the marker to fine-tune the 
position, and confirming the submitted property has valid lat/lng that show correctly 
as a pin on /rent-properties or /buy-properties afterward.
```

---

## Prompt 5 — Review Step & Draft Auto-Save

```
Build out /client/src/components/post-property/steps/ReviewStep.jsx as a polished 
summary screen:

- Render a read-only preview that mirrors the property detail page layout (reuse 
  components from BuyPropertyDetail/RentPropertyDetail where sensible — e.g. the photo 
  gallery, price display, amenities list) so the user sees roughly what their listing 
  will look like once published.
- Group the summary into clearly labeled sections matching the wizard steps (Basic 
  Info, Location with a small static map preview, Details & Amenities, Photos grid, 
  Pricing), each with an "Edit" link that jumps back to the corresponding step.
- Add a prominent "Publish Listing" button (primary, with shadow-glow) and a secondary 
  "Save as Draft" button.

Auto-save / draft handling:
- Implement debounced auto-save of the entire wizard form state to localStorage 
  (key scoped to the logged-in user, e.g. `post-property-draft-{userId}`) on every 
  change, so users don't lose progress on refresh/navigation.
- On mounting /post-property, check for an existing draft and prompt the user 
  ("Resume your draft from [date]?" with Resume / Start Over options) using the Dialog 
  component.
- Clear the saved draft from localStorage after successful publish.

Constraints:
- "Save as Draft" should call the existing backend save mechanism if one exists for 
  draft listings (status: "draft"); if none exists, it can simply rely on the 
  localStorage auto-save plus a toast confirmation — do not invent new backend draft 
  endpoints unless one already exists in the codebase.

Verify by: filling out several steps, refreshing the page, confirming the "Resume 
draft" prompt appears and restores all entered data, then completing the Review step 
and publishing, confirming the draft is cleared afterward.
```

---

## Prompt 6 — Responsive Polish & Accessibility

```
Finish the Post Property wizard with responsive and accessibility refinements across 
/client/src/pages/PostProperty.jsx and all step components:

- Mobile: ensure the stepper collapses to a compact progress indicator (e.g. "Step 3 
  of 6: Details & Amenities" with a thin progress bar) rather than a full horizontal 
  stepper, and the sticky Back/Next footer remains usable above the mobile keyboard 
  when an input is focused (avoid the footer being covered).
- Ensure all step transitions use the `.animate-page-enter` utility from Batch 1 for 
  a smooth feel between steps (slide from right when going Next, slide from left when 
  going Back).
- Add `aria-current="step"` to the active step in the stepper, and ensure each step's 
  heading is announced (e.g. focus moves to the step's `<h2>` on step change, with 
  `tabIndex={-1}` so it's focusable programmatically without being in tab order).
- Ensure all required fields show clear inline validation messages (not just 
  disabling "Next" silently) — if a user tries to click "Next" with invalid fields, 
  scroll to and focus the first invalid field and show its error message.
- Run a quick check that the Photos step's drag-and-drop reordering (Prompt 2) has a 
  keyboard-accessible fallback (e.g. "Move up" / "Move down" buttons visible on focus 
  for users who can't drag).

Verify by: completing the entire wizard on a mobile viewport (375px) with the on-screen 
keyboard open during text steps, and completing it again using only keyboard 
navigation (Tab, Enter, Arrow keys for the photo reorder fallback).
```

---

## After Batch 4

Remaining items from the gap analysis roadmap (Batches 5+):
- **Batch 5 — Visit Booking Scheduler**: calendar-based slot booking on property detail 
  pages, integrated with the chat (Batch 3) for visit-invite messages.
- **Batch 6 — Neighborhood Analytics Widget**: walk score / nearby amenities on detail 
  pages.
- **Batch 7 — Document Vault & Lease Drafting** (long-term).
- **Batch 8 — Virtual 3D Tour Embeds** (long-term).

Let me know once Batch 4 is verified and I'll write Batch 5 — the visit scheduler.
