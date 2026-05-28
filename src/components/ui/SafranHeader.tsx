import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store';
import { ALL_SITES_VALUE, SITE_OPTIONS, USER_SITE_KEY, setSite } from '@/store/settingsSlice';
import { SiteSelection } from '@/types';

export interface SafranHeaderProps {
  title: string;
  onMenuPress?: () => void;
  isConnected?: boolean;
  showSiteSelector?: boolean;
}

export function SafranHeader({
  isConnected = true,
  onMenuPress,
  showSiteSelector = true,
  title,
}: SafranHeaderProps) {
  const dispatch = useAppDispatch();
  const currentSite = useAppSelector((state) => state.settings.currentSite);
  const [isSiteModalVisible, setIsSiteModalVisible] = useState(false);

  async function handleSelectSite(site: SiteSelection) {
    dispatch(setSite(site));
    setIsSiteModalVisible(false);
    await AsyncStorage.setItem(USER_SITE_KEY, site);
  }

  const displaySite = currentSite === ALL_SITES_VALUE ? 'Tous' : currentSite;

  return (
    <View style={styles.header}>
      <View style={styles.leftSlot}>
        <Image
          source={require('@/assets/images/logo-safran1-r.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {onMenuPress ? (
          <Pressable accessibilityRole="button" onPress={onMenuPress} style={styles.menuButton}>
            <Text style={styles.menuText}>☰</Text>
          </Pressable>
        ) : null}
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      {showSiteSelector ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsSiteModalVisible(true)}
          style={styles.siteButton}>
          <Text numberOfLines={1} style={styles.siteText}>
            📍 {displaySite} ▼
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.statusSlot}>
        <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsSiteModalVisible(false)}
        transparent
        visible={isSiteModalVisible}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsSiteModalVisible(false)}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{ selected: currentSite === ALL_SITES_VALUE }}
              onPress={() => {
                void handleSelectSite(ALL_SITES_VALUE);
              }}
              style={styles.optionRow}>
              <Text style={[styles.optionText, currentSite === ALL_SITES_VALUE && styles.optionTextActive]}>
                Tous les sites
              </Text>
              <Text style={styles.optionCheck}>{currentSite === ALL_SITES_VALUE ? '●' : '○'}</Text>
            </TouchableOpacity>
            {SITE_OPTIONS.map((site) => (
              <TouchableOpacity
                accessibilityRole="radio"
                accessibilityState={{ selected: site === currentSite }}
                activeOpacity={0.75}
                key={site}
                onPress={() => {
                  void handleSelectSite(site);
                }}
                style={styles.optionRow}>
                <Text style={[styles.optionText, site === currentSite && styles.optionTextActive]}>
                  {site}
                </Text>
                <Text style={styles.optionCheck}>{site === currentSite ? '●' : '○'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  connected: {
    backgroundColor: COLORS.success,
  },
  disconnected: {
    backgroundColor: COLORS.danger,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: SPACING.md,
  },
  leftSlot: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  logo: {
    height: 28,
    width: 28,
  },
  menuButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  menuText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    elevation: 8,
    minWidth: 220,
    paddingVertical: SPACING.sm,
    shadowColor: COLORS.text,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  optionCheck: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    width: 24,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: SPACING.md,
  },
  optionText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  siteButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: COLORS.textLight,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    maxWidth: 104,
    paddingHorizontal: SPACING.sm,
  },
  siteText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  statusDot: {
    borderColor: COLORS.textLight,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  statusSlot: {
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
    width: 18,
  },
  title: {
    color: COLORS.textLight,
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
});
