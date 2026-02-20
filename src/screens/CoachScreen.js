import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { analyzeFrames } from '../services/api';
import { extractFrames } from '../utils/extractFrames';

const STEPS = [
  'Estrazione frame video...',
  'Rilevamento postura e stance...',
  'Analisi con Kai AI (Claude)...',
  'Generazione feedback tecnico...',
];

export default function CoachScreen({ user, onUpgrade }) {
  const isPremium = user?.tier === 'premium';
  const remaining = user?.remainingAnalysis ?? 1;

  const [videoAsset, setVideoAsset] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso richiesto', 'Devi autorizzare l\'accesso alla libreria video nelle impostazioni del telefono.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
      allowsEditing: false,
    });

    if (!res.canceled && res.assets?.[0]) {
      setVideoAsset(res.assets[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleAnalysis = async () => {
    if (!videoAsset) return;
    if (!isPremium && remaining <= 0) {
      Alert.alert('Limite raggiunto', 'Hai esaurito le analisi gratuite. Passa a Pro per analisi illimitate!');
      onUpgrade?.();
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      // Step 1: Estrai frame
      setActiveStep(0);
      const duration = videoAsset.duration || 10000; // fallback 10s
      const frames = await extractFrames(videoAsset.uri, duration, 4);

      if (frames.length === 0) {
        throw new Error('Impossibile estrarre frame dal video. Prova con un video MP4 diverso.');
      }

      // Step 2: Animazione
      setActiveStep(1);
      await new Promise(r => setTimeout(r, 900));
      setActiveStep(2);

      // Step 3: Analisi AI
      const data = await analyzeFrames(frames, '', 'it');

      setActiveStep(3);
      await new Promise(r => setTimeout(r, 600));

      setResult(data.analysis);
    } catch (err) {
      setError(err.message || 'Errore durante l\'analisi. Riprova.');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setVideoAsset(null);
    setResult(null);
    setError(null);
    setAnalyzing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="hardware-chip-outline" size={28} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.title}>Kai AI Coach</Text>
              <Text style={styles.subtitle}>Analisi tecnica del tuo surf</Text>
            </View>
          </View>
          <View style={[styles.badge, isPremium ? styles.badgePro : styles.badgeFree]}>
            <Text style={[styles.badgeText, isPremium ? styles.badgeProText : styles.badgeFreeText]}>
              {isPremium ? '∞ Pro' : `${remaining} rimaste`}
            </Text>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Pick video */}
        {!videoAsset && !analyzing && !result && (
          <TouchableOpacity style={styles.uploadBox} onPress={pickVideo} activeOpacity={0.8}>
            <Ionicons name="cloud-upload-outline" size={56} color={colors.primary} />
            <Text style={styles.uploadTitle}>Seleziona video di surf</Text>
            <Text style={styles.uploadSub}>MP4, MOV (max ~100MB)</Text>
            <Text style={styles.uploadHint}>💡 L'AI estrae automaticamente i frame chiave</Text>
          </TouchableOpacity>
        )}

        {/* Video preview */}
        {videoAsset && !analyzing && !result && (
          <View style={styles.previewBox}>
            <Image
              source={{ uri: videoAsset.uri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.previewInfo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.videoName} numberOfLines={1}>{videoAsset.fileName || 'Video selezionato'}</Text>
                <Text style={styles.videoSize}>
                  {videoAsset.fileSize ? `${(videoAsset.fileSize / (1024 * 1024)).toFixed(1)} MB` : ''}
                  {videoAsset.duration ? ` • ${Math.round(videoAsset.duration / 1000)}s` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={reset} style={styles.removeBtn}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalysis} activeOpacity={0.85}>
              <Ionicons name="play" size={20} color="#000" />
              <Text style={styles.analyzeBtnText}>Avvia Analisi AI</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analyzing */}
        {analyzing && (
          <View style={styles.analyzingBox}>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
            <Text style={styles.analyzingTitle}>Kai AI sta analizzando...</Text>
            <Text style={styles.analyzingStep}>{STEPS[activeStep]}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((activeStep + 1) / STEPS.length) * 100}%` }]} />
            </View>
            <Text style={styles.progressLabel}>Step {activeStep + 1} di {STEPS.length}</Text>
          </View>
        )}

        {/* Results */}
        {result && (
          <View>
            {/* Score */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>Performance Score</Text>
                <Text style={styles.scoreValue}>{result.score}<Text style={styles.scoreMax}>/100</Text></Text>
                <View style={[styles.levelBadge,
                  result.surfer_level === 'advanced' ? styles.levelAdv :
                  result.surfer_level === 'intermediate' ? styles.levelMid : styles.levelBeg
                ]}>
                  <Text style={styles.levelText}>
                    {result.surfer_level === 'advanced' ? '🔴 Advanced' :
                     result.surfer_level === 'intermediate' ? '🟡 Intermediate' : '🟢 Beginner'}
                  </Text>
                </View>
              </View>

              <View style={styles.statsCard}>
                <StatRow label="Pop-up" value={result.technical_stats?.pop_up_speed} />
                <StatRow label="Balance" value={result.technical_stats?.balance_index} />
                <StatRow label="Rail" value={result.technical_stats?.rail_engagement} />
                <StatRow label="C.O.M." value={result.technical_stats?.center_of_mass} />
              </View>
            </View>

            {/* Summary */}
            <ResultSection title="Analisi Tecnica" icon="flash-outline">
              <Text style={styles.bodyText}>{result.summary}</Text>
            </ResultSection>

            {/* Positive */}
            {result.feedback?.positive && (
              <View style={[styles.feedbackBox, styles.feedbackGreen]}>
                <Text style={[styles.feedbackLabel, { color: colors.success }]}>✓ Punti Forti</Text>
                <Text style={styles.feedbackText}>{result.feedback.positive}</Text>
              </View>
            )}

            {/* Main issue */}
            {result.feedback?.main_issue && (
              <View style={[styles.feedbackBox, styles.feedbackRed]}>
                <Text style={[styles.feedbackLabel, { color: colors.danger }]}>⚠ Focus Principale</Text>
                <Text style={styles.feedbackText}>{result.feedback.main_issue}</Text>
              </View>
            )}

            {/* Detailed analysis */}
            {result.feedback?.analysis && (
              <ResultSection title="Analisi Dettagliata" icon="book-outline">
                <Text style={styles.bodyText}>{result.feedback.analysis}</Text>
              </ResultSection>
            )}

            {/* Corrections */}
            {result.corrections?.length > 0 && (
              <ResultSection title="Correzioni da Applicare" icon="alert-circle-outline" iconColor={colors.danger} titleColor={colors.danger}>
                {result.corrections.map((c, i) => (
                  <View key={i} style={styles.correctionRow}>
                    <Ionicons name="arrow-forward-circle" size={16} color={colors.danger} />
                    <Text style={styles.correctionText}>{c}</Text>
                  </View>
                ))}
              </ResultSection>
            )}

            {/* Drill + Next focus */}
            <View style={styles.drillRow}>
              {result.drill && (
                <View style={[styles.drillCard, { borderColor: `${colors.gold}40`, backgroundColor: colors.goldDim }]}>
                  <Text style={[styles.drillLabel, { color: colors.gold }]}>💪 Drill del Giorno</Text>
                  <Text style={styles.drillText}>{result.drill}</Text>
                </View>
              )}
              {result.next_focus && (
                <View style={[styles.drillCard, { borderColor: `${colors.primary}40`, backgroundColor: colors.primaryDim }]}>
                  <Text style={[styles.drillLabel, { color: colors.primary }]}>🎯 Prossima Sessione</Text>
                  <Text style={styles.drillText}>{result.next_focus}</Text>
                </View>
              )}
            </View>

            {/* Upgrade CTA */}
            {!isPremium && (
              <TouchableOpacity style={styles.upgradeCTA} onPress={onUpgrade} activeOpacity={0.85}>
                <Text style={styles.upgradeCTAText}>
                  Passa a <Text style={{ fontWeight: 'bold' }}>Pro</Text> per analisi illimitate e bio-metrici avanzati → €14,90/mese
                </Text>
              </TouchableOpacity>
            )}

            {/* New analysis */}
            <TouchableOpacity style={styles.newAnalysisBtn} onPress={reset} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={styles.newAnalysisBtnText}>Nuova Analisi</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-components
function ResultSection({ title, icon, iconColor = colors.primary, titleColor = colors.text, children }) {
  return (
    <View style={styles.resultSection}>
      <View style={styles.resultSectionHeader}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={[styles.resultSectionTitle, { color: titleColor }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function StatRow({ label, value }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value || 'N/A'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 50 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgePro: { backgroundColor: colors.successDim, borderWidth: 1, borderColor: `${colors.success}40` },
  badgeFree: { backgroundColor: colors.dangerDim, borderWidth: 1, borderColor: `${colors.danger}40` },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  badgeProText: { color: colors.success },
  badgeFreeText: { color: colors.danger },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.dangerDim, borderRadius: 12,
    borderWidth: 1, borderColor: `${colors.danger}40`,
    padding: 14, marginBottom: 16,
  },
  errorText: { flex: 1, color: colors.text, fontSize: 14 },

  uploadBox: {
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: 20, padding: 50, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  uploadTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
  uploadSub: { fontSize: 13, color: colors.textMuted, marginBottom: 10 },
  uploadHint: { fontSize: 12, color: colors.primary, textAlign: 'center' },

  previewBox: {
    backgroundColor: colors.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  thumbnail: { width: '100%', height: 200, backgroundColor: '#000' },
  previewInfo: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, paddingBottom: 12,
  },
  videoName: { fontSize: 14, fontWeight: '600', color: colors.text },
  videoSize: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  removeBtn: { padding: 4 },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: colors.primary, margin: 16, marginTop: 0,
    borderRadius: 14, height: 52,
  },
  analyzeBtnText: { fontWeight: 'bold', fontSize: 16, color: '#000' },

  analyzingBox: {
    alignItems: 'center', padding: 40,
    backgroundColor: colors.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  analyzingTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  analyzingStep: { fontSize: 14, color: colors.primary, marginBottom: 24, fontWeight: '600' },
  progressBar: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: colors.textMuted },

  scoreRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  scoreCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  scoreLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreValue: { fontSize: 48, fontWeight: 'bold', color: colors.text },
  scoreMax: { fontSize: 20, color: colors.textMuted },
  levelBadge: { marginTop: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start' },
  levelAdv: { backgroundColor: colors.dangerDim },
  levelMid: { backgroundColor: 'rgba(255,204,0,0.1)' },
  levelBeg: { backgroundColor: colors.successDim },
  levelText: { fontSize: 12, fontWeight: '600', color: colors.text },

  statsCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16,
    justifyContent: 'space-around',
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  resultSection: {
    backgroundColor: colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14,
  },
  resultSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultSectionTitle: { fontSize: 15, fontWeight: 'bold' },
  bodyText: { fontSize: 14, color: colors.textMuted, lineHeight: 22 },

  feedbackBox: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12,
  },
  feedbackGreen: { backgroundColor: colors.successDim, borderColor: `${colors.success}40` },
  feedbackRed: { backgroundColor: colors.dangerDim, borderColor: `${colors.danger}40` },
  feedbackLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  feedbackText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  correctionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  correctionText: { flex: 1, fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  drillRow: { gap: 12, marginBottom: 16 },
  drillCard: {
    borderWidth: 1, borderRadius: 16, padding: 16,
  },
  drillLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  drillText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },

  upgradeCTA: {
    backgroundColor: colors.goldDim, borderWidth: 1, borderColor: `${colors.gold}40`,
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  upgradeCTAText: { color: colors.gold, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  newAnalysisBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  newAnalysisBtnText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
});
