let subjects = [];
let currentSubject = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let attendanceData = {};

// ==================== BACKUP & SYNC FUNCTIONS ====================

function showSyncStatus(message, type = 'success') {
    const statusEl = document.getElementById('syncStatus');
    const messageEl = document.getElementById('syncMessage');

    messageEl.textContent = message;
    statusEl.style.display = 'flex';

    if (type === 'error') {
        statusEl.style.background = 'var(--danger-color)';
    } else if (type === 'warning') {
        statusEl.style.background = 'var(--secondary-color)';
    } else {
        statusEl.style.background = 'var(--success-color)';
    }

    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

function saveToLocalStorage() {
    const appData = {
        subjects: subjects,
        attendanceData: attendanceData,
        lastSync: new Date().toISOString(),
        version: '1.0'
    };
    localStorage.setItem('attendanceAppData', JSON.stringify(appData));
    showSyncStatus('Auto-saved');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('attendanceAppData');
    if (saved) {
        try {
            const appData = JSON.parse(saved);
            subjects = appData.subjects || [];
            attendanceData = appData.attendanceData || {};
            renderSubjects();
            showSyncStatus('Data loaded successfully');
        } catch (e) {
            console.error('Error loading data:', e);
            showSyncStatus('Error loading saved data', 'error');
        }
    }
}

function exportData() {
    const appData = {
        subjects: subjects,
        attendanceData: attendanceData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    const date = new Date().toISOString().split('T')[0];
    link.download = `attendance-backup-${date}.json`;
    link.click();

    bootstrap.Modal.getInstance(document.getElementById('backupModal')).hide();
    showSyncStatus('Backup file downloaded');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const appData = JSON.parse(event.target.result);

                if (!appData.subjects || !appData.attendanceData) {
                    throw new Error('Invalid backup file format');
                }

                if (confirm('This will replace all current data. Continue?')) {
                    subjects = appData.subjects || [];
                    attendanceData = appData.attendanceData || {};

                    saveToLocalStorage();
                    renderSubjects();
                    bootstrap.Modal.getInstance(document.getElementById('backupModal')).hide();
                    showSyncStatus('Data restored successfully!');

                    if (document.getElementById('detailPage').style.display !== 'none') {
                        goBack();
                    }
                }
            } catch (error) {
                console.error('Error importing file:', error);
                alert('Error: Invalid backup file. Please select a valid attendance backup file.');
            }
        };

        reader.onerror = function () {
            alert('Error reading file. Please try again.');
        };

        reader.readAsText(file);
    };

    input.click();
}

function clearAllData() {
    if (confirm('⚠️ WARNING: This will permanently delete ALL your data including all subjects and attendance records. This action cannot be undone!\n\nAre you absolutely sure?')) {
        subjects = [];
        attendanceData = {};
        localStorage.removeItem('attendanceAppData');
        renderSubjects();
        bootstrap.Modal.getInstance(document.getElementById('backupModal')).hide();
        showSyncStatus('All data cleared', 'warning');

        if (document.getElementById('detailPage').style.display !== 'none') {
            goBack();
        }
    }
}

function showAutoBackupInfo() {
    alert('🔄 Auto Save Feature:\n\n• Your data is automatically saved every 30 seconds\n• Works completely offline\n• No setup required\n• Perfect for single device use\n\nFor cross-device sync, use Export/Import feature.');
}

// ==================== MENU FUNCTIONS ====================

function showMainMenu() {
    const modal = new bootstrap.Modal(document.getElementById('mainMenuModal'));
    modal.show();
}

function showBackupModal() {
    bootstrap.Modal.getInstance(document.getElementById('mainMenuModal')).hide();
    const modal = new bootstrap.Modal(document.getElementById('backupModal'));
    modal.show();
}

function showSettings() {
    alert('⚙️ Settings Coming Soon!\n\nFuture features:\n• Custom percentage thresholds\n• Theme customization\n• Export formats\n• Notification settings');
}

function showHelp() {
    alert('📋 How to Use Attendance Manager:\n\n🔷 ADDING SUBJECTS:\n1. Click the + button on the home screen\n2. Enter subject name (Math, Job Name, Company Name, etc.)\n3. Click ADD\n\n🔷 MARKING ATTENDANCE:\n1. Click on a subject to open its calendar\n2. Click on any date to mark attendance\n3. Choose from options: Present, Absent, Half Day, etc.\n\n🔷 BACKUP & RESTORE:\n1. Menu → Backup & Restore\n2. Export Data: Download backup file\n3. Import Data: Upload backup file to restore\n\n💡 Tip: Your data is automatically saved every 30 seconds!');
}

// ==================== ATTENDANCE FUNCTIONS ====================

function showAddSubjectModal() {
    const modal = new bootstrap.Modal(document.getElementById('addSubjectModal'));
    modal.show();
}

function addSubject() {
    const input = document.getElementById('subjectInput');
    const name = input.value.trim();
    if (name) {
        subjects.push({ name, id: Date.now() });
        input.value = '';
        bootstrap.Modal.getInstance(document.getElementById('addSubjectModal')).hide();
        renderSubjects();
        saveToLocalStorage();
    }
}

function renderSubjects() {
    const list = document.getElementById('subjectsList');
    if (subjects.length === 0) {
        list.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-check"></i>
                        <h4>No Subjects Added</h4>
                        <p>Click the + button to add your first subject or work</p>
                    </div>
                `;
    } else {
        list.innerHTML = subjects.map(s => {
            const percentage = calculatePercentage(s.id);
            const color = percentage >= 75 ? 'var(--success-color)' : percentage >= 50 ? 'var(--secondary-color)' : 'var(--danger-color)';
            return `
                        <div class="subject-card" onclick="openSubject(${s.id})">
                            <div class="subject-name">${s.name}</div>
                            <div class="percentage-circle" style="background: ${color}">
                                ${percentage}%
                            </div>
                        </div>
                    `;
        }).join('');
    }
}

function calculatePercentage(subjectId) {
    const data = attendanceData[subjectId] || {};
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthData = data[monthKey] || {};

    let present = 0, total = 0;
    Object.values(monthData).forEach(day => {
        // Exclude holidays, weekoffs, and leaves from calculation
        if (day.status && day.status !== 'holiday' && day.status !== 'weekoff' && day.status !== 'leave') {
            total++;
            if (day.status === 'present') present++;
            if (day.status === 'halfday') present += 0.5;
        }
    });

    return total > 0 ? Math.round((present / total) * 100) : 0;
}

function openSubject(id) {
    currentSubject = subjects.find(s => s.id === id);
    document.getElementById('detailTitle').textContent = currentSubject.name;
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('detailPage').style.display = 'block';
    renderCalendar();
    updateStats();
}

function goBack() {
    document.getElementById('homePage').style.display = 'block';
    document.getElementById('detailPage').style.display = 'none';
    renderSubjects();
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
    updateStats();
}

function renderCalendar() {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    document.getElementById('currentMonth').textContent = `${months[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const container = document.getElementById('calendarDays');
    container.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        container.appendChild(document.createElement('div'));
    }

    const today = new Date();
    const data = attendanceData[currentSubject.id] || {};
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthData = data[monthKey] || {};

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;

        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayEl.classList.add('today');
        }

        const dayData = monthData[day] || {};
        if (dayData.status) {
            dayEl.classList.add(dayData.status);
        }

        // Handle shift and overtime display
        const hasShift = dayData.shift;
        const hasOvertime = dayData.overtime && dayData.overtime > 0;

        if (hasShift && hasOvertime) {
            // Combined shift + overtime badge
            const combinedBadge = document.createElement('span');
            combinedBadge.className = 'combined-shift-ot';
            combinedBadge.textContent = `${dayData.shift}+OT`;
            combinedBadge.title = `${getShiftName(dayData.shift)} Shift + ${dayData.overtime} hours OT`;
            dayEl.appendChild(combinedBadge);
        } else if (hasShift) {
            // Only shift badge
            const badge = document.createElement('span');
            badge.className = 'shift-badge';
            badge.textContent = dayData.shift;
            badge.title = `${getShiftName(dayData.shift)} Shift`;
            dayEl.appendChild(badge);
        } else if (hasOvertime) {
            // Only overtime indicator at bottom
            const overtimeIndicator = document.createElement('div');
            overtimeIndicator.className = 'overtime-indicator';
            overtimeIndicator.textContent = `${dayData.overtime}h`;
            overtimeIndicator.title = `${dayData.overtime} hours overtime`;
            dayEl.appendChild(overtimeIndicator);
        }

        // Show note indicator if note exists
        if (dayData.note) {
            const noteIndicator = document.createElement('div');
            noteIndicator.className = 'note-indicator';
            noteIndicator.innerHTML = '<i class="fas fa-sticky-note"></i>';
            noteIndicator.title = dayData.note;
            dayEl.appendChild(noteIndicator);
        }

        dayEl.onclick = () => showAttendanceModal(day);
        container.appendChild(dayEl);
    }
}

function getShiftName(shiftCode) {
    const shiftNames = {
        'M': 'Morning',
        'A': 'Afternoon', 
        'N': 'Night',
        'G': 'General'
    };
    return shiftNames[shiftCode] || 'Unknown';
}

function showAttendanceModal(day) {
    selectedDate = day;
    const modal = new bootstrap.Modal(document.getElementById('attendanceModal'));
    modal.show();
}

function markAttendance(status) {
    if (!attendanceData[currentSubject.id]) {
        attendanceData[currentSubject.id] = {};
    }
    const monthKey = `${currentYear}-${currentMonth}`;
    if (!attendanceData[currentSubject.id][monthKey]) {
        attendanceData[currentSubject.id][monthKey] = {};
    }
    if (!attendanceData[currentSubject.id][monthKey][selectedDate]) {
        attendanceData[currentSubject.id][monthKey][selectedDate] = {};
    }

    attendanceData[currentSubject.id][monthKey][selectedDate].status = status;

    // Close all possible modals
    const attendanceModal = bootstrap.Modal.getInstance(document.getElementById('attendanceModal'));
    const moreOptionsModal = bootstrap.Modal.getInstance(document.getElementById('moreOptionsModal'));
    
    if (attendanceModal) attendanceModal.hide();
    if (moreOptionsModal) moreOptionsModal.hide();
    
    renderCalendar();
    updateStats();
    saveToLocalStorage();
}

// ==================== ENHANCED OVERTIME FUNCTIONS ====================

function showOvertimeModal() {
    const monthKey = `${currentYear}-${currentMonth}`;
    const existingOvertime = attendanceData[currentSubject.id]?.[monthKey]?.[selectedDate]?.overtime || '';
    const currentShift = attendanceData[currentSubject.id]?.[monthKey]?.[selectedDate]?.shift || 'None';

    // Set up the overtime editor modal
    document.getElementById('overtimeEditorTitle').textContent = existingOvertime ? 'Edit Overtime' : 'Add Overtime';
    document.getElementById('overtimeDate').textContent = `${selectedDate}/${currentMonth + 1}/${currentYear}`;
    document.getElementById('overtimeInput').value = existingOvertime;
    document.getElementById('currentShiftDisplay').textContent = getShiftName(currentShift);
    
    // Show/hide delete button based on whether overtime exists
    document.getElementById('deleteOvertimeBtn').style.display = existingOvertime ? 'block' : 'none';
    
    // Show the modal
    bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
    const modal = new bootstrap.Modal(document.getElementById('overtimeModal'));
    modal.show();
}

function saveOvertime() {
    const overtimeValue = parseFloat(document.getElementById('overtimeInput').value);
    const monthKey = `${currentYear}-${currentMonth}`;
    
    if (!attendanceData[currentSubject.id]) {
        attendanceData[currentSubject.id] = {};
    }
    if (!attendanceData[currentSubject.id][monthKey]) {
        attendanceData[currentSubject.id][monthKey] = {};
    }
    if (!attendanceData[currentSubject.id][monthKey][selectedDate]) {
        attendanceData[currentSubject.id][monthKey][selectedDate] = {};
    }

    if (isNaN(overtimeValue) || overtimeValue < 0) {
        alert('Please enter a valid overtime value (0 or greater)');
        return;
    }

    if (overtimeValue === 0) {
        // If overtime is 0, delete it
        delete attendanceData[currentSubject.id][monthKey][selectedDate].overtime;
        showSyncStatus('Overtime removed', 'warning');
    } else {
        // Save the overtime
        attendanceData[currentSubject.id][monthKey][selectedDate].overtime = overtimeValue;
        
        // Automatically mark as present if not already set
        if (!attendanceData[currentSubject.id][monthKey][selectedDate].status) {
            attendanceData[currentSubject.id][monthKey][selectedDate].status = 'present';
        }
        
        showSyncStatus('Overtime saved successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('overtimeModal')).hide();
    renderCalendar();
    updateStats();
    saveToLocalStorage();
}

function deleteOvertime() {
    if (confirm("⚠️ Are you sure you want to delete overtime for this date?")) {
        const monthKey = `${currentYear}-${currentMonth}`;
        if (attendanceData[currentSubject.id]?.[monthKey]?.[selectedDate]) {
            delete attendanceData[currentSubject.id][monthKey][selectedDate].overtime;
            bootstrap.Modal.getInstance(document.getElementById('overtimeModal')).hide();
            renderCalendar();
            updateStats();
            saveToLocalStorage();
            showSyncStatus('Overtime deleted', 'warning');
        }
    }
}

function showShiftMenu() {
    bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
    const modal = new bootstrap.Modal(document.getElementById('shiftModal'));
    modal.show();
}

function setShift(shift) {
    if (!attendanceData[currentSubject.id]) {
        attendanceData[currentSubject.id] = {};
    }
    const monthKey = `${currentYear}-${currentMonth}`;
    if (!attendanceData[currentSubject.id][monthKey]) {
        attendanceData[currentSubject.id][monthKey] = {};
    }
    if (!attendanceData[currentSubject.id][monthKey][selectedDate]) {
        attendanceData[currentSubject.id][monthKey][selectedDate] = {};
    }

    // Set the shift
    attendanceData[currentSubject.id][monthKey][selectedDate].shift = shift;
    
    // Automatically mark as present if a shift is selected (not cleared)
    if (shift !== '') {
        attendanceData[currentSubject.id][monthKey][selectedDate].status = 'present';
    } else {
        // If clearing shift, also clear overtime if no status
        if (!attendanceData[currentSubject.id][monthKey][selectedDate].status) {
            delete attendanceData[currentSubject.id][monthKey][selectedDate].overtime;
        }
    }
    
    bootstrap.Modal.getInstance(document.getElementById('shiftModal')).hide();
    renderCalendar();
    updateStats();
    saveToLocalStorage();
}

function showMoreOptions() {
    bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
    const modal = new bootstrap.Modal(document.getElementById('moreOptionsModal'));
    modal.show();
}

function showLeaveMenu() {
    bootstrap.Modal.getInstance(document.getElementById('moreOptionsModal')).hide();
    const modal = new bootstrap.Modal(document.getElementById('leaveModal'));
    modal.show();
}

function markLeave(leaveType) {
    if (!attendanceData[currentSubject.id]) {
        attendanceData[currentSubject.id] = {};
    }
    const monthKey = `${currentYear}-${currentMonth}`;
    if (!attendanceData[currentSubject.id][monthKey]) {
        attendanceData[currentSubject.id][monthKey] = {};
    }
    if (!attendanceData[currentSubject.id][monthKey][selectedDate]) {
        attendanceData[currentSubject.id][monthKey][selectedDate] = {};
    }

    attendanceData[currentSubject.id][monthKey][selectedDate].status = 'leave';
    attendanceData[currentSubject.id][monthKey][selectedDate].leaveType = leaveType;

    bootstrap.Modal.getInstance(document.getElementById('leaveModal')).hide();
    renderCalendar();
    updateStats();
    saveToLocalStorage();
}

// ==================== ENHANCED NOTE FUNCTIONS ====================

function addNote() {
    const monthKey = `${currentYear}-${currentMonth}`;
    const existingNote = attendanceData[currentSubject.id]?.[monthKey]?.[selectedDate]?.note || '';

    // Set up the note editor modal
    document.getElementById('noteEditorTitle').textContent = existingNote ? 'Edit Note' : 'Add Note';
    document.getElementById('noteDate').textContent = `${selectedDate}/${currentMonth + 1}/${currentYear}`;
    document.getElementById('noteTextArea').value = existingNote;
    
    // Show/hide delete button based on whether note exists
    document.getElementById('deleteNoteBtn').style.display = existingNote ? 'block' : 'none';
    
    // Show the modal
    bootstrap.Modal.getInstance(document.getElementById('moreOptionsModal')).hide();
    const modal = new bootstrap.Modal(document.getElementById('noteEditorModal'));
    modal.show();
}

function saveNote() {
    const noteText = document.getElementById('noteTextArea').value.trim();
    const monthKey = `${currentYear}-${currentMonth}`;
    
    if (!attendanceData[currentSubject.id]) {
        attendanceData[currentSubject.id] = {};
    }
    if (!attendanceData[currentSubject.id][monthKey]) {
        attendanceData[currentSubject.id][monthKey] = {};
    }
    if (!attendanceData[currentSubject.id][monthKey][selectedDate]) {
        attendanceData[currentSubject.id][monthKey][selectedDate] = {};
    }

    if (noteText === '') {
        // If note is empty, delete it
        delete attendanceData[currentSubject.id][monthKey][selectedDate].note;
        showSyncStatus('Note removed', 'warning');
    } else {
        // Save the note
        attendanceData[currentSubject.id][monthKey][selectedDate].note = noteText;
        showSyncStatus('Note saved successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('noteEditorModal')).hide();
    renderCalendar();
    updateStats();
    saveToLocalStorage();
}

function deleteNote() {
    if (confirm("⚠️ Are you sure you want to delete this note?")) {
        const monthKey = `${currentYear}-${currentMonth}`;
        if (attendanceData[currentSubject.id]?.[monthKey]?.[selectedDate]) {
            delete attendanceData[currentSubject.id][monthKey][selectedDate].note;
            bootstrap.Modal.getInstance(document.getElementById('noteEditorModal')).hide();
            renderCalendar();
            updateStats();
            saveToLocalStorage();
            showSyncStatus('Note deleted', 'warning');
        }
    }
}

function clearAttendance() {
    if (!attendanceData[currentSubject.id]) return;

    const monthKey = `${currentYear}-${currentMonth}`;
    if (attendanceData[currentSubject.id][monthKey] && attendanceData[currentSubject.id][monthKey][selectedDate]) {
        delete attendanceData[currentSubject.id][monthKey][selectedDate];
    }

    bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
    renderCalendar();
    updateStats();
    saveToLocalStorage();
}

function updateStats() {
    if (!currentSubject) return;

    const data = attendanceData[currentSubject.id] || {};
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthData = data[monthKey] || {};

    let present = 0, absent = 0, halfday = 0, overtime = 0;
    let holidays = 0, weekoffs = 0;
    let privileged = 0, casual = 0, sick = 0, other = 0;
    let morning = 0, afternoon = 0, night = 0, general = 0;

    Object.values(monthData).forEach(day => {
        if (day.status) {
            switch (day.status) {
                case 'present': present++; break;
                case 'absent': absent++; break;
                case 'halfday': halfday++; break;
                case 'holiday': holidays++; break;
                case 'weekoff': weekoffs++; break;
                case 'leave':
                    switch (day.leaveType) {
                        case 'privileged': privileged++; break;
                        case 'casual': casual++; break;
                        case 'sick': sick++; break;
                        case 'other': other++; break;
                    }
                    break;
            }
        }

        if (day.overtime) {
            overtime += day.overtime;
        }

        if (day.shift) {
            switch (day.shift) {
                case 'M': morning++; break;
                case 'A': afternoon++; break;
                case 'N': night++; break;
                case 'G': general++; break;
            }
        }
    });

    document.getElementById('presentCount').textContent = present;
    document.getElementById('absentCount').textContent = absent;
    document.getElementById('halfDayCount').textContent = halfday;

    const overtimeDays = Math.floor(overtime / 8);
    const remainingHours = overtime % 8;
    document.getElementById('otCount').textContent = `${overtime} hrs - ${overtimeDays} days`;

    const totalDays = present + absent + halfday;
    const percentage = totalDays > 0 ? Math.round((present + (halfday * 0.5)) / totalDays * 100) : 0;
    document.getElementById('totalPercentage').textContent = `${percentage}%`;

    // Update more info modal data
    document.getElementById('infoHolidays').textContent = holidays;
    document.getElementById('infoWeekOffs').textContent = weekoffs;
    document.getElementById('infoPrivileged').textContent = privileged;
    document.getElementById('infoCasual').textContent = casual;
    document.getElementById('infoSick').textContent = sick;
    document.getElementById('infoOther').textContent = other;
    document.getElementById('infoMorning').textContent = morning;
    document.getElementById('infoAfternoon').textContent = afternoon;
    document.getElementById('infoNight').textContent = night;
    document.getElementById('infoGeneral').textContent = general;
}

function showMoreInfo() {
    updateStats();
    const modal = new bootstrap.Modal(document.getElementById('moreInfoModal'));
    modal.show();
}

function showOptionsMenu() {
    const modal = new bootstrap.Modal(document.getElementById('optionsMenuModal'));
    modal.show();
}

function searchAttendance() {
    const searchTerm = prompt("Enter date (DD-MM-YYYY) or status to search:");
    if (searchTerm) {
        alert(`Search functionality for "${searchTerm}" would be implemented here.`);
    }
}

function calculateSalary() {
    alert("Salary calculation feature would be implemented here with rate per day input.");
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function () {
    loadFromLocalStorage();

    // Auto-save every 30 seconds
    setInterval(saveToLocalStorage, 30000);

    // Show welcome message for first-time users
    if (!localStorage.getItem('attendanceAppData')) {
        setTimeout(() => {
            if (confirm('🎉 Welcome to Attendance Manager!\n\nWould you like to see how to use the app?')) {
                showHelp();
            }
        }, 1000);
    }
});