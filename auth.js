// Authentication Functions - SIMPLIFIED
class AuthManager {
  constructor() {
    this.auth = firebase.auth();
    this.db = firebase.firestore();
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
      
      console.log("Login successful! User UID:", user.uid);
      
      // Create user document if not exists
      const userDoc = await this.db.collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        await this.db.collection('users').doc(user.uid).set({
          uid: user.uid,
          email: email,
          fullName: email.split('@')[0],
          walletBalance: 0,
          isActive: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Update last login
        await this.db.collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return { success: true, user: user };
      
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  // User Signup
  async signup(fullName, email, phone, password) {
    try {
      console.log("Signup attempt:", email);
      
      // Create user
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log("User created! UID:", user.uid);
      
      // Create user document
      await this.db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: email,
        fullName: fullName,
        phone: phone,
        walletBalance: 0,
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log("User document created");
      return { success: true, user: user };
      
    } catch (error) {
      console.error("Signup error:", error);
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  // Get error message
  getErrorMessage(error) {
    switch(error.code) {
      case 'auth/email-already-in-use':
        return "Email already registered. Please login.";
      case 'auth/invalid-email':
        return "Invalid email address.";
      case 'auth/user-not-found':
        return "No account found with this email.";
      case 'auth/wrong-password':
        return "Incorrect password.";
      case 'auth/weak-password':
        return "Password should be at least 6 characters.";
      case 'auth/network-request-failed':
        return "Network error. Please check your connection.";
      default:
        return error.message;
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
}

// Initialize Auth Manager
const authManager = new AuthManager();

// Handle Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    if (!email || !password) {
      showError("Please fill all fields");
      return;
    }
    
    // Show loading
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;
    
    const result = await authManager.login(email, password, rememberMe);
    
    // Reset button
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (result.success) {
      showSuccess("Login successful! Redirecting...");
      // Auto-redirect will happen via firebase-config.js
    } else {
      showError(result.error);
    }
  });
}

// Handle Signup Form
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
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
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;
    
    const result = await authManager.signup(fullName, email, phone, password);
    
    // Reset button
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (result.success) {
      showSuccess("Account created successfully! Redirecting...");
      // Auto-redirect will happen via firebase-config.js
    } else {
      showError(result.error);
    }
  });
}

// Helper functions
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
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
    
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);
  }
}
