// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyABzqSv-pSc26Ny6HcQb66S3Da0-XP4ZDo",
  authDomain: "dg-market-official.firebaseapp.com",
  projectId: "dg-market-official",
  storageBucket: "dg-market-official.firebasestorage.app",
  messagingSenderId: "472340039296",
  appId: "1:472340039296:web:b6247573157d2992348865",
  measurementId: "G-Y761C5MZQH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Admin UID
const ADMIN_UID = "PKSeq0uhBQcJwEjYCW085jtV24e2";
