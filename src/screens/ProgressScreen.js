import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getProgress } from '../services/api';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 180;

export default function ProgressScreen({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgress()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const sessions = data?.sessions ?? [];
  const achievements = data?.achievements ?? [];

  const minScore = sessions.length ? Math.min(...sessions.map(s => s.score)) - 5 : 0;
  const maxScore = sessions.length ? Math.max(...sessions.map(s => s.score)) + 5 : 100;
  const range = maxScore - minScore || 1;

  const firstScore = sessions[0]?.score;
  const lastScore = sessions[sessions.length - 1]?.score;
  const totalImprovement = firstScore != null && lastScore != null ? lastScore - firstScore : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>I tuoi <Text style={{ color: colors.primary }}>Progressi</Text></Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : sessions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="trending-up-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nessun dato ancora</Text>
            <Text style={styles.emptyText}>Carica il tuo primo video nella tab Analisi per vedere i progressi qui.</Text>
          </View>
        ) : (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.miniCard}>
                <Text style={styles.miniValue}>{sessions.length}</Text>
                <Text style={styles.miniLabel}>Sessioni</Text>
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.miniValue}>
                  {Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length)}
                </Text>
                <Text style={styles.miniLabel}>Score Medio</Text>
              </View>
              {totalImprovement != null && (
                <View style={styles.miniCard}>
                  <Text style={[styles.miniValue, { color: totalImprovement >= 0 ? colors.success : colors.danger }]}>
                    {totalImprovement >= 0 ? '+' : ''}{totalImprovement}
                  </Text>
                  <Text style={styles.miniLabel}>Miglioramento</Text>
                </View>
              )}
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Andamento Score</Text>
              <View style={styles.chartArea}>
                {/* Y axis labels */}
                <View style={styles.yAxis}>
                  {[100, 75, 50, 25].map(v => (
                    <Text key={v} style={styles.yLabel}>{v}</Text>
                  ))}
                </View>

                {/* Bars */}
                <View style={styles.barsWrap}>
                  {sessions.map((s, i) => {
                    const barHeight = ((s.score - minScore) / range) * CHART_HEIGHT;
                    const barColor = s.score >= 80 ? colors.success : s.score >= 70 ? colors.primary : colors.textMuted;
                    return (
                      <View key={i} style={styles.barCol}>
                        <Text style={styles.barScore}>{s.score}</Text>
                        <View style={[styles.bar, { height: Math.max(barHeight, 8), backgroundColor: barColor }]} />
                        <Text style={styles.barLabel}>
                          {new Date(s.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Achievements */}
            {achievements.length > 0 && (
              <View style={styles.achievementsCard}>
                <Text style={styles.achievementsTitle}>🏆 Traguardi</Text>
                {achievements.map((a, i) => (
                  <View key={i} style={styles.achievementRow}>
                    <Text style={styles.achievementIcon}>{a.icon || '🎯'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.achievementName}>{a.title}</Text>
                      <Text style={styles.achievementDesc}>{a.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Session list */}
            <View style={styles.sessionListCard}>
              <Text style={styles.sectionTitle}>Storico Sessioni</Text>
              {[...sessions].reverse().map((s, i) => (
                <View key={i} style={[styles.sessionItem, i > 0 && styles.sessionBorder]}>
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionDate}>
                      {new Date(s.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                    <Text style={styles.sessionLevel}>{s.surfer_level || '—'}</Text>
                  </View>
                  <Text style={[styles.sessionScore, {
                    color: s.score >= 80 ? colors.success : s.score >= 70 ? colors.primary : colors.textMuted
                  }]}>
                    {s.score}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 50 },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 24 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMuted, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  miniCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16, alignItems: 'center',
  },
  miniValue: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  miniLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  chartCard: {
    backgroundColor: colors.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 20,
  },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  chartArea: { flexDirection: 'row', height: CHART_HEIGHT + 40 },
  yAxis: { width: 30, justifyContent: 'space-between', paddingBottom: 30 },
  yLabel: { fontSize: 10, color: colors.textMuted },
  barsWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingBottom: 24, paddingLeft: 8 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '80%', borderRadius: 4, minHeight: 8 },
  barScore: { fontSize: 10, color: colors.textMuted, marginBottom: 4 },
  barLabel: { fontSize: 9, color: colors.textMuted, marginTop: 6, textAlign: 'center' },

  achievementsCard: {
    backgroundColor: colors.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 20,
  },
  achievementsTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  achievementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  achievementIcon: { fontSize: 24 },
  achievementName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  achievementDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  sessionListCard: {
    backgroundColor: colors.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, padding: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  sessionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  sessionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  sessionLeft: {},
  sessionDate: { fontSize: 14, color: colors.text, fontWeight: '500' },
  sessionLevel: { fontSize: 12, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  sessionScore: { fontSize: 22, fontWeight: 'bold' },
});
