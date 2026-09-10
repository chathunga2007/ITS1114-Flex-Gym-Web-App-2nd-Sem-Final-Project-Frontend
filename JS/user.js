const UserService = {
    getAllUsers: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/users/getAllUsers",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllUsers success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllUsers error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getUserById: function(userId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/users/getUser/" + userId,
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

    saveUser: function(userData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/users/saveUser",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(userData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("SaveUser success:", response);
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateUser: function(userData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/users/updateUser",
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(userData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const updated = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deleteUser: function(userId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/users/deleteUser/" + userId,
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

window.UserService = UserService;