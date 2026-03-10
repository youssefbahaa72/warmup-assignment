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
            let parts = line.split(',');
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
    // TODO: Implement this function
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
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
    // TODO: Implement this function
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
    // TODO: Implement this function
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
