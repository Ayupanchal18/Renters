import React, { useMemo, useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/home/HomeScreen";
import ListingsScreen from "../screens/listings/ListingsScreen";
import WishlistScreen from "../screens/wishlist/WishlistScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import { useTheme } from "../theme/useTheme";
import { Text, StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Home, Search, Heart, User, Banknote, Key, Bell, MessageSquare } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, type, colors }: { name: string; focused: boolean; type?: string; colors: any }) {
  const color = focused ? (type === 'buy' ? colors.success : colors.primary) : colors.textSecondary;
  const size = 22;

  switch (name) {
    case "HomeTab":
      return <Home size={size} color={color} />;
    case "RentTab":
      return <Key size={size} color={color} />;
    case "BuyTab":
      return <Banknote size={size} color={color} />;
    case "WishlistTab":
      return <Heart size={size} color={color} />;
    case "ProfileTab":
      return <User size={size} color={color} />;
    default:
      return <Search size={size} color={color} />;
  }
}

function HeaderRight({ colors, isDark }: { colors: any; isDark: boolean }) {
  const navigation = useNavigation<any>();
  const iconColor = isDark ? colors.textPrimary : colors.textSecondary;
  const bgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 12 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Messages")}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
        }}
      >
        <MessageSquare size={19} color={iconColor} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Notifications")}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
        }}
      >
        <Bell size={19} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const LAST_TAB_KEY = 'nav:lastTab';
const TAB_NAMES = ['HomeTab', 'RentTab', 'BuyTab', 'WishlistTab', 'ProfileTab'];

export default function MainTabs() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const initialRouteRef = useRef<string | undefined>(undefined);
  const [initialRoute, setInitialRoute] = React.useState<string | undefined>(undefined);

  // ── Restore last tab once on mount ─────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(LAST_TAB_KEY)
      .then((tab) => {
        if (tab && TAB_NAMES.includes(tab)) {
          initialRouteRef.current = tab;
          setInitialRoute(tab);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerBackground: () => (
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={{ flex: 1 }}
          />
        ),
        headerStyle: { 
          backgroundColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTransparent: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <BlurView
            intensity={100}
            tint={isDark ? "dark" : "light"}
            style={styles.tabBarBlur}
          />
        ),
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} type={route.name.includes('Buy') ? 'buy' : 'rent'} colors={colors} />
        ),
        headerTitle: () => {
          const label =
            route.name === 'HomeTab' ? 'Renters' :
            route.name === 'RentTab' ? 'Rent Properties' :
            route.name === 'BuyTab' ? 'Buy Properties' :
            route.name === 'WishlistTab' ? 'Wishlist' : 'Profile';
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image 
                source={require("../../assets/images/logo.png")} 
                style={{ width: 24, height: 24 }} 
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                {label}
              </Text>
            </View>
          );
        },
      })}
      screenListeners={{
        state: (e: any) => {
          const routes = e.data?.state?.routes;
          const idx    = e.data?.state?.index;
          if (routes && idx !== undefined) {
            const tabName = routes[idx]?.name;
            if (tabName) AsyncStorage.setItem(LAST_TAB_KEY, tabName).catch(() => {});
          }
        },
      }}
      initialRouteName={initialRoute ?? 'HomeTab'}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "Home",
          headerRight: () => <HeaderRight colors={colors} isDark={isDark} />,
        }}
      />
      <Tab.Screen
        name="RentTab"
        component={ListingsScreen}
        initialParams={{ type: "rent" }}
        options={{ title: "Rent" }}
      />
      <Tab.Screen
        name="BuyTab"
        component={ListingsScreen}
        initialParams={{ type: "buy" }}
        options={{ 
          title: "Buy",
          tabBarActiveTintColor: colors.success
        }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistScreen}
        options={{ title: "Saved" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "Profile", headerShown: false }}
      />
    </Tab.Navigator>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 28,
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBarBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: isDark ? 'rgba(30,41,59,0.25)' : 'rgba(248,250,252,0.25)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
