let isAuthSubmitting = false;

$(document).ready(function() {
    $("#loginForm").on("submit", function(e) {
        e.preventDefault();
        handleLogin();
    });

    $("#signupForm").on("submit", function(e) {
        e.preventDefault();
        handleSignup();
    });

    $("#passwordToggle").on("click", function() {
        const passInput = $("#loginPassword");
        if (passInput.attr("type") === "password") {
            passInput.attr("type", "text");
            $(this).text("Hide");
        } else {
            passInput.attr("type", "password");
            $(this).text("Show");
        }
    });

    $("#signupPassword").on("input", function() {
        const val = $(this).val();
        let score = 0;
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        $("#passwordStrengthBar").css("width", (score * 25) + "%");
    });

    $("#forgotPassword").on("click", function(e) {
        e.preventDefault();
        alert("Please contact gym administration or reception to reset your account credentials.");
    });
});

// login handler
function handleLogin() {
    if (isAuthSubmitting) return;

    const email = $("#loginEmail").val().trim();
    const password = $("#loginPassword").val().trim();
    const rememberMe = $("#rememberMe").is(":checked");

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    isAuthSubmitting = true;
    const loginBtn = $("#loginButton");
    loginBtn.prop("disabled", true).text("SIGNING IN...");

    const messageEl = $("#authMessage");
    messageEl.removeClass("show error success").text("");

    $.ajax({
        url: "http://localhost:8080/api/users/login",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ email: email, password: password }),
        success: function(response) {
            const data = response.body || response;

            if (data && data.token) {
                const token = data.token;
                const userId = data.userId;

                localStorage.setItem("JWT", token);
                localStorage.setItem("userId", userId);
                localStorage.setItem("flexGymToken", token);
                localStorage.setItem("flexGymUserId", userId);

                const claims = (typeof FlexAPI !== "undefined" && FlexAPI.parseJwt) 
                    ? FlexAPI.parseJwt(token) 
                    : parseJwtLocal(token);

                let role = claims ? claims.role : "";
                let userEmail = claims ? (claims.username || claims.sub || email) : email;

                if (role) {
                    localStorage.setItem("userRole", role);
                    localStorage.setItem("flexGymRole", role);
                }
                localStorage.setItem("email", userEmail);
                localStorage.setItem("flexGymEmail", userEmail);

                if (rememberMe) {
                    localStorage.setItem("flexGymRemember", "true");
                }

                // get user and member profile details
                $.ajax({
                    url: "http://localhost:8080/api/users/getUser/" + userId,
                    type: "GET",
                    headers: { 'Authorization': 'Bearer ' + token },
                    success: function(userData) {
                        const user = userData.body || userData;
                        if (user) {
                            if (user.userRole) {
                                role = user.userRole;
                                localStorage.setItem("userRole", role);
                                localStorage.setItem("flexGymRole", role);
                            }
                            if (user.memberDTO) {
                                if (user.memberDTO.memberId) {
                                    localStorage.setItem("memberId", user.memberDTO.memberId);
                                    localStorage.setItem("flexGymMemberId", user.memberDTO.memberId);
                                }
                                if (user.memberDTO.memberFullName) {
                                    localStorage.setItem("userFullName", user.memberDTO.memberFullName);
                                    localStorage.setItem("flexGymFullName", user.memberDTO.memberFullName);
                                }
                            }
                        }
                        isAuthSubmitting = false;
                        alert("Login Successfully!");
                        redirectUser(role);
                    },
                    error: function() {
                        isAuthSubmitting = false;
                        alert("Login Successfully!");
                        redirectUser(role || "ROLE_MEMBER");
                    }
                });
            } else {
                isAuthSubmitting = false;
                alert("Login response did not contain an authentication token.");
                loginBtn.prop("disabled", false).text("SIGN IN TO FLEX →");
            }
        },
        error: function(xhr) {
            isAuthSubmitting = false;
            loginBtn.prop("disabled", false).text("SIGN IN TO FLEX →");

            if (xhr.status === 401 || xhr.status === 403) {
                alert("Invalid Credentials");
                messageEl.addClass("show error").text("Invalid email or password.");
            } else if (xhr.status === 404) {
                alert("User not found with provided email.");
                messageEl.addClass("show error").text("No account found with this email.");
            } else {
                alert("Login failed. Please verify the backend server is running on port 8080.");
                messageEl.addClass("show error").text("Unable to connect to authentication server.");
            }
        }
    });
}

// user & member registration
function handleSignup() {
    if (isAuthSubmitting) return;

    const fullName = $("#memberFullName").val().trim();
    const phone = $("#memberPhoneNumber").val().trim();
    const email = $("#signupEmail").val().trim();
    const password = $("#signupPassword").val().trim();
    const confirmPassword = $("#confirmPassword").val().trim();
    const age = $("#age").val() || "25";
    const gender = $("#gender").val() || "MALE";
    const height = parseFloat($("#heightCm").val()) || 175;
    const weight = parseFloat($("#weightKg").val()) || 70;
    const terms = $("#terms").is(":checked");

    if (!fullName || !phone || !email || !password) {
        alert("Please fill all required fields.");
        return;
    }
    if (password.length < 8) {
        alert("Password must contain at least 8 characters.");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }
    if (!terms) {
        alert("Please accept the Terms & Conditions.");
        return;
    }

    isAuthSubmitting = true;
    const signupBtn = $("#signupButton");
    signupBtn.prop("disabled", true).text("CREATING ACCOUNT...");

    const messageEl = $("#signupMessage");
    messageEl.removeClass("show error success").text("");

    const payload = {
        email: email,
        password: password,
        userRole: "ROLE_MEMBER",
        status: "ACTIVE",
        memberDTO: {
            memberFullName: fullName,
            memberPhoneNumber: phone,
            email: email,
            password: password,
            age: String(age),
            gender: gender,
            heightCm: height,
            weightKg: weight,
            memberStatus: "ACTIVE"
        }
    };

    $.ajax({
        url: "http://localhost:8080/api/users/saveUser",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
        },
        success: function() {
            isAuthSubmitting = false;
            alert("User registered successfully!");
            window.location.href = "login.html";
        },
        error: function(xhr) {
            isAuthSubmitting = false;
            signupBtn.prop("disabled", false).text("CREATE MY FLEX ACCOUNT →");

            if (xhr.status === 409) {
                alert("Username / Email already exists.");
                messageEl.addClass("show error").text("An account with this email address already exists.");
            } else if (xhr.status === 400) {
                alert("Registration failed: Please check the entered information.");
                messageEl.addClass("show error").text("Invalid registration details provided.");
            } else {
                alert("Registration failed. Please try again.");
                messageEl.addClass("show error").text("Server error during registration. Please try again.");
            }
        }
    });
}

// route redirection helper
function redirectUser(role) {
    if (typeof FlexAPI !== "undefined" && FlexAPI.redirectByRole) {
        FlexAPI.redirectByRole(role);
        return;
    }

    const cleanRole = String(role || "").toUpperCase().replace("ROLE_", "");
    switch (cleanRole) {
        case "ADMIN":
            window.location.href = "admin-dashboard.html";
            break;
        case "TRAINER":
            window.location.href = "trainer-dashboard.html";
            break;
        case "RECEPTIONIST":
            window.location.href = "receptionist-dashboard.html";
            break;
        default:
            window.location.href = "member-dashboard.html";
            break;
    }
}

// fallback jwt decoder
function parseJwtLocal(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        ));
    } catch (e) {
        return null;
    }
}