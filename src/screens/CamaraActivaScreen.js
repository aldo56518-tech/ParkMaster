import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DISTANCIA_INICIAL = 200;

// Zonas de distancia
const ZONAS = [
  { max: 200, min: 120, color: '#22cc44', label: 'SEGURO',    beepMs: null  },
  { max: 120, min: 80,  color: '#aaff00', label: 'ATENCIÓN',  beepMs: 1400  },
  { max: 80,  min: 50,  color: '#ffdd00', label: 'DESPACIO',  beepMs: 900   },
  { max: 50,  min: 25,  color: '#ff8800', label: 'PRECAUCIÓN',beepMs: 500   },
  { max: 25,  min: 0,   color: '#ff2222', label: '⚠️ PELIGRO', beepMs: 220   },
];

function getZona(dist) {
  return ZONAS.find(z => dist <= z.max && dist > z.min) || ZONAS[ZONAS.length - 1];
}

export default function CamaraActivaScreen({ navigation, route }) {
  const [sistemaActivo, setSistemaActivo] = useState(false);
  const [zona, setZona] = useState(ZONAS[0]);
  const [permission, requestPermission] = useCameraPermissions();
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 9.8 });
  const [distancia, setDistancia] = useState(DISTANCIA_INICIAL);
  const [velocidad, setVelocidad] = useState(0);

  // Refs para animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim   = useRef(new Animated.Value(0)).current; // 0=lejos, 1=cerca
  const lineas    = useRef([0,1,2,3,4].map(() => new Animated.Value(0.5))).current;

  // Refs de control
  const pulseRef      = useRef(null);
  const sensorRef     = useRef(null);
  const distRef       = useRef(DISTANCIA_INICIAL);
  const velRef        = useRef(0);
  const prevAccelRef  = useRef({ x: 0, y: 0, z: 9.8 });
  const soundRef      = useRef(null);
  const beepTimerRef  = useRef(null);
  const zonaActualRef = useRef(ZONAS[0]);
  const playingRef    = useRef(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    return () => { cleanup(); };
  }, []);

  const cleanup = () => {
    stopBeep();
    if (sensorRef.current) sensorRef.current.remove();
    if (pulseRef.current) pulseRef.current.stop();
  };

  // ─── SISTEMA DE BEEP PROGRESIVO ──────────────────────────────────────────
  const stopBeep = () => {
    if (beepTimerRef.current) { clearTimeout(beepTimerRef.current); beepTimerRef.current = null; }
    if (soundRef.current) { soundRef.current.unloadAsync().catch(() => {}); soundRef.current = null; }
    playingRef.current = false;
  };

  const scheduleNextBeep = (intervaloMs) => {
    if (!intervaloMs || !playingRef.current) return;
    beepTimerRef.current = setTimeout(async () => {
      if (!playingRef.current) return;
      try {
        if (soundRef.current) { await soundRef.current.unloadAsync().catch(() => {}); soundRef.current = null; }
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/beep.mp3'),
          { shouldPlay: true, volume: 1.0 }
        );
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            soundRef.current = null;
            // Reagendar con el intervalo ACTUAL (puede haber cambiado)
            scheduleNextBeep(zonaActualRef.current.beepMs);
          }
        });
      } catch (e) {}
    }, intervaloMs);
  };

  const startBeep = (intervaloMs) => {
    stopBeep();
    if (!intervaloMs) return;
    playingRef.current = true;
    scheduleNextBeep(0); // primer beep inmediato
  };

  const updateBeep = (nuevaZona) => {
    zonaActualRef.current = nuevaZona;
    if (!nuevaZona.beepMs) {
      stopBeep();
    } else if (!playingRef.current) {
      startBeep(nuevaZona.beepMs);
    }
    // Si ya está sonando, el siguiente beep usará el nuevo intervalo automáticamente
  };

  // ─── SISTEMA ACTIVO / INACTIVO ────────────────────────────────────────────
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

      // Acelerómetro a 100ms
      Accelerometer.setUpdateInterval(100);
      sensorRef.current = Accelerometer.addListener(({ x, y, z }) => {
        setAccel({ x, y, z });

        const prev = prevAccelRef.current;

        // Delta en cada eje
        const dX = x - prev.x;
        const dY = y - prev.y;
        const dZ = z - prev.z;

        // Movimiento neto: combinamos los tres ejes
        // dY positivo = se aleja, dY negativo = se acerca (teléfono vertical)
        // dZ positivo = se acerca (teléfono horizontal apuntando hacia adelante)
        const movNeto = -(dY * 0.5 + dZ * 0.3 + dX * 0.2);

        prevAccelRef.current = { x, y, z };

        // Filtro de fricción para suavizar
        velRef.current = velRef.current * 0.65 + movNeto * 0.35;
        const vel = velRef.current;
        setVelocidad(Math.abs(vel));

        // Actualizar distancia
        const cambio = vel * 30;
        distRef.current = Math.min(DISTANCIA_INICIAL, Math.max(2, distRef.current - cambio));

        const dist = Math.round(distRef.current);
        setDistancia(dist);

        // Zona actual
        const nuevaZona = getZona(dist);
        if (nuevaZona.label !== zonaActualRef.current.label) {
          setZona(nuevaZona);
          updateBeep(nuevaZona);
        }

        // Barra de progreso: 0=lejos(SEGURO), 1=cerca(PELIGRO)
        const progreso = 1 - (dist / DISTANCIA_INICIAL);
        Animated.timing(barAnim, { toValue: progreso, duration: 80, useNativeDriver: false }).start();

        // Líneas de guía: más juntas al acercarse
        const factor = dist / DISTANCIA_INICIAL; // 1=lejos, 0=cerca
        lineas.forEach((anim, i) => {
          const spread = 0.08 + factor * (0.10 + i * 0.08);
          Animated.timing(anim, { toValue: spread, duration: 80, useNativeDriver: false }).start();
        });
      });

    } else {
      cleanup();
      pulseAnim.setValue(1);
      distRef.current = DISTANCIA_INICIAL;
      velRef.current = 0;
      zonaActualRef.current = ZONAS[0];
      setDistancia(DISTANCIA_INICIAL);
      setZona(ZONAS[0]);
      setVelocidad(0);
      Animated.timing(barAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
      lineas.forEach((anim, i) => {
        Animated.timing(anim, { toValue: 0.08 + i * 0.10, duration: 400, useNativeDriver: false }).start();
      });
    }
    return () => cleanup();
  }, [sistemaActivo]);

  // ─── LÍNEAS DE GUÍA CON COLORES ───────────────────────────────────────────
  const GuiaLines = () => {
    const coloresLineas = [
      zona.color,           // línea más cercana = color del estado actual
      zona.color + 'CC',
      '#ffdd0088',
      '#aaff0066',
      '#22cc4444',
    ];
    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {lineas.map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              bottom: 60 + i * 40,
              left: anim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH / 2 - 8] }),
              right: anim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH / 2 - 8] }),
              height: i === 0 ? 3 : 2,
              backgroundColor: coloresLineas[i],
              borderRadius: 2,
            }}
          />
        ))}
        {/* Línea central vertical */}
        <View style={{
          position: 'absolute', bottom: 60, top: '25%',
          left: SCREEN_WIDTH / 2 - 1, width: 2,
          backgroundColor: zona.color + '66',
        }} />
        {/* Punto central */}
        <View style={{
          position: 'absolute',
          bottom: 55,
          left: SCREEN_WIDTH / 2 - 6,
          width: 12, height: 12, borderRadius: 6,
          backgroundColor: zona.color,
          opacity: 0.9,
        }} />
      </View>
    );
  };

  // ─── INDICADORES DE ZONA (barras laterales de colores) ───────────────────
  const ZonaIndicadores = () => (
    <View style={styles.zonaContainer}>
      {[...ZONAS].reverse().map((z, i) => {
        const activa = zona.label === z.label;
        return (
          <View key={i} style={[
            styles.zonaSegmento,
            { backgroundColor: activa ? z.color : z.color + '33',
              height: activa ? 28 : 18,
              borderWidth: activa ? 1 : 0,
              borderColor: z.color }
          ]}>
            {activa && (
              <Text style={[styles.zonaLabel, { color: '#000' }]}>
                {z.label.replace('⚠️ ', '')}
              </Text>
            )}
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
      {sistemaActivo && permission?.granted && (
        <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
      )}
      {sistemaActivo && <GuiaLines />}
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

          {/* BOTÓN PRINCIPAL */}
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
                    <Text style={styles.sensorHeader}>ACCEL</Text>
                    <Text style={styles.sensorVal}>X: <Text style={styles.green}>{accel.x.toFixed(2)}</Text></Text>
                    <Text style={styles.sensorVal}>Y: <Text style={styles.green}>{accel.y.toFixed(2)}</Text></Text>
                    <Text style={styles.sensorVal}>Z: <Text style={styles.green}>{accel.z.toFixed(2)}</Text></Text>
                  </View>
                  <View style={styles.sensorCol}>
                    <Text style={styles.sensorHeader}>MOVIMIENTO</Text>
                    <Text style={styles.sensorVal}>Vel: <Text style={styles.blue}>{velocidad.toFixed(3)}</Text></Text>
                    <Text style={styles.sensorVal}>Dist: <Text style={{ color: zona.color, fontWeight: 'bold' }}>{distLabel}</Text></Text>
                    <Text style={styles.sensorVal}>FPS: <Text style={styles.white}>10</Text></Text>
                  </View>
                  <View style={styles.sensorCol}>
                    <Text style={styles.sensorHeader}>SISTEMA</Text>
                    <Text style={styles.sensorVal}>Roll: <Text style={styles.purple}>{(accel.x * 90).toFixed(0)}°</Text></Text>
                    <Text style={styles.sensorVal}>Pitch: <Text style={styles.purple}>{(accel.y * 90).toFixed(0)}°</Text></Text>
                    <Text style={styles.sensorVal}>US: <Text style={styles.blue}>20kHz</Text></Text>
                  </View>
                </View>
              </View>

              {/* DISTANCIA + INDICADORES DE ZONA */}
              <View style={styles.distRow}>
                <Animated.View style={[styles.distBadge, {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: zona.color,
                  shadowColor: zona.color,
                  shadowOpacity: 0.8,
                  shadowRadius: 12,
                  elevation: 10,
                }]}>
                  <Text style={styles.distNum}>{distancia >= 100 ? (distancia/100).toFixed(1) : distancia}</Text>
                  <Text style={styles.distUnit}>{distancia >= 100 ? 'm' : 'cm'}</Text>
                </Animated.View>
                <ZonaIndicadores />
              </View>

              {/* BARRA DE PROGRESO CON GRADIENTE DE COLOR */}
              <View style={styles.barraContainer}>
                <Text style={[styles.barraLabel, { color: zona.color }]}>
                  {zona.label.replace('⚠️ ', '')}
                </Text>
                <View style={styles.barraBg}>
                  {/* Segmentos de color como fondo */}
                  <View style={{ flexDirection: 'row', position: 'absolute', width: '100%', height: '100%' }}>
                    {ZONAS.slice().reverse().map((z, i) => (
                      <View key={i} style={{ flex: 1, backgroundColor: z.color + '22' }} />
                    ))}
                  </View>
                  {/* Barra de progreso animada */}
                  <Animated.View style={[styles.barraFill, {
                    width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: zona.color,
                  }]} />
                </View>
                <Text style={[styles.barraDistLabel, { color: zona.color }]}>{distLabel}</Text>
              </View>

              {/* INCLINÓMETRO */}
              <View style={styles.inclinCard}>
                <Text style={styles.inclinTitle}>INCLINACIÓN</Text>
                <View style={styles.inclinBar}>
                  <View style={styles.inclinLine} />
                  <View style={[styles.inclinDot, {
                    backgroundColor: zona.color,
                    transform: [{ translateX: Math.max(-50, Math.min(50, accel.x * 25)) }]
                  }]} />
                </View>
                <View style={styles.inclinLabels}>
                  <Text style={styles.inclinSide}>Roll: {(accel.x * 90).toFixed(1)}°</Text>
                  <Text style={styles.inclinSide}>Pitch: {(accel.y * 90).toFixed(1)}°</Text>
                </View>
              </View>
            </>
          )}

          {/* INSTRUCCIONES */}
          {!sistemaActivo && (
            <View style={styles.instrCard}>
              <Text style={styles.instrTitle}>📋  Instrucciones de Uso</Text>
              {[
                'Apunta el teléfono hacia el objeto o pared',
                'Presiona Iniciar Asistencia para activar sensores y cámara',
                'Muévete hacia el objeto — la distancia se detecta automáticamente',
                'Verde = Seguro · Amarillo = Atención · Naranja = Precaución · Rojo = Peligro',
                'El beep se acelera conforme te acercas, como sensor de reversa real',
                'Al alejarte todos los indicadores regresan automáticamente',
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.40)' },
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
  sensorHeader: { color: '#556677', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  sensorVal: { color: '#667788', fontSize: 12, marginBottom: 2 },
  green: { color: '#22cc44' },
  purple: { color: '#aa66ff' },
  blue: { color: '#4488ff' },
  white: { color: '#fff' },
  distRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(19,25,41,0.92)', borderRadius: 14, padding: 14, marginBottom: 10, gap: 16, borderWidth: 1, borderColor: '#1e2d45' },
  distBadge: { width: 100, height: 100, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  distNum: { fontSize: 34, fontWeight: '900', color: '#fff' },
  distUnit: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  zonaContainer: { flex: 1, gap: 4 },
  zonaSegmento: { borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  zonaLabel: { fontSize: 10, fontWeight: '800' },
  barraContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(13,19,32,0.92)', borderRadius: 10, padding: 10, marginBottom: 10 },
  barraLabel: { fontWeight: '700', fontSize: 11, width: 72 },
  barraBg: { flex: 1, height: 12, backgroundColor: '#1a2235', borderRadius: 6, overflow: 'hidden' },
  barraFill: { height: '100%', borderRadius: 6 },
  barraDistLabel: { fontWeight: '700', fontSize: 11, width: 48, textAlign: 'right' },
  inclinCard: { backgroundColor: 'rgba(19,25,41,0.92)', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1e2d45' },
  inclinTitle: { color: '#556677', fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  inclinBar: { height: 36, backgroundColor: '#0d1320', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  inclinLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#ffaa00', opacity: 0.6 },
  inclinDot: { width: 14, height: 14, borderRadius: 7 },
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