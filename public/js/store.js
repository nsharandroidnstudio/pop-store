document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
});

function fetchProducts() {
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(products => {
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            document.getElementById('products').innerHTML = '<p style="width: 100%; text-align: center;">Failed to load products.</p>';
        });
}

function displayProducts(products) {
    const productsDiv = document.getElementById('products');
    productsDiv.innerHTML = '';
    if (products.length === 0) {
        productsDiv.innerHTML = '<p style="width: 100%; text-align: center;">No products found.</p>';
        return;
    }
    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';

        // Convert price to number if it is a string
        const price = !isNaN(product.price) ? parseFloat(product.price).toFixed(2) : 'N/A';
        console.log('Product price:', price); // Log the product price

        productDiv.innerHTML = `
            <img src="/images/${product.image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <div class="price">$${price}</div>
            <button class="icon-button" onclick="checkAuthAndAddToCart('${product.title}')">
                <i class="fa fa-cart-plus"></i>
                Add to Cart
            </button>
        `;
        productsDiv.appendChild(productDiv);
    });
}

function searchProducts() {
    const query = document.getElementById('search').value;
    fetch(`/api/products/search?query=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(products => {
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error searching products:', error);
            document.getElementById('products').innerHTML = '<p style="width: 100%; text-align: center;">Failed to search products.</p>';
        });
}

function checkAuthAndAddToCart(title) {
    fetch('/api/check', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include' // Ensure cookies are included in the request
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        if (data.isAuthenticated) {
            addToCart(title);
        } else {
            alert('You must login to buy products');
            window.location.href = 'login.html'; // Redirect to the login page if not authenticated
        }
    })
    .catch(error => {
        console.error('Error checking authentication:', error);
        alert('You must login to buy products');
        window.location.href = 'login.html';
    });
}

function addToCart(title) {
    fetch('/api/cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title }),
        credentials: 'include' // Ensure cookies are included in the request
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log('Product added to cart:', data);
        alert('Product added to cart successfully');
        // Update cart display or count here
    })
    .catch(error => {
        console.error('Error adding to cart:', error);
        alert('Failed to add product to cart');
    });
}

function checkAuthAndRedirectToCart() {
    fetch('/api/check', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include' // Ensure cookies are included in the request
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        if (data.isAuthenticated) {
            window.location.href = '/cart'; // Redirect to the cart page if authenticated
        } else {
            alert('You must login to view the cart');
            window.location.href = 'login.html'; // Redirect to the login page if not authenticated
        }
    })
    .catch(error => {
        console.error('Error checking authentication:', error);
        alert('You must login to view the cart');
        window.location.href = 'login.html';
    });
}
