export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;

  // Tab shell (contains bottom tabs)
  MainTabs: undefined;

  // Tab screens (used as targets for navigate from within tabs)
  HomeTab: undefined;
  Listings: { type?: "rent" | "buy"; initialFilters?: any };
  WishlistTab: undefined;
  ProfileTab: undefined;

  // Detail screens (pushed on top of tabs)
  PropertyDetail: { identifier: string; type: "rent" | "buy" };
  
  // Content & Info screens
  About: undefined;
  FAQ: undefined;
  Contact: undefined;
  
  // Profile Additions
  Messages: { conversationId?: string };
  Notifications: undefined;
  PostProperty: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  ChangePhone: undefined;
  DeleteAccount: undefined;
  Legal: undefined;
  OTPVerification: { type: "email" | "phone"; contact: string };
};

// Utility for useNavigation typing
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
