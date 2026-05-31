import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, typography } from '@/lib/theme/tokens';

type Variant = keyof typeof typography | 'link';

type AppTextProps = TextProps & {
  variant?: Variant;
  muted?: boolean;
  color?: string;
};

export function AppText({
  variant = 'body',
  muted,
  color,
  style,
  ...props
}: AppTextProps) {
  const baseStyle: TextStyle =
    variant === 'link'
      ? { ...typography.body, color: colors.accent.secondary }
      : { ...typography[variant], color: color ?? (muted ? colors.text.muted : colors.text.primary) };

  return <Text style={[baseStyle, style]} {...props} />;
}
