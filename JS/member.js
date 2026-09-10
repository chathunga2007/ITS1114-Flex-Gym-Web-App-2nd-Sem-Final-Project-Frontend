const MemberService = {
    // get all active gym members
    getAllMembers: function(onSuccess, onError) {
        ajaxRequest({
            url: "/members/getAllMembers",
            method: "GET",
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    // get single member details by id
    getMemberById: function(memberId, onSuccess, onError) {
        ajaxRequest({
            url: `/members/getMember/${memberId}`,
            method: "GET",
            success: function(data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    // register a new member
    saveMember: function(memberData, onSuccess, onError) {
        ajaxRequest({
            url: "/members/saveMember",
            method: "POST",
            data: memberData,
            success: function(saved) {
                if (typeof onSuccess === "function") onSuccess(saved);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    // update existing member info
    updateMember: function(memberId, memberData, onSuccess, onError) {
        ajaxRequest({
            url: `/members/updateMember/${memberId}`,
            method: "PUT",
            data: memberData,
            success: function(updated) {
                if (typeof onSuccess === "function") onSuccess(updated);
            },
            error: function(xhr) {
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    // delete member record
    deleteMember: function(memberId, onSuccess, onError) {
        ajaxRequest({
            url: `/members/deleteMember/${memberId}`,
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

window.MemberService = MemberService;