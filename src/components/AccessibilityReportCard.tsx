import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AccessibilityReport,
  AccessibilityStandard,
  COMPLETE_COVERAGE,
  formatFeet,
  formatStation,
  TrailSurface,
} from '@/utils/accessibility';

type Option<T> = { label: string; value: T };

const STANDARD_OPTIONS: Option<AccessibilityStandard>[] = [
  { label: 'Trail (ABA 1017)', value: 'trail' },
  { label: 'Path (CBC 11B)', value: 'route' },
];
const SURFACE_OPTIONS: Option<TrailSurface>[] = [
  { label: 'Natural surface', value: 'natural' },
  { label: 'Paved or boards', value: 'paved' },
];

type SegmentedProps<T extends string> = {
  label: string;
  onChange: (value: T) => void;
  options: Option<T>[];
  value: T;
};

function Segmented<T extends string>({
  label,
  onChange,
  options,
  value,
}: SegmentedProps<T>) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="radiogroup"
      style={styles.segmented}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text
              style={[
                styles.segmentText,
                selected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type AccessibilityReportCardProps = {
  onExport: () => void;
  onStandardChange: (standard: AccessibilityStandard) => void;
  onSurfaceChange: (surface: TrailSurface) => void;
  report: AccessibilityReport;
  standard: AccessibilityStandard;
  surface: TrailSurface;
};

export default function AccessibilityReportCard({
  onExport,
  onStandardChange,
  onSurfaceChange,
  report,
  standard,
  surface,
}: AccessibilityReportCardProps) {
  const violations = report.findings.filter(f => f.severity === 'violation');
  const hasData = report.analyzedDistanceMeters > 0;
  const isComplete = report.coverage >= COMPLETE_COVERAGE;
  const coveragePercent = Math.floor(report.coverage * 100);
  const noSlopeData = 'Not enough elevation data yet to check slopes.';
  // Level readings can find violations even before there is slope data.
  const summary =
    violations.length > 0
      ? `${violations.length} possible violation${violations.length === 1 ? '' : 's'}`
      : !hasData
        ? noSlopeData
        : isComplete
          ? 'No slope violations found'
          : `No violations in the measured ${coveragePercent}% of the trail`;
  const summaryStyle =
    violations.length > 0
      ? styles.summaryFail
      : hasData && isComplete
        ? styles.summaryPass
        : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Accessibility check</Text>
      <Segmented
        label="Standard to check against"
        onChange={onStandardChange}
        options={STANDARD_OPTIONS}
        value={standard}
      />
      {standard === 'trail' && (
        <Segmented
          label="Trail surface"
          onChange={onSurfaceChange}
          options={SURFACE_OPTIONS}
          value={surface}
        />
      )}

      <Text
        accessibilityLiveRegion="polite"
        style={[styles.summary, summaryStyle]}
      >
        {summary}
      </Text>
      {!hasData && violations.length > 0 && (
        <Text style={styles.meta}>{noSlopeData}</Text>
      )}
      {hasData && (
        <Text style={styles.meta}>
          Measured {formatFeet(report.analyzedDistanceMeters)} of{' '}
          {formatFeet(report.totalDistanceMeters)} ({coveragePercent}%) using{' '}
          {report.source === 'barometer' ? 'barometer' : 'GPS'} elevation, slope
          averaged over {formatFeet(report.windowMeters)}. Steepest:{' '}
          {report.maxSlopePercent?.toFixed(1)}%. Pitches shorter than that are
          averaged down, so check steep spots with the slope level.
        </Text>
      )}
      {hasData && !isComplete && (
        <Text style={styles.warning}>
          Parts of the trail have no usable elevation, so they were not checked.
        </Text>
      )}
      {report.source === 'gps' && hasData && (
        <Text style={styles.warning}>
          No barometer readings, so slope is averaged over long stretches and
          short steep pitches can be missed.
        </Text>
      )}

      {report.findings.map((finding, index) => (
        <View
          key={`${finding.rule}-${finding.startMeters}-${index}`}
          style={styles.finding}
        >
          <View style={styles.findingHeader}>
            <Text
              style={[
                styles.badge,
                finding.severity === 'violation'
                  ? styles.badgeFail
                  : styles.badgeCaution,
              ]}
            >
              {finding.severity === 'violation' ? 'Violation' : 'Caution'}
            </Text>
            <Text style={styles.station}>{formatStation(finding)}</Text>
          </View>
          <Text style={styles.rule}>{finding.rule}</Text>
          <Text style={styles.detail}>
            Measured {finding.measured}. Limit: {finding.limit}.
          </Text>
          <Text style={styles.citation}>{finding.citation}</Text>
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={onExport}
        style={({ pressed }) => [
          styles.exportButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.exportText}>Share profile as CSV</Text>
      </Pressable>
      <Text style={styles.meta}>
        The CSV opens in the web Trail Slope Checker for a full plot.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  title: {
    color: '#101828',
    fontSize: 18,
    fontWeight: '700',
  },
  segmented: {
    backgroundColor: '#F2F4F7',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 8,
  },
  segmentSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#101828',
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentText: {
    color: '#475467',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  segmentTextSelected: {
    color: '#101828',
  },
  summary: {
    color: '#344054',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryFail: {
    color: '#B42318',
  },
  summaryPass: {
    color: '#067647',
  },
  meta: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  warning: {
    color: '#B54708',
    fontSize: 13,
    lineHeight: 18,
  },
  finding: {
    borderTopColor: '#EAECF0',
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 10,
  },
  findingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
    textTransform: 'uppercase',
  },
  badgeFail: {
    backgroundColor: '#FEE4E2',
    color: '#B42318',
  },
  badgeCaution: {
    backgroundColor: '#FEF0C7',
    color: '#B54708',
  },
  station: {
    color: '#475467',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  rule: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '600',
  },
  detail: {
    color: '#344054',
    fontSize: 14,
    lineHeight: 20,
  },
  citation: {
    color: '#667085',
    fontSize: 12,
  },
  exportButton: {
    alignItems: 'center',
    borderColor: '#344054',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 46,
  },
  exportText: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
