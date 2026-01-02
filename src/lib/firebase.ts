import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyB9yCBa3cOlC-_-wD9MwFLgy1J2HkMg3hc",
    authDomain: "webshogi-b1015.firebaseapp.com",
    databaseURL: "https://webshogi-b1015-default-rtdb.firebaseio.com",
    projectId: "webshogi-b1015",
    storageBucket: "webshogi-b1015.firebasestorage.app",
    messagingSenderId: "963306191404",
    appId: "1:963306191404:web:b57dac462745d1f6476f89",
    measurementId: "G-E6Y47HN7SY"
};

import { getAuth } from "firebase/auth";

import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
// export const storage = getStorage(app); // Comment out or remove if not used
