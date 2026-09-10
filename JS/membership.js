const MembershipService = {
    getAllMemberships: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/getAllMemberships",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllMemberships success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllMemberships error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getMembershipById: function(membershipId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/getMembership/" + membershipId,
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                console.error("GetMembershipById error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getMembershipsByMember: function(memberId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/getMembershipsByMember/" + memberId,
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetMembershipsByMember success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetMembershipsByMember error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    saveMembership: function(requestData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/saveMembership",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("SaveMembership success:", response);
                const saved = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr, status, error) {
                console.error("SaveMembership error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    updateMembership: function(membershipId, requestData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/updateMembership/" + membershipId,
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const updated = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr, status, error) {
                console.error("UpdateMembership error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    deleteMembership: function(membershipId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/deleteMembership/" + membershipId,
            type: "DELETE",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("DeleteMembership success:", response);
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr, status, error) {
                console.error("DeleteMembership error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    requestMembership: function(requestData, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/requestMembership",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("RequestMembership success:", response);
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                console.error("RequestMembership error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    approveMembership: function(membershipId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/approveMembership/" + membershipId,
            type: "PUT",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("ApproveMembership success:", response);
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                console.error("ApproveMembership error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    rejectMembership: function(membershipId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/rejectMembership/" + membershipId,
            type: "PUT",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("RejectMembership success:", response);
                if (typeof onSuccess === "function") onSuccess(response);
            },
            error: function(xhr, status, error) {
                console.error("RejectMembership error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getAllPendingMemberships: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/getAllPendingMemberships",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllPendingMemberships error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    runExpiryCheck: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/memberships/run-expiry-check",
            type: "POST",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("RunExpiryCheck success:", response);
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                console.error("RunExpiryCheck error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    }
};

window.MembershipService = MembershipService;