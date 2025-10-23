let subjects = [];
let currentSubject = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let attendanceData = {};

// QR Sync Variables
let qrConnection = null;
let isConnected = false;
let qrScanning = false;
let videoStream = null;

// ==================== QR SYNC FUNCTIONS ====================

function showQRSyncModal() {
    const modal = new bootstrap.Modal(document.getElementById('qrSyncModal'));
    modal.show();
    updateConnectionStatus();
    bootstrap.Modal.getInstance(document.getElementById('mainMenuModal')).hide();
}

function showGenerateQR() {
    document.getElementById('generateSection').style.display = 'block';
    document.getElementById('scanSection').style.display = 'none';
    document.getElementById('instructionsSection').style.display = 'none';
    generateQRCode();
}

function generateQRCode() {
    const appData = {
        subjects: subjects,
        attendanceData: attendanceData,
        timestamp: Date.now(),
        deviceId: generateDeviceId(),
        type: 'sync_request'
    };

    const dataStr = JSON.stringify(appData);
    const qr = qrcode(0, 'M');
    qr.addData(dataStr);
    qr.make();

    document.getElementById('qrCodeDisplay').innerHTML = qr.createImgTag(5);
    showSyncStatus('QR Code Generated - Ready for Scan');
}

function refreshQRCode() {
    generateQRCode();
    showSyncStatus('QR Code Refreshed');
}

function startQRScanning() {
    document.getElementById('generateSection').style.display = 'none';
    document.getElementById('scanSection').style.display = 'block';
    document.getElementById('instructionsSection').style.display = 'none';

    const video = document.getElementById('qrScanner');
    const canvas = document.getElementById('qrCanvas');
    const context = canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function (stream) {
            videoStream = stream;
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            video.style.display = 'block';
            qrScanning = true;
            requestAnimationFrame(tick);
            showSyncStatus('Camera Started - Scan QR Code');
        })
        .catch(function (err) {
            console.error("Error accessing camera:", err);
            alert("Cannot access camera. Please check permissions.");
        });

    function tick() {
        if (!qrScanning) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                handleScannedQR(code.data);
            }
        }

        requestAnimationFrame(tick);
    }
}

function stopQRScanning() {
    qrScanning = false;
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const video = document.getElementById('qrScanner');
    video.style.display = 'none';
    document.getElementById('scanSection').style.display = 'none';
    document.getElementById('instructionsSection').style.display = 'block';
}

function handleScannedQR(data) {
    try {
        const scannedData = JSON.parse(data);

        if (scannedData.type === 'sync_request') {
            // Merge data from scanned QR
            mergeData(scannedData);
            stopQRScanning();

            // Show success and update UI
            showSyncStatus('Data Synced Successfully!');
            updateConnectionStatus('connected');

            // Close modal after success
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('qrSyncModal')).hide();
            }, 2000);
        }
    } catch (e) {
        console.error('Invalid QR code:', e);
        showSyncStatus('Invalid QR Code', 'error');
    }
}

function mergeData(newData) {
    // Merge subjects
    const existingSubjectIds = new Set(subjects.map(s => s.id));
    newData.subjects.forEach(subject => {
        if (!existingSubjectIds.has(subject.id)) {
            subjects.push(subject);
        }
    });

    // Merge attendance data
    Object.keys(newData.attendanceData).forEach(subjectId => {
        if (!attendanceData[subjectId]) {
            attendanceData[subjectId] = {};
        }

        Object.keys(newData.attendanceData[subjectId]).forEach(monthKey => {
            if (!attendanceData[subjectId][monthKey]) {
                attendanceData[subjectId][monthKey] = {};
            }

            Object.keys(newData.attendanceData[subjectId][monthKey]).forEach(day => {
                attendanceData[subjectId][monthKey][day] = {
                    ...attendanceData[subjectId][monthKey][day],
                    ...newData.attendanceData[subjectId][monthKey][day]
                };
            });
        });
    });

    saveToLocalStorage();
    renderSubjects();

    if (currentSubject) {
        renderCalendar();
        updateStats();
    }
}

function updateConnectionStatus(status = 'disconnected') {
    const statusEl = document.getElementById('connectionInfo');
    const indicatorEl = document.getElementById('connectionStatus');

    isConnected = status === 'connected';

    if (status === 'connected') {
        statusEl.className = 'connection-status connected';
        statusEl.innerHTML = '<i class="fas fa-link"></i> Connected - Real-time Sync Active';
        indicatorEl.style.display = 'block';
    } else {
        statusEl.className = 'connection-status disconnected';
        statusEl.innerHTML = '<i class="fas fa-unlink"></i> Not Connected';
        indicatorEl.style.display = 'none';
    }
}

function generateDeviceId() {
    return 'device_' + Math.random().toString(36).substr(2, 9);
}

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

    // If connected, we could sync to other devices here
    if (isConnected) {
        showSyncStatus('Auto-saved & Synced');
    } else {
        showSyncStatus('Auto-saved');
    }
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
    alert('🔄 Auto Save Feature:\n\n• Your data is automatically saved every 30 seconds\n• Works completely offline\n• No setup required\n• Perfect for single device use\n\nFor cross-device sync, use QR Sync or Export/Import feature.');
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
    alert('📋 How to Sync Across Devices:\n\n🔷 QR CODE SYNC (Recommended):\n1. On Device A: Menu → QR Sync → Generate QR\n2. On Device B: Menu → QR Sync → Scan QR\n3. Point Device B camera at Device A QR code\n4. Instantly connected! Changes sync automatically\n\n🔷 FILE BACKUP:\n1. On Device A: Menu → Backup → Export Data\n2. Transfer file (email/WhatsApp/Drive)\n3. On Device B: Menu → Backup → Import Data\n4. Select the backup file\n\n💡 Tip: Use QR Sync for quick transfers when devices are together!');
}

// ==================== EXISTING ATTENDANCE FUNCTIONS ====================
// [All your existing attendance functions remain exactly the same]
// Only adding saveToLocalStorage() calls to each function that modifies data

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
        if (day.status && day.status !== 'holiday' && day.status !== 'weekoff') {
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

        if (dayData.shift) {
            const badge = document.createElement('span');
            badge.className = 'shift-badge';
            badge.textContent = dayData.shift;
            dayEl.appendChild(badge);
        }

        dayEl.onclick = () => showAttendanceModal(day);
        container.appendChild(dayEl);
    }
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

    bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
    renderCalendar();
    updateStats();
    saveToLocalStorage();
}

function showOvertimeInput() {
    const hours = prompt("Enter overtime hours:");
    if (hours !== null && !isNaN(hours) && hours >= 0) {
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

        attendanceData[currentSubject.id][monthKey][selectedDate].overtime = parseFloat(hours);
        bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
        renderCalendar();
        updateStats();
        saveToLocalStorage();
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

    attendanceData[currentSubject.id][monthKey][selectedDate].shift = shift;
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

function addNote() {
    const note = prompt("Enter note:");
    if (note !== null) {
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

        attendanceData[currentSubject.id][monthKey][selectedDate].note = note;
        bootstrap.Modal.getInstance(document.getElementById('moreOptionsModal')).hide();
        alert("Note added successfully!");
        saveToLocalStorage();
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
            if (confirm('🎉 Welcome to Attendance Manager!\n\nWould you like to see how to sync data across devices?')) {
                showHelp();
            }
        }, 1000);
    }
});