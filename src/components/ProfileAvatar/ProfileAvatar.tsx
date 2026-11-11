import type { User } from '@/features/account/AccountProvider';
import { Image, Text, View } from 'react-native';
import { initials, photoSource } from '@/features/account/AccountProvider';
import styles from './styles';

/** Your photo, or your initials on navy. */
export function ProfileAvatar({
  user,
  size = 72,
}: {
  user: Pick<User, 'name' | 'photo'>;
  size?: number;
}) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (user.photo)
    return (
      <Image
        source={photoSource(user.photo)}
        style={[round, styles.photo]}
        accessibilityLabel="Your photo"
        accessibilityIgnoresInvertColors
      />
    );
  return (
    <View
      style={[round, styles.initials]}
      accessible
      accessibilityLabel={`${user.name}, no photo`}
    >
      <Text style={[styles.initialsText, { fontSize: size * 0.36 }]}>
        {initials(user.name) || '?'}
      </Text>
    </View>
  );
}
