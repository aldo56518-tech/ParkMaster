import { useState, useEffect, useRef } from 'react'; 
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DIST_MAX = 200;
const DIST_MIN = 2;

const ZONAS = [
  { max: 200, min: 100, color: '#22cc44', label: 'SEGURO',     beepMs: null },
  { max: 100, min: 70,  color: '#aaff00', label: 'ATENCIÓN',   beepMs: 1400 },
  { max: 70,  min: 45,  color: '#ffdd00', label: 'DESPACIO',   beepMs: 900  },
  { max: 45,  min: 20,  color: '#ff8800', label: 'PRECAUCIÓN', beepMs: 500  },
  { max: 20,  min: 0,   color: '#ff2222', label: '⚠️ PELIGRO',  beepMs: 200  },
];

function getZona(dist) {
  for (const z of ZONAS) {
    if (dist <= z.max && dist > z.min) return z;
  }
  return ZONAS[ZONAS.length - 1];
}

export default function CamaraActivaScreen({ navigation }) {
  const [sistemaActivo, setSistemaActivo] = useState(false);
  const [zona, setZona] = useState(ZONAS[0]);
  const [permission, requestPermission] = useCameraPermissions();
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 9.8 });
  const [distancia, setDistancia] = useState(DIST_MAX);
  const [velocidad, setVelocidad] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim   = useRef(new Animated.Value(0)).current;
  const lineas    = useRef([0,1,2,3,4].map(() => new Animated.Value(1))).current;

  const accelRef    = useRef(null);
  const pulseRef    = useRef(null);
  const distRef     = useRef(DIST_MAX);
  const zonaRef     = useRef(ZONAS[0]);
  const soundRef    = useRef(null);
  const beepTimer   = useRef(null);
  const playingRef  = useRef(false);

  const velIntegRef = useRef({ x: 0, y: 0, z: 0 });
  const lastTimeRef = useRef(Date.now());
  const gravRef     = useRef({ x: 0, y: 0, z: 9.8 });

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    return () => cleanup();
  }, []);

  // ── SONIDO PROGRESIVO CORREGIDO ──────────────────────────────
  const stopBeep = () => {
    if (beepTimer.current) { 
      clearTimeout(beepTimer.current); 
      beepTimer.current = null; 
    }

    if (soundRef.current) { 
      soundRef.current.stopAsync().catch(() => {});
      soundRef.current.unloadAsync().catch(() => {}); 
      soundRef.current = null; 
    }

    playingRef.current = false;
  };

  const dispararBeep = async () => {
    if (!playingRef.current) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
        { shouldPlay: true, volume: 1.0, isMuted: false }
      );

      soundRef.current = sound;

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });

      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;

          if (playingRef.current && zonaRef.current.beepMs) {
            beepTimer.current = setTimeout(dispararBeep, zonaRef.current.beepMs);
          }
        }
      });

    } catch (e) { 
      console.log('Audio error:', e);

      if (playingRef.current && zonaRef.current.beepMs) {
        beepTimer.current = setTimeout(dispararBeep, zonaRef.current.beepMs);
      }
    }
  };

  const startBeep = (ms) => {
    stopBeep();
    if (!ms) return;

    playingRef.current = true;
    dispararBeep();
  };

  const actualizarBeep = (nuevaZona) => {
    zonaRef.current = nuevaZona;

    if (!nuevaZona.beepMs) {
      stopBeep();
    } else if (!playingRef.current) {
      startBeep(nuevaZona.beepMs);
    }
  };

  // ── CLEANUP ─────────────────────────────────────────────────
  const cleanup = () => {
    stopBeep();
    if (accelRef.current) { accelRef.current.remove(); accelRef.current = null; }
    if (pulseRef.current) { pulseRef.current.stop(); }
  };

  // ── SISTEMA ─────────────────────────────────────────────────
  useEffect(() => {
    if (sistemaActivo) {

      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();

      velIntegRef.current = { x: 0, y: 0, z: 0 };
      lastTimeRef.current = Date.now();
      distRef.current = DIST_MAX;

      Accelerometer.setUpdateInterval(50);
      accelRef.current = Accelerometer.addListener(({ x, y, z }) => {

        const now = Date.now();
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = now;

        const alpha = 0.95;
        gravRef.current = {
          x: alpha * gravRef.current.x + (1 - alpha) * x,
          y: alpha * gravRef.current.y + (1 - alpha) * y,
          z: alpha * gravRef.current.z + (1 - alpha) * z,
        };

        const linX = x - gravRef.current.x;
        const linY = y - gravRef.current.y;
        const linZ = z - gravRef.current.z;

        const umbral = 0.08;

        const vel = velIntegRef.current;
        velIntegRef.current = {
          x: (vel.x + linX * dt) * 0.85,
          y: (vel.y + linY * dt) * 0.85,
          z: (vel.z + linZ * dt) * 0.85,
        };

        const speed = Math.sqrt(vel.x**2 + vel.y**2 + vel.z**2);
        setVelocidad(speed);

        const pitch = Math.atan2(gravRef.current.y, gravRef.current.z);
        const mov = -(vel.y * Math.cos(pitch) - vel.z * Math.sin(pitch));

        distRef.current = Math.min(DIST_MAX, Math.max(DIST_MIN, distRef.current - mov * 80));
        const dist = Math.round(distRef.current);
        setDistancia(dist);

        const nuevaZona = getZona(dist);
        if (nuevaZona.label !== zonaRef.current.label) {
          setZona(nuevaZona);
          actualizarBeep(nuevaZona);
        }

        Animated.timing(barAnim, {
          toValue: 1 - (dist / DIST_MAX),
          duration: 60,
          useNativeDriver: false
        }).start();
      });

    } else {
      cleanup();
      setDistancia(DIST_MAX);
      setZona(ZONAS[0]);
      setVelocidad(0);
    }

    return () => cleanup();
  }, [sistemaActivo]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0e1a' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ padding: 16 }}>

          <TouchableOpacity
            style={{
              padding: 18,
              borderRadius: 12,
              backgroundColor: sistemaActivo ? '#cc2222' : '#22cc44',
              alignItems: 'center'
            }}
            onPress={() => setSistemaActivo(v => !v)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {sistemaActivo ? 'DETENER' : 'INICIAR'}
            </Text>
          </TouchableOpacity>

          <Text style={{ color: '#fff', marginTop: 20 }}>
            Distancia: {distancia} cm
          </Text>

          <Text style={{ color: zona.color }}>
            Estado: {zona.label}
          </Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}