import { Vibration } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Distancia inicial en cm
const DIST_MAX = 200;
const DIST_MIN = 2;

// 5 zonas progresivas
const ZONAS = [
  { max: 200, min: 100, color: '#22cc44', label: 'SEGURO',     beepMs: null, intensidad: 0 },
  { max: 100, min: 70,  color: '#aaff00', label: 'ATENCIÓN',   beepMs: 900,  intensidad: 0.3 },
  { max: 70,  min: 45,  color: '#ffdd00', label: 'DESPACIO',   beepMs: 600,  intensidad: 0.5 },
  { max: 45,  min: 20,  color: '#ff8800', label: 'PRECAUCIÓN', beepMs: 300,  intensidad: 0.8 },
  { max: 20,  min: 0,   color: '#ff2222', label: '⚠️ PELIGRO',  beepMs: 120,  intensidad: 1 },
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

  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim   = useRef(new Animated.Value(0)).current;
  const lineas    = useRef([0,1,2,3,4].map(() => new Animated.Value(1))).current;

  // Refs de control
  const accelRef    = useRef(null);
  const gyroRef     = useRef(null);
  const pulseRef    = useRef(null);
  const distRef     = useRef(DIST_MAX);
  const zonaRef     = useRef(ZONAS[0]);
  const soundRef    = useRef(null);
  const beepTimer   = useRef(null);
  const playingRef  = useRef(false);

  // Para integración de acelerómetro
  const velIntegRef = useRef({ x: 0, y: 0, z: 0 }); // velocidad integrada
  const lastTimeRef = useRef(Date.now());
  const gravRef     = useRef({ x: 0, y: 0, z: 9.8 }); // gravedad estimada

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    return () => cleanup();
  }, []);

  // ── SONIDO PROGRESIVO ──────────────────────────────────────────
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
      { shouldPlay: true, volume: zonaRef.current.intensidad, isMuted: false }
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

  // ── CLEANUP ────────────────────────────────────────────────────
  const cleanup = () => {
    stopBeep();
    if (accelRef.current) { accelRef.current.remove(); accelRef.current = null; }
    if (gyroRef.current)  { gyroRef.current.remove();  gyroRef.current  = null; }
    if (pulseRef.current) { pulseRef.current.stop(); }
  };

  // ── SISTEMA ON/OFF ─────────────────────────────────────────────
  useEffect(() => {
    if (sistemaActivo) {

      // Pulso del badge
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 500, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();

      // Reset integración
      velIntegRef.current = { x: 0, y: 0, z: 0 };
      lastTimeRef.current = Date.now();
      distRef.current = DIST_MAX;
      setDistancia(DIST_MAX);

      // ── ACELERÓMETRO a 50ms (20Hz) ──
      Accelerometer.setUpdateInterval(50);
      accelRef.current = Accelerometer.addListener(({ x, y, z }) => {
        setAccelData({ x, y, z });

        const now = Date.now();
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // segundos, máx 100ms
        lastTimeRef.current = now;

        // Estimar gravedad con filtro low-pass (alpha=0.95)
        const alpha = 0.95;
        gravRef.current = {
          x: alpha * gravRef.current.x + (1 - alpha) * x,
          y: alpha * gravRef.current.y + (1 - alpha) * y,
          z: alpha * gravRef.current.z + (1 - alpha) * z,
        };

        // Aceleración lineal = aceleración total - gravedad
        const linX = x - gravRef.current.x;
        const linY = y - gravRef.current.y;
        const linZ = z - gravRef.current.z;

        // Umbral para ignorar ruido del sensor (< 0.08 m/s²)
        const umbral = 0.08;
        const linXf = Math.abs(linX) > umbral ? linX : 0;
        const linYf = Math.abs(linY) > umbral ? linY : 0;
        const linZf = Math.abs(linZ) > umbral ? linZ : 0;

        // Integrar aceleración → velocidad
        const friction = 0.85; // fricción para detener deriva
        velIntegRef.current = {
          x: (velIntegRef.current.x + linXf * dt) * friction,
          y: (velIntegRef.current.y + linYf * dt) * friction,
          z: (velIntegRef.current.z + linZf * dt) * friction,
        };

        const vel = velIntegRef.current;

        // Magnitud total del movimiento
        const speed = Math.sqrt(vel.x**2 + vel.y**2 + vel.z**2);
        setVelocidad(speed);

        // Detectar dirección: 
        // Cuando el teléfono apunta hacia un objeto (vertical o inclinado),
        // el movimiento en Y negativo = avanzar hacia objeto
        // El movimiento en Z positivo = acercarse (teléfono horizontal)
        // Combinamos para cubrir ambas orientaciones
        const pitch = Math.atan2(gravRef.current.y, gravRef.current.z); // ángulo de inclinación
        // Proyectar velocidad en la dirección "hacia adelante" según inclinación
        const movHaciaObjeto = -(vel.y * Math.cos(pitch) - vel.z * Math.sin(pitch));

        // Escalar y actualizar distancia
        const escala = 80; // cm por (m/s * s)
        const cambio = movHaciaObjeto * escala;

        distRef.current = Math.min(DIST_MAX, Math.max(DIST_MIN, distRef.current - cambio));
        const dist = Math.round(distRef.current);
        setDistancia(dist);

        const nuevaZona = getZona(dist);

if (nuevaZona.label !== zonaRef.current.label) {
  setZona(nuevaZona);
  actualizarBeep(nuevaZona);

  // ✅ VIBRACIÓN SOLO AQUÍ (donde sí existe nuevaZona)
  if (nuevaZona.label.includes('PELIGRO')) {
    Vibration.vibrate([100, 100, 200, 100, 300]);
  }
}

        // Barra: 0=lejos, 1=cerca
        const progreso = 1 - (dist / DIST_MAX);
        Animated.timing(barAnim, { toValue: progreso, duration: 60, useNativeDriver: false }).start();

        // Líneas: se cierran al acercarse
        const factor = dist / DIST_MAX; // 1=lejos(abiertas), 0=cerca(cerradas)
        lineas.forEach((anim, i) => {
          const val = Math.max(0.02, factor * (0.15 + i * 0.12));
          Animated.timing(anim, { toValue: val, duration: 60, useNativeDriver: false }).start();
        });
      });

    } else {
      cleanup();
      pulseAnim.setValue(1);
      distRef.current = DIST_MAX;
      velIntegRef.current = { x: 0, y: 0, z: 0 };
      zonaRef.current = ZONAS[0];
      setDistancia(DIST_MAX);
      setZona(ZONAS[0]);
      setVelocidad(0);
      Animated.timing(barAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
      lineas.forEach((anim, i) => {
        Animated.timing(anim, { toValue: 0.15 + i * 0.12, duration: 400, useNativeDriver: false }).start();
      });
    }
    return () => cleanup();
  }, [sistemaActivo]);

  // ── LÍNEAS DE GUÍA COLOREADAS ──────────────────────────────────
  const GuiaLines = () => (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {lineas.map((anim, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          bottom: 50 + i * 45,
          left:  anim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH / 2 - 6] }),
          right: anim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH / 2 - 6] }),
          height: i === 0 ? 3 : 2,
          backgroundColor: i === 0 ? zona.color : `${zona.color}${['CC','AA','88','55','33'][i]}`,
          borderRadius: 2,
        }} />
      ))}
      {/* Línea vertical central */}
      <View style={{
        position: 'absolute', bottom: 50, top: '20%',
        left: SCREEN_WIDTH / 2 - 1, width: 2,
        backgroundColor: `${zona.color}55`,
      }} />
      {/* Punto de mira central */}
      <View style={{
        position: 'absolute', top: '50%', left: SCREEN_WIDTH / 2 - 15,
        width: 30, height: 30, borderRadius: 15,
        borderWidth: 2, borderColor: zona.color + 'AA',
        backgroundColor: 'transparent',
      }} />
    </View>
  );

  // ── INDICADORES DE ZONA (lateral derecho) ──────────────────────
  const ZonaIndicadores = () => (
    <View style={styles.zonaContainer}>
      {[...ZONAS].reverse().map((z, i) => {
        const activa = zona.label === z.label;
        return (
          <View key={i} style={[
            styles.zonaSegmento,
            {
              backgroundColor: activa ? z.color : z.color + '30',
              height: activa ? 26 : 16,
              borderWidth: activa ? 1.5 : 0,
              borderColor: z.color,
            }
          ]}>
            {activa && <Text style={styles.zonaLabel}>{z.label.replace('⚠️ ', '')}</Text>}
          </View>
        );
      })}
    </View>
  );

  const distLabel = distancia >= 100
    ? `${(distancia / 100).toFixed(1)} m`
    : `${distancia} cm`;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0e1a' }}>

      {/* CÁMARA */}
      {sistemaActivo && permission?.granted && (
        <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
      )}

      {/* LÍNEAS */}
      {sistemaActivo && <GuiaLines />}

      {/* OVERLAY */}
      {sistemaActivo && <View style={styles.overlay} />}

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.camTag}>
              <View style={[styles.dot, { backgroundColor: sistemaActivo ? zona.color : '#555' }]} />
              <Text style={styles.camTagText}>🚗 Cámara Trasera</Text>
            </View>
            <View style={[styles.estadoBadge, { backgroundColor: zona.color + '33', borderColor: zona.color }]}>
              <Text style={[styles.estadoText, { color: zona.color }]}>{zona.label}</Text>
            </View>
          </View>

          {/* BOTÓN */}
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: sistemaActivo ? '#cc2222' : '#22cc44' }]}
            onPress={() => setSistemaActivo(v => !v)}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>
              {sistemaActivo ? '⏸  Detener Sistema' : '▶  Iniciar Asistencia'}
            </Text>
          </TouchableOpacity>

          {sistemaActivo && (
            <>
              {/* SENSORES */}
              <View style={styles.sensorCard}>
                <View style={styles.sensorRow}>
                  <View style={styles.sensorCol}>
                    <Text style={styles.sensorHeader}>ACCEL (m/s²)</Text>
                    <Text style={styles.sensorVal}>X: <Text style={styles.green}>{accelData.x.toFixed(2)}</Text></Text>
                    <Text style={styles.sensorVal}>Y: <Text style={styles.green}>{accelData.y.toFixed(2)}</Text></Text>
                    <Text style={styles.sensorVal}>Z: <Text style={styles.green}>{accelData.z.toFixed(2)}</Text></Text>
                  </View>
                  <View style={styles.sensorCol}>
                    <Text style={styles.sensorHeader}>MOVIMIENTO</Text>
                    <Text style={styles.sensorVal}>Vel: <Text style={styles.blue}>{velocidad.toFixed(3)}</Text></Text>
                    <Text style={styles.sensorVal}>Dist: <Text style={[{ color: zona.color, fontWeight: 'bold' }]}>{distLabel}</Text></Text>
                    <Text style={styles.sensorVal}>Hz: <Text style={styles.white}>20</Text></Text>
                  </View>
                  <View style={styles.sensorCol}>
                    <Text style={styles.sensorHeader}>SISTEMA</Text>
                    <Text style={styles.sensorVal}>Roll: <Text style={styles.purple}>{(accelData.x * 90).toFixed(0)}°</Text></Text>
                    <Text style={styles.sensorVal}>Pitch: <Text style={styles.purple}>{(accelData.y * 90).toFixed(0)}°</Text></Text>
                    <Text style={styles.sensorVal}>US: <Text style={styles.blue}>20kHz</Text></Text>
                  </View>
                </View>
              </View>

              {/* DISTANCIA + ZONAS */}
              <View style={styles.distRow}>
                <Animated.View style={[styles.distBadge, {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: zona.color,
                  shadowColor: zona.color,
                  shadowOpacity: 0.8,
                  shadowRadius: 14,
                  elevation: 12,
                }]}>
                  <Text style={styles.distNum}>
                    {distancia >= 100 ? (distancia / 100).toFixed(1) : distancia}
                  </Text>
                  <Text style={styles.distUnit}>{distancia >= 100 ? 'm' : 'cm'}</Text>
                </Animated.View>
                <ZonaIndicadores />
              </View>

              {/* BARRA PROGRESIVA CON GRADIENTE */}
              <View style={styles.barraContainer}>
                <Text style={[styles.barraLabel, { color: zona.color }]}>
                  {zona.label.replace('⚠️ ', '')}
                </Text>
                <View style={styles.barraBg}>
                  {/* Fondo con colores de zonas */}
                  <View style={{ flexDirection: 'row', position: 'absolute', width: '100%', height: '100%' }}>
                    {[...ZONAS].reverse().map((z, i) => (
                      <View key={i} style={{ flex: 1, backgroundColor: z.color + '25' }} />
                    ))}
                  </View>
                  {/* Fill animado */}
                  <Animated.View style={[styles.barraFill, {
                    width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: zona.color,
                  }]} />
                </View>
                <Text style={[styles.barraDistLabel, { color: zona.color }]}>{distLabel}</Text>
              </View>

              {/* INCLINÓMETRO */}
              <View style={styles.inclinCard}>
                <Text style={styles.inclinTitle}>INCLINACIÓN DEL DISPOSITIVO</Text>
                <View style={styles.inclinBar}>
                  <View style={styles.inclinLine} />
                  <View style={[styles.inclinDot, {
                    backgroundColor: zona.color,
                    transform: [{ translateX: Math.max(-55, Math.min(55, accelData.x * 25)) }]
                  }]} />
                </View>
                <View style={styles.inclinLabels}>
                  <Text style={styles.inclinSide}>Roll: {(accelData.x * 90).toFixed(1)}°</Text>
                  <Text style={styles.inclinSide}>Pitch: {(accelData.y * 90).toFixed(1)}°</Text>
                </View>
              </View>
            </>
          )}

          {/* INSTRUCCIONES */}
          {!sistemaActivo && (
            <View style={styles.instrCard}>
              <Text style={styles.instrTitle}>📋  Cómo usar ParkMaster Pro</Text>
              {[
                'Activa el sistema y apunta la cámara trasera hacia el objeto o pared',
                'Muévete lentamente hacia el objeto — el sensor detecta tu movimiento',
                'La distancia se calcula en tiempo real con el acelerómetro',
                'Verde → Amarillo → Naranja → Rojo conforme te acercas',
                'El beep suena y se acelera progresivamente al acercarte',
                'Al alejarte, todos los indicadores regresan automáticamente',
              ].map((item, i) => (
                <View key={i} style={styles.instrRow}>
                  <Text style={styles.instrNum}>{i + 1}.</Text>
                  <Text style={styles.instrText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Principal')}>
            <Text style={styles.backText}>← Volver al inicio</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  camTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(19,25,41,0.9)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  camTagText: { color: '#aabbcc', fontSize: 13, fontWeight: '600' },
  estadoBadge: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  estadoText: { fontWeight: '700', fontSize: 13 },
  mainBtn: { paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  mainBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  sensorCard: { backgroundColor: 'rgba(13,19,32,0.92)', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1e2d45' },
  sensorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sensorCol: { flex: 1 },
  sensorHeader: { color: '#556677', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  sensorVal: { color: '#667788', fontSize: 12, marginBottom: 2 },
  green: { color: '#22cc44' },
  purple: { color: '#aa66ff' },
  blue: { color: '#4488ff' },
  white: { color: '#fff' },
  distRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(19,25,41,0.92)', borderRadius: 14, padding: 14, marginBottom: 10, gap: 14, borderWidth: 1, borderColor: '#1e2d45' },
  distBadge: { width: 100, height: 100, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  distNum: { fontSize: 34, fontWeight: '900', color: '#fff' },
  distUnit: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  zonaContainer: { flex: 1, gap: 3 },
  zonaSegmento: { borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  zonaLabel: { fontSize: 9, fontWeight: '800', color: '#000' },
  barraContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(13,19,32,0.92)', borderRadius: 10, padding: 10, marginBottom: 10 },
  barraLabel: { fontWeight: '700', fontSize: 11, width: 72 },
  barraBg: { flex: 1, height: 14, backgroundColor: '#1a2235', borderRadius: 7, overflow: 'hidden' },
  barraFill: { height: '100%', borderRadius: 7 },
  barraDistLabel: { fontWeight: '700', fontSize: 11, width: 50, textAlign: 'right' },
  inclinCard: { backgroundColor: 'rgba(19,25,41,0.92)', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1e2d45' },
  inclinTitle: { color: '#556677', fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  inclinBar: { height: 36, backgroundColor: '#0d1320', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  inclinLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#ffaa00', opacity: 0.5 },
  inclinDot: { width: 16, height: 16, borderRadius: 8 },
  inclinLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  inclinSide: { color: '#556677', fontSize: 11 },
  instrCard: { backgroundColor: '#0e1d3a', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e3060' },
  instrTitle: { fontSize: 14, fontWeight: '700', color: '#aabbff', marginBottom: 10 },
  instrRow: { flexDirection: 'row', marginBottom: 6 },
  instrNum: { color: '#4466ff', fontWeight: '700', marginRight: 8, fontSize: 13 },
  instrText: { color: '#8899bb', flex: 1, lineHeight: 18, fontSize: 12 },
  backBtn: { paddingVertical: 16, alignItems: 'center' },
  backText: { color: '#445566', fontSize: 13 },
});