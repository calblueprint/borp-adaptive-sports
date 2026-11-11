// Settings — not in Figma yet. Quiet captions over hairline rows, no cards, like Airbnb's account
// settings. One line of help only where a first-timer would guess wrong; the rest is in VoiceOver hints.
// Everything here is local to the prototype: switches remember their state until the app reloads.
import { Alert, Linking, Platform, Text } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Section } from '@/components/List/List';
import { Segmented } from '@/components/Segmented/Segmented';
import {
  Group,
  Row,
  SubScreen,
  SwitchRow,
} from '@/components/SubScreen/SubScreen';
import { OFFLINE_PACK_MB } from '@/data/survey';
import { useAccount } from '@/features/account/AccountProvider';
import { useSurvey } from '@/features/survey/SurveyProvider';
import { comingSoon } from '@/lib/comingSoon';
import styles from './styles';

const UNITS = [
  { key: 'in' as const, label: 'Inches' },
  { key: 'cm' as const, label: 'Centimeters' },
];

function confirm(
  title: string,
  message: string,
  action: string,
  onConfirm: () => void,
) {
  if (Platform.OS === 'web') return onConfirm();
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function SettingsScreen() {
  const { user, settings, setSetting, signOut } = useAccount();
  const { session, submissions, offlineCount, clearOffline } = useSurvey();
  const waiting = submissions.filter(s => s.status === 'waiting').length;

  const leave = () => {
    signOut();
    router.dismissAll();
    router.replace('/');
  };
  const confirmSignOut = () =>
    confirm(
      'Sign out?',
      session || waiting
        ? 'You have a survey that hasn’t been sent yet. It stays on this phone and sends when you sign back in.'
        : 'You can sign back in any time with your email.',
      'Sign out',
      leave,
    );
  const confirmDelete = () =>
    confirm(
      'Delete your account?',
      'Your profile is removed. Surveys BORP has already published stay on Access California without your name.',
      'Delete account',
      leave,
    );

  return (
    <SubScreen title="Settings">
      <Group title="Account">
        <Row
          icon="person"
          label="Personal info"
          onPress={() => router.push('/prototype/account/edit')}
        />
        <Row icon="mail" label="Email" value={user.email} />
        <Row
          icon="lock"
          label="Change password"
          onPress={() => comingSoon('Changing your password')}
        />
      </Group>

      <Section title="Measure in" gap={12}>
        <Segmented
          options={UNITS}
          value={settings.units}
          onChange={v => setSetting('units', v)}
          accessibilityLabel="Measurement units"
        />
      </Section>

      <Group title="Surveying">
        <SwitchRow
          icon="download"
          label="Save nearby trails for offline"
          detail="Within 10 mi, on Wi-Fi"
          value={settings.autoOffline}
          onChange={v => setSetting('autoOffline', v)}
        />
        <SwitchRow
          icon="upload"
          label="Upload media on Wi-Fi only"
          detail="Surveys still send right away"
          value={settings.wifiOnly}
          onChange={v => setSetting('wifiOnly', v)}
        />
        <Row
          icon="book"
          label="How surveys work"
          // The primer only needs a trail id to continue into a survey; review=1 just closes it
          onPress={() =>
            router.push({
              pathname: '/prototype/survey/[id]/primer',
              params: { id: 'guide', review: '1' },
            })
          }
        />
      </Group>

      <Group title="Notifications">
        <SwitchRow
          icon="bell"
          label="When BORP reviews my survey"
          value={settings.notifyReview}
          onChange={v => setSetting('notifyReview', v)}
        />
        <SwitchRow
          icon="pin"
          label="Trails near me that need a survey"
          detail="At most once a week"
          value={settings.notifyNearby}
          onChange={v => setSetting('notifyNearby', v)}
        />
      </Group>

      <Group title="Privacy">
        <SwitchRow
          icon="eye"
          label="Show my name on published surveys"
          detail={
            settings.showName
              ? `Shown as “${user.name.split(' ')[0]}”`
              : 'Shown as “Volunteer”'
          }
          value={settings.showName}
          onChange={v => setSetting('showName', v)}
        />
        <Row
          icon="locate"
          label="Location access"
          onPress={() => Linking.openSettings()}
          accessibilityHint="Opens your phone’s Settings"
        />
      </Group>

      <Group title="On this phone">
        <Row
          icon="storage"
          label="Offline trails"
          value={
            offlineCount
              ? `${offlineCount} · ${offlineCount * OFFLINE_PACK_MB} MB`
              : 'None'
          }
          onPress={
            offlineCount
              ? () =>
                  confirm(
                    'Remove offline trails?',
                    'You can save them again from any trail before you go.',
                    'Remove',
                    () => {
                      clearOffline();
                    },
                  )
              : undefined
          }
          accessibilityHint="Removes saved trail maps"
        />
        <Row
          icon="send"
          label="Waiting to send"
          value={
            waiting
              ? `${waiting} ${waiting === 1 ? 'survey' : 'surveys'}`
              : 'Nothing'
          }
        />
      </Group>

      <Group title="Help">
        <Row
          icon="help"
          label="Contact BORP"
          onPress={() => comingSoon('Contacting BORP')}
        />
        <Row
          icon="flag"
          label="Report a problem with the app"
          onPress={() => comingSoon('Reporting a problem')}
        />
        <Row
          icon="surveys"
          label="Privacy policy"
          onPress={() => comingSoon('The privacy policy')}
        />
      </Group>

      <Group>
        <Row
          icon="signOut"
          label="Sign out"
          destructive
          onPress={confirmSignOut}
        />
        <Row
          icon="trash"
          label="Delete account"
          destructive
          onPress={confirmDelete}
        />
      </Group>

      <Text style={styles.version}>
        Version {Constants.expoConfig?.version ?? '1.0.0'} · prototype, nothing
        leaves this phone
      </Text>
    </SubScreen>
  );
}
