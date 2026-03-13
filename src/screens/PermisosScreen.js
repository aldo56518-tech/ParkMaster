import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PermisosScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bg}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🅿️</Text>
          </View>
          <Text style={styles.title}>ParkMaster</Text>
          <Text style={styles.subtitle}>Sistema de Asistencia al Estacionamiento</Text>
          <View style={styles.divider} />
          <Text style={styles.desc}>
            Esta aplicación necesita acceso a los sensores de tu dispositivo
            (acelerómetro, giroscopio) y la cámara para funcionar correctamente.
          </Text>
          <Animated.View style={[styles.btnWrap, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Principal')} activeOpacity={0.85}>
              <Text style={styles.btnText}>🔓  Permitir Acceso a Sensores</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.footer}>Android 10.0+ • Requiere cámara gran angular e IMU 6 ejes</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, overflow: 'hidden' },
  circle1: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: '#1a1a3e', top: -80, right: -100, opacity: 0.6 },
  circle2: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#0a2040', bottom: -60, left: -80, opacity: 0.5 },
  content: { width: '100%', alignItems: 'center' },
  iconBox: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#1a1060', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconEmoji: { fontSize: 52 },
  title: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 1, marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#7788aa', marginBottom: 28, textAlign: 'center' },
  divider: { width: 50, height: 2, backgroundColor: '#3344bb', borderRadius: 2, marginBottom: 28 },
  desc: { fontSize: 15, color: '#aabbcc', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  btnWrap: { width: '100%', marginBottom: 24 },
  btn: { backgroundColor: '#2244ee', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  footer: { fontSize: 12, color: '#445566', textAlign: 'center' },
});
