# Renters — Shared Codebase Audit Report (React Web & React Native)

This report audits the monorepo architecture and outlines the candidates for shared code extraction between the React Web Application (`client`) and the React Native Mobile App (`mobile`), as part of the React Native porting plan.

---

## 1. Monorepo workspace tool & current package layout

### Current Repository Layout
Renters does not use a strict monorepo package orchestration tool like Turborepo or Nx. Instead, it is organized as a **multi-project directory setup**:
* `client/` - React SPA web frontend, managed via Vite.
* `server/` - Express API backend server, connected directly to MongoDB.
* `shared/` - A shared directory at the root, holding logic shared via path mapping.
* `mobile/` - React Native (Expo) mobile client.

### Dependency Management
* Web (`client`) and backend (`server`) share the root `package.json` for package dependencies and run scripts (e.g. `pnpm dev`, `pnpm build`, etc.).
* Mobile (`mobile`) maintains a separate `package.json` in the `mobile/` subdirectory.
* Multi-project execution: The root `package.json` provides scripts to manage mobile development by running `pnpm --dir mobile <command>`.

---

## 2. Existing shared code between Web and Mobile

### Current Shared Items
Currently, the shared files are located in the `/shared` folder at the root:
1. [shared/api.js](file:///d:/portfolio_Projects/Renters/shared/api.js): A placeholder script defining a `DemoResponse` schema.
2. [shared/propertyTypes.js](file:///d:/portfolio_Projects/Renters/shared/propertyTypes.js): Contains enum objects, display labels, filter fields, and location arrays (e.g., `LISTING_TYPES`, `PROPERTY_CATEGORIES`, `FURNISHING_OPTIONS`, `INDIAN_STATES`, `LOCK_IN_PERIODS`, etc.).

### Current Resolution
* **Web Client**: Resolves `./shared/*` paths using the `@shared/*` alias defined in [vite.config.js](file:///d:/portfolio_Projects/Renters/vite.config.js#L74) and [tsconfig-js.json](file:///d:/portfolio_Projects/Renters/tsconfig-js.json#L14).
* **Backend Server**: References files in `shared` using relative paths (e.g. `../../shared/propertyTypes.js`).
* **Mobile Client**: Currently does **not** import from the root `/shared` folder. Instead, it contains duplicated copies of enums, arrays, and types inside `mobile/src/types/types.ts` and listings drawers.

---

## 3. Candidates for Shared Logic Migration

The following framework-agnostic logic from the web client can be migrated to a unified shared core package:

### 3.1. TypeScript Types & Interfaces
Consolidate properties, user models, bookings, documents, and messages:
* Move types from [mobile/src/types/types.ts](file:///d:/portfolio_Projects/Renters/mobile/src/types/types.ts) to the shared core, making them accessible to both web (via type checking/JSDoc or TS transition) and mobile.

### 3.2. Validation Schemas & Helpers
Validate forms client-side and server-side:
* [wizardValidation.js](file:///d:/portfolio_Projects/Renters/client/src/utils/wizardValidation.js): Contains `validateStep`, `validateFieldInline`, `calculateQualityScore` (listing quality index, 0-100), and phone/email/pincode format checks.
* [passwordValidation.js](file:///d:/portfolio_Projects/Renters/client/src/utils/passwordValidation.js): Strength validation (`validatePasswordStrength`), common password blacklist checking, and random password generator (`generateStrongPassword`).

### 3.3. Business & Calculator Logic
* **EMI Calculator Function**: The core mathematical calculation formula `calculateEMI(principal, annualRate, tenureYears)` inside [EmiCalculator.jsx](file:///d:/portfolio_Projects/Renters/client/src/components/EmiCalculator.jsx#L37) should be separated from components and shared.
* **Location & Geotag Parsing**: The reverse-geocoding, distance helpers, and geocoding response standardizers in [locationStandardization.js](file:///d:/portfolio_Projects/Renters/client/src/utils/locationStandardization.js).

### 3.4. Constants
* **Property Constants**: Migrate enums in [propertyTypes.js](file:///d:/portfolio_Projects/Renters/shared/propertyTypes.js) to the new package.
* **Chat Templates**: Hardcoded chat template strings in web client message views can be consolidated.

---

## 4. Proposed shared-core package layout

To prevent code duplication and establish clean exports, we propose moving candidate files into a unified structure under `/packages/shared-core` (or restructuring the root `/shared` directory). Given the existing alias resolution of `@shared`, renaming or converting the root `/shared` folder to a structured package is recommended.

```
shared/                    # Consolidated shared folder / package
├── api.js                # API configurations/response placeholders
├── propertyTypes.js      # Existing enums, states, options constants
├── types/                # Unified TypeScript type definitions
│   └── index.ts          # Property, User, Booking, Message definitions
├── utils/                # Pure framework-agnostic utility functions
│   ├── emi.js            # calculateEMI formula
│   ├── time.js           # getRelativeTimeString, getShortRelativeTime
│   └── location.js       # standardizeLocationData, normalizeLocationData
└── validation/           # Form and field validation logics
    ├── wizard.js         # validateStep and validateFieldInline
    └── password.js       # validatePasswordStrength
```

### Path Resolution
* **Web Client & Backend**: Update path alias mapping to import types and utilities from `@shared/utils/...` and `@shared/validation/...` instead of local files.
* **Mobile Client**: Configure Metro and TypeScript in `mobile/` to resolve `@shared` pointing to the root `/shared` directory. This allows mobile to import enums, validation functions, and type interfaces directly from the shared core.
