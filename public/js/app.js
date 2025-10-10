// API Configuration
const API_BASE_URL = window.location.origin;
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const signupContainer = document.getElementById('signupContainer');
const dashboardContainer = document.getElementById('dashboardContainer');

// Login Form
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('email');
const loginPassword = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

// Signup Form
const signupForm = document.getElementById('signupForm');
const signupPassword = document.getElementById('signupPassword');
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
const passwordStrength = document.getElementById('passwordStrength');
const strengthFill = document.getElementById('strengthFill');
const strengthText = document.getElementById('strengthText');

// Navigation
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const logoutBtn = document.getElementById('logoutBtn');

// Dashboard Elements
const userName = document.getElementById('userName');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileRole = document.getElementById('profileRole');
const rolesInfo = document.getElementById('rolesInfo');
const auditLogs = document.getElementById('auditLogs');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

// Check if user is already authenticated
function checkAuthStatus() {
    if (accessToken) {
        verifyToken();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    togglePassword.addEventListener('click', () => togglePasswordVisibility(loginPassword, togglePassword));
    
    // Signup form
    signupForm.addEventListener('submit', handleSignup);
    toggleSignupPassword.addEventListener('click', () => togglePasswordVisibility(signupPassword, toggleSignupPassword));
    signupPassword.addEventListener('input', checkPasswordStrength);
    
    // Navigation
    switchToSignup.addEventListener('click', () => showSignup());
    switchToLogin.addEventListener('click', () => showLogin());
    logoutBtn.addEventListener('click', handleLogout);
}

// Show Login Form
function showLogin() {
    loginContainer.classList.remove('hidden');
    signupContainer.classList.add('hidden');
    dashboardContainer.classList.add('hidden');
    clearFormErrors('loginForm');
}

// Show Signup Form
function showSignup() {
    signupContainer.classList.remove('hidden');
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.add('hidden');
    clearFormErrors('signupForm');
}

// Show Dashboard
function showDashboard() {
    dashboardContainer.classList.remove('hidden');
    loginContainer.classList.add('hidden');
    signupContainer.classList.add('hidden');
    loadDashboardData();
}

// Toggle Password Visibility
function togglePasswordVisibility(input, button) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    button.querySelector('i').classList.toggle('fa-eye');
    button.querySelector('i').classList.toggle('fa-eye-slash');
}

// Password Strength Checker
function checkPasswordStrength() {
    const password = signupPassword.value;
    let strength = 0;
    let strengthLabel = '';

    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;

    strengthFill.classList.remove('weak', 'medium', 'strong');
    
    if (strength === 0) {
        strengthLabel = '';
    } else if (strength <= 2) {
        strengthFill.classList.add('weak');
        strengthLabel = 'Weak';
        strengthText.style.color = '#f56565';
    } else if (strength === 3) {
        strengthFill.classList.add('medium');
        strengthLabel = 'Medium';
        strengthText.style.color = '#ed8936';
    } else {
        strengthFill.classList.add('strong');
        strengthLabel = 'Strong';
        strengthText.style.color = '#48bb78';
    }

    strengthText.textContent = strengthLabel || 'Password strength';
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    clearFormErrors('loginForm');

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!validateEmail(email)) {
        showFieldError('emailError', 'Oops! Please enter a valid work email address');
        return;
    }

    if (!password) {
        showFieldError('passwordError', 'Oops! Your account password is required');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.data) {
            accessToken = data.data.token || data.data.accessToken;
            refreshToken = data.data.refreshToken;
            
            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            showNotification('Sign in successful! Welcome back.', 'success');
            setTimeout(() => {
                showDashboard();
            }, 1000);
        } else {
            showFieldError('passwordError', data.message || 'Oops! Your credentials don\'t match our records');
        }
    } catch (error) {
        showFieldError('passwordError', 'Oops! Something went wrong. Please try again.');
        console.error('Login error:', error);
    }
}

// Handle Signup
async function handleSignup(e) {
    e.preventDefault();
    clearFormErrors('signupForm');

    const firstName = document.getElementById('signupFirstName').value.trim();
    const lastName = document.getElementById('signupLastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = signupPassword.value;

    // Validation
    if (!firstName) {
        showFieldError('firstNameError', 'Oops! Please enter your full name');
        return;
    }

    if (!lastName) {
        showFieldError('lastNameError', 'Oops! Please enter your last name');
        return;
    }

    if (!validateEmail(email)) {
        showFieldError('signupEmailError', 'Oops! Please enter a valid personal email address');
        return;
    }

    if (password.length < 8) {
        showFieldError('signupPasswordError', 'Oops! Your secret passcode must be at least 8 characters');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstName, lastName, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Account created successfully! Please check your email for verification.', 'success');
            setTimeout(() => {
                showLogin();
            }, 2000);
        } else {
            showFieldError('signupEmailError', data.message || 'Oops! Something went wrong. Please try again.');
        }
    } catch (error) {
        showFieldError('signupEmailError', 'Oops! Something went wrong. Please try again.');
        console.error('Signup error:', error);
    }
}

// Handle Logout
async function handleLogout() {
    try {
        if (accessToken) {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        accessToken = null;
        refreshToken = null;

        showNotification('Logged out successfully', 'info');
        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        showLogin();
    }
}

// Verify Token and Load Dashboard
async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            showDashboard();
        } else {
            // Try to refresh token
            if (refreshToken) {
                await refreshAccessToken();
            } else {
                throw new Error('No refresh token');
            }
        }
    } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        showLogin();
    }
}

// Refresh Access Token
async function refreshAccessToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await response.json();

        if (response.ok && data.data) {
            accessToken = data.data.accessToken;
            refreshToken = data.data.refreshToken;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            showDashboard();
        } else {
            throw new Error('Token refresh failed');
        }
    } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        showLogin();
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Load user profile
        const profileResponse = await fetch(`${API_BASE_URL}/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.data && profileData.data.user) {
                const user = profileData.data.user;
                userName.textContent = `${user.firstName} ${user.lastName}`;
                profileName.textContent = `${user.firstName} ${user.lastName}`;
                profileEmail.textContent = user.email;
                profileRole.textContent = user.roles?.[0]?.id || 'user';
            }
        }

        // Load roles (if admin)
        try {
            const rolesResponse = await fetch(`${API_BASE_URL}/roles`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (rolesResponse.ok) {
                const rolesData = await rolesResponse.json();
                if (rolesData.data && rolesData.data.length > 0) {
                    const rolesHtml = rolesData.data.map(role => 
                        `<p><strong>${role.id}:</strong> ${role.description || 'No description'}</p>`
                    ).join('');
                    rolesInfo.innerHTML = rolesHtml;
                } else {
                    rolesInfo.innerHTML = '<p>No roles available</p>';
                }
            }
        } catch (error) {
            rolesInfo.innerHTML = '<p>Unable to load roles</p>';
        }

        // Load audit logs (placeholder - would need backend endpoint)
        auditLogs.innerHTML = '<p>Audit logs feature coming soon</p>';
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Utility Functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
        error.textContent = '';
    });
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

