import { useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

const ARC_WIDTH = 36;
const ARC_RADII = [180, 140, 100];
const ARC_COLORS = ["#EB3539", "#F57A3C", "#FFBF40"];

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = {
    x: cx + r * Math.cos((startAngle * Math.PI) / 180),
    y: cy + r * Math.sin((startAngle * Math.PI) / 180),
  };
  const end = {
    x: cx + r * Math.cos((endAngle * Math.PI) / 180),
    y: cy + r * Math.sin((endAngle * Math.PI) / 180),
  };
  const largeArc = Math.abs(endAngle - startAngle) <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function AuthBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {ARC_RADII.map((r, i) => (
        <Path
          key={`tl-${i}`}
          d={arcPath(0, 0, r, 0, 90)}
          stroke={ARC_COLORS[i]}
          strokeWidth={ARC_WIDTH}
          strokeLinecap="round"
          fill="none"
        />
      ))}
      {ARC_RADII.map((r, i) => (
        <Path
          key={`br-${i}`}
          d={arcPath(width, height, r, 180, 270)}
          stroke={ARC_COLORS[i]}
          strokeWidth={ARC_WIDTH}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </Svg>
  );
}
