$(document).ready(function () {
    renderNavbarAuthState();

    const navbar = $("#navbar");
    $(window).on("scroll", function () {
        if ($(this).scrollTop() > 50) {
            navbar.addClass("scrolled");
        } else {
            navbar.removeClass("scrolled");
        }
    });

    const mobileMenuBtn = $("#mobileMenuBtn");
    const mobileMenu = $("#mobileMenu");

    if (mobileMenuBtn.length && mobileMenu.length) {
        mobileMenuBtn.on("click", function () {
            mobileMenu.toggleClass("open");
        });

        mobileMenu.find("a").on("click", function () {
            mobileMenu.removeClass("open");
        });

        $(document).on("click", function (e) {
            if (!mobileMenu.is(e.target) && mobileMenu.has(e.target).length === 0 &&
                !mobileMenuBtn.is(e.target) && mobileMenuBtn.has(e.target).length === 0) {
                mobileMenu.removeClass("open");
            }
        });
    }

    $(".feature-card, .stat-card, .shop-info-item, .pricing-card, .trainer-card").each(function () {
        $(this).css({
            "opacity": "1",
            "transform": "translateY(0)"
        });
    });

    const pathname = window.location.pathname;

    if (pathname.includes("membership.html")) {
        loadDynamicPackages();
    } else if (pathname.includes("trainer.html")) {
        loadDynamicTrainers();
    } else if (pathname.includes("workout-plans.html")) {
        loadDynamicWorkoutPlans();
    } else if (pathname.includes("shop.html")) {
        loadDynamicProducts();
    }
});

// update navbar state based on login status and role
function renderNavbarAuthState() {
    const token = localStorage.getItem("JWT") || localStorage.getItem("flexGymToken");
    const navActions = $(".navbar .nav-actions");
    const mobileMenu = $("#mobileMenu");
    if (!navActions.length) return;

    let cartCount = 0;
    try {
        const cartStr = localStorage.getItem("flexGymCart");
        if (cartStr) {
            const parsed = JSON.parse(cartStr);
            cartCount = Array.isArray(parsed) ? parsed.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
        }
    } catch (e) {
        cartCount = 0;
    }

    const cartHtml = `
        <a href="cart.html" class="btn btn-outline" style="position:relative;margin-right:4px;">
            🛒 Cart <span class="cart-badge" data-cart-count style="background:var(--lime);color:#000;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:800;margin-left:4px;${cartCount > 0 ? '' : 'display:none;'}">${cartCount}</span>
        </a>
    `;

    if (token) {
        const role = localStorage.getItem("userRole") || localStorage.getItem("flexGymRole") || "ROLE_MEMBER";
        const email = localStorage.getItem("email") || localStorage.getItem("flexGymEmail") || "Member";
        const fullName = localStorage.getItem("userFullName") || localStorage.getItem("flexGymFullName") || "";
        const displayName = fullName ? fullName.split(' ')[0] : email.split('@')[0];
        const initials = displayName.substring(0, 2).toUpperCase() || 'U';

        let targetDashboard = "member-dashboard.html";
        let portalLabel = "Member Hub";
        if (role === "ROLE_ADMIN") {
            targetDashboard = "admin-dashboard.html";
            portalLabel = "Admin Portal";
        } else if (role === "ROLE_TRAINER") {
            targetDashboard = "trainer-dashboard.html";
            portalLabel = "Trainer Desk";
        } else if (role === "ROLE_RECEPTIONIST") {
            targetDashboard = "receptionist-dashboard.html";
            portalLabel = "Front Desk";
        }

        navActions.html(`
            ${cartHtml}
            <div class="user-auth-pill" style="display:inline-flex;align-items:center;gap:6px;">
                <a href="${targetDashboard}" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;font-size:13px;" title="Open ${portalLabel}">
                    <span style="width:22px;height:22px;border-radius:50%;background:#000;color:var(--lime);display:grid;place-items:center;font-size:10px;font-weight:900;">${initials}</span>
                    <span>${displayName}</span>
                    <span style="font-size:10px;opacity:0.8;text-transform:uppercase;">(${portalLabel}) ↗</span>
                </a>
                <button type="button" class="btn btn-outline logout-nav-btn" title="Sign Out" style="padding:8px 12px;font-size:13px;color:var(--danger);border-color:rgba(255,77,77,0.35);">
                    🚪
                </button>
            </div>
        `);

        if (mobileMenu.length) {
            mobileMenu.find(".mobile-auth-link").remove();
            mobileMenu.append(`
                <a href="${targetDashboard}" class="mobile-auth-link" style="color:var(--lime);font-weight:800;border-top:1px solid var(--border);margin-top:10px;padding-top:15px;">👤 ${displayName} (${portalLabel} ↗)</a>
                <a href="#" class="mobile-auth-link logout-nav-btn" style="color:var(--danger);">🚪 Sign Out</a>
            `);
        }
    } else {
        navActions.html(`
            ${cartHtml}
            <a href="signup.html" class="btn btn-outline" style="margin-right:4px;">Sign Up</a>
            <a href="login.html" class="btn btn-primary">Sign In</a>
        `);

        if (mobileMenu.length) {
            mobileMenu.find(".mobile-auth-link").remove();
            mobileMenu.append(`
                <a href="signup.html" class="mobile-auth-link" style="border-top:1px solid var(--border);margin-top:10px;padding-top:15px;">Sign Up</a>
                <a href="login.html" class="mobile-auth-link" style="color:var(--lime);font-weight:800;">Sign In</a>
            `);
        }
    }

    $(document).off('click', '.logout-nav-btn').on('click', '.logout-nav-btn', function (e) {
        e.preventDefault();
        if (window.FlexAlert) {
            FlexAlert.confirm("Sign Out", "Are you sure you want to log out of Flex Gym?", "Yes, Sign Out", "Stay Signed In").then((confirmed) => {
                if (confirmed) {
                    FlexAPI.logout();
                }
            });
        } else {
            if (confirm("Are you sure you want to sign out?")) {
                FlexAPI.logout();
            }
        }
    });
}

// load public membership packages
function loadDynamicPackages() {
    const grid = $('.membership-grid');
    if (!grid.length) return;

    ajaxRequest({
        url: "/packages/getAllPackages",
        method: "GET",
        success: function (packages) {
            if (!Array.isArray(packages) || packages.length === 0) return;
            grid.empty();

            packages.forEach((pkg, index) => {
                const planNum = String(index + 1).padStart(2, '0');
                const isFeatured = index === 1 || pkg.durationMonths === 3;
                const durationText = pkg.durationMonths ? (pkg.durationMonths === 1 ? '1 MONTH' : pkg.durationMonths === 12 ? '12 MONTHS' : `${pkg.durationMonths} MONTHS`) : '1 MONTH';
                const durationSubtext = pkg.durationMonths ? (pkg.durationMonths === 1 ? '/ month' : `/${pkg.durationMonths} months`) : '/ month';
                const priceFormatted = Number(pkg.packagePrice || 0).toLocaleString();

                grid.append(`
                    <div class="membership-card ${isFeatured ? 'featured' : ''}">
                        ${isFeatured ? '<div class="popular">Most Popular</div>' : ''}
                        <div class="plan-number">PLAN ${planNum}</div>
                        <div class="plan-name">${pkg.packageName}</div>
                        <div class="plan-description">${pkg.packageDescription || 'Full gym floor access, locker access, and fitness facilities.'}</div>
                        <div class="plan-price">
                            Rs. ${priceFormatted}
                            <small>${durationSubtext}</small>
                        </div>
                        <div class="plan-duration">${durationText}</div>
                        <div class="plan-divider"></div>
                        <ul class="plan-features">
                            <li>Full Gym Floor Access</li>
                            <li>Modern Equipment & Cardio</li>
                            <li>Locker Room Access</li>
                            <li>Trainer Guidance</li>
                            ${isFeatured ? '<li>Personalized Workout Plan</li>' : ''}
                        </ul>
                        <a href="signup.html?package=${pkg.packageId}" class="plan-button ${isFeatured ? '' : 'secondary-button'}">
                            Choose ${pkg.packageName}
                        </a>
                    </div>
                `);
            });
        }
    });
}

// load trainers list
function loadDynamicTrainers() {
    const grid = $('.trainer-grid');
    if (!grid.length) return;

    ajaxRequest({
        url: "/trainers/getAllTrainers",
        method: "GET",
        success: function (trainers) {
            if (!Array.isArray(trainers) || trainers.length === 0) return;
            grid.empty();

            const fallbackPhotos = [
                "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=900&q=85",
                "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=85",
                "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=85"
            ];

            trainers.forEach((t, i) => {
                const photo = t.photoUrl || fallbackPhotos[i % fallbackPhotos.length];
                grid.append(`
                    <article class="trainer-card">
                        <div class="trainer-photo">
                            <img src="${photo}" alt="${t.trainerName}">
                            <span class="trainer-status">${t.trainerStatus || 'Available'}</span>
                        </div>
                        <div class="trainer-details">
                            <span class="trainer-role">${t.specialization || 'Fitness Trainer'}</span>
                            <h3>${t.trainerName}</h3>
                            <p>${t.bio || 'Professional fitness coaching and goal-oriented workout programming.'}</p>
                            <div class="trainer-meta">
                                <div><span>Experience</span><strong>${t.experienceYears ? t.experienceYears + '+ Years' : 'Certified'}</strong></div>
                                <div><span>Phone</span><strong>${t.trainerPhoneNumber || '+94 77 123 4567'}</strong></div>
                            </div>
                        </div>
                    </article>
                `);
            });
        }
    });
}

// load public workout routines
function loadDynamicWorkoutPlans() {
    const grid = $('.plans-grid');
    if (!grid.length) return;

    ajaxRequest({
        url: "/workout-plans/getAllWorkoutPlans",
        method: "GET",
        success: function (plans) {
            if (!Array.isArray(plans) || plans.length === 0) return;
            grid.empty();

            plans.forEach(plan => {
                const title = plan.planName || plan.planTitle || 'Custom Workout Routine';
                const diff = plan.difficultyLevelStatus || plan.difficultyLevel || 'INTERMEDIATE';
                const desc = plan.description || 'Comprehensive training plan engineered for maximum strength and endurance.';
                const goal = diff === 'BEGINNER' ? 'Mobility & Health' : (diff === 'ADVANCED' ? 'Peak Performance' : 'Muscle Growth');

                grid.append(`
                    <div class="plan-card">
                        <span class="plan-tag">${diff}</span>
                        <h3>${title}</h3>
                        <p>${desc}</p>
                        <div class="plan-meta">
                            <div><span>Goal</span><strong>${goal}</strong></div>
                            <div><span>Level</span><strong>${diff}</strong></div>
                            <div><span>Status</span><strong>${plan.planStatus || 'ACTIVE'}</strong></div>
                        </div>
                        <ul class="plan-features">
                            <li>Targeted muscle group splits</li>
                            <li>Progressive overload tracking</li>
                            <li>Form tutorials & guidance</li>
                        </ul>
                        <a href="login.html" class="btn btn-outline plan-button">Start Plan</a>
                    </div>
                `);
            });
        }
    });
}

// load public storefront items
function loadDynamicProducts() {
    const grid = $('.products-grid, .product-grid');
    if (!grid.length) return;

    ajaxRequest({
        url: "/products/getAllProducts",
        method: "GET",
        success: function (products) {
            if (!Array.isArray(products) || products.length === 0) return;
            grid.empty();

            const fallbackImgs = [
                "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1586401100295-7a841c8e7b1d?auto=format&fit=crop&w=600&q=80"
            ];

            products.forEach((p, idx) => {
                const img = p.imageUrl || p.productImage || fallbackImgs[idx % fallbackImgs.length];
                const catName = p.categoryName || (p.category && p.category.categoryName) || 'Store Item';

                grid.append(`
                    <div class="product-card">
                        <div class="product-image">
                            <span class="product-badge">${p.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}</span>
                            <img src="${img}" alt="${p.productName}" />
                        </div>
                        <div class="product-content">
                            <span class="product-category">${catName}</span>
                            <h3 class="product-name">${p.productName}</h3>
                            <p class="product-description">${p.productDescription || 'Premium gym supplement and fitness accessory.'}</p>
                            <div class="product-bottom">
                                <span class="product-price">Rs. ${Number(p.productPrice || 0).toLocaleString()}</span>
                                <button class="add-cart-btn" data-add-to-cart data-product-id="${p.productId}" data-product-name="${p.productName}" data-product-price="${p.productPrice}" data-product-cat="${catName}" data-product-img="${img}">+ Add To Cart</button>
                            </div>
                        </div>
                    </div>
                `);
            });
        }
    });
}