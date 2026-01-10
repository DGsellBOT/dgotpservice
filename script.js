// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Auth Modal
const loginBtn = document.querySelector('.btn-login');
const signupBtn = document.querySelector('.btn-signup');
const authModal = document.getElementById('authModal');
const closeModal = document.querySelector('.close-modal');
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');

// Open modal on login/signup click
[loginBtn, signupBtn].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            authModal.style.display = 'flex';
        });
    }
});

// Close modal
if (closeModal) {
    closeModal.addEventListener('click', () => {
        authModal.style.display = 'none';
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
    }
});

// Tab switching in modal
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs and forms
        tabBtns.forEach(b => b.classList.remove('active'));
        authForms.forEach(form => form.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding form
        btn.classList.add('active');
        const tabName = btn.getAttribute('data-tab');
        document.getElementById(`${tabName}Form`).classList.add('active');
    });
});

// Form submission
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;
        
        // Simulate API call
        console.log('Login attempt:', { email, password });
        alert('Login functionality will be connected to backend!');
        authModal.style.display = 'none';
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = signupForm.querySelector('input[type="text"]').value;
        const email = signupForm.querySelector('input[type="email"]').value;
        const password = signupForm.querySelector('input[type="password"]').value;
        
        // Simulate API call
        console.log('Signup attempt:', { name, email, password });
        alert('Account created! (Backend integration needed)');
        authModal.style.display = 'none';
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        if (this.getAttribute('href') === '#') return;
        
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offset = 80;
                const targetPosition = targetElement.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Dashboard simulation (for dashboard.html)
if (window.location.pathname.includes('dashboard.html')) {
    // Simulate user data
    const userData = {
        name: "John Doe",
        balance: "₹1,250.00",
        apiKey: "sms_prov_sk_live_1234567890abcdef",
        recentOTPs: [
            { service: "WhatsApp", number: "+91 98765XXXXX", otp: "123456", time: "2 min ago" },
            { service: "Google", number: "+1 23456XXXXX", otp: "789012", time: "5 min ago" },
            { service: "Telegram", number: "+44 12345XXXXX", otp: "345678", time: "10 min ago" }
        ]
    };
    
    // Populate dashboard data
    document.addEventListener('DOMContentLoaded', () => {
        const welcomeElement = document.querySelector('.welcome-message');
        const balanceElement = document.querySelector('.balance-amount');
        const apiKeyElement = document.querySelector('.api-key-value');
        const otpListElement = document.querySelector('.otp-list');
        
        if (welcomeElement) {
            welcomeElement.innerHTML = `Welcome, <strong>${userData.name}</strong>`;
        }
        
        if (balanceElement) {
            balanceElement.textContent = userData.balance;
        }
        
        if (apiKeyElement) {
            apiKeyElement.textContent = userData.apiKey;
        }
        
        if (otpListElement && userData.recentOTPs) {
            otpListElement.innerHTML = userData.recentOTPs.map(otp => `
                <div class="otp-item">
                    <div class="otp-service">${otp.service}</div>
                    <div class="otp-number">${otp.number}</div>
                    <div class="otp-code">${otp.otp}</div>
                    <div class="otp-time">${otp.time}</div>
                </div>
            `).join('');
        }
        
        // Copy API Key functionality
        const copyApiKeyBtn = document.querySelector('.copy-api-key');
        if (copyApiKeyBtn) {
            copyApiKeyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(userData.apiKey)
                    .then(() => {
                        const originalText = copyApiKeyBtn.innerHTML;
                        copyApiKeyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyApiKeyBtn.innerHTML = originalText;
                        }, 2000);
                    });
            });
        }
    });
}

// API Documentation page functionality
if (window.location.pathname.includes('api.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            // Add copy button to code blocks
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-code-btn';
            copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(block.textContent)
                    .then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
                        }, 2000);
                    });
            });
            block.parentNode.insertBefore(copyBtn, block);
        });
    });
}
