import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CamaraActivaScreen({ navigation, route }) {
  const camara = route?.params?.camara || 'trasera';
  const [sistemaActivo, setSistemaActivo] = useState(false);
  const [distancia, setDistancia] = useState(150);
  const [estado, setEstado] = useState('SEGURO');
  const [camActual, setCamActual] = useState(camara);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (sistemaActivo) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();

      intervalRef.current = setInterval(() => {
        setDistancia(prev => {
          const next = Math.max(20, prev - Math.floor(Math.random() * 4 + 1));
          setEstado(next < 30 ? '⚠️ PELIGRO' : next < 80 ? 'PRECAUCIÓN' : 'SEGURO');
          return next;
        });
      }, 1500);
    } else {
      if (pulseRef.current) pulseRef.current.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
      pulseAnim.setValue(1);
      setDistancia(150);
      setEstado('SEGURO');
    }
    return () => {
      if (pulseRef.current) pulseRef.current.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sistemaActivo]);

  const estadoColor = estado === 'SEGURO' ? '#22cc44' : estado === 'PRECAUCIÓN' ? '#ffaa00' : '#ff3333';
  const barWidth = `${Math.min(100, (distancia / 150) * 100)}%`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.camTag}>
            <View style={[styles.dot, { backgroundColor: sistemaActivo ? '#22cc44' : '#555' }]} />
            <Text style={styles.camTagText}>{camActual === 'trasera' ? '🚗 Cámara Trasera' : '🚌 Cámara Frontal'}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '33', borderColor: estadoColor }]}>
            <Text style={[styles.estadoText, { color: estadoColor }]}>{estado}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.mainBtn, { backgroundColor: sistemaActivo ? '#cc2222' : '#22cc44' }]}
          onPress={() => setSistemaActivo(v => !v)}
          activeOpacity={0.85}
        >
          <Text style={styles.mainBtnText}>{sistemaActivo ? '⏸  Detener Sistema' : '▶  Iniciar Asistencia'}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Posición de Cámara{sistemaActivo ? <Text style={styles.realtime}> • Cambio en tiempo real</Text> : null}
          </Text>
          <View style={styles.camaraRow}>
            {['trasera', 'frontal'].map(cam => (
              <TouchableOpacity key={cam} style={[styles.camaraBtn, camActual === cam && styles.camaraBtnActive]} onPress={() => setCamActual(cam)}>
                <Text style={styles.camaraEmoji}>{cam === 'trasera' ? '🚗' : '🚌'}</Text>
                <Text style={[styles.camaraLabel, camActual === cam && styles.camaraLabelActive]}>
                  {cam.charAt(0).toUpperCase() + cam.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {sistemaActivo && <Text style={styles.realtimeNote}>✓ Puedes cambiar la cámara mientras el sistema está activo</Text>}
        </View>

        {sistemaActivo && (
          <>
            <View style={styles.sensorCard}>
              <View style={styles.sensorRow}>
                <View style={styles.sensorCol}>
                  <Text style={styles.sensorHeader}>ACCEL</Text>
                  <Text style={styles.sensorVal}>X: <Text style={styles.green}>0.0</Text></Text>
                  <Text style={styles.sensorVal}>Y: <Text style={styles.green}>0.0</Text></Text>
                  <Text style={styles.sensorVal}>Z: <Text style={styles.green}>9.8</Text></Text>
                </View>
                <View style={styles.sensorCol}>
                  <Text style={styles.sensorHeader}>GYRO</Text>
                  <Text style={styles.sensorVal}>α: <Text style={styles.green}>0.0</Text></Text>
                  <Text style={styles.sensorVal}>β: <Text style={styles.green}>0.0</Text></Text>
                  <Text style={styles.sensorVal}>γ: <Text style={styles.green}>0.0</Text></Text>
                </View>
                <View style={styles.sensorCol}>
                  <Text style={styles.sensorHeader}>ESTADO</Text>
                  <Text style={styles.sensorVal}>G: <Text style={styles.purple}>0°</Text></Text>
                  <Text style={styles.sensorVal}>US: <Text style={styles.blue}>20kHz</Text></Text>
                  <Text style={styles.sensorVal}>FPS: <Text style={styles.white}>30</Text></Text>
                </View>
              </View>
            </View>

            <View style={styles.distCard}>
              <Animated.View style={[styles.distBadge, { transform: [{ scale: pulseAnim }], backgroundColor: estadoColor }]}>
                <Text style={styles.distNum}>{distancia}</Text>
                <Text style={styles.distUnit}>cm</Text>
              </Animated.View>
              <View style={styles.inclinacion}>
                <Text style={styles.inclinLabel}>INCLINACIÓN</Text>
                <View style={styles.inclinBar}>
                  <View style={styles.inclinLine} />
                  <View style={styles.inclinDot} />
                </View>
                <View style={styles.inclinLabels}>
                  <Text style={styles.inclinSide}>Roll: 0°</Text>
                  <Text style={styles.inclinSide}>Pitch: 0°</Text>
                </View>
              </View>
            </View>

            <View style={styles.statusBar}>
              <Text style={styles.statusLabel}>✓ SAFE</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: barWidth, backgroundColor: estadoColor }]} />
              </View>
            </View>
          </>
        )}

        {!sistemaActivo && (
          <View style={styles.instrCard}>
            <Text style={styles.instrTitle}>📋  Instrucciones de Uso</Text>
            {[
              'Coloca el teléfono en un soporte en la parte trasera o delantera del vehículo',
              'Selecciona la cámara correspondiente (trasera o frontal)',
              'Inicia el sistema y comienza la maniobra de estacionamiento',
              'Sigue las guías visuales y alertas acústicas de distancia',
              'El sistema detectará impactos automáticamente',
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
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e1a' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  camTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131929', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  camTagText: { color: '#aabbcc', fontSize: 13, fontWeight: '600' },
  estadoBadge: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  estadoText: { fontWeight: '700', fontSize: 13 },
  mainBtn: { paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  mainBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: '#131929', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e2d45' },
  cardTitle: { fontSize: 13, color: '#99aacc', marginBottom: 10 },
  realtime: { color: '#ffaa33', fontWeight: '600' },
  camaraRow: { flexDirection: 'row', gap: 10 },
  camaraBtn: { flex: 1, backgroundColor: '#1a2235', borderRadius: 10, paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  camaraBtnActive: { backgroundColor: '#2244ee', borderColor: '#4466ff' },
  camaraEmoji: { fontSize: 24, marginBottom: 4 },
  camaraLabel: { color: '#667788', fontWeight: '600', fontSize: 13 },
  camaraLabelActive: { color: '#fff' },
  realtimeNote: { color: '#22cc44', fontSize: 12, marginTop: 8 },
  sensorCard: { backgroundColor: '#0d1320', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1e2d45' },
  sensorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sensorCol: { flex: 1 },
  sensorHeader: { color: '#556677', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  sensorVal: { color: '#667788', fontSize: 12, marginBottom: 2 },
  green: { color: '#22cc44' },
  purple: { color: '#aa66ff' },
  blue: { color: '#4488ff' },
  white: { color: '#fff' },
  distCard: { backgroundColor: '#131929', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1e2d45' },
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
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0d1320', borderRadius: 10, padding: 10, marginBottom: 8 },
  statusLabel: { color: '#22cc44', fontWeight: '700', fontSize: 12, width: 60 },
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
