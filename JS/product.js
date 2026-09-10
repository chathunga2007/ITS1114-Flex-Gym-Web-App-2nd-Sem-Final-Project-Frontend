const ProductService = {
    getAllProducts: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/products/getAllProducts",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllProducts success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllProducts error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getProductById: function(productId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/products/getProduct/" + productId,
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    saveProduct: function(productData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/products/saveProduct",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(productData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("SaveProduct success:", response);
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateProduct: function(productData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/products/updateProduct",
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(productData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const updated = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deleteProduct: function(productId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/products/deleteProduct/" + productId,
            type: "DELETE",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getLowStockAlerts: function(minStock, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/products/getLowStockAlerts?minStock=" + (minStock || 5),
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    }
};

const CategoryService = {
    getAllCategories: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/categories/getAllCategories",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    saveCategory: function(categoryData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/categories/saveCategory",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(categoryData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    }
};

$(document).ready(function() {
    if (window.location.pathname.includes("shop.html")) {
        ProductService.getAllProducts(function(products) {
            if (Array.isArray(products) && products.length > 0) {
                const grid = $('.shop-products .product-grid');
                if (grid.length) {
                    grid.empty();
                    products.forEach(p => {
                        const img = p.imageUrl || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80';
                        grid.append(`
                            <div class="product-card" data-category="${p.categoryName || 'General'}">
                                <div class="product-image">
                                    <span class="product-badge">${p.stockQuantity > 0 ? (p.stockQuantity + ' in stock') : 'Out of stock'}</span>
                                    <img src="${img}" alt="${p.productName}" />
                                </div>
                                <div class="product-content">
                                    <span class="product-category">${p.categoryName || 'Fitness'}</span>
                                    <h3 class="product-name">${p.productName}</h3>
                                    <p class="product-description">${p.productDescription || 'High quality gym product.'}</p>
                                    <div class="product-bottom">
                                        <span class="product-price">Rs. ${Number(p.productPrice).toLocaleString()}</span>
                                        <button class="add-cart-btn" data-add-to-cart 
                                            data-product-id="${p.productId}" 
                                            data-product-name="${p.productName}" 
                                            data-product-price="${p.productPrice}" 
                                            data-product-cat="${p.categoryName || 'Fitness'}" 
                                            data-product-img="${img}">+ Add To Cart</button>
                                    </div>
                                </div>
                            </div>
                        `);
                    });
                }
            }
        });
    }
});

window.ProductService = ProductService;
window.CategoryService = CategoryService;