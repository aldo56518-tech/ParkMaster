import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const specs = [
  { label: 'Sistema Operativo', value: 'Android 10.0+' },
  { label: 'Sensores Requeridos', value: 'IMU 6 ejes' },
  { label: 'Cámara', value: 'Gran Angular' },
  { label: 'Frecuencia Ultrasonido', value: '20 kHz' },
  { label: 'Latencia', value: '< 100ms' },
];

const warnings = [
  'Usa esta herramienta como asistencia, no como sustituto de tu atención',
  'Verifica siempre los espejos y alrededores del vehículo',
  'El sistema puede tener limitaciones en condiciones de poca luz',
  'Calibra los sensores antes de cada uso',
];

export default function EspecificacionesScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Especificaciones</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.specsCard}>
            <Text style={styles.specsCardTitle}>Especificaciones Técnicas</Text>
            {specs.map((s, i) => (
              <View key={i} style={[styles.specRow, i < specs.length - 1 && styles.specRowBorder]}>
                <Text style={styles.specLabel}>{s.label}</Text>
                <Text style={styles.specValue}>{s.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.warningsCard}>
            <Text style={styles.warningsTitle}>⚠️  Advertencias de Seguridad</Text>
            {warnings.map((w, i) => (
              <View key={i} style={styles.warningRow}>
                <Text style={styles.warningBullet}>•</Text>
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.navigate('Principal')}>
            <Text style={styles.mainBtnText}>Ir al Panel Principal</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e1a' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  backBtn: { backgroundColor: '#1a2235', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  backText: { color: '#aabbff', fontWeight: '600', fontSize: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  specsCard: { backgroundColor: '#131929', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1e2d45' },
  specsCardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 14 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  specRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1e2d45' },
  specLabel: { color: '#7788aa', fontSize: 14 },
  specValue: { color: '#ddeeff', fontSize: 14, fontWeight: '600' },
  warningsCard: { backgroundColor: '#2a1500', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#5a3000' },
  warningsTitle: { fontSize: 16, fontWeight: '700', color: '#ffaa33', marginBottom: 14 },
  warningRow: { flexDirection: 'row', marginBottom: 10 },
  warningBullet: { color: '#ffaa33', marginRight: 8, fontSize: 16 },
  warningText: { color: '#ffcc77', flex: 1, lineHeight: 20, fontSize: 13 },
  mainBtn: { backgroundColor: '#2244ee', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  mainBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
