const PackageService = {
    getAllPackages: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/packages/getAllPackages",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllPackages success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllPackages error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getPackageById: function(packageId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/packages/getPackage/" + packageId,
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetPackageById success:", response);
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                console.error("GetPackageById error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    savePackage: function(packageData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/packages/savePackage",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(packageData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("SavePackage success:", response);
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                console.error("SavePackage error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updatePackage: function(packageData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/packages/updatePackage",
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(packageData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("UpdatePackage success:", response);
                const updated = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr, status, error) {
                console.error("UpdatePackage error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deletePackage: function(packageId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/packages/deletePackage/" + packageId,
            type: "DELETE",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("DeletePackage success:", response);
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr, status, error) {
                console.error("DeletePackage error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    }
};

window.PackageService = PackageService;