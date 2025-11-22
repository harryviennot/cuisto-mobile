import { useWindowDimensions } from "react-native";

/**
 * Custom hook to determine device type and orientation
 * Values automatically update when device orientation changes
 */
export function useDeviceType() {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const isTabletLandscape = width >= 768 && width > height;
  const isTabletPortrait = width >= 768 && height > width;
  const isPhone = width < 768;

  return {
    width,
    height,
    isTablet,
    isTabletLandscape,
    isTabletPortrait,
    isPhone,
  };
}
