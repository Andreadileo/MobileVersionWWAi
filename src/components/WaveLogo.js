import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// Metti logo.png in WaveWiseMobile/assets/ e verrà usato automaticamente
let logoImage = null;
try {
  logoImage = require('../../assets/logo.png');
} catch {}

export default function WaveLogo({ size = 'md', showText = true, style }) {
  const dim = size === 'sm' ? 36 : size === 'lg' ? 80 : 56;
  const fontSize = size === 'sm' ? 16 : size === 'lg' ? 26 : 20;
  const tagSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 11;

  return (
    <View style={[styles.wrap, style]}>
      {logoImage ? (
        <Image
          source={logoImage}
          style={{ width: dim, height: dim, resizeMode: 'contain' }}
        />
      ) : (
        <View style={[styles.iconBox, { width: dim, height: dim, borderRadius: dim * 0.22 }]}>
          <Text style={[styles.iconText, { fontSize: dim * 0.45 }]}>〜</Text>
        </View>
      )}
      {showText && (
        <View style={styles.textWrap}>
          <Text style={[styles.name, { fontSize }]}>
            Wave <Text style={styles.nameAccent}>Wise</Text>
          </Text>
          {size !== 'sm' && (
            <Text style={[styles.tag, { fontSize: tagSize }]}>AI SURF COACH</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: colors.primary },
  textWrap: { gap: 2 },
  name: { fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  nameAccent: { color: colors.primary },
  tag: { color: colors.textMuted, letterSpacing: 2, fontWeight: '600' },
});
