# Wave Wise — Setup App Mobile (React Native + Expo)

## Prerequisiti

1. **Node.js** ≥ 18 (già installato)
2. **Expo CLI**: `npm install -g expo-cli`
3. **App Expo Go** sul tuo telefono (iOS App Store / Google Play) per testare

---

## 1. Installa dipendenze

```bash
cd WaveWiseMobile
npm install
npx expo install --fix   # allinea le versioni Expo-compatibili
```

---

## 2. Configura l'URL del backend

Copia `.env.example` in `.env`:

```bash
cp .env.example .env
```

Poi modifica `EXPO_PUBLIC_API_URL` nel `.env`:

| Scenario | Valore |
|---|---|
| iOS Simulator | `http://localhost:5000` |
| Android Emulator | `http://10.0.2.2:5000` |
| **Telefono fisico** | `http://<IP-DEL-TUO-PC>:5000` |
| Produzione | `https://tuo-backend.railway.app` |

Per trovare l'IP del tuo PC: `ipconfig` su Windows → IPv4 Address.

**Esempio**: `EXPO_PUBLIC_API_URL=http://192.168.1.100:5000`

---

## 3. Avvia l'app

```bash
# Assicurati che il server web sia in esecuzione (nella cartella SurfAppF.N/server)
# In un altro terminale:
npm start
```

Scansiona il QR code con **Expo Go** (iPhone) o la **fotocamera** (Android).

---

## 4. Test sul dispositivo fisico

1. iPhone e PC devono essere sulla **stessa rete WiFi**
2. Avvia il server: `cd SurfAppF.N/server && node index.js`
3. Avvia l'app: `cd WaveWiseMobile && npm start`
4. Scansiona il QR con Expo Go
5. Registrati con una email di test
6. Vai su "Analisi" → scegli un video dal rullino → "Avvia Analisi AI"

---

## 5. Build per App Store / Play Store

### Setup EAS (Expo Application Services)

```bash
npm install -g eas-cli
eas login                    # login con account Expo
eas build:configure          # crea eas.json
```

### Build Android (APK/AAB)

```bash
eas build --platform android --profile preview   # APK per testing
eas build --platform android --profile production # AAB per Play Store
```

### Build iOS (IPA)

> Richiede account Apple Developer (€99/anno)

```bash
eas build --platform ios --profile production
```

EAS compila nel cloud — non serve un Mac!

---

## Struttura progetto

```
WaveWiseMobile/
├── App.js                     # Entry point — gestisce auth + nav
├── app.json                   # Config Expo (nome, icona, permessi)
├── package.json               # Dipendenze
└── src/
    ├── navigation/
    │   └── AppNavigator.js    # Bottom tabs (Dashboard, Analisi, Progressi, Impostazioni)
    ├── screens/
    │   ├── AuthScreen.js      # Login + Registrazione
    │   ├── DashboardScreen.js # Stats + sessioni recenti
    │   ├── CoachScreen.js     # Video picker + analisi AI
    │   ├── ProgressScreen.js  # Grafico + achievements
    │   └── SettingsScreen.js  # Profilo + upgrade + logout
    ├── services/
    │   └── api.js             # Chiamate al backend (stesso server!)
    ├── utils/
    │   └── extractFrames.js   # Estrazione frame con expo-video-thumbnails
    └── theme/
        └── colors.js          # Palette colori Wave Wise
```

---

## Note importanti

- **Il backend è lo stesso** di `SurfAppF.N/server` — non serve riscriverlo
- L'estrazione frame usa `expo-video-thumbnails` (invece di Canvas API del web)
- I pagamenti Stripe aprono il browser di sistema e tornano nell'app
- `AsyncStorage` sostituisce `localStorage` per salvare sessione e token
