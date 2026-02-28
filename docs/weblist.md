# Web Application Pages List

Based on the routing configuration in [client/src/App.jsx](file:///d:/portfolio_Projects/Renters/client/src/App.jsx), here is an in-depth, complete list of all the pages available in the web application.

## 1. Public Pages (Accessible to everyone)
These pages do not require the user to be logged in.

| Route | Component | Purpose |
| :--- | :--- | :--- |
| `/` | `Index` | The main landing/home page of the application. |
| `/listings` | `Listings` | A general view for property listings. |
| `/rent-properties` | `RentListings` | A view specifically tailored for properties available for rent. |
| `/buy-properties` | `BuyListings` | A view specifically tailored for properties available to buy. |
| `/rent/:slug` | `RentPropertyDetail` | Detailed view of a specific rental property. |
| `/buy/:slug` | `BuyPropertyDetail` | Detailed view of a specific property for sale. |
| `/properties/:slug` | `Property` | A fallback or generic detail view for a property. |
| `/property/:slug` | `PropertyRedirect` | A utility page that likely redirects the user to the specific rent/buy property detail page. |
| `/search` | `SearchResults` | Displays the results of user search queries. |
| `/login` | `Login` | User authentication login page. |
| `/signup` | `Signup` | User registration page. |
| `/about` | `About` | Company/platform informational page. |
| `/contact` | `Contact` | Contact form/details page. |
| `/faqs` | `FAQs` | Frequently Asked Questions. |
| `/blog` | `Blog` | Main blog directory/listing page. |
| `/blog/:slug` | `BlogPost` | Detailed view for an individual blog article. |
| `/privacy-policy`| `Privacy` | Privacy policy documentation. |
| `/terms` | `Terms` | Terms of service documentation. |
| `/coming-soon` | `ComingSoon` | Teaser page for unreleased features. |
| `/maintenance` | `Maintenance` | Placeholder page used during app downtime/maintenance. |

## 2. Protected Pages (Requires Authentication)
These pages require the user to be logged in to a valid standard account.

| Route | Component | Purpose |
| :--- | :--- | :--- |
| `/post-property` | `PostProperty` | Form to create a new property listing. |
| `/dashboard` | `Dashboard` | The primary dashboard for a logged-in user to manage their account. |
| `/wishlist` | `Wishlist` | A list of properties the user has saved or favorited. |
| `/messages` | `Messages` | Inbox or messaging interface for communicating. |
| `/notifications` | `Notifications`| A central place for the user to view their alerts. |

## 3. Administrator Pages (Requires Admin Role)
These pages are locked behind elevated privileges and manage the operations of the application. All reside within the `/admin` prefix.

| Route | Component | Purpose |
| :--- | :--- | :--- |
| `/admin` & `/admin/overview` | `AdminOverview` | Main summary dashboard for administrators. |
| `/admin/monitoring` | `AdminDashboard` | Real-time system monitoring and health dashboard. |
| `/admin/users` | `UserManagement` | Interface to view, edit, ban, or manage user accounts. |
| `/admin/properties` | `PropertyManagement` | Interface to approve, edit, or remove property listings. |
| `/admin/locations` | `LocationManagement` | Manage supported areas, neighborhoods, or cities. |
| `/admin/categories` | `CategoryManagement` | Manage property types and categorizations. |
| `/admin/content` | `ContentManagement` | CMS tools to update static text, blogs, or site copy. |
| `/admin/notifications` | `NotificationManagement`| Tool to send global alerts or manage system notifications. |
| `/admin/reviews` | `ReviewModeration` | Interface to moderate feedback and property reviews. |
| `/admin/testimonials` | `TestimonialManagement` | Manage reviews showcased on the main/public pages. |
| `/admin/settings` | `SystemSettings` | Global configuration and application toggles. |
| `/admin/reports` | `Reports` | View generated metrics, analytics, and business reports. |
| `/admin/audit-logs` | `AuditLogs` | Security logs tracking administrative or sensitive actions. |

## 4. System / Fallback Pages
| Route | Component | Purpose |
| :--- | :--- | :--- |
| `*` (Any unmatched route)| `NotFound` | The default 404 "Page Not Found" screen. |

