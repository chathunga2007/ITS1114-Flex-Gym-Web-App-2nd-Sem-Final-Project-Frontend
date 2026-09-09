/**
 * =========================================================
 * FLEX GYM - SWEETALERT2 CENTRAL ALERT & DIALOG MODULE
 * JS/alerts.js
 * =========================================================
 */

(function () {
    'use strict';

    // Theme configuration matching Flex Gym's dark aesthetic
    const FLEX_SWAL_THEME = {
        background: '#141414',
        color: '#ffffff',
        confirmButtonColor: '#c9ff00',
        cancelButtonColor: '#262626',
        denyButtonColor: '#ff4d4d',
        customClass: {
            popup: 'flex-swal-popup',
            title: 'flex-swal-title',
            htmlContainer: 'flex-swal-text',
            confirmButton: 'flex-swal-confirm-btn',
            cancelButton: 'flex-swal-cancel-btn',
            denyButton: 'flex-swal-deny-btn'
        }
    };

    /**
     * Check if SweetAlert2 is loaded
     */
    function hasSwal() {
        return typeof Swal !== 'undefined';
    }

    /**
     * Central Alert Object
     */
    const FlexAlert = {
        /**
         * Success Alert Popup
         * @param {string} title
         * @param {string} text
         * @param {Object} [options]
         * @returns {Promise}
         */
        success: function (title, text = '', options = {}) {
            if (!hasSwal()) {
                console.log(`[SUCCESS] ${title}: ${text}`);
                return Promise.resolve({ isConfirmed: true });
            }

            return Swal.fire({
                ...FLEX_SWAL_THEME,
                icon: 'success',
                iconColor: '#c9ff00',
                title: title || 'Success!',
                text: text,
                timer: options.timer !== undefined ? options.timer : 2200,
                timerProgressBar: true,
                showConfirmButton: options.showConfirmButton !== undefined ? options.showConfirmButton : true,
                confirmButtonText: options.confirmButtonText || 'OK',
                ...options
            });
        },

        /**
         * Error Alert Popup
         * @param {string} title
         * @param {string} text
         * @param {Object} [options]
         * @returns {Promise}
         */
        error: function (title, text = '', options = {}) {
            if (!hasSwal()) {
                console.error(`[ERROR] ${title}: ${text}`);
                return Promise.resolve({ isConfirmed: true });
            }

            return Swal.fire({
                ...FLEX_SWAL_THEME,
                icon: 'error',
                iconColor: '#ff4d4d',
                title: title || 'Error!',
                text: text,
                confirmButtonText: options.confirmButtonText || 'Close',
                ...options
            });
        },

        /**
         * Warning Alert Popup
         * @param {string} title
         * @param {string} text
         * @param {Object} [options]
         * @returns {Promise}
         */
        warning: function (title, text = '', options = {}) {
            if (!hasSwal()) {
                console.warn(`[WARNING] ${title}: ${text}`);
                return Promise.resolve({ isConfirmed: true });
            }

            return Swal.fire({
                ...FLEX_SWAL_THEME,
                icon: 'warning',
                iconColor: '#ffb703',
                title: title || 'Attention',
                text: text,
                confirmButtonText: options.confirmButtonText || 'Understood',
                ...options
            });
        },

        /**
         * Info Alert Popup
         * @param {string} title
         * @param {string} text
         * @param {Object} [options]
         * @returns {Promise}
         */
        info: function (title, text = '', options = {}) {
            if (!hasSwal()) {
                console.info(`[INFO] ${title}: ${text}`);
                return Promise.resolve({ isConfirmed: true });
            }

            return Swal.fire({
                ...FLEX_SWAL_THEME,
                icon: 'info',
                iconColor: '#00b4d8',
                title: title || 'Information',
                text: text,
                confirmButtonText: options.confirmButtonText || 'OK',
                ...options
            });
        },

        /**
         * Confirmation Dialog Modal
         * @param {string} title
         * @param {string} text
         * @param {string} [confirmBtnText='Yes, Proceed']
         * @param {string} [cancelBtnText='Cancel']
         * @param {Object} [options]
         * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise
         */
        confirm: function (title, text = '', confirmBtnText = 'Yes, Proceed', cancelBtnText = 'Cancel', options = {}) {
            if (!hasSwal()) {
                const confirmed = window.confirm(`${title}\n\n${text}`);
                return Promise.resolve(confirmed);
            }

            return Swal.fire({
                ...FLEX_SWAL_THEME,
                icon: options.icon || 'warning',
                iconColor: options.iconColor || (options.isDestructive ? '#ff4d4d' : '#c9ff00'),
                title: title || 'Are you sure?',
                text: text,
                showCancelButton: true,
                confirmButtonText: confirmBtnText,
                cancelButtonText: cancelBtnText,
                reverseButtons: true,
                focusCancel: true,
                ...options
            }).then((result) => {
                return result.isConfirmed;
            });
        },

        /**
         * Corner Toast Notification
         * @param {string} message
         * @param {'success'|'error'|'warning'|'info'} [type='success']
         * @param {'top-end'|'top-start'|'bottom-end'|'bottom-start'} [position='top-end']
         * @param {number} [timer=3500]
         */
        toast: function (message, type = 'success', position = 'top-end', timer = 3500) {
            if (!hasSwal()) {
                console.log(`[TOAST ${type.toUpperCase()}] ${message}`);
                return;
            }

            const iconColors = {
                success: '#c9ff00',
                error: '#ff4d4d',
                warning: '#ffb703',
                info: '#00b4d8'
            };

            const Toast = Swal.mixin({
                toast: true,
                position: position,
                showConfirmButton: false,
                timer: timer,
                timerProgressBar: true,
                background: '#161616',
                color: '#ffffff',
                customClass: {
                    popup: 'flex-swal-toast'
                },
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });

            Toast.fire({
                icon: type,
                iconColor: iconColors[type] || '#c9ff00',
                title: message
            });
        },

        /**
         * Loading Spinner Modal
         * @param {string} [title='Please Wait...']
         * @param {string} [text='Processing request']
         */
        loading: function (title = 'Please Wait...', text = 'Processing your request') {
            if (!hasSwal()) return;

            Swal.fire({
                ...FLEX_SWAL_THEME,
                title: title,
                text: text,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        },

        /**
         * Close currently open SweetAlert
         */
        close: function () {
            if (hasSwal()) {
                Swal.close();
            }
        }
    };

    // Export globally
    window.FlexAlert = FlexAlert;

    // Bridge window.showToast to FlexAlert modal popups
    window.showToast = function (message, type = 'success') {
        if (type === 'error') {
            FlexAlert.error('Error Occurred', message);
        } else if (type === 'warning') {
            FlexAlert.warning('Attention', message);
        } else if (type === 'info') {
            FlexAlert.info('Information', message);
        } else {
            FlexAlert.success('Success! 🎉', message);
        }
    };

    // Gracefully enhance window.alert so standard alert calls use SweetAlert2 modal
    const originalAlert = window.alert;
    window.alert = function (message) {
        if (hasSwal()) {
            FlexAlert.info('Flex Gym Notification', String(message));
        } else {
            originalAlert(message);
        }
    };

})();
