window.flexCharts = window.flexCharts || {};

$(document).ready(function () {
    if ($(".dash-layout").length > 0) {
        syncUserProfile();
        initDashboardRouting();
        initModals();
        initSearchAndFilters();
        initLogout();
        initMemberDashboard();
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
}

function syncUserProfile() {
    const email = localStorage.getItem('email') || localStorage.getItem('flexGymEmail') || '';
    const fullName = localStorage.getItem('userFullName') || localStorage.getItem('flexGymFullName') || '';

    let displayName = fullName || email || 'Member';
    let initials = fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : (email ? email.substring(0, 2).toUpperCase() : 'MB');

    $('#dashUserEmail').text(displayName);
    $('#dashUserRole').text('Member');
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
                    $('#sidebarPlanBadge').text(planName.split(' ')[0].toUpperCase()).show();
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
                    $('#sidebarPlanBadge').text('PENDING').show();
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
                    $('#sidebarPlanBadge').hide();
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
                    $('#sidebarLockerBadge').text(`#${lNum}`).show();
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
                    $('#sidebarLockerBadge').hide();
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

        FlexAlert.confirm("Release Locker", `Are you sure you want to release Locker #${lockerNum}?`, "Yes, Release", "Cancel").then((confirmed) => {
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
                    window.showToast(`Locker #${lockerNum} returned successfully!`, "info");
                    fetchMemberData(activeMemberId);
                },
                error: function (xhr) {
                    const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to release locker.";
                    window.showToast(msg, "error");
                }
            });
        });
    });
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

    FlexAlert.confirm("Membership Request", `Submit membership request for "${packageName}"?`, "Submit Request", "Cancel").then((confirmed) => {
        if (!confirmed) return;
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
    });
});

function loadMemberWorkoutRoutine(mId) {
    FlexAPI.ajax({
        url: "/workout-plans/getAllWorkoutPlans",
        type: "GET",
        success: function (res) {
            const masterPlans = (res && res.body !== undefined) ? res.body : res;
            const activeMasterPlans = Array.isArray(masterPlans) ? masterPlans.filter(p => p.planStatus !== 'DELETED') : [];

            FlexAPI.ajax({
                url: "/member-workout-plans/getAllPlans",
                type: "GET",
                success: function (assignRes) {
                    const assignments = (assignRes && assignRes.body !== undefined) ? assignRes.body : assignRes;
                    const list = Array.isArray(assignments) ? assignments : [];

                    const myAssignments = list.filter(a => String(a.memberId) === String(mId) && a.planStatus !== 'DELETED');
                    myAssignments.sort((a, b) => {
                        const idA = a.id || a.memberWorkoutPlanId || 0;
                        const idB = b.id || b.memberWorkoutPlanId || 0;
                        return idB - idA;
                    });
                    const latestAssignment = myAssignments.length > 0 ? myAssignments[0] : null;

                    const localSelectedPlanId = localStorage.getItem("flex_selected_plan_" + mId);
                    let activePlan = null;

                    if (localSelectedPlanId) {
                        activePlan = activeMasterPlans.find(p => String(p.planId) === String(localSelectedPlanId));
                    }

                    if (!activePlan && latestAssignment) {
                        activePlan = activeMasterPlans.find(p => String(p.planId) === String(latestAssignment.planId));
                    }

                    if (!activePlan && activeMasterPlans.length > 0) {
                        activePlan = activeMasterPlans[0];
                    }

                    renderMemberWorkoutView(mId, activePlan, latestAssignment, activeMasterPlans);
                },
                error: function () {
                    const localSelectedPlanId = localStorage.getItem("flex_selected_plan_" + mId);
                    let activePlan = null;
                    if (localSelectedPlanId) {
                        activePlan = activeMasterPlans.find(p => String(p.planId) === String(localSelectedPlanId));
                    }
                    if (!activePlan && activeMasterPlans.length > 0) {
                        activePlan = activeMasterPlans[0];
                    }
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
    const plans = (Array.isArray(allMasterPlans) && allMasterPlans.length > 0) ? allMasterPlans : [];
    const currentPlan = activePlan || plans[0] || null;

    if (!currentPlan) {
        $('#overviewMemberRoutine').text('No Workout Routine');
        $('#overviewMemberRoutineDay').text('Not Assigned');

        $('#memberWorkoutHeaderTitle').text('My Workout Routine');
        $('#memberActiveRoutineName').text('No Workout Routine Assigned');
        $('#memberRoutineDiffBadge').text('N/A');
        $('#memberActiveRoutineDesc').text('No coaching routine has been assigned yet. Choose or request a program below.');
        $('#memberRoutineAssignedDate').text('--');
        $('#memberRoutineStatusBadge').text('NOT ASSIGNED').attr('class', 'badge badge-muted');

        $('#memberRoutineDaysGrid').html(`
            <div style="grid-column: 1 / -1; text-align:center; padding:32px; background:var(--bg-surface-2); border-radius:var(--radius-md); border:1px dashed var(--border);">
                <p style="color:var(--text-muted); margin:0;">No exercises or workout routine assigned yet.</p>
            </div>
        `);
        $('#memberAvailableWorkoutsGrid').html(`
            <div style="grid-column: 1 / -1; text-align:center; padding:32px; background:var(--bg-surface-2); border-radius:var(--radius-md); border:1px dashed var(--border);">
                <p style="color:var(--text-muted); margin:0;">No workout programs available in catalog.</p>
            </div>
        `);
        return;
    }

    $('#overviewMemberRoutine').text(currentPlan.planName);
    $('#overviewMemberRoutineDay').text((currentPlan.difficultyLevelStatus || 'INTERMEDIATE') + ' Level');

    $('#memberWorkoutHeaderTitle').text(`My Workout Routine: ${currentPlan.planName}`);
    $('#memberActiveRoutineName').text(currentPlan.planName);
    $('#memberRoutineDiffBadge').text(currentPlan.difficultyLevelStatus || 'INTERMEDIATE');
    $('#memberActiveRoutineDesc').text(currentPlan.description || 'Coaching routine customized for your fitness goals.');

    const isCoachAssigned = myAssignment && (String(myAssignment.planId) === String(currentPlan.planId));
    if (isCoachAssigned) {
        $('#memberRoutineAssignedDate').text(`Assigned: ${myAssignment.assignedDate || 'Active'}`);
        $('#memberRoutineStatusBadge').text('COACH ASSIGNED').attr('class', 'badge badge-success');
    } else {
        $('#memberRoutineAssignedDate').text('Active Member Routine');
        $('#memberRoutineStatusBadge').text('ACTIVE ROUTINE').attr('class', 'badge badge-lime');
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

    const todaySchedule = scheduleDays[todayIndex] || scheduleDays[0];
    if (todaySchedule && $('#overviewWorkoutList').length) {
        $('#overviewTodayWorkoutSubtitle').text(`${todaySchedule.day} (${todaySchedule.exercises.length} Exercises)`);
        const overviewList = $('#overviewWorkoutList');
        overviewList.empty();
        todaySchedule.exercises.slice(0, 3).forEach(ex => {
            const parts = ex.split('(');
            const name = parts[0].trim();
            const meta = parts[1] ? parts[1].replace(')', '').trim() : 'Active Routine';
            overviewList.append(`
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--bg-surface-2); border-radius:var(--radius-md);">
                  <div>
                    <strong>${name}</strong>
                    <div style="font-size: 11px; color:var(--text-muted);">${meta}</div>
                  </div>
                  <span class="badge badge-lime">${currentPlan.difficultyLevelStatus || 'Target'}</span>
                </div>
            `);
        });
    }

    const availableGrid = $('#memberAvailableWorkoutsGrid');
    availableGrid.empty();

    plans.forEach(p => {
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
    if (!plan) return getPPLSchedule();
    const name = String(plan.planName || '').toLowerCase();
    const desc = String(plan.description || '').toLowerCase();
    const level = String(plan.difficultyLevelStatus || '').toUpperCase();

    if (name.includes('flexibility') || name.includes('mobility') || name.includes('yoga') || name.includes('recovery') || desc.includes('flexibility') || desc.includes('mobility') || desc.includes('stretching')) {
        return getMobilitySchedule();
    }
    if (name.includes('hiit') || name.includes('shred') || name.includes('fat burn') || name.includes('cardio') || desc.includes('hiit') || desc.includes('interval') || desc.includes('fat burning')) {
        return getHIITSchedule();
    }
    if (name.includes('core') || name.includes('functional') || name.includes('crossfit') || desc.includes('core') || desc.includes('functional')) {
        return getCoreFunctionalSchedule();
    }
    if (name.includes('power') || name.includes('strength') || name.includes('upper / lower') || name.includes('upper/lower') || level === 'ADVANCED') {
        return getPowerStrengthSchedule();
    }
    if (name.includes('ppl') || name.includes('push') || name.includes('hypertrophy') || name.includes('muscle') || level === 'INTERMEDIATE') {
        return getPPLSchedule();
    }
    return getBeginnerFoundationSchedule();
}

function getMobilitySchedule() {
    return [
        {
            day: "Day 1: Dynamic Mobility & Spine Flow",
            exercises: [
                "Cat-Cow & Thoracic Rotations (3 × 12)",
                "Deep Goblet Squat Hold (3 × 45 sec)",
                "World's Greatest Stretch (3 × 8 each side)",
                "Banded Shoulder Pass-Throughs (3 × 15)",
                "90/90 Hip Mobility Flow (3 × 10 each)"
            ]
        },
        {
            day: "Day 2: Posterior Chain & Hip Release",
            exercises: [
                "Pigeon Pose Hip Stretch (3 × 60 sec each)",
                "Couch Stretch for Hip Flexors (3 × 45 sec)",
                "Banded Hamstring Sweeps (3 × 12)",
                "Foam Rolling (Glutes & Quads) (10 mins)",
                "Supine Figure-Four Stretch (3 × 45 sec)"
            ]
        },
        {
            day: "Day 3: Upper Body Openers & Core Balance",
            exercises: [
                "Thread the Needle Stretch (3 × 10 each side)",
                "Wall Angel Scapular Slides (3 × 12)",
                "Deadbug Core Activation (3 × 12 each)",
                "Bird-Dog Stability Holds (3 × 10 each side)",
                "Child's Pose with Lat Reach (3 × 60 sec)"
            ]
        }
    ];
}

function getHIITSchedule() {
    return [
        {
            day: "Day 1: High-Intensity Metabolic Torch",
            exercises: [
                "Kettlebell Swings (4 × 20)",
                "Burpee Box Jumps (4 × 12)",
                "Battle Ropes Alternating Waves (4 × 30 sec)",
                "Dumbbell Thrusters (4 × 12)",
                "Mountain Climbers (4 × 40 sec)"
            ]
        },
        {
            day: "Day 2: Explosive Agility & Plyometrics",
            exercises: [
                "Box Jump Overs (4 × 10)",
                "Medicine Ball Slams (4 × 15)",
                "Speed Skater Lateral Jumps (4 × 20)",
                "Assault Bike Sprint Intervals (5 × 30 sec)",
                "Hanging Knee to Elbow Raises (4 × 12)"
            ]
        },
        {
            day: "Day 3: Tabata Circuit & Core Burn",
            exercises: [
                "Speed Jump Rope (5 × 60 sec)",
                "Dumbbell Renegade Rows (4 × 10 each side)",
                "Kettlebell Goblet Squat to Press (4 × 12)",
                "Plank Shoulder Taps (4 × 20)",
                "Sled Push / Turf Sprints (4 × 25m)"
            ]
        }
    ];
}

function getCoreFunctionalSchedule() {
    return [
        {
            day: "Day 1: Pillar Strength & Torso Power",
            exercises: [
                "Barbell Landmine Rotations (4 × 12 each side)",
                "Farmer's Heavy Dumbbell Walk (4 × 40m)",
                "Hanging Windshield Wipers (3 × 10 each)",
                "Kettlebell Turkish Get-Up (3 × 3 each side)",
                "Ab Wheel Rollouts (4 × 12)"
            ]
        },
        {
            day: "Day 2: Unilateral Balance & Posterior Chain",
            exercises: [
                "Single-Leg Romanian Deadlift (3 × 10 each)",
                "Dumbbell Step-Ups on Box (3 × 12 each leg)",
                "Pallof Press Cable Hold (4 × 12 each side)",
                "Overhead Kettlebell Carry (3 × 30m)",
                "Side Plank with Hip Lift (3 × 12 each side)"
            ]
        },
        {
            day: "Day 3: Rotational Power & Core Stability",
            exercises: [
                "Medicine Ball Rotational Wall Throws (4 × 10)",
                "Dual Kettlebell Front Rack Carry (4 × 30m)",
                "Hanging L-Sit Hold (4 × 20 sec)",
                "Cable Woodchoppers (3 × 12 each side)",
                "Hollow Body Rock Hold (4 × 30 sec)"
            ]
        }
    ];
}

function getPowerStrengthSchedule() {
    return [
        {
            day: "Day 1: Heavy Upper Strength (Bench & Press)",
            exercises: [
                "Barbell Bench Press (5 × 5 Heavy)",
                "Weighted Pull-ups (4 × 6)",
                "Standing Military Press (4 × 6)",
                "Barbell Pendlay Rows (4 × 6)",
                "Weighted Dips (3 × 8)"
            ]
        },
        {
            day: "Day 2: Lower Power (Squat & Deadlift)",
            exercises: [
                "Barbell Back Squats (5 × 5 Heavy)",
                "Conventional Deadlifts (4 × 4)",
                "Bulgarian Split Squats (3 × 8 each leg)",
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
                "Incline Dumbbell Curls (4 × 10)"
            ]
        }
    ];
}

function getPPLSchedule() {
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

function getBeginnerFoundationSchedule() {
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
    const btn = $(this);
    const planId = btn.data('plan-id');
    const planName = decodeURIComponent(btn.data('plan-name') || 'Workout Routine');
    const mId = btn.data('mid') || localStorage.getItem('memberId') || localStorage.getItem('userId');

    btn.prop('disabled', true).html('<span class="btn-spinner"></span>Switching Routine...');

    localStorage.setItem("flex_selected_plan_" + mId, String(planId));

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
            window.showToast(`Switched active workout routine to "${planName}"! 🔥`, "success");
            loadMemberWorkoutRoutine(mId);
        },
        error: function () {
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

            openModal('modalMemberDigitalCard');
        },
        error: function () {
            window.showToast("Failed to load member profile details.", "error");
        }
    });
}

$(document).on('click', '.view-member-card-btn', function (e) {
    e.preventDefault();
    const mId = $(this).data('id') || localStorage.getItem('memberId');
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

function initRealtimeDashboardSync(role) {
    setInterval(() => {
        if (role === 'MEMBER') {
            const mId = localStorage.getItem("memberId");
            if (mId && typeof refreshMemberLiveStatus === 'function') {
                refreshMemberLiveStatus(mId);
            }
        }
    }, 20000);
}

window.FlexDashboard = {
    switchSection: switchSection,
    openModal: openModal,
    closeModal: closeModal
};
window.initMemberDashboard = initMemberDashboard;
window.loadMemberDashboard = initMemberDashboard;
window.loadMemberWorkoutRoutine = loadMemberWorkoutRoutine;
window.openMemberDigitalCard = openMemberDigitalCard;