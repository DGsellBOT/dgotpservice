// Dashboard Manager
class DashboardManager {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
        this.userData = null;
    }

    // Initialize dashboard
    async init() {
        this.currentUser = this.auth.currentUser;
        
        if (!this.currentUser) {
            window.location.href = "login.html";
            return;
        }

        await this.loadUserData();
        this.updateUI();
        this.loadActivities();
        
        // Set current date
        const now = new Date();
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Load user data from Firestore
    async loadUserData() {
        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            const walletDoc = await this.db.collection('wallets').doc(this.currentUser.uid).get();
            
            this.userData = userDoc.exists ? userDoc.data() : {};
            this.walletData = walletDoc.exists ? walletDoc.data() : { balance: 0 };
            
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }

    // Update UI with user data
    updateUI() {
        if (!this.userData) return;

        // Update name
        const name = this.userData.fullName || 'User';
        document.getElementById('userName').textContent = name;
        document.getElementById('topUserName').textContent = name;
        document.getElementById('profileName').textContent = name;
        
        // Avatar
        const avatarLetter = name.charAt(0).toUpperCase();
        document.getElementById('userAvatar').textContent = avatarLetter;
        document.getElementById('profileAvatar').textContent = avatarLetter;
        
        // Email
        const email = this.userData.email || this.currentUser.email;
        document.getElementById('userEmail').textContent = email;
        document.getElementById('profileEmail').textContent = email;
        
        // Phone
        document.getElementById('profilePhone').textContent = this.userData.phone || 'Not set';
        
        // Wallet balance
        const balance = this.walletData.balance || 0;
        document.getElementById('walletBalance').textContent = balance.toLocaleString();
        document.getElementById('balanceAmount').textContent = `₹${balance.toLocaleString()}`;
        document.getElementById('currentBalance').textContent = `₹${balance.toLocaleString()}`;
        
        // Stats
        document.getElementById('totalOtps').textContent = this.userData.totalOTPs || 0;
        document.getElementById('numbersUsed').textContent = this.userData.numbersUsed || 0;
        document.getElementById('successRate').textContent = this.userData.successRate || '0%';
        
        // User ID
        document.getElementById('profileUid').textContent = this.currentUser.uid;
        
        // Joined date
        if (this.userData.createdAt) {
            const date = this.userData.createdAt.toDate();
            document.getElementById('profileJoined').textContent = date.toLocaleDateString();
        }
    }

    // Load recent activities
    async loadActivities() {
        try {
            const activitiesRef = this.db.collection('activity_logs')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('timestamp', 'desc')
                .limit(10);
            
            const snapshot = await activitiesRef.get();
            const activityList = document.getElementById('activityList');
            
            if (snapshot.empty) {
                activityList.innerHTML = '<p>No activities found</p>';
                return;
            }
            
            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const time = data.timestamp ? data.timestamp.toDate().toLocaleTimeString() : 'Just now';
                
                html += `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-circle"></i>
                        </div>
                        <div class="activity-content">
                            <p>${data.details}</p>
                            <span class="activity-time">${time}</span>
                        </div>
                    </div>
                `;
            });
            
            activityList.innerHTML = html;
            
        } catch (error) {
            console.error("Error loading activities:", error);
        }
    }

    // Add funds
    async addFunds(amount, paymentMethod, utrNumber = null) {
        try {
            const paymentData = {
                userId: this.currentUser.uid,
                amount: parseFloat(amount),
                paymentMethod: paymentMethod,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                utrNumber: utrNumber
            };

            // Add payment record
            const paymentRef = await this.db.collection('payments').add(paymentData);
            
            // Log activity
            await this.db.collection('activity_logs').add({
                userId: this.currentUser.uid,
                action: 'payment',
                details: `Payment of ₹${amount} initiated via ${paymentMethod}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                paymentId: paymentRef.id,
                message: 'Payment initiated. Admin will verify and add funds.'
            };

        } catch (error) {
            console.error("Add funds error:", error);
            return { success: false, error: error.message };
        }
    }

    // Place new order
    async placeOrder(service, country, duration) {
        try {
            const price = this.calculatePrice(duration);
            const balance = this.walletData.balance || 0;

            if (balance < price) {
                return { success: false, error: 'Insufficient balance. Please add funds.' };
            }

            // Deduct from wallet
            const newBalance = balance - price;
            await this.db.collection('wallets').doc(this.currentUser.uid).update({
                balance: newBalance
            });

            // Create order
            const orderData = {
                userId: this.currentUser.uid,
                service: service,
                country: country,
                duration: parseInt(duration),
                price: price,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                expiresAt: new Date(Date.now() + parseInt(duration) * 60000)
            };

            const orderRef = await this.db.collection('orders').add(orderData);

            // Update user stats
            await this.db.collection('users').doc(this.currentUser.uid).update({
                totalSpent: firebase.firestore.FieldValue.increment(price),
                totalOTPs: firebase.firestore.FieldValue.increment(1)
            });

            // Log activity
            await this.db.collection('activity_logs').add({
                userId: this.currentUser.uid,
                action: 'order',
                details: `New order placed for ${service} (${country}) - ₹${price}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                orderId: orderRef.id,
                message: 'Order placed successfully!'
            };

        } catch (error) {
            console.error("Place order error:", error);
            return { success: false, error: error.message };
        }
    }

    // Calculate price based on duration
    calculatePrice(duration) {
        const prices = {
            '5': 5,
            '10': 8,
            '30': 15,
            '60': 25
        };
        return prices[duration] || 5;
    }

    // Logout
    logout() {
        authManager.logout();
    }
}

// Initialize Dashboard
const dashboardManager = new DashboardManager();

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    dashboardManager.init();
    
    // Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Top Menu Dropdown
    const topMenuBtn = document.getElementById('topMenuBtn');
    const topMenuDropdown = document.getElementById('topMenuDropdown');
    
    if (topMenuBtn) {
        topMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            topMenuDropdown.classList.toggle('show');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        if (topMenuDropdown) {
            topMenuDropdown.classList.remove('show');
        }
    });
    
    // Logout buttons
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutTopBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            dashboardManager.logout();
        });
    });
    
    // Order duration price update
    const orderDuration = document.getElementById('orderDuration');
    if (orderDuration) {
        orderDuration.addEventListener('change', updateOrderPrice);
    }
    
    // Payment method change
    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', updatePaymentSection);
    }
});

// Modal Functions
function openAddFundModal() {
    document.getElementById('addFundModal').classList.add('show');
    updatePaymentSection();
}

function closeAddFundModal() {
    document.getElementById('addFundModal').classList.remove('show');
}

function openNewOrderModal() {
    document.getElementById('newOrderModal').classList.add('show');
    updateOrderPrice();
}

function closeNewOrderModal() {
    document.getElementById('newOrderModal').classList.remove('show');
}

function openProfileModal() {
    document.getElementById('profileModal').classList.add('show');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('show');
}

// Update order price based on duration
function updateOrderPrice() {
    const durationSelect = document.getElementById('orderDuration');
    const priceDisplay = document.getElementById('orderPrice');
    
    if (durationSelect && priceDisplay) {
        const duration = durationSelect.value;
        const price = dashboardManager.calculatePrice(duration);
        priceDisplay.textContent = `₹${price}`;
    }
}

// Update payment section based on method
function updatePaymentSection() {
    const method = document.getElementById('paymentMethod').value;
    
    // Hide all sections
    document.querySelectorAll('.payment-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(`${method}Section`).style.display = 'block';
}

// Submit payment
async function submitPayment() {
    const amount = document.getElementById('fundAmount').value;
    const method = document.getElementById('paymentMethod').value;
    const utrNumber = document.getElementById('utrNumber')?.value || null;
    
    if (!amount || amount < 100) {
        alert('Minimum amount is ₹100');
        return;
    }
    
    const result = await dashboardManager.addFunds(amount, method, utrNumber);
    
    if (result.success) {
        alert('Payment submitted! Admin will verify and add funds.');
        closeAddFundModal();
        
        // Reload user data
        await dashboardManager.loadUserData();
        dashboardManager.updateUI();
    } else {
        alert('Error: ' + result.error);
    }
}

// Place order
async function placeOrder() {
    const service = document.getElementById('orderService').value;
    const country = document.getElementById('orderCountry').value;
    const duration = document.getElementById('orderDuration').value;
    
    const result = await dashboardManager.placeOrder(service, country, duration);
    
    if (result.success) {
        alert('Order placed successfully!');
        closeNewOrderModal();
        
        // Reload user data
        await dashboardManager.loadUserData();
        dashboardManager.updateUI();
    } else {
        alert('Error: ' + result.error);
    }
}

// Logout function
function logout() {
    dashboardManager.logout();
}
