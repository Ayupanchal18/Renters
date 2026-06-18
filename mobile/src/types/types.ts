/* ─── API Response Wrappers ──────────────────────────────── */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchPaginatedData<T> {
  searchResultData: T[];
  message?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ─── User ───────────────────────────────────────────────── */

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  userType?: "buyer" | "seller" | "agent";
  role?: string;
  avatar?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  verified?: boolean;
  isVerified?: boolean;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
  createdAt?: string;
  privacyPolicyAcceptedAt?: string;
  termsAcceptedAt?: string;
  bio?: string;
  authProvider?: string;
  privacySettings?: {
    communications?: {
      pushNotifications?: boolean;
    };
  };
}

/* ─── Auth ────────────────────────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  userType?: "buyer" | "seller" | "agent";
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  refreshToken?: string;
  mustChangePassword?: boolean;
}

export interface RefreshResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
}

/* ─── Property ────────────────────────────────────────────── */

export interface Property {
  _id: string;
  listingType: "rent" | "buy";
  listingNumber?: string;
  slug?: string;
  urlPath?: string;

  // Core
  category: "room" | "flat" | "house" | "pg" | "hostel" | "commercial";
  title: string;
  propertyType: string;
  description?: string;
  furnishing: "unfurnished" | "semi" | "fully";
  availableFrom: string;
  city: string;
  address: string;
  mapLocation?: string;
  locality?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };

  // Rent-specific
  monthlyRent?: number;
  securityDeposit?: number;
  maintenanceCharge?: number;
  rentNegotiable?: boolean;
  preferredTenants?: "family" | "bachelor" | "any";
  leaseDuration?: string;

  // Buy-specific
  sellingPrice?: number;
  pricePerSqft?: number;
  possessionStatus?: "ready" | "under_construction" | "resale";
  bookingAmount?: number;
  loanAvailable?: boolean;

  // Room specific
  roomType?: string;
  bathroomType?: string;
  kitchenAvailable?: boolean;

  // Dimensions
  builtUpArea?: number | null;
  carpetArea?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  balconies?: number | null;
  floorNumber?: number | null;
  totalFloors?: number | null;
  facingDirection?: string;
  parking?: string;
  propertyAge?: string;

  // Extras
  amenities?: string[];
  photos?: string[];
  shortUrl?: string;

  // Owner
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerType?: "owner" | "agent" | "builder";

  // Status & metrics
  status?: string;
  views?: number;
  favoritesCount?: number;
  featured?: boolean;
  verified?: boolean;
  verificationStatus?: string;
  negotiable?: boolean;

  createdAt?: string;
  updatedAt?: string;

  // Virtual Tour
  virtualTour?: {
    type: "matterport" | "panorama_360" | "video" | "none";
    matterportUrl?: string;
    panoramaImages?: Array<{ url: string; label: string } | string>;
    videoUrl?: string;
  };
}

/* ─── Wishlist ─────────────────────────────────────────────── */

export interface WishlistItem {
  _id: string;
  user: string;
  property: Property;
  createdAt?: string;
}

/* ─── Listing Filters ──────────────────────────────────────── */

export interface ListingFilters {
  city?: string;
  category?: string;
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  furnishing?: string;
  preferredTenants?: string;
  possessionStatus?: string;
  loanAvailable?: boolean;
  verified?: boolean;
  amenities?: string;
  sort?: string;
  q?: string;
}
