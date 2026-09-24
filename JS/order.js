/**
 * Flex Gym - Order & Fulfillment Service
 * Handles order placement, member orders, tracking lookups, and admin status updates.
 */
const OrderService = {
    /**
     * Place a new store order (Supports Cash on Delivery or Card Payment)
     */
    placeOrder: function (orderData, onSuccess, onError) {
        return ajaxRequest({
            url: "/orders/placeOrder",
            method: "POST",
            data: orderData,
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Retrieve all orders for Admin Fulfillment Desk
     */
    getAllOrders: function (onSuccess, onError) {
        return ajaxRequest({
            url: "/orders/getAllOrders",
            method: "GET",
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Retrieve all orders belonging to a specific gym member
     */
    getMemberOrders: function (memberId, onSuccess, onError) {
        return ajaxRequest({
            url: "/orders/getMemberOrders/" + memberId,
            method: "GET",
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Fetch order details by Order ID
     */
    getOrderById: function (orderId, onSuccess, onError) {
        return ajaxRequest({
            url: "/orders/getOrder/" + orderId,
            method: "GET",
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Public or Member Order Tracking by Tracking Number (e.g. FLX-TRK-784920)
     */
    getOrderByTrackingNumber: function (trackingNumber, onSuccess, onError) {
        return ajaxRequest({
            url: "/orders/track/" + encodeURIComponent(trackingNumber),
            method: "GET",
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Update order status, payment status, and courier details (Admin)
     */
    updateOrderStatus: function (orderId, updateData, onSuccess, onError) {
        return ajaxRequest({
            url: "/orders/updateOrderStatus/" + orderId,
            method: "PUT",
            data: updateData,
            success: function (data) {
                if (typeof onSuccess === "function") onSuccess(data);
            },
            error: function (xhr, status, error) {
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    },

    /**
     * Display the 5-step live tracking modal for any order object.
     * Injects the tracking modal HTML into document body if not already present.
     */
    showTrackingModal: function (ord) {
        if (!ord) return;

        let modal = document.getElementById('modalOrderTracking');
        if (!modal) {
            const modalHtml = `
            <div class="modal-backdrop" id="modalOrderTracking">
              <div class="modal-box" style="max-width: 650px;">
                <div class="modal-header">
                  <div>
                    <h3 style="margin:0;">Live Order Tracking</h3>
                    <span id="trackModalOrderRef" style="font-size:12px; color:var(--lime); font-family:monospace;">#ORD-000</span>
                  </div>
                  <button class="modal-close" onclick="document.getElementById('modalOrderTracking').classList.remove('show')">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px 24px;">
                  <div style="background:var(--bg-surface-2); border:1px solid var(--border); border-radius:var(--radius-md); padding:14px 18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:20px;">
                    <div>
                      <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Courier Partner:</span>
                      <strong style="display:block; color:#fff; font-size:14px;" id="trackCourierName">Flex Express Logistics</strong>
                    </div>
                    <div style="text-align:right;">
                      <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Tracking Code:</span>
                      <span style="display:block; font-family:monospace; background:rgba(204,255,0,0.15); color:var(--lime); font-weight:800; padding:2px 8px; border-radius:4px; font-size:13px;" id="trackTrackingNumber">FLX-TRK-000000</span>
                    </div>
                  </div>

                  <div class="order-tracker-container">
                    <div class="order-stepper" id="orderTrackingStepper">
                      <div class="stepper-progress-bar" id="stepperProgressBar" style="width: 25%;"></div>
                      
                      <div class="stepper-step completed" id="step-placed">
                        <div class="stepper-circle">📝</div>
                        <span class="stepper-label">Placed</span>
                        <span class="stepper-sub" id="stepDatePlaced">Confirmed</span>
                      </div>

                      <div class="stepper-step" id="step-confirmed">
                        <div class="stepper-circle">💳</div>
                        <span class="stepper-label">Payment</span>
                        <span class="stepper-sub" id="stepPaymentSub">Verified</span>
                      </div>

                      <div class="stepper-step" id="step-processing">
                        <div class="stepper-circle">📦</div>
                        <span class="stepper-label">Packing</span>
                        <span class="stepper-sub">Warehouse</span>
                      </div>

                      <div class="stepper-step" id="step-shipped">
                        <div class="stepper-circle">🚚</div>
                        <span class="stepper-label">Dispatched</span>
                        <span class="stepper-sub">In Transit</span>
                      </div>

                      <div class="stepper-step" id="step-delivered">
                        <div class="stepper-circle">🎉</div>
                        <span class="stepper-label">Delivered</span>
                        <span class="stepper-sub">Completed</span>
                      </div>
                    </div>
                  </div>

                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; font-size:12px; margin-top:16px;">
                    <div style="background:var(--bg-surface-2); padding:12px 14px; border-radius:6px; border:1px solid var(--border);">
                      <strong style="color:#fff; display:block; margin-bottom:4px;">📍 Destination Address:</strong>
                      <span id="trackShippingAddress" style="color:var(--text-muted); line-height:1.4;">--</span>
                    </div>
                    <div style="background:var(--bg-surface-2); padding:12px 14px; border-radius:6px; border:1px solid var(--border);">
                      <strong style="color:#fff; display:block; margin-bottom:4px;">⏱️ Estimated Delivery:</strong>
                      <span id="trackEstimatedDelivery" style="color:var(--lime); font-weight:700;">2-4 Business Days</span>
                    </div>
                  </div>

                  <div style="margin-top:18px;">
                    <strong style="font-size:12px; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:8px;">Items In This Package:</strong>
                    <div id="trackItemsList" style="max-height:140px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;"></div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="document.getElementById('modalOrderTracking').classList.remove('show')">Close Tracking</button>
                </div>
              </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('modalOrderTracking');
        }

        $('#trackModalOrderRef').text('#ORD-' + ord.orderId);
        $('#trackCourierName').text(ord.courierName || 'Flex Express Logistics');
        $('#trackTrackingNumber').text(ord.trackingNumber || ('FLX-TRK-' + ord.orderId + '920'));
        $('#trackShippingAddress').text((ord.shippingAddress || 'Customer Address') + (ord.deliveryCity ? ', ' + ord.deliveryCity : ''));
        $('#trackEstimatedDelivery').text(ord.estimatedDeliveryDate || '2-4 Business Days');

        const st = (ord.orderStatus || 'PENDING').toUpperCase();
        const isPaid = ord.paymentStatus === 'PAID';

        $('.stepper-step').removeClass('completed active');
        $('#step-placed').addClass('completed');
        $('#stepDatePlaced').text(ord.orderDate ? ord.orderDate.substring(0, 10) : 'Recorded');

        let progressWidth = 20;

        if (isPaid || st !== 'PENDING') {
            $('#step-confirmed').addClass('completed');
            $('#stepPaymentSub').text(isPaid ? 'Paid' : 'COD Verified');
            progressWidth = 40;
        }

        if (st === 'PROCESSING' || st === 'SHIPPED' || st === 'DELIVERED' || st === 'COMPLETED') {
            $('#step-processing').addClass('completed');
            progressWidth = 60;
        }

        if (st === 'SHIPPED' || st === 'DELIVERED' || st === 'COMPLETED') {
            $('#step-shipped').addClass('completed');
            progressWidth = 80;
        }

        if (st === 'DELIVERED' || st === 'COMPLETED') {
            $('#step-delivered').addClass('completed active');
            progressWidth = 100;
        } else if (st === 'SHIPPED') {
            $('#step-shipped').addClass('active');
        } else if (st === 'PROCESSING') {
            $('#step-processing').addClass('active');
        } else if (st === 'CONFIRMED') {
            $('#step-confirmed').addClass('active');
        } else {
            $('#step-placed').addClass('active');
        }

        $('#stepperProgressBar').css('width', progressWidth + '%');

        const itemsList = $('#trackItemsList');
        itemsList.empty();
        if (ord.items && ord.items.length) {
            ord.items.forEach(i => {
                itemsList.append(`
                    <div style="display:flex; justify-content:space-between; background:var(--bg-surface); padding:8px 12px; border-radius:4px; border:1px solid var(--border); font-size:12px;">
                        <span>${i.productName || 'Fitness Item'} <strong>× ${i.quantity || 1}</strong></span>
                        <strong style="color:var(--lime);">Rs. ${((i.unitPrice || 0) * (i.quantity || 1)).toLocaleString()}</strong>
                    </div>
                `);
            });
        } else {
            itemsList.append(`<div style="color:var(--text-muted); font-size:12px; font-style:italic;">Order item details logged with package.</div>`);
        }

        modal.classList.add('show');
    },

    /**
     * Search and view tracking details by tracking number
     */
    trackByCode: function (trackingCode) {
        const code = String(trackingCode || '').trim();
        if (!code) {
            if (typeof AlertUtils !== 'undefined') {
                AlertUtils.warning('Tracking Number Required', 'Please enter your FLX-TRK tracking code.');
            } else {
                alert('Please enter your FLX-TRK tracking code.');
            }
            return;
        }

        if (typeof AlertUtils !== 'undefined') {
            AlertUtils.loading('Locating Package', 'Connecting to Flex Logistics Tracking Server...');
        }

        OrderService.getOrderByTrackingNumber(
            code,
            function (res) {
                if (typeof Swal !== 'undefined') Swal.close();
                const ord = (res && res.body) ? res.body : ((res && res.data) ? res.data : res);
                if (ord && (ord.orderId || ord.trackingNumber)) {
                    OrderService.showTrackingModal(ord);
                } else {
                    if (typeof AlertUtils !== 'undefined') {
                        AlertUtils.error('Not Found', 'No package found matching tracking number ' + code);
                    } else {
                        alert('No package found matching tracking number ' + code);
                    }
                }
            },
            function (xhr) {
                if (typeof Swal !== 'undefined') Swal.close();
                const msg = xhr.responseJSON?.message || 'Could not find any package with tracking code ' + code;
                if (typeof AlertUtils !== 'undefined') {
                    AlertUtils.error('Tracking Lookup Failed', msg);
                } else {
                    alert('Tracking Lookup Failed: ' + msg);
                }
            }
        );
    }
};

// Auto-bind quick track input and button if present
$(document).ready(function () {
    $('#btnQuickTrack').on('click', function () {
        const code = $('#quickTrackInput').val();
        OrderService.trackByCode(code);
    });

    $('#quickTrackInput').on('keypress', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            OrderService.trackByCode($(this).val());
        }
    });
});

window.OrderService = OrderService;