document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, rememberMe }),
            credentials: 'include' // This is important for including cookies
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                // Store token in localStorage
                localStorage.setItem('token', data.token);
                document.cookie = `token=${data.token}; path=/; max-age=${rememberMe ? 864000 : 1800}; SameSite=Strict`;

                // Clear user's cart after login
                fetch('/api/cart/clear', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${data.token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                })
                .then(cartResponse => cartResponse.json())
                .then(cartData => {
                    if (cartData.success) {
                        alert('Login successful!');
                        window.location.href = 'store.html'; // Redirect to store page
                    } else {
                        alert('Login successful');
                    }
                })
                .catch(cartError => {
                    console.error('Error clearing cart:', cartError);
                    alert('Login successful');
                });
            } else {
                alert('Login failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        });
    });
});
