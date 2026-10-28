import { useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ElevationProfile } from '@/utils/elevationProfile';

type DistanceRange = { endMeters: number; startMeters: number };

type ElevationProfileChartProps = {
  /** Stretches to draw in red, such as accessibility violations. */
  flaggedRanges: DistanceRange[];
  profile: ElevationProfile;
};

const PLOT_HEIGHT = 170;
const Y_AXIS_WIDTH = 30;
const READOUT_HEIGHT = 22;
const COLUMN_WIDTH = 2;
/** Flat trails are drawn over at least this much height so noise looks flat. */
const MIN_ELEVATION_SPAN = 6;

function niceStep(roughStep: number) {
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step = [1, 2, 2.5, 5, 10]
    .map(multiple => multiple * magnitude)
    .find(candidate => candidate >= roughStep);
  return step ?? 10 * magnitude;
}

function axisTicks(low: number, high: number, count: number) {
  const step = niceStep((high - low) / count || 1);
  const ticks: number[] = [];
  for (
    let value = Math.ceil(low / step) * step;
    value <= high + 1e-9;
    value += step
  )
    ticks.push(Number(value.toFixed(6)));
  return ticks;
}

function formatMeters(elevation: number, absolute: boolean) {
  const rounded = Math.round(elevation);
  return absolute || rounded <= 0 ? `${rounded}` : `+${rounded}`;
}

export default function ElevationProfileChart({
  flaggedRanges,
  profile,
}: ElevationProfileChartProps) {
  const [width, setWidth] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);

  const { absolute, samples, totalDistanceMeters } = profile;
  const plotWidth = Math.max(width - Y_AXIS_WIDTH, 0);
  const useKilometers = totalDistanceMeters >= 1000;
  const distanceUnit = useKilometers ? 1000 : 1;

  // Vertical scale: nice gridlines around the data, never squeezed too flat.
  const middle = (profile.maxElevation + profile.minElevation) / 2;
  const span = Math.max(
    profile.maxElevation - profile.minElevation,
    MIN_ELEVATION_SPAN,
  );
  const yStep = niceStep(span / 3);
  const yLow = Math.floor((middle - span / 2) / yStep) * yStep;
  const yHigh = Math.max(
    Math.ceil((middle + span / 2) / yStep) * yStep,
    yLow + yStep,
  );
  const yTicks = axisTicks(yLow, yHigh, 3).filter(tick => tick > yLow);
  const yFor = (elevation: number) =>
    ((elevation - yLow) / (yHigh - yLow)) * PLOT_HEIGHT;

  const xTicks = axisTicks(0, totalDistanceMeters / distanceUnit, 3).filter(
    tick => tick > 0,
  );
  const xFor = (distance: number) =>
    totalDistanceMeters > 0 ? (distance / totalDistanceMeters) * plotWidth : 0;

  const sampleAt = (distance: number) => {
    const first = samples[0];
    const spacing =
      samples.length > 1 ? totalDistanceMeters / (samples.length - 1) : 1;
    const index = Math.round((distance - first.distance) / spacing);
    return samples[Math.min(Math.max(index, 0), samples.length - 1)];
  };

  const columnCount = Math.max(1, Math.floor(plotWidth / COLUMN_WIDTH));
  const columnWidth = plotWidth / columnCount;
  const columns = Array.from({ length: columnCount }, (_, index) => {
    const start = (index / columnCount) * totalDistanceMeters;
    const end = ((index + 1) / columnCount) * totalDistanceMeters;
    const flagged = flaggedRanges.some(
      range => range.startMeters <= end && range.endMeters >= start,
    );
    return { flagged, height: yFor(sampleAt((start + end) / 2).elevation) };
  });

  const firstSample = samples[0];
  const lastSample = samples.at(-1) ?? firstSample;
  const touched =
    touchX === null
      ? null
      : sampleAt((touchX / plotWidth) * totalDistanceMeters);

  function handleTouch(event: GestureResponderEvent) {
    const x = event.nativeEvent.locationX;
    setTouchX(Math.min(Math.max(x, 0), plotWidth));
  }

  return (
    <View
      onLayout={(event: LayoutChangeEvent) =>
        setWidth(event.nativeEvent.layout.width)
      }
    >
      <View style={styles.readoutRow}>
        {touched && (
          <Text style={styles.readout}>
            {useKilometers
              ? `${(touched.distance / 1000).toFixed(2)} km`
              : `${Math.round(touched.distance)} m`}
            {'  ·  '}
            {formatMeters(touched.elevation, absolute)} m
          </Text>
        )}
      </View>

      <View style={styles.chartRow}>
        <View style={styles.yAxis}>
          {yTicks.map(tick => (
            <Text
              key={tick}
              style={[
                styles.axisLabel,
                styles.yLabel,
                { bottom: yFor(tick) - 7 },
              ]}
            >
              {formatMeters(tick, absolute)}
            </Text>
          ))}
          <Text style={[styles.axisLabel, styles.yLabel, styles.yUnit]}>m</Text>
        </View>

        <View
          accessible
          accessibilityLabel={`Elevation profile over ${
            useKilometers
              ? `${(totalDistanceMeters / 1000).toFixed(2)} kilometres`
              : `${Math.round(totalDistanceMeters)} metres`
          }, from ${Math.round(profile.minElevation)} to ${Math.round(profile.maxElevation)} metres${
            flaggedRanges.length > 0
              ? `, with ${flaggedRanges.length} flagged stretches in red`
              : ''
          }.`}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
          onResponderRelease={() => setTouchX(null)}
          onResponderTerminate={() => setTouchX(null)}
          onResponderTerminationRequest={() => false}
          onStartShouldSetResponder={() => true}
          style={[styles.plot, { width: plotWidth }]}
        >
          {yTicks.map(tick => (
            <View
              key={`y${tick}`}
              style={[styles.gridLine, styles.gridRow, { bottom: yFor(tick) }]}
            />
          ))}
          {xTicks.map(tick => (
            <View
              key={`x${tick}`}
              style={[
                styles.gridLine,
                styles.gridColumn,
                { left: xFor(tick * distanceUnit) },
              ]}
            />
          ))}

          {columns.map((column, index) => (
            <View
              key={index}
              style={[
                styles.column,
                column.flagged && styles.columnFlagged,
                {
                  height: Math.max(column.height, 1),
                  left: index * columnWidth,
                  // Overlap neighbours slightly so no hairline gaps show.
                  width: columnWidth + 0.5,
                },
              ]}
            />
          ))}

          {firstSample && (
            <View
              style={[
                styles.endpoint,
                { bottom: yFor(firstSample.elevation) - 4, left: -4 },
              ]}
            />
          )}
          {lastSample && (
            <View
              style={[
                styles.endpoint,
                { bottom: yFor(lastSample.elevation) - 4, left: plotWidth - 4 },
              ]}
            />
          )}

          {touched && touchX !== null && (
            <>
              <View style={[styles.cursor, { left: touchX }]} />
              <View
                style={[
                  styles.cursorDot,
                  { bottom: yFor(touched.elevation) - 5, left: touchX - 5 },
                ]}
              />
            </>
          )}
        </View>
      </View>

      <View style={[styles.xAxis, { marginLeft: Y_AXIS_WIDTH }]}>
        <Text style={[styles.axisLabel, styles.xLabel, { left: 4 }]}>
          {useKilometers ? 'km' : 'm'}
        </Text>
        {xTicks.map(tick => (
          <Text
            key={tick}
            style={[
              styles.axisLabel,
              styles.xLabel,
              { left: xFor(tick * distanceUnit) + 4 },
            ]}
          >
            {useKilometers ? tick.toFixed(1) : Math.round(tick)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readoutRow: {
    alignItems: 'center',
    height: READOUT_HEIGHT,
    justifyContent: 'center',
  },
  readout: {
    color: '#101828',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  chartRow: {
    flexDirection: 'row',
  },
  yAxis: {
    height: PLOT_HEIGHT,
    width: Y_AXIS_WIDTH,
  },
  yLabel: {
    position: 'absolute',
    right: 6,
  },
  yUnit: {
    bottom: -7,
  },
  axisLabel: {
    color: '#667085',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  plot: {
    borderBottomColor: '#D0D5DD',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#D0D5DD',
    borderLeftWidth: StyleSheet.hairlineWidth,
    height: PLOT_HEIGHT,
  },
  gridLine: {
    backgroundColor: '#E4E7EC',
    position: 'absolute',
  },
  gridRow: {
    height: StyleSheet.hairlineWidth,
    left: 0,
    right: 0,
  },
  gridColumn: {
    bottom: 0,
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  column: {
    backgroundColor: '#C9C7C2',
    bottom: 0,
    position: 'absolute',
  },
  columnFlagged: {
    backgroundColor: '#F04438',
  },
  endpoint: {
    backgroundColor: '#FFFFFF',
    borderColor: '#667085',
    borderRadius: 4,
    borderWidth: 2,
    height: 8,
    position: 'absolute',
    width: 8,
  },
  cursor: {
    backgroundColor: '#101828',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  cursorDot: {
    backgroundColor: '#101828',
    borderColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    width: 10,
  },
  xAxis: {
    height: 20,
  },
  xLabel: {
    position: 'absolute',
    top: 4,
  },
});
