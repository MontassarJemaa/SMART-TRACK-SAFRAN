import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface LogoProps {
  /** Scale factor for the logo size */
  scale?: number;
  /** Width of the logo (if not set, defaults to 200 * scale) */
  width?: number;
  /** Height of the logo (if not set, maintains aspect ratio based on width) */
  height?: number;
}

/**
 * Safran Smart Track Logo Component
 * Renders the official Safran Smart Track logo image
 */
export default function Logo({ scale = 1, width, height }: LogoProps) {
  const logoWidth = width ?? 200 * scale;
  const logoHeight = height ?? logoWidth * 0.5;

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/safran-smart-track-logo.jpg')}
        style={[
          styles.logo,
          {
            width: logoWidth,
            height: logoHeight,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Dimensions are set dynamically via style prop
  },
});