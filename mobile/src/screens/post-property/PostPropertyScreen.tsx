import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft, ArrowRight, Check, ShoppingBag, Home, Building2, MapPin,
  DollarSign, Camera, User, AlertCircle, CheckCircle, Key, Trash2, ChevronLeft, ChevronRight, Star,
  DoorOpen, Bed, Hotel, Store, Layers, Copy, Crown, Square, Sofa,
  Users, Heart, Hammer, RefreshCw, Wifi, Wind, Car, Dumbbell, Waves, Shield, Zap, ArrowUpDown, Leaf, Phone, Video, Flame, CloudRain,
  ClipboardCheck
} from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import ProtectedScreen from "../../components/auth/ProtectedScreen";
import { apiClient } from "../../api/client";
import * as ImagePicker from "expo-image-picker";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  lat?: number;
  lng?: number;
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
  { id: 10, name: "Review", icon: ClipboardCheck },
];

const LISTING_TYPES = [
  { key: "rent", label: "For Rent", icon: Key, desc: "List a property for rental" },
  { key: "buy", label: "For Sale", icon: Home, desc: "List a property for sale" },
];

const CATEGORIES = ["flat", "house", "room", "pg", "hostel", "commercial"];

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  flat: Building2,
  house: Home,
  room: DoorOpen,
  pg: Bed,
  hostel: Hotel,
  commercial: Store,
};

const PROPERTY_TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  "Apartment": Building2,
  "Independent House": Home,
  "Builder Floor": Layers,
  "Studio": DoorOpen,
  "Duplex": Copy,
  "Penthouse": Crown,
};

const FURNISHING_ICONS: Record<string, React.ComponentType<any>> = {
  unfurnished: Square,
  semi: Bed,
  fully: Sofa,
};

const PREFERRED_TENANT_ICONS: Record<string, React.ComponentType<any>> = {
  any: Users,
  family: Heart,
  bachelor: User,
};

const POSSESSION_STATUS_ICONS: Record<string, React.ComponentType<any>> = {
  ready: CheckCircle,
  under_construction: Hammer,
  resale: RefreshCw,
};

const AMENITY_ICONS: Record<string, React.ComponentType<any>> = {
  "WiFi": Wifi,
  "AC": Wind,
  "Parking": Car,
  "Gym": Dumbbell,
  "Swimming Pool": Waves,
  "Security": Shield,
  "Power Backup": Zap,
  "Lift": ArrowUpDown,
  "Garden": Leaf,
  "Club House": Users,
  "Intercom": Phone,
  "CCTV": Video,
  "Gas Pipeline": Flame,
  "Rainwater Harvesting": CloudRain,
  "Waste Disposal": Trash2,
};

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
  label, selected, onPress, colors, isDark, icon: Icon
}: { label: string; selected: boolean; onPress: () => void; colors: any; isDark: boolean; icon?: React.ComponentType<any> }) {
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
      {Icon ? (
        <Icon 
          size={16} 
          color={selected ? colors.primary : colors.textSecondary} 
        />
      ) : (
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
      )}
      <Text style={{ color: selected ? colors.primary : colors.textPrimary, fontWeight: selected ? "700" : "500", fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Helper: FloatingInput ─────────────────────────────────────
function FloatingInput({
  label, value, onChange, placeholder, keyboardType, colors, isDark, multiline, error
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; colors: any; isDark: boolean; multiline?: boolean; error?: string
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: error ? colors.error : colors.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
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
          borderColor: error ? colors.error : colors.border,
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
      {error ? (
        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, fontWeight: "600" }}>{error}</Text>
      ) : null}
    </View>
  );
}

const generatePickerHTML = (lat: number | undefined, lng: number | undefined, primaryHex: string, dark: boolean) => {
  const initialLat = lat || 28.6139;
  const initialLng = lng || 77.2090;
  const hasInitialMarker = !!(lat && lng);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: ${dark ? '#0f172a' : '#f8fafc'};
    }
    .leaflet-bar {
      border: none !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    }
    .leaflet-bar a {
      background-color: ${dark ? '#1e293b' : '#ffffff'} !important;
      color: ${dark ? '#f8fafc' : '#0f172a'} !important;
      border-bottom: 1px solid ${dark ? '#334155' : '#e2e8f0'} !important;
    }
    ${dark ? `
    .leaflet-tile-container {
      filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
    }
    ` : ''}
    .picker-marker-css {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: ${primaryHex};
      border: 3px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translate(-18px, -18px);
    }
  </style>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${initialLat}, ${initialLng}], ${hasInitialMarker ? 15 : 5});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    let marker = null;

    const markerIcon = L.divIcon({
      className: '',
      html: \`<div class="picker-marker-css"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>\`,
      iconAnchor: [18, 18]
    });

    function sendLocation(lat, lng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        event: 'locationSelect',
        lat: lat,
        lng: lng
      }));
    }

    function setLocation(lat, lng, pan = true) {
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], {
          icon: markerIcon,
          draggable: true
        }).addTo(map);

        marker.on('dragend', function() {
          const pos = marker.getLatLng();
          sendLocation(pos.lat, pos.lng);
        });
      }
      if (pan) {
        map.setView([lat, lng], 15, { animate: true });
      }
    }

    if (${hasInitialMarker}) {
      setLocation(${initialLat}, ${initialLng}, false);
    }

    map.on('click', function(e) {
      setLocation(e.latlng.lat, e.latlng.lng, false);
      sendLocation(e.latlng.lat, e.latlng.lng);
    });

    function handleNativeMessage(dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (data.action === 'setLocation') {
          if (marker) {
            const currentPos = marker.getLatLng();
            if (Math.abs(currentPos.lat - data.lat) < 0.00001 && Math.abs(currentPos.lng - data.lng) < 0.00001) {
              return;
            }
          }
          setLocation(data.lat, data.lng, true);
        }
      } catch (err) {
        console.error(err);
      }
    }

    document.addEventListener('message', function(event) {
      handleNativeMessage(event.data);
    });
    window.addEventListener('message', function(event) {
      handleNativeMessage(event.data);
    });
  </script>
</body>
</html>
  `;
};

// ───────────────────────────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────────────────────────
export default function PostPropertyScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  const scrollViewRef = useRef<ScrollView>(null);
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
    lat: undefined,
    lng: undefined,
  });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [createdProperty, setCreatedProperty] = useState<{ id: string; type: 'rent' | 'buy' } | null>(null);

  const mapWebViewRef = useRef<WebView>(null);

  // Generate WebView picker HTML once to avoid page refresh during coords dragging
  const pickerHTML = useMemo(() => {
    return generatePickerHTML(form.lat, form.lng, colors.primary, isDark);
  }, [colors.primary, isDark]);

  // Sync form coordinates with WebView map picker
  useEffect(() => {
    if (form.lat && form.lng && mapWebViewRef.current) {
      mapWebViewRef.current.postMessage(
        JSON.stringify({
          action: "setLocation",
          lat: form.lat,
          lng: form.lng,
        })
      );
    }
  }, [form.lat, form.lng]);

  const update = useCallback((key: keyof FormData, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  }, []);

  // Scroll to top on step transitions
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  // Scroll to top when validation errors occur to expose error banner
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [errors]);

  // Check and restore draft on mount
  useEffect(() => {
    if (!user || draftLoaded) return;
    const checkDraft = async () => {
      try {
        const key = `draft_property_wizard:${(user as any).email || 'guest'}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          Alert.alert(
            "Resume Draft",
            "You have an unfinished property listing draft. Would you like to resume editing?",
            [
              {
                text: "Resume",
                onPress: () => {
                  setForm(parsed);
                  setDraftLoaded(true);
                }
              },
              {
                text: "Start Fresh",
                onPress: async () => {
                  await AsyncStorage.removeItem(key);
                  setDraftLoaded(true);
                }
              }
            ]
          );
        } else {
          setDraftLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load draft:", err);
        setDraftLoaded(true);
      }
    };
    checkDraft();
  }, [user, draftLoaded]);

  // Auto-save draft whenever form changes
  useEffect(() => {
    if (submitted || !user || !draftLoaded) return;
    const saveDraft = async () => {
      try {
        const key = `draft_property_wizard:${(user as any).email || 'guest'}`;
        await AsyncStorage.setItem(key, JSON.stringify(form));
      } catch (err) {
        console.error("Failed to save draft:", err);
      }
    };
    saveDraft();
  }, [form, user, submitted, draftLoaded]);

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
    if (s === 6) {
      const isFlat = form.category === "flat";
      const isHouse = form.category === "house";
      const isCommercial = form.category === "commercial";
      if (isFlat || isHouse || isCommercial) {
        if (!form.builtUpArea?.trim() && !form.carpetArea?.trim()) {
          e.builtUpArea = "Built-up or carpet area is required";
        }
      }
    }
    if (s === 8) {
      if (form.photos.length === 0) {
        e.photos = "Please upload at least 1 photo";
      }
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
      
      const data = response.data;
      const newPropertyId = data?._id || data?.property?._id || data?.data?._id || data?.data?.property?._id;
      if (newPropertyId) {
        setCreatedProperty({
          id: newPropertyId,
          type: form.listingType as 'rent' | 'buy'
        });
      }

      const key = `draft_property_wizard:${(user as any).email || 'guest'}`;
      await AsyncStorage.removeItem(key);
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

  const pickPhoto = () => {
    Alert.alert(
      "Add Property Photo",
      "Choose an option to upload photos of your property:",
      [
        {
          text: "Take Photo (Camera)",
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              Alert.alert("Permission Denied", "Camera permission is required to take photos.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.8,
            });
            if (!result.canceled && result.assets.length > 0) {
              const uris = result.assets.map(a => a.uri);
              update("photos", [...form.photos, ...uris].slice(0, 10));
            }
          }
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
              Alert.alert("Permission Denied", "Media library permission is required to choose photos.");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsMultipleSelection: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets.length > 0) {
              const uris = result.assets.map(a => a.uri);
              update("photos", [...form.photos, ...uris].slice(0, 10));
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
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
              <View style={styles.timelineIconBg}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.primary, opacity: 0.15, borderRadius: 24 }]} />
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
              <View style={styles.timelineIconBg}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.success, opacity: 0.15, borderRadius: 24 }]} />
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
            {createdProperty && (
              <TouchableOpacity
                onPress={() => navigation.navigate('PropertyDetail', { identifier: createdProperty.id, type: createdProperty.type })}
                style={[styles.successSecondaryBtn, { borderColor: colors.primary, borderWidth: 1.5, marginBottom: 12 }]}
              >
                <Text style={[styles.successSecondaryBtnText, { color: colors.primary }]}>View Uploaded Property</Text>
              </TouchableOpacity>
            )}
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

  const renderReviewStep = () => {
    const formatPriceText = (priceStr: string) => {
      const price = parseFloat(priceStr);
      if (isNaN(price)) return 'N/A';
      return `₹${price.toLocaleString()}`;
    };

    return (
      <View style={styles.reviewContainer}>
        <Text style={styles.stepHeading}>Review Details</Text>
        <Text style={[styles.stepSub, { color: colors.textSecondary, marginBottom: 16 }]}>
          Please check the details of your property listing before submitting.
        </Text>

        {/* Basic Info & Details Section */}
        <View style={[styles.reviewSection, { borderColor: colors.border }]}>
          <View style={styles.reviewHeaderRow}>
            <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>Basic Information</Text>
            <TouchableOpacity onPress={() => setStep(3)} style={styles.reviewEditBtn}>
              <Text style={[styles.reviewEditText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reviewDataGrid}>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Title</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.title || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Listing Type</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary, textTransform: 'capitalize' }]}>{form.listingType || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Category</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary, textTransform: 'capitalize' }]}>{form.category || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Property Type</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.propertyType || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Furnishing</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary, textTransform: 'capitalize' }]}>{form.furnishing || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Available From</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.availableFrom || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={[styles.reviewSection, { borderColor: colors.border }]}>
          <View style={styles.reviewHeaderRow}>
            <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>Location Details</Text>
            <TouchableOpacity onPress={() => setStep(4)} style={styles.reviewEditBtn}>
              <Text style={[styles.reviewEditText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reviewDataGrid}>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>City</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.city || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Full Address</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.address || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Coordinates</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>
                {form.lat && form.lng ? `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}` : 'No Geotag Set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={[styles.reviewSection, { borderColor: colors.border }]}>
          <View style={styles.reviewHeaderRow}>
            <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>Pricing & Lease Details</Text>
            <TouchableOpacity onPress={() => setStep(5)} style={styles.reviewEditBtn}>
              <Text style={[styles.reviewEditText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reviewDataGrid}>
            {form.listingType === 'rent' ? (
              <>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Monthly Rent</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.primary, fontWeight: '700' }]}>{formatPriceText(form.monthlyRent)}/month</Text>
                </View>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Security Deposit</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{formatPriceText(form.securityDeposit)}</Text>
                </View>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Maintenance</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{formatPriceText(form.maintenanceCharge)}</Text>
                </View>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Negotiable</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.rentNegotiable ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Tenants Preferred</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.textPrimary, textTransform: 'capitalize' }]}>{form.preferredTenants || 'N/A'}</Text>
                </View>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Lease Duration</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.leaseDuration || 'N/A'}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Selling Price</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.primary, fontWeight: '700' }]}>{formatPriceText(form.sellingPrice)}</Text>
                </View>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Price per Sqft</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{formatPriceText(form.pricePerSqft)}/sqft</Text>
                </View>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Booking Amount</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{formatPriceText(form.bookingAmount)}</Text>
                </View>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Possession Status</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.textPrimary, textTransform: 'capitalize' }]}>{form.possessionStatus?.replace('_', ' ') || 'N/A'}</Text>
                </View>
                <View style={styles.reviewDataRow}>
                  <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Bank Loan Available</Text>
                  <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.loanAvailable ? 'Yes' : 'No'}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Specs Section */}
        <View style={[styles.reviewSection, { borderColor: colors.border }]}>
          <View style={styles.reviewHeaderRow}>
            <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>Specifications</Text>
            <TouchableOpacity onPress={() => setStep(6)} style={styles.reviewEditBtn}>
              <Text style={[styles.reviewEditText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reviewDataGrid}>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Bedrooms</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.bedrooms || '0'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Bathrooms</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.bathrooms || '0'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Balconies</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.balconies || '0'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Parking</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.parking || '0'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Built-up Area</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.builtUpArea ? `${form.builtUpArea} sqft` : 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Floor Level</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>
                {form.floorNumber && form.totalFloors ? `${form.floorNumber} of ${form.totalFloors}` : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Amenities Section */}
        <View style={[styles.reviewSection, { borderColor: colors.border }]}>
          <View style={styles.reviewHeaderRow}>
            <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>Amenities</Text>
            <TouchableOpacity onPress={() => setStep(7)} style={styles.reviewEditBtn}>
              <Text style={[styles.reviewEditText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          {form.amenities.length > 0 ? (
            <View style={styles.reviewAmenitiesList}>
              {form.amenities.map((amenity, i) => {
                const AmenityIconComponent = AMENITY_ICONS[amenity] || Check;
                return (
                  <View key={i} style={[styles.reviewAmenityTag, { backgroundColor: colors.input, borderColor: colors.border }]}>
                    <AmenityIconComponent size={14} color={colors.primary} />
                    <Text style={[styles.reviewAmenityText, { color: colors.textPrimary }]}>{amenity}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No amenities selected.</Text>
          )}
        </View>

        {/* Photos Section */}
        <View style={[styles.reviewSection, { borderColor: colors.border }]}>
          <View style={styles.reviewHeaderRow}>
            <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>Photos</Text>
            <TouchableOpacity onPress={() => setStep(8)} style={styles.reviewEditBtn}>
              <Text style={[styles.reviewEditText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          {form.photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewPhotosScroll}>
              {form.photos.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.reviewPhotoThumbnail} />
              ))}
            </ScrollView>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No photos uploaded.</Text>
          )}
        </View>

        {/* Owner Details Section */}
        <View style={[styles.reviewSection, { borderColor: colors.border, borderBottomWidth: 0, paddingBottom: 0 }]}>
          <View style={styles.reviewHeaderRow}>
            <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>Owner / Contact Information</Text>
            <TouchableOpacity onPress={() => setStep(9)} style={styles.reviewEditBtn}>
              <Text style={[styles.reviewEditText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reviewDataGrid}>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Contact Name</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.ownerName || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Contact Phone</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.ownerPhone || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Contact Email</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary }]}>{form.ownerEmail || 'N/A'}</Text>
            </View>
            <View style={styles.reviewDataRow}>
              <Text style={[styles.reviewDataLabel, { color: colors.textSecondary }]}>Account Role</Text>
              <Text style={[styles.reviewDataVal, { color: colors.textPrimary, textTransform: 'capitalize' }]}>{form.ownerType || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

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
                    },
                    errors.listingType && { borderColor: colors.error }
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
            {errors.listingType ? (
              <Text style={{ color: colors.error, fontSize: 13, marginBottom: 12, fontWeight: "600", textAlign: "center" }}>{errors.listingType}</Text>
            ) : null}
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
                  icon={CATEGORY_ICONS[c]}
                />
              ))}
            </View>
            {errors.category ? (
              <Text style={{ color: colors.error, fontSize: 13, marginBottom: 12, fontWeight: "600" }}>{errors.category}</Text>
            ) : null}
          </View>
        );

      // Step 3: Basic Details
      case 3:
        return (
          <View>
            <Text style={styles.stepHeading}>Basic Details</Text>
            <FloatingInput label="Property Title" value={form.title} onChange={v => update("title", v)}
              placeholder="e.g. 2BHK Flat in Andheri West" colors={colors} isDark={isDark} error={errors.title} />
            <Text style={styles.fieldLabel}>Property Type</Text>
            <View style={styles.chipWrap}>
              {PROPERTY_TYPES.map(t => (
                <SelectOption key={t} label={t} selected={form.propertyType === t}
                  onPress={() => update("propertyType", t)} colors={colors} isDark={isDark}
                  icon={PROPERTY_TYPE_ICONS[t]}
                />
              ))}
            </View>
            {errors.propertyType ? (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: -4, marginBottom: 12, fontWeight: "600" }}>{errors.propertyType}</Text>
            ) : null}
            <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Furnishing Status</Text>
            <View style={styles.chipWrap}>
              {FURNISHING.map(f => (
                <SelectOption key={f.key} label={f.label} selected={form.furnishing === f.key}
                  onPress={() => update("furnishing", f.key)} colors={colors} isDark={isDark}
                  icon={FURNISHING_ICONS[f.key]}
                />
              ))}
            </View>
            {errors.furnishing ? (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: -4, marginBottom: 12, fontWeight: "600" }}>{errors.furnishing}</Text>
            ) : null}
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
              style={[styles.pickerBtn, { borderColor: errors.city ? colors.error : colors.border, backgroundColor: colors.input }]}
            >
              <Text style={{ color: form.city ? colors.textPrimary : colors.textSecondary, fontSize: 15 }}>
                {form.city || "Select City"}
              </Text>
              <MapPin size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {errors.city ? (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: -12, marginBottom: 12, fontWeight: "600" }}>{errors.city}</Text>
            ) : null}
            <FloatingInput label="Full Address" value={form.address} onChange={v => update("address", v)}
              placeholder="Building, Street, Area" colors={colors} isDark={isDark} multiline error={errors.address} />

            {/* Map Geotag Picker */}
            <View style={{ marginTop: 8, marginBottom: 16 }}>
              <Text style={styles.fieldLabel}>Map Geotag Pin</Text>
              <View style={styles.mapContainer}>
                <WebView
                  ref={mapWebViewRef}
                  style={styles.locationMap}
                  originWhitelist={["*"]}
                  source={{ html: pickerHTML }}
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.event === "locationSelect") {
                        update("lat", data.lat);
                        update("lng", data.lng);
                      }
                    } catch (err) {
                      console.error("WebView message error:", err);
                    }
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
                <TouchableOpacity
                  disabled={isLocating}
                  onPress={async () => {
                    setIsLocating(true);
                    try {
                      const { status } = await Location.requestForegroundPermissionsAsync();
                      if (status !== 'granted') {
                        Alert.alert('Permission Denied', 'Please enable location permissions to locate the property.');
                        setIsLocating(false);
                        return;
                      }
                      
                      let loc = null;
                      try {
                        loc = await Location.getCurrentPositionAsync({
                          accuracy: Location.Accuracy.Balanced,
                        });
                      } catch (gpsErr) {
                        console.warn("getCurrentPositionAsync failed, trying getLastKnownPositionAsync:", gpsErr);
                        loc = await Location.getLastKnownPositionAsync({});
                      }

                      if (loc && loc.coords) {
                        update("lat", loc.coords.latitude);
                        update("lng", loc.coords.longitude);
                      } else {
                        throw new Error("Unable to obtain coordinates.");
                      }
                    } catch (err) {
                      console.error("GPS error:", err);
                      Alert.alert("Location Error", "Could not fetch your current location. Please verify that your device location services are enabled, or select the location by tapping directly on the map.");
                    } finally {
                      setIsLocating(false);
                    }
                  }}
                  style={[styles.useCurrentLocationBtn, { backgroundColor: colors.primary, opacity: isLocating ? 0.7 : 1 }]}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MapPin size={16} color="#fff" />
                  )}
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                    {isLocating ? "Locating..." : "Use Current Location"}
                  </Text>
                </TouchableOpacity>
              </View>
              {form.lat && form.lng ? (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
                  Geotag: {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                </Text>
              ) : (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
                  No geotag set. Pin on map or tap "Use Current Location" (Optional but recommended).
                </Text>
              )}
            </View>

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
                placeholder="e.g. 5000000" keyboardType="numeric" colors={colors} isDark={isDark} error={errors.sellingPrice} />
              <FloatingInput label="Price per Sqft (₹)" value={form.pricePerSqft} onChange={v => update("pricePerSqft", v)}
                placeholder="e.g. 6500" keyboardType="numeric" colors={colors} isDark={isDark} error={errors.pricePerSqft} />
              <FloatingInput label="Booking Amount (₹)" value={form.bookingAmount} onChange={v => update("bookingAmount", v)}
                placeholder="e.g. 100000" keyboardType="numeric" colors={colors} isDark={isDark} error={errors.bookingAmount} />
              <Text style={styles.fieldLabel}>Possession Status</Text>
              <View style={styles.chipWrap}>
                {POSSESSION_STATUS.map(p => (
                  <SelectOption key={p.key} label={p.label} selected={form.possessionStatus === p.key}
                    onPress={() => update("possessionStatus", p.key)} colors={colors} isDark={isDark}
                    icon={POSSESSION_STATUS_ICONS[p.key]}
                  />
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
              placeholder="e.g. 25000" keyboardType="numeric" colors={colors} isDark={isDark} error={errors.monthlyRent} />
            <FloatingInput label="Security Deposit (₹)" value={form.securityDeposit} onChange={v => update("securityDeposit", v)}
              placeholder="e.g. 75000" keyboardType="numeric" colors={colors} isDark={isDark} error={errors.securityDeposit} />
            <FloatingInput label="Maintenance Charge (₹)" value={form.maintenanceCharge} onChange={v => update("maintenanceCharge", v)}
              placeholder="e.g. 2000" keyboardType="numeric" colors={colors} isDark={isDark} error={errors.maintenanceCharge} />
            <FloatingInput label="Lease Duration" value={form.leaseDuration} onChange={v => update("leaseDuration", v)}
              placeholder="e.g. 11 months" colors={colors} isDark={isDark} error={errors.leaseDuration} />
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
                  onPress={() => update("preferredTenants", t.key)} colors={colors} isDark={isDark}
                  icon={PREFERRED_TENANT_ICONS[t.key]}
                />
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
                  keyboardType="numeric" colors={colors} isDark={isDark} error={errors.bedrooms} />
              </View>
              <View style={{ flex: 1 }}>
                <FloatingInput label="Bathrooms" value={form.bathrooms} onChange={v => update("bathrooms", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} error={errors.bathrooms} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FloatingInput label="Balconies" value={form.balconies} onChange={v => update("balconies", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} error={errors.balconies} />
              </View>
              <View style={{ flex: 1 }}>
                <FloatingInput label="Parking" value={form.parking} onChange={v => update("parking", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} error={errors.parking} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FloatingInput label="Built-up Area (sqft)" value={form.builtUpArea} onChange={v => update("builtUpArea", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} error={errors.builtUpArea} />
              </View>
              <View style={{ flex: 1 }}>
                <FloatingInput label="Carpet Area (sqft)" value={form.carpetArea} onChange={v => update("carpetArea", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} error={errors.carpetArea} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FloatingInput label="Floor" value={form.floorNumber} onChange={v => update("floorNumber", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} error={errors.floorNumber} />
              </View>
              <View style={{ flex: 1 }}>
                <FloatingInput label="Total Floors" value={form.totalFloors} onChange={v => update("totalFloors", v)}
                  keyboardType="numeric" colors={colors} isDark={isDark} error={errors.totalFloors} />
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
                  onPress={() => toggleAmenity(a)} colors={colors} isDark={isDark}
                  icon={AMENITY_ICONS[a]}
                />
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
              style={[styles.photoPickerBtn, { borderColor: errors.photos ? colors.error : colors.border, backgroundColor: colors.input }]}
            >
              <Camera size={32} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15, marginTop: 8 }}>
                {form.photos.length > 0 ? `${form.photos.length} photo(s) selected` : "Add Photos"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                Tap to add from camera or library (max 10)
              </Text>
            </TouchableOpacity>
            {errors.photos ? (
              <Text style={{ color: colors.error, fontSize: 13, marginTop: 8, fontWeight: "600", textAlign: "center" }}>{errors.photos}</Text>
            ) : null}

            {form.photos.length > 0 && (
              <View style={styles.photosGridContainer}>
                {form.photos.map((uri, index) => {
                  const isCover = index === 0;
                  return (
                    <View key={uri} style={[styles.photoCardWrapper, { borderColor: colors.border, backgroundColor: colors.input }]}>
                      <Image source={{ uri }} style={styles.photoThumbnail} />
                      {isCover && (
                        <View style={[styles.coverBadge, { backgroundColor: colors.success }]}>
                          <Text style={styles.coverBadgeText}>Cover</Text>
                        </View>
                      )}
                      <View style={styles.photoActionBar}>
                        <TouchableOpacity
                          disabled={index === 0}
                          onPress={() => {
                            const newPhotos = [...form.photos];
                            const temp = newPhotos[index];
                            newPhotos[index] = newPhotos[index - 1];
                            newPhotos[index - 1] = temp;
                            update("photos", newPhotos);
                          }}
                          style={[styles.photoActionBtn, index === 0 && { opacity: 0.3 }]}
                        >
                          <ChevronLeft size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={index === form.photos.length - 1}
                          onPress={() => {
                            const newPhotos = [...form.photos];
                            const temp = newPhotos[index];
                            newPhotos[index] = newPhotos[index + 1];
                            newPhotos[index + 1] = temp;
                            update("photos", newPhotos);
                          }}
                          style={[styles.photoActionBtn, index === form.photos.length - 1 && { opacity: 0.3 }]}
                        >
                          <ChevronRight size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={isCover}
                          onPress={() => {
                            const newPhotos = [...form.photos];
                            const picked = newPhotos.splice(index, 1)[0];
                            newPhotos.unshift(picked);
                            update("photos", newPhotos);
                          }}
                          style={[styles.photoActionBtn, isCover && { opacity: 0.3 }]}
                        >
                          <Star size={16} color={isCover ? colors.success : colors.textPrimary} fill={isCover ? colors.success : "transparent"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            update("photos", form.photos.filter((_, i) => i !== index));
                          }}
                          style={styles.photoActionBtn}
                        >
                          <Trash2 size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {form.photos.length > 0 && (
              <View style={{ marginTop: 24, alignItems: "center" }}>
                <TouchableOpacity onPress={() => update("photos", [])}>
                  <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}>Remove all photos</Text>
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
              colors={colors} isDark={isDark} error={errors.ownerName} />
            <FloatingInput label="Phone Number" value={form.ownerPhone} onChange={v => update("ownerPhone", v)}
              keyboardType="phone-pad" colors={colors} isDark={isDark} error={errors.ownerPhone} />
            <FloatingInput label="Email" value={form.ownerEmail} onChange={v => update("ownerEmail", v)}
              keyboardType="email-address" colors={colors} isDark={isDark} error={errors.ownerEmail} />
            <Text style={styles.fieldLabel}>You are a:</Text>
            <View style={styles.chipWrap}>
              {OWNER_TYPES.map(t => (
                <SelectOption key={t.key} label={t.label} selected={form.ownerType === t.key}
                  onPress={() => update("ownerType", t.key)} colors={colors} isDark={isDark} />
              ))}
            </View>
            {errors.ownerType ? (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: -4, marginBottom: 12, fontWeight: "600" }}>{errors.ownerType}</Text>
            ) : null}
          </View>
        );

      case 10:
        return renderReviewStep();

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
          ref={scrollViewRef}
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
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationMap: {
    ...StyleSheet.absoluteFillObject,
  },
  useCurrentLocationBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  photosGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  photoCardWrapper: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 4,
  },
  photoThumbnail: {
    width: '100%',
    height: '75%',
    resizeMode: 'cover',
  },
  coverBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coverBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  photoActionBar: {
    height: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  photoActionBtn: {
    padding: 6,
  },
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
  successSecondaryBtn: { paddingVertical: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  successSecondaryBtnText: { fontWeight: "700", fontSize: 16 },
  referenceBox: { width: "100%", paddingTop: 24, borderTopWidth: 1, alignItems: "center" },
  referenceLabel: { fontSize: 13, marginBottom: 8 },
  referenceNumber: { fontSize: 24, fontWeight: "700", fontFamily: "monospace" },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  primaryBtn: { marginTop: 20, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  reviewContainer: {
    gap: 16,
  },
  reviewSection: {
    borderBottomWidth: 1.5,
    paddingBottom: 20,
    gap: 10,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewEditText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reviewDataRow: {
    width: '47%',
    marginBottom: 4,
  },
  reviewDataLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  reviewDataVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewAmenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewAmenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewAmenityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewPhotosScroll: {
    gap: 10,
  },
  reviewPhotoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});
