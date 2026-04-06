import React, { useState } from 'react';
import { View, ScrollView, Image, Dimensions, StyleSheet, Text, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Grid3X3 } from 'lucide-react-native';
import { colors } from '../../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FALLBACK_IMAGE = 'https://via.placeholder.com/800x600?text=No+Image';

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const validImages = images?.filter(img => img && typeof img === 'string') || [];
  const hasImages = validImages.length > 0;
  const displayImages = hasImages ? validImages : [FALLBACK_IMAGE];

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  if (!hasImages) {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <Text style={styles.placeholderText}>No Photos Available</Text>
      </View>
    );
  }

  // Render different layouts based on image count
  const renderGalleryLayout = () => {
    if (displayImages.length === 1) {
      // Single image with gradient overlay
      return (
        <Pressable onPress={() => setIsModalOpen(true)} style={styles.singleImageContainer}>
          <Image source={{ uri: displayImages[0] }} style={styles.singleImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.5, 1]}
            style={styles.gradientOverlay}
          />
        </Pressable>
      );
    } else if (displayImages.length <= 3) {
      // 2-3 images layout
      return (
        <View style={styles.twoThreeLayout}>
          <Pressable onPress={() => { setActiveIndex(0); setIsModalOpen(true); }} style={styles.mainImage}>
            <Image source={{ uri: displayImages[0] }} style={styles.fullImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.5, 1]}
              style={styles.gradientOverlay}
            />
          </Pressable>
          <View style={styles.sideImages}>
            {displayImages.slice(1, 3).map((img, idx) => (
              <Pressable 
                key={idx} 
                onPress={() => { setActiveIndex(idx + 1); setIsModalOpen(true); }}
                style={styles.sideImage}
              >
                <Image source={{ uri: img }} style={styles.fullImage} resizeMode="cover" />
              </Pressable>
            ))}
          </View>
        </View>
      );
    } else {
      // 4+ images - Bento grid
      return (
        <View style={styles.bentoGrid}>
          {/* Main large image with gradient */}
          <Pressable onPress={() => { setActiveIndex(0); setIsModalOpen(true); }} style={styles.bentoMain}>
            <Image source={{ uri: displayImages[0] }} style={styles.fullImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.5, 1]}
              style={styles.gradientOverlay}
            />
          </Pressable>
          
          {/* Secondary images */}
          <View style={styles.bentoSecondary}>
            {displayImages.slice(1, 5).map((img, idx) => (
              <Pressable 
                key={idx}
                onPress={() => { setActiveIndex(idx + 1); setIsModalOpen(true); }}
                style={styles.bentoSmall}
              >
                <Image source={{ uri: img }} style={styles.fullImage} resizeMode="cover" />
                {idx === 3 && displayImages.length > 5 && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreText}>+{displayImages.length - 5}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
  };

  return (
    <>
      <View style={styles.container}>
        {renderGalleryLayout()}
        
        {/* View All Button - Icon only */}
        {displayImages.length > 1 && (
          <Pressable onPress={() => setIsModalOpen(true)} style={styles.viewAllButton}>
            <Grid3X3 size={22} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        )}
      </View>

      {/* Fullscreen Modal */}
      <Modal visible={isModalOpen} animationType="fade" transparent={false}>
        <View style={styles.modalContainer}>
          {/* Image Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentOffset={{ x: activeIndex * SCREEN_WIDTH, y: 0 }}
            style={styles.imageScrollView}
          >
            {displayImages.map((img, idx) => (
              <View key={idx} style={styles.modalImageContainer}>
                <Image source={{ uri: img }} style={styles.modalImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>

          {/* Header - Positioned absolutely on top */}
          <View style={styles.modalHeader}>
            <View style={styles.headerInfo}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalCounter}>{activeIndex + 1} of {displayImages.length}</Text>
            </View>
            <Pressable onPress={() => setIsModalOpen(false)} style={styles.closeButton}>
              <X size={24} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Thumbnail Strip */}
          {displayImages.length > 1 && (
            <View style={styles.thumbnailStrip}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailContent}>
                {displayImages.map((img, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => setActiveIndex(idx)}
                    style={[styles.thumbnail, idx === activeIndex && styles.thumbnailActive]}
                  >
                    <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 420,
    width: SCREEN_WIDTH,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  placeholder: {
    backgroundColor: '#f2f4f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#98a2b3',
    fontSize: 14,
  },
  
  // Single image layout
  singleImageContainer: {
    width: '100%',
    height: '100%',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  
  // 2-3 images layout
  twoThreeLayout: {
    flexDirection: 'row',
    height: '100%',
    gap: 2,
  },
  mainImage: {
    flex: 1,
  },
  sideImages: {
    flex: 1,
    gap: 2,
  },
  sideImage: {
    flex: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  
  // Bento grid layout (4+ images)
  bentoGrid: {
    flexDirection: 'row',
    height: '100%',
    gap: 2,
  },
  bentoMain: {
    flex: 2,
  },
  bentoSecondary: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  bentoSmall: {
    width: '48.5%',
    height: '48.5%',
    position: 'relative',
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // View All Button - Icon only with frosted glass effect
  viewAllButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 5,
  },
  viewAllText: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 60, // Increased for better safe area handling
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerInfo: {
    flex: 1,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCounter: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalImageContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  
  // Thumbnail strip
  thumbnailStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  thumbnailContent: {
    gap: 8,
    paddingHorizontal: 8,
  },
  thumbnail: {
    width: 64,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
