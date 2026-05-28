import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * Background Logo Component
 * Displays a subtle watermark-style logo in the background of the app
 */
export default function BackgroundLogo() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require('@/assets/images/logo-safran1-r.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.06,
    zIndex: 0,
  },
  logo: {
    width: 400,
    height: 400,
  },
});
