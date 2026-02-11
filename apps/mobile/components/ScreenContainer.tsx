import { Platform, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const H_PADDING = Platform.OS === "ios" ? 20 : 16;

type ScreenContainerProps = ViewProps & {
  /** Use safe area insets (default true). Set false for full-bleed screens like map. */
  safe?: boolean;
  /** Horizontal padding (default true). */
  padded?: boolean;
};

export function ScreenContainer({
  children,
  style,
  safe = true,
  padded = true,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  // Extract backgroundColor from style/className to ensure it extends into safe area
  const backgroundColor = (style as any)?.backgroundColor || 
    (props.className?.includes("bg-") ? undefined : undefined);

  return (
    <View
      style={[
        {
          flex: 1,
          // Background extends into safe area
          paddingTop: safe ? insets.top : 0,
          paddingBottom: safe ? insets.bottom : 0,
          paddingLeft: padded ? (safe ? Math.max(insets.left, H_PADDING) : H_PADDING) : (safe ? insets.left : 0),
          paddingRight: padded ? (safe ? Math.max(insets.right, H_PADDING) : H_PADDING) : (safe ? insets.right : 0),
        },
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}
