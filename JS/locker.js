const LockerService = {
    getAllLockers: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/lockers/getAllLockers",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllLockers success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllLockers error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getLockerById: function(lockerId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/lockers/getLocker/" + lockerId,
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

    saveLocker: function(lockerData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/lockers/saveLocker",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(lockerData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("SaveLocker success:", response);
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                console.error("SaveLocker error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateLocker: function(lockerData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/lockers/updateLocker",
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(lockerData),
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

    deleteLocker: function(lockerId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/lockers/deleteLocker/" + lockerId,
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

const EquipmentService = {
    getAllEquipments: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/equipments/getAllEquipments",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllEquipments success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllEquipments error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    saveEquipment: function(equipmentData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/equipments/saveEquipment",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(equipmentData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateEquipment: function(equipmentData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/equipments/updateEquipment",
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(equipmentData),
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

    deleteEquipment: function(equipmentId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/equipments/deleteEquipment/" + equipmentId,
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

window.LockerService = LockerService;
window.EquipmentService = EquipmentService;