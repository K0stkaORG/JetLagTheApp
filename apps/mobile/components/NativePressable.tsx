import { Pressable, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useCallback } from "react";
import { Platform } from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NativePressableProps = PressableProps & {
  /** Use haptic feedback on press (light impact). No-op if expo-haptics not installed. */
  haptic?: boolean;
};

function triggerHaptic() {
  try {
    const Haptics = require("expo-haptics").default ?? require("expo-haptics");
    if (typeof Haptics?.impactAsync === "function") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Light ?? 1);
    }
  } catch {
    // expo-haptics not installed
  }
}

export function NativePressable({
  children,
  style,
  haptic = true,
  onPressIn,
  onPressOut,
  ...props
}: NativePressableProps) {
  const scale = useSharedValue(1);

  const onPressInHandler = useCallback(
    (e: any) => {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      if (haptic) triggerHaptic();
      onPressIn?.(e);
    },
    [haptic, onPressIn, scale]
  );

  const onPressOutHandler = useCallback(
    (e: any) => {
      scale.value = withSpring(1);
      onPressOut?.(e);
    },
    [onPressOut, scale]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      style={[animatedStyle, style]}
      onPressIn={onPressInHandler}
      onPressOut={onPressOutHandler}
      // Native touch feedback: 44pt minimum hit area
      hitSlop={Platform.OS === "ios" ? 8 : 4}>
      {children}
    </AnimatedPressable>
  );
}
