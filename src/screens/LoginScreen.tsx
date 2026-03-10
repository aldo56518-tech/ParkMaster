import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseConfig'; // Asegúrate de que la ruta sea correcta

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        alert("¡Bienvenido a ParkMaster!");
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* Logo similar al ejemplo */}
        <View style={styles.logoCircle}>
          <Text style={{fontSize: 40}}>🅿️</Text> 
        </View>

        <Text style={styles.title}>ParkMaster <Text style={styles.blueText}>Pro</Text></Text>
        <Text style={styles.subtitle}>Gestión de Estacionamiento Premium</Text>

        <View style={styles.card}>
          <Text style={styles.label}>USUARIO</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ingresa tu correo" 
            placeholderTextColor="#666"
            onChangeText={setEmail}
          />

          <Text style={styles.label}>CONTRASEÑA</Text>
          <TextInput 
            style={styles.input} 
            placeholder="••••••••" 
            placeholderTextColor="#666"
            secureTextEntry
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' }, // Fondo oscuro como el ejemplo
  innerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#3b82f6' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  blueText: { color: '#3b82f6' },
  subtitle: { color: '#94a3b8', marginBottom: 30 },
  card: { width: '100%', backgroundColor: '#1e293b', borderRadius: 20, padding: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', color: '#fff', borderRadius: 10, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});