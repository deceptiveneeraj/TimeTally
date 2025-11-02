# ⏰ Time Tally - Attendance Management System

A comprehensive, offline-first attendance tracking application designed for students, employees, and professionals to manage their attendance, work hours, and productivity metrics.

**Live Demo:** [https://deceptiveneeraj.github.io/TimeTally/](https://deceptiveneeraj.github.io/TimeTally/)

![Time Tally Banner](./assests/logo.png)

## 📋 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Technologies Used](#-technologies-used)
- [File Structure](#-file-structure)
- [Key Functionalities](#-key-functionalities)
- [Data Storage](#-data-storage)
- [Browser Compatibility](#-browser-compatibility)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## ✨ Features

### Core Features
- 📚 **Multiple Subject/Work Management** - Track attendance for unlimited subjects, jobs, or projects
- 📅 **Interactive Calendar View** - Visual monthly calendar with color-coded attendance status
- 📊 **Real-time Statistics** - Instant calculation of attendance percentages and statistics
- 💾 **Auto-Save** - Automatic data backup every 30 seconds
- 🔄 **Backup & Restore** - Export and import data as JSON files
- 📱 **Responsive Design** - Works seamlessly on mobile, tablet, and desktop devices
- 🌐 **Offline-First** - Fully functional without internet connection

### Attendance Options
- ✅ **Present** - Mark full day attendance
- ❌ **Absent** - Mark absence
- ⏰ **Half Day** - Track partial attendance
- 🕐 **Overtime (OT)** - Log overtime hours with automatic day conversion
- 🌙 **Shift Management** - Track Morning, Afternoon, Night, and General shifts
- 🏖️ **Holiday** - Mark official holidays
- 📅 **Week Off** - Track weekly offs
- 📝 **Leave Types** - Privileged, Casual, Sick, Earn, and Other leaves
- 📌 **Notes** - Add custom notes to any date

### Advanced Features
- 🎯 **Percentage Tracking** - Automatic attendance percentage calculation
- 📈 **Detailed Analytics** - Comprehensive breakdown of all attendance types
- 🔍 **Smart Indicators** - Visual badges for shifts, overtime, notes, and special days
- 🎨 **Color-Coded Status** - Easy-to-understand visual representation
- ⚙️ **Subject Management** - Rename, reset data, or delete subjects
- 🔒 **Data Privacy** - All data stored locally on your device

## 📸 Screenshots

### Home Screen
The main dashboard displays all your subjects with attendance percentages at a glance.

### Calendar View
Interactive monthly calendar showing attendance status with color-coded dates and detailed information.

### Statistics Dashboard
Comprehensive statistics including present days, absents, half-days, overtime calculations, and leave breakdowns.

## 🚀 Installation

### Option 1: Direct Use (Recommended)
Simply visit [https://deceptiveneeraj.github.io/TimeTally/](https://deceptiveneeraj.github.io/TimeTally/) and start using the app immediately!

### Option 2: Local Installation

1. **Clone the repository:**
```bash
git clone https://github.com/deceptiveneeraj/TimeTally.git
cd TimeTally
```

2. **Open the application:**
   - Simply open `index.html` in your web browser
   - Or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

3. **Access the app:**
   - Open your browser and navigate to `http://localhost:8000`

### Option 3: Deploy Your Own
Deploy to GitHub Pages, Netlify, Vercel, or any static hosting service:
```bash
# Just upload the files to your hosting provider
# No build process required!
```

## 📖 Usage Guide

### Getting Started

1. **Add Your First Subject:**
   - Click the `+` button in the top-right corner
   - Enter subject name (e.g., "Mathematics", "ABC Company", "Project X")
   - Click "ADD"

2. **Mark Attendance:**
   - Click on any subject card to open its calendar
   - Click on a date to open the attendance menu
   - Select your attendance status:
     - **Present** - Full day attendance
     - **Absent** - Mark absence
     - **Half Day** - Partial attendance
     - **Over Time** - Log extra work hours
     - **Shift** - Choose your work shift
     - **More Options** - Access holidays, week-offs, and leaves

3. **Add Additional Information:**
   - **Overtime:** Click "Over Time" and enter hours (supports decimals like 1.5)
   - **Shift:** Select from Morning, Afternoon, Night, or General
   - **Holiday/Week Off:** Mark special days that don't count in percentage
   - **Leave:** Choose leave type (Privileged, Casual, Sick, etc.)
   - **Note:** Add custom notes for any date

4. **View Statistics:**
   - Calendar shows color-coded attendance
   - Bottom panel displays quick stats
   - Click "More Info" for detailed breakdown

### Managing Subjects

**Rename a Subject:**
- Click the three-dot menu (⋮) on any subject card
- Select "Rename"
- Enter new name

**Reset Subject Data:**
- Click the three-dot menu (⋮)
- Select "Reset Data"
- Confirm to clear all attendance (keeps subject name)

**Delete Subject:**
- Click the three-dot menu (⋮)
- Select "Delete Subject"
- Confirm to permanently remove subject and data

### Backup & Restore

**Export Data:**
1. Click menu icon (☰) on home screen
2. Select "Backup & Restore"
3. Click "Export Data"
4. Save the JSON file to your device

**Import Data:**
1. Click menu icon (☰)
2. Select "Backup & Restore"
3. Click "Import Data"
4. Select your backup JSON file
5. Confirm to restore data

## 🛠️ Technologies Used

- **HTML5** - Structure and semantic markup
- **CSS3** - Styling with custom properties and gradients
- **JavaScript (ES6+)** - Application logic and interactivity
- **Bootstrap 5.3.2** - Responsive framework and modal components
- **Font Awesome 6.4.0** - Icons and visual elements
- **LocalStorage API** - Client-side data persistence

## 📁 File Structure

```
TimeTally/
│
├── index.html          # Main HTML structure
├── style.css           # Custom styles and themes
├── script.js           # Application logic and functionality
├── README.md           # Documentation (this file)
│
├── assests/
│   ├── logo.png        # Application logo
│   └── favicon.png     # Browser favicon
│
└── .github/
    └── workflows/      # GitHub Pages deployment (if applicable)
```

## 🔑 Key Functionalities

### Data Management

**Auto-Save System:**
- Automatically saves every 30 seconds
- Prevents data loss
- Works completely offline

**Data Structure:**
```javascript
{
  subjects: [
    { name: "Mathematics", id: 1234567890 }
  ],
  attendanceData: {
    "1234567890": {
      "2024-10": {
        "15": {
          status: "present",
          shift: "M",
          overtime: 2,
          note: "Extra classes"
        }
      }
    }
  }
}
```

### Calculation Logic

**Attendance Percentage:**
```
Percentage = (Present Days + Half Days × 0.5) / Total Working Days × 100
```

**Overtime Conversion:**
- Every 8 hours = 1 day
- Example: 20 hours = 2 days + 4 hours

**Working Days Calculation:**
- Excludes: Holidays, Week-offs, Leaves
- Includes: Present, Absent, Half-days

## 💾 Data Storage

### LocalStorage
- **Key:** `attendanceAppData`
- **Format:** JSON
- **Size Limit:** Typically 5-10MB
- **Persistence:** Permanent (until cleared by user)

### Data Privacy
- ✅ All data stored locally on your device
- ✅ No server communication
- ✅ No user tracking
- ✅ No external data sharing
- ✅ Complete offline functionality

## 🌐 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Opera | 76+ | ✅ Full |
| Mobile Browsers | Recent | ✅ Full |

### Requirements
- Modern browser with JavaScript enabled
- LocalStorage support
- Minimum 1MB free storage

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch:**
```bash
git checkout -b feature/AmazingFeature
```

3. **Commit your changes:**
```bash
git commit -m 'Add some AmazingFeature'
```

4. **Push to the branch:**
```bash
git push origin feature/AmazingFeature
```

5. **Open a Pull Request**

### Feature Ideas
- [ ] Dark mode theme
- [ ] Multiple language support
- [ ] Export to PDF/Excel
- [ ] Attendance goals and reminders
- [ ] Statistics charts and graphs
- [ ] Salary calculation module
- [ ] Cloud sync option
- [ ] Mobile app version

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2024 DeceptiveNeeraj

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

## 📞 Contact

**Developer:** Neeraj Solanki

- GitHub: [@deceptiveneeraj](https://github.com/deceptiveneeraj)
- Project Link: [https://github.com/deceptiveneeraj/TimeTally](https://github.com/deceptiveneeraj/TimeTally)
- Live Demo: [https://deceptiveneeraj.github.io/TimeTally/](https://deceptiveneeraj.github.io/TimeTally/)

## 🙏 Acknowledgments

- Bootstrap team for the excellent CSS framework
- Font Awesome for the comprehensive icon library
- All contributors and users who provide feedback

## 🐛 Known Issues & Limitations

- LocalStorage has a size limit (~5-10MB depending on browser)
- Data is device-specific (not synced across devices without manual export/import)
- Clearing browser data will delete all attendance records
- No password protection for data

## 📝 Changelog

### Version 1.0 (Current)
- ✅ Initial release
- ✅ Multiple subject management
- ✅ Calendar view with attendance marking
- ✅ Shift and overtime tracking
- ✅ Leave management system
- ✅ Notes functionality
- ✅ Backup and restore features
- ✅ Auto-save system
- ✅ Detailed statistics

---

**⭐ If you find this project helpful, please consider giving it a star on GitHub!**

Made with ❤️ by DeceptiveNeeraj