const PaymentService = {
    getAllPayments: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/payments/getAllPayments",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllPayments success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllPayments error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getPaymentById: function(id, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/payments/getPayment/" + id,
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

    getPaymentsByMember: function(memberId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/payments/getPaymentsByMember/" + memberId,
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetPaymentsByMember success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetPaymentsByMember error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    savePayment: function(paymentData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/payments/savePayment",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(paymentData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("SavePayment success:", response);
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                console.error("SavePayment error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deletePayment: function(id, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/payments/deletePayment/" + id,
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
    }
};

window.PaymentService = PaymentService;