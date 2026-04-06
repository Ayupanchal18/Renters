import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft, ArrowRight, Check, ShoppingBag, Home, Building2, MapPin,
  DollarSign, Camera, User, AlertCircle, CheckCircle, Key
} from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import ProtectedScreen from "../../components/auth/ProtectedScreen";
import { apiClient } from "../../api/client";
import * as ImagePicker from "expo-image-picker";

// ─── Types ───────────────────────────────────────────────────
type FormData = {
  listingType: string;
  category: string;
  title: string;
  propertyType: string;
  furnishing: string;
  availableFrom: string;
  city: string;
  address: string;
  monthlyRent: string;
  securityDeposit: string;
  maintenanceCharge: string;
  rentNegotiable: boolean;
  preferredTenants: string;
  leaseDuration: string;
  sellingPrice: string;
  pricePerSqft: string;
  possessionStatus: string;
  bookingAmount: string;
  loanAvailable: boolean;
  builtUpArea: string;
  carpetArea: string;
  bedrooms: string;
  bathrooms: string;
  balconies: string;
  floorNumber: string;
  totalFloors: string;
  parking: string;
  amenities: string[];
  photos: string[];
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerType: string;
};

// ─── Constants ─────────────────────────────────────────────────
const STEPS = [
  { id: 1, name: "Listing Type", icon: ShoppingBag },
  { id: 2, name: "Category", icon: Home },
  { id: 3, name: "Details", icon: Building2 },
  { id: 4, name: "Location", icon: MapPin },
  { id: 5, name: "Pricing", icon: DollarSign },
  { id: 6, name: "Specs", icon: Building2 },
  { id: 7, name: "Amenities", icon: Check },
  { id: 8, name: "Photos", icon: Camera },
  { id: 9, name: "Owner", icon: User },
];

const LISTING_TYPES = [
  { key: "rent", label: "For Rent", icon: Key, desc: "List a property for rental" },
  { key: "buy", label: "For Sale", icon: Home, desc: "List a property for sale" },
];

const CATEGORIES = ["flat", "house", "room", "pg", "hostel", "commercial"];

const PROPERTY_TYPES = ["Apartment", "Independent House", "Builder Floor", "Studio", "Duplex", "Penthouse"];

const FURNISHING = [
  { key: "unfurnished", label: "Unfurnished" },
  { key: "semi", label: "Semi Furnished" },
  { key: "fully", label: "Fully Furnished" },
];

const PREFERRED_TENANTS = [
  { key: "any", label: "Any" },
  { key: "family", label: "Family" },
  { key: "bachelor", label: "Bachelor" },
];

const AMENITIES_LIST = [
  "WiFi", "AC", "Parking", "Gym", "Swimming Pool", "Security",
  "Power Backup", "Lift", "Garden", "Club House", "Intercom", "CCTV",
  "Gas Pipeline", "Rainwater Harvesting", "Waste Disposal",
];

const POSSESSION_STATUS = [
  { key: "ready", label: "Ready to Move" },
  { key: "under_construction", label: "Under Construction" },
  { key: "resale", label: "Resale" },
];

const OWNER_TYPES = [
  { key: "owner", label: "Owner" },
  { key: "agent", label: "Agent/Broker" },
  { key: "builder", label: "Builder" },
];

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai",
  "Kolkata", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur",
  "Nagpur", "Indore", "Thane", "Bhopal", "Patna", "Visakhapatnam",
  "Vadodara", "Ghaziabad",
];

// ─── Helper: SelectOption component ───────────────────────────
function SelectOption({
  label, selected, onPress, colors, isDark
}: { label: string; selected: boolean; onPress: () => void; colors: any; isDark: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.surface : colors.surface,
        marginRight: 8,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        shadowColor: selected ? colors.primary : 'transparent',
        shadowOpacity: selected ? 0.1 : 0,
        shadowRadius: 4,
        elevation: selected ? 2 : 0,
      }}
    >
      <View style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: selected ? colors.primary : colors.input,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {selected && <Check size={10} color="#ffffff" />}
      </View>
      <Text style={{ color: selected ? colors.primary : colors.textPrimary, fontWeight: selected ? "700" : "500", fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Helper: FloatingInput ─────────────────────────────────────
function FloatingInput({
  label, value, onChange, placeholder, keyboardType, colors, isDark, multiline
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; colors: any; isDark: boolean; multiline?: boolean
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || label}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          backgroundColor: colors.input,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.textPrimary,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

// ───────────────────────────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────────────────────────
export default function PostPropertyScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  const [form, setForm] = useState<FormData>({
    listingType: "",
    category: "",
    title: "",
    propertyType: "",
    furnishing: "",
    availableFrom: new Date().toISOString().split("T")[0],
    city: "",
    address: "",
    monthlyRent: "",
    securityDeposit: "",
    maintenanceCharge: "",
    rentNegotiable: false,
    preferredTenants: "any",
    leaseDuration: "",
    sellingPrice: "",
    pricePerSqft: "",
    possessionStatus: "ready",
    bookingAmount: "",
    loanAvailable: true,
    builtUpArea: "",
    carpetArea: "",
    bedrooms: "",
    bathrooms: "",
    balconies: "",
    floorNumber: "",
    totalFloors: "",
    parking: "",
    amenities: [],
    photos: [],
    ownerName: (user as any)?.name || "",
    ownerPhone: "",
    ownerEmail: (user as any)?.email || "",
    ownerType: "",
  });

  const update = useCallback((key: keyof FormData, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  }, []);

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1 && !form.listingType) e.listingType = "Please select a listing type";
    if (s === 2 && !form.category) e.category = "Please select a category";
    if (s === 3) {
      if (!form.title?.trim()) e.title = "Title is required";
      if (!form.propertyType) e.propertyType = "Property type is required";
      if (!form.furnishing) e.furnishing = "Furnishing status is required";
    }
    if (s === 4) {
      if (!form.city) e.city = "City is required";
      if (!form.address?.trim()) e.address = "Address is required";
    }
    if (s === 5) {
      if (form.listingType === "rent" && !form.monthlyRent) e.monthlyRent = "Monthly rent is required";
      if (form.listingType === "buy" && !form.sellingPrice) e.sellingPrice = "Selling price is required";
    }
    if (s === 9) {
      if (!form.ownerName?.trim()) e.ownerName = "Owner name is required";
      if (!form.ownerPhone?.trim()) e.ownerPhone = "Phone is required";
      if (!form.ownerEmail?.trim()) e.ownerEmail = "Email is required";
      if (!form.ownerType) e.ownerType = "Please specify owner/broker";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate(step)) return;
    if (step < STEPS.length) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      const rentOnlyFields = ["monthlyRent", "securityDeposit", "maintenanceCharge", "rentNegotiable", "preferredTenants", "leaseDuration"];
      const buyOnlyFields = ["sellingPrice", "pricePerSqft", "possessionStatus", "bookingAmount", "loanAvailable"];
      const exclude = form.listingType === "buy" ? rentOnlyFields : buyOnlyFields;

      Object.entries(form).forEach(([key, val]) => {
        if (exclude.includes(key) || key === "photos") return;
        if (key === "amenities") {
          if ((val as string[]).length > 0) fd.append("amenities", (val as string[]).join(","));
        } else if (val !== "" && val !== null && val !== undefined && val !== false) {
          fd.append(key, String(val));
        }
      });

      // Handle photo uploads
      if (form.photos.length > 0) {
        form.photos.forEach((uri, index) => {
          const filename = uri.split('/').pop() || `photo_${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          fd.append('photos', {
            uri,
            name: filename,
            type,
          } as any);
        });
      }

      const endpoint = form.listingType === "buy" ? "/api/properties/buy" : "/api/properties/rent";
      console.log("Submitting to:", endpoint);
      console.log("Form data keys:", Array.from((fd as any)._parts || []).map((p: any) => p[0]));
      
      const response = await apiClient.post(endpoint, fd);
      console.log("Submission successful:", response.data);
      setSubmitted(true);
    } catch (e: any) {
      console.error("Submission error:", e);
      console.error("Error response:", e?.response?.data);
      console.error("Error status:", e?.response?.status);
      
      const errorMessage = e?.response?.data?.message 
        || e?.response?.data?.error 
        || e?.message 
        || "Something went wrong. Please try again.";
      
      Alert.alert("Submission Failed", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((a: { uri: string }) => a.uri);
      update("photos", [...form.photos, ...uris].slice(0, 10));
    }
  };

  const toggleAmenity = (a: string) => {
    update("amenities", form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a]
    );
  };

  // ── Success Page ──────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.successContainer}>
          {/* Success Icon */}
          <View style={styles.successIconWrapper}>
            <View style={[styles.successIconGlow, { backgroundColor: colors.success }]} />
            <CheckCircle size={80} color={colors.success} strokeWidth={2} />
          </View>

          {/* Success Message */}
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Listing Submitted!</Text>
          <Text style={[styles.successMsg, { color: colors.textSecondary }]}>
            Your property has been successfully submitted for review. Our team will verify the details and publish your listing shortly.
          </Text>

          {/* Timeline */}
          <View style={styles.timeline}>
            <View style={[styles.timelineItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.timelineIconBg, { backgroundColor: `${colors.primary}20` }]}>
                <Building2 size={24} color={colors.primary} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>Review in Progress</Text>
                <Text style={[styles.timelineText, { color: colors.textSecondary }]}>
                  We are reviewing your property details. This usually takes 24–48 hours.
                </Text>
              </View>
            </View>

            <View style={[styles.timelineItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.timelineIconBg, { backgroundColor: `${colors.success}20` }]}>
                <Home size={24} color={colors.success} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>Listing Published</Text>
                <Text style={[styles.timelineText, { color: colors.textSecondary }]}>
                  Once approved, your listing will be visible to potential tenants.
                </Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.successButtons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs')}
              style={[styles.successPrimaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.successPrimaryBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>

          {/* Reference Number */}
          <View style={[styles.referenceBox, { borderTopColor: colors.border }]}>
            <Text style={[styles.referenceLabel, { color: colors.textSecondary }]}>Your Listing Reference</Text>
            <Text style={[styles.referenceNumber, { color: colors.textPrimary }]}>
              #LST-{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render step content ───────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // Step 1: Listing Type
      case 1:
        return (
          <View>
            <Text style={styles.stepHeading}>What type of listing?</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              Choose whether this property is for rent or for sale.
            </Text>
            {LISTING_TYPES.map(lt => {
              const ListingIcon = lt.icon;
              return (
                <TouchableOpacity
                  key={lt.key}
                  onPress={() => update("listingType", lt.key)}
                  style={[
                    styles.typeCard, 
                    form.listingType === lt.key && { 
                      borderColor: colors.primary, 
                      backgroundColor: colors.surface,
                      shadowColor: colors.primary,
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 4,
                    }
                  ]}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: form.listingType === lt.key ? colors.primary : colors.input,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <ListingIcon size={24} color={form.listingType === lt.key ? "#ffffff" : colors.textSecondary} />
                  </View>
                  <Text style={[styles.typeCardTitle, { color: form.listingType === lt.key ? colors.primary : colors.textPrimary }]}>
                    {lt.label}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center" }}>{lt.desc}</Text>
                  {form.listingType === lt.key && (
                    <View style={[styles.typeCardCheck, { backgroundColor: colors.primary }]}>
                      <Check size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        );

      // Step 2: Category
      case 2:
        return (
          <View>
            <Text style={styles.stepHeading}>Property Category</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>What kind of property is this?</Text>
            <View style={styles.chipWrap}>
              {CATEGORIES.map(c => (
                <SelectOption
                  key={c}
                  label={c.charAt(0).toUpperCase() + c.slice(1)}
                  selected={form.category === c}
                  onPress={() => update("category", c)}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </View>
          </View>
        );

      // Step 3: Basic Details
      case 3:
        return (
          <View>
            <Text style={styles.stepHeading}>Basic Details</Text>
            <FloatingInput label="Property Title" value={form.title} onChange={v => update("title", v)}
              placeholder="e.g. 2BHK Flat in Andheri West" colors={colors} isDark={isDark} />
            <Text style={styles.fieldLabel}>Property Type</Text>
            <View style={styles.chipWrap}>
              {PROPERTY_TYPES.map(t => (
                <SelectOption key={t} label={t} selected={form.propertyType === t}
                  onPress={() => update("propertyType", t)} colors={colors} isDark={isDark} />
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Furnishing Status</Text>
            <View style={styles.chipWrap}>
              {FURNISHING.map(f => (
                <SelectOption key={f.key} label={f.label} selected={form.furnishing === f.key}
                  onPress={() => update("furnishing", f.key)} colors={colors} isDark={isDark} />
              ))}
            </View>
          </View>
        );

      // Step 4: Location
      case 4:
        return (
          <View>
            <Text style={styles.stepHeading}>Location</Text>
            <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>City</Text>
            <TouchableOpacity
              onPress={() => setCityPickerVisible(true)}
              style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.input }]}
            >
              <Text style={{ color: form.city ? colors.textPrimary : colors.textSecondary, fontSize: 15 }}>
                {form.city || "Select City"}
              </Text>
              <MapPin size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <FloatingInput label="Full Address" value={form.address} onChange={v => update("address", v)}
              placeholder="Building, Street, Area" colors={colors} isDark={isDark} multiline />

            {/* City Picker Modal */}
            <Modal visible={cityPickerVisible} transparent animationType="slide">
              <TouchableOpacity style={styles.modalOverlay} onPress={() => setCityPickerVisible(false)}>
                <View style={[styles.pickerSheet, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Select City</Text>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {INDIAN_CITIES.map(city => (
                      <TouchableOpacity
                        key={city}
                        onPress={() => { update("city", city); setCityPickerVisible(false); }}
                        style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                      >
                        <Text style={{ color: city === form.city ? colors.primary : colors.textPrimary, fontSize: 15 }}>
                          {city}
                        </Text>
                        {city === form.city && <Check size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        );

      // Step 5: Pricing
      case 5:
        if (form.listingType === "buy") {
          return (
            <View>
              <Text style={styles.stepHeading}>Pricing (Sale)</Text>
              <FloatingInput label="Selling Price (₹)" value={form.sellingPrice} onChange={v => update("sellingPrice", v)}
                placeholder="e.g. 5000000" keyboardType="numeric" colors={colors} isDark={isDark} />
              <FloatingInput label="Price per Sqft (₹)" value={form.pricePerSqft} onChange={v => update("pricePerSqft", v)}
                placeholder="e.g. 6500" keyboardType="numeric" colors={colors} isDark={isDark} />
              <FloatingInput label="Booking Amount (₹)" value={form.bookingAmount} onChange={v => update("bookingAmount", v)}
                placeholder="e.g. 100000" keyboardType="numeric" colors={colors} isDark={isDark} />
              <Text style={styles.fieldLabel}>Possession Status</Text>
              <View style={styles.chipWrap}>
                {POSSESSION_STATUS.map(p => (
                  <SelectOption key={p.key} label={p.label} selected={form.possessionStatus === p.key}
                    onPress={() => update("possessionStatus", p.key)} colors={colors} isDark={isDark} />
                ))}
              </View>
              <View style={styles.switchRow}>
                <Text style={{ color: colors.textPrimary, fontSize: 15 }}>Bank Loan Available</Text>
                <Switch value={form.loanAvailable}
                  onValueChange={v => update("loanAvailable", v)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          );
        }
        return (
          <View>
            <Text style={styles.stepHeading}>Pricing (Rent)</Text>
            <FloatingInput label="Monthly Rent (₹)" value={form.monthlyRent} onChange={v => update("monthlyRent", v)}
              placeholder="e.g. 25000" keyboardType="numeric" colors={colors} isDark={isDark} />
            <FloatingInput label="Security Deposit (₹)" value={form.securityDeposit} onChange={v => update("securityDeposit", v)}
              placeholder="e.g. 75000" keyboardType="numeric" colors={colors} isDark={isDark} />
            <FloatingInput label="Maintenance Charge (₹)" value={form.maintenanceCharge} onChange={v => update("maintenanceCharge", v)}
              placeholder="e.g. 2000" keyboardType="numeric" colors={colors} isDark={isDark} />
            <FloatingInput label="Lease Duration" value={form.leaseDuration} onChange={v => update("leaseDuration", v)}
              placeholder="e.g. 11 months" colors={colors} isDark={isDark} />
            <View style={styles.switchRow}>
              <Text style={{ color: colors.textPrimary, fontSize: 15 }}>Rent Negotiable</Text>
              <Switch value={form.rentNegotiable}
                onValueChange={v => update("rentNegotiable", v)}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Preferred Tenants</Text>
            <View style={styles.chipWrap}>
              {PREFERRED_TENANTS.map(t => (
                <SelectOption key={t.key} label={t.label} selected={form.preferredTenants === t.key}
                  onPress={() => update("preferredTenants", t.key)} colors={colors} isDark={isDark} />
              ))}
            </View>
          </View>
        );

      // Step 6: Property Specs
      case 6:
        return (
          <View>
            <Text style={styles.stepHeading}>Property Specifications</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FloatingInput label="Bedrooms" value={form.bedrooms} onChange={v => update("bedrooms", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} />
              </View>
              <View style={{ flex: 1 }}>
                <FloatingInput label="Bathrooms" value={form.bathrooms} onChange={v => update("bathrooms", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FloatingInput label="Balconies" value={form.balconies} onChange={v => update("balconies", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} />
              </View>
              <View style={{ flex: 1 }}>
                <FloatingInput label="Parking" value={form.parking} onChange={v => update("parking", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FloatingInput label="Built-up Area (sqft)" value={form.builtUpArea} onChange={v => update("builtUpArea", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} />
              </View>
              <View style={{ flex: 1 }}>
                <FloatingInput label="Carpet Area (sqft)" value={form.carpetArea} onChange={v => update("carpetArea", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FloatingInput label="Floor" value={form.floorNumber} onChange={v => update("floorNumber", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} />
              </View>
              <View style={{ flex: 1 }}>
                <FloatingInput label="Total Floors" value={form.totalFloors} onChange={v => update("totalFloors", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} />
              </View>
            </View>
          </View>
        );

      // Step 7: Amenities
      case 7:
        return (
          <View>
            <Text style={styles.stepHeading}>Amenities</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>Select all that apply</Text>
            <View style={styles.chipWrap}>
              {AMENITIES_LIST.map(a => (
                <SelectOption key={a} label={a} selected={form.amenities.includes(a)}
                  onPress={() => toggleAmenity(a)} colors={colors} isDark={isDark} />
              ))}
            </View>
          </View>
        );

      // Step 8: Photos
      case 8:
        return (
          <View>
            <Text style={styles.stepHeading}>Property Photos</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              Add up to 10 photos. High-quality photos attract more inquiries.
            </Text>
            <TouchableOpacity
              onPress={pickPhoto}
              style={[styles.photoPickerBtn, { borderColor: colors.border, backgroundColor: colors.input }]}
            >
              <Camera size={32} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15, marginTop: 8 }}>
                {form.photos.length > 0 ? `${form.photos.length} photo(s) selected` : "Add Photos"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                Tap to select from gallery (max 10)
              </Text>
            </TouchableOpacity>
            {form.photos.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {form.photos.length} photo(s) ready to upload
                </Text>
                <TouchableOpacity onPress={() => update("photos", [])} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.error, fontSize: 13 }}>Remove all photos</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      // Step 9: Owner Details
      case 9:
        return (
          <View>
            <Text style={styles.stepHeading}>Owner / Contact Details</Text>
            <FloatingInput label="Full Name" value={form.ownerName} onChange={v => update("ownerName", v)}
              colors={colors} isDark={isDark} />
            <FloatingInput label="Phone Number" value={form.ownerPhone} onChange={v => update("ownerPhone", v)}
              keyboardType="phone-pad" colors={colors} isDark={isDark} />
            <FloatingInput label="Email" value={form.ownerEmail} onChange={v => update("ownerEmail", v)}
              keyboardType="email-address" colors={colors} isDark={isDark} />
            <Text style={styles.fieldLabel}>You are a:</Text>
            <View style={styles.chipWrap}>
              {OWNER_TYPES.map(t => (
                <SelectOption key={t.key} label={t.label} selected={form.ownerType === t.key}
                  onPress={() => update("ownerType", t.key)} colors={colors} isDark={isDark} />
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  const currentStepInfo = STEPS[step - 1];
  const StepIcon = currentStepInfo.icon;

  return (
    <ProtectedScreen 
      requireAuth={true}
      title="Sign In Required"
      message="Please sign in to post a property listing"
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top header */}
      <View style={[styles.pageHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => step === 1 ? navigation.goBack() : setStep(s => s - 1)}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Post Property</Text>
          <Text style={[styles.stepIndicator, { color: colors.textSecondary }]}>
            Step {step} of {STEPS.length} · {currentStepInfo.name}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
      </View>

      {/* Step pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepPills}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {STEPS.map((s, i) => {
          const done = i < step - 1;
          const current = i === step - 1;
          const SIcon = s.icon;
          return (
            <View key={s.id} style={[styles.stepPill,
              { backgroundColor: done ? colors.success : current ? colors.primary : colors.surface,
                borderColor: done ? colors.success : current ? colors.primary : colors.border }]}>
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: done ? '#ffffff' : current ? '#ffffff' : colors.input,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {done
                  ? <Check size={12} color={colors.success} />
                  : <SIcon size={12} color={current ? colors.primary : colors.textSecondary} />
                }
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", marginLeft: 6,
                color: done ? '#ffffff' : current ? '#ffffff' : colors.textSecondary }}>
                {s.name}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Validation errors */}
      {Object.keys(errors).length > 0 && (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
          <AlertCircle size={18} color={colors.error} />
          <View style={{ flex: 1 }}>
            {Object.values(errors).map((err, i) => (
              <Text key={i} style={{ color: colors.error, fontSize: 13, lineHeight: 18 }}>• {err}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Step content */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderStep()}
          </View>
        </ScrollView>

        {/* Navigation buttons */}
        <View style={[styles.navRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            style={[styles.prevBtn, { borderColor: colors.border, opacity: step === 1 ? 0.4 : 1 }]}
          >
            <ArrowLeft size={18} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontWeight: "600", fontSize: 15 }}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            disabled={isSubmitting}
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : step === STEPS.length ? (
              <>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Submit</Text>
                <Check size={18} color="#fff" />
              </>
            ) : (
              <>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Next</Text>
                <ArrowRight size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ProtectedScreen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  stepIndicator: { fontSize: 12, marginTop: 1 },
  progressBg: { height: 3, width: "100%", zIndex: 9 },
  progressFill: { height: 3, borderRadius: 2 },
  stepPills: { maxHeight: 50, flexGrow: 0, paddingVertical: 10, backgroundColor: colors.background, zIndex: 8 },
  stepPill: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24 },
  card: {
    borderRadius: 20, padding: 20,
    borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  stepHeading: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, marginBottom: 6 },
  stepSub: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: colors.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  typeCard: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 16,
    padding: 20, marginBottom: 12, alignItems: "center",
    backgroundColor: colors.surface, position: "relative",
  },
  typeCardTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  typeCardCheck: { position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 },
  row: { flexDirection: "row" },
  pickerBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "70%" },
  pickerTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  pickerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  photoPickerBtn: { borderWidth: 2, borderStyle: "dashed", borderRadius: 16, padding: 32, alignItems: "center", justifyContent: "center" },
  errorBanner: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 8, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start", zIndex: 5 },
  navRow: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1 },
  prevBtn: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, justifyContent: "center" },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 8, flex: 2, paddingVertical: 14, borderRadius: 14, justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  successContainer: { flexGrow: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  successIconWrapper: { alignItems: "center", justifyContent: "center", marginBottom: 24, position: "relative", width: 120, height: 120 },
  successIconGlow: { position: "absolute", width: 120, height: 120, borderRadius: 60, opacity: 0.2 },
  successTitle: { fontSize: 32, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  successMsg: { fontSize: 16, textAlign: "center", lineHeight: 24, marginBottom: 32, paddingHorizontal: 16 },
  timeline: { width: "100%", marginBottom: 32, gap: 16 },
  timelineItem: { flexDirection: "row", padding: 16, borderRadius: 12, borderWidth: 1, gap: 12, alignItems: "flex-start" },
  timelineIconBg: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  timelineText: { fontSize: 14, lineHeight: 20 },
  successButtons: { width: "100%", gap: 12, marginBottom: 32 },
  successPrimaryBtn: { paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  successPrimaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  referenceBox: { width: "100%", paddingTop: 24, borderTopWidth: 1, alignItems: "center" },
  referenceLabel: { fontSize: 13, marginBottom: 8 },
  referenceNumber: { fontSize: 24, fontWeight: "700", fontFamily: "monospace" },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  primaryBtn: { marginTop: 20, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
