const WorkoutService = {
    getAllWorkoutPlans: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/workout-plans/getAllWorkoutPlans",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllWorkoutPlans success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllWorkoutPlans error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getWorkoutPlanById: function(planId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/workout-plans/getWorkoutPlan/" + planId,
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                console.error("GetWorkoutPlanById error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    saveWorkoutPlan: function(planData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/workout-plans/saveWorkoutPlan",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(planData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("SaveWorkoutPlan success:", response);
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                console.error("SaveWorkoutPlan error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateWorkoutPlan: function(planData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/workout-plans/updateWorkoutPlan",
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(planData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const updated = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr, status, error) {
                console.error("UpdateWorkoutPlan error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deleteWorkoutPlan: function(planId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/workout-plans/deleteWorkoutPlan/" + planId,
            type: "DELETE",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("DeleteWorkoutPlan success:", response);
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr, status, error) {
                console.error("DeleteWorkoutPlan error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    assignPlanToMember: function(assignmentData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/member-workout-plans/assignPlan",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(assignmentData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("AssignPlan success:", response);
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                console.error("AssignPlan error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getAllMemberWorkoutPlans: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/member-workout-plans/getAllPlans",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllMemberWorkoutPlans error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    }
};

window.WorkoutService = WorkoutService;