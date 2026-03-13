import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrincipalScreen({ navigation }) {
  const [camara, setCamara] = useState('trasera');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📊</Text>
          <View>
            <Text style={styles.headerTitle}>ParkMaster</Text>
            <Text style={styles.headerSub}>Sistema de Asistencia</Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('CamaraActiva', { camara })} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>▶  Iniciar Asistencia</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Posición de Cámara</Text>
            <View style={styles.camaraRow}>
              {['trasera', 'frontal'].map(cam => (
                <TouchableOpacity key={cam} style={[styles.camaraBtn, camara === cam && styles.camaraBtnActive]} onPress={() => setCamara(cam)}>
                  <Text style={styles.camaraEmoji}>{cam === 'trasera' ? '🚗' : '🚌'}</Text>
                  <Text style={[styles.camaraLabel, camara === cam && styles.camaraLabelActive]}>
                    {cam.charAt(0).toUpperCase() + cam.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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

          <TouchableOpacity style={styles.specsBtn} onPress={() => navigation.navigate('Especificaciones')}>
            <Text style={styles.specsBtnText}>⚙️  Ver Especificaciones Técnicas</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e1a' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  headerIcon: { fontSize: 28 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#667788' },
  startBtn: { backgroundColor: '#22cc44', paddingVertical: 20, borderRadius: 14, alignItems: 'center', marginVertical: 12 },
  startBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: '#131929', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1e2d45' },
  cardTitle: { fontSize: 13, color: '#99aacc', marginBottom: 12 },
  camaraRow: { flexDirection: 'row', gap: 10 },
  camaraBtn: { flex: 1, backgroundColor: '#1a2235', borderRadius: 10, paddingVertical: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  camaraBtnActive: { backgroundColor: '#2244ee', borderColor: '#4466ff' },
  camaraEmoji: { fontSize: 28, marginBottom: 6 },
  camaraLabel: { color: '#667788', fontWeight: '600', fontSize: 14 },
  camaraLabelActive: { color: '#fff' },
  instrCard: { backgroundColor: '#0e1d3a', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1e3060' },
  instrTitle: { fontSize: 15, fontWeight: '700', color: '#aabbff', marginBottom: 12 },
  instrRow: { flexDirection: 'row', marginBottom: 8 },
  instrNum: { color: '#4466ff', fontWeight: '700', marginRight: 8, fontSize: 14 },
  instrText: { color: '#8899bb', flex: 1, lineHeight: 20, fontSize: 13 },
  specsBtn: { backgroundColor: '#1a2235', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#2e4070' },
  specsBtnText: { color: '#7799cc', fontWeight: '600', fontSize: 14 },
});
