let isLoggingIn = false;

$(document).ready(function () {
    if (localStorage.getItem("JWT")) {
        console.log("Existing JWT found in storage.");
    }

    $("#loginForm").off("submit").on("submit", function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleLogin();
    });

    $("#passwordToggle").off("click").on("click", function () {
        const pwd = $("#loginPassword").length ? $("#loginPassword") : $("#password");
        if (pwd.attr("type") === "password") {
            pwd.attr("type", "text");
            $(this).text("Hide");
        } else {
            pwd.attr("type", "password");
            $(this).text("Show");
        }
    });

    $("#forgotPassword").off("click").on("click", function (e) {
        e.preventDefault();
        if (window.FlexAlert) {
            FlexAlert.info("Reset Password", "Please contact gym administration or front desk to reset your account credentials.");
        } else {
            alert("Please contact gym administration or front desk to reset your password.");
        }
    });
});

function handleLogin() {
    if (isLoggingIn) {
        console.warn("Login already in progress, duplicate request prevented.");
        return;
    }

    let email = $("#loginEmail").val() ? $("#loginEmail").val().trim() : ($("#email").val() ? $("#email").val().trim() : ($("#userName").val() ? $("#userName").val().trim() : ""));
    let password = $("#loginPassword").val() ? $("#loginPassword").val().trim() : ($("#password").val() ? $("#password").val().trim() : "");
    let rememberMe = $("#rememberMe").is(":checked");

    if (!email) {
        if (window.FlexAlert) {
            FlexAlert.warning("Missing Email", "Please enter your Username or Email address.");
        } else {
            alert("Please enter Username / Email.");
        }
        $("#loginEmail, #email").first().focus();
        return;
    }
    if (!password) {
        if (window.FlexAlert) {
            FlexAlert.warning("Missing Password", "Please enter your account password.");
        } else {
            alert("Please enter Password.");
        }
        $("#loginPassword, #password").first().focus();
        return;
    }

    isLoggingIn = true;

    let obj = JSON.stringify({
        "email": email,
        "password": password
    });

    const btn = $("#loginButton");
    btn.prop("disabled", true).text("SIGNING IN...");

    const messageEl = $("#authMessage");
    if (messageEl.length) {
        messageEl.removeClass("show error success").text("");
    }

    $.ajax({
        url: "http://localhost:8080/api/users/login",
        type: "POST",
        contentType: "application/json",
        data: obj,
        success: function (response) {
            console.log("Login Response:", response);

            if (response && response.body && response.body.token) {
                const token = response.body.token;
                const userId = response.body.userId;
                const memberId = response.body.memberId;
                const fullName = response.body.fullName;
                const apiRole = response.body.userRole;

                localStorage.setItem("JWT", token);
                localStorage.setItem("userId", userId);
                localStorage.setItem("flexGymToken", token);
                localStorage.setItem("flexGymUserId", userId);
                if (memberId) {
                    localStorage.setItem("memberId", memberId);
                    localStorage.setItem("flexGymMemberId", memberId);
                }
                if (fullName) {
                    localStorage.setItem("userFullName", fullName);
                    localStorage.setItem("flexGymFullName", fullName);
                }

                const claims = parseJwt(token);
                let role = apiRole || (claims ? claims.role : "ROLE_MEMBER");
                let userEmail = (response.body.email) || (claims ? (claims.username || claims.sub) : email);

                localStorage.setItem("userRole", role);
                localStorage.setItem("flexGymRole", role);
                localStorage.setItem("email", userEmail);
                localStorage.setItem("flexGymEmail", userEmail);

                if (rememberMe) {
                    localStorage.setItem("flexGymRemember", "true");
                }

                console.log("Stored JWT & User Profile for:", userEmail);

                $.ajax({
                    url: "http://localhost:8080/api/users/getUser/" + userId,
                    type: "GET",
                    headers: { 'Authorization': 'Bearer ' + token },
                    success: function (userData) {
                        const u = userData && userData.body ? userData.body : userData;
                        if (u) {
                            if (u.userRole) {
                                role = u.userRole;
                                localStorage.setItem("userRole", role);
                                localStorage.setItem("flexGymRole", role);
                            }
                            if (u.memberDTO && u.memberDTO.memberId) {
                                localStorage.setItem("memberId", u.memberDTO.memberId);
                                localStorage.setItem("flexGymMemberId", u.memberDTO.memberId);
                            }
                            if (u.memberDTO && u.memberDTO.memberFullName) {
                                localStorage.setItem("userFullName", u.memberDTO.memberFullName);
                                localStorage.setItem("flexGymFullName", u.memberDTO.memberFullName);
                            }
                        }
                        isLoggingIn = false;
                        if (window.FlexAlert) {
                            FlexAlert.success("Welcome Back! ⚡", "Login successful. Redirecting to your dashboard...", { timer: 1400 }).then(() => {
                                redirectUser(role);
                            });
                        } else {
                            redirectUser(role);
                        }
                    },
                    error: function () {
                        isLoggingIn = false;
                        if (window.FlexAlert) {
                            FlexAlert.success("Welcome Back! ⚡", "Login successful. Redirecting to your dashboard...", { timer: 1400 }).then(() => {
                                redirectUser(role);
                            });
                        } else {
                            redirectUser(role);
                        }
                    }
                });
            } else {
                isLoggingIn = false;
                if (window.FlexAlert) {
                    FlexAlert.error("Authentication Error", "Authentication token was not returned by the server.");
                } else {
                    alert("Login failed: Authentication token was not returned by the server.");
                }
                btn.prop("disabled", false).text("SIGN IN TO FLEX →");
            }
        },
        error: function (response) {
            console.error("Login Error:", response);
            isLoggingIn = false;
            btn.prop("disabled", false).text("SIGN IN TO FLEX →");

            if (response.status === 401 || response.status === 403) {
                if (window.FlexAlert) {
                    FlexAlert.error("Invalid Credentials", "Incorrect email or password. Please verify your login details.");
                } else {
                    alert("Invalid Credentials");
                }
                if (messageEl.length) {
                    messageEl.addClass("show error").text("Invalid email or password.");
                }
            } else if (response.status === 404) {
                if (window.FlexAlert) {
                    FlexAlert.warning("Account Not Found", "No registered account found with this email address.");
                } else {
                    alert("No account found with this email address.");
                }
                if (messageEl.length) {
                    messageEl.addClass("show error").text("No account found with this email.");
                }
            } else {
                if (window.FlexAlert) {
                    FlexAlert.error("Connection Failed", "Unable to connect to backend server. Please verify that Spring Boot is active on port 8080.");
                } else {
                    alert("Login failed. Please verify that the backend server is running on http://localhost:8080.");
                }
                if (messageEl.length) {
                    messageEl.addClass("show error").text("Unable to connect to server.");
                }
            }
        }
    });
}

function redirectUser(role) {
    if (role === "ROLE_ADMIN") {
        window.location.href = "admin-dashboard.html";
    } else if (role === "ROLE_TRAINER") {
        window.location.href = "trainer-dashboard.html";
    } else if (role === "ROLE_RECEPTIONIST") {
        window.location.href = "receptionist-dashboard.html";
    } else {
        window.location.href = "member-dashboard.html";
    }
}

function parseJwt(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}