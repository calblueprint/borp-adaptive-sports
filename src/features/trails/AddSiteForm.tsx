import type { SiteFormValues } from '@/lib/siteForm';
import type { Site } from '@/lib/sites';
import type { TextInputProps } from 'react-native';
import { useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Button from '@/components/Button/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  EMPTY_SITE_FORM,
  SITE_SURFACES,
  toSiteInput,
  validateSiteForm,
} from '@/lib/siteForm';
import colors from '@/styles/colors';
import { createSite } from '~/api/supabase/queries/sites';
import styles from './addSiteStyles';

type AddSiteFormProps = {
  onClose: () => void;
  onCreated: (site: Site) => void;
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
};

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  half?: boolean;
};

function Field({ label, error, multiline, half, ...props }: FieldProps) {
  return (
    <View style={[styles.field, half && styles.column]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={colors.gray}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.notes,
          error && styles.invalidInput,
        ]}
      />
      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}

export default function AddSiteForm({
  onClose,
  onCreated,
  saving,
  onSavingChange,
}: AddSiteFormProps) {
  const { session } = useAuth();
  const [values, setValues] = useState<SiteFormValues>(EMPTY_SITE_FORM);
  const [touched, setTouched] = useState<
    Partial<Record<keyof SiteFormValues, boolean>>
  >({});
  const [message, setMessage] = useState('');
  const submitting = useRef(false);
  const errors = validateSiteForm(values);
  const valid = Object.keys(errors).length === 0;

  function change(field: keyof SiteFormValues, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setMessage('');
  }

  function fieldProps(field: keyof SiteFormValues) {
    return {
      value: values[field],
      editable: !saving,
      error: touched[field] ? errors[field] : undefined,
      onChangeText: (value: string) => change(field, value),
      onBlur: () => setTouched(previous => ({ ...previous, [field]: true })),
    };
  }

  async function submit() {
    if (submitting.current || !valid) return;
    if (!session) {
      setMessage('Please sign in before adding a trail.');
      return;
    }

    submitting.current = true;
    onSavingChange(true);
    setMessage('');
    try {
      const site = await createSite(toSiteInput(values), session.user.id);
      Keyboard.dismiss();
      onCreated(site);
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : 'Could not add this trail. Check your connection and try again.',
      );
    } finally {
      submitting.current = false;
      onSavingChange(false);
    }
  }

  // Android's numeric keyboards can omit the minus key needed for longitude.
  const coordinateKeyboard =
    Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default';

  return (
    <>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Add a trail
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close add trail"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={onClose}
          style={styles.close}
          hitSlop={8}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.fields}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.location}>
          <Text style={styles.locationTitle}>Trailhead location</Text>
          <Text style={styles.hint}>
            Enter the trailhead’s coordinates in decimal degrees.
          </Text>
          <View style={styles.row}>
            <Field
              {...fieldProps('lat')}
              half
              label="Latitude"
              placeholder="37.9036"
              keyboardType={coordinateKeyboard}
              autoCorrect={false}
              autoCapitalize="none"
              maxLength={30}
            />
            <Field
              {...fieldProps('lng')}
              half
              label="Longitude"
              placeholder="-122.2580"
              keyboardType={coordinateKeyboard}
              autoCorrect={false}
              autoCapitalize="none"
              maxLength={30}
            />
          </View>
        </View>

        <Field
          {...fieldProps('name')}
          label="Trail name"
          placeholder="Jewel Lake Boardwalk"
          maxLength={200}
          autoCapitalize="words"
        />

        <Text style={styles.optional}>Optional</Text>
        <Field
          {...fieldProps('park')}
          label="Park"
          placeholder="Tilden Regional Park"
          maxLength={200}
          autoCapitalize="words"
        />
        <View style={styles.row}>
          <Field
            {...fieldProps('city')}
            half
            label="City"
            placeholder="Berkeley"
            maxLength={200}
            autoCapitalize="words"
          />
          <Field
            {...fieldProps('county')}
            half
            label="County"
            placeholder="Alameda"
            maxLength={200}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Main surface</Text>
          <View style={styles.chips}>
            {SITE_SURFACES.map(surface => {
              const selected = values.surface_type === surface;
              return (
                <Pressable
                  key={surface}
                  accessibilityRole="button"
                  accessibilityLabel={surface}
                  accessibilityState={{ selected, disabled: saving }}
                  disabled={saving}
                  onPress={() =>
                    change('surface_type', selected ? '' : surface)
                  }
                  style={[styles.chip, selected && styles.selectedChip]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.selectedChipText,
                    ]}
                  >
                    {surface}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Field
          {...fieldProps('trail_length_m')}
          label="Trail length (meters)"
          placeholder="e.g. 800"
          keyboardType="decimal-pad"
          maxLength={30}
        />
        <Field
          {...fieldProps('notes')}
          label="Notes"
          placeholder="Anything else to know about this trail"
          maxLength={2000}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.hint}>
          An internet connection is needed to add a trail.
        </Text>
        {message !== '' && (
          <Text style={styles.error} accessibilityRole="alert">
            {message}
          </Text>
        )}
        <Button
          text={saving ? 'Adding trail…' : 'Add trail'}
          disabled={saving || !valid}
          onPress={() => void submit()}
        />
      </View>
    </>
  );
}
