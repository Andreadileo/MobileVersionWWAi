import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getStats } from '../services/api';

export default function DashboardScreen({ user, onUpgrade }) {
  const isPremium = user?.tier === 'premium';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  const totalSessions = stats?.totalSessions ?? '—';
  const averageScore = stats?.averageScore ?? '—';
  const improvement = stats?.improvement ?? 0;
  const recentSessions = stats?.recentSessions ?? [];
  const remaining = isPremium ? '∞' : (stats?.remainingAnalysis ?? user?.remainingAnalysis ?? 1);

  const statCards = [
    { icon: 'trophy-outline', label: 'Score Medio', value: loading ? '...' : averageScore, color: colors.primary },
    { icon: 'trending-up-outline', label: 'Miglioramento', value: loading ? '...' : (improvement >= 0 ? `+${improvement}` : `${improvement}`), color: colors.success },
    { icon: 'calendar-outline', label: 'Sessioni', value: loading ? '...' : totalSessions, color: colors.gold },
    { icon: 'flash-outline', label: 'Analisi', value: loading ? '...' : remaining, color: isPremium ? colors.success : colors.danger },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Ciao, <Text style={styles.name}>{user?.email?.split('@')[0]}</Text> 👋
            </Text>
            <Text style={styles.subtitle}>Analizza le tue sessioni di surf</Text>
          </View>
          {isPremium && (
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          )}
        </View>

        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          {statCards.map(({ icon, label, value, color }) => (
            <View key={label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={22} color={color} />
              </View>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Sessioni Recenti */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessioni Recenti</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : recentSessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="videocam-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nessuna sessione ancora.</Text>
              <Text style={styles.emptySubText}>Vai su "Analisi" per caricare il tuo primo video!</Text>
            </View>
          ) : (
            recentSessions.map((session, idx) => (
              <View key={session.id || idx} style={[styles.sessionRow, idx < recentSessions.length - 1 && styles.sessionBorder]}>
                <View style={styles.sessionIcon}>
                  <Ionicons name="play" size={18} color={colors.white} />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionSpot}>{session.spot || 'Sessione'}</Text>
                  <Text style={styles.sessionDate}>
                    {session.date ? new Date(session.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '—'}
                    {session.surfer_level ? ` • ${session.surfer_level}` : ''}
                  </Text>
                </View>
                <Text style={[styles.sessionScore, {
                  color: session.score >= 80 ? colors.success : session.score >= 70 ? colors.primary : colors.textMuted
                }]}>
                  {session.score}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Upgrade Banner */}
        {!isPremium && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={onUpgrade} activeOpacity={0.85}>
            <View>
              <Text style={styles.upgradeTitle}>Passa a Pro ⚡</Text>
              <Text style={styles.upgradeSubTitle}>Analisi illimitate + bio-metrici avanzati</Text>
            </View>
            <Text style={styles.upgradePrice}>€14,90/mese</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  name: { color: colors.primary },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  proBadge: { backgroundColor: colors.gold, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  proText: { fontWeight: 'bold', fontSize: 12, color: '#000' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    alignItems: 'flex-start',
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },

  section: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text, marginBottom: 16 },

  emptyBox: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: colors.textMuted, fontSize: 15, marginTop: 12, fontWeight: '500' },
  emptySubText: { color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },

  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  sessionBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  sessionIcon: {
    width: 44,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: { flex: 1 },
  sessionSpot: { fontWeight: '600', color: colors.text, fontSize: 15 },
  sessionDate: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  sessionScore: { fontSize: 20, fontWeight: 'bold' },

  upgradeBanner: {
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeTitle: { fontSize: 16, fontWeight: 'bold', color: colors.gold, marginBottom: 4 },
  upgradeSubTitle: { fontSize: 12, color: colors.textMuted },
  upgradePrice: { fontSize: 15, fontWeight: 'bold', color: colors.gold },
});
