window.flexCharts = window.flexCharts || {};

$(document).ready(function () {
    if ($(".dash-layout").length > 0) {
        syncUserProfile();
        initDashboardRouting();
        initModals();
        initSearchAndFilters();
        initLogout();
        initReceptionistDashboard();
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
    } else if (sectionId === 'memberships') {
        loadPendingMembershipRequests();
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
    const email = localStorage.getItem('email') || localStorage.getItem('flexGymEmail') || 'reception@flexgym.com';
    const fullName = localStorage.getItem('userFullName') || localStorage.getItem('flexGymFullName') || 'Front Desk Staff';

    $('#dashUserEmail').text(fullName || email);
    $('#dashUserRole').text('Receptionist');
    $('#dashUserAvatar').text('FD');
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

function initReceptionistDashboard() {
    syncReceptionistAnalytics();
    initRealtimeDashboardSync('RECEPTIONIST');
    loadAdminAttendance();
    loadAdminLockers();
    initPosSystem();

    $('#formRcpAddMember').off('submit').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            memberFullName: $('#rcpMemberFullName').val().trim(),
            email: $('#rcpMemberEmail').val().trim(),
            memberPhoneNumber: $('#rcpMemberPhone').val().trim(),
            age: $('#rcpMemberAge').val() || '25',
            gender: $('#rcpMemberGender').val() || 'Male',
            heightCm: parseFloat($('#rcpMemberHeight').val()) || 175,
            weightKg: parseFloat($('#rcpMemberWeight').val()) || 70,
            password: 'Flex@' + Math.floor(1000 + Math.random() * 9000),
            memberStatus: "ACTIVE"
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
}

function syncReceptionistAnalytics() {
    loadAdminAttendance();

    FlexAPI.ajax({
        url: "/members/getAllMembers",
        type: "GET",
        success: function (res) {
            const members = (res && res.body !== undefined) ? res.body : res;
            if (!Array.isArray(members)) return;
            members.forEach(m => {
                const storedStatus = localStorage.getItem("flex_member_status_" + m.memberId);
                if (storedStatus) m.memberStatus = storedStatus;
            });
            const activeCount = members.filter(m => (m.memberStatus !== 'INACTIVE' && m.memberStatus !== 'SUSPENDED' && m.memberStatus !== 'DELETED')).length;
            $('#rcpStatActiveMembers').text(activeCount);
            $('#rcpStatActiveMembersTrend').text(`Total: ${members.length} Registered`);
            $('#rcpNavMemberBadge, .dash-nav-item[data-section="members"] .nav-badge, .dash-nav-item[href="#members"] .nav-badge')
                .text(members.length)
                .show();

            const tbody = $('#rcpMembersTable tbody, #view-members table tbody');
            if (tbody.length) {
                tbody.empty();
                members.forEach(m => {
                    const isInactive = (m.memberStatus === 'INACTIVE' || m.memberStatus === 'SUSPENDED');
                    const displayStatus = isInactive ? 'INACTIVE' : (m.memberStatus || 'ACTIVE');
                    const statusBadge = isInactive ? 'badge-danger' : 'badge-success';
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
                            <td><span class="badge ${statusBadge}">${displayStatus}</span></td>
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
        url: "/lockers/getAllLockers",
        type: "GET",
        success: function (res) {
            const lockers = (res && res.body !== undefined) ? res.body : res;
            if (!Array.isArray(lockers)) return;
            const activeLockers = lockers.filter(l => l.status !== 'DELETED');
            const occupied = activeLockers.filter(l => l.status === 'OCCUPIED' || l.isOccupied === true).length;
            const available = activeLockers.length - occupied;

            $('#rcpStatAvailableLockers').text(available);
            $('#rcpStatAvailableLockersTrend').text(`${occupied} Occupied / ${activeLockers.length} Total`);
            $('#rcpNavLockerBadge, .dash-nav-item[data-section="lockers"] .nav-badge, .dash-nav-item[href="#lockers"] .nav-badge')
                .text(available)
                .toggle(available > 0);
        }
    });

    loadPendingMembershipRequests();
}

function loadPendingMembershipRequests() {
    FlexAPI.ajax({
        url: "/memberships/getAllPendingMemberships",
        type: "GET",
        success: function (res) {
            const pendingList = (res && res.body !== undefined) ? res.body : res;
            if (Array.isArray(pendingList) && pendingList.length > 0) {
                renderPendingMemberships(pendingList);
            } else {
                checkAllMembershipsForPending();
            }
        },
        error: function () {
            checkAllMembershipsForPending();
        }
    });
}

function checkAllMembershipsForPending() {
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
                renderPendingMemberships(filtered);
            } else {
                renderPendingMemberships([]);
            }
        },
        error: function () {
            renderPendingMemberships([]);
        }
    });
}

function renderPendingMemberships(pendingList) {
    const tbody = $('#tablePendingMemberships tbody, #rcpPendingMembershipsTable tbody');
    const countBadge = $('#pendingMembershipCount, #rcpPendingBadge');
    const count = Array.isArray(pendingList) ? pendingList.length : 0;

    $('#rcpStatPendingMemberships').text(count);
    $('#rcpStatPendingMembershipsTrend').text(count > 0 ? `${count} Need Approval` : 'All Approved ✓');

    if (countBadge.length) {
        countBadge.text(`${count} Requests`).toggle(count > 0);
    }

    $('#rcpNavPendingBadge, .dash-nav-item[data-section="memberships"] .nav-badge, .dash-nav-item[href="#memberships"] .nav-badge')
        .text(count)
        .toggle(count > 0);

    if (!tbody.length) return;
    tbody.empty();

    if (count === 0) {
        tbody.html(`
            <tr>
                <td colspan="6" style="text-align:center; padding:28px; color:var(--text-muted);">
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
            <tr style="background: rgba(245, 158, 11, 0.05);">
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
                            style="padding:5px 12px; font-size:11px; font-weight:700;">
                            ✓ Approve &amp; Collect Payment
                        </button>
                        <button class="btn btn-secondary btn-sm reject-membership-btn" 
                            data-id="${req.membershipId}" 
                            style="padding:5px 10px; font-size:11px; border-color:var(--danger); color:var(--danger);">
                            ✕ Reject
                        </button>
                    </div>
                </td>
            </tr>
        `);
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
            window.showToast("Could not load member details.", "error");
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
            syncReceptionistAnalytics();
        },
        error: function (xhr) {
            btn.prop('disabled', false).html(origText);
            const msg = (xhr.responseJSON && xhr.responseJSON.message) || "Failed to update member.";
            window.showToast(msg, "error");
        }
    });
});

function loadAdminAttendance() {
    FlexAPI.ajax({
        url: "/attendance/getAllLogs",
        type: "GET",
        success: function (logs) {
            const rcpTbody = $('#tableRcpAttendance tbody, #view-overview table tbody');
            if (!Array.isArray(logs)) return;

            const todayStr = new Date().toISOString().slice(0, 10);

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
            $('#rcpStatTodayAttendance').text(todayCount);
            $('#rcpStatTodayAttendanceTrend').text(`${logs.length} Total Turnstile Scans`);
        }
    });
}

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

$(document).on('click', '.btn-rcp-checkout', function (e) {
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

$(document).on('click', '.approve-membership-btn', function () {
    const btn = $(this);
    const id = btn.data('id');
    const name = btn.data('name') || 'Member';
    FlexAlert.confirm("Approve Membership", `Approve membership request #${id} for ${name}?`, "Yes, Approve", "Cancel").then((confirmed) => {
        if (!confirmed) return;
        btn.prop('disabled', true).html('<span class="btn-spinner"></span>Approving...');
        FlexAPI.ajax({
            url: `/memberships/approveMembership/${id}`,
            type: "PUT",
            success: function () {
                window.showToast(`Membership approved for ${name}!`, "success");
                loadPendingMembershipRequests();
                syncReceptionistAnalytics();
            },
            error: function (xhr) {
                btn.prop('disabled', false).text('✓ Approve & Collect Payment');
                const msg = (xhr && xhr.responseJSON && xhr.responseJSON.message) || "Failed to approve membership.";
                window.showToast(msg, "error");
            }
        });
    });
});

$(document).on('click', '.reject-membership-btn', function () {
    const btn = $(this);
    const id = btn.data('id');
    FlexAlert.confirm("Reject Membership", `Are you sure you want to reject membership request #${id}?`, "Yes, Reject", "Cancel", { isDestructive: true }).then((confirmed) => {
        if (!confirmed) return;
        btn.prop('disabled', true).html('<span class="btn-spinner"></span>Rejecting...');
        FlexAPI.ajax({
            url: `/memberships/rejectMembership/${id}`,
            type: "PUT",
            success: function () {
                window.showToast("Membership request rejected.", "info");
                loadPendingMembershipRequests();
                syncReceptionistAnalytics();
            },
            error: function (xhr) {
                btn.prop('disabled', false).text('✕ Reject');
                const msg = (xhr && xhr.responseJSON && xhr.responseJSON.message) || "Failed to reject membership.";
                window.showToast(msg, "error");
            }
        });
    });
});

window._flexCachedMembers = [];

function populateLockerMemberSelects(members) {
    window._flexCachedMembers = members || [];
    const selects = $('#quickAllocateMemberSelect, #addLockerMemberSelect, #editLockerMemberSelect');
    if (!selects.length) return;

    selects.each(function () {
        const select = $(this);
        const currentVal = select.val();
        let html = '<option value="">-- Choose Member --</option>';
        if (Array.isArray(members)) {
            members.forEach(m => {
                const name = m.memberFullName || m.name || `Member #${m.memberId}`;
                html += `<option value="${m.memberId}">MEM-${m.memberId}: ${name}</option>`;
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

                $('#rcpLockersTotal').text(activeLockers.length);
                $('#rcpLockersAvailable').text(availableLockers.length);
                $('#rcpLockersOccupied').text(occupiedLockers.length);

                const memberMap = {};
                if (Array.isArray(membersList)) {
                    membersList.forEach(m => {
                        memberMap[m.memberId] = m;
                    });
                }

                const gridContainers = $('#rcpLockersGrid');
                if (gridContainers.length) {
                    gridContainers.empty();
                    if (activeLockers.length === 0) {
                        gridContainers.html(`
                            <div style="grid-column: 1 / -1; text-align:center; padding:32px; color:var(--text-muted);">
                                No lockers found in the system.
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

                const tbody = $('#tableRcpLockers tbody');
                if (tbody.length) {
                    tbody.empty();
                    if (activeLockers.length === 0) {
                        tbody.html(`
                            <tr>
                                <td colspan="4" style="text-align:center; padding:32px; color:var(--text-muted);">
                                    No active lockers registered.
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

function initRealtimeDashboardSync(role) {
    setInterval(() => {
        if (role === 'RECEPTIONIST') {
            syncReceptionistAnalytics();
        }
    }, 15000);
}

window.FlexDashboard = {
    switchSection: switchSection,
    openModal: openModal,
    closeModal: closeModal
};
window.initReceptionistDashboard = initReceptionistDashboard;
window.syncReceptionistAnalytics = syncReceptionistAnalytics;
window.openMemberDigitalCard = openMemberDigitalCard;
window.viewPosReceiptModal = viewPosReceiptModal;
window.calculatePosChange = calculatePosChange;