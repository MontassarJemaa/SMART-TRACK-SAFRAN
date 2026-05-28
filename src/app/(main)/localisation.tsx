import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafranButton } from '@/components/ui/SafranButton';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useRFID } from '@/hooks/useRFID';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectProject } from '@/store/projectSlice';
import { setScanMode } from '@/store/rfidSlice';

function signalPercent(rssi: number): number {
  return Math.max(0, Math.min(100, Math.round(((rssi + 80) / 45) * 100)));
}

function pulseStyle(progress: Animated.Value) {
  return {
    opacity: progress.interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [0.65, 0.25, 0],
    }),
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.65, 1.55],
        }),
      },
    ],
  };
}

export default function LocalisationScreen() {
  const safeBack = useSafeBack();
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.projects);
  const selectedProject = useAppSelector((state) => state.projects.selectedProject);
  const { locateTag } = useRFID();
  const [firstRing] = useState(() => new Animated.Value(0));
  const [secondRing] = useState(() => new Animated.Value(0));
  const stopLocateRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState('Localisation...');
  const [rssi, setRssi] = useState(-80);

  useEffect(() => {
    dispatch(setScanMode('locate'));

    const createPulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            duration: 1700,
            easing: Easing.out(Easing.quad),
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            duration: 0,
            toValue: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const firstPulse = createPulse(firstRing, 0);
    const secondPulse = createPulse(secondRing, 850);
    firstPulse.start();
    secondPulse.start();

    return () => {
      dispatch(setScanMode('free'));
      firstPulse.stop();
      secondPulse.stop();
      stopLocateRef.current?.();
    };
  }, [dispatch, firstRing, secondRing]);

  function handleBlink() {
    const targetEpc = selectedProject?.tools[0]?.epc ?? 'E20034120189074000000001';
    setStatus('Localisation...');
    stopLocateRef.current?.();
    stopLocateRef.current = locateTag(targetEpc, (nextRssi, found) => {
      setRssi(nextRssi);
      setStatus(found ? 'Trouvé ✓' : 'Localisation...');
    });
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title="Localiser des outillages" onMenuPress={safeBack} isConnected />
      <View style={styles.container}>
        <View style={styles.selector}>
          <Text style={styles.sectionTitle}>Projet CSV</Text>
          <Text style={styles.selectedText}>{selectedProject?.name ?? 'Aucun projet sélectionné'}</Text>
          {projects.slice(0, 3).map((project) => (
            <Pressable
              key={project.id}
              onPress={() => dispatch(selectProject(project.id))}
              style={styles.projectChip}>
              <Text style={styles.projectChipText}>{project.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.radar}>
          <Animated.View style={[styles.ring, styles.ringLarge, pulseStyle(firstRing)]} />
          <Animated.View style={[styles.ring, styles.ringMedium, pulseStyle(secondRing)]} />
          <View style={styles.circleCore}>
            <Text style={styles.circleText}>{signalPercent(rssi)}%</Text>
          </View>
        </View>

        <Text style={styles.status}>{status}</Text>
        <View style={styles.signalTrack}>
          <View style={[styles.signalFill, { width: `${signalPercent(rssi)}%` }]} />
        </View>
        <Text style={styles.rssi}>{rssi} dBm</Text>
        <SafranButton label="Clignoter" onPress={handleBlink} variant="primary" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  circleCore: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 54,
    height: 108,
    justifyContent: 'center',
    width: 108,
  },
  circleText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  container: {
    flex: 1,
    gap: SPACING.lg,
    padding: SPACING.lg,
  },
  projectChip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  projectChipText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  radar: {
    alignItems: 'center',
    height: 240,
    justifyContent: 'center',
  },
  ring: {
    backgroundColor: COLORS.accent,
    position: 'absolute',
  },
  ringLarge: {
    borderRadius: 110,
    height: 220,
    width: 220,
  },
  ringMedium: {
    borderRadius: 82,
    height: 164,
    width: 164,
  },
  rssi: {
    color: COLORS.neutral,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  selectedText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.xs,
  },
  selector: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  signalFill: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    height: 16,
  },
  signalTrack: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    height: 16,
    overflow: 'hidden',
  },
  status: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
});
