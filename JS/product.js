/**
 * Flex Gym - Product & Category Service
 */
const ProductService = {
    getAllProducts: function (onSuccess, onError) {
        return ajaxRequest({
            url: "/products/getAllProducts",
            method: "GET",
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    getProductById: function (productId, onSuccess, onError) {
        return ajaxRequest({
            url: "/products/getProduct/" + productId,
            method: "GET",
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    saveProduct: function (productData, onSuccess, onError) {
        return ajaxRequest({
            url: "/products/saveProduct",
            method: "POST",
            data: productData,
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    updateProduct: function (productData, onSuccess, onError) {
        return ajaxRequest({
            url: "/products/updateProduct",
            method: "PUT",
            data: productData,
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    deleteProduct: function (productId, onSuccess, onError) {
        return ajaxRequest({
            url: "/products/deleteProduct/" + productId,
            method: "DELETE",
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    getLowStockAlerts: function (minStock, onSuccess, onError) {
        return ajaxRequest({
            url: "/products/getLowStockAlerts?minStock=" + (minStock || 5),
            method: "GET",
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    }
};

const CategoryService = {
    getAllCategories: function (onSuccess, onError) {
        return ajaxRequest({
            url: "/categories/getAllCategories",
            method: "GET",
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    saveCategory: function (categoryData, onSuccess, onError) {
        return ajaxRequest({
            url: "/categories/saveCategory",
            method: "POST",
            data: categoryData,
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    }
};

// Store page dynamic rendering
$(document).ready(function () {
    if (window.location.pathname.includes("shop.html") || window.location.href.includes("shop.html")) {
        loadShopProducts();
        setupCategoryFilters();
    }
});

function loadShopProducts(filterCategory) {
    ProductService.getAllProducts(function (products) {
        if (Array.isArray(products) && products.length > 0) {
            const grid = $('.shop-products .product-grid');
            if (!grid.length) return;

            grid.empty();
            let filtered = products;
            if (filterCategory && filterCategory !== 'All Products') {
                filtered = products.filter(p => {
                    const cat = p.categoryName || (p.category && p.category.categoryName) || '';
                    return cat.toLowerCase().includes(filterCategory.toLowerCase());
                });
            }

            if (filtered.length === 0) {
                grid.html('<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No products found in this category.</div>');
                return;
            }

            filtered.forEach(p => {
                const img = p.imageUrl || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80';
                const cat = p.categoryName || (p.category && p.category.categoryName) || 'Fitness';
                const inStock = p.stockQuantity && p.stockQuantity > 0;
                grid.append(`
                    <div class="product-card" data-category="${cat}">
                        <div class="product-image">
                            <span class="product-badge" style="background:${inStock ? 'rgba(204,255,0,0.15);color:var(--lime)' : 'rgba(239,68,68,0.15);color:var(--danger)'}">
                                ${inStock ? (p.stockQuantity + ' in stock') : 'Out of Stock'}
                            </span>
                            <img src="${img}" alt="${p.productName}" />
                        </div>
                        <div class="product-content">
                            <span class="product-category">${cat}</span>
                            <h3 class="product-name">${p.productName}</h3>
                            <p class="product-description">${p.productDescription || 'High quality certified gym product.'}</p>
                            <div class="product-bottom">
                                <span class="product-price">Rs. ${Number(p.productPrice).toLocaleString()}</span>
                                <button class="add-cart-btn" data-add-to-cart 
                                    data-product-id="${p.productId}" 
                                    data-product-name="${p.productName}" 
                                    data-product-price="${p.productPrice}" 
                                    data-product-cat="${cat}" 
                                    data-product-img="${img}"
                                    ${!inStock ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                                    ${inStock ? '+ Add To Cart' : 'Sold Out'}
                                </button>
                            </div>
                        </div>
                    </div>
                `);
            });
        }
    }, function () {
        console.warn("Backend products currently offline or seeding. Default display active.");
    });
}

function setupCategoryFilters() {
    $(document).on('click', '.category-list .category-item', function () {
        $('.category-list .category-item').removeClass('active');
        $(this).addClass('active');
        const selectedCat = $(this).text().trim();
        loadShopProducts(selectedCat);
    });
}

window.ProductService = ProductService;
window.CategoryService = CategoryService;