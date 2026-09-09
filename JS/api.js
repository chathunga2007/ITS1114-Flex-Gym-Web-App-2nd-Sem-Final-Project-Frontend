const API_BASE_URL = "http://localhost:8080/api";

// main ajax wrapper for backend api calls
function ajaxRequest(options) {
    const url = options.url.startsWith("http") 
        ? options.url 
        : API_BASE_URL + (options.url.startsWith("/") ? options.url : "/" + options.url);

    const method = (options.method || options.type || "GET").toUpperCase();
    const token = getAuthToken();

    const headers = Object.assign({}, options.headers);
    if (token && !headers["Authorization"]) {
        headers["Authorization"] = "Bearer " + token;
    }

    let requestData = options.data;
    const contentType = options.contentType !== undefined ? options.contentType : "application/json";

    // convert object payload to json string for post/put
    if (requestData && typeof requestData === "object" && contentType === "application/json" && method !== "GET") {
        requestData = JSON.stringify(requestData);
    }

    return $.ajax({
        url: url,
        type: method,
        data: requestData,
        contentType: contentType,
        headers: headers,
        success: function(response, textStatus, xhr) {
            // handle custom error codes returned from backend
            if (response && response.status && response.status >= 400) {
                console.warn(`[API Issue] ${method} ${url}:`, response.message);
                if (typeof options.error === "function") {
                    options.error({ status: response.status, responseJSON: response }, textStatus, response.message);
                }
                return;
            }

            const body = (response && response.body !== undefined) ? response.body : response;
            if (typeof options.success === "function") {
                options.success(body, response, xhr);
            }
        },
        error: function(xhr, textStatus, errorThrown) {
            console.error(`[API Error] ${method} ${url}:`, xhr.status);

            if (xhr.status === 401 || xhr.status === 403) {
                console.warn("Unauthorized access or token expired");
            }

            if (typeof options.error === "function") {
                options.error(xhr, textStatus, errorThrown);
            }
        }
    });
}

// simple jwt token decoder
function parseJwt(token) {
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch (e) {
        console.error("Error decoding token:", e);
        return null;
    }
}

// local storage getters
function getAuthToken() {
    return localStorage.getItem("JWT") || localStorage.getItem("flexGymToken");
}

function getUserId() {
    return localStorage.getItem("userId") || localStorage.getItem("flexGymUserId");
}

function getUserEmail() {
    return localStorage.getItem("email") || localStorage.getItem("flexGymEmail") || "User";
}

function getUserRole() {
    return localStorage.getItem("userRole") || localStorage.getItem("flexGymRole") || "";
}

function getMemberId() {
    return localStorage.getItem("memberId") || localStorage.getItem("flexGymMemberId") || null;
}

function getUserFullName() {
    return localStorage.getItem("userFullName") || localStorage.getItem("flexGymFullName") || "";
}

// returns full session user details
function getCurrentUser() {
    const token = getAuthToken();
    const userId = getUserId();
    return {
        userId: userId,
        memberId: getMemberId() || userId,
        email: getUserEmail(),
        role: getUserRole(),
        fullName: getUserFullName(),
        token: token,
        claims: parseJwt(token)
    };
}

function isLoggedIn() {
    return !!getAuthToken();
}

// clears local session and redirects
function logout() {
    const keys = [
        "JWT", "userId", "email", "userRole", "userFullName", "memberId",
        "flexGymToken", "flexGymUserId", "flexGymEmail", "flexGymRole", "flexGymFullName", "flexGymMemberId"
    ];
    keys.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    window.location.href = "login.html";
}

// navigate user to proper portal based on role
function redirectByRole(role) {
    if (!role) {
        const claims = parseJwt(getAuthToken());
        role = claims ? claims.role : getUserRole();
    }

    const cleanRole = String(role || "").toUpperCase().replace("ROLE_", "");

    switch (cleanRole) {
        case "ADMIN":
            window.location.href = "admin-dashboard.html";
            break;
        case "RECEPTIONIST":
            window.location.href = "receptionist-dashboard.html";
            break;
        case "TRAINER":
            window.location.href = "trainer-dashboard.html";
            break;
        case "MEMBER":
        default:
            window.location.href = "member-dashboard.html";
            break;
    }
}

// route protection helper for dashboard pages
function checkAuth(allowedRoles) {
    if (!isLoggedIn()) {
        alert("Please sign in to access this portal.");
        window.location.href = "login.html";
        return false;
    }

    const currentRole = getUserRole();
    if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(currentRole)) {
        console.warn(`Role ${currentRole} not permitted here.`);
    }
    return true;
}

// clean toast popup notification
window.showToast = function(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

// global export
window.FlexAPI = {
    BASE_URL: API_BASE_URL,
    ajax: ajaxRequest,
    parseJwt: parseJwt,
    getToken: getAuthToken,
    getUserId: getUserId,
    getUserEmail: getUserEmail,
    getUserRole: getUserRole,
    getMemberId: getMemberId,
    getUserFullName: getUserFullName,
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    logout: logout,
    redirectByRole: redirectByRole,
    checkAuth: checkAuth,
    showToast: window.showToast
};