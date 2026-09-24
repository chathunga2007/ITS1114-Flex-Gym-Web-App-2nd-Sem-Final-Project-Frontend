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
        name: 'Pro Heavy-Duty Lifting Straps & Wraps',
        category: 'Fitness Gear',
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
    } else if (window.FlexAlert) {
        FlexAlert.toast(`Added ${product.name} to cart!`, 'success');
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
        if (window.FlexAlert) {
            FlexAlert.warning("Empty Cart", "Your cart is empty. Please add items before checking out.");
        } else {
            alert("Your cart is empty. Please add items to checkout.");
        }
        return;
    }

    const token = localStorage.getItem("JWT") || localStorage.getItem("flexGymToken");
    if (!token) {
        if (window.FlexAlert) {
            FlexAlert.warning("Login Required", "Please sign in to your Flex Gym member account to complete checkout.").then(() => {
                window.location.href = "login.html";
            });
        } else {
            alert("Please sign in to your Flex Gym member account to complete checkout.");
            window.location.href = "login.html";
        }
        return;
    }

    const summary = getCartSummary();
    const memberId = localStorage.getItem("memberId") || localStorage.getItem("userId") || localStorage.getItem("flexGymUserId") || "1";

    const paymentMethod = $('input[name="paymentChoice"]:checked').val() || 'CASH_ON_DELIVERY';
    const isCard = paymentMethod === 'CREDIT_CARD';

    // Form inputs
    const fullName = $('#checkoutFullName').val().trim();
    const phone = $('#checkoutPhone').val().trim();
    const city = $('#checkoutCity').val().trim();
    const address = $('#checkoutAddress').val().trim();
    const postalCode = $('#checkoutPostalCode').val().trim() || '00300';
    const notes = $('#checkoutNotes').val().trim();

    if (!fullName || !phone || !city || !address) {
        if (window.FlexAlert) {
            FlexAlert.warning("Missing Fields", "Please complete all required shipping details.");
        } else {
            alert("Please fill in recipient name, phone, city, and delivery address.");
        }
        return;
    }

    let cardLast4 = null;
    let cardBrand = null;

    if (isCard) {
        const cardHolder = $('#cardHolderName').val().trim();
        const rawCardNum = $('#cardNumber').val().replace(/\s+/g, '');
        const cardExpiry = $('#cardExpiry').val().trim();
        const cardCvv = $('#cardCvv').val().trim();

        if (!cardHolder || rawCardNum.length < 15 || !cardExpiry.includes('/') || cardCvv.length < 3) {
            if (window.FlexAlert) {
                FlexAlert.error("Invalid Card Details", "Please provide a valid cardholder name, 16-digit card number, MM/YY expiry, and CVV.");
            } else {
                alert("Please check your card details and complete all card fields.");
            }
            return;
        }

        cardLast4 = rawCardNum.slice(-4);
        cardBrand = $('#cardBrandBadge').text() || 'VISA';
    }

    const orderItems = cart.map(item => {
        const rawId = String(item.id).replace(/[^0-9]/g, '');
        return {
            productId: rawId ? parseInt(rawId, 10) : 1,
            productName: item.name,
            quantity: parseInt(item.quantity, 10) || 1,
            unitPrice: parseFloat(item.price) || 0
        };
    });

    const orderPayload = {
        memberId: parseInt(memberId, 10),
        totalAmount: summary.total,
        orderStatus: isCard ? 'CONFIRMED' : 'PENDING',
        paymentStatus: isCard ? 'PAID' : 'PENDING',
        paymentMethod: paymentMethod,
        shippingAddress: address,
        deliveryCity: city,
        postalCode: postalCode,
        contactPhone: phone,
        orderNotes: notes,
        cardLast4: cardLast4,
        cardBrand: cardBrand,
        items: orderItems
    };

    const checkoutBtn = $('#btnConfirmOrder, #checkoutBtn, .checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.prop('disabled', true).text(isCard ? 'AUTHORIZING CARD PAYMENT...' : 'RECORDING ORDER...');
    }

    const orderAction = window.OrderService && typeof OrderService.placeOrder === 'function'
        ? OrderService.placeOrder
        : function (data, cb, errCb) {
            ajaxRequest({ url: "/orders/placeOrder", method: "POST", data: data, success: cb, error: errCb });
        };

    orderAction(orderPayload, function (response) {
        const order = response && response.body ? response.body : response;
        const orderId = order && order.orderId ? order.orderId : "NEW";
        const trackingNum = order && order.trackingNumber ? order.trackingNumber : ("FLX-TRK-" + Math.floor(100000 + Math.random() * 900000));
        const courier = order && order.courierName ? order.courierName : "Flex Express Logistics";

        $('#modalCheckout').removeClass('show');
        clearCart();
        if (checkoutBtn.length) {
            checkoutBtn.prop('disabled', false).text('Confirm & Place Order ✓');
        }

        const userRole = localStorage.getItem("userRole") || localStorage.getItem("flexGymRole") || "ROLE_MEMBER";
        const targetPage = userRole === "ROLE_ADMIN" ? "admin-dashboard.html#orders" : "member-dashboard.html#orders";

        Swal.fire({
            icon: 'success',
            title: isCard ? 'Payment Authorized & Order Placed! 🎉' : 'Order Placed with Cash on Delivery! 📦',
            html: `
                <div style="text-align:left; font-size:13px; line-height:1.7; margin-top:10px;">
                    <p><strong>Order Ref:</strong> #ORD-${orderId}</p>
                    <p><strong>Tracking Number:</strong> <span style="font-family:monospace; background:rgba(204,255,0,0.15); color:#ccff00; padding:2px 8px; border-radius:4px; font-weight:bold;">${trackingNum}</span></p>
                    <p><strong>Courier:</strong> ${courier}</p>
                    <p><strong>Delivery To:</strong> ${address}, ${city}</p>
                    <p><strong>Total Amount:</strong> Rs. ${summary.total.toLocaleString()} ${isCard ? '<em>(Paid via Card ending in ' + cardLast4 + ')</em>' : '<em>(To be paid in cash on delivery)</em>'}</p>
                    <p style="color:#9ca3af; font-size:11px; margin-top:12px;">A confirmation receipt has been dispatched to your registered email address.</p>
                </div>
            `,
            background: '#111827',
            color: '#ffffff',
            confirmButtonColor: '#ccff00',
            confirmButtonText: '<span style="color:#000; font-weight:800;">View in Orders & Track →</span>',
            showCancelButton: true,
            cancelButtonText: 'Continue Shopping',
            cancelButtonColor: '#374151'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = targetPage;
            } else {
                window.location.href = "shop.html";
            }
        });
    }, function (xhr) {
        if (checkoutBtn.length) {
            checkoutBtn.prop('disabled', false).text('Confirm & Place Order ✓');
        }

        const errMsg = xhr && xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Unable to process order. Please try again.";
        if (window.FlexAlert) {
            FlexAlert.error("Order Failed", errMsg);
        } else {
            alert("Order failed: " + errMsg);
        }
    });
}

// event bindings
$(document).ready(function () {
    updateCartBadges();
    renderCartPage();

    // Toggle Payment Options
    $(document).on('change', 'input[name="paymentChoice"]', function () {
        const choice = $(this).val();
        $('.payment-option-card').removeClass('active');
        $(this).closest('.payment-option-card').addClass('active');

        if (choice === 'CREDIT_CARD') {
            $('#cardDetailsContainer').slideDown(200);
            $('#modalPaymentNote').text('💳 Secure card authorization. Your card will be debited instantly.');
        } else {
            $('#cardDetailsContainer').slideUp(200);
            $('#modalPaymentNote').text('📦 Islandwide courier dispatch within 24 hours. Pay cash upon delivery.');
        }
    });

    // Card Number input live spacing and brand detection
    $(document).on('input', '#cardNumber', function () {
        let val = $(this).val().replace(/\D/g, '').substring(0, 16);
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        $(this).val(formatted);

        // Detect brand
        const badge = $('#cardBrandBadge');
        const icon = $('#cardIcon');
        if (val.startsWith('4')) {
            badge.text('VISA').css('background', '#1a1f71');
            icon.text('💳');
        } else if (/^(5[1-5]|2[2-7])/.test(val)) {
            badge.text('MASTERCARD').css('background', '#eb001b');
            icon.text('💳');
        } else if (/^3[47]/.test(val)) {
            badge.text('AMEX').css('background', '#006fcf');
            icon.text('💳');
        } else {
            badge.text('CARD').css('background', 'rgba(255,255,255,0.15)');
            icon.text('💳');
        }
    });

    // Expiry MM/YY auto slash
    $(document).on('input', '#cardExpiry', function () {
        let val = $(this).val().replace(/\D/g, '').substring(0, 4);
        if (val.length >= 2) {
            $(this).val(val.substring(0, 2) + '/' + val.substring(2));
        } else {
            $(this).val(val);
        }
    });

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
        openCheckoutModal();
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