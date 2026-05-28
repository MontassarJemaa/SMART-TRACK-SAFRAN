import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { Outillage, StatutScan } from '@/types';

export interface OutillageCardProps {
  outillage: Outillage;
  statut?: StatutScan;
  rssi?: number;
  onPress?: () => void;
}

function dimensions(outillage: Outillage): string {
  const longueur = outillage.longueur_cm ?? '-';
  const largeur = outillage.largeur_cm ?? '-';
  const hauteur = outillage.hauteur_cm ?? '-';
  return `${longueur} × ${largeur} × ${hauteur} cm`;
}

function poids(outillage: Outillage): string {
  return outillage.poids_kg === undefined ? 'Poids inconnu' : `${outillage.poids_kg} kg`;
}

function badgeLabel(statut: StatutScan): string {
  if (statut === 'trouve') {
    return '✅ Trouvé';
  }
  if (statut === 'inattendu') {
    return '⚠️ Inattendu';
  }
  return '❓ Non trouvé';
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Non renseigné';
  const cleanStr = dateString.trim();
  const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanStr)) {
    return cleanStr;
  }
  try {
    const date = new Date(cleanStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // Ignore fallback errors
  }
  return cleanStr;
}

export function OutillageCard({ onPress, outillage, rssi, statut }: OutillageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(() => new Animated.Value(0));

  function toggle() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    Animated.timing(animation, {
      duration: 180,
      toValue: nextExpanded ? 1 : 0,
      useNativeDriver: false,
    }).start();
    onPress?.();
  }

  const detailsHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 168],
  });

  return (
    <Pressable onPress={toggle} style={styles.card}>
      <View style={styles.topRow}>
        {statut ? (
          <View style={[styles.badge, styles[statut]]}>
            <Text style={styles.badgeText}>{badgeLabel(statut)}</Text>
          </View>
        ) : null}
        <Text numberOfLines={2} style={styles.designation}>
          {outillage.designation}
        </Text>
        {rssi !== undefined ? <Text style={styles.rssi}>{rssi} dBm</Text> : null}
        <Text style={styles.chevron}>{expanded ? '∨' : '>'}</Text>
      </View>

      <Text style={styles.meta}>
        {outillage.code} • {outillage.projet}
      </Text>
      <Text style={styles.meta}>
        {dimensions(outillage)} • {poids(outillage)}
      </Text>

      <Animated.View style={[styles.details, { height: detailsHeight }]}>
        <View style={styles.separator} />
        <Text style={styles.detailText}>
          EPC: <Text style={styles.monospace}>{outillage.epc ?? 'Non taggé'}</Text>
        </Text>
        <Text style={styles.detailText}>Process: {outillage.atelier}</Text>
        <Text style={styles.detailText}>Classe: {outillage.classe ?? 'Non renseigné'}</Text>
        <Text style={styles.detailText}>
          Date de service: {formatDate(outillage.date_service)}
        </Text>
        <Text style={styles.detailText}>Matériau: {outillage.materiau ?? 'Non renseigné'}</Text>
        <Text style={styles.detailText}>
          Dernière position: {outillage.localisation_actuelle ?? 'Inconnue'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  badgeText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  designation: {
    color: COLORS.text,
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  details: {
    overflow: 'hidden',
  },
  detailText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  inattendu: {
    backgroundColor: COLORS.warning,
  },
  meta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  monospace: {
    fontFamily: 'monospace',
  },
  non_trouve: {
    backgroundColor: COLORS.neutral,
  },
  rssi: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  separator: {
    backgroundColor: COLORS.border,
    height: 1,
    marginTop: SPACING.sm,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  trouve: {
    backgroundColor: COLORS.success,
  },
});
