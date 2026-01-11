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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Admin UID
const ADMIN_UID = "PKSeq0uhBQcJwEjYCW085jtV24e2";

// Auth state listener
auth.onAuthStateChanged((user) => {
  const currentPage = window.location.pathname.split('/').pop();
  
  if (user) {
    // User is logged in
    if (currentPage === 'login.html' || currentPage === 'signup.html' || currentPage === 'index.html') {
      // Redirect to dashboard based on role
      if (user.uid === ADMIN_UID) {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  } else {
    // User is logged out
    if (currentPage === 'dashboard.html' || currentPage === 'admin.html') {
      window.location.href = 'login.html';
    }
  }
});
