    import React from 'react';
    import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
    import { signOut } from 'firebase/auth';
    // CORRECCIÓN: Solo un "../" porque HomeScreen está en src/screens 
    // y firebaseConfig está en src/
    import { auth } from '../firebaseConfig'; 

    export default function HomeScreen() {
    const handleLogout = () => {
        signOut(auth)
        .then(() => {
            // Al cerrar sesión, App.tsx detectará user = null y te mandará al Login
        })
        .catch((error) => alert("Error al salir: " + error.message));
    };

    return (
        <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>ParkMaster <Text style={styles.blueText}>Pro</Text></Text>
            <Text style={styles.subtitle}>Panel de Administración</Text>
        </View>

        <View style={styles.card}>
            <Text style={styles.welcomeText}>¡Bienvenido de nuevo!</Text>
            <Text style={styles.infoText}>Has iniciado sesión como:</Text>
            <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a', padding: 20, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    blueText: { color: '#3b82f6' },
    subtitle: { color: '#94a3b8', fontSize: 16 },
    card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 30 },
    welcomeText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    infoText: { color: '#94a3b8', fontSize: 14 },
    emailText: { color: '#3b82f6', fontWeight: 'bold', marginTop: 5 },
    logoutButton: { backgroundColor: '#ef4444', padding: 15, borderRadius: 12, alignItems: 'center' },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
    });