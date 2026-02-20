import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { colors } from '../theme/colors';
import { createCheckoutSession, verifyPaymentSession, saveUser } from '../services/api';

const PLANS = [
  {
    id: 'base',
    name: 'Base',
    price: '€3,90',
    icon: 'flash-outline',
    color: colors.primary,
    features: ['5 analisi AI/mese', 'Feedback tecnico completo', 'Drill personalizzati'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '€14,90',
    icon: 'star-outline',
    color: colors.gold,
    badge: 'Più scelto',
    features: ['Analisi illimitate', 'Bio-metrici avanzati', 'Storico completo'],
  },
];

export default function SettingsScreen({ user, onLogout, onUpgrade, onUserUpdate }) {
  const isPremium = user?.tier === 'premium';
  const isBase = user?.tier === 'base';
  const isPaid = isPremium || isBase;

  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  const handleUpgrade = async (plan) => {
    setLoadingStripe(true);
    setPendingSessionId(null);
    setVerifyError(null);
    try {
      const data = await createCheckoutSession(plan || selectedPlan);

      if (data.demo) {
        Alert.alert(
          'Stripe non configurato',
          `Aggiungi STRIPE_SECRET_KEY e STRIPE_PRICE_ID_${(plan || selectedPlan).toUpperCase()} nel server .env.`,
        );
        return;
      }

      if (data.url) {
        // Salva il sessionId — verrà usato dal banner di verifica
        setPendingSessionId(data.sessionId);
        // Apri Stripe (su web si risolve subito, su native si risolve alla chiusura)
        await WebBrowser.openBrowserAsync(data.url, {
          dismissButtonStyle: 'close',
          preferEphemeralSession: false,
        });
      }
    } catch (err) {
      Alert.alert('Errore', err.message || 'Impossibile avviare il pagamento. Riprova.');
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleVerify = async () => {
    if (!pendingSessionId) return;
    setLoadingVerify(true);
    setVerifyError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const updated = await verifyPaymentSession(pendingSessionId);
      if (updated?.user) {
        await saveUser(updated.user, null);
        onUserUpdate?.(updated.user);
        setPendingSessionId(null);
        Alert.alert('🎉 Upgrade completato!', `Benvenuto nel piano ${updated.user.tier}!`);
      }
    } catch (err) {
      setVerifyError('Pagamento non confermato ancora. Attendi e riprova.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Impostazioni</Text>

        {/* Banner verifica pagamento — appare dopo aver aperto Stripe */}
        {pendingSessionId && (
          <View style={styles.verifyBanner}>
            <Text style={styles.verifyBannerTitle}>💳 Hai completato il pagamento?</Text>
            <Text style={styles.verifyBannerSub}>Clicca il pulsante dopo aver pagato su Stripe.</Text>
            {verifyError && <Text style={styles.verifyError}>{verifyError}</Text>}
            <View style={styles.verifyRow}>
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={handleVerify}
                disabled={loadingVerify}
              >
                {loadingVerify
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={styles.verifyBtnText}>✅ Sì, ho pagato — verifica</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPendingSessionId(null)}>
                <Text style={styles.verifyCancelText}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={[styles.planBadge,
              isPremium ? styles.planPremium : isBase ? styles.planBase : styles.planFree
            ]}>
              <Text style={[styles.planBadgeText,
                isPremium ? { color: colors.gold } : isBase ? { color: colors.primary } : { color: colors.textMuted }
              ]}>
                {isPremium ? '⭐ PREMIUM' : isBase ? '⚡ BASE' : 'FREE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade section — only for non-premium */}
        {!isPremium && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Scegli il tuo piano</Text>
            <Text style={styles.upgradeSubtitle}>Inizia gratis · Cancella quando vuoi</Text>

            {/* Plan cards */}
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isCurrent = user?.tier === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, isSelected && { borderColor: plan.color }]}
                  onPress={() => setSelectedPlan(plan.id)}
                  activeOpacity={0.85}
                >
                  {plan.badge && (
                    <View style={[styles.planCardBadge, { backgroundColor: plan.color }]}>
                      <Text style={styles.planCardBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <View style={styles.planCardHeader}>
                    <Ionicons name={plan.icon} size={20} color={plan.color} />
                    <Text style={[styles.planCardName, { color: plan.color }]}>{plan.name}</Text>
                    <Text style={styles.planCardPrice}>{plan.price}<Text style={styles.planCardPeriod}>/mese</Text></Text>
                  </View>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={15} color={plan.color} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                  {isCurrent && (
                    <Text style={[styles.currentLabel, { color: plan.color }]}>✓ Piano attuale</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.upgradeBtn,
                { backgroundColor: selectedPlan === 'premium' ? colors.gold : colors.primary },
                loadingStripe && styles.upgradeBtnDisabled
              ]}
              onPress={() => handleUpgrade(selectedPlan)}
              disabled={loadingStripe}
              activeOpacity={0.85}
            >
              {loadingStripe ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.upgradeBtnText}>
                  {PLANS.find(p => p.id === selectedPlan)?.name} · {PLANS.find(p => p.id === selectedPlan)?.price}/mese
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isPremium && (
          <View style={styles.proBenefitsCard}>
            <Text style={styles.proBenefitsTitle}>⭐ Sei nel piano Premium!</Text>
            <Text style={styles.proBenefitsText}>
              Analisi illimitate, bio-metrici avanzati e drill personalizzati. Continua ad allenarti!
            </Text>
          </View>
        )}

        {isBase && !isPremium && (
          <TouchableOpacity
            style={[styles.upgradeToPreBtn]}
            onPress={() => handleUpgrade('premium')}
            activeOpacity={0.85}
          >
            <Ionicons name="star-outline" size={18} color="#000" />
            <Text style={styles.upgradeBtnText}>Passa a Premium · €14,90/mese</Text>
          </TouchableOpacity>
        )}

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.menuRow}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
            <Text style={styles.menuLabel}>Email</Text>
            <Text style={styles.menuValue}>{user?.email}</Text>
          </View>
          <View style={styles.menuRow}>
            <Ionicons name="shield-outline" size={20} color={colors.textMuted} />
            <Text style={styles.menuLabel}>Piano</Text>
            <Text style={styles.menuValue}>
              {isPremium ? 'Premium' : isBase ? 'Base' : 'Free'}
            </Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>App</Text>
          <View style={styles.menuRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            <Text style={styles.menuLabel}>Versione</Text>
            <Text style={styles.menuValue}>1.0.0</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 50 },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 24 },

  profileCard: {
    backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, padding: 20, flexDirection: 'row',
    alignItems: 'center', gap: 16, marginBottom: 20,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  profileEmail: { fontSize: 15, color: colors.text, fontWeight: '600', marginBottom: 8 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1 },
  planPremium: { backgroundColor: `${colors.gold}20`, borderColor: `${colors.gold}40` },
  planBase: { backgroundColor: colors.primaryDim, borderColor: `${colors.primary}40` },
  planFree: { backgroundColor: colors.bgCard, borderColor: colors.border },
  planBadgeText: { fontSize: 12, fontWeight: 'bold' },

  upgradeCard: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, padding: 20, marginBottom: 20,
  },
  upgradeTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  upgradeSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },

  planCard: {
    borderWidth: 2, borderColor: colors.border, borderRadius: 16,
    padding: 16, marginBottom: 12, position: 'relative',
  },
  planCardBadge: {
    position: 'absolute', top: -10, right: 16,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  planCardBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  planCardName: { flex: 1, fontWeight: 'bold', fontSize: 16 },
  planCardPrice: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  planCardPeriod: { fontSize: 12, color: colors.textMuted, fontWeight: 'normal' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  featureText: { fontSize: 13, color: colors.textMuted },
  currentLabel: { fontSize: 12, fontWeight: 'bold', marginTop: 8 },

  upgradeBtn: {
    borderRadius: 14, height: 52, alignItems: 'center',
    justifyContent: 'center', marginTop: 4, flexDirection: 'row', gap: 8,
  },
  upgradeToPreBtn: {
    backgroundColor: colors.gold, borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    flexDirection: 'row', gap: 8,
  },
  upgradeBtnDisabled: { opacity: 0.6 },
  upgradeBtnText: { fontWeight: 'bold', fontSize: 15, color: '#000' },

  proBenefitsCard: {
    backgroundColor: colors.successDim, borderWidth: 1, borderColor: `${colors.success}40`,
    borderRadius: 20, padding: 20, marginBottom: 20,
  },
  proBenefitsTitle: { fontSize: 16, fontWeight: 'bold', color: colors.success, marginBottom: 8 },
  proBenefitsText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  section: {
    backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, padding: 4, marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12, color: colors.textMuted, fontWeight: '600',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  menuLabel: { flex: 1, fontSize: 15, color: colors.text },
  menuValue: { fontSize: 14, color: colors.textMuted },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.danger },

  verifyBanner: {
    backgroundColor: '#1a2a1a', borderWidth: 1, borderColor: '#2d5a2d',
    borderRadius: 16, padding: 16, marginBottom: 20,
  },
  verifyBannerTitle: { fontSize: 15, fontWeight: 'bold', color: '#7dff7d', marginBottom: 4 },
  verifyBannerSub: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  verifyError: { fontSize: 12, color: colors.danger, marginBottom: 8 },
  verifyRow: { gap: 10 },
  verifyBtn: {
    backgroundColor: '#4caf50', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  verifyBtnText: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  verifyCancelText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingTop: 4 },
});
