const AttendanceService = {
    scanAttendance: function(memberId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/attendance/scan",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ memberId: parseInt(memberId, 10) }),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("ScanAttendance success:", response);
                const data = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function(xhr, status, error) {
                console.error("ScanAttendance error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getAllLogs: function(onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/attendance/getAllLogs",
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetAllLogs success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetAllLogs error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getMemberAttendance: function(memberId, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/attendance/getMemberAttendance/" + memberId,
            type: "GET",
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("GetMemberAttendance success:", response);
                const list = response && response.body !== undefined ? response.body : response;
                if (typeof onSuccess === "function") onSuccess(list);
            },
            error: function(xhr, status, error) {
                console.error("GetMemberAttendance error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr);
            }
        });
    },

    getMonthlySummary: function(memberId, year, month, onSuccess, onError) {
        $.ajax({
            url: `http://localhost:8080/api/attendance/getMonthlySummary/${memberId}/${year}/${month}`,
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
    }
};

window.AttendanceService = AttendanceService;