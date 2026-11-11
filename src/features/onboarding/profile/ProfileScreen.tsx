// Figma: Creating an Account 03 (empty) / 02 (name) / 01 (name + phone).
import type { TextInputRef } from '@/components/Field/Field';
import { useRef, useState } from 'react';
import { ActionSheetIOS, Platform, Pressable, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { AuthScreen, Heading } from '@/components/AuthScreen/AuthScreen';
import { Field } from '@/components/Field/Field';
import { useAccount } from '@/features/account/AccountProvider';
import { finishAuth } from '@/features/onboarding/finishAuth';
import { useSignUp } from '@/features/onboarding/SignUpProvider';
import CaretDown from '@/icons/caret-down.svg';
import { colors, type } from '@/styles/theme';
import styles from './styles';

const COUNTRY_CODES = [
  { code: '+1', name: 'United States' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+61', name: 'Australia' },
  { code: '+62', name: 'Indonesia' },
  { code: '+65', name: 'Singapore' },
  { code: '+81', name: 'Japan' },
  { code: '+91', name: 'India' },
];

export default function ProfileScreen() {
  const signUp = useSignUp();
  const { signIn } = useAccount();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const phoneRef = useRef<TextInputRef>(null);

  const valid = name.trim().length > 0 && phone.replace(/\D/g, '').length >= 6;

  const pickCountry = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...COUNTRY_CODES.map(c => `${c.name} ${c.code}`), 'Cancel'],
          cancelButtonIndex: COUNTRY_CODES.length,
        },
        i => i < COUNTRY_CODES.length && setCountryCode(COUNTRY_CODES[i].code),
      );
    } else {
      const i = COUNTRY_CODES.findIndex(c => c.code === countryCode);
      setCountryCode(COUNTRY_CODES[(i + 1) % COUNTRY_CODES.length].code);
    }
  };

  const submit = () => {
    if (!valid) return;
    signIn({
      name: name.trim(),
      email: signUp.email || 'you@example.com',
      phone: `${countryCode} ${phone.trim()}`,
    });
    finishAuth(`Welcome to Borp, ${name.trim().split(' ')[0]}!`, signUp.reset);
  };

  return (
    <AuthScreen nav="back" keyboard>
      <Heading
        title="We would love to know you"
        subtitle="Enter your profile details"
      />
      <View style={styles.fields}>
        <Field
          label="Name"
          labelGap={8}
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
          submitBehavior="submit"
        />
        <View style={styles.phoneGroup}>
          <Text style={[type.label, styles.ink]}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <Pressable
              onPress={pickCountry}
              style={styles.cc}
              accessibilityRole="button"
              accessibilityLabel={`Country code ${countryCode}`}
            >
              <Text style={[type.input, styles.ink]}>{countryCode}</Text>
              <View style={styles.ccCaret}>
                <CaretDown color={colors.ink} />
              </View>
            </Pressable>
            <Field
              ref={phoneRef}
              containerStyle={styles.flex}
              accessibilityLabel="Phone number"
              value={phone}
              onChangeText={v => setPhone(v.replace(/[^\d\s-]/g, ''))}
              keyboardType="phone-pad"
              autoComplete="tel-national"
              textContentType="telephoneNumber"
            />
          </View>
        </View>
      </View>
      <View style={styles.spacer} />
      <ActionButton label="Continue" disabled={!valid} onPress={submit} />
    </AuthScreen>
  );
}
