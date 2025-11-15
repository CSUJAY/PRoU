// public/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // Note: The IDs are now buttons, not links (as per the new HTML)
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');
    const showRegisterButton = document.getElementById('show-register'); // Now a button
    const showLoginButton = document.getElementById('show-login');       // Now a button
    const API_URL = 'http://localhost:3000/api';

    // --- Core Functionality ---

    // Check if user is already logged in (has a token) and redirect
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Function to toggle between forms and manage the active tab styling
    const toggleForms = (show) => {
        if (show === 'register') {
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
            showRegisterButton.classList.add('active');
            showLoginButton.classList.remove('active');
        } else {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            showRegisterButton.classList.remove('active');
            showLoginButton.classList.add('active');
        }
        authMessage.textContent = ''; // Clear message on toggle
    };

    // Initialize: Ensure the register form is the default one shown
    // The initial HTML already sets the "Sign Up" button as active
    toggleForms('register'); 


    // --- Event Listeners for Tabs ---

    showRegisterButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleForms('register');
    });

    showLoginButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleForms('login');
    });

    // --- Handle Registration ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authMessage.textContent = '';

        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                authMessage.textContent = 'Registration successful! Please sign in.';
                authMessage.style.color = 'white'; // Success color for dark theme
                toggleForms('login'); // Switch to sign in form
            } else {
                authMessage.textContent = data.message || 'Registration failed.';
                authMessage.style.color = '#dc3545'; // Error color (Red)
            }
        } catch (error) {
            authMessage.textContent = 'Network error. Could not connect to the API.';
            authMessage.style.color = '#dc3545';
            console.error(error);
        }
    });

    // --- Handle Login ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authMessage.textContent = '';

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // SUCCESS! Store JWT and redirect
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user_id);
                window.location.href = 'dashboard.html';
            } else {
                authMessage.textContent = data.message || 'Sign in failed. Invalid credentials.';
                authMessage.style.color = '#dc3545'; // Error color (Red)
            }
        } catch (error) {
            authMessage.textContent = 'Network error. Could not connect to the API.';
            authMessage.style.color = '#dc3545';
            console.error(error);
        }
    });
});