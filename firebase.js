// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7VssprVgfgkQI65XQ_L9JQb1zMtyAvdU",
  authDomain: "picshift-1ca8e.firebaseapp.com",
  databaseURL: "https://picshift-1ca8e-default-rtdb.firebaseio.com",
  projectId: "picshift-1ca8e",
  storageBucket: "picshift-1ca8e.firebasestorage.app",
  messagingSenderId: "497262962263",
  appId: "1:497262962263:web:7135c739115ef7ed55a512",
  measurementId: "G-DYVQ875ZRL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Make db available globally
window.db = db;