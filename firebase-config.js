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
const storage = firebase.storage();

// Admin UID
const ADMIN_UID = "PKSeq0uhBQcJwEjYCW085jtV24e2";

// Auto-redirect function
function checkAuthAndRedirect() {
  const currentPage = window.location.pathname.split('/').pop();
  
  auth.onAuthStateChanged((user) => {
    console.log("Auth state changed. User:", user ? "Logged in" : "Logged out");
    console.log("Current page:", currentPage);
    
    if (user) {
      // User is logged in
      console.log("User UID:", user.uid);
      console.log("Is admin?", user.uid === ADMIN_UID);
      
      // If on login/signup page, redirect to dashboard
      if (currentPage === 'login.html' || currentPage === 'signup.html' || currentPage === 'index.html') {
        console.log("Redirecting from auth page...");
        setTimeout(() => {
          if (user.uid === ADMIN_UID) {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 500);
      }
    } else {
      // User is logged out
      console.log("No user found, checking page...");
      
      // If on protected pages, redirect to login
      if (currentPage === 'dashboard.html' || currentPage === 'admin.html') {
        console.log("Redirecting to login...");
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 500);
      }
    }
  });
}

// Call on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, checking auth...");
  checkAuthAndRedirect();
});
