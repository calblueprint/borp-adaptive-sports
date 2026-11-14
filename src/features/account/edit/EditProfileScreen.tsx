// Personal info (edit profile) — not in Figma yet. Same fields as sign-up's "We would love to know you" (src/app/profile.tsx)
// plus a photo. Email is read-only: it's how BORP knows whose surveys are whose.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { Field } from '@/components/Field/Field';
import { Icon } from '@/components/Icon/Icon';
import { ProfileAvatar } from '@/components/ProfileAvatar/ProfileAvatar';
import { SubScreen } from '@/components/SubScreen/SubScreen';
import { pickPhoto } from '@/components/SurveyMedia/SurveyMedia';
import { useAccount } from '@/features/account/AccountProvider';
import { colors } from '@/styles/theme';
import styles from './styles';

export default function EditProfileScreen() {
  const { user, updateUser } = useAccount();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [photo, setPhoto] = useState(user.photo);

  const changed =
    name.trim() !== user.name ||
    phone.trim() !== (user.phone ?? '') ||
    photo !== user.photo;
  const valid = name.trim().length > 0;

  const save = () => {
    updateUser({ name: name.trim(), phone: phone.trim() || undefined, photo });
    router.back();
  };
  const choosePhoto = async () => {
    const uri = await pickPhoto();
    if (uri) setPhoto(uri);
  };

  return (
    <SubScreen
      title="Personal info"
      cta={
        <ActionButton
          label="Save"
          size="large"
          disabled={!changed || !valid}
          onPress={save}
        />
      }
    >
      {/* The photo is the button, with a camera badge, like a contact card */}
      <View style={styles.photoBlock}>
        <Pressable
          onPress={choosePhoto}
          accessibilityRole="button"
          accessibilityLabel={photo ? 'Change photo' : 'Add a photo'}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <ProfileAvatar
            user={{ name: name || user.name, photo }}
            size={AVATAR}
          />
          <View style={styles.badge}>
            <Icon
              name="camera"
              size={18}
              color={colors.ink}
              strokeWidth={1.9}
            />
          </View>
        </Pressable>
        {photo ? (
          <Pressable
            onPress={() => setPhoto(undefined)}
            hitSlop={12}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.remove}>Remove photo</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.fields}>
        <Field
          label="Name"
          labelGap={8}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          error={
            valid ? undefined : 'Add your name so BORP knows who surveyed.'
          }
        />
        <Field
          label="Phone number"
          labelGap={8}
          value={phone}
          onChangeText={v => setPhone(v.replace(/[^\d\s+()-]/g, ''))}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />
        <View style={styles.readonly}>
          <Field label="Email" labelGap={8} readOnly value={user.email} />
          <Text style={styles.hint}>To change your email, contact BORP.</Text>
        </View>
      </View>
    </SubScreen>
  );
}

const AVATAR = 112;
