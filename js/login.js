function handleLogin() {
    let email = $('#email').val().trim();
    let password = $('#password').val().trim();

    if (!email) {
        alert("Please enter Email.");
        return;
    }
    if (!password) {
        alert("Please enter Password.");
        return;
    }

    let obj = JSON.stringify({ "email": email, "password": password });

    $.ajax({
        url: "http://localhost:8080/api/users/login",
        type: "POST",
        contentType: "application/json",
        data: obj,
        success: function (response) {
            console.log("Login Response:", response);

            let token = "";
            let userId = "";
            let userRole = "";
            let userName = "";

            if (response && response.body) {
                token = response.body.token || "";
                userId = response.body.userId || "";
                userRole = response.body.userRole || response.body.role || response.body.user_role || "";
                userName = response.body.userName || response.body.name || "";
            } else if (response && response.data) {
                token = response.data.token || "";
                userId = response.data.userId || "";
                userRole = response.data.userRole || response.data.role || "";
                userName = response.data.userName || "";
            }

            // If userRole is not directly in the body, decode JWT token payload
            if (!userRole && token && token.includes(".")) {
                try {
                    let base64Url = token.split('.')[1];
                    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    let decoded = JSON.parse(jsonPayload);
                    console.log("Decoded JWT Token:", decoded);

                    userRole = decoded.userRole || decoded.role || (decoded.roles && decoded.roles[0]) || (decoded.authorities && decoded.authorities[0]) || "";
                    if (decoded.sub && !userName) {
                        userName = decoded.sub.split("@")[0];
                    }
                } catch (e) {
                    console.error("JWT Decode error:", e);
                }
            }

            // Normalize role format (e.g. MEMBER -> ROLE_MEMBER)
            userRole = normalizeRole(userRole || "ROLE_MEMBER");
            userName = userName || email.split("@")[0];

            localStorage.setItem("JWT", token);
            localStorage.setItem("userId", userId);
            localStorage.setItem("userRole", userRole);
            localStorage.setItem("userName", userName);
            localStorage.setItem("email", email);

            alert("Login Successfully!");
            window.location.href = "dashboard.html";
        },
        error: function (response) {
            if (response.status === 403 || response.status === 401) {
                alert("Invalid Credentials. Please check your email and password.");
            } else {
                alert("Login failed. Please try again.");
            }
        }
    });
}

function normalizeRole(role) {
    if (!role) return "ROLE_MEMBER";
    role = role.toString().toUpperCase().trim();
    if (!role.startsWith("ROLE_")) {
        role = "ROLE_" + role;
    }
    return role;
}