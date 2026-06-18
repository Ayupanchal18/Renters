# Premium Redesign Execution Plan

This execution plan provides a series of atomic, independent prompts that can be run sequentially in the IDE to overhaul the **Renters** platform into a premium, modern, high-performance real-estate marketplace. 

---

## 1. GLOBAL FOUNDATION TASKS (Do These FIRST)

### Prompt 1.1 — Establish Design Tokens System
*   **Files to touch:** [global.css](file:///d:/portfolio_Projects/Renters/client/src/global.css) and [tailwind.config.ts](file:///d:/portfolio_Projects/Renters/tailwind.config.ts)
*   **Exact desired outcome:** 
    Define and refactor all design tokens in `global.css` using a standardized prefix (`--rt-sys-*`) for cohesive styling. Establish variables for:
    - **Colors:** Primary (Royal Indigo HSL/OKLCH), Secondary (Coral HSL/OKLCH), Muted/Foreground, Slate Backgrounds.
    - **Typography:** Custom fluid font sizes (`--rt-sys-text-sm` to `--rt-sys-text-2xl` using `clamp()`).
    - **Spacing:** Fluid margins/paddings (`--rt-sys-spacing-sm` to `--rt-sys-spacing-2xl`).
    - **Borders & Radii:** Rounded cards/inputs (`--rt-sys-radius-sm` to `--rt-sys-radius-xl` based on a base `--rt-sys-radius: 0.625rem`).
    - **Shadows:** Standard soft shadow tokens and a primary glow effect (`--rt-sys-shadow-glow`).
    - **Theme:** Extend the tailwind config to map these CSS custom variables under the extended theme colors, spacing, borderRadius, and shadows.
*   **Constraints:**
    - Do not delete existing compatibility variables (e.g. `--background`, `--primary`, `--muted-foreground`) to avoid breaking existing pages that are not yet redesigned.
    - Ensure HSL values remain space-separated (e.g., `228 100% 58%`) for Tailwind opacity modifiers (like `bg-primary/20`) to work correctly.
*   **Verify by:**
    1. Run `pnpm typecheck` to verify Tailwind configuration types.
    2. Check that the client builds successfully (`pnpm build`).
    3. Inspect the CSS variables list in the browser DevTools to ensure they resolve with the correct values in both light and dark modes.

---

### Prompt 1.2 — Building and Upgrading Shared Component Library
*   **Files to touch:** 
    - [button.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/ui/button.jsx)
    - [card.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/ui/card.jsx)
    - [input.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/ui/input.jsx)
    - [select.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/ui/select.jsx)
    - [dialog.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/ui/dialog.jsx)
*   **Exact desired outcome:**
    Refactor components in `client/src/components/ui/` to utilize the new design tokens. Ensure buttons feature subtle scaling animations on click/hover (`active:scale-95 transition-all duration-fast`), input and select boxes utilize theme-appropriate borders, and cards support glassmorphism overlays (`.glass` custom styling) with soft glow shadows. Add clear focus-visible states (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`).
*   **Constraints:**
    - Do not alter the component signature props or API interfaces (e.g., retain standard `className` merges using the `cn()` utility).
    - Ensure all components are fully backward compatible with the current codebase references.
*   **Verify by:**
    1. Run `pnpm test` (or existing component tests if any).
    2. View the `/login` or `/signup` page to inspect upgraded buttons/inputs visually, verifying correct styling, focus rings, and hover transitions.

---

### Prompt 1.3 — Dark Mode & Theme Switcher Refactoring
*   **Files to touch:** 
    - [ThemeContext.jsx](file:///d:/portfolio_Projects/Renters/client/src/context/ThemeContext.jsx)
    - [theme-toggle.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/ui/theme-toggle.jsx)
    - [global.css](file:///d:/portfolio_Projects/Renters/client/src/global.css)
*   **Exact desired outcome:**
    Refactor theme switching logic to support the Web View Transitions API for a smooth morphing animation on theme toggle. Configure scrollbars across the application inside `global.css` using `scrollbar-color: var(--muted-foreground) var(--muted)` and webkit scrollbar directives to automatically adapt color styling in dark mode. 
*   **Constraints:**
    - Fallback gracefully in browsers that do not support the `document.startViewTransition` API.
    - Persist theme preferences correctly in `localStorage` under the key `'theme'`.
*   **Verify by:**
    1. Click the theme switcher button on the page.
    2. Verify a visual crossfade animation occurs.
    3. Open a page with an overflow container (e.g., admin sidebar or lists) and check that the scrollbar track/thumb matches the active dark or light theme colors.

---

### Prompt 1.4 — Global Motion & Animation Utilities
*   **Files to touch:**
    - [global.css](file:///d:/portfolio_Projects/Renters/client/src/global.css)
    - [tailwind.config.ts](file:///d:/portfolio_Projects/Renters/tailwind.config.ts)
*   **Exact desired outcome:**
    Create a set of utility classes for unified page transitions and element animations:
    - **Page Fade:** Slide-up and fade-in utility (`.animate-page-enter`) to transition route entries smoothly.
    - **Hover Pop:** Subtle scale-up classes for card listings.
    - **Skeleton Wave:** Unified skeleton loader animations for data fetching.
    - Configure timing tokens (`--rt-sys-duration-normal: 200ms`, etc.) in `global.css` and map them to Tailwind transition classes.
*   **Constraints:**
    - Respect user preference for reduced motion (`@media (prefers-reduced-motion: reduce)`) by disabling scaling animations and shortening fade durations to 0s.
*   **Verify by:**
    1. Apply the entry transition to the home page wrapper.
    2. Toggle responsive views or navigate pages to check that the layout shifts enter with a clean transition without flashes.

---

### Prompt 1.5 — Global SEO, Sitemap, and Schema Configuration
*   **Files to touch:**
    - [SEOHead.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/seo/SEOHead.jsx)
    - [JsonLd.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/seo/JsonLd.jsx)
    - [sitemap.js](file:///d:/portfolio_Projects/Renters/server/routes/sitemap.js)
    - [robots.txt](file:///d:/portfolio_Projects/Renters/client/public/robots.txt)
*   **Exact desired outcome:**
    Fix sitemap routing issues by ensuring all dynamic properties slugs (`/rent/:slug` and `/buy/:slug`) are included in `/sitemap.xml`. Add Open Graph images meta tag fallbacks in `<SEOHead>` using the default application brand logo if a listing has no image. In `<JsonLd>`, implement structured schema generator functions for both `Product` (real-estate list details) and `RealEstateAgent` configurations.
*   **Constraints:**
    - Avoid breaking backend routes, keep dynamic database queries inside `sitemap.js` safe and performant (e.g., only select slug fields and update timestamps, limits to first 50,000 links).
*   **Verify by:**
    1. Access `http://localhost:8080/sitemap.xml` in your browser.
    2. Verify it displays valid XML structure containing both static links and seeded property slugs.
    3. Validate schema structures using a JSON-LD linter output check.

---

### Prompt 1.6 — Performance Pipeline & Asset Deferment Setup
*   **Files to touch:**
    - [lazy-image.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/ui/lazy-image.jsx)
    - [App.jsx](file:///d:/portfolio_Projects/Renters/client/src/App.jsx)
*   **Exact desired outcome:**
    Refactor `<LazyImage>` to support automatic client-side canvas transformations or responsive source fallback setups (handling WebP/AVIF detection where applicable). Update [App.jsx](file:///d:/portfolio_Projects/Renters/client/src/App.jsx) routes to use standard code-splitting (`React.lazy`) for non-critical routes (such as FAQs, About, Admin monitoring, and settings pages) with a smooth skeleton fallback.
*   **Constraints:**
    - Ensure lazy components do not cause layout shifts (CLS) when loading in. Keep width and height placeholders constrained.
*   **Verify by:**
    1. Inspect the Network tab in browser DevTools.
    2. Navigate to `/about` or `/faqs` and check that the chunk bundle file is fetched on demand, rather than bundled in the primary initial main page request.

---

### Prompt 1.7 — Accessibility & Keyboard Navigation Baseline
*   **Files to touch:**
    - [Navbar.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/Navbar.jsx)
    - [main-content.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/ui/main-content.jsx)
*   **Exact desired outcome:**
    Audit and upgrade accessibility layers. Ensure the navigation header features full keyboard accessibility:
    - Support tab-key navigation through menu headers and list dropdowns.
    - Toggle submenu drawers using standard accessibility markers (`aria-expanded`, `aria-haspopup`).
    - Connect the `<SkipNavLink>` dynamically to lock onto target `#main-content` containers, bypassing navigation tabs.
*   **Constraints:**
    - Maintain visual focus styling (`outline-none ring-2 ring-primary`) across all interactive tags without breaking styling alignment.
*   **Verify by:**
    1. Navigate the entire navbar using only `Tab` and `Shift+Tab`.
    2. Press `Enter` on menu links to ensure they open and focus moves correctly to their sub-items.

---

## 2. PAGE-BY-PAGE EXECUTION PROMPTS

### Task 2.1 — Page: Home (`/`) → Navbar Redesign
**Files:** [Navbar.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/Navbar.jsx)  
**Current state:** Navbar uses a basic grid layout with simple link menus. Nav links can look low-contrast on light background states.  
**Target state:** Premium floating navbar featuring glassmorphic overlay, smooth slide-down hover indicators, animated user menu dropdown, and a highly accessible dark-mode toggle switch.  
**Steps:**
1. Apply standard backdrop-filter (`.glass` styling with custom borders) and sticky top-0 parameters to the primary wrapper.
2. Upgrade menu dropdown wrappers using Radix primitives with CSS transition hooks.
3. Replace custom dark mode switcher with the refactored View-Transition toggle component.
**New dependencies:** None.  
**Acceptance criteria:**
*   Navbar has a fluid layout that fits matches mobile, tablet, and desktop views.
*   Menu background remains readable over high-contrast or highly detailed hero images.  
**Do not break:** User authentication state displays (Avatar vs Login/Signup buttons), notification bells, and messages badge count indicators.

---

### Task 2.2 — Page: Home (`/`) → Hero & Search Card Overhaul
**Files:** [Index.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Index.jsx)  
**Current state:** Contains basic text headers with a plain search box. Location geolocator is simple text and category toggles are buttons.  
**Target state:** Premium wide hero section with a smooth gradient background mask, floating location suggestions, GPS location spinner feedback, and custom autocomplete lists.  
**Steps:**
1. Restructure the search card into a sleek floating layout using the upgraded Design System cards.
2. Animate the primary hero tagline elements on mount using entry transitions.
3. Connect the geolocation callback to display a smooth spinner loading animation on the input area during address lookup.
**New dependencies:** None.  
**Acceptance criteria:**
*   Address search field renders dynamic, scroll-overflowing autocomplete lists.
*   The layout drops down to single-column inputs under mobile viewports.  
**Do not break:** Geolocation API callbacks or the "Rent/Buy" search redirect action bindings.

---

### Task 2.3 — Page: Home (`/`) → Counter Stats & City Grid Redesign
**Files:** [Index.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Index.jsx)  
**Current state:** Stats numbers are static texts. City blocks are static cards with generic styles.  
**Target state:** Interactive scroll-triggered counters and a masonry hover-interactive city grid.  
**Steps:**
1. Implement a lightweight count-up hook using `requestAnimationFrame` to animate counter milestones when scrolling into view.
2. Redesign the city links grid: apply custom zoom hover scales (`hover:scale-105 transition-transform`) and title text overlays.
**New dependencies:** None.  
**Acceptance criteria:**
*   Counter components start counting only when visible in the browser viewport.
*   City tiles have a consistent responsive grid layout (1 col on mobile, 2 on tablet, 4 on desktop).  
**Do not break:** City link redirects.

---

### Task 2.4 — Page: Home (`/`) → Testimonials Carousel Redesign
**Files:** [Index.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Index.jsx)  
**Current state:** Text items auto-rotate in a raw loop container.  
**Target state:** A responsive testimonials carousel featuring drag gestures, visual pagination dots, and layout adjustments for various devices.  
**Steps:**
1. Build a custom carousel container using Framer Motion (or simple CSS transitions) with drag/swipe listeners.
2. Design cards with premium elements (floating quote marks, user image avatars, star ratings).
**New dependencies:** None.  
**Acceptance criteria:**
*   User can swipe/drag cards on mobile viewports.
*   Pagination indicators sync in real-time.  
**Do not break:** Existing user reviews content rendering from the `/api/testimonials` endpoint.

---

### Task 2.5 — Page: Listings (`/listings`) → Interactive Listing Hub
**Files:** [Listings.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Listings.jsx)  
**Current state:** Renders static search listings with limited visual structures.  
**Target state:** A dual listing routing center directing traffic cleanly into dedicated `/rent-properties` or `/buy-properties` paths using clean animated cards.  
**Steps:**
1. Design visual cards dividing the "Rent a Home" and "Buy a Home" options with premium illustrations and quick tags.
2. Include search counters displaying dynamic totals for both rentals and sales.
**New dependencies:** None.  
**Acceptance criteria:**
*   Clicking cards triggers a smooth page transition.
*   Responsive grid handles narrow mobile dimensions without overlapping text labels.  
**Do not break:** Active listings filter counters.

---

### Task 2.6 — Page: Listings (Rent/Buy) → Side-by-Side Split Map Layout
**Files:** 
- [RentListings.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/RentListings.jsx)
- [BuyListings.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/BuyListings.jsx)  
**Current state:** Traditional grid where listings cards and leaflet maps stack or flow arbitrarily, leading to bad layout issues on large monitors.  
**Target state:** Sticky split viewport layout (Left 50%: Scrollable listings cards with filter controls; Right 50%: Sticky, viewport-locked interactive map).  
**Steps:**
1. Wrap page main frames in a viewport-constrained layout: `h-[calc(100vh-4rem)] overflow-hidden`.
2. Wrap the lists panel on the left with `overflow-y-auto` and custom scrollbar styles.
3. Lock the Leaflet map panel on the right with `sticky top-0 h-full w-full`.
**New dependencies:** None.  
**Acceptance criteria:**
*   On mobile screens, collapse split viewport into a single pane (listings visible by default, with a floating "Show Map" button toggle).
*   Left list scrolling behaves independently without affecting the footer or navbar boundaries.  
**Do not break:** Map coordinates bindings, listing counts, or filter parameters query.

---

### Task 2.7 — Page: Listings (Rent/Buy) → Leaflet Marker Clustering Integration
**Files:** 
- [RentListings.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/RentListings.jsx)
- [BuyListings.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/BuyListings.jsx)  
**Current state:** Map markers overlaps when multiple listings occupy the same city region.  
**Target state:** Clean Leaflet marker clustering grouping nearby items. Clicking groups zooms and splits pins.  
**Steps:**
1. Install marker clustering wrapper libraries compatible with current React-Leaflet configuration.
2. Wrap listing coordinate pins with the clustered component.
3. Highlight corresponding list cards when a user hovers a map pin.
**New dependencies:** `react-leaflet-markercluster` or `leaflet.markercluster` plus types.  
**Acceptance criteria:**
*   Cluster indicators display with color categories based on marker densities.
*   Marker icons display custom brand markers matching the design system colors.  
**Do not break:** Click callbacks on markers which display property details tooltips.

---

### Task 2.8 — Page: Property Details (`/rent/:slug` & `/buy/:slug`) → Gallery Grid & Header
**Files:** 
- [RentPropertyDetail.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/RentPropertyDetail.jsx)
- [BuyPropertyDetail.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/BuyPropertyDetail.jsx)  
**Current state:** Simple photo lists or masonry blocks without interaction.  
**Target state:** Interactive photo lightbox gallery grid with quick-access badges (e.g. "Verified Listing", "Price Reduced").  
**Steps:**
1. Restructure listing details header: add status badges and floating CTA buttons.
2. Build an interactive gallery grid where clicking images opens a modal lightbox slider.
**New dependencies:** None.  
**Acceptance criteria:**
*   Lightbox supports arrow keys for navigation and `ESC` to close.
*   Gallery grid layout adapts from mobile sizes (single banner) to desktop formats (masonry grid).  
**Do not break:** Save-to-wishlist triggers.

---

### Task 2.9 — Page: Property Details (Rent) → Visit Scheduler Widget
**Files:** [RentPropertyDetail.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/RentPropertyDetail.jsx)  
**Current state:** Inquiry leads are handled by standard form inputs.  
**Target state:** Dedicated scheduling component allowing tenants to book visit inspection slots.  
**Steps:**
1. Import standard `react-day-picker` components to construct a calendar slot selection card.
2. Generate booking slot rows (e.g., "10:00 AM", "2:00 PM") based on calendar date clicks.
3. Transmit calendar entries through direct APIs (`POST /api/conversations`) as a visual scheduling message.
**New dependencies:** `react-day-picker` and `date-fns`.  
**Acceptance criteria:**
*   Schedules must restrict picking past dates.
*   Booking configurations automatically display loading states during submission.  
**Do not break:** Text inquiry message flow.

---

### Task 2.10 — Page: Property Details (Buy) → EMI Calculator Widget
**Files:** [BuyPropertyDetail.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/BuyPropertyDetail.jsx)  
**Current state:** No loan calculations.  
**Target state:** Interactive mortgage and EMI estimation slider tool.  
**Steps:**
1. Build an inline mathematical calculator component inside the listing details sidebar.
2. Add input range sliders for Home Price, Down Payment percentage, Interest Rate, and Loan Tenure (Years).
3. Compute monthly EMI values and render them in a breakdown chart (using custom styling).
**New dependencies:** None.  
**Acceptance criteria:**
*   Sliders support direct manual key entries.
*   EMI output recalculates on every slider change.  
**Do not break:** Base purchase leads forms.

---

### Task 2.11 — Page: Property Details (Rent/Buy) → Neighborhood Analytics Widget
**Files:** 
- [RentPropertyDetail.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/RentPropertyDetail.jsx)
- [BuyPropertyDetail.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/BuyPropertyDetail.jsx)  
**Current state:** Page only displays standard coordinates maps.  
**Target state:** Analytics display representing Neighborhood Scores (Walkability, Transit, Amenities distance).  
**Steps:**
1. Construct score rings (0 to 100) using circular SVG indicator paths.
2. Fetch walkability ratings or display mock estimations based on coordinates.
3. Render distances to nearby amenities (Metro, Schools, Grocery) in a list layout.
**New dependencies:** None.  
**Acceptance criteria:**
*   Visual score rings render smooth SVG transitions.
*   All data displays correct accessible text labels.  
**Do not break:** Standard maps elements loading below the analytics.

---

### Task 2.12 — Page: Property Detail Redirects → Redirect Routing Overhaul
**Files:** 
- [Property.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Property.jsx)
- [PropertyRedirect.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/PropertyRedirect.jsx)  
**Current state:** Redirection files have basic redirection handlers, which might flash or load slowly.  
**Target state:** Seamless redirection wrapper featuring animated fallback indicators and pre-fetching capabilities.  
**Steps:**
1. Upgrade slug routing checks inside redirect files.
2. Pre-fetch property parameters during redirection steps using standard client actions.
3. In case of invalid routes, handle errors gracefully with a user-friendly fallback page redirect.
**New dependencies:** None.  
**Acceptance criteria:**
*   Redirect happens instantly without leaving visual layout glitches on screen.
*   Correct `301/302` mock flags apply where necessary.  
**Do not break:** Search index engine indexing capabilities.

---

### Task 2.13 — Page: Search Results (`/search`) → Search View & Filters
**Files:** [SearchResults.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/SearchResults.jsx)  
**Current state:** Renders lists corresponding to queries, without details filters.  
**Target state:** Multi-filter navigation layout featuring advanced categories.  
**Steps:**
1. Build a responsive filters drawer (price slides, category checkboxes, layout configurations).
2. Highlight query terms inside listing titles and card summaries.
**New dependencies:** None.  
**Acceptance criteria:**
*   Filter selections update results instantly without full-page reloads.
*   Visual "No Results Found" page displays smart suggestions in case of empty lookups.  
**Do not break:** URL parameters syncing when sharing search results pages.

---

### Task 2.14 — Page: Direct Chat (`/messages`) → Rich Messaging Overhaul
**Files:** [Messages.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Messages.jsx)  
**Current state:** Supports only simple text strings inside message input textareas.  
**Target state:** Premium messenger UI supporting file attachments, inline schedule cards, and loading updates.  
**Steps:**
1. Add attachment file selection handles inside the message inputs area.
2. Connect file changes to transmit documents via upload APIs (`POST /api/upload`).
3. Render rich indicators (e.g., photo previews, PDF link tags) directly in the chat bubbles.
**New dependencies:** None.  
**Acceptance criteria:**
*   Attachments up to 5MB load with visual status indicators.
*   Chat window scrolls down automatically on message delivery.  
**Do not break:** WebSockets direct text transmissions.

---

### Task 2.15 — Page: Post Property (`/post-property`) → Wizard Redesign
**Files:** [PostProperty.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/PostProperty.jsx)  
**Current state:** Form flows in a single long scroll view.  
**Target state:** Structured multi-step setup form (Details -> Location -> Media -> Review).  
**Steps:**
1. Refactor pages to render custom progress lines at the top.
2. Group form fields into dedicated containers.
3. Include client-side image compression capabilities inside the media upload zones.
**New dependencies:** None.  
**Acceptance criteria:**
*   Form validation blocks going forward if inputs on the active step contain errors.
*   Form values persist when navigating back to previous steps.  
**Do not break:** Submitting payloads to dynamic backend endpoints.

---

### Task 2.16 — Page: User Dashboard (`/dashboard`) → Document Vault Manager
**Files:** [Dashboard.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Dashboard.jsx)  
**Current state:** Standard details inputs without verified document hubs.  
**Target state:** "Document Vault" sub-tab managing credential attachments (IDs, Proofs, Pay slips).  
**Steps:**
1. Construct dedicated dashboard sub-menus.
2. Integrate drag-and-drop handles for secure file uploads.
3. Present lists of uploaded credentials with verification status chips.
**New dependencies:** None.  
**Acceptance criteria:**
*   Files are validated for secure mime-types (PDF, JPEG, PNG).
*   Actions (download, delete) trigger correct confirmation dialogs.  
**Do not break:** User details forms.

---

### Task 2.17 — Page: Wishlist (`/wishlist`) → Grid Overhaul
**Files:** [Wishlist.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Wishlist.jsx)  
**Current state:** Basic cards displaying saved properties.  
**Target state:** Drag-to-sort grid with price alerts configuration.  
**Steps:**
1. Upgrade layout cards to include dynamic inline "Remove from Wishlist" transitions.
2. Implement custom toast alert feeds showing price changes on wishlist items.
**New dependencies:** None.  
**Acceptance criteria:**
*   Removing items triggers custom fade-out animations.
*   Grid maintains responsive layouts matching listing hubs.  
**Do not break:** Wishlist persistent synchronization.

---

### Task 2.18 — Page: Notifications (`/notifications`) → Custom Alerts
**Files:** [Notifications.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Notifications.jsx)  
**Current state:** Simple lists showing notification titles.  
**Target state:** Rich status dashboard where notifications are categorised by type (Transactions, Chat, General alerts) with inline actions.  
**Steps:**
1. Group alerts into tabs.
2. Design custom list items featuring visual badge colors.
3. Connect "Mark all as read" API callbacks.
**New dependencies:** None.  
**Acceptance criteria:**
*   Alert actions (e.g. "View Message") redirect correctly.
*   Notifications display relative time counters (e.g. "5 mins ago").  
**Do not break:** Server notifications counts.

---

### Task 2.19 — Pages: Auth (Login/Signup) → Portal Redesign
**Files:** 
- [Login.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Login.jsx)
- [Signup.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Signup.jsx)  
**Current state:** Simple forms with standard input designs.  
**Target state:** Dual-pane layout featuring visual sideboards and smooth transition animations.  
**Steps:**
1. Redesign forms using cards from the upgraded Design System.
2. Add password strength meters to the sign-up page.
3. Implement password visibility toggles (`eye/eye-off` icons).
**New dependencies:** None.  
**Acceptance criteria:**
*   Login page transitions into signup smoothly without full-page reloads.
*   Forms have proper accessible labels and error messages.  
**Do not break:** Backend authentication request hooks.

---

### Task 2.20 — Pages: Informational (About/Contact/FAQs) → Sections Redesign
**Files:** 
- [About.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/About.jsx)
- [Contact.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Contact.jsx)
- [FAQs.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/FAQs.jsx)  
**Current state:** Static layouts.  
**Target state:** Premium visual pages featuring interactive accordions and responsive inquiry forms.  
**Steps:**
1. Restructure FAQs to use Radix accordion panels.
2. Upgrade Contact details: include a contact form with client-side field validation.
3. Style About pages with timeline blocks.
**New dependencies:** None.  
**Acceptance criteria:**
*   Accordion items expand and collapse with smooth slide animations.
*   Contact forms show success feedback message blocks on submission.  
**Do not break:** Public accessibility routing.

---

### Task 2.21 — Pages: Blog & Blog Post (`/blog` & `/blog/:slug`) → Grid & Details
**Files:** 
- [Blog.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Blog.jsx)
- [BlogPost.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/BlogPost.jsx)  
**Current state:** Standard list formats.  
**Target state:** Premium publication grids with rich-text styling and sharing links.  
**Steps:**
1. Upgrade Blog listings cards to showcase tags, read times, and author badges.
2. Add a social share widget to blog details pages.
**New dependencies:** None.  
**Acceptance criteria:**
*   Blog articles render semantic HTML with appropriate line-heights for optimal readability.
*   Responsive spacing scales cleanly across viewports.  
**Do not break:** Article database routes.

---

### Task 2.22 — Pages: Legal (Privacy/Terms) → Interactive Layout
**Files:** 
- [Privacy.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Privacy.jsx)
- [Terms.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Terms.jsx)  
**Current state:** Static long documents.  
**Target state:** Document view with a sticky sidebar table of contents scrollspy.  
**Steps:**
1. Implement a sticky sidebar menu linked to section anchors.
2. Add a scrollspy hook updating active sidebar tags based on scroll position.
**New dependencies:** None.  
**Acceptance criteria:**
*   Clicking sidebar links scrolls smoothly to target section.
*   Scrollspy updates the active tab in the sidebar as you scroll.  
**Do not break:** Legal text updates.

---

### Task 2.23 — Pages: Status (Coming Soon/Maintenance) → Visual Animations
**Files:** 
- [ComingSoon.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/ComingSoon.jsx)
- [Maintenance.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/Maintenance.jsx)  
**Current state:** Simple text pages.  
**Target state:** Rich pages with animations and email registration drawers.  
**Steps:**
1. Embed custom SVG visual loops or animations.
2. Include email registration boxes allowing users to get updates.
**New dependencies:** None.  
**Acceptance criteria:**
*   Visual components adapt to portrait and landscape layouts.
*   Form elements are screen-reader accessible.  
**Do not break:** Standard routing redirects.

---

### Task 2.24 — Admin Area: Layout, Sidebar, & Overview Redesign
**Files:** 
- [AdminSidebar.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/admin/AdminSidebar.jsx)
- [AdminLayout.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/admin/AdminLayout.jsx)
- [AdminOverview.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/AdminOverview.jsx)  
**Current state:** Standard layouts with basic dashboard panels.  
**Target state:** Premium dark sidebar with sticky navigation menus, responsive layout overlays, and a custom metric cards dashboard.  
**Steps:**
1. Restructure navigation menus to use standard active states.
2. Build custom KPI widgets displaying key stats (Revenue, Total users, active posts) using upgraded Design System cards.
**New dependencies:** None.  
**Acceptance criteria:**
*   Layout adapts dynamically between sidebar expansions.
*   Sidebar uses correct custom scrollbars in dark mode.  
**Do not break:** Admin role permissions check filters.

---

### Task 2.25 — Admin Area: Users & Properties Management Panels
**Files:** 
- [UserManagement.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/UserManagement.jsx)
- [PropertyManagement.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/PropertyManagement.jsx)  
**Current state:** Simple tables with minimal layout options.  
**Target state:** Premium management dashboard with advanced filters, actions modals, and status badges.  
**Steps:**
1. Redesign tables using cards from the upgraded Design System.
2. Build action dialogs (e.g., ban user, verify listing) with confirmation modals.
3. Integrate search query bars matching filters.
**New dependencies:** None.  
**Acceptance criteria:**
*   Table layouts adapt to screen size, using custom cards on mobile viewports.
*   Confirmation actions display toast feedback.  
**Do not break:** API data syncs.

---

### Task 2.26 — Admin Area: Locations & Categories Management
**Files:** 
- [LocationManagement.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/LocationManagement.jsx)
- [CategoryManagement.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/CategoryManagement.jsx)  
**Current state:** Text listings with edit actions.  
**Target state:** Interactive management lists featuring visual icons.  
**Steps:**
1. Upgrade input lists to use custom category icons.
2. Implement location mapping visualizations to pinpoint settings.
**New dependencies:** None.  
**Acceptance criteria:**
*   Adding tags updates tables instantly.
*   Actions are screen-reader accessible.  
**Do not break:** Metadata dependencies on listings.

---

### Task 2.27 — Admin Area: Content, Media Library, & Live Monitoring
**Files:** 
- [ContentManagement.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/ContentManagement.jsx)
- [MediaLibrary.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/MediaLibrary.jsx)
- [AdminDashboard.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/AdminDashboard.jsx)  
**Current state:** Renders lists of images, templates, and active server routes.  
**Target state:** Grid media library featuring image cropping, publishing editors, and live WebSocket monitoring logs.  
**Steps:**
1. Refactor MediaLibrary to display file sizes and copy link utilities.
2. Build inline log viewports in AdminDashboard to output live WebSocket streams.
**New dependencies:** None.  
**Acceptance criteria:**
*   Log lists scroll automatically as updates arrive.
*   Copy links functions display toast notices on success.  
**Do not break:** WebSocket notifications contexts.

---

### Task 2.28 — Admin Area: System Notifications & Campaign Planners
**Files:** 
- [NotificationManagement.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/NotificationManagement.jsx)
- [CampaignManagement.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/CampaignManagement.jsx)  
**Current state:** Basic creation boxes.  
**Target state:** Dashboard to schedule campaign releases with visual timing trackers.  
**Steps:**
1. Build step form slots scheduling notification triggers.
2. Display timeline charts representing scheduled distribution times.
**New dependencies:** None.  
**Acceptance criteria:**
*   Schedule pickers block selecting past times.
*   Visual lists show status pills representing campaign completions.  
**Do not break:** Trigger APIs.

---

### Task 2.29 — Admin Area: Moderation, Testimonials, & Settings
**Files:** 
- [ReviewModeration.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/ReviewModeration.jsx)
- [TestimonialManagement.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/TestimonialManagement.jsx)
- [SystemSettings.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/SystemSettings.jsx)  
**Current state:** Text listings.  
**Target state:** Moderation interface with toggle controls.  
**Steps:**
1. Design review boards featuring toggle switches.
2. Build system settings controls using Radix Tabs layouts.
**New dependencies:** None.  
**Acceptance criteria:**
*   Toggling site modes (e.g. Maintenance status) displays warning confirmations.
*   Testimonials are draggable to adjust display order.  
**Do not break:** Config storage routes.

---

### Task 2.30 — Admin Area: Roles, Reports, Conversations, & Analytics
**Files:** 
- [RolePermissions.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/RolePermissions.jsx)
- [Reports.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/Reports.jsx)
- [AuditLogs.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/AuditLogs.jsx)
- [ConversationModeration.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/ConversationModeration.jsx)
- [Analytics.jsx](file:///d:/portfolio_Projects/Renters/client/src/pages/admin/Analytics.jsx)  
**Current state:** Minimal grids.  
**Target state:** Overhauled Analytics system featuring Recharts theme synchronization, permission matrix checklists, and CSV/PDF export handles.  
**Steps:**
1. Connect Recharts grids to update stroke colors dynamically when changing themes.
2. Develop role matrices using checkboxes for actions configuration.
3. Implement file-saver callbacks to export analytics metrics.
**New dependencies:** None.  
**Acceptance criteria:**
*   Charts adapt color palettes during theme toggles without errors.
*   Matrix checkboxes display correct disabled/enabled states.  
**Do not break:** Security checks.

---

## 3. FINAL QA PASS PROMPTS

### Prompt 3.1 — Design System Consistency Pass
*   **Files to touch:** All `.jsx` files in `client/src/pages/` and `client/src/components/`
*   **Exact desired outcome:**
    Audit the entire frontend source code to verify that no hardcoded CSS styles (such as `style={{ color: '#fff' }}`) or ad-hoc Tailwind colors (like `bg-blue-500` or `text-black`) are used. Ensure all layout components resolve styling properties using tokens from `global.css`.
*   **Verify by:**
    1. Inspect page elements using the browser dev tools while toggling theme modes.
    2. Check that layouts maintain consistent background and text colors in both modes.

---

### Prompt 3.2 — Cross-Device Responsive Pass
*   **Files to touch:** All page layout grids
*   **Exact desired outcome:**
    Test layout pages across responsive viewports:
    - **Mobile:** 320px - 480px (Check menus collapse, lists stack, inputs fit).
    - **Tablet:** 768px - 1024px (Check sidebars spacing, grids adapt).
    - **Desktop:** 1200px+ (Check container margins, split layouts).
*   **Verify by:**
    1. Simulate responsiveness using Chrome DevTools.
    2. Ensure no horizontal scrolling occurs on any page.

---

### Prompt 3.3 — Performance & Accessibility Audit
*   **Files to touch:** All page templates
*   **Exact desired outcome:**
    Audit each route using Lighthouse and verify the following minimum scores are met:
    - **Performance:** 90+ (via lazy loading, next-gen images, optimized JS bundles).
    - **Accessibility:** 95+ (via correct contrast ratios, keyboard navigation, and aria labels).
*   **Verify by:**
    1. Run a Lighthouse report on the main routes.
    2. Ensure the generated scores meet the set targets.

---

### Prompt 3.4 — SEO Metadata Pass
*   **Files to touch:** All routes using `<SEOHead>`
*   **Exact desired outcome:**
    Verify that every page has unique, context-aware HTML titles and meta descriptions. Check that dynamic detail pages populate metadata fields correctly using data models.
*   **Verify by:**
    1. Inspect the document `<head>` on various routes.
    2. Check that titles and descriptions change based on the active page context.

---

### Prompt 3.5 — Copy and Call-To-Action (CTA) Audit
*   **Files to touch:** All frontend UI pages
*   **Exact desired outcome:**
    Review all copy, tags, buttons, and placeholder texts to ensure a premium, consistent brand voice. Verify all CTAs (e.g., "Schedule Visit", "Search Properties", "Log In") use clear, action-oriented labeling.
*   **Verify by:**
    1. Review the copy on the site to ensure a consistent, professional brand tone.
    2. Check that buttons navigate users to the correct target URLs.
