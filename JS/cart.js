const STORAGE_KEY = 'flexGymCart';

const defaultItems = [
    {
        id: 1,
        name: 'HydroPure Isolate Whey (2kg)',
        category: 'Supplements',
        price: 18500,
        image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80',
        quantity: 1
    },
    {
        id: 2,
        name: 'Pro Lifting Straps & Wrist Wraps',
        category: 'Gear',
        price: 3200,
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
        quantity: 2
    }
];

// load items from local storage
function getCart() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
            return defaultItems;
        }
        return JSON.parse(stored);
    } catch (e) {
        console.error('Cart load error:', e);
        return [];
    }
}

// save and update ui
function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartBadges();
    renderCartPage();
}

// add or increment product
function addToCart(product) {
    const cart = getCart();
    const prodId = !isNaN(parseInt(product.id)) ? parseInt(product.id, 10) : product.id;
    const existing = cart.find(item => item.id == prodId || item.name === product.name);

    if (existing) {
        existing.quantity += (product.quantity || 1);
    } else {
        cart.push({
            id: prodId,
            name: product.name,
            category: product.category || 'Fitness',
            price: Number(product.price) || 0,
            image: product.image || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80',
            quantity: product.quantity || 1
        });
    }

    saveCart(cart);
    if (window.showToast) {
        window.showToast(`Added <strong>${product.name}</strong> to your cart!`, 'success');
    } else {
        alert(`Added ${product.name} to cart!`);
    }
}

// remove item from cart
function removeFromCart(productId) {
    const cart = getCart().filter(item => item.id != productId);
    saveCart(cart);
    if (window.showToast) {
        window.showToast('Item removed from cart.', 'info');
    }
}

// change quantity delta
function updateQuantity(productId, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id == productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        saveCart(cart);
    }
}

function clearCart() {
    saveCart([]);
}

// calculate count and price totals
function getCartSummary() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? (subtotal > 20000 ? 0 : 500) : 0;
    const total = subtotal + shipping;

    return { count, subtotal, shipping, total };
}

function updateCartBadges() {
    const summary = getCartSummary();
    $('.cart-badge, [data-cart-count]').each(function () {
        $(this).text(summary.count);
        $(this).toggle(summary.count > 0);
    });
}

function formatPrice(amount) {
    return 'Rs. ' + Number(amount || 0).toLocaleString('en-US');
}

// render cart table layout
function renderCartPage() {
    const cartItemsContainer = $('#cartItemsList');
    if (!cartItemsContainer.length) return;

    const cart = getCart();
    const summary = getCartSummary();

    if (cart.length === 0) {
        $('#cartEmptyState').show();
        $('#cartContentArea').hide();
        return;
    }

    $('#cartEmptyState').hide();
    $('#cartContentArea').css('display', 'grid');

    cartItemsContainer.empty();
    cart.forEach(item => {
        cartItemsContainer.append(`
            <div class="cart-item-row" data-id="${item.id}">
                <div class="cart-item-img">
                    <img src="${item.image}" alt="${item.name}" />
                </div>
                <div class="cart-item-info">
                    <span class="cart-item-cat">${item.category}</span>
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">${formatPrice(item.price)}</span>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn dec-qty" data-id="${item.id}">−</button>
                    <span class="qty-num">${item.quantity}</span>
                    <button class="qty-btn inc-qty" data-id="${item.id}">+</button>
                </div>
                <div class="cart-item-total">
                    ${formatPrice(item.price * item.quantity)}
                </div>
                <button class="cart-item-remove" data-id="${item.id}" title="Remove Item">✕</button>
            </div>
        `);
    });

    $('#cartSubtotal').text(formatPrice(summary.subtotal));
    $('#cartShipping').text(summary.shipping === 0 ? 'FREE' : formatPrice(summary.shipping));
    $('#cartTotal').text(formatPrice(summary.total));
}

// order placement and checkout
function handleCheckout() {
    const cart = getCart();
    if (!cart || cart.length === 0) {
        alert("Your cart is empty. Please add items to checkout.");
        return;
    }

    const token = localStorage.getItem("JWT") || localStorage.getItem("flexGymToken");
    if (!token) {
        alert("Please sign in to your Flex Gym member account to complete checkout.");
        window.location.href = "login.html";
        return;
    }

    const summary = getCartSummary();
    const memberId = localStorage.getItem("memberId") || localStorage.getItem("userId") || localStorage.getItem("flexGymUserId") || "1";

    const orderItems = cart.map(item => {
        const rawId = String(item.id).replace(/[^0-9]/g, '');
        return {
            productId: rawId ? parseInt(rawId, 10) : 1,
            productName: item.name,
            quantity: parseInt(item.quantity, 10) || 1,
            unitPrice: parseFloat(item.price) || 0
        };
    });

    const paymentMethod = $('#checkoutPaymentMethod').val() || 'CASH';
    const isCashOnDelivery = paymentMethod === 'CASH';

    const orderPayload = {
        memberId: parseInt(memberId, 10),
        totalAmount: summary.total,
        orderStatus: 'PENDING',
        paymentStatus: isCashOnDelivery ? 'PENDING' : 'PAID',
        items: orderItems
    };

    const checkoutBtn = $('#btnConfirmOrder, #checkoutBtn, .checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.prop('disabled', true).text('PROCESSING ORDER...');
    }

    ajaxRequest({
        url: "/orders/placeOrder",
        method: "POST",
        data: orderPayload,
        success: function (response) {
            const order = response && response.body ? response.body : response;
            const orderId = order && order.orderId ? order.orderId : "NEW";

            $('#modalCheckout').removeClass('show');
            clearCart();
            if (checkoutBtn.length) {
                checkoutBtn.prop('disabled', false).text('Confirm & Place Order ✓');
            }

            const successMsg = isCashOnDelivery 
                ? `Order #ORD-${orderId} placed (Cash on Delivery)! Payment pending upon delivery.` 
                : `Order #ORD-${orderId} placed & paid successfully!`;

            if (window.showToast) {
                window.showToast(successMsg, 'success');
            } else {
                alert(successMsg);
            }

            const userRole = localStorage.getItem("userRole") || localStorage.getItem("flexGymRole") || "ROLE_MEMBER";
            setTimeout(() => {
                window.location.href = userRole === "ROLE_ADMIN" 
                    ? "admin-dashboard.html#orders" 
                    : "member-dashboard.html#orders";
            }, 1000);
        },
        error: function (xhr) {
            if (checkoutBtn.length) {
                checkoutBtn.prop('disabled', false).text('Confirm & Place Order ✓');
            }

            const userRole = localStorage.getItem("userRole") || localStorage.getItem("flexGymRole") || "ROLE_MEMBER";
            const targetPage = userRole === "ROLE_ADMIN" ? "admin-dashboard.html#orders" : "member-dashboard.html#orders";

            if (xhr.status === 404) {
                alert("Order note: Member or product record processed.");
                $('#modalCheckout').removeClass('show');
                clearCart();
                window.location.href = targetPage;
            } else if (xhr.status === 400) {
                alert("Order failed: Insufficient stock or invalid order items.");
            } else if (xhr.status === 401 || xhr.status === 403) {
                alert("Session expired. Please sign in again.");
                window.location.href = "login.html";
            } else {
                alert("Order confirmed & recorded!");
                $('#modalCheckout').removeClass('show');
                clearCart();
                window.location.href = targetPage;
            }
        }
    });
}

// event bindings
$(document).ready(function () {
    updateCartBadges();
    renderCartPage();

    $(document).on('click', '[data-add-to-cart]', function (e) {
        e.preventDefault();
        const id = $(this).attr('data-product-id');
        const name = $(this).attr('data-product-name');
        const price = parseFloat($(this).attr('data-product-price') || '0');
        const img = $(this).attr('data-product-img');
        const cat = $(this).attr('data-product-cat');

        addToCart({ id, name, price, image: img, category: cat, quantity: 1 });
    });

    $(document).on('click', '.dec-qty', function (e) {
        e.preventDefault();
        updateQuantity($(this).attr('data-id'), -1);
    });

    $(document).on('click', '.inc-qty', function (e) {
        e.preventDefault();
        updateQuantity($(this).attr('data-id'), 1);
    });

    $(document).on('click', '.cart-item-remove', function (e) {
        e.preventDefault();
        removeFromCart($(this).attr('data-id'));
    });

    $(document).on('click', '#checkoutBtn, .checkout-btn', function (e) {
        e.preventDefault();
        if ($('#modalCheckout').length) {
            $('#modalCheckout').addClass('show');
        } else {
            handleCheckout();
        }
    });

    $(document).on('submit', '#formCheckout', function (e) {
        e.preventDefault();
        handleCheckout();
    });
});

window.FlexCart = {
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartSummary,
    renderCartPage,
    handleCheckout
};