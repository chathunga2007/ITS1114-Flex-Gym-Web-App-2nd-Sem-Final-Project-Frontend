const TrainerService = {
    getAllTrainers: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/trainers/getAllTrainers",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllTrainers success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllTrainers error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getTrainerById: function(trainerId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/trainers/getTrainer/" + trainerId,
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                console.error("GetTrainerById error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    saveTrainer: function(trainerData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/trainers/saveTrainer",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(trainerData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("SaveTrainer success:", response);
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                console.error("SaveTrainer error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateTrainer: function(trainerData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/trainers/updateTrainer",
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(trainerData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const updated = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr, status, error) {
                console.error("UpdateTrainer error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deleteTrainer: function(trainerId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/trainers/deleteTrainer/" + trainerId,
            type: "DELETE",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("DeleteTrainer success:", response);
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr, status, error) {
                console.error("DeleteTrainer error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    }
};

window.TrainerService = TrainerService;