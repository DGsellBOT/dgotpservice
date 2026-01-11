// Authentication Functions
class AuthManager {
  constructor() {
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.ADMIN_UID = "PKSeq0uhBQcJwEjYCW085jtV24e2";
  }

  // User Login
  async login(email, password, rememberMe = false) {
    try {
      console.log("Login attempt for:", email);
      
      // Set persistence
      const persistence = rememberMe ? 
        firebase.auth.Auth.Persistence.LOCAL : 
        firebase.auth.Auth.Persistence.SESSION;
      
      await this.auth.setPersistence(persistence);
      
      // Sign in
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log("Login successful:", user.uid);
      
      // Update last login in Firestore
      try {
        await this.db.collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          lastLoginIP: await this.getIP()
        });
      } catch (error) {
        console.log("Could not update login timestamp:", error);
      }
      
      return { success: true, user };
      
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please check credentials.";
      
      switch(error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/user-disabled':
          errorMessage = "Account has been disabled.";
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // User Signup
  async signup(fullName, email, phone, password) {
    try {
      console.log("Signup attempt:", email);
      
      // Create user
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log("User created:", user.uid);
      
      // Create user document in Firestore
      await this.db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: email,
        fullName: fullName,
        phone: phone,
        walletBalance: 0,
        isActive: true,
        isKycVerified: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        role: 'user',
        totalSpent: 0,
        totalOTPs: 0,
        numbersUsed: 0
      });
      
      // Create wallet document
      await this.db.collection('wallets').doc(user.uid).set({
        userId: user.uid,
        balance: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        transactions: []
      });
      
      console.log("User document created");
      return { success: true, user };
      
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "Signup failed. Please try again.";
      
      switch(error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Email already registered. Please login.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection.";
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Logout
  async logout() {
    try {
      await this.auth.signOut();
      console.log("Logged out successfully");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Get user IP
  async getIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// DOM Ready for Login Page
document.addEventListener('DOMContentLoaded', function() {
  // Login Form Handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('rememberMe')?.checked || false;
      
      if (!email || !password) {
        showError("Please fill all fields");
        return;
      }
      
      // Show loading
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      submitBtn.disabled = true;
      
      const result = await authManager.login(email, password, rememberMe);
      
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      
      if (result.success) {
        showSuccess("Login successful! Redirecting...");
        // Redirect will happen automatically via auth state listener
      } else {
        showError(result.error);
      }
    });
  }
  
  // Signup Form Handler
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Validation
      if (!fullName || !email || !phone || !password || !confirmPassword) {
        showError("Please fill all fields");
        return;
      }
      
      if (password !== confirmPassword) {
        showError("Passwords do not match!");
        return;
      }
      
      if (password.length < 6) {
        showError("Password must be at least 6 characters!");
        return;
      }
      
      // Show loading
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
      submitBtn.disabled = true;
      
      const result = await authManager.signup(fullName, email, phone, password);
      
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      
      if (result.success) {
        showSuccess("Account created successfully! Redirecting...");
        // Redirect will happen automatically via auth state listener
      } else {
        showError(result.error);
      }
    });
  }
});

// Helper functions
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.background = '#fee2e2';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.marginBottom = '15px';
    
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}

function showSuccess(message) {
  const successDiv = document.getElementById('successMessage');
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    successDiv.style.color = '#065f46';
    successDiv.style.background = '#d1fae5';
    successDiv.style.padding = '10px';
    successDiv.style.borderRadius = '5px';
    successDiv.style.marginBottom = '15px';
    
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);
  }
}
