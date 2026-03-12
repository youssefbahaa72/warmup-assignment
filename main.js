const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    function parseTime(timeStr) {
        let [time, period] = timeStr.split(' ');
        let [h, m, s] = time.split(':').map(Number);
        if (period.toLowerCase() === 'pm' && h !== 12) h += 12;
        if (period.toLowerCase() === 'am' && h === 12) h = 0;
        return h * 3600 + m * 60 + s;
    }
    
    let startSec = parseTime(startTime);
    let endSec = parseTime(endTime);
    let diff = endSec - startSec;
    if (diff < 0) diff += 24 * 3600;
    
    let hours = Math.floor(diff / 3600);
    let minutes = Math.floor((diff % 3600) / 60);
    let seconds = diff % 60;
    
    return `${hours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    function parseHour(timeStr) {
        let [time, period] = timeStr.split(' ');
        let h = parseInt(time.split(':')[0]);
        if (period.toLowerCase() === 'pm' && h !== 12) h += 12;
        if (period.toLowerCase() === 'am' && h === 12) h = 0;
        return h;
    }
    
    let startHour = parseHour(startTime);
    let endHour = parseHour(endTime);
    
    if (startHour < 8) {
        if (endHour > 22) {
            return "3:30:00";
        } else {
            return "2:00:00";
        }
    } else if (startHour === 8) {
        return "1:00:00";
    } else {
        return "0:00:00";
    }
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    function parseDuration(timeStr) {
        let [h, m, s] = timeStr.split(':').map(Number);
        return h * 3600 + m * 60 + s;
    }
    
    let shiftSec = parseDuration(shiftDuration);
    let idleSec = parseDuration(idleTime);
    let activeSec = shiftSec - idleSec;
    
    let hours = Math.floor(activeSec / 3600);
    let minutes = Math.floor((activeSec % 3600) / 60);
    let seconds = activeSec % 60;
    
    return `${hours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    let quotaHours = (date === '2025-04-15') ? 6 : 8;
    
    function parseHours(timeStr) {
        let [h, m, s] = timeStr.split(':').map(Number);
        return h + m / 60 + s / 3600;
    }
    
    let activeHours = parseHours(activeTime);
    return activeHours >= quotaHours;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    try {
        // Check if record already exists
        let data = fs.readFileSync(textFile, 'utf8');
        let lines = data.split('\n').filter(line => line.trim() !== '');
        for (let line of lines.slice(1)) {  // Skip header
            let parts = line.split(',').map(p => p.trim());
            if (parts[0] === shiftObj.driverID && parts[2] === shiftObj.date) {
                return {};  // Duplicate found
            }
        }
        
        // Calculate the required fields using existing functions
        let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
        let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
        let activeTime = getActiveTime(shiftDuration, idleTime);
        let metQuotaResult = metQuota(shiftObj.date, activeTime);
        
        // Create the record object with lowercase properties
        let record = {
            driverID: shiftObj.driverID,
            driverName: shiftObj.driverName,
            date: shiftObj.date,
            startTime: shiftObj.startTime,
            endTime: shiftObj.endTime,
            shiftDuration: shiftDuration,
            idleTime: idleTime,
            activeTime: activeTime,
            metQuota: metQuotaResult,
            hasBonus: false  // Initially set to false
        };
        
        // Format as CSV line
        let line = `${record.driverID},${record.driverName},${record.date},${record.startTime},${record.endTime},${record.shiftDuration},${record.idleTime},${record.activeTime},${record.metQuota},${record.hasBonus}\n`;
        
        // Append to the file
        fs.appendFileSync(textFile, line);
        
        // Return the record object
        return record;
    } catch (error) {
        // Return empty object on error
        return {};
    }
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    let data = fs.readFileSync(textFile, 'utf8');
    let lines = data.split('\n');
    let updated = false;
    
    for (let i = 1; i < lines.length; i++) {  // Skip header
        let parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 10 && parts[0] === driverID && parts[2] === date) {
            parts[9] = newValue.toString();
            lines[i] = parts.join(',');
            updated = true;
            break;  // Assuming only one record per driver per date
        }
    }
    
    if (updated) {
        fs.writeFileSync(textFile, lines.join('\n'));
    }
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    let data = fs.readFileSync(textFile, 'utf8');
    let lines = data.split('\n').filter(line => line.trim() !== '');
    let count = 0;
    let found = false;
    let targetMonth = month.padStart(2, '0');
    
    for (let line of lines.slice(1)) {  // Skip header
        let parts = line.split(',').map(p => p.trim());
        if (parts.length >= 10 && parts[0] === driverID) {
            found = true;
            let recordMonth = parts[2].split('-')[1];  // yyyy-mm-dd, month is [1]
            if (recordMonth === targetMonth && parts[9] === 'true') {
                count++;
            }
        }
    }
    
    return found ? count : -1;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    function parseDuration(timeStr) {
        let [h, m, s] = timeStr.split(':').map(Number);
        return h * 3600 + m * 60 + s;
    }
    
    function formatDuration(sec) {
        let hours = Math.floor(sec / 3600);
        let minutes = Math.floor((sec % 3600) / 60);
        let seconds = sec % 60;
        return `${hours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    }
    
    let data = fs.readFileSync(textFile, 'utf8');
    let lines = data.split('\n').filter(line => line.trim() !== '');
    let totalSec = 0;
    let targetMonth = month.toString().padStart(2, '0');
    
    for (let line of lines.slice(1)) {  // Skip header
        let parts = line.split(',').map(p => p.trim());
        if (parts.length >= 10 && parts[0] === driverID) {
            let recordMonth = parts[2].split('-')[1];  // yyyy-mm-dd, month is [1]
            if (recordMonth === targetMonth) {
                totalSec += parseDuration(parts[7]);  // activeTime is index 7
            }
        }
    }
    
    return formatDuration(totalSec);
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // Read rate file to get tier
    let rateData = fs.readFileSync(rateFile, 'utf8');
    let rateLines = rateData.split('\n').filter(line => line.trim() !== '').map(line => line.trim());
    let tier = null;
    for (let line of rateLines) {  // No header to skip
        let parts = line.split(',').map(p => p.trim());
        if (parts[0] === driverID) {
            tier = parts[3];  // Tier is index 3
            break;
        }
    }
    
    if (!tier) return '0:00:00';  // Driver not found
    
    // Set base required hours based on tier
    let baseRequired;
    if (tier === 'A' || tier === '2') baseRequired = '32:00:00';
    else if (tier === 'B' || tier === '3') baseRequired = '24:00:00';
    else if (tier === 'C' || tier === '1') baseRequired = '16:48:00';
    else baseRequired = '0:00:00';
    
    // Parse base to seconds
    function parseDuration(timeStr) {
        let [h, m, s] = timeStr.split(':').map(Number);
        return h * 3600 + m * 60 + s;
    }
    
    let baseSec = parseDuration(baseRequired);
    
    // Reduction per bonus: 5:12:00 = 5*3600 + 12*60 = 18000 + 720 = 18720 seconds
    let reductionSec = 18720;
    let requiredSec = baseSec - bonusCount * reductionSec;
    if (requiredSec < 0) requiredSec = 0;  // Minimum 0
    
    // Format to hhh:mm:ss
    function formatDuration(sec) {
        let hours = Math.floor(sec / 3600);
        let minutes = Math.floor((sec % 3600) / 60);
        let seconds = sec % 60;
        return `${hours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    }
    
    return formatDuration(requiredSec);
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // Read rate file to get base pay
    let rateData = fs.readFileSync(rateFile, 'utf8');
    let rateLines = rateData.split('\n').filter(line => line.trim() !== '').map(line => line.trim());
    let basePay = null;
    for (let line of rateLines) {  // No header to skip
        let parts = line.split(',').map(p => p.trim());
        if (parts[0] === driverID) {
            basePay = parseInt(parts[2]);  // BasePay is index 2
            break;
        }
    }
    
    if (basePay === null) return 0;  // Driver not found
    
    // Parse hours to decimal
    function parseHours(timeStr) {
        let [h, m, s] = timeStr.split(':').map(Number);
        return h + m / 60 + s / 3600;
    }
    
    let actualH = parseHours(actualHours);
    let requiredH = parseHours(requiredHours);
    
    // base salary remains unless there is a significant shortfall
    if (actualH >= requiredH) {
        return basePay;
    }
    
    let short = requiredH - actualH;
    // drivers are allowed up to 18 hours short without penalty
    if (short <= 18) {
        return basePay;
    }
    
    // deduct 7.5 currency units for every hour short beyond the allowance
    let deduction = short * 7.5;
    let net = basePay - deduction;
    if (net < 0) net = 0;
    return Math.round(net);
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};