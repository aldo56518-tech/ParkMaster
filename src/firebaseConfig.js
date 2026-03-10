    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";

    const firebaseConfig = {
    apiKey: "AIzaSyB4j0ZsBRDpJXI_i5xcuSx5TTY2FCHgkkA",
    authDomain: "login-e6d49.firebaseapp.com",
    projectId: "login-e6d49",
    storageBucket: "login-e6d49.firebasestorage.app",
    messagingSenderId: "518752273316",
    appId: "1:518752273316:web:d29bf663c6106878aa3731",
    measurementId: "G-05B488QH4T"
    };

    const app = initializeApp(firebaseConfig);
    export const auth = getAuth(app);