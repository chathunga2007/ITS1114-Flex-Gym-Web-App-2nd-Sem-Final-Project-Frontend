let isSigningUp = false;

$(document).ready(function () {
    $("#signupForm").off("submit").on("submit", function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleSignup();
    });

    $("#signupPassword").on("input", function () {
        const val = $(this).val();
        let score = 0;
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        const pct = score * 25;
        $("#passwordStrengthBar").css("width", pct + "%");
    });
});

function handleSignup() {
    if (isSigningUp) {
        console.warn("Signup already in progress, duplicate request prevented.");
        return;
    }

    let fullName = $("#memberFullName").val() ? $("#memberFullName").val().trim() : "";
    let phone = $("#memberPhoneNumber").val() ? $("#memberPhoneNumber").val().trim() : "";
    let email = $("#signupEmail").val() ? $("#signupEmail").val().trim() : ($("#email").val() ? $("#email").val().trim() : "");
    let age = $("#age").val() ? $("#age").val().trim() : "25";
    let gender = $("#gender").val() ? $("#gender").val().trim() : "MALE";
    let height = $("#heightCm").val() ? parseFloat($("#heightCm").val()) : 175;
    let weight = $("#weightKg").val() ? parseFloat($("#weightKg").val()) : 70;
    let password = $("#signupPassword").val() ? $("#signupPassword").val().trim() : "";
    let confirmPassword = $("#confirmPassword").val() ? $("#confirmPassword").val().trim() : "";
    let terms = $("#terms").length ? $("#terms").is(":checked") : true;

    if (!fullName) {
        if (window.FlexAlert) {
            FlexAlert.warning("Missing Name", "Please enter your Full Name.");
        } else {
            alert("Please enter Full Name.");
        }
        $("#memberFullName").focus();
        return;
    }
    if (!phone) {
        if (window.FlexAlert) {
            FlexAlert.warning("Missing Phone", "Please enter your Phone Number.");
        } else {
            alert("Please enter Phone Number.");
        }
        $("#memberPhoneNumber").focus();
        return;
    }
    if (!email) {
        if (window.FlexAlert) {
            FlexAlert.warning("Missing Email", "Please enter your Username or Email address.");
        } else {
            alert("Please enter Username / Email.");
        }
        $("#signupEmail").focus();
        return;
    }
    if (!password) {
        if (window.FlexAlert) {
            FlexAlert.warning("Missing Password", "Please create a password.");
        } else {
            alert("Please enter Password.");
        }
        $("#signupPassword").focus();
        return;
    }
    if (password.length < 8) {
        if (window.FlexAlert) {
            FlexAlert.warning("Weak Password", "Password must contain at least 8 characters.");
        } else {
            alert("Password must contain at least 8 characters.");
        }
        $("#signupPassword").focus();
        return;
    }
    if (confirmPassword && password !== confirmPassword) {
        if (window.FlexAlert) {
            FlexAlert.warning("Password Mismatch", "Passwords do not match. Please re-enter.");
        } else {
            alert("Passwords do not match.");
        }
        $("#confirmPassword").focus();
        return;
    }
    if (!terms) {
        if (window.FlexAlert) {
            FlexAlert.warning("Terms Required", "Please accept the Flex Gym Terms & Conditions to proceed.");
        } else {
            alert("Please accept the Terms & Conditions.");
        }
        return;
    }

    isSigningUp = true;

    let payload = {
        "email": email,
        "password": password,
        "userRole": "ROLE_MEMBER",
        "status": "ACTIVE",
        "memberDTO": {
            "memberFullName": fullName,
            "memberPhoneNumber": phone,
            "email": email,
            "password": password,
            "age": String(age),
            "gender": gender,
            "heightCm": height,
            "weightKg": weight,
            "memberStatus": "ACTIVE"
        }
    };

    const btn = $("#signupButton");
    btn.prop("disabled", true).text("CREATING ACCOUNT...");

    const msgEl = $("#signupMessage");
    if (msgEl.length) {
        msgEl.removeClass("show error success").text("");
    }

    $.ajax({
        url: "http://localhost:8080/api/users/saveUser",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
        },
        success: function (response) {
            console.log("Signup Response:", response);
            isSigningUp = false;
            if (window.FlexAlert) {
                FlexAlert.success("Account Created! 🎉", "Welcome to Flex Gym! Please sign in to choose your membership package and start your journey.", { timer: 2500 }).then(() => {
                    window.location.href = "login.html";
                });
            } else {
                alert("Account created successfully! Please sign in to choose your membership package and start your fitness journey.");
                window.location.href = "login.html";
            }
        },
        error: function (response) {
            console.error("Signup Error:", response);
            isSigningUp = false;
            btn.prop("disabled", false).text("CREATE MY FLEX ACCOUNT →");

            if (response.status === 409) {
                if (window.FlexAlert) {
                    FlexAlert.warning("Account Already Exists", "An account with this email address already exists. Please sign in instead.");
                } else {
                    alert("Username / Email already exists.");
                }
                if (msgEl.length) {
                    msgEl.addClass("show error").text("An account with this email address already exists.");
                }
            } else if (response.status === 400) {
                if (window.FlexAlert) {
                    FlexAlert.error("Invalid Details", "Please verify that all fields have been entered correctly.");
                } else {
                    alert("Registration failed: Please check the entered data.");
                }
                if (msgEl.length) {
                    msgEl.addClass("show error").text("Invalid registration details provided.");
                }
            } else {
                if (window.FlexAlert) {
                    FlexAlert.error("Registration Error", "Server could not process registration. Please verify connection to http://localhost:8080.");
                } else {
                    alert("Registration failed. Please try again.");
                }
                if (msgEl.length) {
                    msgEl.addClass("show error").text("Server error during registration. Please try again.");
                }
            }
        }
    });
}