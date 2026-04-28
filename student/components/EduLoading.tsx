import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface EduLoadingProps {
  size?: number;
  style?: ViewStyle;
}

const EduLoading: React.FC<EduLoadingProps> = ({ size = 65, style }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth infinite rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      })
    ).start();

    // Subtle pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      
      {/* 1. The Glowing Gradient Ring (Rotating) */}
      <Animated.View style={[
        styles.ringWrapper,
        { 
          width: size, 
          height: size, 
          transform: [{ rotate: spin }] 
        }
      ]}>
        <LinearGradient
          colors={['#6366F1', '#A855F7', '#EC4899', 'transparent']}
          style={styles.gradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* 2. The Inner Core (Static/Pulsing) */}
      <Animated.View style={[
        styles.core,
        { 
          width: size * 0.75, 
          height: size * 0.75,
          transform: [{ scale }] 
        }
      ]}>
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          style={styles.coreGradient}
        >
          <Text style={[styles.eText, { fontSize: size * 0.35 }]}>E</Text>
          <View style={styles.badge} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringWrapper: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 3,
  },
  gradientRing: {
    flex: 1,
    borderRadius: 20,
  },
  core: {
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  coreGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eText: {
    color: '#ffffff',
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -2,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#fff',
  }
});

export default EduLoading;

