import React, { useMemo } from 'react';
import { ImageBackground, View, StyleSheet } from 'react-native';

const defaultBackgrounds = [
  require('../assets/background.png'),
  require('../assets/group-post-workout.png'),
  require('../assets/woman-kettle-bells.png'),
];

export default function Background({
  children,
  style,
  blurRadius = 3,
  overlayOpacity = 0.50,
  source,
  resizeMode = 'cover',
}) {
  const chosenSource = useMemo(() => {
    if (source) return source;
    const idx = Math.floor(Math.random() * defaultBackgrounds.length);
    return defaultBackgrounds[idx];
  }, [source]);

  return (
    <ImageBackground source={chosenSource} style={[styles.background, style]} resizeMode={resizeMode} blurRadius={blurRadius}>
      <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]} />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});


