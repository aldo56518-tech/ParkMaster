import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CamaraActivaScreen({ navigation, route }) {
  const [sistemaActivo, setSistemaActivo] = useState(false);
  const [estado, setEstado] = useState('SEGURO');
  const [permission, requestPermission] = useCameraPermissions();
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 9.8 });
  const [distancia, setDistancia] = useState(150);
  const [velocidad, setVelocidad] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const linea1 = useRef(new Animated.Value(0.15)).current;
  const linea2 = useRef(new Animated.Value(0.30)).current;
  const linea3 = useRef(new Animated.Value(0.55)).current;
  const linea4 = useRef(new Animated.Value(0.75)).current;
  const pulseRef = useRef(null);
  const sensorRef = useRef(null);
  const distRef = useRef(150);
  const prevAccelRef = useRef({ x: 0, y: 0, z: 9.8 });
  const soundRef = useRef(null);
  const beepIntervalRef = useRef(null);
  const lastEstadoRef = useRef('SEGURO');

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    return () => {
      stopBeep();
      if (sensorRef.current) sensorRef.current.remove();
      if (pulseRef.current) pulseRef.current.stop();
    };
  }, []);

  const stopBeep = () => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const playBeep = (intervalo) => {
    stopBeep();
    const beep = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/beep.mp3'),
          { shouldPlay: true, volume: 1.0 }
        );
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
      } catch (e) {
        console.log('Audio error:', e);
      }
    };
    beep();
    beepIntervalRef.current = setInterval(beep, intervalo);
  };

  useEffect(() => {
    if (sistemaActivo) {
      // Animación pulso
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();

      // Acelerómetro real
      Accelerometer.setUpdateInterval(200);
      sensorRef.current = Accelerometer.addListener(({ x, y, z }) => {
        setAccel({ x, y, z });

        const prev = prevAccelRef.current;
        const deltaX = Math.abs(x - prev.x);
        const deltaY = Math.abs(y - prev.y);
        const deltaZ = Math.abs(z - prev.z);
        const movimiento = deltaX + deltaY + deltaZ;
        prevAccelRef.current = { x, y, z };
        setVelocidad(movimiento);

        // Distancia sube y baja en tiempo real según movimiento
        if (movimiento > 0.05) {
          // Moviéndose — reducir distancia (acercándose)
          distRef.current = Math.max(5, distRef.current - movimiento * 8);
        } else {
          // Quieto o alejándose — recuperar distancia gradualmente
          distRef.current = Math.min(150, distRef.current + 1.5);
        }

        const dist = Math.round(distRef.current);
        setDistancia(dist);

        // Estado en tiempo real
        let nuevoEstado;
        if (dist < 20) {
          nuevoEstado = '⚠️ PELIGRO';
        } else if (dist < 60) {
          nuevoEstado = 'PRECAUCIÓN';
        } else {
          nuevoEstado = 'SEGURO';
        }
        setEstado(nuevoEstado);

        // Sonido — solo cambia cuando cambia el estado
        if (nuevoEstado !== lastEstadoRef.current) {
          lastEstadoRef.current = nuevoEstado;
          if (nuevoEstado === '⚠️ PELIGRO') {
            playBeep(400);   // beep muy rápido
          } else if (nuevoEstado === 'PRECAUCIÓN') {
            playBeep(900);   // beep moderado
          } else {
            stopBeep();      // sin sonido en SEGURO
          }
        }

        // Líneas de guía animadas
        const factor = dist / 150;
        Animated.parallel([
          Animated.timing(linea1, { toValue: 0.05 + factor * 0.10, duration: 150, useNativeDriver: false }),
          Animated.timing(linea2, { toValue: 0.15 + factor * 0.20, duration: 150, useNativeDriver: false }),
          Animated.timing(linea3, { toValue: 0.35 + factor * 0.25, duration: 150, useNativeDriver: false }),
          Animated.timing(linea4, { toValue: 0.60 + factor * 0.20, duration: 150, useNativeDriver: false }),
        ]).start();
      });

    } else {
      if (pulseRef.current) pulseRef.current.stop();
      if (sensorRef.current) sensorRef.current.remove();
      stopBeep();
      pulseAnim.setValue(1);
      distRef.current = 150;
      lastEstadoRef.current = 'SEGURO';
      setDistancia(150);
      setEstado('SEGURO');
      setVelocidad(0);
      Animated.parallel([
        Animated.timing(linea1, { toValue: 0.15, duration: 300, useNativeDriver: false }),
        Animated.timing(linea2, { toValue: 0.30, duration: 300, useNativeDriver: false }),
        Animated.timing(linea3, { toValue: 0.55, duration: 300, useNativeDriver: false }),
        Animated.timing(linea4, { toValue: 0.75, duration: 300, useNativeDriver: false }),
      ]).start();
    }
    return () => {
      if (pulseRef.current) pulseRef.current.stop();
      if (sensorRef.current) sensorRef.current.remove();
    };
  }, [sistemaActivo]);

  const estadoColor = estado === 'SEGURO' ? '#22cc44' : estado === 'PRECAUCIÓN' ? '#ffaa00' : '#ff3333';
  const barWidth = `${Math.min(100, (distancia / 150) * 100)}%`;

  const GuiaLines = () => (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {[linea1, linea2, linea3, linea4].map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            bottom: 80 + i * 30,
            left: anim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH / 2 - 10] }),
            right: anim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH / 2 - 10] }),
            height: 2,
            backgroundColor: i < 2 ? estadoColor : `${estadoColor}88`,
            opacity: 1 - i * 0.15,
          }}
        />
      ))}
      <View style={{
        position: 'absolute',
        bottom: 80,
        top: '30%',
        left: SCREEN_WIDTH / 2 - 1,
        width: 2,
        backgroundColor: `${estadoColor}55`,
      }} />
    </View>
  );

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
              <View style={[styles.dot, { backgroundColor: sistemaActivo ? '#22cc44' : '#555' }]} />
              <Text style={styles.camTagText}>🚗 Cámara Trasera</Text>
            </View>
            <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '33', borderColor: estadoColor }]}>
              <Text style={[styles.estadoText, { color: estadoColor }]}>{estado}</Text>
            </View>
          </View>

          {/* BOTÓN PRINCIPAL */}
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: sistemaActivo ? '#cc2222' : '#22cc44' }]}
            onPress={() => setSistemaActivo(v => !v)}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>{sistemaActivo ? '⏸  Detener Sistema' : '▶  Iniciar Asistencia'}</Text>
          </TouchableOpacity>

          {/* SENSORES */}
          {sistemaActivo && (
            <>
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
                    <Text style={styles.sensorVal}>Dist: <Text style={styles.green}>{distancia}cm</Text></Text>
                    <Text style={styles.sensorVal}>Est: <Text style={{ color: estadoColor }}>{estado.replace('⚠️ ', '')}</Text></Text>
                  </View>
                  <View style={styles.sensorCol}>
                    <Text style={styles.sensorHeader}>SISTEMA</Text>
                    <Text style={styles.sensorVal}>G: <Text style={styles.purple}>9.8</Text></Text>
                    <Text style={styles.sensorVal}>US: <Text style={styles.blue}>20kHz</Text></Text>
                    <Text style={styles.sensorVal}>FPS: <Text style={styles.white}>30</Text></Text>
                  </View>
                </View>
              </View>

              {/* DISTANCIA */}
              <View style={styles.distCard}>
                <Animated.View style={[styles.distBadge, { transform: [{ scale: pulseAnim }], backgroundColor: estadoColor }]}>
                  <Text style={styles.distNum}>{distancia}</Text>
                  <Text style={styles.distUnit}>cm</Text>
                </Animated.View>
                <View style={styles.inclinacion}>
                  <Text style={styles.inclinLabel}>INCLINACIÓN</Text>
                  <View style={styles.inclinBar}>
                    <View style={styles.inclinLine} />
                    <View style={[styles.inclinDot, { transform: [{ translateX: accel.x * 20 }] }]} />
                  </View>
                  <View style={styles.inclinLabels}>
                    <Text style={styles.inclinSide}>Roll: {(accel.x * 90).toFixed(1)}°</Text>
                    <Text style={styles.inclinSide}>Pitch: {(accel.y * 90).toFixed(1)}°</Text>
                  </View>
                </View>
              </View>

              {/* BARRA ESTADO */}
              <View style={styles.statusBar}>
                <Text style={[styles.statusLabel, { color: estadoColor }]}>✓ {estado.replace('⚠️ ', '')}</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: barWidth, backgroundColor: estadoColor }]} />
                </View>
              </View>
            </>
          )}

          {/* INSTRUCCIONES */}
          {!sistemaActivo && (
            <View style={styles.instrCard}>
              <Text style={styles.instrTitle}>📋  Instrucciones de Uso</Text>
              {[
                'Coloca el teléfono apuntando hacia el objeto o pared',
                'Presiona Iniciar Asistencia para activar sensores y cámara',
                'Muévete hacia el objeto — el sistema detecta tu movimiento',
                'Escucharás un beep moderado al acercarte (menos de 60cm)',
                'El beep se acelera en zona de PELIGRO (menos de 20cm)',
                'Al alejarte el sistema vuelve automáticamente a SEGURO',
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
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
  distCard: { backgroundColor: 'rgba(19,25,41,0.92)', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1e2d45' },
  distBadge: { width: 100, height: 100, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  distNum: { fontSize: 36, fontWeight: '900', color: '#fff' },
  distUnit: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  inclinacion: { width: '100%' },
  inclinLabel: { color: '#556677', fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  inclinBar: { height: 40, backgroundColor: '#0d1320', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  inclinLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#ffaa00', opacity: 0.8 },
  inclinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff4444' },
  inclinLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  inclinSide: { color: '#556677', fontSize: 11 },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(13,19,32,0.92)', borderRadius: 10, padding: 10, marginBottom: 8 },
  statusLabel: { fontWeight: '700', fontSize: 12, width: 80 },
  barBg: { flex: 1, height: 8, backgroundColor: '#1a2235', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  instrCard: { backgroundColor: '#0e1d3a', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e3060' },
  instrTitle: { fontSize: 14, fontWeight: '700', color: '#aabbff', marginBottom: 10 },
  instrRow: { flexDirection: 'row', marginBottom: 6 },
  instrNum: { color: '#4466ff', fontWeight: '700', marginRight: 8, fontSize: 13 },
  instrText: { color: '#8899bb', flex: 1, lineHeight: 18, fontSize: 12 },
  backBtn: { paddingVertical: 16, alignItems: 'center' },
  backText: { color: '#445566', fontSize: 13 },
});