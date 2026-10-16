import { Pressable, Text, TextInput, View } from 'react-native';
import { AnswerValue, Question as QuestionData } from '../../lib/survey';
import styles from './styles';

type QuestionProps = {
  question: QuestionData;
  value: AnswerValue;
  error?: string;
  onChange: (value: AnswerValue) => void;
};

type OptionProps = {
  label: string;
  selected: boolean;
  multi?: boolean;
  onPress: () => void;
};

function Option({ label, selected, multi, onPress }: OptionProps) {
  const mark = multi ? (selected ? '☑' : '☐') : selected ? '●' : '○';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
    >
      <Text style={styles.option}>
        {mark} {label}
      </Text>
    </Pressable>
  );
}

function Question({ question, value, error, onChange }: QuestionProps) {
  const text = typeof value === 'string' ? value : '';
  const selectedList = Array.isArray(value) ? value : [];

  const toggle = (opt: string) =>
    onChange(
      selectedList.includes(opt)
        ? selectedList.filter(v => v !== opt)
        : [...selectedList, opt],
    );

  return (
    <View style={styles.question}>
      <Text style={styles.label}>{question.label}</Text>

      {question.type === 'text' && (
        <TextInput
          style={question.multiline ? styles.notes : styles.input}
          multiline={question.multiline}
          value={text}
          onChangeText={onChange}
          maxLength={question.maxLength ?? 500}
        />
      )}

      {question.type === 'number' && (
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={text}
          onChangeText={t => onChange(t.replace(/[^0-9.]/g, ''))}
        />
      )}

      {question.type === 'boolean' && (
        <View style={styles.options}>
          <Option
            label="Yes"
            selected={value === true}
            onPress={() => onChange(true)}
          />
          <Option
            label="No"
            selected={value === false}
            onPress={() => onChange(false)}
          />
        </View>
      )}

      {question.type === 'single_select' && (
        <View style={styles.options}>
          {question.options?.map(opt => (
            <Option
              key={opt}
              label={opt}
              selected={value === opt}
              onPress={() => onChange(opt)}
            />
          ))}
        </View>
      )}

      {question.type === 'multi_select' && (
        <View style={styles.options}>
          <Text style={styles.hint}>Check all that apply</Text>
          {question.options?.map(opt => (
            <Option
              key={opt}
              label={opt}
              multi
              selected={selectedList.includes(opt)}
              onPress={() => toggle(opt)}
            />
          ))}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export default Question;
