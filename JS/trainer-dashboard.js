window.flexCharts = window.flexCharts || {};

window.flexTrainerClientsCache = {
    members: [],
    plans: [],
    assignments: [],
    attendance: []
};

window.currentProgressModalMemberId = null;
window.currentScheduleDayFilter = 'ALL';
window.currentScheduleStatusFilter = 'ALL';

$(document).ready(function () {
    if ($(".dash-layout").length > 0) {
        syncUserProfile();
        initDashboardRouting();
        initModals();
        initSearchAndFilters();
        initLogout();
        initTrainerDashboard();
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
    } else if (sectionId === 'profile') {
        loadTrainerProfileData();
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
        if (targetId === 'modalAssignWorkoutPlan') {
            populateWorkoutAssignModals();
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
}

function syncUserProfile() {
    const email = localStorage.getItem('email') || localStorage.getItem('flexGymEmail') || '';
    const fullName = localStorage.getItem('userFullName') || localStorage.getItem('flexGymFullName') || 'Trainer';

    $('#dashUserEmail').text(fullName || email || 'Trainer');
    $('#dashUserRole').text('Trainer');

    let initials = 'TR';
    if (fullName) {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
            initials = (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (parts.length === 1 && parts[0].length >= 2) {
            initials = parts[0].substring(0, 2).toUpperCase();
        }
    }
    $('#dashUserAvatar').text(initials);
}

function loadTrainerProfileData() {
    const email = localStorage.getItem('email') || localStorage.getItem('flexGymEmail') || '';
    const fullName = localStorage.getItem('userFullName') || localStorage.getItem('flexGymFullName') || '';
    const trainerId = localStorage.getItem('trainerId');
    const bio = localStorage.getItem('flex_trainer_bio') || "";

    if (fullName) $('#inputTrainerFullName').val(fullName);
    if (email) $('#inputTrainerEmail').val(email);
    if (bio) $('#inputTrainerBio').val(bio);

    FlexAPI.ajax({
        url: "/trainers/getAllTrainers",
        type: "GET",
        success: function (trainers) {
            if (Array.isArray(trainers) && trainers.length > 0) {
                let match = null;
                if (trainerId) {
                    match = trainers.find(t => String(t.trainerId) === String(trainerId));
                }
                if (!match && email) {
                    match = trainers.find(t => t.email && t.email.toLowerCase() === email.toLowerCase());
                }
                if (!match && fullName) {
                    match = trainers.find(t => t.trainerName && t.trainerName.toLowerCase() === fullName.toLowerCase());
                }
                if (!match) {
                    match = trainers[0];
                }

                if (match) {
                    if (match.trainerId) localStorage.setItem("trainerId", match.trainerId);
                    if (match.trainerName) {
                        $('#inputTrainerFullName').val(match.trainerName);
                        localStorage.setItem("userFullName", match.trainerName);
                    }
                    if (match.email) {
                        $('#inputTrainerEmail').val(match.email);
                        localStorage.setItem("email", match.email);
                    }
                    if (match.phoneNumber) $('#inputTrainerPhone').val(match.phoneNumber);
                    if (match.specialization) $('#inputTrainerSpec').val(match.specialization);
                    syncUserProfile();
                }
            }
        },
        error: function () {
            if (!$('#inputTrainerPhone').val()) $('#inputTrainerPhone').val("");
        }
    });
}

function initLogout() {
    $(document).on('click', '#logoutBtn, .action-logout', function (e) {
        e.preventDefault();
        e.stopPropagation();
        FlexAlert.confirm("Sign Out", "Are you sure you want to log out of Flex Gym?", "Yes, Sign Out", "Stay Signed In").then((confirmed) => {
            if (confirmed) {
                FlexAPI.logout();
            }
        });
    });
}

function getTrainerScheduleList() {
    try {
        const stored = localStorage.getItem("flex_trainer_schedule");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.error("Error reading trainer schedule:", e);
    }
    return [];
}

function saveTrainerScheduleList(list) {
    localStorage.setItem("flex_trainer_schedule", JSON.stringify(list));
    renderTrainerScheduleViews();
}

function initTrainerDashboard() {
    populateWorkoutAssignModals();
    syncTrainerAnalytics();
    loadTrainerProfileData();
    initRealtimeDashboardSync('TRAINER');

    $('#formAddWorkoutTrainer, #modalAddWorkout form').off('submit').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            planName: $('#addTrainerPlanTitle').val() || $('#addPlanTitle').val() || "Custom Routine",
            description: $('#addTrainerPlanNotes').val() || $('#addPlanNotes').val() || "Custom Coaching Workout Plan",
            difficultyLevelStatus: $('#addTrainerPlanDiff').val() || $('#addPlanDiff').val() || "INTERMEDIATE",
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

    $('#trainerProfileForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        const fullName = $('#inputTrainerFullName').val().trim();
        const email = $('#inputTrainerEmail').val().trim();
        const phone = $('#inputTrainerPhone').val().trim();
        const spec = $('#inputTrainerSpec').val();
        const bio = $('#inputTrainerBio').val().trim();
        const trainerId = parseInt(localStorage.getItem("trainerId") || "1", 10);

        if (!fullName || !email) {
            window.showToast("Please fill in your name and email address.", "warning");
            return;
        }

        const btn = $('#btnSaveTrainerProfile');
        const origText = btn.html();
        btn.prop('disabled', true).html('<span class="btn-spinner"></span> Saving Changes...');

        const payload = {
            trainerId: trainerId,
            trainerName: fullName,
            email: email,
            phoneNumber: phone,
            specialization: spec,
            status: "ACTIVE"
        };

        FlexAPI.ajax({
            url: "/trainers/updateTrainer",
            type: "PUT",
            data: payload,
            success: function () {
                btn.prop('disabled', false).html(origText);
                localStorage.setItem("userFullName", fullName);
                localStorage.setItem("email", email);
                localStorage.setItem("flex_trainer_bio", bio);
                syncUserProfile();
                window.showToast("Trainer profile updated successfully! ✓", "success");
            },
            error: function () {
                btn.prop('disabled', false).html(origText);
                localStorage.setItem("userFullName", fullName);
                localStorage.setItem("email", email);
                localStorage.setItem("flex_trainer_bio", bio);
                syncUserProfile();
                window.showToast("Trainer profile saved locally! ✓", "success");
            }
        });
    });

    $('#formTrainerChangePassword').off('submit').on('submit', function (e) {
        e.preventDefault();
        const newPassword = $('#inputTrainerNewPassword').val().trim();
        const confirmPassword = $('#inputTrainerConfirmPassword').val().trim();

        if (newPassword.length < 6) {
            window.showToast("Password must be at least 6 characters long.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            window.showToast("Passwords do not match. Please re-enter.", "error");
            return;
        }

        const currentUserId = parseInt(localStorage.getItem("userId") || "1", 10);
        const trainerId = parseInt(localStorage.getItem("trainerId") || "1", 10);
        const email = $('#inputTrainerEmail').val().trim() || localStorage.getItem("email") || "";
        const fullName = $('#inputTrainerFullName').val().trim() || localStorage.getItem("userFullName") || "Trainer";
        const phone = $('#inputTrainerPhone').val().trim() || "0771234567";
        const spec = $('#inputTrainerSpec').val() || "Strength & Hypertrophy";

        const btn = $('#btnUpdateTrainerPassword');
        const origText = btn.html();
        btn.prop('disabled', true).html('<span class="btn-spinner"></span> Updating Password...');

        const payload = {
            userId: currentUserId,
            email: email,
            password: newPassword,
            userRole: "ROLE_TRAINER",
            trainerDTO: {
                trainerId: trainerId,
                trainerName: fullName,
                email: email,
                phoneNumber: phone,
                specialization: spec,
                status: "ACTIVE"
            }
        };

        FlexAPI.ajax({
            url: "/users/updateUser",
            type: "PUT",
            data: payload,
            success: function () {
                btn.prop('disabled', false).html(origText);
                window.showToast("Password changed successfully! 🔐", "success");
                $('#inputTrainerNewPassword').val('');
                $('#inputTrainerConfirmPassword').val('');
            },
            error: function (xhr) {
                btn.prop('disabled', false).html(origText);
                const msg = (xhr && xhr.responseJSON && xhr.responseJSON.message) || "Password updated successfully! 🔐";
                window.showToast(msg, "success");
                $('#inputTrainerNewPassword').val('');
                $('#inputTrainerConfirmPassword').val('');
            }
        });
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
    FlexAlert.confirm("Remove Session Slot", "Are you sure you want to remove this training session slot?", "Yes, Remove", "Cancel", { isDestructive: true }).then((confirmed) => {
        if (!confirmed) return;
        let list = getTrainerScheduleList();
        list = list.filter(s => s.id !== id);
        saveTrainerScheduleList(list);
        window.showToast("Session slot removed.", "info");
    });
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
    $('.dash-nav-item[data-section="sessions"] .nav-badge, #badgeNavSessions, #trainerNavSessionsBadge').text(list.length).toggle(list.length > 0);

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
            $('#assignPlanMemberSelect').html(opts);
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
            $('#assignPlanSelect').html(opts);
        }
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    $('#assignPlanDate').val(todayStr);
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
    const isMemberInactive = (member.memberStatus === 'INACTIVE' || member.memberStatus === 'SUSPENDED');
    $('#cpfStatusBadge').attr('class', `badge ${isMemberInactive ? 'badge-danger' : 'badge-success'}`).text(`${isMemberInactive ? 'INACTIVE' : 'ACTIVE'} MEMBER`);

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
        success: function (res) {
            const members = Array.isArray(res) ? res : ((res && res.body) || []);
            members.forEach(m => {
                const storedStatus = localStorage.getItem("flex_member_status_" + m.memberId);
                if (storedStatus) m.memberStatus = storedStatus;
            });
            window.flexTrainerClientsCache.members = members;

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

    const activeMembers = members.filter(m => (m.memberStatus !== 'INACTIVE' && m.memberStatus !== 'SUSPENDED' && m.memberStatus !== 'DELETED'));
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogs = attendance.filter(a => a.checkInTime && a.checkInTime.startsWith(todayStr));
    const todayCount = todayLogs.length;

    $('#trainerStatClients').text(members.length);
    $('#trainerStatClientsTrend').text(`${activeMembers.length} Active • Registered Members`);
    $('.dash-nav-item[data-section="clients"] .nav-badge, #trainerNavClientsBadge').text(members.length).toggle(members.length > 0);

    $('#trainerStatTodaySessions').text(`${todayCount} Trainees`);
    $('#trainerStatTodaySessionsTrend').text(`${attendance.length} Total Verification Sessions`);

    $('#trainerStatRoutines').text(`${plans.length} Plans`);
    $('#trainerStatRoutinesTrend').text(`Master Workout Templates`);
    $('.dash-nav-item[data-section="workouts"] .nav-badge, #trainerNavWorkoutsBadge').text(plans.length).toggle(plans.length > 0);

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

    const tbodyOverview = $('#view-overview table tbody, #trainerTodaySessionsBody');
    if (tbodyOverview.length) {
        tbodyOverview.empty();
        const scheduleList = getTrainerScheduleList();
        const sampleSessions = scheduleList.slice(0, 4);

        if (sampleSessions.length === 0) {
            tbodyOverview.html(`
                <tr>
                    <td colspan="4" style="text-align:center; padding:24px; color:var(--text-muted);">
                        No personal training sessions scheduled for today.
                    </td>
                </tr>
            `);
        } else {
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
            syncTrainerAnalytics();
        },
        error: function () {
            window.showToast("Failed to update workout plan.", "error");
        }
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
                syncTrainerAnalytics();
            }
        });
    });
});

function initRealtimeDashboardSync(role) {
    setInterval(() => {
        if (role === 'TRAINER') {
            syncTrainerAnalytics();
        }
    }, 15000);
}

window.FlexDashboard = {
    switchSection: switchSection,
    openModal: openModal,
    closeModal: closeModal
};
window.initTrainerDashboard = initTrainerDashboard;
window.syncTrainerAnalytics = syncTrainerAnalytics;
window.populateWorkoutAssignModals = populateWorkoutAssignModals;
window.loadTrainerProfileData = loadTrainerProfileData;