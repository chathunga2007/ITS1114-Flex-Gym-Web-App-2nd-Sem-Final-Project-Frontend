(function (window, $) {
    "use strict";

    window.inventoryAlerts = {
        products: [],
        equipment: []
    };

    const InventoryAlerts = {
        // filter products with 5 or fewer items in stock
        setProducts: function (products) {
            if (!Array.isArray(products)) return;
            window.inventoryAlerts.products = products.filter(function (p) {
                return p.stockQuantity == null || p.stockQuantity <= 5;
            });
            this.update();
        },

        // filter broken, under-repair, or low-quantity equipment
        setEquipment: function (equipments) {
            if (!Array.isArray(equipments)) return;
            window.inventoryAlerts.equipment = equipments.filter(function (eq) {
                return (eq.quantity != null && eq.quantity <= 2) ||
                    eq.conditionStatus === 'UNDER_REPAIR' ||
                    eq.conditionStatus === 'OUT_OF_ORDER';
            });
            this.update();
        },

        // update all badges and banners across dashboard views
        update: function () {
            const lowProds = window.inventoryAlerts.products || [];
            const lowEquip = window.inventoryAlerts.equipment || [];
            const totalIssues = lowProds.length + lowEquip.length;

            // topbar notification badge counter
            const topBadge = $('#topbarAlertBadge');
            if (topBadge.length) {
                if (totalIssues > 0) {
                    topBadge.text(totalIssues).show().addClass('alert-badge-pulse');
                } else {
                    topBadge.hide().removeClass('alert-badge-pulse');
                }
            }

            // sidebar warning counters
            const prodSideBadge = $('#sidebarProductAlertBadge');
            if (prodSideBadge.length) {
                if (lowProds.length > 0) {
                    prodSideBadge.text(lowProds.length).show();
                } else {
                    prodSideBadge.hide();
                }
            }

            const equipSideBadge = $('#sidebarEquipmentAlertBadge');
            if (equipSideBadge.length) {
                if (lowEquip.length > 0) {
                    equipSideBadge.text(lowEquip.length).show();
                } else {
                    equipSideBadge.hide();
                }
            }

            // overview warning card
            const overBanner = $('#overviewAlertBanner');
            if (overBanner.length) {
                if (totalIssues > 0) {
                    $('#overviewAlertTitle').text(`⚠️ Attention Required: ${totalIssues} Inventory & Equipment Alert${totalIssues > 1 ? 's' : ''}`);
                    $('#overviewAlertDescription').text(`${lowProds.length} product(s) low on stock (≤5 units) • ${lowEquip.length} equipment unit(s) low (≤2) or needing service.`);
                    overBanner.slideDown(200);
                } else {
                    overBanner.slideUp(200);
                }
            }

            // products view banner
            const prodBanner = $('#productsLowStockBanner');
            const prodActions = $('#productsLowStockActions');
            if (prodBanner.length) {
                if (lowProds.length > 0) {
                    const names = lowProds.map(function (p) { return p.productName; }).slice(0, 3).join(', ') + (lowProds.length > 3 ? '...' : '');
                    $('#productsLowStockText').text(`Low Stock Alert (${lowProds.length} item${lowProds.length > 1 ? 's' : ''}): ${names}`);

                    if (prodActions.length) {
                        prodActions.empty();
                        if (lowProds.length === 1) {
                            const p = lowProds[0];
                            prodActions.append(`
                                <button type="button" class="btn btn-primary edit-product-btn" data-id="${p.productId}" style="font-size:11px;padding:7px 14px;background:var(--lime);color:#000;font-weight:700;">
                                    ✏️ Restock "${p.productName.length > 22 ? p.productName.substring(0, 20) + '...' : p.productName}"
                                </button>
                            `);
                        } else {
                            lowProds.slice(0, 3).forEach(function (p) {
                                prodActions.append(`
                                    <button type="button" class="btn btn-secondary edit-product-btn" data-id="${p.productId}" style="font-size:11px;padding:6px 12px;">
                                        ✏️ Restock ${p.productName.length > 16 ? p.productName.substring(0, 14) + '..' : p.productName}
                                    </button>
                                `);
                            });
                            if (lowProds.length > 3) {
                                prodActions.append(`
                                    <span style="font-size:11px;color:var(--text-muted);align-self:center;">(+${lowProds.length - 3} more)</span>
                                `);
                            }
                        }
                    }
                    prodBanner.slideDown(200);
                } else {
                    prodBanner.slideUp(200);
                }
            }

            // equipment view banner
            const equipBanner = $('#equipmentLowStockBanner');
            const equipActions = $('#equipmentLowStockActions');
            if (equipBanner.length) {
                if (lowEquip.length > 0) {
                    const names = lowEquip.map(function (e) { return e.equipmentName; }).slice(0, 3).join(', ') + (lowEquip.length > 3 ? '...' : '');
                    $('#equipmentLowStockText').text(`Equipment Attention Alert (${lowEquip.length} item${lowEquip.length > 1 ? 's' : ''}): ${names}`);

                    if (equipActions.length) {
                        equipActions.empty();
                        if (lowEquip.length === 1) {
                            const eq = lowEquip[0];
                            equipActions.append(`
                                <button type="button" class="btn btn-primary edit-equipment-btn" data-id="${eq.equipmentId}" style="font-size:11px;padding:7px 14px;background:var(--danger);color:#fff;font-weight:700;">
                                    🔧 Manage "${eq.equipmentName.length > 22 ? eq.equipmentName.substring(0, 20) + '...' : eq.equipmentName}"
                                </button>
                            `);
                        } else {
                            lowEquip.slice(0, 3).forEach(function (eq) {
                                equipActions.append(`
                                    <button type="button" class="btn btn-secondary edit-equipment-btn" data-id="${eq.equipmentId}" style="font-size:11px;padding:6px 12px;">
                                        🔧 Manage ${eq.equipmentName.length > 16 ? eq.equipmentName.substring(0, 14) + '..' : eq.equipmentName}
                                    </button>
                                `);
                            });
                            if (lowEquip.length > 3) {
                                equipActions.append(`
                                    <span style="font-size:11px;color:var(--text-muted);align-self:center;">(+${lowEquip.length - 3} more)</span>
                                `);
                            }
                        }
                    }
                    equipBanner.slideDown(200);
                } else {
                    equipBanner.slideUp(200);
                }
            }

            // topbar notification dropdown list
            const alertTotal = $('#alertDropdownTotal');
            if (alertTotal.length) {
                alertTotal.text(`${totalIssues} Issue${totalIssues === 1 ? '' : 's'}`);
            }

            const dropdownList = $('#alertDropdownList');
            if (dropdownList.length) {
                dropdownList.empty();
                if (totalIssues === 0) {
                    dropdownList.append(`
                        <div style="font-size:12px;color:var(--text-muted);text-align:center;padding:14px;">
                            All inventory and equipment levels are optimal! 🎉
                        </div>
                    `);
                } else {
                    lowProds.forEach(function (p) {
                        const isOut = (p.stockQuantity || 0) <= 0;
                        dropdownList.append(`
                            <div class="alert-item-card ${isOut ? 'danger' : 'warning'}">
                                <div>
                                    <strong style="color:var(--text-main);display:block;font-size:12px;">📦 ${p.productName}</strong>
                                    <span style="font-size:11px;color:var(--text-muted);">${isOut ? '<span style="color:var(--danger);font-weight:700;">Out of Stock (0)</span>' : `Only ${p.stockQuantity} units remaining`}</span>
                                </div>
                                <button type="button" class="btn btn-secondary edit-product-btn" data-id="${p.productId}" style="padding:3px 8px;font-size:10px;">Restock</button>
                            </div>
                        `);
                    });

                    lowEquip.forEach(function (eq) {
                        let note = `${eq.quantity != null ? eq.quantity : 0} units`;
                        let cardClass = 'warning';
                        if (eq.conditionStatus === 'OUT_OF_ORDER') {
                            note += ' • Out of Order';
                            cardClass = 'danger';
                        } else if (eq.conditionStatus === 'UNDER_REPAIR') {
                            note += ' • Under Repair';
                            cardClass = 'warning';
                        } else if ((eq.quantity || 0) <= 0) {
                            note = '0 Units Available';
                            cardClass = 'danger';
                        } else {
                            note += ' • Low Quantity';
                        }

                        dropdownList.append(`
                            <div class="alert-item-card ${cardClass}">
                                <div>
                                    <strong style="color:var(--text-main);display:block;font-size:12px;">⚙️ ${eq.equipmentName}</strong>
                                    <span style="font-size:11px;color:var(--text-muted);">${note}</span>
                                </div>
                                <button type="button" class="btn btn-secondary edit-equipment-btn" data-id="${eq.equipmentId}" style="padding:3px 8px;font-size:10px;">Manage</button>
                            </div>
                        `);
                    });
                }
            }
        },

        // bind click outside to close dropdown
        init: function () {
            $('#btnNotifications').off('click').on('click', function (e) {
                e.stopPropagation();
                $('#alertDropdown').fadeToggle(150);
            });

            $(document).off('click.alertDrop').on('click.alertDrop', function (e) {
                if (!$(e.target).closest('.topbar-alert-wrapper').length) {
                    $('#alertDropdown').fadeOut(150);
                }
            });
        }
    };

    window.InventoryAlerts = InventoryAlerts;
    window.updateUnifiedInventoryAlerts = function () {
        InventoryAlerts.update();
    };

    $(document).ready(function () {
        InventoryAlerts.init();
    });

})(window, jQuery);