/* =========================================================
   FLEX GYM - GLOBAL SHOPPING CART STATE & CONTROLLER
   JS/cart.js
========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'flexGymCart';

  // Default sample items if cart is empty
  const defaultItems = [
    {
      id: 'prod-1',
      name: 'HydroPure Isolate Whey (2kg)',
      category: 'Supplements',
      price: 18500,
      image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80',
      quantity: 1,
    },
    {
      id: 'prod-2',
      name: 'Pro Lifting Straps & Wrist Wraps',
      category: 'Gear',
      price: 3200,
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
      quantity: 2,
    }
  ];

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

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartBadges();
    renderCartPage();
  }

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id || item.name === product.name);
    
    if (existing) {
      existing.quantity += (product.quantity || 1);
    } else {
      cart.push({
        id: product.id || 'prod-' + Date.now(),
        name: product.name,
        category: product.category || 'Fitness',
        price: Number(product.price) || 0,
        image: product.image || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80',
        quantity: product.quantity || 1,
      });
    }

    saveCart(cart);

    if (window.showToast) {
      window.showToast(`Added <strong>${product.name}</strong> to your cart!`, 'success');
    }
  }

  function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);

    if (window.showToast) {
      window.showToast('Item removed from cart.', 'info');
    }
  }

  function updateQuantity(productId, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
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
    const badges = document.querySelectorAll('.cart-badge, [data-cart-count]');
    badges.forEach(badge => {
      badge.textContent = summary.count;
      badge.style.display = summary.count > 0 ? 'inline-flex' : 'none';
    });
  }

  function formatPrice(amount) {
    return 'Rs. ' + amount.toLocaleString('en-US');
  }

  function renderCartPage() {
    const cartItemsContainer = document.getElementById('cartItemsList');
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartShippingEl = document.getElementById('cartShipping');
    const cartTotalEl = document.getElementById('cartTotal');
    const cartEmptyState = document.getElementById('cartEmptyState');
    const cartContentArea = document.getElementById('cartContentArea');

    if (!cartItemsContainer) return;

    const cart = getCart();
    const summary = getCartSummary();

    if (cart.length === 0) {
      if (cartEmptyState) cartEmptyState.style.display = 'block';
      if (cartContentArea) cartContentArea.style.display = 'none';
      return;
    }

    if (cartEmptyState) cartEmptyState.style.display = 'none';
    if (cartContentArea) cartContentArea.style.display = 'grid';

    cartItemsContainer.innerHTML = cart.map(item => `
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
    `).join('');

    if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(summary.subtotal);
    if (cartShippingEl) cartShippingEl.textContent = summary.shipping === 0 ? 'FREE' : formatPrice(summary.shipping);
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(summary.total);
  }

  /* Event Listeners */
  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadges();
    renderCartPage();

    // Add to cart buttons on shop pages
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-to-cart]');
      if (addBtn) {
        e.preventDefault();
        const id = addBtn.getAttribute('data-product-id');
        const name = addBtn.getAttribute('data-product-name');
        const price = parseFloat(addBtn.getAttribute('data-product-price') || '0');
        const img = addBtn.getAttribute('data-product-img');
        const cat = addBtn.getAttribute('data-product-cat');

        addToCart({ id, name, price, image: img, category: cat, quantity: 1 });
      }

      // Quantity buttons
      const decBtn = e.target.closest('.dec-qty');
      if (decBtn) {
        e.preventDefault();
        const id = decBtn.getAttribute('data-id');
        updateQuantity(id, -1);
      }

      const incBtn = e.target.closest('.inc-qty');
      if (incBtn) {
        e.preventDefault();
        const id = incBtn.getAttribute('data-id');
        updateQuantity(id, 1);
      }

      // Remove button
      const removeBtn = e.target.closest('.cart-item-remove');
      if (removeBtn) {
        e.preventDefault();
        const id = removeBtn.getAttribute('data-id');
        removeFromCart(id);
      }
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
  };
})();
