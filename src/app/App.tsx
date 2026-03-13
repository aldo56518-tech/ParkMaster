import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import LoginScreen from '../screens/LoginScreen';
import PermisosScreen from '../screens/PermisosScreen';
import PrincipalScreen from '../screens/PrincipalScreen';
import EspecificacionesScreen from '../screens/EspecificacionesScreen';
import CamaraActivaScreen from '../screens/CamaraActivaScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [pantalla, setPantalla] = useState('Permisos');
  const [params, setParams] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setPantalla('Permisos');
    });
    return unsub;
  }, []);

  const navigation = {
    navigate: (nombre, p = {}) => { setParams(p); setPantalla(nombre); },
    goBack: () => setPantalla('Principal'),
  };

  if (!user) return <LoginScreen />;
  if (pantalla === 'Permisos') return <PermisosScreen navigation={navigation} />;
  if (pantalla === 'Principal') return <PrincipalScreen navigation={navigation} />;
  if (pantalla === 'Especificaciones') return <EspecificacionesScreen navigation={navigation} />;
  if (pantalla === 'CamaraActiva') return <CamaraActivaScreen navigation={navigation} route={{ params }} />;
}