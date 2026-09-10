window.flexCharts = window.flexCharts || {};

$(document).ready(function () {
    if ($(".dash-layout").length > 0) {
        syncUserProfile();
        initDashboardRouting();
        initModals();
        initSearchAndFilters();
        initLogout();
        initAdminDashboard();
    }
});

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
        if (targetId === 'modalAddTrainer') {
            if ($('#formAddTrainer').length && $('#formAddTrainer')[0].reset) {
                $('#formAddTrainer')[0].reset();
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

function syncUserProfile() {
    const email = localStorage.getItem('email') || localStorage.getItem('flexGymEmail') || '';
    const fullName = localStorage.getItem('userFullName') || localStorage.getItem('flexGymFullName') || 'Administrator';
    const rawRole = localStorage.getItem('userRole') || localStorage.getItem('flexGymRole') || 'ADMIN';
    const role = rawRole.replace('ROLE_', '');

    $('#dashUserEmail').text(fullName || email || 'Administrator');
    $('#dashUserRole').text(role || 'Administrator');

    let initials = 'AD';
    if (fullName && fullName !== 'Administrator') {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
            initials = (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (parts.length === 1 && parts[0].length >= 2) {
            initials = parts[0].substring(0, 2).toUpperCase();
        }
    }
    $('#dashUserAvatar').text(initials);
}

function initLogout() {
    $(document).on('click', '#logoutBtn, .action-logout', function (e) {
        e.preventDefault();
        FlexAlert.confirm("Sign Out", "Are you sure you want to log out of Flex Gym?", "Yes, Sign Out", "Stay Signed In").then((confirmed) => {
            if (confirmed) {
                FlexAPI.logout();
            }
        });
    });
}

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
        success: function (res) {
            let members = (res && res.body !== undefined) ? res.body : res;
            if (!Array.isArray(members)) members = [];
            members.forEach(m => {
                const storedStatus = localStorage.getItem("flex_member_status_" + m.memberId);
                if (storedStatus) m.memberStatus = storedStatus;
            });
            const activeMembers = members.filter(m => (m.memberStatus !== 'INACTIVE' && m.memberStatus !== 'SUSPENDED' && m.memberStatus !== 'DELETED')).length;
            $('#adminStatActiveMembers').text(activeMembers.toLocaleString());
            $('#adminStatActiveMembersTrend').text(`Total Registered: ${members.length} Members`);
            $('.dash-nav-item[data-section="members"] .nav-badge, #adminNavMembersBadge').text(members.length).toggle(members.length > 0);
        },
        error: function () {
            $('#adminStatActiveMembers').text('0');
            $('#adminStatActiveMembersTrend').text('0 Registered Members');
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

            FlexAPI.ajax({
                url: "/orders/getAllOrders",
                type: "GET",
                success: function (orders) {
                    if (Array.isArray(orders)) {
                        orders.forEach(o => {
                            if (o.orderStatus === 'COMPLETED' || o.orderStatus === 'PAID') {
                                totalRevenue += Number(o.totalAmount || o.amount || 0);
                            }
                        });
                        $('.dash-nav-item[data-section="orders"] .nav-badge, #adminNavOrdersBadge').text(orders.length).toggle(orders.length > 0);
                    }
                    $('#adminStatMonthlyRevenue').text(`Rs. ${totalRevenue.toLocaleString()}`);
                    $('#adminStatMonthlyRevenueTrend').text(`${payments.length} Recorded Transactions`);
                },
                error: function () {
                    $('#adminStatMonthlyRevenue').text(`Rs. ${totalRevenue.toLocaleString()}`);
                    $('#adminStatMonthlyRevenueTrend').text(`${payments.length} Recorded Transactions`);
                }
            });

            $('.dash-nav-item[data-section="payments"] .nav-badge, #adminNavPaymentsBadge').text(payments.length).toggle(payments.length > 0);

            if (window.flexCharts && window.flexCharts.revenue) {
                window.flexCharts.revenue.data.datasets[0].data = monthlyTotals;
                window.flexCharts.revenue.update();
            }
        },
        error: function () {
            $('#adminStatMonthlyRevenue').text('Rs. 0');
            $('#adminStatMonthlyRevenueTrend').text('0 Transactions');
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
            $('#adminStatTodayAttendanceTrend').text(`${attendance.length} Total Turnstile Scans`);
            $('.dash-nav-item[data-section="attendance"] .nav-badge, #adminNavAttendanceBadge').text(attendance.length).toggle(attendance.length > 0);

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
        },
        error: function () {
            $('#adminStatTodayAttendance').text('0');
            $('#adminStatTodayAttendanceTrend').text('0 Turnstile Scans');
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
            $('.dash-nav-item[data-section="lockers"] .nav-badge, #adminNavLockersBadge').text(total).toggle(total > 0);
        }
    });

    FlexAPI.ajax({
        url: "/trainers/getAllTrainers",
        type: "GET",
        success: function (trainers) {
            if (!Array.isArray(trainers)) trainers = [];
            $('.dash-nav-item[data-section="trainers"] .nav-badge, #adminNavTrainersBadge').text(trainers.length).toggle(trainers.length > 0);
        }
    });

    FlexAPI.ajax({
        url: "/workout-plans/getAllWorkoutPlans",
        type: "GET",
        success: function (plans) {
            if (!Array.isArray(plans)) plans = [];
            $('.dash-nav-item[data-section="workouts"] .nav-badge, #adminNavWorkoutsBadge').text(plans.length).toggle(plans.length > 0);
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
                    $('.dash-nav-item[data-section="memberships"] .nav-badge, #adminNavMembershipsBadge').text(memberships.length).toggle(memberships.length > 0);

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
        success: function (res) {
            const members = (res && res.body !== undefined) ? res.body : res;
            if (!Array.isArray(members)) return;
            const tbody = $('#view-members table tbody, #tableAdminMembers tbody');
            if (!tbody.length) return;

            tbody.empty();
            members.forEach(m => {
                const isInactive = (m.memberStatus === 'INACTIVE' || m.memberStatus === 'SUSPENDED');
                const displayStatus = isInactive ? 'INACTIVE' : (m.memberStatus || 'ACTIVE');
                const statusBadge = isInactive ? 'badge-danger' : 'badge-success';
                const initials = m.memberFullName ? m.memberFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'M';

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
                        <td><span class="badge ${statusBadge}">${displayStatus}</span></td>
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

            const activeMembers = members.filter(m => (m.memberStatus !== 'INACTIVE' && m.memberStatus !== 'SUSPENDED' && m.memberStatus !== 'DELETED')).length;
            $('#adminStatActiveMembers').text(activeMembers.toLocaleString());
            $('#adminStatActiveMembersTrend').text(`Total Registered: ${members.length} Members`);
            $('.dash-nav-item[data-section="members"] .nav-badge, #adminNavMembersBadge').text(members.length).toggle(members.length > 0);
        }
    });
}

$(document).on('click', '.edit-member-btn', function () {
    const id = $(this).data('id');
    FlexAPI.ajax({
        url: `/members/getMember/${id}`,
        type: "GET",
        success: function (res) {
            const m = (res && res.body !== undefined) ? res.body : res;
            if (!m) return;
            window.currentEditingMember = m;
            const isInactive = (m.memberStatus === 'INACTIVE' || m.memberStatus === 'SUSPENDED');
            const statusVal = isInactive ? 'INACTIVE' : 'ACTIVE';

            $('#editMemberId').val(m.memberId);
            $('#editMemberFullName').val(m.memberFullName || '');
            $('#editMemberEmail').val(m.email || m.memberEmail || '');
            $('#editMemberPhone').val(m.memberPhoneNumber || '');
            $('#editMemberGender').val(m.gender || 'MALE');
            $('#editMemberAge').val(m.age || '');
            $('#editMemberHeight').val(m.heightCm || '');
            $('#editMemberWeight').val(m.weightKg || '');
            $('#editMemberStatus').val(statusVal);
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
    const memberIdNum = parseInt(id, 10);
    const selectedUiStatus = $('#editMemberStatus').val() || 'ACTIVE';
    const dbStatus = (selectedUiStatus === 'INACTIVE') ? 'SUSPENDED' : 'ACTIVE';
    const currentM = window.currentEditingMember || {};

    const fullName = $('#editMemberFullName').val().trim();
    const email = $('#editMemberEmail').val().trim();
    const phone = $('#editMemberPhone').val().trim();
    const gender = $('#editMemberGender').val();
    const age = $('#editMemberAge').val() ? String($('#editMemberAge').val()) : (currentM.age || '25');
    const heightCm = $('#editMemberHeight').val() ? parseFloat($('#editMemberHeight').val()) : (currentM.heightCm || 175);
    const weightKg = $('#editMemberWeight').val() ? parseFloat($('#editMemberWeight').val()) : (currentM.weightKg || 70);

    const btn = $(this).find('button[type="submit"]');
    const origText = btn.html();
    btn.prop('disabled', true).html('<span class="btn-spinner"></span> Updating Member...');

    const payload = {
        memberId: memberIdNum,
        memberFullName: fullName,
        email: email,
        memberPhoneNumber: phone,
        gender: gender,
        age: age,
        heightCm: heightCm,
        weightKg: weightKg,
        memberStatus: dbStatus
    };

    FlexAPI.ajax({
        url: `/members/updateMember/${id}`,
        type: "PUT",
        data: payload,
        success: function () {
            btn.prop('disabled', false).html(origText);
            window.showToast("Member updated successfully!", "success");
            closeModal('modalEditMember');
            loadAdminMembers();
            syncAdminAnalytics();
        },
        error: function (xhr) {
            btn.prop('disabled', false).html(origText);
            const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to update member.";
            window.showToast(msg, "error");
        }
    });
});

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
                                <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px dashed rgba(255,255,200,0.08); margin-top:auto;">
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

function loadPendingMembershipRequests() {
    FlexAPI.ajax({
        url: "/memberships/getAllPendingMemberships",
        type: "GET",
        success: function (res) {
            const pendingList = (res && res.body !== undefined) ? res.body : res;
            if (Array.isArray(pendingList) && pendingList.length > 0) {
                renderAdminPendingMemberships(pendingList);
            } else {
                checkAdminAllMembershipsForPending();
            }
        },
        error: function () {
            checkAdminAllMembershipsForPending();
        }
    });
}

function checkAdminAllMembershipsForPending() {
    FlexAPI.ajax({
        url: "/memberships/getAllMemberships",
        type: "GET",
        success: function (res) {
            const all = (res && res.body !== undefined) ? res.body : res;
            if (Array.isArray(all)) {
                const filtered = all.filter(m => {
                    const s = String(m.membershipStatus || m.status || '').toUpperCase();
                    return s === 'PENDING' || s === 'REQUESTED' || s === 'PENDING_APPROVAL';
                });
                renderAdminPendingMemberships(filtered);
            } else {
                renderAdminPendingMemberships([]);
            }
        },
        error: function () {
            renderAdminPendingMemberships([]);
        }
    });
}

function renderAdminPendingMemberships(pendingList) {
    const tbody = $('#tablePendingMemberships tbody');
    const countBadge = $('#pendingMembershipCount');
    const count = Array.isArray(pendingList) ? pendingList.length : 0;

    if (countBadge.length) {
        countBadge.text(`${count} Requests`).toggle(count > 0);
    }

    $('.dash-nav-item[data-section="memberships"] .nav-badge, .dash-nav-item[href="#memberships"] .nav-badge')
        .text(count)
        .toggle(count > 0);

    if (!tbody.length) return;
    tbody.empty();

    if (count === 0) {
        tbody.html(`
            <tr>
                <td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">
                    ✓ No pending membership requests. All memberships are up to date!
                </td>
            </tr>
        `);
        return;
    }

    pendingList.forEach(req => {
        const memId = req.memberId || (req.member && req.member.memberId) || 'N/A';
        const memberName = req.memberName || (req.member && req.member.memberFullName) || `Member #${memId}`;
        const pkgName = req.packageName || (req.membershipPackage && req.membershipPackage.packageName) || 'Standard Package';
        const price = req.amount || req.packagePrice || (req.membershipPackage && req.membershipPackage.packagePrice) || 0;
        const date = req.startDate || req.requestedDate || req.createdAt || 'Recent';

        tbody.append(`
            <tr style="background: rgba(245, 158, 11, 0.04);">
                <td>
                    <strong>MEM-${memId}</strong><br>
                    <span style="font-size:11px; color:var(--text-muted);">Req ID: #${req.membershipId}</span>
                </td>
                <td>
                    <strong>${memberName}</strong>
                </td>
                <td>
                    <span class="badge badge-lime">${pkgName}</span>
                </td>
                <td>
                    <strong style="color:var(--lime);">Rs. ${Number(price).toLocaleString()}</strong>
                </td>
                <td>${date}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-primary btn-sm approve-membership-btn" 
                            data-id="${req.membershipId}" 
                            data-name="${memberName}" 
                            style="padding:4px 10px; font-size:11px;">
                            ✓ Approve & Activate
                        </button>
                        <button class="btn btn-secondary btn-sm reject-membership-btn" 
                            data-id="${req.membershipId}" 
                            style="padding:4px 10px; font-size:11px; border-color:var(--danger); color:var(--danger);">
                            ✕ Reject
                        </button>
                    </div>
                </td>
            </tr>
        `);
    });
}

function loadAdminMemberships() {
    loadPendingMembershipRequests();

    FlexAPI.ajax({
        url: "/memberships/getAllMemberships",
        type: "GET",
        success: function (memberships) {
            if (!Array.isArray(memberships)) return;
            const tbody = $('#tableAdminMemberships tbody, #view-memberships table:not(#tablePendingMemberships) tbody');
            if (!tbody.length) return;

            tbody.empty();
            if (memberships.length === 0) {
                tbody.html(`
                    <tr>
                        <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
                            No active memberships found in the system.
                        </td>
                    </tr>
                `);
                return;
            }

            memberships.forEach(m => {
                const statusBadge = m.membershipStatus === 'ACTIVE' ? 'badge-success' : (m.membershipStatus === 'PENDING' ? 'badge-warning' : 'badge-danger');
                const pkgName = m.packageName || (m.membershipPackage && m.membershipPackage.packageName) || 'Standard';
                const memberName = m.memberName || (m.member && m.member.memberFullName) || ('Member #' + m.memberId);
                const isPaid = m.paymentStatus === 'PAID' || m.membershipStatus === 'ACTIVE';

                tbody.append(`
                    <tr>
                        <td><strong>#SUB-${m.membershipId}</strong></td>
                        <td>
                            <strong>${memberName}</strong><br>
                            <small style="color:var(--text-muted)">MEM-${m.memberId}</small>
                        </td>
                        <td><span class="badge badge-lime">${pkgName}</span></td>
                        <td>${m.startDate || 'N/A'}</td>
                        <td>${m.endDate || 'N/A'}</td>
                        <td><span class="badge ${statusBadge}">${m.membershipStatus || 'ACTIVE'}</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="btn btn-secondary btn-sm print-payment-slip-btn" 
                                    data-id="${m.membershipId}" 
                                    data-member="${memberName}" 
                                    data-memid="${m.memberId}" 
                                    data-type="MEMBERSHIP_FEE" 
                                    data-amount="${m.amount || 5000}" 
                                    data-status="${isPaid ? 'PAID' : 'PENDING'}"
                                    style="padding:3px 7px;font-size:11px;" title="View Slip">
                                    Slip 📄
                                </button>
                                <button class="btn-icon danger delete-membership-btn" data-id="${m.membershipId}" title="Cancel Membership">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `);
            });

            $('.dash-nav-item[data-section="memberships"] .nav-badge').text(memberships.length);
        }
    });
}

function loadAdminAttendance() {
    FlexAPI.ajax({
        url: "/attendance/getAllLogs",
        type: "GET",
        success: function (logs) {
            const adminTbody = $('#tableAdminAttendance tbody, #view-attendance table:not(#tableMemberAttendance) tbody');
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

            const recentCheckinsBody = $('#adminRecentCheckinsBody');
            if (recentCheckinsBody.length) {
                recentCheckinsBody.empty();
                if (logs.length === 0) {
                    recentCheckinsBody.html(`
                        <tr>
                            <td colspan="4" style="text-align:center; padding:24px; color:var(--text-muted);">
                                No attendance check-ins recorded today.
                            </td>
                        </tr>
                    `);
                } else {
                    const recentLogs = logs.slice(0, 5);
                    recentLogs.forEach(l => {
                        let time = 'Just Now';
                        if (l.checkInTime) {
                            const str = String(l.checkInTime).replace('T', ' ');
                            const parts = str.split(' ');
                            if (parts.length >= 2) time = parts[1].substring(0, 5);
                            else if (str.length >= 16) time = str.substring(11, 16);
                        }
                        const initials = l.memberFullName ? l.memberFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'MB';
                        recentCheckinsBody.append(`
                            <tr>
                                <td>
                                    <div class="cell-member">
                                        <div class="member-avatar">${initials}</div>
                                        <div class="member-meta">
                                            <strong>${l.memberFullName || ('Member #' + l.memberId)}</strong>
                                            <span>MEM-${l.memberId}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span class="badge badge-lime">${l.packageName || 'Standard'}</span></td>
                                <td><strong style="color:var(--lime);">${time}</strong></td>
                                <td><span class="badge badge-success">${l.attendanceStatus || 'Checked In'}</span></td>
                            </tr>
                        `);
                    });
                }
            }

            const todayLogs = logs.filter(l => l.checkInTime && l.checkInTime.startsWith(todayStr));
            const todayCount = todayLogs.length > 0 ? todayLogs.length : logs.length;
            $('#adminStatTodayAttendance').text(todayCount);
            $('#adminStatTodayAttendanceTrend').text(`${logs.length} Total Turnstile Scans`);
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

function loadAdminProducts() {
    FlexAPI.ajax({
        url: "/products/getAllProducts",
        type: "GET",
        success: function (products) {
            if (!Array.isArray(products)) return;
            const tbody = $('#view-products table tbody, #productsTable tbody');
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
        }
    });
}

function markOrderCompleted(orderId) {
    FlexAlert.confirm("Complete Order", `Mark Order #ORD-${orderId} as Delivered & Paid?`, "Yes, Complete", "Cancel").then((confirmed) => {
        if (!confirmed) return;

        FlexAPI.ajax({
            url: `/orders/updateOrderStatus/${orderId}?orderStatus=COMPLETED&paymentStatus=PAID`,
            type: "PUT",
            success: function () {
                window.showToast(`Order #ORD-${orderId} marked as Delivered & Paid!`, 'success');
                loadAdminOrders();
                loadAdminPayments();
            },
            error: function () {
                window.showToast("Failed to update order status. Please try again.", "error");
            }
        });
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
            window.showToast(`Could not load details for Order #ORD-${orderId}`, "error");
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
    FlexAlert.confirm("Delete Equipment", `Are you sure you want to delete equipment #EQ-${id}?`, "Yes, Delete", "Cancel", { isDestructive: true }).then((confirmed) => {
        if (!confirmed) return;
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
});

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

                $('#adminLockersTotal').text(activeLockers.length);
                $('#adminLockersAvailable').text(availableLockers.length);
                $('#adminLockersOccupied').text(occupiedLockers.length);

                const memberMap = {};
                if (Array.isArray(membersList)) {
                    membersList.forEach(m => {
                        memberMap[m.memberId] = m;
                    });
                }

                const gridContainers = $('#adminLockersGrid');
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

                const tbody = $('#tableAdminLockers tbody, #view-lockers table tbody');
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

    FlexAlert.confirm("Vacate Locker", `Release key and vacate Locker #${lockerNum}?`, "Yes, Vacate", "Cancel").then((confirmed) => {
        if (!confirmed) return;

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
});

function loadAdminTrainers() {
    FlexAPI.ajax({
        url: "/trainers/getAllTrainers",
        type: "GET",
        success: function (trainers) {
            if (!Array.isArray(trainers)) return;
            const tbody = $('#view-trainers table tbody, #adminTrainersTableBody');
            if (!tbody.length) return;

            tbody.empty();
            if (trainers.length === 0) {
                tbody.html(`
                    <tr>
                        <td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">
                            No coaches or personal trainers registered yet. Click "+ Add Trainer" to register one!
                        </td>
                    </tr>
                `);
                return;
            }

            trainers.forEach(t => {
                tbody.append(`
                    <tr>
                        <td><strong>${t.trainerName}</strong></td>
                        <td><span class="badge badge-lime">${t.specialization || 'Fitness Coach'}</span></td>
                        <td>${t.email || 'N/A'}<br><small style="color:var(--text-muted)">${t.phoneNumber || ''}</small></td>
                        <td>Active Coach</td>
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

    const btn = $(this).find('button[type="submit"]');
    const origText = btn.html() || 'Save Changes';
    btn.prop('disabled', true).html('<span class="btn-spinner"></span>Updating Trainer...');

    FlexAPI.ajax({
        url: `/trainers/updateTrainer`,
        type: "PUT",
        data: payload,
        success: function () {
            btn.prop('disabled', false).html(origText);
            window.showToast("Trainer updated successfully!", "success");
            closeModal('modalEditTrainer');
            loadAdminTrainers();
        },
        error: function (xhr) {
            btn.prop('disabled', false).html(origText);
            const msg = (xhr && xhr.responseJSON && xhr.responseJSON.message) || "Failed to update trainer.";
            window.showToast(msg, "error");
        }
    });
});

$(document).on('click', '.delete-trainer-btn', function () {
    const id = $(this).data('id');
    FlexAlert.confirm("Delete Trainer", `Are you sure you want to delete trainer #${id}?`, "Yes, Delete", "Cancel", { isDestructive: true }).then((confirmed) => {
        if (!confirmed) return;
        FlexAPI.ajax({
            url: `/trainers/deleteTrainer/${id}`,
            type: "DELETE",
            success: function () {
                window.showToast("Trainer deleted successfully!", "success");
                loadAdminTrainers();
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to delete trainer.";
                window.showToast(msg, "error");
            }
        });
    });
});

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

    FlexAlert.confirm("Confirm Payment", `Mark Payment #PAY-${id} as PAID for ${member} (Rs. ${amount.toLocaleString()})?`, "Yes, Mark Paid", "Cancel").then((confirmed) => {
        if (!confirmed) return;

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
                        window.showToast("Failed to mark payment as PAID. Please verify server connection.", "error");
                        $btn.prop('disabled', false).text('Mark Paid 💰');
                    }
                });
            }
        });
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
            trainerName: $('#addTrainerName').val().trim(),
            email: $('#addTrainerEmail').val().trim(),
            phoneNumber: $('#addTrainerPhone').val().trim(),
            specialization: $('#addTrainerSpec').val().trim(),
            status: "ACTIVE"
        };

        const btn = $(this).find('button[type="submit"]');
        const origText = btn.html() || 'Save Trainer';
        btn.prop('disabled', true).html('<span class="btn-spinner"></span>Saving Trainer...');

        FlexAPI.ajax({
            url: "/trainers/saveTrainer",
            type: "POST",
            data: payload,
            success: function () {
                btn.prop('disabled', false).html(origText);
                window.showToast("Trainer added successfully!", "success");
                closeModal('modalAddTrainer');
                if ($('#formAddTrainer').length && $('#formAddTrainer')[0].reset) {
                    $('#formAddTrainer')[0].reset();
                }
                loadAdminTrainers();
            },
            error: function (xhr) {
                btn.prop('disabled', false).html(origText);
                const msg = (xhr && xhr.responseJSON && xhr.responseJSON.message) || "Failed to add trainer.";
                window.showToast(msg, "error");
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
        FlexAlert.confirm("Delete Package", `Are you sure you want to delete Package #${id}?`, "Yes, Delete", "Cancel", { isDestructive: true }).then((confirmed) => {
            if (!confirmed) return;
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
        });
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

    $(document).on('click', '.approve-membership-btn', function () {
        const id = $(this).data('id');
        const name = $(this).data('name') || 'Member';
        FlexAlert.confirm("Approve Membership", `Approve membership request #${id} for ${name}?`, "Yes, Approve", "Cancel").then((confirmed) => {
            if (!confirmed) return;
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
        });
    });

    $(document).on('click', '.reject-membership-btn', function () {
        const id = $(this).data('id');
        FlexAlert.confirm("Reject Membership", `Are you sure you want to reject membership request #${id}?`, "Yes, Reject", "Cancel", { isDestructive: true }).then((confirmed) => {
            if (!confirmed) return;
            FlexAPI.ajax({
                url: `/memberships/rejectMembership/${id}`,
                type: "PUT",
                success: function () {
                    window.showToast("Membership request rejected.", "info");
                    loadPendingMembershipRequests();
                    loadAdminMemberships();
                },
                error: function () {
                    window.showToast("Failed to reject membership.", "error");
                }
            });
        });
    });

    $(document).on('click', '.delete-member-btn', function () {
        const id = $(this).data('id');
        FlexAlert.confirm("Delete Member", `Are you sure you want to delete Member #${id}?`, "Yes, Delete", "Cancel", { isDestructive: true }).then((confirmed) => {
            if (!confirmed) return;
            FlexAPI.ajax({
                url: `/members/deleteMember/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Member deleted.", "info");
                    loadAdminMembers();
                },
                error: function () {
                    window.showToast("Failed to delete member.", "error");
                }
            });
        });
    });

    $(document).on('click', '.delete-product-btn', function () {
        const id = $(this).data('id');
        FlexAlert.confirm("Delete Product", `Are you sure you want to delete Product #${id}?`, "Yes, Delete", "Cancel", { isDestructive: true }).then((confirmed) => {
            if (!confirmed) return;
            FlexAPI.ajax({
                url: `/products/deleteProduct/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Product deleted.", "info");
                    loadAdminProducts();
                },
                error: function () {
                    window.showToast("Failed to delete product.", "error");
                }
            });
        });
    });

    $(document).on('click', '.delete-workout-btn', function () {
        const id = $(this).data('id');
        FlexAlert.confirm("Delete Workout Plan", `Are you sure you want to delete Workout Plan #${id}?`, "Yes, Delete", "Cancel", { isDestructive: true }).then((confirmed) => {
            if (!confirmed) return;
            FlexAPI.ajax({
                url: `/workout-plans/deleteWorkoutPlan/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Workout plan deleted.", "info");
                    loadAdminWorkoutPlans();
                },
                error: function () {
                    window.showToast("Failed to delete workout plan.", "error");
                }
            });
        });
    });

    $(document).on('click', '.delete-locker-btn', function () {
        const id = $(this).data('id');
        FlexAlert.confirm("Delete Locker", `Are you sure you want to delete Locker #${id}?`, "Yes, Delete", "Cancel", { isDestructive: true }).then((confirmed) => {
            if (!confirmed) return;
            FlexAPI.ajax({
                url: `/lockers/deleteLocker/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Locker deleted.", "info");
                    loadAdminLockers();
                },
                error: function () {
                    window.showToast("Failed to delete locker.", "error");
                }
            });
        });
    });

    $(document).on('click', '.delete-trainer-btn', function () {
        const id = $(this).data('id');
        FlexAlert.confirm("Delete Trainer", `Are you sure you want to delete Trainer #${id}?`, "Yes, Delete", "Cancel", { isDestructive: true }).then((confirmed) => {
            if (!confirmed) return;
            FlexAPI.ajax({
                url: `/trainers/deleteTrainer/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Trainer deleted.", "info");
                    loadAdminTrainers();
                },
                error: function () {
                    window.showToast("Failed to delete trainer.", "error");
                }
            });
        });
    });

    $(document).on('click', '.delete-membership-btn', function () {
        const id = $(this).data('id');
        FlexAlert.confirm("Cancel Membership", `Are you sure you want to cancel Membership #${id}?`, "Yes, Cancel Plan", "Keep Active", { isDestructive: true }).then((confirmed) => {
            if (!confirmed) return;
            FlexAPI.ajax({
                url: `/memberships/deleteMembership/${id}`,
                type: "DELETE",
                success: function () {
                    window.showToast("Membership cancelled.", "info");
                    loadAdminMemberships();
                },
                error: function () {
                    window.showToast("Failed to cancel membership.", "error");
                }
            });
        });
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
                window.showToast("Membership expiration check completed successfully!", "success");
                loadAdminMemberships();
            },
            error: function () {
                btn.prop('disabled', false).html('⏰ Run Auto-Expiry Checker');
                loadAdminMemberships();
            }
        });
    });
}

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
                if ($('#scanMemberId').length) {
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

$(document).on('click', '.btn-admin-checkout', function (e) {
    e.preventDefault();
    const mId = $(this).data('mid');
    const timeIn = $(this).data('time') || '10:00';
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().substring(0, 5);

    localStorage.setItem("flex_checkout_" + mId + "_" + todayStr, nowTime);
    const dur = calculateSessionDuration(timeIn, nowTime);
    window.showToast(`🚪 Turnstile Exit recorded for MEM-${mId} at ${nowTime} (${dur})!`, "success");

    loadAdminAttendance();
});

function initRealtimeDashboardSync(role) {
    setInterval(() => {
        if (role === 'ADMIN') {
            syncAdminAnalytics();
        }
    }, 15000);
}

window.FlexDashboard = {
    switchSection: switchSection,
    openModal: openModal,
    closeModal: closeModal
};
window.initAdminDashboard = initAdminDashboard;
window.loadAdminMembers = loadAdminMembers;
window.loadAdminPackages = loadAdminPackages;
window.loadPendingMembershipRequests = loadPendingMembershipRequests;
window.loadAdminMemberships = loadAdminMemberships;
window.syncAdminAnalytics = syncAdminAnalytics;
window.openMemberDigitalCard = openMemberDigitalCard;
window.markOrderCompleted = markOrderCompleted;
window.viewOrderReceipt = viewOrderReceipt;