import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Header from '@/components/Header/Header';
import styles from './styles';

type FormScreenProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  // Pinned to the bottom, usually the main button
  footer?: ReactNode;
  children: ReactNode;
};

// Standard form page: header, title + subtitle, fields, and a bottom button.
// Keeps fields above the keyboard.
export default function FormScreen({
  title,
  subtitle,
  onBack,
  onClose,
  footer,
  children,
}: FormScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <Header onBack={onBack} onClose={onClose} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heading}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.body}>{children}</View>
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
