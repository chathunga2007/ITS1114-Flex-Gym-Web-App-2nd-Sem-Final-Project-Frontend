(function ($) {
    'use strict';

    const BASE_URL = (window.FlexAPI && window.FlexAPI.BASE_URL) 
        ? window.FlexAPI.BASE_URL 
        : "http://localhost:8080/api";

    const state = {
        email: "",
        otp: "",
        currentStep: 1,
        isSubmitting: false,
        timerInterval: null,
        cooldownSeconds: 60
    };

    $(document).ready(function () {
        initEventListeners();
    });

    function initEventListeners() {
        $("#requestOtpForm").off("submit").on("submit", function (e) {
            e.preventDefault();
            handleSendOtp();
        });

        $("#verifyOtpForm").off("submit").on("submit", function (e) {
            e.preventDefault();
            handleVerifyOtp();
        });

        $("#btnResendOtp").off("click").on("click", function (e) {
            e.preventDefault();
            handleResendOtp();
        });

        $("#btnBackToStep1").off("click").on("click", function (e) {
            e.preventDefault();
            goToStep(1);
        });

        $("#resetPasswordForm").off("submit").on("submit", function (e) {
            e.preventDefault();
            handleResetPassword();
        });

        $("#newPasswordToggle").off("click").on("click", function () {
            togglePasswordVisibility("#newPassword", $(this));
        });

        $("#confirmPasswordToggle").off("click").on("click", function () {
            togglePasswordVisibility("#confirmNewPassword", $(this));
        });

        $("#newPassword").on("input", function () {
            checkPasswordStrength($(this).val());
        });

        $("#recoveryOtp").on("input", function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    function goToStep(step) {
        state.currentStep = step;
        clearMessage();

        $(".recovery-step").removeClass("active completed");
        $(".recovery-step-divider").removeClass("active");

        if (step === 1) {
            $("#stepIndicator1").addClass("active");
            $(".recovery-step-section").removeClass("active");
            $("#stepEmailSection").addClass("active");
            setTimeout(() => $("#recoveryEmail").focus(), 150);
        } else if (step === 2) {
            $("#stepIndicator1").addClass("completed");
            $("#stepDivider1").addClass("active");
            $("#stepIndicator2").addClass("active");
            $(".recovery-step-section").removeClass("active");
            $("#stepOtpSection").addClass("active");
            $("#displayUserEmail").text(state.email);
            setTimeout(() => $("#recoveryOtp").focus(), 150);
        } else if (step === 3) {
            $("#stepIndicator1").addClass("completed");
            $("#stepDivider1").addClass("active");
            $("#stepIndicator2").addClass("completed");
            $("#stepDivider2").addClass("active");
            $("#stepIndicator3").addClass("active");
            $(".recovery-step-section").removeClass("active");
            $("#stepResetSection").addClass("active");
            setTimeout(() => $("#newPassword").focus(), 150);
        }
    }

    function handleSendOtp() {
        if (state.isSubmitting) return;

        const email = $("#recoveryEmail").val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            showError("Please enter your registered email address.");
            $("#recoveryEmail").focus();
            return;
        }

        if (!emailRegex.test(email)) {
            showError("Please provide a valid email format (e.g. athlete@example.com).");
            $("#recoveryEmail").focus();
            return;
        }

        state.isSubmitting = true;
        const btn = $("#btnSendOtp");
        btn.prop("disabled", true).text("SENDING OTP CODE...");
        clearMessage();

        const payload = JSON.stringify({ email: email });

        $.ajax({
            url: BASE_URL + "/users/forgot-password",
            type: "POST",
            contentType: "application/json",
            data: payload,
            success: function (response) {
                console.log("[Forgot Password] Response:", response);
                state.isSubmitting = false;
                btn.prop("disabled", false).text("SEND VERIFICATION OTP →");

                if (response && response.status && response.status >= 400) {
                    showError(response.message || "User not found with this email.");
                    return;
                }

                state.email = email;
                const successMsg = (response && response.message) 
                    ? response.message 
                    : "OTP has been sent to your email.";

                if (window.FlexAlert) {
                    FlexAlert.success("OTP Sent! ✉️", successMsg, { timer: 2000 }).then(() => {
                        goToStep(2);
                        startCountdown();
                    });
                } else {
                    alert(successMsg);
                    goToStep(2);
                    startCountdown();
                }
            },
            error: function (xhr) {
                console.error("[Forgot Password] Error:", xhr);
                state.isSubmitting = false;
                btn.prop("disabled", false).text("SEND VERIFICATION OTP →");

                let errMsg = "Unable to process request. Please check if the backend server is running.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errMsg = xhr.responseJSON.message;
                } else if (xhr.status === 404) {
                    errMsg = "No account found registered with this email address.";
                }

                showError(errMsg);
            }
        });
    }

    function handleResendOtp() {
        if (state.isSubmitting || !state.email) return;

        const resendBtn = $("#btnResendOtp");
        resendBtn.prop("disabled", true).text("Sending...");

        $.ajax({
            url: BASE_URL + "/users/forgot-password",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ email: state.email }),
            success: function (response) {
                resendBtn.text("Resend OTP");
                if (response && response.status && response.status >= 400) {
                    showError(response.message || "Could not resend OTP.");
                    resendBtn.prop("disabled", false);
                    return;
                }

                if (window.FlexAlert) {
                    FlexAlert.toast("New OTP sent to your email!", "success");
                }
                startCountdown();
            },
            error: function (xhr) {
                resendBtn.prop("disabled", false).text("Resend OTP");
                const msg = (xhr.responseJSON && xhr.responseJSON.message) 
                    ? xhr.responseJSON.message 
                    : "Failed to resend OTP. Please try again.";
                showError(msg);
            }
        });
    }

    function startCountdown() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
        }

        state.cooldownSeconds = 60;
        $("#countdownContainer").show();
        $("#btnResendOtp").hide().prop("disabled", true);
        $("#countdownTimer").text(state.cooldownSeconds + "s");

        state.timerInterval = setInterval(function () {
            state.cooldownSeconds--;
            if (state.cooldownSeconds > 0) {
                $("#countdownTimer").text(state.cooldownSeconds + "s");
            } else {
                clearInterval(state.timerInterval);
                state.timerInterval = null;
                $("#countdownContainer").hide();
                $("#btnResendOtp").show().prop("disabled", false);
            }
        }, 1000);
    }

    function handleVerifyOtp() {
        if (state.isSubmitting) return;

        const otp = $("#recoveryOtp").val().trim();

        if (!otp || otp.length !== 6) {
            showError("Please enter the complete 6-digit verification PIN.");
            $("#recoveryOtp").focus();
            return;
        }

        state.isSubmitting = true;
        const btn = $("#btnVerifyOtp");
        btn.prop("disabled", true).text("VERIFYING OTP...");
        clearMessage();

        const payload = JSON.stringify({
            email: state.email,
            otp: otp
        });

        $.ajax({
            url: BASE_URL + "/users/verify-otp",
            type: "POST",
            contentType: "application/json",
            data: payload,
            success: function (response) {
                console.log("[Verify OTP] Response:", response);
                state.isSubmitting = false;
                btn.prop("disabled", false).text("VERIFY CODE & CONTINUE →");

                if (response && response.status && response.status >= 400) {
                    showError(response.message || "Invalid or expired OTP PIN.");
                    return;
                }

                state.otp = otp;
                if (state.timerInterval) {
                    clearInterval(state.timerInterval);
                }

                if (window.FlexAlert) {
                    FlexAlert.success("OTP Verified! ⚡", "Identity verified successfully. You can now reset your password.", { timer: 1600 }).then(() => {
                        goToStep(3);
                    });
                } else {
                    goToStep(3);
                }
            },
            error: function (xhr) {
                console.error("[Verify OTP] Error:", xhr);
                state.isSubmitting = false;
                btn.prop("disabled", false).text("VERIFY CODE & CONTINUE →");

                let errMsg = "Verification failed. Please check the code.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errMsg = xhr.responseJSON.message;
                } else if (xhr.status === 401) {
                    errMsg = "Invalid OTP code provided. Please double-check your code.";
                } else if (xhr.status === 400) {
                    errMsg = "OTP has expired. Please request a new code.";
                }

                showError(errMsg);
            }
        });
    }

    function handleResetPassword() {
        if (state.isSubmitting) return;

        const newPassword = $("#newPassword").val();
        const confirmPassword = $("#confirmNewPassword").val();

        if (!newPassword) {
            showError("Please enter a new password.");
            $("#newPassword").focus();
            return;
        }

        if (newPassword.length < 6) {
            showError("Password must be at least 6 characters long.");
            $("#newPassword").focus();
            return;
        }

        if (newPassword !== confirmPassword) {
            showError("Passwords do not match. Please verify both fields.");
            $("#confirmNewPassword").focus();
            return;
        }

        state.isSubmitting = true;
        const btn = $("#btnResetPassword");
        btn.prop("disabled", true).text("UPDATING PASSWORD...");
        clearMessage();

        const payload = JSON.stringify({
            email: state.email,
            otp: state.otp,
            newPassword: newPassword
        });

        $.ajax({
            url: BASE_URL + "/users/reset-password",
            type: "POST",
            contentType: "application/json",
            data: payload,
            success: function (response) {
                console.log("[Reset Password] Response:", response);
                state.isSubmitting = false;
                btn.prop("disabled", false).text("RESET PASSWORD & SIGN IN →");

                if (response && response.status && response.status >= 400) {
                    showError(response.message || "Failed to reset password.");
                    return;
                }

                const successMsg = (response && response.message) 
                    ? response.message 
                    : "Password has been reset successfully. You can now login.";

                if (window.FlexAlert) {
                    FlexAlert.success("Password Reset Successful! 🎉", successMsg, { timer: 2200 }).then(() => {
                        window.location.href = "login.html";
                    });
                } else {
                    alert(successMsg);
                    window.location.href = "login.html";
                }
            },
            error: function (xhr) {
                console.error("[Reset Password] Error:", xhr);
                state.isSubmitting = false;
                btn.prop("disabled", false).text("RESET PASSWORD & SIGN IN →");

                let errMsg = "Failed to update password. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errMsg = xhr.responseJSON.message;
                }

                showError(errMsg);
            }
        });
    }

    function checkPasswordStrength(password) {
        const bar = $("#pwdStrengthBar");
        const text = $("#pwdStrengthText");

        if (!password) {
            bar.css({ "width": "0%", "background-color": "transparent" });
            text.text("Too Short").css("color", "#777");
            return;
        }

        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) {
            bar.css({ "width": "20%", "background-color": "#ff4d4d" });
            text.text("Very Weak").css("color", "#ff4d4d");
        } else if (score === 2) {
            bar.css({ "width": "45%", "background-color": "#ff9233" });
            text.text("Weak").css("color", "#ff9233");
        } else if (score === 3) {
            bar.css({ "width": "70%", "background-color": "#ffd600" });
            text.text("Medium").css("color", "#ffd600");
        } else {
            bar.css({ "width": "100%", "background-color": "var(--accent)" });
            text.text("Strong 🔥").css("color", "var(--accent)");
        }
    }

    function togglePasswordVisibility(inputSelector, buttonEl) {
        const input = $(inputSelector);
        if (input.attr("type") === "password") {
            input.attr("type", "text");
            buttonEl.text("Hide");
        } else {
            input.attr("type", "password");
            buttonEl.text("Show");
        }
    }

    function showError(message) {
        const msgEl = $("#recoveryMessage");
        if (msgEl.length) {
            msgEl.removeClass("success").addClass("show error").text(message);
        }
        if (window.FlexAlert) {
            FlexAlert.error("Recovery Notice", message);
        }
    }

    function clearMessage() {
        const msgEl = $("#recoveryMessage");
        if (msgEl.length) {
            msgEl.removeClass("show error success").text("");
        }
    }

})(jQuery);