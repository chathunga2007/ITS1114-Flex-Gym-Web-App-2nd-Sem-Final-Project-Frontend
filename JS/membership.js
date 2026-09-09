const MembershipService = {
    getAllMemberships: function(onSuccess, onError) {
        ajaxRequest({
            url: "/memberships/getAllMemberships",
            method: "GET",
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getMembershipById: function(membershipId, onSuccess, onError) {
        ajaxRequest({
            url: `/memberships/getMembership/${membershipId}`,
            method: "GET",
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getMembershipsByMember: function(memberId, onSuccess, onError) {
        ajaxRequest({
            url: `/memberships/getMembershipsByMember/${memberId}`,
            method: "GET",
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    saveMembership: function(requestData, onSuccess, onError) {
        ajaxRequest({
            url: "/memberships/saveMembership",
            method: "POST",
            data: requestData,
            success: function(saved) {
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateMembership: function(membershipId, requestData, onSuccess, onError) {
        ajaxRequest({
            url: `/memberships/updateMembership/${membershipId}`,
            method: "PUT",
            data: requestData,
            success: function(updated) {
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deleteMembership: function(membershipId, onSuccess, onError) {
        ajaxRequest({
            url: `/memberships/deleteMembership/${membershipId}`,
            method: "DELETE",
            success: function(response) {
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    requestMembership: function(requestData, onSuccess, onError) {
        ajaxRequest({
            url: "/memberships/requestMembership",
            method: "POST",
            data: requestData,
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    approveMembership: function(membershipId, onSuccess, onError) {
        ajaxRequest({
            url: `/memberships/approveMembership/${membershipId}`,
            method: "PUT",
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    rejectMembership: function(membershipId, onSuccess, onError) {
        ajaxRequest({
            url: `/memberships/rejectMembership/${membershipId}`,
            method: "PUT",
            success: function(response) {
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getAllPendingMemberships: function(onSuccess, onError) {
        ajaxRequest({
            url: "/memberships/getAllPendingMemberships",
            method: "GET",
            success: function(list) {
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    runExpiryCheck: function(onSuccess, onError) {
        ajaxRequest({
            url: "/memberships/run-expiry-check",
            method: "POST",
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    }
};

window.MembershipService = MembershipService;