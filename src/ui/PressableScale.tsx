/**
 * A `Pressable` that gives itself a small amount of physical "give" on touch:
 * every button on the table uses this instead of `Pressable` directly, so the
 * spring lives in one place rather than being re-implemented at each call
 * site.
 *
 * `Pressable`'s own `pressed` render-prop still drives colour changes exactly
 * as before — this only adds the scale, and only while the finger is down,
 * settling back on release whether that release lands inside or outside the
 * button.
 */
import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import type {
  GestureResponderEvent,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

const PRESSED_SCALE = 0.96;

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  readonly style?:
    StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
}

export function PressableScale({
  style,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps): React.ReactElement {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  const handlePressIn = (event: GestureResponderEvent) => {
    animateTo(PRESSED_SCALE);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    animateTo(1);
    onPressOut?.(event);
  };

  return (
    <Pressable {...props} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      {(state) => (
        <Animated.View style={[{ transform: [{ scale }] }, resolveStyle(style, state)]}>
          {typeof props.children === 'function' ? props.children(state) : props.children}
        </Animated.View>
      )}
    </Pressable>
  );
}

function resolveStyle(
  style: PressableScaleProps['style'],
  state: { pressed: boolean },
): StyleProp<ViewStyle> {
  return typeof style === 'function' ? style(state) : style;
}
