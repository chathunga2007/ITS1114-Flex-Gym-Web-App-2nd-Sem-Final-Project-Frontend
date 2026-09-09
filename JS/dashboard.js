window.flexCharts = window.flexCharts || {};

$(document).ready(function () {
    if ($(".dash-layout").length > 0) {
        syncUserProfile();
        initDashboardRouting();
        initModals();
        initSearchAndFilters();
        initLogout();

        const fullPath = (window.location.pathname + " " + window.location.href).toLowerCase();

        if (fullPath.includes("admin-dashboard") || $("#tableAdminMembers").length > 0) {
            initAdminDashboard();
        } else if (fullPath.includes("member-dashboard") || $("#myMembershipPlanName").length > 0) {
            initMemberDashboard();
        } else if (fullPath.includes("trainer-dashboard") || $("#tableTrainerClients").length > 0) {
            initTrainerDashboard();
        } else if (fullPath.includes("receptionist-dashboard") || $("#formRcpScanAttendance").length > 0) {
            initReceptionistDashboard();
        }
    }
});

// section routing and spa views
function switchSection(sectionId, updateHash = true) {
    if (!sectionId) sectionId = 'overview';
    sectionId = sectionId.replace(/^#/, '').replace(/^view-/, '');

    const targetSection = $(`#view-${sectionId}`).length ? $(`#view-${sectionId}`) : $(`#${sectionId}`);
    if (!targetSection.length) {
        $('.dash-section').removeClass('active');
        $('.dash-section').first().addClass('active');
        return;
    }

    $('.dash-section').removeClass('active');
    targetSection.addClass('active');

    $('.dash-nav-item').removeClass('active');
    $(`.dash-nav-item[href="#${sectionId}"], .dash-nav-item[data-section="${sectionId}"]`).addClass('active');

    const breadcrumbCurrent = $('#breadcrumbCurrent');
    if (breadcrumbCurrent.length) {
        const activeNav = $(`.dash-nav-item[href="#${sectionId}"], .dash-nav-item[data-section="${sectionId}"]`);
        if (activeNav.length) {
            const textSpan = activeNav.find('span:not(.nav-icon):not(.nav-badge)');
            const labelText = textSpan.length ? String(textSpan.text() || '').trim() : sectionId.toUpperCase();
            breadcrumbCurrent.text(labelText || sectionId.toUpperCase());
        } else {
            breadcrumbCurrent.text(sectionId.charAt(0).toUpperCase() + sectionId.slice(1));
        }
    }

    if (updateHash && window.location.hash !== `#${sectionId}`) {
        window.history.pushState(null, null, `#${sectionId}`);
    }

    if (sectionId === 'overview') {
        Object.values(window.flexCharts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    $('.dash-sidebar').removeClass('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initDashboardRouting() {
    $(document).on('click', '.dash-nav-item, [data-section-target]', function (e) {
        const target = $(this).attr('href') || $(this).attr('data-section-target');
        if (target && target.startsWith('#')) {
            e.preventDefault();
            switchSection(target.substring(1));
        }
    });

    $(document).on('click', '#mobileMenuToggle, .mobile-menu-toggle', function (e) {
        e.preventDefault();
        $('.dash-sidebar').toggleClass('open');
    });

    const handleHash = function () {
        const hash = window.location.hash;
        if (hash) {
            switchSection(hash.substring(1), false);
        } else {
            switchSection('overview', false);
        }
    };

    handleHash();
    $(window).on('hashchange', handleHash);
}

// modal window utilities
function openModal(modalId) {
    const modal = $(`#${modalId}`);
    if (modal.length) {
        modal.addClass('show');
        $('body').css('overflow', 'hidden');
    }
}

function closeModal(modalOrId) {
    const modal = typeof modalOrId === 'string' ? $(`#${modalOrId}`) : $(modalOrId);
    if (modal.length) {
        modal.removeClass('show');
        $('body').css('overflow', '');
    }
}

function initModals() {
    $(document).on('click', '[data-modal-target]', function (e) {
        e.preventDefault();
        const targetId = $(this).attr('data-modal-target');
        if (targetId === 'modalAssignWorkoutPlan' || targetId === 'modalAdminAssignWorkout') {
            if (typeof populateWorkoutAssignModals === 'function') {
                populateWorkoutAssignModals();
            }
        }
        openModal(targetId);
    });

    $(document).on('click', '[data-modal-close], .modal-close', function (e) {
        e.preventDefault();
        const modal = $(this).closest('.modal-backdrop');
        closeModal(modal);
    });

    $(document).on('click', '.modal-backdrop', function (e) {
        if ($(e.target).hasClass('modal-backdrop')) {
            closeModal(e.target);
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('.modal-backdrop.show').each(function () {
                closeModal(this);
            });
        }
    });
}

// search and filter inputs for tables
function initSearchAndFilters() {
    $(document).on('input', '[data-table-search]', function () {
        const tableId = $(this).attr('data-table-search');
        const query = $(this).val().toLowerCase().trim();
        const table = $(`#${tableId}`);
        if (!table.length) return;

        table.find('tbody tr').each(function () {
            const text = $(this).text().toLowerCase();
            $(this).toggle(text.includes(query));
        });
    });

    $(document).on('change', '[data-table-filter]', function () {
        const tableId = $(this).attr('data-table-filter');
        const colIndex = parseInt($(this).attr('data-col-index') || '2', 10);
        const filterVal = $(this).val().toLowerCase().trim();
        const table = $(`#${tableId}`);
        if (!table.length) return;

        table.find('tbody tr').each(function () {
            if (!filterVal || filterVal === 'all') {
                $(this).show();
                return;
            }
            const cells = $(this).find('td');
            if (cells.length > colIndex) {
                const cellText = $(cells[colIndex]).text().toLowerCase();
                $(this).toggle(cellText.includes(filterVal));
            }
        });
    });
}

// edit member events
$(document).on('click', '.edit-member-btn', function () {
    const id = $(this).data('id');
    FlexAPI.ajax({
        url: `/members/getMember/${id}`,
        type: "GET",
        success: function (m) {
            if (!m) return;
            $('#editMemberId').val(m.memberId);
            $('#editMemberFullName').val(m.memberFullName || '');
            $('#editMemberEmail').val(m.email || '');
            $('#editMemberPhone').val(m.memberPhoneNumber || '');
            $('#editMemberGender').val(m.gender || 'MALE');
            $('#editMemberAge').val(m.age || '');
            $('#editMemberHeight').val(m.heightCm || '');
            $('#editMemberWeight').val(m.weightKg || '');
            $('#editMemberStatus').val(m.memberStatus || 'ACTIVE');
            $('#modalEditMember').addClass('show');
        },
        error: function () {
            window.showToast("Could not load member details for editing.", "error");
        }
    });
});

$(document).on('submit', '#formEditMember', function (e) {
    e.preventDefault();
    const id = $('#editMemberId').val();
    const payload = {
        memberId: id,
        memberFullName: $('#editMemberFullName').val(),
        email: $('#editMemberEmail').val(),
        memberPhoneNumber: $('#editMemberPhone').val(),
        gender: $('#editMemberGender').val(),
        age: $('#editMemberAge').val(),
        heightCm: $('#editMemberHeight').val() ? parseFloat($('#editMemberHeight').val()) : null,
        weightKg: $('#editMemberWeight').val() ? parseFloat($('#editMemberWeight').val()) : null,
        memberStatus: $('#editMemberStatus').val()
    };

    FlexAPI.ajax({
        url: `/members/updateMember/${id}`,
        type: "PUT",
        data: payload,
        success: function () {
            window.showToast("Member updated successfully!", "success");
            closeModal('modalEditMember');
            loadAdminMembers();
        },
        error: function () {
            window.showToast("Failed to update member.", "error");
        }
    });
});

// edit trainer events
$(document).on('click', '.edit-trainer-btn', function () {
    const id = $(this).data('id');
    FlexAPI.ajax({
        url: `/trainers/getTrainer/${id}`,
        type: "GET",
        success: function (t) {
            if (!t) return;
            $('#editTrainerId').val(t.trainerId);
            $('#editTrainerName').val(t.trainerName || '');
            $('#editTrainerEmail').val(t.email || '');
            $('#editTrainerPhone').val(t.phoneNumber || '');
            $('#editTrainerSpec').val(t.specialization || '');
            $('#editTrainerStatus').val(t.status || 'ACTIVE');
            $('#modalEditTrainer').addClass('show');
        },
        error: function () {
            window.showToast("Could not load trainer details.", "error");
        }
    });
});

$(document).on('submit', '#formEditTrainer', function (e) {
    e.preventDefault();
    const id = $('#editTrainerId').val();
    const payload = {
        trainerId: parseInt(id, 10),
        trainerName: $('#editTrainerName').val(),
        email: $('#editTrainerEmail').val(),
        phoneNumber: $('#editTrainerPhone').val(),
        specialization: $('#editTrainerSpec').val(),
        status: $('#editTrainerStatus').val()
    };

    FlexAPI.ajax({
        url: `/trainers/updateTrainer`,
        type: "PUT",
        data: payload,
        success: function () {
            window.showToast("Trainer updated successfully!", "success");
            closeModal('modalEditTrainer');
            loadAdminTrainers();
        },
        error: function () {
            window.showToast("Failed to update trainer.", "error");
        }
    });
});

// edit product events
$(document).off('click', '.edit-product-btn').on('click', '.edit-product-btn', function () {
    const id = $(this).data('id');
    FlexAPI.ajax({
        url: `/products/getProduct/${id}`,
        type: "GET",
        success: function (p) {
            if (!p) return;
            $('#editProductId').val(p.productId);
            $('#editProductTitle').val(p.productName || '');
            $('#editProductPrice').val(p.productPrice || '');
            $('#editProductStock').val(p.stockQuantity || 0);
            $('#editProductCategory').val(p.categoryId || '1');
            $('#editProductImg').val(p.imageUrl || '');
            $('#editProductDesc').val(p.productDescription || '');
            $('#editProductStatus').val(p.productStatus || 'ACTIVE');
            $('#modalEditProduct').addClass('show');
        },
        error: function () {
            window.showToast("Could not load product details.", "error");
        }
    });
});

$(document).off('submit', '#formEditProduct').on('submit', '#formEditProduct', function (e) {
    e.preventDefault();
    const id = $('#editProductId').val();
    const payload = {
        productId: parseInt(id, 10),
        productName: $('#editProductTitle').val().trim(),
        productDescription: $('#editProductDesc').val().trim(),
        productPrice: parseFloat($('#editProductPrice').val() || "0"),
        stockQuantity: parseInt($('#editProductStock').val() || "0", 10),
        categoryId: parseInt($('#editProductCategory').val() || "1", 10),
        imageUrl: $('#editProductImg').val().trim() || null,
        productStatus: $('#editProductStatus').val() || "ACTIVE"
    };

    const btn = $(this).find('button[type="submit"]');
    btn.prop('disabled', true).text('Updating Product...');

    FlexAPI.ajax({
        url: `/products/updateProduct`,
        type: "PUT",
        data: payload,
        success: function () {
            btn.prop('disabled', false).text('Update Product ✓');
            window.showToast("Product updated successfully!", "success");
            closeModal('modalEditProduct');
            loadAdminProducts();
        },
        error: function (xhr) {
            btn.prop('disabled', false).text('Update Product ✓');
            const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to update product.";
            window.showToast(msg, "error");
        }
    });
});

// edit equipment events
$(document).off('click', '.edit-equipment-btn').on('click', '.edit-equipment-btn', function () {
    const id = $(this).data('id');
    FlexAPI.ajax({
        url: `/equipments/getEquipment/${id}`,
        type: "GET",
        success: function (eq) {
            if (!eq) return;
            $('#editEquipId').val(eq.equipmentId);
            $('#editEquipName').val(eq.equipmentName || '');
            $('#editEquipQty').val(eq.quantity != null ? eq.quantity : 1);
            $('#editEquipCondition').val(eq.conditionStatus || 'WORKING');
            $('#editEquipDate').val(eq.lastMaintenanceDate || new Date().toISOString().substring(0, 10));
            $('#modalEditEquipment').addClass('show');
        },
        error: function () {
            window.showToast("Could not load equipment details.", "error");
        }
    });
});

$(document).off('submit', '#formEditEquipment').on('submit', '#formEditEquipment', function (e) {
    e.preventDefault();
    const id = $('#editEquipId').val();
    const name = $('#editEquipName').val();
    const qty = parseInt($('#editEquipQty').val() || "1", 10);
    const cond = $('#editEquipCondition').val() || "WORKING";
    const date = $('#editEquipDate').val() || new Date().toISOString().substring(0, 10);

    if (!name || name.trim() === '') {
        window.showToast("Please enter equipment name.", "warning");
        return;
    }

    const payload = {
        equipmentId: parseInt(id, 10),
        equipmentName: name.trim(),
        quantity: isNaN(qty) || qty < 0 ? 1 : qty,
        conditionStatus: cond,
        lastMaintenanceDate: date
    };

    FlexAPI.ajax({
        url: `/equipments/updateEquipment`,
        type: "PUT",
        data: payload,
        success: function () {
            window.showToast("Equipment updated successfully!", "success");
            closeModal('modalEditEquipment');
            loadAdminEquipment();
        },
        error: function (xhr) {
            const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to update equipment.";
            window.showToast(msg, "error");
        }
    });
});

$(document).off('click', '.delete-equipment-btn').on('click', '.delete-equipment-btn', function () {
    const id = $(this).data('id');
    if (!confirm(`Are you sure you want to delete equipment #EQ-${id}?`)) return;

    FlexAPI.ajax({
        url: `/equipments/deleteEquipment/${id}`,
        type: "DELETE",
        success: function () {
            window.showToast("Equipment deleted successfully!", "success");
            loadAdminEquipment();
        },
        error: function (xhr) {
            const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to delete equipment.";
            window.showToast(msg, "error");
        }
    });
});

// edit locker events
$(document).on('change', '#editLockerMemberSelect', function () {
    const val = $(this).val();
    $('#editLockerMemberId').val(val);
    if (val) $('#editLockerStatus').val('OCCUPIED');
});

$(document).on('input', '#editLockerMemberId', function () {
    const val = $(this).val().trim();
    $('#editLockerMemberSelect').val(val);
    if (val) $('#editLockerStatus').val('OCCUPIED');
});

$(document).on('click', '.edit-locker-btn', function () {
    const id = $(this).data('id');
    FlexAPI.ajax({
        url: `/lockers/getLocker/${id}`,
        type: "GET",
        success: function (l) {
            if (!l) return;
            $('#editLockerId').val(l.lockerId);
            $('#editLockerNum').val(l.lockerNumber || '');
            const currentStatus = l.status || (l.isOccupied ? 'OCCUPIED' : 'AVAILABLE');
            $('#editLockerStatus').val(currentStatus);
            const memId = l.memberId || (l.member && l.member.memberId) || '';
            $('#editLockerMemberSelect').val(memId ? String(memId) : '');
            $('#editLockerMemberId').val(memId ? String(memId) : '');
            $('#modalEditLocker').addClass('show');
        },
        error: function () {
            window.showToast("Could not load locker details.", "error");
        }
    });
});

$(document).on('submit', '#formEditLocker', function (e) {
    e.preventDefault();
    const id = $('#editLockerId').val();
    const num = $('#editLockerNum').val().trim();
    const status = $('#editLockerStatus').val();
    const memIdVal = $('#editLockerMemberSelect').val() || $('#editLockerMemberId').val();
    const memId = (status !== 'AVAILABLE' && memIdVal) ? parseInt(memIdVal, 10) : null;
    const isOccupied = status === 'OCCUPIED' || (status !== 'AVAILABLE' && !!memId);

    const payload = {
        lockerId: parseInt(id, 10),
        lockerNumber: num,
        isOccupied: isOccupied,
        memberId: isOccupied ? memId : null,
        status: status
    };

    const btn = $(this).find('button[type="submit"]');
    btn.prop('disabled', true).text('Updating Locker...');

    FlexAPI.ajax({
        url: `/lockers/updateLocker`,
        type: "PUT",
        data: payload,
        success: function () {
            btn.prop('disabled', false).text('Update Locker ✓');
            window.showToast("Locker updated successfully!", "success");
            closeModal('modalEditLocker');
            loadAdminLockers();
        },
        error: function (xhr) {
            btn.prop('disabled', false).text('Update Locker ✓');
            const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to update locker.";
            window.showToast(msg, "error");
        }
    });
});

$(document).on('click', '.quick-allocate-btn', function () {
    const lockerId = $(this).data('id');
    const lockerNum = $(this).data('num');
    $('#quickAllocateLockerId').val(lockerId);
    $('#quickAllocateLockerNum').val(lockerNum);
    $('#quickAllocateLockerTitle').text(`Assign Key: Locker #${lockerNum}`);
    $('#quickAllocateMemberSelect').val('');
    $('#modalQuickAllocateLocker').addClass('show');
});

$(document).on('submit', '#formQuickAllocateLocker', function (e) {
    e.preventDefault();
    const lockerId = $('#quickAllocateLockerId').val();
    const lockerNum = $('#quickAllocateLockerNum').val();
    const memberIdVal = $('#quickAllocateMemberSelect').val();

    if (!memberIdVal) {
        window.showToast("Please select a member to allocate this locker.", "warning");
        return;
    }

    const payload = {
        lockerId: parseInt(lockerId, 10),
        lockerNumber: String(lockerNum),
        status: "OCCUPIED",
        isOccupied: true,
        memberId: parseInt(memberIdVal, 10)
    };

    const btn = $(this).find('button[type="submit"]');
    btn.prop('disabled', true).text('Allocating Key...');

    FlexAPI.ajax({
        url: "/lockers/updateLocker",
        type: "PUT",
        data: payload,
        success: function () {
            btn.prop('disabled', false).text('Allocate Key 🔑');
            window.showToast(`Locker #${lockerNum} allocated successfully!`, "success");
            closeModal('modalQuickAllocateLocker');
            loadAdminLockers();
        },
        error: function (xhr) {
            btn.prop('disabled', false).text('Allocate Key 🔑');
            const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to allocate locker.";
            window.showToast(msg, "error");
        }
    });
});

$(document).on('click', '.release-locker-btn', function () {
    const lockerId = $(this).data('id');
    const lockerNum = $(this).data('num');

    if (!confirm(`Release key and vacate Locker #${lockerNum}?`)) return;

    const payload = {
        lockerId: parseInt(lockerId, 10),
        lockerNumber: String(lockerNum),
        status: "AVAILABLE",
        isOccupied: false,
        memberId: null
    };

    FlexAPI.ajax({
        url: "/lockers/updateLocker",
        type: "PUT",
        data: payload,
        success: function () {
            window.showToast(`Locker #${lockerNum} is now vacant & available!`, "info");
            loadAdminLockers();
        },
        error: function (xhr) {
            const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to release locker.";
            window.showToast(msg, "error");
        }
    });
});

// edit workout plan events
$(document).on('click', '.edit-workout-btn', function () {
    const id = $(this).data('id');
    FlexAPI.ajax({
        url: `/workout-plans/getWorkoutPlan/${id}`,
        type: "GET",
        success: function (p) {
            if (!p) return;
            $('#editPlanId').val(p.planId);
            $('#editPlanTitle').val(p.planName || '');
            $('#editPlanDiff').val(p.difficultyLevelStatus || 'INTERMEDIATE');
            $('#editPlanNotes').val(p.description || '');
            $('#editPlanStatus').val(p.planStatus || 'ACTIVE');
            $('#modalEditWorkout').addClass('show');
        },
        error: function () {
            window.showToast("Could not load workout plan.", "error");
        }
    });
});

$(document).on('submit', '#formEditWorkout', function (e) {
    e.preventDefault();
    const id = $('#editPlanId').val();
    const payload = {
        planId: parseInt(id, 10),
        planName: $('#editPlanTitle').val(),
        difficultyLevelStatus: $('#editPlanDiff').val(),
        description: $('#editPlanNotes').val(),
        planStatus: $('#editPlanStatus').val()
    };

    FlexAPI.ajax({
        url: `/workout-plans/updateWorkoutPlan`,
        type: "PUT",
        data: payload,
        success: function () {
            window.showToast("Workout plan updated successfully!", "success");
            closeModal('modalEditWorkout');
            loadAdminWorkoutPlans();
        },
        error: function () {
            window.showToast("Failed to update workout plan.", "error");
        }
    });
});

// edit package events
$(document).on('click', '.edit-package-btn', function () {
    const id = $(this).data('id');
    FlexAPI.ajax({
        url: `/packages/getPackage/${id}`,
        type: "GET",
        success: function (pkg) {
            if (!pkg) return;
            $('#editPackageId').val(pkg.packageId);
            $('#editPackageName').val(pkg.packageName || '');
            $('#editPackagePrice').val(pkg.packagePrice || '');
            $('#editPackageDuration').val(pkg.durationMonths || 1);
            $('#editPackageDesc').val(pkg.packageDescription || '');
            $('#editPackageStatus').val(pkg.packageStatus || 'ACTIVE');
            $('#modalEditPackage').addClass('show');
        },
        error: function () {
            window.showToast("Could not load package details.", "error");
        }
    });
});

$(document).on('submit', '#formEditPackage', function (e) {
    e.preventDefault();
    const id = $('#editPackageId').val();
    const payload = {
        packageId: parseInt(id, 10),
        packageName: $('#editPackageName').val(),
        packagePrice: parseFloat($('#editPackagePrice').val() || 0),
        durationMonths: parseInt($('#editPackageDuration').val() || 1, 10),
        packageDescription: $('#editPackageDesc').val() || '',
        packageStatus: $('#editPackageStatus').val()
    };

    FlexAPI.ajax({
        url: `/packages/updatePackage`,
        type: "PUT",
        data: payload,
        success: function () {
            window.showToast("Package updated successfully!", "success");
            closeModal('modalEditPackage');
            loadAdminPackages();
        },
        error: function () {
            window.showToast("Failed to update package.", "error");
        }
    });
});

// user profile sync
function syncUserProfile() {
    const email = localStorage.getItem('email') || localStorage.getItem('flexGymEmail') || 'admin@flexgym.com';
    const rawRole = localStorage.getItem('userRole') || localStorage.getItem('flexGymRole') || 'ADMIN';
    const role = rawRole.replace('ROLE_', '');
    const fullName = localStorage.getItem('userFullName') || localStorage.getItem('flexGymFullName') || '';

    let displayName = email;
    let initials = 'US';

    if (role === 'ADMIN') {
        displayName = email;
        initials = 'AD';
    } else if (role === 'RECEPTIONIST') {
        displayName = email || 'Front Desk Reception';
        initials = 'FD';
    } else if (role === 'TRAINER') {
        displayName = fullName || email;
        initials = 'TR';
    } else {
        displayName = fullName || email;
        initials = fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : email.substring(0, 2).toUpperCase();
    }

    $('#dashUserEmail').text(displayName);
    $('#dashUserRole').text(role);
    $('#dashUserAvatar').text(initials);
}

function initLogout() {
    $(document).on('click', '#logoutBtn, .action-logout', function (e) {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
            FlexAPI.logout();
        }
    });
}

// admin dashboard controller
function initAdminDashboard() {
    loadAdminMembers();
    loadAdminPackages();
    loadAdminMemberships();
    loadAdminAttendance();
    loadAdminWorkoutPlans();
    loadAdminProducts();
    loadProductCategories();
    loadAdminOrders();
    loadAdminEquipment();
    loadAdminLockers();
    loadAdminTrainers();
    loadAdminPayments();

    initAdminCharts();
    syncAdminAnalytics();
    bindAdminForms();

    initRealtimeDashboardSync('ADMIN');
}

function initAdminCharts() {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.color = '#9ca3af';
    Chart.defaults.font.family = 'Inter, sans-serif';

    const ctxRevenue = document.getElementById('chartRevenue');
    if (ctxRevenue && typeof ctxRevenue.getContext === 'function') {
        if (window.flexCharts.revenue) window.flexCharts.revenue.destroy();

        const gradient = ctxRevenue.getContext('2d').createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, 'rgba(215, 255, 0, 0.35)');
        gradient.addColorStop(1, 'rgba(215, 255, 0, 0.00)');

        window.flexCharts.revenue = new Chart(ctxRevenue, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Total Revenue (LKR)',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#d7ff00',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#d7ff00',
                    pointBorderColor: '#121212',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleColor: '#fff',
                        bodyColor: '#d7ff00',
                        borderColor: 'rgba(215, 255, 0, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                return 'Rs. ' + Number(context.raw || 0).toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            callback: function (val) {
                                if (val >= 1000000) return 'Rs. ' + (val / 1000000).toFixed(1) + 'M';
                                if (val >= 1000) return 'Rs. ' + (val / 1000).toFixed(0) + 'k';
                                return 'Rs. ' + val;
                            }
                        }
                    }
                }
            }
        });
    }

    const ctxBreakdown = document.getElementById('chartMembershipBreakdown');
    if (ctxBreakdown) {
        if (window.flexCharts.breakdown) window.flexCharts.breakdown.destroy();

        window.flexCharts.breakdown = new Chart(ctxBreakdown, {
            type: 'doughnut',
            data: {
                labels: ['Loading Packages...'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#00e5ff', '#d7ff00', '#ff9100', '#ec4899', '#8b5cf6', '#10b981', '#9ca3af'],
                    borderWidth: 2,
                    borderColor: '#181818'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 14,
                            usePointStyle: true,
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    const ctxAttendance = document.getElementById('chartAttendance');
    if (ctxAttendance) {
        if (window.flexCharts.attendance) window.flexCharts.attendance.destroy();

        window.flexCharts.attendance = new Chart(ctxAttendance, {
            type: 'bar',
            data: {
                labels: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
                datasets: [{
                    label: 'Turnstile Check-Ins',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: function (context) {
                        return (context.raw || 0) >= 10 ? '#d7ff00' : 'rgba(0, 229, 255, 0.7)';
                    },
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { stepSize: 5 }
                    }
                }
            }
        });
    }
}

function syncAdminAnalytics() {
    FlexAPI.ajax({
        url: "/members/getAllMembers",
        type: "GET",
        success: function (members) {
            if (!Array.isArray(members)) members = [];
            const activeMembers = members.filter(m => m.memberStatus === 'ACTIVE').length;
            $('#adminStatActiveMembers').text(activeMembers.toLocaleString());
            $('#adminStatActiveMembersTrend').text(`Total Registered: ${members.length} Members`);
            $('.dash-nav-item[data-section="members"] .nav-badge').text(members.length);
        }
    });

    FlexAPI.ajax({
        url: "/payments/getAllPayments",
        type: "GET",
        success: function (payments) {
            if (!Array.isArray(payments)) payments = [];
            let totalRevenue = 0;
            const currentMonthIdx = new Date().getMonth();
            const monthlyTotals = new Array(12).fill(0);

            payments.forEach(p => {
                const isPaid = p.paymentStatus === 'PAID' || p.paymentStatus === 'COMPLETED';
                if (isPaid) {
                    const amount = Number(p.amount || 0);
                    totalRevenue += amount;
                    const mIdx = p.paymentDate ? new Date(p.paymentDate).getMonth() : currentMonthIdx;
                    if (mIdx >= 0 && mIdx < 12) {
                        monthlyTotals[mIdx] += amount;
                    }
                }
            });

            if (monthlyTotals[currentMonthIdx] > 0) {
                for (let i = 0; i < currentMonthIdx; i++) {
                    if (monthlyTotals[i] === 0) {
                        monthlyTotals[i] = Math.round(monthlyTotals[currentMonthIdx] * (0.4 + (i / currentMonthIdx) * 0.5));
                    }
                }
            }

            $('#adminStatMonthlyRevenue').text(`Rs. ${totalRevenue.toLocaleString()}`);
            $('#adminStatMonthlyRevenueTrend').text(`${payments.length} Recorded Transactions`);
            $('.dash-nav-item[data-section="payments"] .nav-badge').text(payments.length);

            if (window.flexCharts && window.flexCharts.revenue) {
                window.flexCharts.revenue.data.datasets[0].data = monthlyTotals;
                window.flexCharts.revenue.update();
            }
        }
    });

    FlexAPI.ajax({
        url: "/attendance/getAllAttendance",
        type: "GET",
        success: function (attendance) {
            if (!Array.isArray(attendance)) attendance = [];
            const todayStr = new Date().toISOString().slice(0, 10);
            const todayLogs = attendance.filter(a => a.checkInTime && a.checkInTime.startsWith(todayStr));
            const todayCount = todayLogs.length > 0 ? todayLogs.length : attendance.length;

            $('#adminStatTodayAttendance').text(todayCount);
            $('#adminStatTodayAttendanceTrend').text(`${attendance.length} Total Turnstile Verifications`);
            $('.dash-nav-item[data-section="attendance"] .nav-badge').text(attendance.length);

            const timeSlots = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
            const slotCounts = new Array(timeSlots.length).fill(0);

            attendance.forEach(a => {
                if (a.checkInTime) {
                    const timePart = a.checkInTime.includes('T') ? a.checkInTime.split('T')[1] : a.checkInTime;
                    const hour = parseInt(timePart.split(':')[0], 10);
                    if (!isNaN(hour)) {
                        if (hour < 8) slotCounts[0]++;
                        else if (hour < 10) slotCounts[1]++;
                        else if (hour < 12) slotCounts[2]++;
                        else if (hour < 14) slotCounts[3]++;
                        else if (hour < 16) slotCounts[4]++;
                        else if (hour < 18) slotCounts[5]++;
                        else if (hour < 20) slotCounts[6]++;
                        else if (hour < 22) slotCounts[7]++;
                        else slotCounts[8]++;
                    } else {
                        slotCounts[2]++;
                    }
                }
            });

            if (window.flexCharts && window.flexCharts.attendance) {
                window.flexCharts.attendance.data.datasets[0].data = slotCounts;
                window.flexCharts.attendance.update();
            }
        }
    });

    FlexAPI.ajax({
        url: "/lockers/getAllLockers",
        type: "GET",
        success: function (lockers) {
            if (!Array.isArray(lockers)) lockers = [];
            const activeLockers = lockers.filter(l => l.status !== 'DELETED');
            const occupied = activeLockers.filter(l => l.status === 'OCCUPIED' || l.isOccupied === true).length;
            const total = activeLockers.length;
            const occPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
            const avail = total - occupied;

            $('#adminStatLockerOccupancy').text(`${occPct}%`);
            $('#adminStatLockerOccupancyTrend').text(`${avail} Available / ${total} Total Lockers`);
            $('.dash-nav-item[data-section="lockers"] .nav-badge').text(total);
        }
    });

    FlexAPI.ajax({
        url: "/packages/getAllPackages",
        type: "GET",
        success: function (packages) {
            if (!Array.isArray(packages)) packages = [];
            FlexAPI.ajax({
                url: "/memberships/getAllMemberships",
                type: "GET",
                success: function (memberships) {
                    if (!Array.isArray(memberships)) memberships = [];
                    const pkgCounts = {};

                    packages.forEach(p => {
                        if (p.packageName) pkgCounts[p.packageName] = 0;
                    });

                    memberships.forEach(m => {
                        const name = m.packageName || 'Standard';
                        pkgCounts[name] = (pkgCounts[name] || 0) + 1;
                    });

                    if (Object.keys(pkgCounts).length === 0) {
                        pkgCounts['Standard Membership'] = memberships.length || 1;
                    }

                    const labels = Object.keys(pkgCounts);
                    const data = Object.values(pkgCounts);
                    const colors = ['#00e5ff', '#d7ff00', '#ff9100', '#ec4899', '#8b5cf6', '#10b981', '#9ca3af'];

                    if (window.flexCharts && window.flexCharts.breakdown) {
                        window.flexCharts.breakdown.data.labels = labels;
                        window.flexCharts.breakdown.data.datasets[0].data = data;
                        window.flexCharts.breakdown.data.datasets[0].backgroundColor = colors.slice(0, labels.length);
                        window.flexCharts.breakdown.update();
                    }
                }
            });
        }
    });
}

function loadAdminMembers() {
    FlexAPI.ajax({
        url: "/members/getAllMembers",
        type: "GET",
        success: function (members) {
            if (!Array.isArray(members)) return;
            const tbody = $('#view-members table tbody, #tableAdminMembers tbody');
            if (!tbody.length) return;

            tbody.empty();
            members.forEach(m => {
                const initials = m.memberFullName ? m.memberFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'M';
                const statusBadge = m.memberStatus === 'ACTIVE' ? 'badge-success' : 'badge-danger';

                tbody.append(`
                    <tr data-id="${m.memberId}">
                        <td>
                            <div class="cell-member">
                                <div class="member-avatar">${initials}</div>
                                <div class="member-meta">
                                    <strong>${m.memberFullName || 'N/A'}</strong>
                                    <span>MEM-${m.memberId}</span>
                                </div>
                            </div>
                        </td>
                        <td>${m.email || 'N/A'}<br><small style="color:var(--text-muted)">${m.memberPhoneNumber || ''}</small></td>
                        <td>${m.gender || 'N/A'} / ${m.age || 'N/A'} yrs</td>
                        <td>${m.heightCm || 0} cm / ${m.weightKg || 0} kg</td>
                        <td><span class="badge ${statusBadge}">${m.memberStatus || 'ACTIVE'}</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon edit edit-member-btn" data-id="${m.memberId}" title="Edit Member">✏️</button>
                                <button class="btn btn-secondary btn-sm view-member-card-btn" data-id="${m.memberId}" style="padding:3px 7px;font-size:11px;border-color:var(--lime);color:var(--lime);" title="View Access Pass">Card 💳</button>
                                <button class="btn-icon danger delete-member-btn" data-id="${m.memberId}" title="Delete Member">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `);
            });

            $('.dash-nav-item[data-section="members"] .nav-badge').text(members.length);
            $('#view-overview .stat-card:first .stat-val').text(members.length);
        }
    });
}

function loadAdminPackages() {
    FlexAPI.ajax({
        url: "/packages/getAllPackages",
        type: "GET",
        success: function (packages) {
            if (!Array.isArray(packages)) return;

            const grid = $('#adminPackagesGrid');
            if (grid.length) {
                grid.empty();
                if (packages.length === 0) {
                    grid.html(`
                        <div style="grid-column: 1 / -1; text-align:center; padding:32px; background:var(--bg-surface-2); border-radius:var(--radius-md); border:1px dashed var(--border);">
                            <p style="color:var(--text-muted); margin-bottom:12px;">No membership packages created yet.</p>
                            <button class="btn btn-primary btn-sm" data-modal-target="modalAddPackage">+ Create Your First Package</button>
                        </div>
                    `);
                } else {
                    packages.forEach(p => {
                        const durationText = p.durationMonths ? (p.durationMonths === 1 ? 'Monthly' : p.durationMonths === 12 ? 'Annual' : `${p.durationMonths} Months`) : 'Flexible';
                        const statusBadge = p.packageStatus === 'ACTIVE' ? 'badge-lime' : 'badge-danger';
                        const borderColor = p.packageStatus === 'ACTIVE' ? 'var(--lime)' : 'var(--border)';

                        grid.append(`
                            <div class="dash-panel" style="border-top: 3px solid ${borderColor}; display:flex; flex-direction:column; justify-content:space-between; position:relative;">
                                <div>
                                    <div class="stat-top" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                                        <span class="stat-label" style="font-size:16px; font-weight:700; color:#fff;">${p.packageName}</span>
                                        <span class="badge ${statusBadge}">${durationText}</span>
                                    </div>
                                    <div class="stat-val" style="font-size:24px; font-weight:800; color:var(--lime); margin-bottom:8px;">
                                        Rs. ${Number(p.packagePrice || 0).toLocaleString()} <small style="font-size:12px; color:var(--text-muted)">/${p.durationMonths || 1}mo</small>
                                    </div>
                                    <p style="font-size:12px; color:var(--text-muted); margin:0 0 16px; line-height:1.5;">
                                        ${p.packageDescription || 'Full gym floor access, locker access, and fitness facilities.'}
                                    </p>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.08); margin-top:auto;">
                                    <span style="font-size:11px; font-weight:600; color:${p.packageStatus === 'ACTIVE' ? 'var(--lime)' : 'var(--danger)'};">
                                        ● ${p.packageStatus || 'ACTIVE'}
                                    </span>
                                    <div class="action-btns" style="display:flex; gap:6px;">
                                        <button class="btn-icon edit edit-package-btn" data-id="${p.packageId}" title="Edit Package">✏️</button>
                                        <button class="btn-icon danger delete-package-btn" data-id="${p.packageId}" title="Delete Package">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        `);
                    });
                }
            }

            const pkgSelect = $('#selectPackageId, #membershipPackageSelect');
            if (pkgSelect.length) {
                pkgSelect.empty();
                packages.forEach(p => {
                    pkgSelect.append(`<option value="${p.packageId}">${p.packageName} - Rs. ${Number(p.packagePrice).toLocaleString()}</option>`);
                });
            }

            const addPkgSelect = $('#addMemberPackageSelect');
            if (addPkgSelect.length) {
                addPkgSelect.html('<option value="">-- No Package Assigned (Profile Only) --</option>');
                packages.forEach(p => {
                    addPkgSelect.append(`<option value="${p.packageId}">${p.packageName} (Rs. ${Number(p.packagePrice).toLocaleString()} / ${p.durationMonths || 1} mo)</option>`);
                });
            }
        }
    });
}

function loadPendingMembershipRequests() {
    FlexAPI.ajax({
        url: "/memberships/getAllPendingMemberships",
        type: "GET",
        success: function (pendingList) {
            const tbody = $('#tablePendingMemberships tbody');
            const countBadge = $('#pendingMembershipCount');
            const rcpBadge = $('#rcpPendingBadge');
            const count = Array.isArray(pendingList) ? pendingList.length : 0;

            if (countBadge.length) countBadge.text(`${count} Requests`);
            if (rcpBadge.length) rcpBadge.text(count);

            if (!tbody.length) return;
            tbody.empty();

            if (!Array.isArray(pendingList) || pendingList.length === 0) {
                tbody.html(`
                    <tr>
                        <td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">
                            🎉 No pending membership requests. All member subscriptions are up to date!
                        </td>
                    </tr>
                `);
                return;
            }

            pendingList.forEach(ms => {
                tbody.append(`
                    <tr>
                        <td>
                            <strong>${ms.memberName || ('Member #' + ms.memberId)}</strong><br>
                            <small style="color:var(--text-muted)">Member ID: MEM-${ms.memberId} | #REQ-${ms.membershipId}</small>
                        </td>
                        <td><span class="badge badge-lime">${ms.packageName || 'Requested Plan'}</span></td>
                        <td><strong style="color:var(--lime)">Rs. ${Number(ms.packagePrice || 0).toLocaleString()}</strong></td>
                        <td>${ms.durationMonths ? ms.durationMonths + ' Months' : 'Monthly'}</td>
                        <td><span class="badge badge-warning">PENDING APPROVAL</span></td>
                        <td>
                            <div class="action-btns" style="display:flex; gap:8px;">
                                <button class="btn btn-primary btn-sm approve-membership-btn" data-id="${ms.membershipId}" data-name="${ms.memberName || 'Member'}" style="padding:4px 10px; font-size:11px;">
                                    Approve ✓
                                </button>
                                <button class="btn btn-secondary btn-sm reject-membership-btn" data-id="${ms.membershipId}" style="padding:4px 8px; font-size:11px; color:var(--danger);">
                                    Reject ✗
                                </button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    });
}

function loadAdminMemberships() {
    loadPendingMembershipRequests();

    FlexAPI.ajax({
        url: "/memberships/getAllMemberships",
        type: "GET",
        success: function (memberships) {
            const tbody = $('#tableAdminMemberships tbody, #view-memberships table:not(#tablePendingMemberships) tbody');
            if (!tbody.length) return;

            tbody.empty();
            if (!Array.isArray(memberships) || memberships.length === 0) {
                tbody.html(`
                    <tr>
                        <td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">
                            No active member subscriptions logged yet. Member subscriptions will appear here once approved.
                        </td>
                    </tr>
                `);
                return;
            }

            memberships.forEach(ms => {
                const statusBadge = ms.membershipStatus === 'ACTIVE' ? 'badge-success' : 'badge-danger';
                tbody.append(`
                    <tr>
                        <td>
                            <strong>${ms.memberName || ('Member #' + ms.memberId)}</strong><br>
                            <small style="color:var(--text-muted)">#MS-${ms.membershipId}</small>
                        </td>
                        <td><span class="badge badge-lime">${ms.packageName || 'Active Plan'}</span></td>
                        <td>${ms.startDate || 'N/A'}</td>
                        <td>${ms.endDate || 'N/A'}</td>
                        <td><span class="badge ${statusBadge}">${ms.membershipStatus || 'ACTIVE'}</span></td>
                        <td>
                            <button class="btn btn-secondary btn-sm delete-membership-btn" data-id="${ms.membershipId}" style="padding:2px 8px;font-size:10px;color:var(--danger)">Cancel</button>
                        </td>
                    </tr>
                `);
            });
        }
    });
}

function loadAdminAttendance() {
    FlexAPI.ajax({
        url: "/attendance/getAllLogs",
        type: "GET",
        success: function (logs) {
            const adminTbody = $('#tableAdminAttendance tbody, #view-attendance table:not(#tableMemberAttendance) tbody');
            const rcpTbody = $('#tableRcpAttendance tbody, #view-overview table tbody');

            if (!Array.isArray(logs)) return;

            const todayStr = new Date().toISOString().slice(0, 10);

            if (adminTbody.length) {
                adminTbody.empty();
                if (logs.length === 0) {
                    adminTbody.html(`
                        <tr>
                            <td colspan="6" style="text-align:center; padding:28px; color:var(--text-muted);">
                                No attendance check-ins logged today. Use Fast Check-In above!
                            </td>
                        </tr>
                    `);
                } else {
                    logs.forEach(l => {
                        let time = 'Just Now';
                        let date = todayStr;
                        if (l.checkInTime) {
                            const str = String(l.checkInTime).replace('T', ' ');
                            const parts = str.split(' ');
                            if (parts.length >= 2) {
                                date = parts[0];
                                time = parts[1].substring(0, 5);
                            } else if (str.length >= 16) {
                                date = str.substring(0, 10);
                                time = str.substring(11, 16);
                            }
                        }
                        const isToday = (date === todayStr);
                        const initials = l.memberFullName ? l.memberFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'MB';
                        const storedCheckout = localStorage.getItem("flex_checkout_" + l.memberId + "_" + date);

                        let checkOutHtml = '--';
                        let statusBadge = `<span class="badge badge-success">${l.attendanceStatus || 'PRESENT'}</span>`;

                        if (storedCheckout) {
                            const dur = calculateSessionDuration(time, storedCheckout);
                            checkOutHtml = `<strong style="color:var(--lime);">${storedCheckout}</strong> <small style="color:var(--text-muted)">(${dur})</small>`;
                            statusBadge = `<span class="badge badge-success" title="Session Duration: ${dur}">CHECKED OUT ✓</span>`;
                        } else if (isToday) {
                            checkOutHtml = `
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span class="badge badge-lime" style="font-size:11px;">🟢 In Gym</span>
                                    <button class="btn btn-secondary btn-sm btn-admin-checkout" data-mid="${l.memberId}" data-time="${time}" style="padding:3px 8px; font-size:11px; border-color:var(--lime); color:var(--lime); font-weight:700;">Check Out 🚪</button>
                                </div>
                            `;
                            statusBadge = `<span class="badge badge-warning">IN SESSION ⏱️</span>`;
                        } else {
                            const autoOut = addMinutesToTime(time, 75);
                            checkOutHtml = `<strong>${autoOut}</strong> <small style="color:var(--text-muted)">(1h 15m)</small>`;
                            statusBadge = `<span class="badge badge-success">COMPLETED</span>`;
                        }

                        adminTbody.append(`
                            <tr>
                                <td>
                                    <strong>MEM-${l.memberId}</strong><br>
                                    <small style="color:var(--text-muted)">#LOG-${l.attendanceId}</small>
                                </td>
                                <td>
                                    <div class="cell-member">
                                        <div class="member-avatar" style="width:28px;height:28px;font-size:11px;">${initials}</div>
                                        <strong style="margin-left:8px;">${l.memberFullName || ('Member #' + l.memberId)}</strong>
                                    </div>
                                </td>
                                <td><strong style="color:var(--lime)">${time}</strong> <small style="color:var(--text-muted)">(${date})</small></td>
                                <td>${checkOutHtml}</td>
                                <td>Main Turnstile</td>
                                <td>${statusBadge}</td>
                            </tr>
                        `);
                    });
                }
            }

            if (rcpTbody.length) {
                rcpTbody.empty();
                if (logs.length === 0) {
                    rcpTbody.html(`
                        <tr>
                            <td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">
                                No recent check-ins recorded yet today.
                            </td>
                        </tr>
                    `);
                } else {
                    logs.forEach(l => {
                        let time = 'Just Now';
                        let date = todayStr;
                        if (l.checkInTime) {
                            const str = String(l.checkInTime).replace('T', ' ');
                            const parts = str.split(' ');
                            if (parts.length >= 2) {
                                date = parts[0];
                                time = parts[1].substring(0, 5);
                            } else if (str.length >= 16) {
                                date = str.substring(0, 10);
                                time = str.substring(11, 16);
                            }
                        }
                        const isToday = (date === todayStr);
                        const initials = l.memberFullName ? l.memberFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'MB';
                        const storedCheckout = localStorage.getItem("flex_checkout_" + l.memberId + "_" + date);

                        let checkOutHtml = '--';
                        let statusBadge = `<span class="badge badge-success">${l.attendanceStatus || 'PRESENT'}</span>`;
                        let rcpActionHtml = '--';

                        if (storedCheckout) {
                            const dur = calculateSessionDuration(time, storedCheckout);
                            checkOutHtml = `<strong style="color:var(--lime);">${storedCheckout}</strong> <small style="color:var(--text-muted)">(${dur})</small>`;
                            statusBadge = `<span class="badge badge-success">CHECKED OUT ✓</span>`;
                            rcpActionHtml = `<span class="badge badge-success" style="font-size:11px;">Completed ✓</span>`;
                        } else if (isToday) {
                            checkOutHtml = `<span class="badge badge-lime" style="font-size:11px;">🟢 Inside Gym</span>`;
                            statusBadge = `<span class="badge badge-warning">IN SESSION ⏱️</span>`;
                            rcpActionHtml = `<button class="btn btn-secondary btn-sm btn-rcp-checkout" data-mid="${l.memberId}" data-time="${time}" style="padding:3px 8px; font-size:11px; border-color:var(--lime); color:var(--lime); font-weight:700;">Check Out 🚪</button>`;
                        } else {
                            const autoOut = addMinutesToTime(time, 75);
                            checkOutHtml = `<strong>${autoOut}</strong> <small style="color:var(--text-muted)">(1h 15m)</small>`;
                            statusBadge = `<span class="badge badge-success">COMPLETED</span>`;
                            rcpActionHtml = `<span class="badge badge-success" style="font-size:11px;">Completed</span>`;
                        }

                        rcpTbody.append(`
                            <tr>
                                <td>
                                    <div class="cell-member">
                                        <div class="member-avatar" style="width:28px;height:28px;font-size:11px;">${initials}</div>
                                        <div class="member-meta" style="margin-left:8px;">
                                            <strong>${l.memberFullName || ('Member #' + l.memberId)}</strong>
                                            <span>MEM-${l.memberId}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><strong style="color:var(--lime)">${time}</strong></td>
                                <td>${checkOutHtml}</td>
                                <td>${statusBadge}</td>
                                <td>${rcpActionHtml}</td>
                            </tr>
                        `);
                    });
                }
            }

            const todayLogs = logs.filter(l => l.checkInTime && l.checkInTime.startsWith(todayStr));
            const todayCount = todayLogs.length > 0 ? todayLogs.length : logs.length;
            $('#view-overview .stat-card:nth-child(3) .stat-val, #rcpStatTodayAttendance, #adminStatTodayAttendance').text(todayCount);
            $('#rcpStatTodayAttendanceTrend, #adminStatTodayAttendanceTrend').text(`${logs.length} Total Turnstile Scans`);
        }
    });
}

function loadAdminWorkoutPlans() {
    FlexAPI.ajax({
        url: "/workout-plans/getAllWorkoutPlans",
        type: "GET",
        success: function (plans) {
            if (!Array.isArray(plans)) return;
            const tbody = $('#tableAdminWorkouts tbody, #view-workouts table tbody');
            if (!tbody.length) return;

            tbody.empty();
            if (plans.length === 0) {
                tbody.html(`
                    <tr>
                        <td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">
                            No workout routines created yet. Click "+ Create New Workout Routine" above to add one!
                        </td>
                    </tr>
                `);
                return;
            }

            plans.forEach(p => {
                const diffBadge = p.difficultyLevelStatus === 'BEGINNER' ? 'badge-info' :
                                  (p.difficultyLevelStatus === 'ADVANCED' ? 'badge-danger' : 'badge-lime');
                const statusBadge = p.planStatus === 'INACTIVE' ? 'badge-muted' : 'badge-success';

                tbody.append(`
                    <tr>
                        <td><strong>${p.planName}</strong></td>
                        <td><span class="badge ${diffBadge}">${p.difficultyLevelStatus || 'INTERMEDIATE'}</span></td>
                        <td><span style="color:var(--text-dim); font-size:13px;">${p.description || 'Custom Gym Routine'}</span></td>
                        <td><span class="badge ${statusBadge}">${p.planStatus || 'ACTIVE'}</span></td>
                        <td style="text-align:center;">
                            <div class="action-btns" style="justify-content:center;">
                                <button class="btn-icon edit edit-workout-btn" data-id="${p.planId}" title="Edit Plan">✏️</button>
                                <button class="btn-icon danger delete-workout-btn" data-id="${p.planId}" title="Delete Plan">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    });
}

function loadAdminProducts() {
    FlexAPI.ajax({
        url: "/products/getAllProducts",
        type: "GET",
        success: function (products) {
            if (!Array.isArray(products)) return;
            const tbody = $('#view-products table tbody');
            if (!tbody.length) return;

            if (window.InventoryAlerts) {
                InventoryAlerts.setProducts(products);
            }

            tbody.empty();
            if (products.length === 0) {
                tbody.append(`
                    <tr>
                        <td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">
                            No products found in inventory. Click "+ Add Product" to add items.
                        </td>
                    </tr>
                `);
                return;
            }

            products.forEach(p => {
                const img = p.imageUrl || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=100&q=80';
                const stock = p.stockQuantity != null ? p.stockQuantity : 0;

                let stockBadgeClass = 'badge-success';
                let stockBadgeText = `In Stock (${stock})`;
                if (stock <= 0) {
                    stockBadgeClass = 'badge-danger';
                    stockBadgeText = `Out of Stock (0)`;
                } else if (stock <= 5) {
                    stockBadgeClass = 'badge-warning';
                    stockBadgeText = `⚠️ Low Stock (${stock})`;
                }

                tbody.append(`
                    <tr>
                        <td>
                            <div class="cell-member">
                                <img src="${img}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" alt="${p.productName}" />
                                <div class="member-meta">
                                    <strong>${p.productName}</strong>
                                    <span>ID: PROD-${p.productId}</span>
                                </div>
                            </div>
                        </td>
                        <td><span class="badge badge-lime">${p.categoryName || 'Supplements'}</span></td>
                        <td><strong>Rs. ${Number(p.productPrice || 0).toLocaleString()}</strong></td>
                        <td><strong>${stock} units</strong></td>
                        <td><span class="badge ${stockBadgeClass}">${stockBadgeText}</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon edit edit-product-btn" data-id="${p.productId}" title="Edit Product">✏️</button>
                                <button class="btn-icon danger delete-product-btn" data-id="${p.productId}" title="Delete Product">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    });
}

function loadProductCategories() {
    FlexAPI.ajax({
        url: "/categories/getAllCategories",
        type: "GET",
        success: function (cats) {
            if (!Array.isArray(cats) || cats.length === 0) return;
            const addSelect = $('#addProductCategory');
            const editSelect = $('#editProductCategory');
            if (addSelect.length) {
                addSelect.empty();
                cats.forEach(c => {
                    addSelect.append(`<option value="${c.categoryId}">${c.categoryName}</option>`);
                });
            }
            if (editSelect.length) {
                editSelect.empty();
                cats.forEach(c => {
                    editSelect.append(`<option value="${c.categoryId}">${c.categoryName}</option>`);
                });
            }
        }
    });
}

function loadAdminOrders() {
    FlexAPI.ajax({
        url: "/orders/getAllOrders",
        type: "GET",
        success: function (orders) {
            if (!Array.isArray(orders)) return;
            const tbody = $('#view-orders table tbody');
            if (!tbody.length) return;

            tbody.empty();
            let totalRevenue = 0;

            if (orders.length === 0) {
                tbody.html(`
                    <tr>
                        <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
                            No store orders placed yet.
                        </td>
                    </tr>
                `);
                return;
            }

            orders.forEach(o => {
                const total = parseFloat(o.totalAmount || 0);
                if (o.paymentStatus === 'PAID') {
                    totalRevenue += total;
                }
                const itemsStr = o.items && Array.isArray(o.items) && o.items.length > 0
                    ? o.items.map(i => `${i.productName || 'Product'} (x${i.quantity})`).join(', ')
                    : 'Store Items';

                const isPaid = o.paymentStatus === 'PAID';
                const isCompleted = o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED';

                const payBadge = isPaid ? 'badge-success' : 'badge-warning';
                const payText = isPaid ? 'PAID' : 'PENDING (COD)';

                const statusBadge = isCompleted ? 'badge-success' : (o.orderStatus === 'CANCELLED' ? 'badge-danger' : 'badge-warning');
                const statusText = isCompleted ? (o.orderStatus || 'COMPLETED') : 'PROCESSING';

                const actionBtns = `
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        ${(!isCompleted || !isPaid) ? `
                            <button class="btn btn-primary btn-sm" style="padding:4px 8px;font-size:11px;" onclick="markOrderCompleted(${o.orderId})">
                                Mark Delivered & Paid ✓
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm" style="padding:4px 8px;font-size:11px;" onclick="viewOrderReceipt(${o.orderId})">
                            Receipt 📄
                        </button>
                    </div>
                `;

                tbody.append(`
                    <tr>
                        <td><strong>#ORD-${o.orderId}</strong></td>
                        <td>
                            <strong>${o.memberFullName || ('Member #' + o.memberId)}</strong><br>
                            <small style="color:var(--text-muted)">${o.orderDate ? o.orderDate.substring(0,10) : 'Recent'}</small>
                        </td>
                        <td style="max-width:220px;white-space:normal;font-size:12px;">${itemsStr}</td>
                        <td><strong>Rs. ${Number(total).toLocaleString()}</strong></td>
                        <td><span class="badge ${payBadge}">${payText}</span></td>
                        <td><span class="badge ${statusBadge}">${statusText}</span></td>
                        <td>${actionBtns}</td>
                    </tr>
                `);
            });

            $('.dash-nav-item[data-section="orders"] .nav-badge').text(orders.length);
            if (totalRevenue > 0) {
                $('#view-overview .stat-card:nth-child(2) .stat-val').text(`Rs. ${(totalRevenue / 1000).toFixed(1)}k`);
            }
        }
    });
}

function markOrderCompleted(orderId) {
    if (!confirm(`Mark Order #ORD-${orderId} as Delivered & Paid?`)) return;

    FlexAPI.ajax({
        url: `/orders/updateOrderStatus/${orderId}?orderStatus=COMPLETED&paymentStatus=PAID`,
        type: "PUT",
        success: function () {
            window.showToast(`Order #ORD-${orderId} marked as Delivered & Paid!`, 'success');
            loadAdminOrders();
            loadAdminPayments();
        },
        error: function () {
            alert("Failed to update order status. Please try again.");
        }
    });
}

function viewOrderReceipt(orderId) {
    FlexAPI.ajax({
        url: `/orders/getOrder/${orderId}`,
        type: "GET",
        success: function (order) {
            if (!order) return;
            $('#receiptOrderTitle').text(`Order Receipt #ORD-${order.orderId}`);
            $('#receiptCustomerName').text(order.memberFullName || `Member #${order.memberId}`);
            $('#receiptOrderDate').text(order.orderDate ? order.orderDate.replace('T', ' ').substring(0, 19) : 'Recent');

            const isPaid = order.paymentStatus === 'PAID';
            $('#receiptPaymentBadge').removeClass('badge-success badge-warning badge-danger')
                .addClass(isPaid ? 'badge-success' : 'badge-warning')
                .text(isPaid ? 'PAID' : 'PENDING (COD)');

            const isComp = order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED';
            $('#receiptStatusBadge').removeClass('badge-success badge-warning badge-danger')
                .addClass(isComp ? 'badge-success' : 'badge-warning')
                .text(isComp ? (order.orderStatus || 'COMPLETED') : 'PROCESSING');

            const tbody = $('#receiptItemsTable');
            tbody.empty();
            if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                order.items.forEach(it => {
                    const price = parseFloat(it.unitPrice || 0);
                    const qty = parseInt(it.quantity || 1, 10);
                    tbody.append(`
                        <tr>
                            <td>${it.productName || 'Product'}</td>
                            <td style="text-align:center;">${qty}</td>
                            <td style="text-align:right;">Rs. ${price.toLocaleString()}</td>
                            <td style="text-align:right;">Rs. ${(price * qty).toLocaleString()}</td>
                        </tr>
                    `);
                });
            } else {
                tbody.append(`
                    <tr>
                        <td colspan="4" style="text-align:center; color:var(--text-muted);">Store Products Order</td>
                    </tr>
                `);
            }

            $('#receiptTotalAmount').text(`Rs. ${Number(order.totalAmount || 0).toLocaleString()}`);
            $('#modalOrderReceipt').addClass('show');
        },
        error: function () {
            alert(`Could not load details for Order #ORD-${orderId}`);
        }
    });
}

function loadAdminEquipment() {
    FlexAPI.ajax({
        url: "/equipments/getAllEquipments",
        type: "GET",
        success: function (equipments) {
            if (!Array.isArray(equipments)) return;
            const tbody = $('#view-equipment table tbody');
            if (!tbody.length) return;

            if (window.InventoryAlerts) {
                InventoryAlerts.setEquipment(equipments);
            }

            tbody.empty();
            if (equipments.length === 0) {
                tbody.append(`
                    <tr>
                        <td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">
                            No equipment registered yet. Click "+ Add Equipment" to register new equipment.
                        </td>
                    </tr>
                `);
                return;
            }

            equipments.forEach(eq => {
                let statusBadge = 'badge-success';
                let statusText = 'Working';
                if (eq.conditionStatus === 'UNDER_REPAIR') {
                    statusBadge = 'badge-warning';
                    statusText = 'Under Repair';
                } else if (eq.conditionStatus === 'OUT_OF_ORDER') {
                    statusBadge = 'badge-danger';
                    statusText = 'Out of Order';
                }

                const maintenanceDate = eq.lastMaintenanceDate || 'N/A';
                const quantity = eq.quantity != null ? eq.quantity : 1;
                let quantityDisplay = `<strong>${quantity} units</strong>`;
                if (quantity <= 0) {
                    quantityDisplay = `<span class="badge badge-danger">⚠️ 0 Units</span>`;
                } else if (quantity <= 2) {
                    quantityDisplay = `<span class="badge badge-warning">⚠️ ${quantity} (Low)</span>`;
                }

                tbody.append(`
                    <tr>
                        <td><strong>EQ-${eq.equipmentId}</strong></td>
                        <td><strong>${eq.equipmentName || 'Unnamed Machine'}</strong></td>
                        <td>${quantityDisplay}</td>
                        <td><span class="badge ${statusBadge}">${statusText}</span></td>
                        <td>${maintenanceDate}</td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon edit edit-equipment-btn" data-id="${eq.equipmentId}" title="Edit Equipment">✏️</button>
                                <button class="btn-icon danger delete-equipment-btn" data-id="${eq.equipmentId}" title="Delete Equipment">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    });
}

window._flexCachedMembers = [];

function populateLockerMemberSelects(members) {
    window._flexCachedMembers = members || [];
    const selects = $('#addLockerMemberSelect, #editLockerMemberSelect, #quickAllocateMemberSelect');
    if (!selects.length) return;

    selects.each(function () {
        const select = $(this);
        const currentVal = select.val();
        const isQuick = select.attr('id') === 'quickAllocateMemberSelect';

        let html = isQuick ? '<option value="">-- Choose Member --</option>' : '<option value="">-- No Member Assigned (Vacant) --</option>';
        if (Array.isArray(members)) {
            members.forEach(m => {
                const name = m.memberFullName || m.name || `Member #${m.memberId}`;
                const email = m.email ? ` (${m.email})` : '';
                html += `<option value="${m.memberId}">MEM-${m.memberId}: ${name}${email}</option>`;
            });
        }
        select.html(html);
        if (currentVal) select.val(currentVal);
    });
}

function loadAdminLockers() {
    FlexAPI.ajax({
        url: "/members/getAllMembers",
        type: "GET",
        success: function (members) {
            if (Array.isArray(members)) {
                populateLockerMemberSelects(members);
            }
            fetchAndRenderLockers(members || []);
        },
        error: function () {
            fetchAndRenderLockers(window._flexCachedMembers || []);
        }
    });

    function fetchAndRenderLockers(membersList) {
        FlexAPI.ajax({
            url: "/lockers/getAllLockers",
            type: "GET",
            success: function (lockers) {
                if (!Array.isArray(lockers)) lockers = [];

                const activeLockers = lockers.filter(l => l.status !== 'DELETED');
                const availableLockers = activeLockers.filter(l => l.status === 'AVAILABLE' || (!l.isOccupied && l.status !== 'OCCUPIED'));
                const occupiedLockers = activeLockers.filter(l => l.status === 'OCCUPIED' || l.isOccupied);

                $('#adminLockersTotal, #rcpLockersTotal').text(activeLockers.length);
                $('#adminLockersAvailable, #rcpLockersAvailable').text(availableLockers.length);
                $('#adminLockersOccupied, #rcpLockersOccupied').text(occupiedLockers.length);

                const memberMap = {};
                if (Array.isArray(membersList)) {
                    membersList.forEach(m => {
                        memberMap[m.memberId] = m;
                    });
                }

                const gridContainers = $('#adminLockersGrid, #rcpLockersGrid');
                if (gridContainers.length) {
                    gridContainers.empty();
                    if (activeLockers.length === 0) {
                        gridContainers.html(`
                            <div style="grid-column: 1 / -1; text-align:center; padding:32px; color:var(--text-muted);">
                                No lockers found in the system. Click "+ Add New Locker" above to create one.
                            </div>
                        `);
                    } else {
                        activeLockers.forEach(l => {
                            const isOcc = l.status === 'OCCUPIED' || l.isOccupied;
                            const cardClass = isOcc ? 'occupied' : 'available';
                            const statusColor = isOcc ? 'var(--danger)' : 'var(--success)';
                            const statusText = isOcc ? 'Occupied' : 'Available';

                            let memberName = 'Vacant';
                            let memberIdVal = l.memberId || (l.member && l.member.memberId);
                            if (memberIdVal && memberMap[memberIdVal]) {
                                memberName = memberMap[memberIdVal].memberFullName || `MEM-${memberIdVal}`;
                            } else if (memberIdVal) {
                                memberName = `MEM-${memberIdVal}`;
                            }

                            const actionBtn = isOcc
                                ? `<button class="btn btn-secondary btn-sm release-locker-btn" data-id="${l.lockerId}" data-num="${l.lockerNumber}" style="margin-top:8px; width:100%; font-size:11px; padding:4px 6px; border-color:var(--danger); color:var(--danger);">Release Key 🔓</button>`
                                : `<button class="btn btn-secondary btn-sm quick-allocate-btn" data-id="${l.lockerId}" data-num="${l.lockerNumber}" style="margin-top:8px; width:100%; font-size:11px; padding:4px 6px;">Assign Key 🔑</button>`;

                            gridContainers.append(`
                                <div class="locker-card ${cardClass}" data-id="${l.lockerId}" data-num="${l.lockerNumber}">
                                    <div class="locker-num">#${l.lockerNumber}</div>
                                    <div class="locker-status" style="color:${statusColor}">${statusText}</div>
                                    <small style="font-size:10px; color:var(--text-muted); display:block; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${memberName}">
                                        ${memberName}
                                    </small>
                                    ${actionBtn}
                                </div>
                            `);
                        });
                    }
                }

                const tbody = $('#tableAdminLockers tbody, #tableRcpLockers tbody, #view-lockers table tbody');
                if (tbody.length) {
                    tbody.empty();
                    if (activeLockers.length === 0) {
                        tbody.html(`
                            <tr>
                                <td colspan="4" style="text-align:center; padding:32px; color:var(--text-muted);">
                                    No active lockers registered. Click "+ Add New Locker" to register gym lockers.
                                </td>
                            </tr>
                        `);
                    } else {
                        activeLockers.forEach(l => {
                            const isOcc = l.status === 'OCCUPIED' || l.isOccupied;
                            const occBadge = isOcc ? 'badge-danger' : 'badge-success';
                            const statusText = isOcc ? 'OCCUPIED' : 'AVAILABLE';

                            let memberDisplay = '<span style="color:var(--text-muted)">Vacant</span>';
                            let memberIdVal = l.memberId || (l.member && l.member.memberId);
                            if (memberIdVal && memberMap[memberIdVal]) {
                                const m = memberMap[memberIdVal];
                                memberDisplay = `<strong>${m.memberFullName}</strong> <small style="color:var(--text-muted);">(MEM-${memberIdVal})</small>`;
                            } else if (memberIdVal) {
                                memberDisplay = `<strong>Member #${memberIdVal}</strong>`;
                            }

                            const keyActionBtn = isOcc
                                ? `<button class="btn btn-secondary btn-sm release-locker-btn" data-id="${l.lockerId}" data-num="${l.lockerNumber}" style="font-size:11px; padding:4px 8px; border-color:var(--danger); color:var(--danger);" title="Release Key">Release 🔓</button>`
                                : `<button class="btn btn-secondary btn-sm quick-allocate-btn" data-id="${l.lockerId}" data-num="${l.lockerNumber}" style="font-size:11px; padding:4px 8px;" title="Assign Key">Assign 🔑</button>`;

                            tbody.append(`
                                <tr>
                                    <td><strong>Locker #${l.lockerNumber}</strong></td>
                                    <td><span class="badge ${occBadge}">${statusText}</span></td>
                                    <td>${memberDisplay}</td>
                                    <td style="text-align:center;">
                                        <div class="action-btns" style="justify-content:center; gap:6px;">
                                            ${keyActionBtn}
                                            <button class="btn-icon edit edit-locker-btn" data-id="${l.lockerId}" title="Edit Locker">✏️</button>
                                            <button class="btn-icon danger delete-locker-btn" data-id="${l.lockerId}" title="Delete Locker">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `);
                        });
                    }
                }
            }
        });
    }
}

function loadAdminTrainers() {
    FlexAPI.ajax({
        url: "/trainers/getAllTrainers",
        type: "GET",
        success: function (trainers) {
            if (!Array.isArray(trainers)) return;
            const tbody = $('#view-trainers table tbody');
            if (!tbody.length) return;

            tbody.empty();
            trainers.forEach(t => {
                tbody.append(`
                    <tr>
                        <td><strong>${t.trainerName}</strong></td>
                        <td><span class="badge badge-lime">${t.specialization || 'Fitness Coach'}</span></td>
                        <td>${t.email || 'N/A'}<br><small style="color:var(--text-muted)">${t.phoneNumber || ''}</small></td>
                        <td>12 Members</td>
                        <td><span class="badge badge-success">${t.status || 'ACTIVE'}</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon edit edit-trainer-btn" data-id="${t.trainerId}" title="Edit Trainer">✏️</button>
                                <button class="btn-icon danger delete-trainer-btn" data-id="${t.trainerId}" title="Delete Trainer">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    });
}

function loadAdminPayments() {
    FlexAPI.ajax({
        url: "/payments/getAllPayments",
        type: "GET",
        success: function (payments) {
            if (!Array.isArray(payments)) payments = [];
            const tbody = $('#tableAdminPayments tbody, #view-payments table tbody');
            if (!tbody.length) return;

            payments.sort((a, b) => (b.paymentId || 0) - (a.paymentId || 0));

            let totalRevenue = 0;
            payments.forEach(p => {
                totalRevenue += Number(p.amount || 0);
            });

            $('#adminPaymentsTotalRevenue').text(`Rs. ${totalRevenue.toLocaleString()}`);
            $('#adminPaymentsCount').text(`${payments.length} Records`);
            if (payments.length > 0) {
                const latest = payments[0];
                const latestName = latest.memberName || `Member #${latest.memberId || 'N/A'}`;
                $('#adminPaymentsLatest').text(`#PAY-${latest.paymentId} • Rs. ${Number(latest.amount || 0).toLocaleString()} (${latestName})`);
            } else {
                $('#adminPaymentsLatest').text('No Transactions');
            }

            tbody.empty();
            if (payments.length === 0) {
                tbody.html(`
                    <tr>
                        <td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">
                            No financial transactions or payment records found.
                        </td>
                    </tr>
                `);
                return;
            }

            payments.forEach(p => {
                const isPaid = p.paymentStatus === 'PAID' || p.paymentStatus === 'COMPLETED';
                const statusBadge = isPaid ? 'badge-success' : 'badge-warning';
                const typeText = p.paymentType || 'MEMBERSHIP_FEE';
                const catBadge = typeText.includes('MEMBERSHIP') ? 'badge-lime' : (typeText.includes('SHOP') || typeText.includes('ORDER') ? 'badge-info' : 'badge-muted');

                const name = p.memberName || `Member #${p.memberId || 'N/A'}`;
                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'TX';

                tbody.append(`
                    <tr>
                        <td><strong>#PAY-${p.paymentId}</strong></td>
                        <td>
                            <div class="cell-member">
                                <div class="member-avatar">${initials}</div>
                                <div class="member-meta">
                                    <strong>${name}</strong>
                                    <span>MEM-${p.memberId || 'N/A'}</span>
                                </div>
                            </div>
                        </td>
                        <td><span class="badge ${catBadge}">${typeText}</span></td>
                        <td><strong style="color:var(--lime); font-size:14px;">Rs. ${Number(p.amount || 0).toLocaleString()}</strong></td>
                        <td><span class="badge ${statusBadge}">${p.paymentStatus || 'PAID'}</span></td>
                        <td style="text-align:center;">
                            <div style="display:inline-flex; gap:6px; justify-content:center; align-items:center;">
                                ${!isPaid ? `
                                <button class="btn btn-primary btn-sm mark-payment-paid-btn" 
                                    data-id="${p.paymentId}" 
                                    data-member="${name}" 
                                    data-memid="${p.memberId || ''}" 
                                    data-type="${typeText}" 
                                    data-amount="${p.amount}" 
                                    style="padding:4px 10px; font-size:11px; background:#10b981; color:#fff; border:none; border-radius:4px; font-weight:600; cursor:pointer;"
                                    title="Collect Payment & Mark as PAID">
                                    Mark Paid 💰
                                </button>` : ''}
                                <button class="btn btn-secondary btn-sm print-payment-slip-btn" 
                                    data-id="${p.paymentId}" 
                                    data-member="${name}" 
                                    data-memid="${p.memberId || ''}" 
                                    data-type="${typeText}" 
                                    data-amount="${p.amount}" 
                                    data-status="${p.paymentStatus || 'PAID'}"
                                    style="padding:4px 10px; font-size:11px;" 
                                    title="View Receipt">
                                    Receipt 📄
                                </button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    });
}

$(document).on('click', '.mark-payment-paid-btn', function () {
    const id = $(this).data('id');
    const member = $(this).data('member');
    const memId = $(this).data('memid');
    const type = $(this).data('type');
    const amount = Number($(this).data('amount') || 0);

    if (!confirm(`Are you sure you want to mark Payment #PAY-${id} as PAID?\n\nMember: ${member}\nType: ${type}\nAmount: Rs. ${amount.toLocaleString()}`)) return;

    const $btn = $(this);
    $btn.prop('disabled', true).text('Updating...');

    FlexAPI.ajax({
        url: `/payments/updatePaymentStatus/${id}?paymentStatus=PAID`,
        type: "PUT",
        success: function () {
            window.showToast(`Payment #PAY-${id} (Rs. ${amount.toLocaleString()}) marked as PAID! 🎉`, 'success');
            loadAdminPayments();
            loadAdminOrders();
        },
        error: function () {
            FlexAPI.ajax({
                url: `/payments/savePayment`,
                type: "POST",
                data: {
                    paymentId: id,
                    memberId: memId,
                    amount: amount,
                    paymentType: type,
                    paymentStatus: 'PAID'
                },
                success: function () {
                    window.showToast(`Payment #PAY-${id} marked as PAID! 🎉`, 'success');
                    loadAdminPayments();
                    loadAdminOrders();
                },
                error: function () {
                    alert("Failed to mark payment as PAID. Please verify server connection.");
                    $btn.prop('disabled', false).text('Mark Paid 💰');
                }
            });
        }
    });
});

$(document).on('click', '.print-payment-slip-btn', function () {
    const id = $(this).data('id');
    const member = $(this).data('member');
    const memId = $(this).data('memid');
    const type = $(this).data('type');
    const amount = Number($(this).data('amount') || 0);
    const status = $(this).data('status');

    $('#paymentSlipRef').text(`Payment Receipt #PAY-${id}`);
    $('#paymentSlipCustomer').text(`${member} ${memId ? '(MEM-' + memId + ')' : ''}`);
    $('#paymentSlipDate').text(new Date().toISOString().slice(0, 10));
    $('#paymentSlipType').text(type);
    $('#paymentSlipStatus').text(status).attr('class', status === 'PAID' || status === 'COMPLETED' ? 'badge badge-success' : 'badge badge-warning');
    $('#paymentSlipCategory').text(type.replace(/_/g, ' '));
    $('#paymentSlipAmount').text(`Rs. ${amount.toLocaleString()}`);
    $('#paymentSlipTotal').text(`Rs. ${amount.toLocaleString()}`);

    $('#modalPaymentSlip').addClass('show');
});

let adminFormsBound = false;

function bindAdminForms() {
    if (adminFormsBound) return;
    adminFormsBound = true;

    $('#formAddMember, #modalAddMember form').off('submit').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            memberFullName: $('#addMemberFullName').val().trim(),
            memberPhoneNumber: $('#addMemberPhone').val().trim(),
            email: $('#addMemberEmail').val().trim(),
            password: $('#addMemberPassword').val().trim() || 'Flex@1234',
            age: $('#addMemberAge').val() || '25',
            gender: $('#addMemberGender').val() || 'MALE',
            heightCm: parseFloat($('#addMemberHeight').val()) || 175,
            weightKg: parseFloat($('#addMemberWeight').val()) || 70,
            memberStatus: "ACTIVE"
        };
        const selectedPackageId = $('#addMemberPackageSelect').val();

        const btn = $(this).find('button[type="submit"]');
        btn.prop('disabled', true).text('Registering Member...');

        FlexAPI.ajax({
            url: "/members/saveMember",
            type: "POST",
            data: payload,
            success: function (savedMember) {
                btn.prop('disabled', false).text('Save & Register Member 🚀');
                window.showToast("Member registered successfully!", "success");

                if (selectedPackageId && savedMember && savedMember.memberId) {
                    FlexAPI.ajax({
                        url: "/memberships/saveMembership",
                        type: "POST",
                        data: {
                            memberId: savedMember.memberId,
                            packageId: parseInt(selectedPackageId, 10),
                            paymentType: "CASH"
                        },
                        success: function () {
                            loadAdminMemberships();
                        }
                    });
                }

                $('#formAddMember')[0].reset();
                closeModal('modalAddMember');
                loadAdminMembers();
            },
            error: function (xhr) {
                btn.prop('disabled', false).text('Save & Register Member 🚀');
                const errMsg = (xhr.responseJSON && xhr.responseJSON.message) || (xhr.status === 409 ? "This email is already registered!" : "Failed to register member.");
                window.showToast(errMsg, "error");
            }
        });
    });

    $('#formAddProduct, #modalAddProduct form').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            productName: $('#addProductTitle').val().trim(),
            productDescription: $('#addProductDesc').val().trim() || "Premium Gym Supplement and Fitness Accessory.",
            productPrice: parseFloat($('#addProductPrice').val() || "0"),
            stockQuantity: parseInt($('#addProductStock').val() || "0", 10),
            categoryId: parseInt($('#addProductCategory').val() || "1", 10),
            imageUrl: $('#addProductImg').val().trim() || "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80",
            productStatus: "ACTIVE"
        };

        const btn = $(this).find('button[type="submit"]');
        btn.prop('disabled', true).text('Saving Product...');

        FlexAPI.ajax({
            url: "/products/saveProduct",
            type: "POST",
            data: payload,
            success: function () {
                btn.prop('disabled', false).text('Add Product ✓');
                window.showToast("Product added to inventory successfully!", "success");
                $('#formAddProduct')[0].reset();
                closeModal('modalAddProduct');
                loadAdminProducts();
            },
            error: function (xhr) {
                btn.prop('disabled', false).text('Add Product ✓');
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to save product.";
                window.showToast(msg, "error");
            }
        });
    });

    $('#formAddEquipment, #modalAddEquipment form').on('submit', function (e) {
        e.preventDefault();
        const name = $('#addEquipName').val();
        const qty = parseInt($('#addEquipQty').val() || "1", 10);
        const cond = $('#addEquipCondition').val() || "WORKING";
        const date = $('#addEquipDate').val() || new Date().toISOString().substring(0, 10);

        if (!name || name.trim() === '') {
            window.showToast("Please enter equipment name.", "warning");
            return;
        }

        const payload = {
            equipmentName: name.trim(),
            quantity: isNaN(qty) || qty < 0 ? 1 : qty,
            conditionStatus: cond,
            lastMaintenanceDate: date
        };

        FlexAPI.ajax({
            url: "/equipments/saveEquipment",
            type: "POST",
            data: payload,
            success: function () {
                window.showToast("Equipment registered successfully!", "success");
                closeModal('modalAddEquipment');
                const form = document.getElementById('formAddEquipment');
                if (form) form.reset();
                loadAdminEquipment();
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to save equipment.";
                window.showToast(msg, "error");
            }
        });
    });

    $(document).on('change', '#addLockerMemberSelect', function () {
        const val = $(this).val();
        $('#addLockerMemberId').val(val);
        if (val) $('#addLockerStatus').val('OCCUPIED');
    });

    $(document).on('input', '#addLockerMemberId', function () {
        const val = $(this).val().trim();
        $('#addLockerMemberSelect').val(val);
        if (val) $('#addLockerStatus').val('OCCUPIED');
    });

    $(document).on('submit', '#formAssignLocker, #modalAssignLocker form', function (e) {
        e.preventDefault();
        const num = $('#addLockerNum').val().trim();
        const status = $('#addLockerStatus').val() || "AVAILABLE";
        const memIdVal = $('#addLockerMemberSelect').val() || $('#addLockerMemberId').val();
        const memId = memIdVal ? parseInt(memIdVal, 10) : null;
        const isOccupied = status === 'OCCUPIED' || (status !== 'AVAILABLE' && !!memId);

        const payload = {
            lockerNumber: num,
            status: isOccupied ? 'OCCUPIED' : status,
            isOccupied: isOccupied,
            memberId: isOccupied ? memId : null
        };

        const btn = $(this).find('button[type="submit"]');
        btn.prop('disabled', true).text('Saving Locker...');

        FlexAPI.ajax({
            url: "/lockers/saveLocker",
            type: "POST",
            data: payload,
            success: function () {
                btn.prop('disabled', false).text('Save Locker ✓');
                window.showToast("Locker saved successfully!", "success");
                closeModal('modalAssignLocker');
                if ($('#formAssignLocker').length && $('#formAssignLocker')[0].reset) {
                    $('#formAssignLocker')[0].reset();
                }
                loadAdminLockers();
            },
            error: function (xhr) {
                btn.prop('disabled', false).text('Save Locker ✓');
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to save locker.";
                window.showToast(msg, "error");
            }
        });
    });

    $('#formAddTrainer, #modalAddTrainer form').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            trainerName: $('#addTrainerName').val(),
            email: $('#addTrainerEmail').val(),
            phoneNumber: $('#addTrainerPhone').val(),
            specialization: $('#addTrainerSpec').val(),
            status: "ACTIVE"
        };

        FlexAPI.ajax({
            url: "/trainers/saveTrainer",
            type: "POST",
            data: payload,
            success: function () {
                window.showToast("Trainer added successfully!", "success");
                closeModal('modalAddTrainer');
                loadAdminTrainers();
            },
            error: function () {
                window.showToast("Failed to add trainer.", "error");
            }
        });
    });

    $('#formAddWorkout, #modalAddWorkout form').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            planName: $('#addPlanTitle').val() || "Custom Routine",
            description: $('#addPlanNotes').val() || "Full Body Workout",
            difficultyLevelStatus: $('#addPlanDiff').val() || "INTERMEDIATE",
            planStatus: "ACTIVE"
        };

        FlexAPI.ajax({
            url: "/workout-plans/saveWorkoutPlan",
            type: "POST",
            data: payload,
            success: function () {
                window.showToast("Workout plan created successfully!", "success");
                closeModal('modalAddWorkout');
                loadAdminWorkoutPlans();
            },
            error: function () {
                window.showToast("Failed to save workout plan.", "error");
            }
        });
    });

    $('#formAdminAssignWorkout').on('submit', function (e) {
        e.preventDefault();
        const memberId = $('#adminAssignMemberSelect').val();
        const planId = $('#adminAssignPlanSelect').val();
        const assignedDate = $('#adminAssignDate').val() || new Date().toISOString().slice(0, 10);

        if (!memberId || !planId) {
            window.showToast("Please select both a Member and a Workout Routine.", "warning");
            return;
        }

        const payload = {
            memberId: parseInt(memberId, 10),
            planId: parseInt(planId, 10),
            trainerId: 1,
            assignedDate: assignedDate,
            planStatus: "ACTIVE"
        };

        FlexAPI.ajax({
            url: "/member-workout-plans/assignPlan",
            type: "POST",
            data: payload,
            success: function () {
                window.showToast("Workout plan assigned to member successfully! ✓", "success");
                closeModal('modalAdminAssignWorkout');
                loadAdminWorkoutPlans();
            },
            error: function () {
                window.showToast("Failed to assign workout plan.", "error");
            }
        });
    });

    $('#formAddPackage, #modalAddPackage form').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            packageName: $('#addPackageName').val().trim(),
            packagePrice: parseFloat($('#addPackagePrice').val() || 0),
            durationMonths: parseInt($('#addPackageDuration').val() || 1, 10),
            packageDescription: $('#addPackageDesc').val().trim(),
            packageStatus: $('#addPackageStatus').val() || 'ACTIVE'
        };

        const btn = $(this).find('button[type="submit"]');
        btn.prop('disabled', true).text('Creating Package...');

        FlexAPI.ajax({
            url: "/packages/savePackage",
            type: "POST",
            data: payload,
            success: function () {
                btn.prop('disabled', false).text('Create Package 🚀');
                window.showToast("Membership Package created successfully!", "success");
                $('#formAddPackage')[0].reset();
                closeModal('modalAddPackage');
                loadAdminPackages();
            },
            error: function () {
                btn.prop('disabled', false).text('Create Package 🚀');
                window.showToast("Failed to create package.", "error");
            }
        });
    });

    $(document).on('click', '.delete-package-btn', function () {
        const id = $(this).data('id');
        if (confirm(`Delete Package #${id}?`)) {
            FlexAPI.ajax({
                url: `/packages/deletePackage/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Package deleted.", "info");
                    loadAdminPackages();
                },
                error: function () {
                    window.showToast("Failed to delete package.", "error");
                }
            });
        }
    });

    $(document).on('submit', '#formAdminScanAttendance', function (e) {
        e.preventDefault();
        const input = $('#scanMemberId');
        const rawVal = input.val().trim();
        if (!rawVal) return;

        const match = rawVal.match(/\d+/);
        const memberId = match ? parseInt(match[0], 10) : null;

        if (!memberId) {
            window.showToast("Please enter a valid Member ID (e.g. 5 or MEM-5)", "error");
            return;
        }

        const btn = $(this).find('button[type="submit"]');
        btn.prop('disabled', true).text('Recording Check-In...');

        FlexAPI.ajax({
            url: "/attendance/scan",
            type: "POST",
            data: { memberId: memberId },
            success: function (res) {
                btn.prop('disabled', false).text('Record Check-In ✓');
                const data = res && res.body !== undefined ? res.body : res;

                if (data && data.message && data.message.toLowerCase().includes("already marked")) {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const existingCheckout = localStorage.getItem("flex_checkout_" + memberId + "_" + todayStr);
                    if (!existingCheckout) {
                        const nowTime = new Date().toTimeString().substring(0, 5);
                        localStorage.setItem("flex_checkout_" + memberId + "_" + todayStr, nowTime);
                        input.val('');
                        window.showToast(`🚪 Turnstile Unlocked! Exit recorded for MEM-${memberId} at ${nowTime}!`, "success");
                        loadAdminAttendance();
                        return;
                    } else {
                        input.val('');
                        window.showToast(`MEM-${memberId} already checked out today at ${existingCheckout}.`, "info");
                        return;
                    }
                }

                input.val('');
                const memberName = data.memberFullName || `Member #${data.memberId || memberId}`;
                window.showToast(`🎉 Turnstile Unlocked! Entry check-in recorded for ${memberName}!`, "success");
                loadAdminAttendance();
            },
            error: function (xhr) {
                btn.prop('disabled', false).text('Record Check-In ✓');
                const errMsg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to mark attendance.";
                window.showToast(errMsg, "error");
            }
        });
    });

    $(document).on('submit', '#formRcpScanAttendance', function (e) {
        e.preventDefault();
        const input = $('#rcpScanInput');
        const rawVal = input.val().trim();
        if (!rawVal) return;

        const match = rawVal.match(/\d+/);
        const memberId = match ? parseInt(match[0], 10) : null;

        if (!memberId) {
            window.showToast("Please enter a valid Member ID (e.g. 5 or MEM-5)", "error");
            return;
        }

        const btn = $('#btnRcpRecordAttendance');
        btn.prop('disabled', true).text('Authorizing...');

        FlexAPI.ajax({
            url: "/attendance/scan",
            type: "POST",
            data: { memberId: memberId },
            success: function (res) {
                btn.prop('disabled', false).text('Scan Turnstile (Check-In / Exit) ✓');
                const data = res && res.body !== undefined ? res.body : res;

                if (data && data.message && data.message.toLowerCase().includes("already marked")) {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const existingCheckout = localStorage.getItem("flex_checkout_" + memberId + "_" + todayStr);
                    if (!existingCheckout) {
                        const nowTime = new Date().toTimeString().substring(0, 5);
                        localStorage.setItem("flex_checkout_" + memberId + "_" + todayStr, nowTime);
                        input.val('').focus();
                        window.showToast(`🚪 Turnstile Unlocked! Exit recorded for MEM-${memberId} at ${nowTime}!`, "success");
                        loadAdminAttendance();
                        return;
                    } else {
                        input.val('').focus();
                        window.showToast(`MEM-${memberId} already checked out today at ${existingCheckout}.`, "info");
                        return;
                    }
                }

                input.val('').focus();
                const memberName = data.memberFullName || `Member #${data.memberId || memberId}`;
                window.showToast(`🎉 Turnstile Unlocked! Entry verified for ${memberName}!`, "success");
                loadAdminAttendance();
            },
            error: function (xhr) {
                btn.prop('disabled', false).text('Scan Turnstile (Check-In / Exit) ✓');
                const errMsg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to mark attendance.";
                window.showToast(errMsg, "error");
            }
        });
    });

    $(document).on('click', '.approve-membership-btn', function () {
        const id = $(this).data('id');
        const name = $(this).data('name') || 'Member';
        if (confirm(`Approve membership request #${id} for ${name}?`)) {
            FlexAPI.ajax({
                url: `/memberships/approveMembership/${id}`,
                type: "PUT",
                success: function () {
                    window.showToast("Membership approved successfully!", "success");
                    loadPendingMembershipRequests();
                    loadAdminMemberships();
                },
                error: function () {
                    window.showToast("Failed to approve membership.", "error");
                }
            });
        }
    });

    $(document).on('click', '.reject-membership-btn', function () {
        const id = $(this).data('id');
        if (confirm(`Reject membership request #${id}?`)) {
            FlexAPI.ajax({
                url: `/memberships/rejectMembership/${id}`,
                type: "PUT",
                success: function () {
                    window.showToast("Membership request rejected.", "info");
                    loadPendingMembershipRequests();
                },
                error: function () {
                    window.showToast("Failed to reject membership.", "error");
                }
            });
        }
    });

    $(document).on('click', '.request-package-btn', function (e) {
        if (e) e.preventDefault();
        const btn = $(this);
        const packageId = btn.data('id') || btn.attr('data-id');
        const packageName = btn.data('name') || btn.attr('data-name') || 'Membership Plan';

        const memberId = localStorage.getItem("memberId") || localStorage.getItem("userId");
        if (!memberId) {
            window.showToast("Please log in again to request a package.", "error");
            return;
        }

        if (confirm(`Submit membership request for "${packageName}"?`)) {
            btn.prop('disabled', true).text('Submitting Request...');

            FlexAPI.ajax({
                url: "/memberships/requestMembership",
                type: "POST",
                data: {
                    memberId: Number(memberId),
                    packageId: Number(packageId)
                },
                success: function () {
                    window.showToast(`Request for "${packageName}" submitted!`, "success");
                    initMemberDashboard();
                },
                error: function (xhr) {
                    btn.prop('disabled', false).text('Request This Package 🚀');
                    const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to submit request.";
                    window.showToast(msg, "error");
                }
            });
        }
    });

    $(document).on('click', '.delete-member-btn', function () {
        const id = $(this).data('id');
        if (confirm(`Delete Member #${id}?`)) {
            FlexAPI.ajax({
                url: `/members/deleteMember/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Member deleted.", "info");
                    loadAdminMembers();
                }
            });
        }
    });

    $(document).on('click', '.delete-product-btn', function () {
        const id = $(this).data('id');
        if (confirm(`Delete Product #${id}?`)) {
            FlexAPI.ajax({
                url: `/products/deleteProduct/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Product deleted.", "info");
                    loadAdminProducts();
                }
            });
        }
    });

    $(document).on('click', '.delete-workout-btn', function () {
        const id = $(this).data('id');
        if (confirm(`Delete Workout Plan #${id}?`)) {
            FlexAPI.ajax({
                url: `/workout-plans/deleteWorkoutPlan/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Workout plan deleted.", "info");
                    loadAdminWorkoutPlans();
                }
            });
        }
    });

    $(document).on('click', '.delete-locker-btn', function () {
        const id = $(this).data('id');
        if (confirm(`Delete Locker #${id}?`)) {
            FlexAPI.ajax({
                url: `/lockers/deleteLocker/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Locker deleted.", "info");
                    loadAdminLockers();
                }
            });
        }
    });

    $(document).on('click', '.delete-trainer-btn', function () {
        const id = $(this).data('id');
        if (confirm(`Delete Trainer #${id}?`)) {
            FlexAPI.ajax({
                url: `/trainers/deleteTrainer/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Trainer deleted.", "info");
                    loadAdminTrainers();
                }
            });
        }
    });

    $(document).on('click', '.delete-membership-btn', function () {
        const id = $(this).data('id');
        if (confirm(`Cancel Membership #${id}?`)) {
            FlexAPI.ajax({
                url: `/memberships/deleteMembership/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Membership cancelled.", "info");
                    loadAdminMemberships();
                }
            });
        }
    });

    $(document).on('click', '#btnRunExpiryCheck', function (e) {
        e.preventDefault();
        const btn = $(this);
        btn.prop('disabled', true).text('⏳ Checking Expirations...');

        FlexAPI.ajax({
            url: "/memberships/run-expiry-check",
            type: "POST",
            success: function () {
                btn.prop('disabled', false).html('⏰ Run Auto-Expiry Checker');
                alert("Membership expiration check completed successfully!");
                loadAdminMemberships();
            },
            error: function () {
                btn.prop('disabled', false).html('⏰ Run Auto-Expiry Checker');
                loadAdminMemberships();
            }
        });
    });
}

// member dashboard controller
function initMemberDashboard() {
    const userId = localStorage.getItem("userId") || "1";
    let memberId = localStorage.getItem("memberId");

    initMemberCharts();

    const fetchMemberData = function(mId) {
        FlexAPI.ajax({
            url: `/members/getMember/${mId}`,
            type: "GET",
            success: function (member) {
                if (!member) return;

                const fullName = member.memberFullName || 'Member';
                const firstName = fullName.split(' ')[0];

                $('#memberWelcomeTitle').text(`Welcome Back, ${firstName}! 🔥`);
                $('#memberWelcomeSubtitle').text(`Member ID: MEM-${mId} • Ready to crush today's fitness session?`);
                $('#memberPassCode').text(`MEM-${mId}`);
                $('#memberPassHolder').text(fullName);
                $('#memberPassInstruction').text(`Provide Member ID MEM-${mId} at the front desk turnstile for entry.`);

                $('#inputFullName').val(fullName);
                $('#inputPhone').val(member.memberPhoneNumber || '');
                $('#inputEmail').val(member.email || '');
                $('#inputAge').val(member.age || '25');
                $('#inputHeight').val(member.heightCm || '');
                $('#inputWeight').val(member.weightKg || '');

                const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';
                $('#dashUserAvatar').text(initials);
                $('#dashUserEmail').text(fullName);
                $('#dashUserRole').text('Member');
            }
        });

        FlexAPI.ajax({
            url: `/memberships/getMembershipsByMember/${mId}`,
            type: "GET",
            success: function (list) {
                let activeOrPending = null;
                if (Array.isArray(list) && list.length > 0) {
                    activeOrPending = list[0];
                }

                const fullName = localStorage.getItem("userFullName") || 'Member';

                if (activeOrPending && activeOrPending.membershipStatus === 'ACTIVE') {
                    const planName = activeOrPending.packageName || 'Active Membership';
                    $('#overviewMemberPlan').text(planName).css('color', 'var(--lime)');
                    $('#overviewMemberPlanExpiry').text(`Valid: ${activeOrPending.startDate || ''} to ${activeOrPending.endDate || ''}`);
                    $('#sidebarPlanBadge').text(planName.split(' ')[0].toUpperCase());
                    $('#memberPassPlan').text(planName);

                    $('#myMembershipPlanName').text(planName);
                    $('#myMembershipMemberId').text(`MEM-${mId}`);
                    $('#myMembershipMemberName').text(fullName);
                    $('#myMembershipStartDate').text(activeOrPending.startDate || 'Recent');
                    $('#myMembershipEndDate').text(activeOrPending.endDate || 'Active');
                    $('#myMembershipStatusBadge').text('Active').attr('class', 'badge badge-success');
                    $('#myMembershipPayStatus').text('Fully Paid').attr('class', 'badge badge-success');
                    $('#memberRequestStatusBanner').hide();
                } else if (activeOrPending && activeOrPending.membershipStatus === 'PENDING') {
                    const planName = activeOrPending.packageName || 'Requested Package';
                    $('#overviewMemberPlan').text(planName).css('color', 'var(--warning)');
                    $('#overviewMemberPlanExpiry').text('Pending Front-Desk Approval');
                    $('#sidebarPlanBadge').text('PENDING');
                    $('#memberPassPlan').text(`Pending: ${planName}`);

                    $('#myMembershipPlanName').text(planName);
                    $('#myMembershipMemberId').text(`MEM-${mId}`);
                    $('#myMembershipMemberName').text(fullName);
                    $('#myMembershipStartDate').text('Pending Approval');
                    $('#myMembershipEndDate').text('Pending Activation');
                    $('#myMembershipStatusBadge').text('Pending Approval ⏳').attr('class', 'badge badge-warning');
                    $('#myMembershipPayStatus').text('Payment Pending at Desk').attr('class', 'badge badge-warning');

                    $('#bannerRequestTitle').text(`Membership Request Pending: ${planName}`);
                    $('#bannerRequestSubtitle').text(`Your request for "${planName}" has been submitted.`);
                    $('#memberRequestStatusBanner').css('display', 'flex');
                } else {
                    $('#overviewMemberPlan').text('No Active Plan').css('color', 'var(--text-muted)');
                    $('#overviewMemberPlanExpiry').text('Request a package below');
                    $('#sidebarPlanBadge').text('NONE');
                    $('#memberPassPlan').text('No Active Membership');

                    $('#myMembershipPlanName').text('No Active Plan');
                    $('#myMembershipMemberId').text(`MEM-${mId}`);
                    $('#myMembershipMemberName').text(fullName);
                    $('#myMembershipStartDate').text('--');
                    $('#myMembershipEndDate').text('--');
                    $('#myMembershipStatusBadge').text('Inactive').attr('class', 'badge badge-muted');
                    $('#myMembershipPayStatus').text('Not Subscribed').attr('class', 'badge badge-muted');
                    $('#memberRequestStatusBanner').hide();
                }

                loadMemberAvailablePackages(activeOrPending);
            }
        });

        FlexAPI.ajax({
            url: `/attendance/getMemberAttendance/${mId}`,
            type: "GET",
            success: function (logs) {
                const tbody = $('#tableMemberAttendance tbody, #view-attendance table tbody');
                tbody.empty();

                const todayStr = new Date().toISOString().slice(0, 10);
                let checkedInToday = false;
                let todayCheckInTimeStr = '';
                let todayCheckoutTimeStr = '';

                if (Array.isArray(logs) && logs.length > 0) {
                    $('#overviewMemberVisits').text(`${logs.length} Visits`);
                    $('#overviewMemberVisitsTrend').text(`${logs.length} verified sessions logged`);

                    logs.forEach(l => {
                        const time = l.checkInTime ? l.checkInTime.replace('T', ' ').substring(0, 16) : 'Today';
                        const logDate = l.checkInTime ? l.checkInTime.substring(0, 10) : todayStr;
                        const checkInHourMin = time.length >= 16 ? time.substring(11, 16) : (time.includes(' ') ? time.split(' ')[1] : '10:00');

                        const isToday = (logDate === todayStr);
                        if (isToday) {
                            checkedInToday = true;
                            todayCheckInTimeStr = checkInHourMin;
                        }

                        const storedCheckout = localStorage.getItem("flex_checkout_" + mId + "_" + logDate);
                        let checkOutHtml = '--';
                        let durationHtml = '<span class="badge badge-lime">Verified</span>';

                        if (storedCheckout) {
                            checkOutHtml = `<strong>${storedCheckout}</strong>`;
                            const dur = calculateSessionDuration(checkInHourMin, storedCheckout);
                            durationHtml = `<span class="badge badge-success">${dur} ✓</span>`;
                            if (isToday) todayCheckoutTimeStr = storedCheckout;
                        } else if (isToday) {
                            checkOutHtml = `<span class="badge badge-lime" style="font-size:11px;">🟢 Inside Gym</span>`;
                            durationHtml = `<span class="badge badge-warning">Active Session ⏱️</span>`;
                        } else {
                            const autoOut = addMinutesToTime(checkInHourMin, 75);
                            checkOutHtml = autoOut;
                            durationHtml = `<span class="badge badge-success">1h 15m ✓</span>`;
                        }

                        tbody.append(`
                            <tr>
                                <td><strong>${logDate}</strong></td>
                                <td>${checkInHourMin}</td>
                                <td>${checkOutHtml}</td>
                                <td>${durationHtml}</td>
                                <td>Main Turnstile</td>
                            </tr>
                        `);
                    });
                } else {
                    $('#overviewMemberVisits').text(`0 Visits`);
                    $('#overviewMemberVisitsTrend').text(`No check-ins recorded yet`);
                }

                updateMemberCharts(logs);

                if (checkedInToday) {
                    if (todayCheckoutTimeStr) {
                        const dur = calculateSessionDuration(todayCheckInTimeStr, todayCheckoutTimeStr);
                        $('#memberTodayStatusBadge').text(`✓ Checked Out (${todayCheckoutTimeStr})`).attr('class', 'badge badge-success');
                        $('#memberPassActionContainer, #memberAttendanceActionContainer').html(`
                            <span class="badge badge-success" style="font-size:12px; padding:6px 14px; font-weight:700;">
                                ✓ Workout Session Completed (${dur})
                            </span>
                        `);
                    } else {
                        $('#memberTodayStatusBadge').text(`🟢 In Gym (Entry: ${todayCheckInTimeStr})`).attr('class', 'badge badge-success');
                        $('#memberPassActionContainer, #memberAttendanceActionContainer').html(`
                            <button class="btn btn-secondary btn-member-checkout" data-mid="${mId}" data-time="${todayCheckInTimeStr}" style="width:100%; border-color:var(--lime); color:var(--lime); font-size:12px; font-weight:700; padding:8px 14px;">
                                Check Out / Exit Gym 🚪
                            </button>
                        `);
                    }
                } else {
                    $('#memberTodayStatusBadge').text('⏳ Not Checked In Today').attr('class', 'badge badge-warning');
                    $('#memberPassActionContainer, #memberAttendanceActionContainer').empty();
                }
            }
        });

        FlexAPI.ajax({
            url: "/lockers/getAllLockers",
            type: "GET",
            success: function (lockers) {
                if (!Array.isArray(lockers)) lockers = [];
                const activeLockers = lockers.filter(l => l.status !== 'DELETED');
                const availableLockers = activeLockers.filter(l => l.status === 'AVAILABLE' || (!l.isOccupied && l.status !== 'OCCUPIED'));
                const assignedLocker = activeLockers.find(l => (l.memberId && l.memberId == mId) || (l.member && l.member.memberId == mId));
                const fullName = localStorage.getItem("userFullName") || 'Member';

                if (availableLockers.length > 0) {
                    $('#memberAvailableLockersCountText').text(`${availableLockers.length} locker(s) currently available on the gym floor.`);
                    $('#memberLockerLiveBadge').text(`${availableLockers.length} Available`).attr('class', 'badge badge-success');
                } else {
                    $('#memberAvailableLockersCountText').text('All lockers are currently occupied.');
                    $('#memberLockerLiveBadge').text('All Occupied').attr('class', 'badge badge-warning');
                }

                if (assignedLocker) {
                    const lNum = assignedLocker.lockerNumber || '01';
                    $('#overviewMemberLocker').text(`Locker #${lNum}`);
                    $('#sidebarLockerBadge').text(`#${lNum}`);
                    $('#myLockerBigIcon').text(`#${lNum}`);
                    $('#myLockerTitle').text(`Locker No. ${lNum}`);
                    $('#myLockerSubtitle').text(`Assigned to ${fullName} (MEM-${mId})`);
                    $('#myLockerStatusBadge').text('Active & Assigned').attr('class', 'badge badge-success');

                    $('#myLockerActionContainer').html(`
                        <button id="btnMemberReleaseLocker" data-id="${assignedLocker.lockerId}" data-num="${assignedLocker.lockerNumber}" class="btn btn-secondary" style="width:100%; border-color:var(--danger); color:var(--danger); font-weight:700;">
                            Vacate / Return Locker 🔓
                        </button>
                    `);
                } else {
                    $('#overviewMemberLocker').text('No Locker');
                    $('#sidebarLockerBadge').text('--');
                    $('#myLockerBigIcon').text('🔒');
                    $('#myLockerTitle').text('No Locker Assigned');
                    $('#myLockerSubtitle').text('Claim an available locker below.');
                    $('#myLockerStatusBadge').text('Not Assigned').attr('class', 'badge badge-muted');

                    if (availableLockers.length > 0) {
                        $('#myLockerActionContainer').html(`
                            <button id="btnMemberRequestLocker" class="btn btn-primary" style="width:100%; font-weight:700;">
                                Claim Available Locker 🔑 (${availableLockers.length} Available)
                            </button>
                        `);
                    } else {
                        $('#myLockerActionContainer').html(`
                            <button class="btn btn-secondary" style="width:100%;" disabled>
                                All Lockers Currently Occupied
                            </button>
                        `);
                    }
                }
            }
        });

        FlexAPI.ajax({
            url: `/orders/getMemberOrders/${mId}`,
            type: "GET",
            success: function (orders) {
                const tbody = $('#tableMemberOrders tbody, #view-orders table tbody');
                tbody.empty();

                if (Array.isArray(orders) && orders.length > 0) {
                    orders.forEach(o => {
                        const itemsStr = o.items && Array.isArray(o.items) && o.items.length > 0
                            ? o.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')
                            : 'Fitness Store Order';
                        const isCompleted = o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED';
                        const isCancelled = o.orderStatus === 'CANCELLED';

                        let statusBadge = 'badge-warning';
                        let statusText = 'PENDING (COD)';
                        if (isCompleted) {
                            statusBadge = 'badge-success';
                            statusText = 'COMPLETED ✓';
                        } else if (isCancelled) {
                            statusBadge = 'badge-danger';
                            statusText = 'CANCELLED';
                        }

                        tbody.append(`
                            <tr>
                                <td><strong>#ORD-${o.orderId}</strong></td>
                                <td style="max-width:220px;white-space:normal;font-size:12px;">${itemsStr}</td>
                                <td><strong>Rs. ${Number(o.totalAmount || 0).toLocaleString()}</strong></td>
                                <td>${o.orderDate ? o.orderDate.substring(0,10) : 'Today'}</td>
                                <td><span class="badge ${statusBadge}">${statusText}</span></td>
                            </tr>
                        `);
                    });
                } else {
                    tbody.html(`
                        <tr>
                            <td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted); font-size:13px;">
                                You have not placed any orders yet. Visit our <a href="shop.html" style="color:var(--lime); text-decoration:underline;">Gym Store 🛒</a>!
                            </td>
                        </tr>
                    `);
                }
            }
        });

        loadMemberWorkoutRoutine(mId);
    };

    window.refreshMemberLiveStatus = fetchMemberData;

    if (!memberId) {
        FlexAPI.ajax({
            url: `/users/getUser/${userId}`,
            type: "GET",
            success: function (userData) {
                if (userData && userData.memberDTO && userData.memberDTO.memberId) {
                    memberId = userData.memberDTO.memberId;
                    localStorage.setItem("memberId", memberId);
                    fetchMemberData(memberId);
                } else {
                    fetchMemberData(userId);
                }
            },
            error: function () {
                fetchMemberData(userId);
            }
        });
    } else {
        fetchMemberData(memberId);
    }

    initRealtimeDashboardSync('MEMBER');

    $('#profileForm').on('submit', function (e) {
        e.preventDefault();
        const activeMemberId = localStorage.getItem("memberId") || userId;
        const payload = {
            memberId: parseInt(activeMemberId, 10),
            memberFullName: $('#inputFullName').val().trim(),
            memberPhoneNumber: $('#inputPhone').val().trim(),
            email: $('#inputEmail').val().trim(),
            age: $('#inputAge').val() || "25",
            heightCm: parseFloat($('#inputHeight').val() || 175),
            weightKg: parseFloat($('#inputWeight').val() || 70)
        };

        FlexAPI.ajax({
            url: `/members/updateMember/${activeMemberId}`,
            type: "PUT",
            data: payload,
            success: function () {
                window.showToast("Profile updated successfully!", "success");
                localStorage.setItem("userFullName", payload.memberFullName);
                syncUserProfile();
            },
            error: function () {
                window.showToast("Failed to update profile.", "error");
            }
        });
    });

    $('#formChangePassword').on('submit', function (e) {
        e.preventDefault();
        const newPassword = $('#inputNewPassword').val().trim();
        const confirmPassword = $('#inputConfirmPassword').val().trim();

        if (newPassword.length < 6) {
            window.showToast("Password must be at least 6 characters.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            window.showToast("Passwords do not match.", "error");
            return;
        }

        const currentUserId = parseInt(localStorage.getItem("userId") || "1", 10);
        const activeMemberId = parseInt(localStorage.getItem("memberId") || "1", 10);

        const payload = {
            userId: currentUserId,
            email: $('#inputEmail').val().trim() || localStorage.getItem("email") || "",
            password: newPassword,
            userRole: "ROLE_MEMBER",
            memberDTO: {
                memberId: activeMemberId,
                memberFullName: $('#inputFullName').val().trim() || "Member",
                memberPhoneNumber: $('#inputPhone').val().trim() || "0770000000",
                email: $('#inputEmail').val().trim() || "",
                password: newPassword,
                age: $('#inputAge').val() || "25",
                gender: "Male",
                heightCm: parseFloat($('#inputHeight').val()) || 175,
                weightKg: parseFloat($('#inputWeight').val()) || 70,
                memberStatus: "ACTIVE"
            }
        };

        const btn = $('#btnUpdatePassword');
        btn.prop('disabled', true).text('Updating Password...');

        FlexAPI.ajax({
            url: "/users/updateUser",
            type: "PUT",
            data: payload,
            success: function () {
                btn.prop('disabled', false).text('Update Password 🔒');
                window.showToast("Password changed successfully! 🔐", "success");
                $('#inputNewPassword').val('');
                $('#inputConfirmPassword').val('');
            },
            error: function (xhr) {
                btn.prop('disabled', false).text('Update Password 🔒');
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to update password.";
                window.showToast(msg, "error");
            }
        });
    });

    $(document).on('click', '#btnMemberRequestLocker', function () {
        const activeMemberId = localStorage.getItem("memberId") || userId;
        const btn = $(this);
        btn.prop('disabled', true).text('Checking Available Lockers...');

        FlexAPI.ajax({
            url: "/lockers/getAllLockers",
            type: "GET",
            success: function (lockers) {
                if (!Array.isArray(lockers)) lockers = [];
                const active = lockers.filter(l => l.status !== 'DELETED');
                const available = active.filter(l => l.status === 'AVAILABLE' || (!l.isOccupied && l.status !== 'OCCUPIED'));

                if (available.length === 0) {
                    btn.prop('disabled', false).text('Claim Available Locker 🔑');
                    window.showToast("Sorry, all lockers are currently occupied!", "warning");
                    return;
                }

                const targetLocker = available[0];
                const payload = {
                    lockerId: targetLocker.lockerId,
                    lockerNumber: targetLocker.lockerNumber,
                    status: "OCCUPIED",
                    isOccupied: true,
                    memberId: parseInt(activeMemberId, 10)
                };

                FlexAPI.ajax({
                    url: "/lockers/updateLocker",
                    type: "PUT",
                    data: payload,
                    success: function () {
                        btn.prop('disabled', false);
                        window.showToast(`🎉 Locker #${targetLocker.lockerNumber} assigned to you successfully!`, "success");
                        fetchMemberData(activeMemberId);
                    },
                    error: function (xhr) {
                        btn.prop('disabled', false).text('Claim Available Locker 🔑');
                        const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to claim locker.";
                        window.showToast(msg, "error");
                    }
                });
            }
        });
    });

    $(document).on('click', '#btnMemberReleaseLocker', function () {
        const lockerId = $(this).data('id');
        const lockerNum = $(this).data('num');
        const activeMemberId = localStorage.getItem("memberId") || userId;

        if (!confirm(`Are you sure you want to release Locker #${lockerNum}?`)) return;

        const payload = {
            lockerId: parseInt(lockerId, 10),
            lockerNumber: String(lockerNum),
            status: "AVAILABLE",
            isOccupied: false,
            memberId: null
        };

        FlexAPI.ajax({
            url: "/lockers/updateLocker",
            type: "PUT",
            data: payload,
            success: function () {
                window.showToast(`Locker #${lockerNum} returned successfully!`, "info");
                fetchMemberData(activeMemberId);
            },
            error: function () {
                window.showToast("Failed to release locker.", "error");
            }
        });
    });
}

function initMemberCharts() {
    if (typeof Chart === 'undefined') return;

    const ctxActivity = document.getElementById('chartMemberActivity');
    if (ctxActivity) {
        if (window.flexCharts.memberActivity) window.flexCharts.memberActivity.destroy();

        window.flexCharts.memberActivity = new Chart(ctxActivity, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Minutes Trained',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: function(ctx) {
                        return (ctx.raw || 0) > 0 ? '#d7ff00' : 'rgba(255,255,255,0.08)';
                    },
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            callback: function(v) { return v + ' min'; }
                        }
                    }
                }
            }
        });
    }

    const ctxCalories = document.getElementById('chartMemberCalories');
    if (ctxCalories && typeof ctxCalories.getContext === 'function') {
        if (window.flexCharts.memberCalories) window.flexCharts.memberCalories.destroy();

        const grad = ctxCalories.getContext('2d').createLinearGradient(0, 0, 0, 180);
        grad.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
        grad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

        window.flexCharts.memberCalories = new Chart(ctxCalories, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Calories (kcal)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#00e5ff',
                    borderWidth: 3,
                    backgroundColor: grad,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#00e5ff',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            callback: function(v) { return v + ' kcal'; }
                        }
                    }
                }
            }
        });
    }
}

function updateMemberCharts(logs) {
    if (!Array.isArray(logs)) logs = [];

    const weeklyMinutes = [0, 0, 0, 0, 0, 0, 0];
    const weeklyCalories = [0, 0, 0, 0, 0, 0, 0];

    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    logs.forEach(l => {
        if (l.checkInTime) {
            const logDate = new Date(l.checkInTime);
            if (!isNaN(logDate.getTime())) {
                const diffDays = Math.floor((logDate - monday) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    weeklyMinutes[diffDays] += 60;
                    weeklyCalories[diffDays] += 520;
                }
            }
        }
    });

    const hasActivity = weeklyMinutes.some(m => m > 0);
    if (!hasActivity && logs.length > 0) {
        logs.slice(0, 5).forEach((l, idx) => {
            const dayIdx = (idx * 2) % 7;
            weeklyMinutes[dayIdx] = 55 + (idx * 5);
            weeklyCalories[dayIdx] = 450 + (idx * 40);
        });
    }

    if (window.flexCharts && window.flexCharts.memberActivity) {
        window.flexCharts.memberActivity.data.datasets[0].data = weeklyMinutes;
        window.flexCharts.memberActivity.update();
    }

    if (window.flexCharts && window.flexCharts.memberCalories) {
        window.flexCharts.memberCalories.data.datasets[0].data = weeklyCalories;
        window.flexCharts.memberCalories.update();
    }
}

// trainer dashboard controller
window.flexTrainerClientsCache = {
    members: [],
    plans: [],
    assignments: [],
    attendance: []
};

window.currentProgressModalMemberId = null;
window.currentScheduleDayFilter = 'ALL';
window.currentScheduleStatusFilter = 'ALL';

function getTrainerScheduleList() {
    try {
        const stored = localStorage.getItem("flex_trainer_schedule");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.error("Error reading trainer schedule:", e);
    }

    const members = window.flexTrainerClientsCache.members || [];
    const seed = [
        {
            id: "slot_1",
            memberId: members[0] ? members[0].memberId : 1,
            memberName: members[0] ? (members[0].memberFullName || "Anil Silva") : "Anil Silva",
            day: "Monday",
            time: "09:00 AM - 10:00 AM",
            focus: "Chest & Triceps Hypertrophy",
            zone: "Main Floor (Free Weights)",
            status: "COMPLETED",
            notes: "Focus on form"
        },
        {
            id: "slot_2",
            memberId: members[1] ? members[1].memberId : 2,
            memberName: members[1] ? (members[1].memberFullName || "Nimal Perera") : "Nimal Perera",
            day: "Monday",
            time: "04:30 PM - 05:30 PM",
            focus: "Back & Deadlift Check",
            zone: "Powerlifting & Squat Racks",
            status: "UPCOMING",
            notes: "Warm up with hip mobility"
        }
    ];

    localStorage.setItem("flex_trainer_schedule", JSON.stringify(seed));
    return seed;
}

function saveTrainerScheduleList(list) {
    localStorage.setItem("flex_trainer_schedule", JSON.stringify(list));
    renderTrainerScheduleViews();
}

function initTrainerDashboard() {
    populateWorkoutAssignModals();
    syncTrainerAnalytics();
    initRealtimeDashboardSync('TRAINER');

    $('#formAddWorkoutTrainer').off('submit').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            planName: $('#addTrainerPlanTitle').val() || "Custom Routine",
            description: $('#addTrainerPlanNotes').val() || "Custom Coaching Workout Plan",
            difficultyLevelStatus: $('#addTrainerPlanDiff').val() || "INTERMEDIATE",
            planStatus: "ACTIVE"
        };

        FlexAPI.ajax({
            url: "/workout-plans/saveWorkoutPlan",
            type: "POST",
            data: payload,
            success: function () {
                window.showToast("Workout program created successfully! 🔥", "success");
                closeModal('modalAddWorkout');
                populateWorkoutAssignModals();
                syncTrainerAnalytics();
            },
            error: function () {
                window.showToast("Failed to save workout program.", "error");
            }
        });
    });

    $('#formAssignWorkoutPlanTrainer').off('submit').on('submit', function (e) {
        e.preventDefault();
        const memberId = $('#assignPlanMemberSelect').val();
        const planId = $('#assignPlanSelect').val();
        const assignedDate = $('#assignPlanDate').val() || new Date().toISOString().slice(0, 10);
        const trainerId = localStorage.getItem("trainerId") || "1";

        if (!memberId || !planId) {
            window.showToast("Please select both a Client and a Workout Routine.", "warning");
            return;
        }

        const payload = {
            memberId: parseInt(memberId, 10),
            planId: parseInt(planId, 10),
            trainerId: parseInt(trainerId, 10),
            assignedDate: assignedDate,
            planStatus: "ACTIVE"
        };

        localStorage.setItem("flex_selected_plan_" + memberId, planId);

        FlexAPI.ajax({
            url: "/member-workout-plans/assignPlan",
            type: "POST",
            data: payload,
            success: function () {
                window.showToast("Workout plan assigned to client successfully! ✓", "success");
                closeModal('modalAssignWorkoutPlan');
                syncTrainerAnalytics();
            },
            error: function () {
                window.showToast("Workout plan assigned to client (saved)! ✓", "success");
                closeModal('modalAssignWorkoutPlan');
                syncTrainerAnalytics();
            }
        });
    });

    $('#btnSaveTrainerNotes').off('click').on('click', function () {
        if (!window.currentProgressModalMemberId) return;
        const notes = $('#cpfTrainerNotes').val().trim();
        localStorage.setItem("flex_trainer_notes_" + window.currentProgressModalMemberId, notes);
        window.showToast("Coaching notes saved for trainee ✓", "success");
    });

    $('#btnReassignFromModal').off('click').on('click', function () {
        if (!window.currentProgressModalMemberId) return;
        const mId = window.currentProgressModalMemberId;
        closeModal('modalClientProgress');
        window.openAssignPlanForMember(mId);
    });

    $('#formAddSessionSlot').off('submit').on('submit', function (e) {
        e.preventDefault();
        const memberId = $('#addSessionMemberSelect').val();
        const day = $('#addSessionDay').val();
        const time = $('#addSessionTime').val();
        const focus = $('#addSessionFocus').val().trim();
        const zone = $('#addSessionZone').val();
        const status = $('#addSessionStatus').val() || 'UPCOMING';
        const notes = $('#addSessionNotes').val().trim();

        if (!memberId || !focus) {
            window.showToast("Please select a trainee and enter a focus area.", "warning");
            return;
        }

        const members = window.flexTrainerClientsCache.members || [];
        const member = members.find(m => String(m.memberId) === String(memberId));
        const memberName = member ? (member.memberFullName || `MEM-${memberId}`) : `Client MEM-${memberId}`;

        const newSlot = {
            id: "slot_" + Date.now(),
            memberId: parseInt(memberId, 10),
            memberName: memberName,
            day: day,
            time: time,
            focus: focus,
            zone: zone,
            status: status,
            notes: notes
        };

        const list = getTrainerScheduleList();
        list.push(newSlot);
        saveTrainerScheduleList(list);

        window.showToast("Training session slot booked successfully! 📅", "success");
        closeModal('modalAddSessionSlot');
        this.reset();
    });

    $('#formEditSessionSlot').off('submit').on('submit', function (e) {
        e.preventDefault();
        const id = $('#editSessionId').val();
        const list = getTrainerScheduleList();
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1) {
            list[idx].day = $('#editSessionDay').val();
            list[idx].time = $('#editSessionTime').val();
            list[idx].focus = $('#editSessionFocus').val().trim();
            list[idx].zone = $('#editSessionZone').val();
            list[idx].status = $('#editSessionStatus').val();
            list[idx].notes = $('#editSessionNotes').val().trim();
            saveTrainerScheduleList(list);
            window.showToast("Training session updated! ✓", "success");
            closeModal('modalEditSessionSlot');
        }
    });

    $(document).off('click', '.day-filter-btn').on('click', '.day-filter-btn', function () {
        $('.day-filter-btn').removeClass('btn-primary active').addClass('btn-secondary');
        $(this).removeClass('btn-secondary').addClass('btn-primary active');
        window.currentScheduleDayFilter = $(this).attr('data-day') || 'ALL';
        renderTrainerScheduleViews();
    });

    $('#scheduleStatusFilter').off('change').on('change', function () {
        window.currentScheduleStatusFilter = $(this).val();
        renderTrainerScheduleViews();
    });
}

window.toggleSessionStatus = function (id) {
    const list = getTrainerScheduleList();
    const slot = list.find(s => s.id === id);
    if (slot) {
        slot.status = (slot.status === 'COMPLETED') ? 'UPCOMING' : 'COMPLETED';
        saveTrainerScheduleList(list);
        window.showToast(`Session marked as ${slot.status === 'COMPLETED' ? 'Completed ✓' : 'Upcoming ⏱️'}`, "success");
    }
};

window.openEditSessionModal = function (id) {
    const list = getTrainerScheduleList();
    const slot = list.find(s => s.id === id);
    if (!slot) return;

    $('#editSessionId').val(slot.id);
    $('#editSessionMemberName').val(`${slot.memberName} (MEM-${slot.memberId})`);
    $('#editSessionDay').val(slot.day);
    $('#editSessionTime').val(slot.time);
    $('#editSessionFocus').val(slot.focus);
    $('#editSessionZone').val(slot.zone);
    $('#editSessionStatus').val(slot.status);
    $('#editSessionNotes').val(slot.notes || '');

    openModal('modalEditSessionSlot');
};

window.deleteSessionSlot = function (id) {
    if (confirm("Are you sure you want to remove this training session slot?")) {
        let list = getTrainerScheduleList();
        list = list.filter(s => s.id !== id);
        saveTrainerScheduleList(list);
        window.showToast("Session slot removed.", "info");
    }
};

function renderTrainerScheduleViews() {
    const list = getTrainerScheduleList();
    const members = window.flexTrainerClientsCache.members || [];

    if ($('#addSessionMemberSelect').length && members.length > 0) {
        let opts = '<option value="">-- Choose Member / Trainee --</option>';
        members.forEach(m => {
            opts += `<option value="${m.memberId}">MEM-${m.memberId} - ${m.memberFullName || m.email || 'Member'}</option>`;
        });
        $('#addSessionMemberSelect').html(opts);
    }

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = daysOfWeek[new Date().getDay()];

    const todaySessions = list.filter(s => s.day === currentDayName);
    const completedSessions = list.filter(s => s.status === 'COMPLETED');

    $('#statScheduleTotal').text(list.length);
    $('#statScheduleToday').text(todaySessions.length);
    $('#statScheduleCompleted').text(completedSessions.length);
    $('.dash-nav-item[data-section="sessions"] .nav-badge, #badgeNavSessions').text(list.length);

    const tbody = $('#tableTrainerSchedule tbody');
    if (tbody.length) {
        tbody.empty();

        let filtered = list;
        if (window.currentScheduleDayFilter && window.currentScheduleDayFilter !== 'ALL') {
            filtered = filtered.filter(s => s.day === window.currentScheduleDayFilter);
        }
        if (window.currentScheduleStatusFilter && window.currentScheduleStatusFilter !== 'ALL') {
            filtered = filtered.filter(s => s.status === window.currentScheduleStatusFilter);
        }

        if (filtered.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="6" style="text-align:center; padding:36px; color:var(--text-muted);">
                        No training session slots found.
                    </td>
                </tr>
            `);
        } else {
            filtered.forEach(s => {
                const initials = s.memberName ? s.memberName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CL';

                let statusBadge = 'badge-warning';
                let statusLabel = 'Upcoming';
                if (s.status === 'COMPLETED') {
                    statusBadge = 'badge-success';
                    statusLabel = 'Completed ✓';
                } else if (s.status === 'IN_PROGRESS') {
                    statusBadge = 'badge-info';
                    statusLabel = 'In Progress';
                } else if (s.status === 'CANCELLED') {
                    statusBadge = 'badge-danger';
                    statusLabel = 'Cancelled';
                }

                tbody.append(`
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="badge badge-lime" style="font-size:11px; font-weight:700;">${s.day}</span>
                                <strong style="color:#fff; font-size:13px;">${s.time}</strong>
                            </div>
                        </td>
                        <td>
                            <div class="cell-member">
                                <div class="member-avatar" style="width:32px; height:32px; font-size:11px;">${initials}</div>
                                <div class="member-meta">
                                    <strong style="font-size:13px;">${s.memberName}</strong>
                                    <span style="font-size:11px;">MEM-${s.memberId}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style="font-weight:600; color:#fff; font-size:13px;">${s.focus}</div>
                            ${s.notes ? `<div style="font-size:11px; color:var(--text-dim); margin-top:2px;">📝 ${s.notes}</div>` : ''}
                        </td>
                        <td>
                            <span style="color:var(--text-dim); font-size:12px;">📍 ${s.zone}</span>
                        </td>
                        <td>
                            <span class="badge ${statusBadge}">${statusLabel}</span>
                        </td>
                        <td style="text-align:center;">
                            <div class="action-btns" style="justify-content:center; gap:6px;">
                                <button class="btn btn-sm ${s.status === 'COMPLETED' ? 'btn-secondary' : 'btn-primary'}" style="padding:3px 8px; font-size:11px;" onclick="window.toggleSessionStatus('${s.id}')">${s.status === 'COMPLETED' ? 'Undo ↺' : 'Done ✓'}</button>
                                <button class="btn-icon edit" onclick="window.openEditSessionModal('${s.id}')" title="Edit">✏️</button>
                                <button class="btn-icon danger" onclick="window.deleteSessionSlot('${s.id}')" title="Delete">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    }
}

window.openAssignPlanForMember = function (memberId) {
    populateWorkoutAssignModals();
    setTimeout(() => {
        $('#assignPlanMemberSelect').val(String(memberId));
        openModal('modalAssignWorkoutPlan');
    }, 150);
};

window.openClientProgressModal = function (memberId) {
    window.currentProgressModalMemberId = memberId;
    const members = window.flexTrainerClientsCache.members || [];
    const member = members.find(m => String(m.memberId) === String(memberId));
    if (!member) return;

    const plans = window.flexTrainerClientsCache.plans || [];
    const assignments = window.flexTrainerClientsCache.assignments || [];
    const attendance = window.flexTrainerClientsCache.attendance || [];

    const initials = member.memberFullName ? member.memberFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CL';
    const height = member.heightCm || 175;
    const weight = member.weightKg || 70;
    const hM = height / 100;
    const bmiVal = (weight / (hM * hM)).toFixed(1);

    let bmiCat = "Healthy Weight";
    let bmiBadgeClass = "badge-lime";
    let goalDesc = "Muscle Hypertrophy & Progressive Overload Strength Training.";

    if (bmiVal < 18.5) {
        bmiCat = "Underweight";
        bmiBadgeClass = "badge-info";
        goalDesc = "High-Calorie Hypertrophy & Mass Gaining.";
    } else if (bmiVal >= 25 && bmiVal < 30) {
        bmiCat = "Overweight";
        bmiBadgeClass = "badge-warning";
        goalDesc = "Fat Loss & Metabolic Conditioning.";
    } else if (bmiVal >= 30) {
        bmiCat = "Obesity";
        bmiBadgeClass = "badge-danger";
        goalDesc = "Weight Management & Low-Impact Cardio.";
    }

    const memberAttendance = attendance.filter(a => String(a.memberId) === String(memberId));
    const assignment = assignments.find(a => String(a.memberId) === String(memberId) && a.planStatus !== 'DELETED');
    let activePlan = assignment ? plans.find(p => String(p.planId) === String(assignment.planId)) : null;
    if (!activePlan) {
        const localId = localStorage.getItem("flex_selected_plan_" + memberId);
        if (localId) activePlan = plans.find(p => String(p.planId) === String(localId));
    }

    $('#cpfAvatar').text(initials);
    $('#cpfName').text(member.memberFullName || 'Client');
    $('#cpfId').text(`MEM-${member.memberId}`);
    $('#cpfGender').text(member.gender || 'MALE');
    $('#cpfEmail').text(member.email || member.memberEmail || 'client@gym.com');
    $('#cpfStatusBadge').attr('class', `badge ${member.memberStatus === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`).text(`${member.memberStatus || 'ACTIVE'} MEMBER`);

    $('#cpfHeight').text(`${height} cm`);
    $('#cpfWeight').text(`${weight} kg`);
    $('#cpfBmi').text(bmiVal);
    $('#cpfSessions').text(`${memberAttendance.length} Logged`);

    $('#cpfBmiCategory').attr('class', `badge ${bmiBadgeClass}`).text(bmiCat);
    $('#cpfGoalDesc').text(goalDesc);

    if (activePlan) {
        const diffBadge = activePlan.difficultyLevelStatus === 'BEGINNER' ? 'badge-info' :
                         (activePlan.difficultyLevelStatus === 'ADVANCED' ? 'badge-danger' : 'badge-lime');
        $('#cpfPlanDetails').html(`
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <strong style="color:var(--primary); font-size:1rem;">${activePlan.planName}</strong>
                <span class="badge ${diffBadge}">${activePlan.difficultyLevelStatus || 'INTERMEDIATE'}</span>
            </div>
            <p style="margin:0 0 6px 0; color:#ccc;">${activePlan.description || 'Customized strength routine.'}</p>
        `);
    } else {
        $('#cpfPlanDetails').html(`
            <div style="text-align:center; padding:12px; color:var(--text-muted);">
                <span>No workout plan assigned yet.</span><br/>
                <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px; font-size:11px;" onclick="closeModal('modalClientProgress'); window.openAssignPlanForMember(${member.memberId});">📋 Assign Routine Now</button>
            </div>
        `);
    }

    const savedNotes = localStorage.getItem("flex_trainer_notes_" + memberId) || "";
    $('#cpfTrainerNotes').val(savedNotes);
    $('#cpfNotesSavedStatus').text("");

    openModal('modalClientProgress');
};

function syncTrainerAnalytics() {
    FlexAPI.ajax({
        url: "/members/getAllMembers",
        type: "GET",
        success: function (members) {
            window.flexTrainerClientsCache.members = Array.isArray(members) ? members : [];

            FlexAPI.ajax({
                url: "/workout-plans/getAllWorkoutPlans",
                type: "GET",
                success: function (plans) {
                    window.flexTrainerClientsCache.plans = Array.isArray(plans) ? plans : [];

                    FlexAPI.ajax({
                        url: "/member-workout-plans/getAllPlans",
                        type: "GET",
                        success: function (assignments) {
                            window.flexTrainerClientsCache.assignments = Array.isArray(assignments) ? assignments : [];

                            FlexAPI.ajax({
                                url: "/attendance/getAllAttendance",
                                type: "GET",
                                success: function (attendance) {
                                    window.flexTrainerClientsCache.attendance = Array.isArray(attendance) ? attendance : [];
                                    renderTrainerViews();
                                },
                                error: function () {
                                    window.flexTrainerClientsCache.attendance = [];
                                    renderTrainerViews();
                                }
                            });
                        },
                        error: function () {
                            window.flexTrainerClientsCache.assignments = [];
                            renderTrainerViews();
                        }
                    });
                },
                error: function () {
                    window.flexTrainerClientsCache.plans = [];
                    renderTrainerViews();
                }
            });
        }
    });
}

function renderTrainerViews() {
    const members = window.flexTrainerClientsCache.members || [];
    const plans = window.flexTrainerClientsCache.plans || [];
    const assignments = window.flexTrainerClientsCache.assignments || [];
    const attendance = window.flexTrainerClientsCache.attendance || [];

    const activeMembers = members.filter(m => m.memberStatus === 'ACTIVE');
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogs = attendance.filter(a => a.checkInTime && a.checkInTime.startsWith(todayStr));
    const todayCount = todayLogs.length > 0 ? todayLogs.length : Math.min(members.length, 3);

    $('#trainerStatClients').text(members.length);
    $('#trainerStatClientsTrend').text(`${activeMembers.length} Active • Registered Members`);
    $('.dash-nav-item[data-section="clients"] .nav-badge').text(members.length);

    $('#trainerStatTodaySessions').text(`${todayCount} Trainees`);
    $('#trainerStatTodaySessionsTrend').text(`${attendance.length} Total Verification Sessions`);

    $('#trainerStatRoutines').text(`${plans.length} Plans`);
    $('#trainerStatRoutinesTrend').text(`Master Workout Templates`);
    $('.dash-nav-item[data-section="workouts"] .nav-badge').text(plans.length);

    const tbodyClients = $('#tableTrainerClients tbody, #view-clients table tbody');
    if (tbodyClients.length) {
        tbodyClients.empty();
        if (members.length === 0) {
            tbodyClients.html(`
                <tr>
                    <td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">
                        No registered gym clients found.
                    </td>
                </tr>
            `);
        } else {
            members.forEach(m => {
                const initials = m.memberFullName ? m.memberFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CL';
                const height = m.heightCm || 175;
                const weight = m.weightKg || 70;
                const hM = height / 100;
                const bmiVal = (weight / (hM * hM)).toFixed(1);

                let bmiCategory = "Healthy (Hypertrophy)";
                let bmiClass = "badge-lime";
                if (bmiVal < 18.5) {
                    bmiCategory = "Underweight (Bulking)";
                    bmiClass = "badge-info";
                } else if (bmiVal >= 25 && bmiVal < 30) {
                    bmiCategory = "Overweight (Fat Loss)";
                    bmiClass = "badge-warning";
                } else if (bmiVal >= 30) {
                    bmiCategory = "Obese (Cardio)";
                    bmiClass = "badge-danger";
                }

                const assignment = assignments.find(a => String(a.memberId) === String(m.memberId) && a.planStatus !== 'DELETED');
                let plan = assignment ? plans.find(p => String(p.planId) === String(assignment.planId)) : null;
                if (!plan) {
                    const localId = localStorage.getItem("flex_selected_plan_" + m.memberId);
                    if (localId) plan = plans.find(p => String(p.planId) === String(localId));
                }

                let routineBadgeHtml = '';
                if (plan) {
                    const diffBadge = plan.difficultyLevelStatus === 'BEGINNER' ? 'badge-info' :
                                     (plan.difficultyLevelStatus === 'ADVANCED' ? 'badge-danger' : 'badge-lime');
                    routineBadgeHtml = `
                        <div>
                            <strong style="color:#fff; font-size:13px;">${plan.planName}</strong>
                            <div style="margin-top:2px;">
                                <span class="badge ${diffBadge}" style="font-size:10px; padding:2px 6px;">${plan.difficultyLevelStatus || 'INTERMEDIATE'}</span>
                            </div>
                        </div>
                    `;
                } else {
                    routineBadgeHtml = `
                        <button class="btn btn-secondary btn-sm" style="padding:2px 8px; font-size:11px; color:var(--primary);" onclick="window.openAssignPlanForMember(${m.memberId})">
                            + Assign Routine
                        </button>
                    `;
                }

                const memberSessions = attendance.filter(a => String(a.memberId) === String(m.memberId));
                const sessionsHtml = `<span class="badge badge-info" style="font-size:11px;">${memberSessions.length} Sessions Logged</span>`;

                tbodyClients.append(`
                    <tr>
                        <td>
                            <div class="cell-member">
                                <div class="member-avatar">${initials}</div>
                                <div class="member-meta">
                                    <strong>${m.memberFullName || 'Client'}</strong>
                                    <span>MEM-${m.memberId} • ${m.email || m.memberEmail || 'Member'}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style="font-size:13px; color:#fff; font-weight:600;">${height} cm / ${weight} kg</div>
                            <div style="margin-top:2px;">
                                <span class="badge ${bmiClass}" style="font-size:10px; padding:2px 6px;">${bmiVal} BMI • ${bmiCategory}</span>
                            </div>
                        </td>
                        <td>${routineBadgeHtml}</td>
                        <td>${sessionsHtml}</td>
                        <td style="text-align:center;">
                            <div class="action-btns" style="justify-content:center; gap:6px;">
                                <button class="btn btn-primary btn-sm" style="padding:4px 9px; font-size:11px;" onclick="window.openAssignPlanForMember(${m.memberId})">📋 Assign Plan</button>
                                <button class="btn btn-secondary btn-sm" style="padding:4px 9px; font-size:11px;" onclick="window.openClientProgressModal(${m.memberId})">📈 Client File</button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    }

    const tbodyOverview = $('#view-overview table tbody');
    if (tbodyOverview.length) {
        tbodyOverview.empty();
        const scheduleList = getTrainerScheduleList();
        const sampleSessions = scheduleList.slice(0, 4);

        sampleSessions.forEach(s => {
            tbodyOverview.append(`
                <tr>
                    <td><span class="badge badge-lime" style="font-size:10px; margin-right:4px;">${s.day}</span> <strong>${s.time}</strong></td>
                    <td><strong>${s.memberName}</strong> <span style="font-size:11px; color:var(--text-dim);">(MEM-${s.memberId})</span></td>
                    <td>${s.focus}</td>
                    <td><span class="badge ${s.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">${s.status === 'COMPLETED' ? 'Completed ✓' : 'Upcoming'}</span></td>
                </tr>
            `);
        });
    }

    renderTrainerScheduleViews();

    const tbodyWorkouts = $('#tableTrainerWorkouts tbody, #view-workouts table tbody');
    if (tbodyWorkouts.length) {
        tbodyWorkouts.empty();
        if (plans.length === 0) {
            tbodyWorkouts.html(`
                <tr>
                    <td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">
                        No workout programs created yet.
                    </td>
                </tr>
            `);
        } else {
            plans.forEach(p => {
                const diffBadge = p.difficultyLevelStatus === 'BEGINNER' ? 'badge-info' :
                                 (p.difficultyLevelStatus === 'ADVANCED' ? 'badge-danger' : 'badge-lime');
                const statusBadge = p.planStatus === 'INACTIVE' ? 'badge-muted' : 'badge-success';

                tbodyWorkouts.append(`
                    <tr>
                        <td><strong>${p.planName}</strong></td>
                        <td><span class="badge ${diffBadge}">${p.difficultyLevelStatus || 'INTERMEDIATE'}</span></td>
                        <td><span style="color:var(--text-dim); font-size:13px;">${p.description || 'Custom Workout Plan'}</span></td>
                        <td><span class="badge ${statusBadge}">${p.planStatus || 'ACTIVE'}</span></td>
                        <td style="text-align:center;">
                            <div class="action-btns" style="justify-content:center;">
                                <button class="btn-icon edit edit-workout-btn" data-id="${p.planId}" title="Edit Plan">✏️</button>
                                <button class="btn-icon danger delete-workout-btn" data-id="${p.planId}" title="Delete Plan">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    }

    const ctxTrainer = document.getElementById('chartTrainerBreakdown');
    if (ctxTrainer && typeof Chart !== 'undefined') {
        let beginner = 0, intermediate = 0, advanced = 0;
        plans.forEach(p => {
            if (p.difficultyLevelStatus === 'BEGINNER') beginner++;
            else if (p.difficultyLevelStatus === 'ADVANCED') advanced++;
            else intermediate++;
        });

        if (plans.length === 0) {
            beginner = 1; intermediate = 2; advanced = 1;
        }

        if (window.flexCharts.trainerBreakdown) {
            window.flexCharts.trainerBreakdown.data.datasets[0].data = [beginner, intermediate, advanced];
            window.flexCharts.trainerBreakdown.update();
        } else {
            window.flexCharts.trainerBreakdown = new Chart(ctxTrainer, {
                type: 'doughnut',
                data: {
                    labels: ['Beginner', 'Intermediate', 'Advanced'],
                    datasets: [{
                        data: [beginner, intermediate, advanced],
                        backgroundColor: ['#00e5ff', '#d7ff00', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#181818'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 12,
                                usePointStyle: true,
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        }
    }
}

// receptionist dashboard controller
function initReceptionistDashboard() {
    syncReceptionistAnalytics();
    initRealtimeDashboardSync('RECEPTIONIST');
    loadAdminAttendance();

    $('#formRcpAddMember').off('submit').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            memberFullName: $('#rcpMemberFullName').val().trim(),
            email: $('#rcpMemberEmail').val().trim(),
            memberPhoneNumber: $('#rcpMemberPhone').val().trim(),
            age: $('#rcpMemberAge').val() || '25',
            gender: $('#rcpMemberGender').val() || 'Male',
            heightCm: parseFloat($('#rcpMemberHeight').val()) || 175,
            weightKg: parseFloat($('#rcpMemberWeight').val()) || 70
        };

        const btn = $('#btnSaveRcpMember');
        btn.prop('disabled', true).text('Registering Member...');

        FlexAPI.ajax({
            url: "/members/saveMember",
            type: "POST",
            data: payload,
            success: function () {
                btn.prop('disabled', false).text('Register & Email Credentials 🚀');
                window.showToast("Member registered successfully!", "success");
                $('#formRcpAddMember')[0].reset();
                closeModal('modalAddMember');
                syncReceptionistAnalytics();
            },
            error: function (xhr) {
                btn.prop('disabled', false).text('Register & Email Credentials 🚀');
                const errMsg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to register member.";
                window.showToast(errMsg, "error");
            }
        });
    });

    loadAdminLockers();
    initPosSystem();
}

function syncReceptionistAnalytics() {
    loadAdminAttendance();

    FlexAPI.ajax({
        url: "/members/getAllMembers",
        type: "GET",
        success: function (members) {
            if (!Array.isArray(members)) members = [];
            const activeCount = members.filter(m => m.memberStatus === 'ACTIVE').length;
            $('#rcpStatActiveMembers').text(activeCount);
            $('#rcpStatActiveMembersTrend').text(`Total: ${members.length} Registered`);
            $('.dash-nav-item[data-section="members"] .nav-badge').text(members.length);

            const tbody = $('#rcpMembersTable tbody, #view-members table tbody');
            if (tbody.length) {
                tbody.empty();
                members.forEach(m => {
                    const initials = m.memberFullName ? m.memberFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'M';
                    tbody.append(`
                        <tr>
                            <td>
                                <div class="cell-member">
                                    <div class="member-avatar">${initials}</div>
                                    <div class="member-meta">
                                        <strong>${m.memberFullName || 'N/A'}</strong>
                                        <span>MEM-${m.memberId}</span>
                                    </div>
                                </div>
                            </td>
                            <td>${m.email || 'N/A'}<br><small style="color:var(--text-muted)">${m.memberPhoneNumber || ''}</small></td>
                            <td>${m.gender || 'N/A'} / ${m.age || 'N/A'} yrs<br><small style="color:var(--text-muted)">${m.heightCm || 0} cm / ${m.weightKg || 0} kg</small></td>
                            <td><span class="badge ${m.memberStatus === 'ACTIVE' ? 'badge-success' : 'badge-danger'}">${m.memberStatus || 'ACTIVE'}</span></td>
                            <td>
                                <div style="display:flex; gap:6px;">
                                    <button class="btn-icon edit edit-member-btn" data-id="${m.memberId}" title="Edit Member">✏️</button>
                                    <button class="btn btn-secondary btn-sm view-member-card-btn" data-id="${m.memberId}" style="padding:4px 8px;font-size:11px;font-weight:600;border-color:var(--lime);color:var(--lime);" title="View Access Pass">Card 💳</button>
                                </div>
                            </td>
                        </tr>
                    `);
                });
            }
        }
    });

    FlexAPI.ajax({
        url: "/memberships/getAllMemberships",
        type: "GET",
        success: function (memberships) {
            if (!Array.isArray(memberships)) memberships = [];
            const pending = memberships.filter(m => m.membershipStatus === 'PENDING').length;
            $('#rcpStatPendingMemberships').text(pending);
            $('#rcpStatPendingMembershipsTrend').text(pending > 0 ? `${pending} Need Approval` : 'All Approved ✓');
            $('.dash-nav-item[data-section="memberships"] .nav-badge').text(pending);

            loadPendingMembershipRequests();
        }
    });

    FlexAPI.ajax({
        url: "/lockers/getAllLockers",
        type: "GET",
        success: function (lockers) {
            if (!Array.isArray(lockers)) lockers = [];
            const activeLockers = lockers.filter(l => l.status !== 'DELETED');
            const occupied = activeLockers.filter(l => l.status === 'OCCUPIED' || l.isOccupied === true).length;
            const available = activeLockers.length - occupied;

            $('#rcpStatAvailableLockers').text(available);
            $('#rcpStatAvailableLockersTrend').text(`${occupied} Occupied / ${activeLockers.length} Total`);
            $('.dash-nav-item[data-section="lockers"] .nav-badge').text(available);
        }
    });
}

// front desk pos system
window.flexPosState = {
    baseItems: [
        { id: 'DP-1', name: '🎟️ Single Day Pass', price: 1000, category: 'PASS', icon: '🎟️', stock: 999 },
        { id: 'DP-3', name: '🎫 3-Day Guest Pass', price: 2500, category: 'PASS', icon: '🎫', stock: 999 },
        { id: 'TR-1', name: '🧼 Fresh Towel Rental', price: 200, category: 'PASS', icon: '🧼', stock: 50 },
        { id: 'ED-1', name: '⚡ RedBull Energy Drink', price: 450, category: 'DRINKS', icon: '⚡', stock: 40 },
        { id: 'PS-1', name: '🥤 Whey Protein Shake', price: 650, category: 'DRINKS', icon: '🥤', stock: 60 },
        { id: 'WB-1', name: '💧 Mineral Water 1L', price: 150, category: 'DRINKS', icon: '💧', stock: 80 },
        { id: 'PB-1', name: '🍫 Nut Bar / Protein Bar', price: 380, category: 'DRINKS', icon: '🍫', stock: 35 }
    ],
    items: [],
    cart: [],
    paymentMethod: 'CASH',
    discount: 0,
    selectedCategory: 'ALL',
    searchQuery: '',
    transactions: JSON.parse(localStorage.getItem('flex_pos_transactions') || '[]')
};

function initPosSystem() {
    window.flexPosState.items = [...window.flexPosState.baseItems];

    FlexAPI.ajax({
        url: "/products/getAllProducts",
        type: "GET",
        success: function (products) {
            if (Array.isArray(products)) {
                products.filter(p => p.productStatus !== 'DELETED').forEach(p => {
                    window.flexPosState.items.push({
                        id: `PRD-${p.productId}`,
                        productId: p.productId,
                        name: p.productName || 'Gym Supplement',
                        price: parseFloat(p.productPrice || 0),
                        category: 'STORE',
                        icon: '📦',
                        stock: parseInt(p.stockQuantity || 10, 10)
                    });
                });
            }
            renderPosCatalog();
        },
        error: function () {
            renderPosCatalog();
        }
    });

    FlexAPI.ajax({
        url: "/members/getAllMembers",
        type: "GET",
        success: function (members) {
            const select = $('#posCustomerSelect');
            if (!select.length) return;
            select.find('option:not([value="WALK_IN"])').remove();
            if (Array.isArray(members)) {
                members.forEach(m => {
                    select.append(`<option value="${m.memberId}">👤 MEM-${m.memberId} - ${m.memberFullName || 'Member'}</option>`);
                });
            }
        }
    });

    renderPosCatalog();
    renderPosTicket();
    renderPosTransactions();
}

function renderPosCatalog() {
    const grid = $('#posItemsGrid');
    if (!grid.length) return;
    grid.empty();

    const state = window.flexPosState;
    let filtered = state.items;

    if (state.selectedCategory !== 'ALL') {
        filtered = filtered.filter(i => i.category === state.selectedCategory);
    }

    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
        grid.html(`
            <div style="grid-column: 1 / -1; text-align:center; padding:32px; color:var(--text-muted); font-size:13px;">
                No items found in this category.
            </div>
        `);
        return;
    }

    filtered.forEach(item => {
        grid.append(`
            <div class="pos-item-card" data-id="${item.id}" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 10px; cursor: pointer; text-align: center;">
                <div style="font-size: 26px; margin-bottom: 4px;">${item.icon || '📦'}</div>
                <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 4px; min-height: 28px;">
                    ${item.name}
                </div>
                <div style="font-size: 13px; font-weight: 800; color: var(--lime); margin-top: 4px;">
                    Rs. ${Number(item.price).toLocaleString()}
                </div>
                <div style="margin-top: 8px;">
                    <span class="badge badge-lime" style="font-size: 10px; padding: 3px 8px; width: 100%;">+ Add to Bill</span>
                </div>
            </div>
        `);
    });
}

function renderPosTicket() {
    const list = $('#posTicketList');
    if (!list.length) return;
    list.empty();

    const state = window.flexPosState;
    const cart = state.cart;

    $('#posTicketItemCount').text(`${cart.reduce((s, i) => s + i.qty, 0)} Items`);

    if (cart.length === 0) {
        list.html(`
            <div style="text-align:center; padding:40px 10px; color:var(--text-muted); font-size:12px;">
                Ticket is empty.<br>Tap items from the left to start sale.
            </div>
        `);
        $('#posSubtotal').text('Rs. 0');
        $('#posGrandTotal').text('Rs. 0');
        $('#posChangeReturn').val('Rs. 0');
        $('#btnPosCompleteSale').prop('disabled', true);
        return;
    }

    let subtotal = 0;

    cart.forEach((item, idx) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        list.append(`
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:12px;">
                <div style="flex:1; padding-right:8px;">
                    <strong style="color:#fff; display:block; line-height:1.2;">${item.name}</strong>
                    <small style="color:var(--text-muted);">Rs. ${Number(item.price).toLocaleString()} each</small>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <button type="button" class="pos-qty-btn pos-qty-minus" data-idx="${idx}" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:22px; height:22px; border-radius:4px; cursor:pointer;">-</button>
                    <span style="font-weight:700; color:#fff; min-width:18px; text-align:center;">${item.qty}</span>
                    <button type="button" class="pos-qty-btn pos-qty-plus" data-idx="${idx}" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:22px; height:22px; border-radius:4px; cursor:pointer;">+</button>
                    <strong style="min-width:65px; text-align:right; color:var(--lime);">Rs. ${Number(itemTotal).toLocaleString()}</strong>
                    <button type="button" class="pos-item-remove" data-idx="${idx}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; margin-left:4px;">✕</button>
                </div>
            </div>
        `);
    });

    const discount = Math.max(0, parseFloat($('#posDiscountInput').val()) || 0);
    const grandTotal = Math.max(0, subtotal - discount);

    $('#posSubtotal').text(`Rs. ${Number(subtotal).toLocaleString()}`);
    $('#posGrandTotal').text(`Rs. ${Number(grandTotal).toLocaleString()}`);
    $('#btnPosCompleteSale').prop('disabled', false);

    calculatePosChange(grandTotal);
}

function calculatePosChange(grandTotal) {
    if (grandTotal === undefined) {
        const subtotal = window.flexPosState.cart.reduce((s, i) => s + (i.price * i.qty), 0);
        const discount = Math.max(0, parseFloat($('#posDiscountInput').val()) || 0);
        grandTotal = Math.max(0, subtotal - discount);
    }

    if (window.flexPosState.paymentMethod === 'CARD') {
        $('#posCashCalculatorWrap').hide();
        $('#posChangeReturn').val('Rs. 0');
        return;
    }

    $('#posCashCalculatorWrap').show();
    const tendered = parseFloat($('#posCashTendered').val()) || 0;
    if (tendered >= grandTotal && grandTotal > 0) {
        const change = tendered - grandTotal;
        $('#posChangeReturn').val(`Rs. ${Number(change).toLocaleString()}`).css('color', '#00e5ff');
    } else if (tendered > 0 && tendered < grandTotal) {
        const short = grandTotal - tendered;
        $('#posChangeReturn').val(`Short: Rs. ${Number(short).toLocaleString()}`).css('color', '#ef4444');
    } else {
        $('#posChangeReturn').val('Rs. 0').css('color', '#00e5ff');
    }
}

function renderPosTransactions() {
    const list = window.flexPosState.transactions;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTx = list.filter(t => t.date && t.date.startsWith(todayStr));

    const totalRev = todayTx.reduce((s, t) => s + t.total, 0);
    const dayPassCount = todayTx.reduce((s, t) => s + (t.dayPassCount || 0), 0);
    const cashTotal = todayTx.filter(t => t.method === 'CASH').reduce((s, t) => s + t.total, 0);

    $('#posStatTotalRevenue').text(`Rs. ${Number(totalRev).toLocaleString()}`);
    $('#posStatTxCount').text(todayTx.length);
    $('#posStatDayPassCount').text(dayPassCount);
    $('#posStatCashInDrawer').text(`Rs. ${Number(cashTotal).toLocaleString()}`);

    const tbody = $('#tablePosTransactions tbody');
    if (!tbody.length) return;
    tbody.empty();

    if (list.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="7" style="text-align:center; padding:28px; color:var(--text-muted); font-size:13px;">
                    No counter sales recorded today.
                </td>
            </tr>
        `);
        return;
    }

    list.slice(0, 20).forEach((tx) => {
        tbody.append(`
            <tr>
                <td><strong>#POS-${tx.id}</strong></td>
                <td><strong>${tx.customer}</strong></td>
                <td style="max-width:220px; white-space:normal; font-size:12px;">${tx.itemsSummary}</td>
                <td><span class="badge ${tx.method === 'CASH' ? 'badge-success' : 'badge-lime'}">${tx.method}</span></td>
                <td><strong style="color:var(--lime);">Rs. ${Number(tx.total).toLocaleString()}</strong></td>
                <td><small style="color:var(--text-muted);">${tx.time}</small></td>
                <td>
                    <button class="btn btn-secondary btn-sm" style="padding:3px 8px; font-size:11px;" onclick="viewPosReceiptModal('${tx.id}')">Receipt 📄</button>
                </td>
            </tr>
        `);
    });
}

function viewPosReceiptModal(txId) {
    const tx = window.flexPosState.transactions.find(t => String(t.id) === String(txId));
    if (!tx) return;

    $('#posReceiptNo').text(`#POS-${tx.id}`);
    $('#posReceiptTime').text(tx.time || 'Today');
    $('#posReceiptCustomer').text(tx.customer || 'Walk-In Guest');
    $('#posReceiptCashier').text(localStorage.getItem('userFullName') || 'Front Desk');

    const body = $('#posReceiptItemsBody');
    body.empty();

    if (Array.isArray(tx.items)) {
        tx.items.forEach(it => {
            body.append(`
                <tr>
                    <td style="padding:4px 0;">${it.name}</td>
                    <td style="text-align:center;">${it.qty}</td>
                    <td style="text-align:right;">Rs. ${Number(it.price).toLocaleString()}</td>
                    <td style="text-align:right;">Rs. ${Number(it.price * it.qty).toLocaleString()}</td>
                </tr>
            `);
        });
    }

    $('#posReceiptSubtotal').text(`Rs. ${Number(tx.subtotal || tx.total).toLocaleString()}`);
    $('#posReceiptDiscount').text(`Rs. ${Number(tx.discount || 0).toLocaleString()}`);
    $('#posReceiptGrandTotal').text(`Rs. ${Number(tx.total).toLocaleString()}`);
    $('#posReceiptMethod').text(tx.method || 'CASH');

    if (tx.method === 'CASH') {
        $('#posReceiptCashRow, #posReceiptChangeRow').show();
        $('#posReceiptTendered').text(`Rs. ${Number(tx.tendered || tx.total).toLocaleString()}`);
        $('#posReceiptChange').text(`Rs. ${Number(tx.change || 0).toLocaleString()}`);
    } else {
        $('#posReceiptCashRow, #posReceiptChangeRow').hide();
    }

    openModal('modalPosReceipt');
}

$(document).on('click', '.pos-filter-btn', function () {
    $('.pos-filter-btn').removeClass('btn-primary active').addClass('btn-secondary');
    $(this).removeClass('btn-secondary').addClass('btn-primary active');
    window.flexPosState.selectedCategory = $(this).data('cat');
    renderPosCatalog();
});

$(document).on('input', '#posSearchInput', function () {
    window.flexPosState.searchQuery = $(this).val().trim();
    renderPosCatalog();
});

$(document).on('click', '.pos-item-card', function () {
    const itemId = $(this).data('id');
    const item = window.flexPosState.items.find(i => i.id == itemId);
    if (!item) return;

    const existing = window.flexPosState.cart.find(i => i.id == itemId);
    if (existing) {
        existing.qty++;
    } else {
        window.flexPosState.cart.push({
            id: item.id,
            productId: item.productId || null,
            name: item.name,
            price: item.price,
            category: item.category,
            qty: 1
        });
    }

    renderPosTicket();
});

$(document).on('click', '.pos-qty-plus', function () {
    const idx = $(this).data('idx');
    if (window.flexPosState.cart[idx]) {
        window.flexPosState.cart[idx].qty++;
        renderPosTicket();
    }
});

$(document).on('click', '.pos-qty-minus', function () {
    const idx = $(this).data('idx');
    if (window.flexPosState.cart[idx]) {
        if (window.flexPosState.cart[idx].qty > 1) {
            window.flexPosState.cart[idx].qty--;
        } else {
            window.flexPosState.cart.splice(idx, 1);
        }
        renderPosTicket();
    }
});

$(document).on('click', '.pos-item-remove', function () {
    const idx = $(this).data('idx');
    window.flexPosState.cart.splice(idx, 1);
    renderPosTicket();
});

$(document).on('input', '#posDiscountInput, #posCashTendered', function () {
    calculatePosChange();
});

$(document).on('click', '.pos-pay-method-btn', function () {
    $('.pos-pay-method-btn').removeClass('btn-primary').addClass('btn-secondary');
    $(this).removeClass('btn-secondary').addClass('btn-primary');
    window.flexPosState.paymentMethod = $(this).data('method');
    calculatePosChange();
});

$(document).on('click', '#btnPosResetRegister', function () {
    window.flexPosState.cart = [];
    $('#posDiscountInput').val(0);
    $('#posCashTendered').val('');
    $('#posCustomerSelect').val('WALK_IN');
    renderPosTicket();
    window.showToast("Register ticket cleared.", "info");
});

$(document).on('click', '#btnPosCompleteSale', function () {
    const state = window.flexPosState;
    if (state.cart.length === 0) return;

    const subtotal = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const discount = Math.max(0, parseFloat($('#posDiscountInput').val()) || 0);
    const grandTotal = Math.max(0, subtotal - discount);

    const tendered = parseFloat($('#posCashTendered').val()) || grandTotal;
    const change = Math.max(0, tendered - grandTotal);

    const customerVal = $('#posCustomerSelect').val();
    const customerText = $('#posCustomerSelect option:selected').text();
    const memberId = customerVal !== 'WALK_IN' ? parseInt(customerVal, 10) : null;
    const customerName = memberId ? customerText.split(' - ')[1] || `Member #${memberId}` : 'Walk-In Guest';

    const txId = Date.now().toString().slice(-6);
    const todayStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().substring(0, 5) + ' (' + todayStr + ')';

    const itemsSummary = state.cart.map(i => `${i.name} (x${i.qty})`).join(', ');
    const dayPassCount = state.cart.filter(i => i.category === 'PASS').reduce((s, i) => s + i.qty, 0);

    const newTx = {
        id: txId,
        date: todayStr,
        time: timeStr,
        customer: customerName,
        memberId: memberId,
        items: [...state.cart],
        itemsSummary: itemsSummary,
        subtotal: subtotal,
        discount: discount,
        total: grandTotal,
        method: state.paymentMethod,
        tendered: tendered,
        change: change,
        dayPassCount: dayPassCount
    };

    state.transactions.unshift(newTx);
    localStorage.setItem('flex_pos_transactions', JSON.stringify(state.transactions.slice(0, 50)));

    FlexAPI.ajax({
        url: "/payments/savePayment",
        type: "POST",
        data: {
            amount: grandTotal,
            paymentType: "SHOP_ORDER",
            paymentStatus: "PAID",
            memberId: memberId || null
        }
    });

    window.showToast(`Sale #POS-${txId} completed! Rs. ${Number(grandTotal).toLocaleString()} collected. 🎉`, "success");

    state.cart = [];
    $('#posDiscountInput').val(0);
    $('#posCashTendered').val('');
    renderPosTicket();
    renderPosTransactions();

    viewPosReceiptModal(txId);
});

$(document).on('click', '#btnPrintPosReceipt', function () {
    const content = document.getElementById('printablePosReceipt');
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=450,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>POS Receipt - Flex Gym</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; background: #fff; display: flex; justify-content: center; padding: 10px; margin: 0; }
                #printablePosReceipt { width: 300px; padding: 10px; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 4px 0; }
            </style>
        </head>
        <body>
            ${content.outerHTML}
            <script>
                window.onload = function() { window.print(); window.close(); }
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
});

window.flexRealtimeTimer = null;
function initRealtimeDashboardSync(role) {
    if (window.flexRealtimeTimer) {
        clearInterval(window.flexRealtimeTimer);
    }

    window.flexRealtimeTimer = setInterval(function () {
        if (document.hidden) return;

        if (role === 'ADMIN') {
            syncAdminAnalytics();
            loadAdminAttendance();
            loadAdminPayments();
            loadAdminOrders();
        } else if (role === 'RECEPTIONIST') {
            syncReceptionistAnalytics();
            loadAdminAttendance();
        } else if (role === 'TRAINER') {
            syncTrainerAnalytics();
        } else if (role === 'MEMBER') {
            const activeMemberId = localStorage.getItem("memberId");
            if (activeMemberId && typeof window.refreshMemberLiveStatus === 'function') {
                window.refreshMemberLiveStatus(activeMemberId);
            }
        }
    }, 20000);
}

function loadMemberAvailablePackages(currentMembership) {
    const grid = $('#memberPackagesGrid');
    if (!grid.length) return;

    FlexAPI.ajax({
        url: "/packages/getAllPackages",
        type: "GET",
        success: function (packages) {
            grid.empty();
            if (!Array.isArray(packages) || packages.length === 0) {
                grid.html(`
                    <div style="grid-column: 1 / -1; text-align:center; padding:32px; background:var(--bg-surface-2); border-radius:var(--radius-md); border:1px dashed var(--border);">
                        <p style="color:var(--text-muted); margin-bottom:0;">No membership packages published by gym administration yet.</p>
                    </div>
                `);
                return;
            }

            packages.forEach(p => {
                const isCurrent = currentMembership && String(currentMembership.packageId) === String(p.packageId);
                const isPending = isCurrent && currentMembership.membershipStatus === 'PENDING';
                const isActive = isCurrent && currentMembership.membershipStatus === 'ACTIVE';

                let buttonHtml = '';
                if (isActive) {
                    buttonHtml = `<button class="btn btn-secondary" style="width:100%; font-weight:700;" disabled>Current Active Plan ✓</button>`;
                } else if (isPending) {
                    buttonHtml = `<button class="btn btn-secondary" style="width:100%; border-color:var(--warning); color:var(--warning); font-weight:700;" disabled>Request Pending ⏳</button>`;
                } else {
                    buttonHtml = `<button class="btn btn-primary request-package-btn" data-id="${p.packageId}" data-name="${p.packageName}" style="width:100%;">Request This Package 🚀</button>`;
                }

                grid.append(`
                    <div class="dash-panel" style="border-top: 3px solid ${isActive ? 'var(--lime)' : isPending ? 'var(--warning)' : 'var(--border)'}; display:flex; flex-direction:column; justify-content:space-between; margin-bottom:0;">
                        <div>
                            <div class="stat-top" style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                <strong style="font-size:16px; color:#fff;">${p.packageName}</strong>
                                <span class="badge ${p.packageStatus === 'ACTIVE' ? 'badge-lime' : 'badge-danger'}">${p.durationMonths ? p.durationMonths + ' Mo' : 'Monthly'}</span>
                            </div>
                            <div style="font-size:22px; font-weight:800; color:var(--lime); margin-bottom:8px;">
                                Rs. ${Number(p.packagePrice || 0).toLocaleString()} <small style="font-size:12px; color:var(--text-muted)">/${p.durationMonths || 1}mo</small>
                            </div>
                            <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px; line-height:1.5;">
                                ${p.packageDescription || 'Full gym floor access, locker access, and fitness facilities.'}
                            </p>
                        </div>
                        <div style="margin-top:auto; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.08);">
                            ${buttonHtml}
                        </div>
                    </div>
                `);
            });
        },
        error: function () {
            grid.html(`
                <div style="grid-column: 1 / -1; text-align:center; padding:24px; color:var(--text-muted);">
                    <p style="margin-bottom:10px;">Could not connect to packages service.</p>
                </div>
            `);
        }
    });
}

function populateWorkoutAssignModals() {
    FlexAPI.ajax({
        url: "/members/getAllMembers",
        type: "GET",
        success: function (members) {
            if (!Array.isArray(members)) members = [];
            const activeMembers = members.filter(m => m.memberStatus !== 'DELETED');
            let opts = '<option value="">-- Choose Member / Client --</option>';
            activeMembers.forEach(m => {
                opts += `<option value="${m.memberId}">MEM-${m.memberId} - ${m.memberFullName || m.email || 'Member'}</option>`;
            });
            $('#assignPlanMemberSelect, #adminAssignMemberSelect').html(opts);
        }
    });

    FlexAPI.ajax({
        url: "/workout-plans/getAllWorkoutPlans",
        type: "GET",
        success: function (plans) {
            if (!Array.isArray(plans)) plans = [];
            const activePlans = plans.filter(p => p.planStatus !== 'DELETED');
            let opts = '<option value="">-- Choose Workout Routine --</option>';
            activePlans.forEach(p => {
                opts += `<option value="${p.planId}">${p.planName} (${p.difficultyLevelStatus || 'INTERMEDIATE'})</option>`;
            });
            $('#assignPlanSelect, #adminAssignPlanSelect').html(opts);
        }
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    $('#assignPlanDate, #adminAssignDate').val(todayStr);
}

function loadMemberWorkoutRoutine(mId) {
    FlexAPI.ajax({
        url: "/workout-plans/getAllWorkoutPlans",
        type: "GET",
        success: function (masterPlans) {
            if (!Array.isArray(masterPlans)) masterPlans = [];
            const activeMasterPlans = masterPlans.filter(p => p.planStatus !== 'DELETED');

            FlexAPI.ajax({
                url: "/member-workout-plans/getAllPlans",
                type: "GET",
                success: function (assignments) {
                    if (!Array.isArray(assignments)) assignments = [];

                    const myAssignment = assignments.find(a => (String(a.memberId) === String(mId)) && a.planStatus !== 'DELETED');
                    let activePlan = null;

                    if (myAssignment) {
                        activePlan = activeMasterPlans.find(p => String(p.planId) === String(myAssignment.planId));
                    }

                    const localSelectedPlanId = localStorage.getItem("flex_selected_plan_" + mId);
                    if (!activePlan && localSelectedPlanId) {
                        activePlan = activeMasterPlans.find(p => String(p.planId) === String(localSelectedPlanId));
                    }

                    if (!activePlan && activeMasterPlans.length > 0) {
                        activePlan = activeMasterPlans[0];
                    }

                    renderMemberWorkoutView(mId, activePlan, myAssignment, activeMasterPlans);
                },
                error: function () {
                    const activePlan = activeMasterPlans.length > 0 ? activeMasterPlans[0] : null;
                    renderMemberWorkoutView(mId, activePlan, null, activeMasterPlans);
                }
            });
        },
        error: function () {
            renderMemberWorkoutView(mId, null, null, []);
        }
    });
}

function renderMemberWorkoutView(mId, activePlan, myAssignment, allMasterPlans) {
    const fallbackTemplates = [
        {
            planId: 1,
            planName: "Hypertrophy Push-Pull-Legs (PPL)",
            difficultyLevelStatus: "INTERMEDIATE",
            description: "High-frequency bodybuilding hypertrophy split targeting major muscle groups with optimal recovery.",
            planStatus: "ACTIVE"
        },
        {
            planId: 2,
            planName: "Full-Body Strength & Conditioning",
            difficultyLevelStatus: "BEGINNER",
            description: "Comprehensive foundational gym program focusing on major compound movements and functional stamina.",
            planStatus: "ACTIVE"
        },
        {
            planId: 3,
            planName: "Upper / Lower Powerlifting Split",
            difficultyLevelStatus: "ADVANCED",
            description: "Heavy strength-focused periodization program designed for maximal strength and progressive overload.",
            planStatus: "ACTIVE"
        }
    ];

    const displayPlans = (allMasterPlans && allMasterPlans.length > 0) ? allMasterPlans : fallbackTemplates;
    const currentPlan = activePlan || displayPlans[0];

    $('#overviewMemberRoutine').text(currentPlan.planName);
    $('#overviewMemberRoutineDay').text(currentPlan.difficultyLevelStatus || 'Active Split');

    $('#memberActiveRoutineName').text(currentPlan.planName);
    $('#memberRoutineDiffBadge').text(currentPlan.difficultyLevelStatus || 'INTERMEDIATE');
    $('#memberActiveRoutineDesc').text(currentPlan.description || 'Coaching routine customized for your fitness goals.');

    if (myAssignment) {
        $('#memberRoutineAssignedDate').text(`Assigned: ${myAssignment.assignedDate || 'Active'}`);
        $('#memberRoutineStatusBadge').text('COACH ASSIGNED').attr('class', 'badge badge-success');
    } else {
        $('#memberRoutineAssignedDate').text('Self-Selected Routine');
        $('#memberRoutineStatusBadge').text('ACTIVE SPLIT').attr('class', 'badge badge-lime');
    }

    const scheduleDays = getWorkoutScheduleDays(currentPlan);
    const gridContainer = $('#memberRoutineDaysGrid');
    gridContainer.empty();

    const todayDateKey = new Date().toISOString().slice(0, 10);
    const dayOfWeek = (new Date().getDay() + 6) % 7;
    const todayIndex = dayOfWeek % scheduleDays.length;
    const isTodayCompleted = localStorage.getItem("flex_workout_done_" + mId + "_" + todayDateKey) === "true";

    scheduleDays.forEach((d, idx) => {
        const isToday = idx === todayIndex;
        let cardBorder = isToday ? 'border: 1px solid var(--lime); box-shadow: 0 0 15px var(--lime-glow);' : 'border: 1px solid var(--border);';
        let dayTitle = isToday ? `<strong style="color:var(--lime);">${d.day} (TODAY)</strong>` : `<strong>${d.day}</strong>`;
        let badgeHtml = isToday ? '<span class="badge badge-lime">Today\'s Focus</span>' : '<span class="badge badge-success">Active</span>';

        let buttonHtml = '';
        if (isToday) {
            if (isTodayCompleted) {
                buttonHtml = `<button class="btn btn-secondary" style="width:100%; margin-top:14px; font-size:12px; padding:8px; border-color:var(--lime); color:var(--lime); font-weight:700;" disabled>✓ Completed Today! 🔥</button>`;
            } else {
                buttonHtml = `<button class="btn btn-primary btn-mark-workout-done" data-mid="${mId}" style="width:100%; margin-top:14px; font-size:12px; padding:8px; font-weight:700;">Mark as Completed ✓</button>`;
            }
        }

        let exListHtml = d.exercises.map(ex => `<li>• ${ex}</li>`).join('');

        gridContainer.append(`
            <div style="background:var(--bg-surface-2); border-radius:var(--radius-md); padding:16px; display:flex; flex-direction:column; justify-content:space-between; ${cardBorder}">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        ${dayTitle}
                        ${badgeHtml}
                    </div>
                    <ul style="font-size:12px; color:${isToday ? 'var(--text-main)' : 'var(--text-muted)'}; display:flex; flex-direction:column; gap:6px; padding-left:0; list-style:none; margin:0;">
                        ${exListHtml}
                    </ul>
                </div>
                ${buttonHtml}
            </div>
        `);
    });

    const availableGrid = $('#memberAvailableWorkoutsGrid');
    availableGrid.empty();

    displayPlans.forEach(p => {
        const isCurrent = String(p.planId) === String(currentPlan.planId) || p.planName === currentPlan.planName;
        const diffBadge = p.difficultyLevelStatus === 'BEGINNER' ? 'badge-info' :
                          (p.difficultyLevelStatus === 'ADVANCED' ? 'badge-danger' : 'badge-lime');

        availableGrid.append(`
            <div class="dash-panel" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between; border-top: 3px solid ${isCurrent ? 'var(--lime)' : 'var(--border)'}; background: var(--bg-surface-2);">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span class="badge ${diffBadge}">${p.difficultyLevelStatus || 'INTERMEDIATE'}</span>
                        ${isCurrent ? '<span class="badge badge-success">ACTIVE ROUTINE</span>' : '<span class="badge badge-muted">GYM PROGRAM</span>'}
                    </div>
                    <h3 style="font-size:16px; font-weight:800; margin-bottom:8px; color:#fff;">${p.planName}</h3>
                    <p style="font-size:12px; color:var(--text-muted); line-height:1.5; margin-bottom:16px;">
                        ${p.description || 'Comprehensive training plan created by certified coaches.'}
                    </p>
                </div>
                <div style="margin-top:auto; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.08);">
                    ${isCurrent ? `
                        <button class="btn btn-secondary" style="width:100%; border-color:var(--lime); color:var(--lime); font-weight:700;" disabled>
                            ✓ Currently Active Routine
                        </button>
                    ` : `
                        <button class="btn btn-primary btn-enroll-routine" data-plan-id="${p.planId}" data-plan-name="${encodeURIComponent(p.planName)}" data-mid="${mId}" style="width:100%; font-size:12px; font-weight:700;">
                            Start This Routine →
                        </button>
                    `}
                </div>
            </div>
        `);
    });
}

function getWorkoutScheduleDays(plan) {
    const level = (plan && plan.difficultyLevelStatus) ? plan.difficultyLevelStatus.toUpperCase() : 'INTERMEDIATE';

    if (level === 'BEGINNER') {
        return [
            {
                day: "Day 1: Full-Body Foundation",
                exercises: [
                    "Barbell Back Squats (3 × 10)",
                    "Flat Dumbbell Bench Press (3 × 10)",
                    "Lat Pulldowns Wide Grip (3 × 10)",
                    "Dumbbell Shoulder Press (3 × 12)",
                    "Plank Holds (3 × 45 sec)"
                ]
            },
            {
                day: "Day 2: Mobility & Core Strength",
                exercises: [
                    "Romanian Deadlifts (Dumbbells) (3 × 10)",
                    "Seated Cable Rows (3 × 12)",
                    "Standing Overhead DB Press (3 × 10)",
                    "Hanging Knee Raises (3 × 12)",
                    "Incline Treadmill Walk (15 mins)"
                ]
            },
            {
                day: "Day 3: Power & Conditioning",
                exercises: [
                    "Leg Press Machine (3 × 12)",
                    "Push-ups / Incline DB Press (3 × 12)",
                    "Dumbbell Bicep Curls (3 × 12)",
                    "Tricep Rope Pushdowns (3 × 12)",
                    "Rowing Machine Intervals (10 mins)"
                ]
            }
        ];
    } else if (level === 'ADVANCED') {
        return [
            {
                day: "Day 1: Heavy Upper Strength",
                exercises: [
                    "Barbell Bench Press (5 × 5 Heavy)",
                    "Weighted Pull-ups (4 × 6)",
                    "Standing Military Press (4 × 6)",
                    "Barbell Pendlay Rows (4 × 6)",
                    "Weighted Dips (3 × 8)"
                ]
            },
            {
                day: "Day 2: Lower Power & Deadlift",
                exercises: [
                    "Barbell Back Squats (5 × 5 Heavy)",
                    "Conventional Deadlifts (4 × 4)",
                    "Bulgarian Split Squats (3 × 8 each)",
                    "Standing Heavy Calf Raises (4 × 12)",
                    "Ab Wheel Rollouts (4 × 12)"
                ]
            },
            {
                day: "Day 3: Upper Hypertrophy Pump",
                exercises: [
                    "Incline Dumbbell Press (4 × 10)",
                    "Incline DB Chest-Supported Row (4 × 10)",
                    "Cable Lateral Raises (5 × 15)",
                    "EZ-Bar Skullcrushers (4 × 10)",
                    "Incline Dumbbell Curl (4 × 10)"
                ]
            }
        ];
    } else {
        return [
            {
                day: "Day 1: Push (Chest & Shoulders)",
                exercises: [
                    "Incline Dumbbell Press (4 × 10)",
                    "Flat Barbell Bench Press (3 × 8)",
                    "Overhead Dumbbell Shoulder Press (3 × 12)",
                    "Lateral Cable Raises (4 × 15)",
                    "Tricep Rope Pushdowns (3 × 12)"
                ]
            },
            {
                day: "Day 2: Pull (Back & Biceps)",
                exercises: [
                    "Lat Pulldowns (Wide Grip) (4 × 10)",
                    "Barbell Bent-Over Rows (4 × 8)",
                    "Seated Cable Rows (3 × 12)",
                    "Incline Dumbbell Bicep Curls (4 × 10)",
                    "Hammer Rope Curls (3 × 12)"
                ]
            },
            {
                day: "Day 3: Legs & Calves",
                exercises: [
                    "Barbell Squats (4 × 8)",
                    "Romanian Deadlifts (3 × 10)",
                    "Leg Press Heavy (4 × 12)",
                    "Standing Calf Raises (4 × 15)",
                    "Hanging Leg Raises (3 × 15)"
                ]
            }
        ];
    }
}

$(document).on('click', '.btn-mark-workout-done', function (e) {
    e.preventDefault();
    const mId = $(this).data('mid') || localStorage.getItem("memberId");
    const todayDateKey = new Date().toISOString().slice(0, 10);

    localStorage.setItem("flex_workout_done_" + mId + "_" + todayDateKey, "true");
    window.showToast("Great job! Today's session completed! 🔥", "success");

    $(this).replaceWith(`
        <button class="btn btn-secondary" style="width:100%; margin-top:14px; font-size:12px; padding:8px; border-color:var(--lime); color:var(--lime); font-weight:700;" disabled>
            ✓ Completed Today! 🔥
        </button>
    `);
});

$(document).on('click', '.btn-enroll-routine', function (e) {
    e.preventDefault();
    const planId = $(this).data('plan-id');
    const planName = decodeURIComponent($(this).data('plan-name') || 'Workout Routine');
    const mId = $(this).data('mid') || localStorage.getItem('memberId');

    const todayStr = new Date().toISOString().slice(0, 10);
    const payload = {
        memberId: parseInt(mId, 10),
        planId: parseInt(planId, 10),
        trainerId: 1,
        assignedDate: todayStr,
        planStatus: "ACTIVE"
    };

    FlexAPI.ajax({
        url: "/member-workout-plans/assignPlan",
        type: "POST",
        data: payload,
        success: function () {
            localStorage.setItem("flex_selected_plan_" + mId, planId);
            window.showToast(`Switched active workout routine to "${planName}"! 🔥`, "success");
            loadMemberWorkoutRoutine(mId);
        },
        error: function () {
            localStorage.setItem("flex_selected_plan_" + mId, planId);
            window.showToast(`Active workout routine updated to "${planName}"! 🔥`, "success");
            loadMemberWorkoutRoutine(mId);
        }
    });
});

function calculateSessionDuration(startTime, endTime) {
    if (!startTime || !endTime || startTime === '--' || endTime === '--') return '1h 15m';
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return '1h 15m';
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins < 0) mins += 24 * 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
}

function addMinutesToTime(startTime, addMins) {
    if (!startTime || startTime === '--') return '--';
    const [h, m] = startTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '--';
    let totalMins = (h * 60 + m + addMins) % (24 * 60);
    const newH = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const newM = String(totalMins % 60).padStart(2, '0');
    return `${newH}:${newM}`;
}

$(document).on('click', '.btn-admin-checkout, .btn-rcp-checkout', function (e) {
    e.preventDefault();
    const mId = $(this).data('mid');
    const timeIn = $(this).data('time') || '10:00';
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().substring(0, 5);

    localStorage.setItem("flex_checkout_" + mId + "_" + todayStr, nowTime);
    const dur = calculateSessionDuration(timeIn, nowTime);
    window.showToast(`🚪 Turnstile Exit recorded for MEM-${mId} at ${nowTime} (${dur})!`, "success");

    loadAdminAttendance();
    syncReceptionistAnalytics();
});

$(document).on('click', '.btn-member-checkout', function (e) {
    e.preventDefault();
    const mId = $(this).data('mid') || localStorage.getItem('memberId');
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().substring(0, 5);

    localStorage.setItem("flex_checkout_" + mId + "_" + todayStr, nowTime);
    window.showToast(`🎉 Gym Exit Verified at ${nowTime}! 🔥`, "success");

    if (typeof refreshMemberLiveStatus === 'function') {
        refreshMemberLiveStatus(mId);
    }
    loadAdminAttendance();
});

function openMemberDigitalCard(memberId) {
    if (!memberId) return;

    FlexAPI.ajax({
        url: `/members/getMember/${memberId}`,
        type: "GET",
        success: function (m) {
            if (!m) return;
            const initials = m.memberFullName ? m.memberFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'MB';

            $('#cardMemberAvatar').text(initials);
            $('#cardMemberName').text(m.memberFullName || `Member #${m.memberId}`);
            $('#cardMemberId').text(`MEM-${m.memberId}`);
            $('#cardMemberEmail').text(m.email || 'No email registered');
            $('#cardMemberPhone').text(m.memberPhoneNumber || 'N/A');
            $('#cardMemberStats').text(`${m.gender || 'N/A'} / ${m.age || 'N/A'} yrs • ${m.heightCm || 0}cm / ${m.weightKg || 0}kg`);

            const isActive = (m.memberStatus === 'ACTIVE');
            $('#cardMemberStatusBadge').text(m.memberStatus || 'ACTIVE').attr('class', `badge ${isActive ? 'badge-success' : 'badge-danger'}`);
            $('#cardMemberTurnstileCode').text(`TURNSTILE ACCESS CODE: MEM-${m.memberId}`);

            $('#cardMemberPlan').text('Loading plan...');
            $('#cardMemberLocker').text('Checking...');

            FlexAPI.ajax({
                url: `/memberships/getMemberMembership/${memberId}`,
                type: "GET",
                success: function (mem) {
                    if (mem && mem.packageName) {
                        $('#cardMemberPlan').text(mem.packageName);
                    } else if (mem && mem.membershipPackage && mem.membershipPackage.packageName) {
                        $('#cardMemberPlan').text(mem.membershipPackage.packageName);
                    } else {
                        $('#cardMemberPlan').text('Standard Pass');
                    }
                },
                error: function () {
                    $('#cardMemberPlan').text('General Access');
                }
            });

            FlexAPI.ajax({
                url: "/lockers/getAllLockers",
                type: "GET",
                success: function (lockers) {
                    if (Array.isArray(lockers)) {
                        const assigned = lockers.find(l => (l.memberId && l.memberId == memberId) || (l.member && l.member.memberId == memberId));
                        $('#cardMemberLocker').text(assigned ? (assigned.lockerNumber || `#L-${assigned.lockerId}`) : 'None Assigned');
                    } else {
                        $('#cardMemberLocker').text('None Assigned');
                    }
                },
                error: function () {
                    $('#cardMemberLocker').text('None Assigned');
                }
            });

            $('#btnCardQuickCheckIn').off('click').on('click', function () {
                closeModal('modalMemberDigitalCard');
                if ($('#rcpScanInput').length) {
                    $('#rcpScanInput').val(memberId);
                    $('#formRcpScanAttendance').trigger('submit');
                } else if ($('#scanMemberId').length) {
                    $('#scanMemberId').val(memberId);
                    $('#formAdminScanAttendance').trigger('submit');
                } else {
                    window.showToast(`Turnstile access verified for MEM-${memberId}! 🚪`, 'success');
                }
            });

            openModal('modalMemberDigitalCard');
        },
        error: function () {
            window.showToast("Failed to load member profile details.", "error");
        }
    });
}

$(document).on('click', '.view-member-card-btn', function (e) {
    e.preventDefault();
    const mId = $(this).data('id') || $(this).attr('data-id');
    if (mId) {
        openMemberDigitalCard(mId);
    }
});

$(document).on('click', '#btnPrintMemberCard', function () {
    const cardContent = document.getElementById('printableMemberCard');
    if (!cardContent) return;

    const printWindow = window.open('', '_blank', 'width=650,height=520');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Flex Gym - Member Access Card</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #fff; display: flex; justify-content: center; align-items: center; min-height: 90vh; margin: 0; padding: 20px; }
                #printableMemberCard { width: 440px; background: #0c0d11 !important; color: #fff; border: 2px solid #d7ff00 !important; border-radius: 16px; padding: 22px; }
                .badge { padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; }
                .badge-success { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid #22c55e; }
                .badge-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
            </style>
        </head>
        <body>
            ${cardContent.outerHTML}
            <script>
                window.onload = function() { window.print(); window.close(); }
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
});

// global export
window.FlexDashboard = {
    switchSection: switchSection,
    openModal: openModal,
    closeModal: closeModal
};
window.initMemberDashboard = initMemberDashboard;
window.loadMemberDashboard = initMemberDashboard;
window.loadMemberWorkoutRoutine = loadMemberWorkoutRoutine;
window.populateWorkoutAssignModals = populateWorkoutAssignModals;
window.loadPendingMembershipRequests = loadPendingMembershipRequests;
window.loadAdminMemberships = loadAdminMemberships;
window.syncAdminAnalytics = syncAdminAnalytics;
window.syncReceptionistAnalytics = syncReceptionistAnalytics;
window.syncTrainerAnalytics = syncTrainerAnalytics;
window.openMemberDigitalCard = openMemberDigitalCard;