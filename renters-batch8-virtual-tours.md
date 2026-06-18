# Renters Upgrade — Batch 8: Virtual 3D Tour Embeds

This final batch from the gap analysis adds virtual tour support to property 
listings: Matterport (or similar) embed links, self-hosted 360° panorama photos, and 
video walkthroughs — surfaced as a dedicated "Virtual Tour" tab on property detail 
pages, with input collected during the post-property wizard (Batch 4).

Run in order.

---

## Prompt 1 — Data Model & Post-Property Wizard Step

```
Add virtual tour support to the property schema and the post-property wizard from 
Batch 4.

Backend:
- Extend the property model with an optional `virtualTour` object: 
  { type: "matterport" | "panorama_360" | "video" | "none", matterportUrl (string, 
  for type "matterport"), panoramaImages (array of { url, label }, for type 
  "panorama_360"), videoUrl (string, for type "video") }.
- Validate `matterportUrl` and `videoUrl` are well-formed URLs from expected domains 
  where reasonable (e.g. matterport.com links, or YouTube/Vimeo/self-hosted video URLs 
  — don't over-restrict, just basic URL format validation).

Frontend — add a new step to the post-property wizard from Batch 4:
- Create /client/src/components/post-property/steps/VirtualTourStep.jsx and insert it 
  into WizardShell.jsx's step list (e.g. between Photos and Pricing, or after Pricing 
  — pick whichever ordering reads naturally and update the stepper labels accordingly).
- UI: a tour type selector (pill buttons: "None", "Matterport / 3D Tour Link", "360° 
  Photos", "Video Walkthrough") using the Batch 2 pill style.
  - "Matterport / 3D Tour Link": a single text input for the embed/share URL, with 
    helper text explaining where to find it (e.g. "Paste your Matterport, Cupix, or 
    similar 3D tour share link").
  - "360° Photos": reuse the drag-drop upload component pattern from Batch 4's photo 
    upload, but for one or more equirectangular 360° images, each with an optional 
    label input (e.g. "Living Room", "Kitchen").
  - "Video Walkthrough": a text input for a YouTube/Vimeo URL, OR a file upload for a 
    self-hosted video (reuse existing upload pipeline) — support whichever is simpler 
    given existing infrastructure; if both are easy, support both with a small toggle.
- This step is entirely optional — selecting "None" (the default) requires no 
  additional input and the wizard proceeds normally.

Constraints:
- Do not make this step block wizard progression — "Next" should always be enabled 
  regardless of selection, with inline validation only if a URL is entered but 
  malformed.

Verify by: completing the post-property wizard, selecting each tour type in turn, 
entering valid sample data for each, and confirming the submitted property payload 
includes the correct `virtualTour` object shape.
```

---

## Prompt 2 — Matterport / Iframe-Based Tour Embed

```
Create /client/src/components/tour/MatterportEmbed.jsx for properties with 
`virtualTour.type === "matterport"`:

- Render a responsive iframe embed of the Matterport (or similar) share URL, 
  maintaining a 16:9 aspect ratio container with rounded corners matching rt-sys 
  radius tokens.
- Lazy-load the iframe: don't load the actual embed until the user scrolls it into 
  view or clicks a "Load 3D Tour" placeholder button (show a static placeholder/poster 
  with a play icon and "Click to load interactive 3D tour" text first) — this avoids 
  loading a heavy third-party iframe on every property page view.
- Add `loading="lazy"`, appropriate `sandbox`/`allow` attributes for fullscreen and VR 
  if supported by the provider, and a fallback message + direct link ("Open tour in 
  new tab") if the iframe fails to load (use an `onError` handler where supported, or 
  a timeout-based fallback).

Constraints:
- Validate the URL is from an allowed embed domain before rendering the iframe (basic 
  allowlist check, e.g. matterport.com, my.matterport.com, kuula.co, etc. — extendable 
  list) to avoid embedding arbitrary/unsafe URLs.

Verify by: setting a valid Matterport share URL on a test property, confirming the 
placeholder shows first, clicking it loads the interactive embed responsively, and 
testing an invalid/unsafe URL shows the fallback message instead of an iframe.
```

---

## Prompt 3 — Self-Hosted 360° Panorama Viewer

```
Create /client/src/components/tour/PanoramaViewer.jsx for properties with 
`virtualTour.type === "panorama_360"` and one or more uploaded equirectangular images.

- Install and use a lightweight 360° viewer library (`pannellum` or `@photo-sphere-
  viewer/core` — prefer pannellum for smaller bundle size unless a panorama library is 
  already a dependency).
- Render the viewer in a responsive container (similar aspect ratio/sizing to the 
  Matterport embed) with drag-to-look-around and pinch/scroll-to-zoom controls.
- If multiple panorama images were uploaded (each with a label from Prompt 1), show a 
  thumbnail strip below the viewer (e.g. "Living Room", "Kitchen", "Bedroom") allowing 
  the user to switch between scenes — clicking a thumbnail crossfades to that panorama.
- Lazy-load the viewer library and the panorama images only when this section scrolls 
  into view (same lazy-load principle as Prompt 2), since 360° images are large.
- Show a loading spinner/skeleton while a panorama image is loading, and a subtle 
  on-screen hint ("Drag to look around") on first load that fades out after a few 
  seconds or on first interaction.

Constraints:
- Ensure the viewer is destroyed/cleaned up properly on component unmount (panorama 
  libraries often attach canvas/WebGL contexts that need explicit disposal) to avoid 
  memory leaks when navigating between property pages.

Verify by: uploading 2-3 panorama images with labels via the wizard (Prompt 1), then 
on the property detail page confirming the viewer loads, drag-to-look-around works, 
and switching between scene thumbnails crossfades correctly.
```

---

## Prompt 4 — Video Walkthrough Embed

```
Create /client/src/components/tour/VideoTourEmbed.jsx for properties with 
`virtualTour.type === "video"`:

- If `videoUrl` is a YouTube or Vimeo link, render a responsive embedded player 
  (16:9, lazy-loaded iframe with `loading="lazy"`, same placeholder-then-load pattern 
  as Prompt 2) using the provider's standard embed URL format (convert a regular 
  watch/share URL to the embed URL format if needed).
- If it's a self-hosted video file (from Prompt 1's optional file upload path), render 
  a native HTML5 `<video>` element with controls, `preload="none"`, and a poster image 
  (use the property's cover photo as the poster if no dedicated thumbnail exists).
- Style the container consistently with the other tour components (rounded corners, 
  rt-sys tokens, same aspect-ratio approach).

Verify by: testing with a YouTube URL (confirms responsive embed + lazy load) and, if 
self-hosted video upload was implemented in Prompt 1, testing with an uploaded video 
file (confirms native player with poster image renders and plays).
```

---

## Prompt 5 — Virtual Tour Tab Integration on Property Detail Pages

```
Integrate the tour components from Prompts 2-4 into 
/client/src/pages/RentPropertyDetail.jsx and /client/src/pages/BuyPropertyDetail.jsx:

- Add a tab/section called "Virtual Tour" alongside existing tabs/sections (Photos, 
  Description, Neighborhood from Batch 6, etc.) — only show this tab if 
  `virtualTour.type !== "none"` and required data is present.
- Render the appropriate component (MatterportEmbed, PanoramaViewer, or 
  VideoTourEmbed) based on `virtualTour.type`.
- If the "Virtual Tour" tab/section exists, add a small badge or icon to the property 
  card in listing pages (RentListings.jsx, BuyListings.jsx — PropertyCard.jsx) 
  indicating "3D Tour Available" or "Video Tour" (small icon overlay on the thumbnail, 
  using rt-sys tokens, distinct from the VerifiedBadge from Batch 7).
- Ensure the tab ordering makes sense: if a virtual tour exists, consider placing it 
  prominently (e.g. right after the main photo gallery) since it's a key differentiator 
  feature.

Constraints:
- Don't add empty/placeholder "Virtual Tour" tabs for properties without tour data — 
  the section should be entirely absent, not shown-but-empty.

Verify by: viewing a property with each tour type configured and confirming the 
correct viewer renders in the Virtual Tour section, and confirming the listing card 
badge appears only for properties with tour data.
```

---

## Prompt 6 — Performance, Accessibility & Final Polish

```
Final polish pass for the virtual tour feature across all components from Prompts 
2-5:

- Confirm all three tour viewer types are code-split (dynamic `import()` / lazy 
  component loading) so their libraries (pannellum, etc.) are not included in the main 
  bundle for property pages without a virtual tour — verify via build output/bundle 
  analyzer if one exists in the project.
- Accessibility: 
  - MatterportEmbed and VideoTourEmbed iframes should have a descriptive `title` 
    attribute (e.g. "3D virtual tour of [property title]").
  - PanoramaViewer's scene-switching thumbnails should be keyboard-navigable buttons 
    with `aria-label`s (e.g. "View Living Room panorama") and indicate the currently 
    active scene via `aria-pressed`.
  - All "click to load" placeholders should be real `<button>` elements (not divs with 
    onClick) for keyboard/screen-reader access.
- Add a `prefers-reduced-motion` check: skip the panorama "Drag to look around" hint 
  fade animation and any crossfade transitions for users with reduced motion enabled, 
  swapping to instant transitions instead.
- Responsive check: confirm all three viewer types maintain their aspect ratio and 
  don't overflow on mobile viewports (375px), and that pannellum/panorama touch 
  controls (drag, pinch-zoom) work correctly on a touch device or emulator.

Verify by: running a production build and checking that tour-related libraries appear 
in separate chunks loaded only on demand, then testing the Virtual Tour section on a 
375px touch-emulated viewport with reduced-motion enabled in OS settings.
```

---

## After Batch 8

This completes every item from the original gap analysis roadmap (Quick Wins through 
Long-Term). The next step is the **Final QA Pass** from your original 
`03-execution-plan.md` — Phase 3's site-wide consistency, responsive, performance, 
SEO, and accessibility sweep across all pages now that every feature batch is in 
place. 

Suggested order for that final pass:
1. Cross-page design-token/component consistency check
2. Full responsive pass (mobile/tablet/desktop) per page
3. Lighthouse performance + accessibility audit per page, with target scores from the 
   gap analysis (LCP < 2.0s, INP < 100ms, CLS < 0.05, WCAG 2.2 AA)
4. SEO meta/schema audit per page (Product, Place, RealEstateAgent structured data; 
   localized directory routes like `/rent/2-bhk-flats-in-mumbai`)
5. Final content/copy consistency pass

Let me know if you'd like me to write out that Final QA batch as the same kind of 
atomic prompt set.
