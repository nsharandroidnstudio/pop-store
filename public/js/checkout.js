document.addEventListener('DOMContentLoaded', function() {
    loadCheckoutItems();

    const paymentForm = document.getElementById('paymentForm');
    paymentForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        // Get checkout items from local storage
        const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');

        // Fetch authenticated user details
        fetch('/api/check', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Please login again.');
            }
            return response.json();
        })
        .then(data => {
            // Send purchase data to server
            fetch('/api/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: data.username, purchase: checkoutItems })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                alert('Purchase successful');
                clearCart(); // Assume you have a function to clear the cart
            })
            .catch(error => {
                alert('Purchase failed, please login again.');
            });
        })
        .catch(error => {
            alert('Authentication failed: ' + error.message);
        });
    });
});

function loadCheckoutItems() {
    const orderItemsDiv = document.getElementById('orderItems');
    const totalPriceDiv = document.getElementById('totalPrice');
    const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');

    let total = 0;
    const consolidatedItems = {};

    if (checkoutItems.length === 0) {
        orderItemsDiv.innerHTML = '<tr><td colspan="4" style="text-align: center;">Your order is empty.</td></tr>';
        return;
    }

    // Consolidate items
    checkoutItems.forEach(item => {
        if (consolidatedItems[item.title]) {
            consolidatedItems[item.title].quantity += 1;
        } else {
            consolidatedItems[item.title] = {
                ...item,
                quantity: 1
            };
        }
    });

    Object.values(consolidatedItems).forEach(item => {
        const price = parseFloat(item.price);
        const quantity = item.quantity;
        const totalItemPrice = price * quantity;
        total += totalItemPrice;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><i class="fas fa-box product-icon"></i> ${item.title}</td>
            <td>$${price.toFixed(2)}</td>
            <td>${quantity}</td>
            <td>$${totalItemPrice.toFixed(2)}</td>
        `;
        orderItemsDiv.appendChild(row);
    });

    totalPriceDiv.textContent = `$${total.toFixed(2)}`;
}

function clearCart() {
    localStorage.removeItem('checkoutItems');
    document.getElementById('orderItems').innerHTML = '<tr><td colspan="4" style="text-align: center;">Your order is empty.</td></tr>';
    document.getElementById('totalPrice').textContent = '$0.00';
}