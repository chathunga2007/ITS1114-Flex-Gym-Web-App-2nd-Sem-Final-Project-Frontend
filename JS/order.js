const OrderService = {
    placeOrder: function(orderData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/orders/placeOrder",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(orderData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("PlaceOrder success:", response);
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                console.error("PlaceOrder error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getAllOrders: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/orders/getAllOrders",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllOrders success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllOrders error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getMemberOrders: function(memberId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/orders/getMemberOrders/" + memberId,
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetMemberOrders success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetMemberOrders error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getOrderById: function(orderId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/orders/getOrder/" + orderId,
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
    }
};

window.OrderService = OrderService;