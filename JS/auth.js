
/* =========================================================
   FLEX GYM
   AUTHENTICATION
========================================================= */


/*
 * Change this when your Spring Boot backend runs
 * on another host or port.
 */
const API_BASE_URL = "http://localhost:8080/api";


/* =========================================================
   HELPER - SHOW MESSAGE
========================================================= */

function showMessage(element, message, type) {

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        element.className
            .replace(/\b(error|success|show)\b/g, "")
            .trim();

    element.classList.add("show", type);
}


/* =========================================================
   HELPER - HIDE MESSAGE
========================================================= */

function hideMessage(element) {

    if (!element) {
        return;
    }

    element.classList.remove(
        "show",
        "error",
        "success"
    );

}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

const passwordToggle =
    document.getElementById("passwordToggle");


if (passwordToggle) {

    passwordToggle.addEventListener("click", () => {

        const password =
            document.getElementById("password");

        if (!password) {
            return;
        }

        if (password.type === "password") {

            password.type = "text";

            passwordToggle.textContent = "Hide";

        } else {

            password.type = "password";

            passwordToggle.textContent = "Show";

        }

    });

}


/* =========================================================
   LOGIN
========================================================= */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document.getElementById("email").value.trim();


            const password =
                document.getElementById("password").value;


            const rememberMe =
                document.getElementById("rememberMe").checked;


            const button =
                document.getElementById("loginButton");


            const message =
                document.getElementById("authMessage");


            hideMessage(message);


            if (!email || !password) {

                showMessage(
                    message,
                    "Please enter your email and password.",
                    "error"
                );

                return;
            }


            button.disabled = true;

            button.textContent =
                "SIGNING IN...";


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Invalid email or password."
                    );

                }


                /*
                 * Expected backend response example:
                 *
                 * {
                 *   "token": "...",
                 *   "userId": 1,
                 *   "email": "...",
                 *   "userRole": "ROLE_MEMBER"
                 * }
                 *
                 * If your backend uses different names,
                 * we will adjust this section.
                 */


                const token =
                    data.token ||
                    data.accessToken ||
                    data.jwt;


                if (!token) {

                    throw new Error(
                        "Login successful, but JWT token was not returned by the server."
                    );

                }


                const storage =
                    rememberMe
                        ? localStorage
                        : sessionStorage;


                storage.setItem(
                    "flexGymToken",
                    token
                );


                if (data.userId) {

                    storage.setItem(
                        "flexGymUserId",
                        data.userId
                    );

                }


                if (data.email) {

                    storage.setItem(
                        "flexGymEmail",
                        data.email
                    );

                }


                if (data.userRole) {

                    storage.setItem(
                        "flexGymRole",
                        data.userRole
                    );

                }


                showMessage(
                    message,
                    "Login successful. Redirecting...",
                    "success"
                );


                setTimeout(() => {

                    redirectByRole(
                        data.userRole
                    );

                }, 700);


            } catch (error) {

                console.error(
                    "Login Error:",
                    error
                );


                showMessage(
                    message,
                    error.message ||
                    "Unable to connect to the server.",
                    "error"
                );


                button.disabled = false;

                button.textContent =
                    "SIGN IN TO FLEX →";

            }

        }
    );

}


/* =========================================================
   ROLE BASED REDIRECT
========================================================= */

function redirectByRole(role) {

    switch (role) {

        case "ROLE_ADMIN":
            window.location.href =
                "admin-dashboard.html";
            break;


        case "ROLE_RECEPTIONIST":
            window.location.href =
                "receptionist-dashboard.html";
            break;


        case "ROLE_TRAINER":
            window.location.href =
                "trainer-dashboard.html";
            break;


        case "ROLE_MEMBER":
            window.location.href =
                "member-dashboard.html";
            break;


        default:
            window.location.href =
                "member-dashboard.html";

    }

}


/* =========================================================
   SIGNUP
========================================================= */

const signupForm =
    document.getElementById("signupForm");


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "signupMessage"
                );


            const button =
                document.getElementById(
                    "signupButton"
                );


            hideMessage(message);


            const fullName =
                document
                    .getElementById(
                        "memberFullName"
                    )
                    .value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "memberPhoneNumber"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "signupEmail"
                    )
                    .value
                    .trim();


            const age =
                document
                    .getElementById("age")
                    .value;


            const gender =
                document
                    .getElementById("gender")
                    .value;


            const height =
                document
                    .getElementById("heightCm")
                    .value;


            const weight =
                document
                    .getElementById("weightKg")
                    .value;


            const password =
                document
                    .getElementById(
                        "signupPassword"
                    )
                    .value;


            const confirmPassword =
                document
                    .getElementById(
                        "confirmPassword"
                    )
                    .value;


            const terms =
                document
                    .getElementById("terms")
                    .checked;


            /* ---------------------------------------------
               CLIENT SIDE VALIDATION
            --------------------------------------------- */

            if (
                !fullName ||
                !phone ||
                !email ||
                !age ||
                !gender ||
                !height ||
                !weight ||
                !password ||
                !confirmPassword
            ) {

                showMessage(
                    message,
                    "Please complete all required fields.",
                    "error"
                );

                return;
            }


            if (password.length < 8) {

                showMessage(
                    message,
                    "Password must contain at least 8 characters.",
                    "error"
                );

                return;
            }


            if (password !== confirmPassword) {

                showMessage(
                    message,
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            if (!terms) {

                showMessage(
                    message,
                    "Please accept the Terms & Conditions.",
                    "error"
                );

                return;
            }


            button.disabled = true;

            button.textContent =
                "CREATING ACCOUNT...";


            try {

                /*
                 * Expected backend registration payload.
                 *
                 * We can modify this once you give me
                 * your exact AuthController / DTO.
                 */

                const requestBody = {

                    email: email,

                    password: password,

                    memberFullName: fullName,

                    memberPhoneNumber: phone,

                    age: age,

                    gender: gender,

                    heightCm: Number(height),

                    weightKg: Number(weight)

                };


                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    requestBody
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to create account."
                    );

                }


                showMessage(
                    message,
                    "Account created successfully. Redirecting to login...",
                    "success"
                );


                signupForm.reset();


                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1200);


            } catch (error) {

                console.error(
                    "Registration Error:",
                    error
                );


                showMessage(
                    message,
                    error.message ||
                    "Unable to connect to the server.",
                    "error"
                );


                button.disabled = false;

                button.textContent =
                    "CREATE MY FLEX ACCOUNT →";

            }

        }
    );

}


/* =========================================================
   PASSWORD STRENGTH
========================================================= */

const signupPassword =
    document.getElementById(
        "signupPassword"
    );


const passwordStrengthBar =
    document.getElementById(
        "passwordStrengthBar"
    );


if (
    signupPassword &&
    passwordStrengthBar
) {

    signupPassword.addEventListener(
        "input",
        () => {

            const password =
                signupPassword.value;


            let strength = 0;


            if (password.length >= 8) {
                strength++;
            }


            if (/[A-Z]/.test(password)) {
                strength++;
            }


            if (/[0-9]/.test(password)) {
                strength++;
            }


            if (
                /[^A-Za-z0-9]/.test(password)
            ) {
                strength++;
            }


            const width =
                strength * 25;


            passwordStrengthBar.style.width =
                `${width}%`;

        }
    );

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

const forgotPassword =
    document.getElementById(
        "forgotPassword"
    );


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            alert(
                "Password reset functionality can be connected to the backend email service later."
            );

        }
    );

}


/* =========================================================
   AUTH HELPERS
========================================================= */

function getAuthToken() {

    return (
        localStorage.getItem(
            "flexGymToken"
        ) ||
        sessionStorage.getItem(
            "flexGymToken"
        )
    );

}


function getCurrentRole() {

    return (
        localStorage.getItem(
            "flexGymRole"
        ) ||
        sessionStorage.getItem(
            "flexGymRole"
        )
    );

}


function logout() {

    localStorage.removeItem(
        "flexGymToken"
    );

    localStorage.removeItem(
        "flexGymUserId"
    );

    localStorage.removeItem(
        "flexGymEmail"
    );

    localStorage.removeItem(
        "flexGymRole"
    );


    sessionStorage.removeItem(
        "flexGymToken"
    );

    sessionStorage.removeItem(
        "flexGymUserId"
    );

    sessionStorage.removeItem(
        "flexGymEmail"
    );

    sessionStorage.removeItem(
        "flexGymRole"
    );


    window.location.href =
        "index.html";

}

