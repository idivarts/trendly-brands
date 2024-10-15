import { useWindowDimensions } from "react-native";

type useBreakpointsType = {
  'xl3': boolean;
  'xl2': boolean;
  xl: boolean;
  lg: boolean;
  md: boolean;
  sm: boolean;
  xs: boolean;
  width: number;
};

const useBreakpoints = (): useBreakpointsType => {
  const dimensions = useWindowDimensions();

  return {
    'xl3': dimensions.width >= 1536,
    'xl2': dimensions.width >= 1280,
    xl: dimensions.width >= 1024,
    lg: dimensions.width >= 768,
    md: dimensions.width >= 640,
    sm: dimensions.width >= 480,
    xs: dimensions.width < 480,
    width: dimensions.width,
  }
};

export default useBreakpoints;
