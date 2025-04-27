// User data storage
let users = [
    // Default test user
    {
        username: 'p',
        password: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        birthDate: '2000-01-01'
    }
];

// Current user
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    // Get forms and elements
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    
    // Date inputs
    const birthDaySelect = document.getElementById('birth-day');
    const birthMonthSelect = document.getElementById('birth-month');
    const birthYearSelect = document.getElementById('birth-year');
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    
    // Populate date selects
    populateDateSelects();
    
    // Load users from localStorage
    loadUsers();
    
    // Set up form event listeners
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Populate date dropdown menus
function populateDateSelects() {
    const birthDaySelect = document.getElementById('birth-day');
    const birthMonthSelect = document.getElementById('birth-month');
    const birthYearSelect = document.getElementById('birth-year');
    
    // Populate days
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        birthDaySelect.appendChild(option);
    }

    // Populate months
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    for (let i = 0; i < months.length; i++) {
        const option = document.createElement('option');
        option.value = i + 1;
        option.textContent = months[i];
        birthMonthSelect.appendChild(option);
    }

    // Populate years (from current year - 100 to current year - 18)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 18; i >= currentYear - 100; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        birthYearSelect.appendChild(option);
    }
}

// Load users from localStorage
function loadUsers() {
    const storedUsers = localStorage.getItem('spaceInvadersUsers');
    if (storedUsers) {
        // Merge with default users, ensuring test user is always available
        const parsedUsers = JSON.parse(storedUsers);
        const testUserExists = parsedUsers.some(user => user.username === 'p');
        
        if (!testUserExists) {
            users = [...parsedUsers, users[0]]; // Add default test user
        } else {
            users = parsedUsers;
        }
    }
}

// Save users to localStorage
function saveUsers() {
    localStorage.setItem('spaceInvadersUsers', JSON.stringify(users));
}

// Registration form handler
function handleRegistration(e) {
    e.preventDefault();
    
    // Clear previous error messages
    clearErrors();
    
    // Get form values
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const day = document.getElementById('birth-day').value;
    const month = document.getElementById('birth-month').value;
    const year = document.getElementById('birth-year').value;
    
    // Validation
    let isValid = true;
    
    // Check if all fields are filled
    const requiredFields = [
        { id: 'username', value: username, message: 'Please enter a username' },
        { id: 'password', value: password, message: 'Please enter a password' },
        { id: 'confirm-password', value: confirmPassword, message: 'Please confirm your password' },
        { id: 'first-name', value: firstName, message: 'Please enter your first name' },
        { id: 'last-name', value: lastName, message: 'Please enter your last name' },
        { id: 'email', value: email, message: 'Please enter your email' },
        { id: 'birth-day', value: day, message: 'Please select a day' },
        { id: 'birth-month', value: month, message: 'Please select a month' },
        { id: 'birth-year', value: year, message: 'Please select a year' }
    ];
    
    for (const field of requiredFields) {
        if (!field.value) {
            showError(field.id, field.message);
            isValid = false;
        }
    }
    
    // Check if username exists
    if (username && usernameExists(username)) {
        showError('username', 'This username already exists');
        isValid = false;
    }
    
    // Validate password
    if (password && !isValidPassword(password)) {
        showError('password', 'Password must contain at least 8 characters, including numbers and letters');
        isValid = false;
    }
    
    // Check if passwords match
    if (password && confirmPassword && password !== confirmPassword) {
        showError('confirm-password', 'Passwords do not match');
        isValid = false;
    }
    
    // Validate names (no numbers)
    if (firstName && !isValidName(firstName)) {
        showError('first-name', 'First name cannot contain numbers');
        isValid = false;
    }
    
    if (lastName && !isValidName(lastName)) {
        showError('last-name', 'Last name cannot contain numbers');
        isValid = false;
    }
    
    // Validate email
    if (email && !isValidEmail(email)) {
        showError('email', 'Invalid email address');
        isValid = false;
    }
    
    if (isValid) {
        // Format day and month with leading zeros if needed
        const formattedDay = day.toString().padStart(2, '0');
        const formattedMonth = month.toString().padStart(2, '0');
        
        // Create birth date string (YYYY-MM-DD)
        const birthDate = `${year}-${formattedMonth}-${formattedDay}`;
        
        // Create new user
        const newUser = {
            username,
            password,
            firstName,
            lastName,
            email,
            birthDate
        };
        
        // Add user to array
        users.push(newUser);
        
        // Save to localStorage
        saveUsers();
        
        // Show success message
        alert('Registration completed successfully! You can now log in');
        
        // Clear the form
        document.getElementById('register-form').reset();

        
        // Navigate to login screen
        window.appFunctions.showScreen('login-screen');
    }
}

// Login form handler
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    // Hide any previous error
    errorElement.style.display = 'none';
    
    // Check if fields are empty
    if (!username || !password) {
        errorElement.textContent = 'Please enter username and password';
        errorElement.style.display = 'block';
        return;
    }
    
    // Find user
    const user = users.find(u => u.username === username);
    
    if (user && user.password === password) {
        // Success - set current user
        currentUser = user;
        
        // Clear the form
        document.getElementById('login-form').reset();
        
        // Navigate to configuration screen
        window.appFunctions.showScreen('config-screen');
    } else {
        // Show error
        errorElement.textContent = 'Invalid username or password';
        errorElement.style.display = 'block';
    }
}

// Logout handler
function handleLogout() {
    // Reset current user
    currentUser = null;
    
    // Clear game history
    clearGameHistory();
    
    // Navigate to welcome screen
    window.appFunctions.showScreen('welcome-screen');
}

// Validation helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    // At least 8 characters, contains letters and numbers
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
}

function isValidName(name) {
    const nameRegex = /^[A-Za-zא-ת\s-]+$/;
    return nameRegex.test(name);
}

function usernameExists(username) {
    return users.some(user => user.username === username);
}

// Error handling functions
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    element.parentNode.appendChild(errorDiv);
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
        if (error.id !== 'login-error') { // Don't remove login error container
            error.remove();
        }
    });
}

// Game history functions
function clearGameHistory() {
    if (currentUser) {
        localStorage.removeItem(`gameHistory_${currentUser.username}`);
    }
}

// Expose functions and variables to other modules
window.authModule = {
    currentUser,
    handleLogout,
    getCurrentUser: function() {
        return currentUser;
    }
};