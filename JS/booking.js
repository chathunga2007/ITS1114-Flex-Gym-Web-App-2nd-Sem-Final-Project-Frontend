/**
 * Flex Gym - Personal Training Session Booking Service
 * Handles member PT reservations, trainer session schedules, and status updates.
 */
const BookingService = {
    /**
     * Book a new 1-on-1 Personal Training Session
     */
    createBooking: function (bookingData, onSuccess, onError) {
        return ajaxRequest({
            url: "/bookings/create",
            method: "POST",
            data: bookingData,
            success: function (res) {
                if (typeof onSuccess === "function") onSuccess(res);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Retrieve all PT sessions for a specific member
     */
    getMemberBookings: function (memberId, onSuccess, onError) {
        return ajaxRequest({
            url: "/bookings/member/" + memberId,
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
     * Retrieve all PT sessions assigned to a specific trainer
     */
    getTrainerBookings: function (trainerId, onSuccess, onError) {
        return ajaxRequest({
            url: "/bookings/trainer/" + trainerId,
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
     * Retrieve today's scheduled PT sessions for a trainer
     */
    getTodayTrainerBookings: function (trainerId, onSuccess, onError) {
        return ajaxRequest({
            url: "/bookings/trainer/" + trainerId + "/today",
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
     * Retrieve all PT sessions (Admin or Receptionist overview)
     */
    getAllBookings: function (onSuccess, onError) {
        return ajaxRequest({
            url: "/bookings/all",
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
     * Update booking status (SCHEDULED, CONFIRMED, COMPLETED, CANCELLED)
     */
    updateBookingStatus: function (bookingId, status, feedback, onSuccess, onError) {
        let url = "/bookings/update-status/" + bookingId + "?status=" + encodeURIComponent(status);
        if (feedback) {
            url += "&feedback=" + encodeURIComponent(feedback);
        }
        return ajaxRequest({
            url: url,
            method: "PUT",
            success: function (res) {
                if (typeof onSuccess === "function") onSuccess(res);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    }
};

window.BookingService = BookingService;
