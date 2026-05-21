import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Svg, { Path, Circle, Line, G } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  SharedValue,
  WithSpringConfig,
} from "react-native-reanimated";
import { TunerColors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DIAL_SIZE = Math.min(SCREEN_WIDTH - 60, 360);
const DIAL_RADIUS = DIAL_SIZE / 2;
const STROKE_WIDTH = 3;
const TICK_LENGTH = 14;
const NEEDLE_LENGTH = DIAL_RADIUS - 50;
const MARKER_SIZE = 16;

const SPRING_CONFIG: WithSpringConfig = {
  damping: 18,
  stiffness: 120,
  mass: 0.6,
};

interface SpeedometerDialProps {
  cents: SharedValue<number>;
  isInTune: SharedValue<boolean>;
  isActive: SharedValue<boolean>;
  targetCents?: number | null;
}

function generateArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);
  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

function generateTicks(
  centerX: number,
  centerY: number,
  radius: number,
  tickCount: number
): { x1: number; y1: number; x2: number; y2: number; isMajor: boolean }[] {
  const ticks = [];
  const startAngle = 180;
  const endAngle = 360;
  const angleRange = endAngle - startAngle;

  for (let i = 0; i <= tickCount; i++) {
    const angle = startAngle + (i / tickCount) * angleRange;
    const rad = (angle * Math.PI) / 180;

    const outerRadius = radius - 8;
    const isMajor = i % 5 === 0;
    const tickLen = isMajor ? TICK_LENGTH + 4 : TICK_LENGTH;
    const innerRadius = outerRadius - tickLen;

    ticks.push({
      x1: centerX + outerRadius * Math.cos(rad),
      y1: centerY + outerRadius * Math.sin(rad),
      x2: centerX + innerRadius * Math.cos(rad),
      y2: centerY + innerRadius * Math.sin(rad),
      isMajor,
    });
  }

  return ticks;
}

function generateLabels(
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number; value: string }[] {
  const labels = [];
  const values = [-50, -25, 0, 25, 50];
  const startAngle = 180;
  const endAngle = 360;
  const angleRange = endAngle - startAngle;
  const labelRadius = radius - 45;

  values.forEach((value) => {
    const normalizedPos = (value + 50) / 100;
    const angle = startAngle + normalizedPos * angleRange;
    const rad = (angle * Math.PI) / 180;

    labels.push({
      x: centerX + labelRadius * Math.cos(rad),
      y: centerY + labelRadius * Math.sin(rad),
      value: value === 0 ? "0" : (value > 0 ? `+${value}` : `${value}`),
    });
  });

  return labels;
}

function getMarkerPosition(cents: number, centerX: number, centerY: number, radius: number) {
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const normalizedPos = (clampedCents + 50) / 100;
  const angle = 180 + normalizedPos * 180;
  const rad = (angle * Math.PI) / 180;
  const markerRadius = radius - 30;
  
  return {
    x: centerX + markerRadius * Math.cos(rad),
    y: centerY + markerRadius * Math.sin(rad),
  };
}

export function SpeedometerDial({ cents, isInTune, isActive, targetCents }: SpeedometerDialProps) {
  const centerX = DIAL_SIZE / 2;
  const centerY = DIAL_SIZE / 2;

  const arcPath = useMemo(() => generateArcPath(
    centerX,
    centerY,
    DIAL_RADIUS - STROKE_WIDTH / 2 - 4,
    180,
    360
  ), [centerX, centerY]);

  const ticks = useMemo(() => generateTicks(centerX, centerY, DIAL_RADIUS, 20), [centerX, centerY]);
  const labels = useMemo(() => generateLabels(centerX, centerY, DIAL_RADIUS), [centerX, centerY]);

  const targetMarkerPos = useMemo(() => {
    if (targetCents === null || targetCents === undefined) return null;
    return getMarkerPosition(0, centerX, centerY, DIAL_RADIUS);
  }, [targetCents, centerX, centerY]);

  const animatedAngle = useDerivedValue(() => {
    const centsValue = cents.value;
    const clampedCents = Math.max(-50, Math.min(50, centsValue));
    const normalizedPosition = clampedCents / 50;
    const angle = normalizedPosition * 90;
    return withSpring(angle, SPRING_CONFIG);
  });

  const needleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${animatedAngle.value}deg` }],
    };
  });

  const needleColorStyle = useAnimatedStyle(() => {
    const hasTarget = targetCents !== null && targetCents !== undefined;
    if (hasTarget) {
      return { backgroundColor: TunerColors.needleRed };
    }
    return {
      backgroundColor: isInTune.value ? TunerColors.needleGreen : TunerColors.needleRed,
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isActive.value ? TunerColors.signalIndicator : "transparent",
    };
  });

  return (
    <View style={styles.container}>
      <View style={[styles.dialWrapper, { width: DIAL_SIZE, height: DIAL_SIZE / 2 + 40 }]}>
        <Svg 
          width={DIAL_SIZE} 
          height={DIAL_SIZE / 2 + 10} 
          viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE / 2 + 10}`}
          style={styles.svg}
        >
          <Path
            d={arcPath}
            stroke={TunerColors.dialArc}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />

          <G>
            {ticks.map((tick, index) => (
              <Line
                key={index}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={tick.isMajor ? TunerColors.text : TunerColors.dialArc}
                strokeWidth={tick.isMajor ? 2 : 1.5}
                strokeLinecap="round"
              />
            ))}
          </G>

          <Circle
            cx={centerX}
            cy={centerY}
            r={12}
            fill={TunerColors.surface}
            stroke={TunerColors.dialArc}
            strokeWidth={2}
          />

          {targetMarkerPos ? (
            <Circle
              cx={targetMarkerPos.x}
              cy={targetMarkerPos.y}
              r={MARKER_SIZE / 2}
              fill={TunerColors.needleGreen}
              stroke={TunerColors.background}
              strokeWidth={2}
            />
          ) : null}
        </Svg>

        {labels.map((label, index) => (
          <Text
            key={index}
            style={[
              styles.label,
              {
                left: label.x - 18,
                top: label.y - 8,
              },
            ]}
          >
            {label.value}
          </Text>
        ))}

        <Animated.View
          style={[
            styles.needleContainer,
            {
              left: centerX - 2,
              top: centerY - NEEDLE_LENGTH,
              height: NEEDLE_LENGTH,
              transformOrigin: `2px ${NEEDLE_LENGTH}px`,
            },
            needleAnimatedStyle,
          ]}
        >
          <Animated.View style={[styles.needle, needleColorStyle, { height: NEEDLE_LENGTH }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.signalIndicator,
            {
              left: centerX - 6,
              top: centerY + 25,
            },
            indicatorStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  dialWrapper: {
    position: "relative",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  needleContainer: {
    position: "absolute",
    width: 4,
    alignItems: "center",
  },
  needle: {
    width: 4,
    borderRadius: 2,
  },
  signalIndicator: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    position: "absolute",
    width: 36,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: TunerColors.dialArc,
  },
});
