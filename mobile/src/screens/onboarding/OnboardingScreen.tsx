import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  Heart,
  Home,
  PenSquare,
  ChevronRight,
  X,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

/* ─── Slide Data ──────────────────────────────────────────── */

const SLIDES = [
  {
    id: '1',
    Icon: Search,
    gradient: ['#0f172a', '#1e3a5f', '#0f172a'] as const,
    accentColor: '#3b82f6',
    title: 'Find Your\nPerfect Home',
    subtitle:
      'Search thousands of verified rent and buy listings across India. Filter by city, budget, and type in seconds.',
    badge: 'Smart Search',
  },
  {
    id: '2',
    Icon: Home,
    gradient: ['#0f172a', '#1a3325', '#0f172a'] as const,
    accentColor: '#22c55e',
    title: 'Browse\nVerified Listings',
    subtitle:
      'Every property is verified with real photos and honest pricing. No scams, no hidden costs.',
    badge: 'Verified Properties',
  },
  {
    id: '3',
    Icon: Heart,
    gradient: ['#0f172a', '#3b1f3b', '#0f172a'] as const,
    accentColor: '#ec4899',
    title: 'Save What\nYou Love',
    subtitle:
      'Shortlist properties with a tap. Compare them anytime and share with your family.',
    badge: 'Wishlist & Share',
  },
  {
    id: '4',
    Icon: PenSquare,
    gradient: ['#0f172a', '#2d1f0f', '#0f172a'] as const,
    accentColor: '#f59e0b',
    title: 'Post a Property\nFor Free',
    subtitle:
      'Are you a landlord or agent? List your property in minutes and reach thousands of tenants.',
    badge: 'List for Free',
  },
];

/* ─── Individual Slide ────────────────────────────────────── */

function Slide({
  item,
}: {
  item: (typeof SLIDES)[0];
}) {
  const { Icon, gradient, accentColor, title, subtitle, badge } = item;

  return (
    <View style={{ width, flex: 1 }}>
      <LinearGradient colors={gradient as any} style={StyleSheet.absoluteFill} />

      {/* Big icon centrepiece */}
      <View style={styles.iconSection}>
        <View style={[styles.iconOuter, { borderColor: accentColor + '33' }]}>
          <View style={[styles.iconInner, { backgroundColor: accentColor + '1a' }]}>
            <Icon size={72} color={accentColor} strokeWidth={1.5} />
          </View>
        </View>
        {/* Glow rings */}
        <View style={[styles.ring1, { borderColor: accentColor + '22' }]} />
        <View style={[styles.ring2, { borderColor: accentColor + '11' }]} />
      </View>

      {/* Text */}
      <View style={styles.textSection}>
        <View style={[styles.badge, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
          <Text style={[styles.badgeText, { color: accentColor }]}>{badge}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

/* ─── Dot Indicator ───────────────────────────────────────── */

function Dots({ index, accent }: { index: number; accent: string }) {
  return (
    <View style={styles.dotsRow}>
      {SLIDES.map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: i === index ? 24 : 8,
              backgroundColor: i === index ? accent : 'rgba(255,255,255,0.25)',
            },
          ]}
        />
      ))}
    </View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────── */

type Props = {
  onDone: () => void;
};

export default function OnboardingScreen({ onDone }: Props) {
  const { continueAsGuest } = useAuth();
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const current = SLIDES[activeIndex];

  // Track active slide index
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index!);
      }
    }
  ).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      handleExplore();
    }
  };

  const handleExplore = () => {
    continueAsGuest();
    onDone();
  };

  const handleSignUp = () => {
    // Navigate to Register within the current navigator, then mark onboarding done
    navigation.navigate('Register');
    // Small delay so Register mounts before navigator switches
    setTimeout(onDone, 80);
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Skip button — top right */}
      <Pressable style={styles.skip} onPress={handleExplore} hitSlop={16}>
        <X size={20} color="rgba(255,255,255,0.5)" />
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={{ flex: 1 }}
      />

      {/* Bottom controls */}
      <View style={styles.bottomSheet}>
        <Dots index={activeIndex} accent={current.accentColor} />

        {/* Primary CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: current.accentColor, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleNext}
        >
          {isLast ? (
            <Text style={styles.primaryBtnText}>Explore Now — It's Free</Text>
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Next</Text>
              <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
            </>
          )}
        </Pressable>

        {/* Secondary: Sign up (shown from slide 2 onwards) */}
        {activeIndex >= 1 && (
          <Pressable style={styles.secondaryBtn} onPress={handleSignUp}>
            <Text style={styles.secondaryBtnText}>
              Create Account &nbsp;
              <Text style={{ color: current.accentColor }}>→</Text>
            </Text>
          </Pressable>
        )}

        {/* Tiny legal note */}
        <Text style={styles.legal}>
          By continuing you agree to our Terms &amp; Privacy Policy
        </Text>
      </View>
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */

const BOTTOM_H = 220;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  skip: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 99,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Slide
  iconSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: BOTTOM_H,
  },
  iconOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 1,
  },
  ring2: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
  },
  textSection: {
    position: 'absolute',
    bottom: BOTTOM_H + 20,
    left: 28,
    right: 28,
    zIndex: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 42,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
    fontWeight: '400',
  },

  // Bottom
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_H,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 16,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    gap: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    paddingVertical: 4,
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '600',
  },
  legal: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    marginTop: -4,
  },
});
