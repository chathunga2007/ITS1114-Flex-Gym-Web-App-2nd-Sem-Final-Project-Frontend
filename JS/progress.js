/**
 * Flex Gym - Member Body Transformation & Fitness Progress Service
 * Tracks body weight, body fat %, muscle mass, waist/chest circumferences, BMI and milestones.
 */
const ProgressService = {
    /**
     * Record a new fitness measurement check-in
     */
    logProgress: function (progressData, onSuccess, onError) {
        return ajaxRequest({
            url: "/progress/log",
            method: "POST",
            data: progressData,
            success: function (res) {
                if (typeof onSuccess === "function") onSuccess(res);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Retrieve all logged check-in entries for a specific member
     */
    getMemberProgressHistory: function (memberId, onSuccess, onError) {
        return ajaxRequest({
            url: "/progress/member/" + memberId,
            method: "GET",
            success: function (res) {
                const data = (res && Array.isArray(res.body))
                    ? res.body
                    : ((res && Array.isArray(res.data))
                        ? res.data
                        : (Array.isArray(res) ? res : []));
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Retrieve latest single check-in entry for a member
     */
    getLatestProgress: function (memberId, onSuccess, onError) {
        return ajaxRequest({
            url: "/progress/member/" + memberId + "/latest",
            method: "GET",
            success: function (res) {
                const data = (res && res.body !== undefined) ? res.body : res;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Delete a single logged progress entry
     */
    deleteProgress: function (progressId, onSuccess, onError) {
        return ajaxRequest({
            url: "/progress/" + progressId,
            method: "DELETE",
            success: function (res) {
                if (typeof onSuccess === "function") onSuccess(res);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    }
};

window.ProgressService = ProgressService;
