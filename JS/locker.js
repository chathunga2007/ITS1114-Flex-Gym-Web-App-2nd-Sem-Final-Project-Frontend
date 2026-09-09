const LockerService = {
    getAllLockers: function(onSuccess, onError) {
        ajaxRequest({
            url: "/lockers/getAllLockers",
            method: "GET",
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getLockerById: function(lockerId, onSuccess, onError) {
        ajaxRequest({
            url: `/lockers/getLocker/${lockerId}`,
            method: "GET",
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    saveLocker: function(lockerData, onSuccess, onError) {
        ajaxRequest({
            url: "/lockers/saveLocker",
            method: "POST",
            data: lockerData,
            success: function(saved) {
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateLocker: function(lockerData, onSuccess, onError) {
        ajaxRequest({
            url: "/lockers/updateLocker",
            method: "PUT",
            data: lockerData,
            success: function(updated) {
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deleteLocker: function(lockerId, onSuccess, onError) {
        ajaxRequest({
            url: `/lockers/deleteLocker/${lockerId}`,
            method: "DELETE",
            success: function(response) {
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    }
};

const EquipmentService = {
    getAllEquipments: function(onSuccess, onError) {
        ajaxRequest({
            url: "/equipments/getAllEquipments",
            method: "GET",
            success: function(list) {
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    saveEquipment: function(equipmentData, onSuccess, onError) {
        ajaxRequest({
            url: "/equipments/saveEquipment",
            method: "POST",
            data: equipmentData,
            success: function(saved) {
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateEquipment: function(equipmentData, onSuccess, onError) {
        ajaxRequest({
            url: "/equipments/updateEquipment",
            method: "PUT",
            data: equipmentData,
            success: function(updated) {
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deleteEquipment: function(equipmentId, onSuccess, onError) {
        ajaxRequest({
            url: `/equipments/deleteEquipment/${equipmentId}`,
            method: "DELETE",
            success: function(response) {
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    }
};

window.LockerService = LockerService;
window.EquipmentService = EquipmentService;