// Authentication Functions
class AuthManager {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.ADMIN_UID = "PKSeq0uhBQcJwEjYCW085jtV24e2";
    }

    // Check if user is logged in
    checkAuthState() {
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                // User is logged in
                console.log("User logged in:", user.uid);
                
                // Check if user is admin
                if (user.uid === this.ADMIN_UID) {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "dashboard.html";
                }
            } else {
                // User is logged out
                console.log("User logged out");
            }
        });
    }

    // User Login
    async login(email, password, rememberMe = false) {
        try {
            // Set persistence
            const persistence = rememberMe ? 
                firebase.auth.Auth.Persistence.LOCAL : 
                firebase.auth.Auth.Persistence.SESSION;
            
            await this.auth.setPersistence(persistence);
            
            // Sign in
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update last login
            await this.db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginIP: await this.getIP()
            });
            
            // Log login activity
            await this.logActivity(user.uid, 'login', 'User logged in');
            
            return { success: true, user };
            
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, error: error.message };
        }
    }

    // User Signup
    async signup(fullName, email, phone, password) {
        try {
            // Create user
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
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
                lastLoginIP: await this.getIP(),
                role: 'user',
                totalSpent: 0,
                totalOTPs: 0
            });
            
            // Create wallet document
            await this.db.collection('wallets').doc(user.uid).set({
                userId: user.uid,
                balance: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                transactions: []
            });
            
            // Log activity
            await this.logActivity(user.uid, 'signup', 'New user registered');
            
            // Send welcome email (you can implement this)
            
            return { success: true, user };
            
        } catch (error) {
            console.error("Signup error:", error);
            return { success: false, error: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            const user = this.auth.currentUser;
            if (user) {
                await this.logActivity(user.uid, 'logout', 'User logged out');
            }
            await this.auth.signOut();
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

    // Log activity
    async logActivity(userId, action, details) {
        try {
            await this.db.collection('activity_logs').add({
                userId: userId,
                action: action,
                details: details,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ip: await this.getIP(),
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error("Activity log error:", error);
        }
    }

    // Check if user is admin
    isAdmin(userId) {
        return userId === this.ADMIN_UID;
    }

    // Get current user data
    async getUserData(uid) {
        try {
            const doc = await this.db.collection('users').doc(uid).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error("Get user data error:", error);
            return null;
        }
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Check auth state on page load
    authManager.checkAuthState();
    
    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe')?.checked || false;
            
            const result = await authManager.login(email, password, rememberMe);
            
            if (result.success) {
                // Redirect handled by auth state change
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
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validation
            if (password !== confirmPassword) {
                showError("Passwords do not match!");
                return;
            }
            
            if (password.length < 8) {
                showError("Password must be at least 8 characters!");
                return;
            }
            
            const result = await authManager.signup(fullName, email, phone, password);
            
            if (result.success) {
                showSuccess("Account created successfully! Redirecting...");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);
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
        
        // Hide after 5 seconds
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
        
        // Hide after 3 seconds
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}
