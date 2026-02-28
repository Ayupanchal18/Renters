import React, { useState } from 'react';
import { View, ScrollView, Image, Dimensions, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  if (!images || images.length === 0) {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <Text style={styles.placeholderText}>No Photos Available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {images.map((img, idx) => (
          <Image 
            key={idx} 
            source={{ uri: img }} 
            style={styles.image} 
            resizeMode="cover"
            accessible={true}
            accessibilityLabel={`${title} - image ${idx + 1}`}
          />
        ))}
      </ScrollView>
      {images.length > 1 && (
        <View style={styles.indicatorContainer}>
          <Text style={styles.indicatorText}>
            {activeIndex + 1} / {images.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: SCREEN_WIDTH,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: SCREEN_WIDTH,
    height: 300,
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
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  indicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
