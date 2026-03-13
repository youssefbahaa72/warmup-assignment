const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // Parse start time
    const startMatch = startTime.match(/(\d{1,2}):(\d{2}):(\d{2})\s(am|pm)/i);
    let startHours = parseInt(startMatch[1]);
    const startMinutes = parseInt(startMatch[2]);
    const startSeconds = parseInt(startMatch[3]);
    const startPeriod = startMatch[4].toLowerCase();

    // Parse end time
    const endMatch = endTime.match(/(\d{1,2}):(\d{2}):(\d{2})\s(am|pm)/i);
    let endHours = parseInt(endMatch[1]);
    const endMinutes = parseInt(endMatch[2]);
    const endSeconds = parseInt(endMatch[3]);
    const endPeriod = endMatch[4].toLowerCase();

    // Convert to 24-hour format
    if (startPeriod === "am" && startHours === 12) {
        startHours = 0;
    } else if (startPeriod === "pm" && startHours !== 12) {
        startHours += 12;
    }

    if (endPeriod === "am" && endHours === 12) {
        endHours = 0;
    } else if (endPeriod === "pm" && endHours !== 12) {
        endHours += 12;
    }

    
    // Convert to total seconds
    let startTotalSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;
    let endTotalSeconds = endHours * 3600 + endMinutes * 60 + endSeconds;

  
    // Handle overnight shifts
    if (endTotalSeconds < startTotalSeconds) {
        endTotalSeconds += 24 * 3600;
    }

    // Calculate duration
    const durationSeconds = endTotalSeconds - startTotalSeconds;

    // Convert back to h:mm:ss format
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;

    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // Parse start time
    const startMatch = startTime.match(/(\d{1,2}):(\d{2}):(\d{2})\s(am|pm)/i);
    let startHours = parseInt(startMatch[1]);
    const startMinutes = parseInt(startMatch[2]);
    const startSeconds = parseInt(startMatch[3]);
    const startPeriod = startMatch[4].toLowerCase();

   
    // Parse end time
    const endMatch = endTime.match(/(\d{1,2}):(\d{2}):(\d{2})\s(am|pm)/i);
    let endHours = parseInt(endMatch[1]);
    const endMinutes = parseInt(endMatch[2]);
    const endSeconds = parseInt(endMatch[3]);
    const endPeriod = endMatch[4].toLowerCase();

    
    // Convert to 24-hour format
    if (startPeriod === "am" && startHours === 12) {
        startHours = 0;
    } else if (startPeriod === "pm" && startHours !== 12) {
        startHours += 12;
    }

    if (endPeriod === "am" && endHours === 12) {
        endHours = 0;
    } else if (endPeriod === "pm" && endHours !== 12) {
        endHours += 12;
    }

    // Convert to total seconds
    let startTotalSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;
    let endTotalSeconds = endHours * 3600 + endMinutes * 60 + endSeconds;

    // Handle overnight shifts
    if (endTotalSeconds < startTotalSeconds) {
        endTotalSeconds += 24 * 3600;
    }

    // Business hours are 8 AM (08:00:00) to 10 PM (22:00:00)
    const businessStart = 8 * 3600;
    const businessEnd = 22 * 3600;

    let idleSeconds = 0;

    // Check if start time is before business start
    if (startTotalSeconds < businessStart) {
        const idleEnd = Math.min(endTotalSeconds, businessStart);
        idleSeconds += idleEnd - startTotalSeconds;
    }

    // Check if end time is after business end
    if (endTotalSeconds > businessEnd) {
        const idleStart = Math.max(startTotalSeconds, businessEnd);
        idleSeconds += endTotalSeconds - idleStart;
    }

    // Convert back to h:mm:ss format
    const hours = Math.floor(idleSeconds / 3600);
    const minutes = Math.floor((idleSeconds % 3600) / 60);
    const seconds = idleSeconds % 60;

    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    // Parse shift duration
    const durationParts = shiftDuration.split(":");
    const durationHours = parseInt(durationParts[0]);
    const durationMinutes = parseInt(durationParts[1]);
    const durationSeconds = parseInt(durationParts[2]);
    
    // Parse idle time
    const idleParts = idleTime.split(":");
    const idleHours = parseInt(idleParts[0]);
    const idleMinutes = parseInt(idleParts[1]);
    const idleSeconds = parseInt(idleParts[2]);
    
    // Convert to total seconds
    let durationTotalSeconds = durationHours * 3600 + durationMinutes * 60 + durationSeconds;
    let idleTotalSeconds = idleHours * 3600 + idleMinutes * 60 + idleSeconds;
    
    // Calculate active seconds
    const activeSeconds = durationTotalSeconds - idleTotalSeconds;
    
    // Convert back to h:mm:ss format
    const hours = Math.floor(activeSeconds / 3600);
    const minutes = Math.floor((activeSeconds % 3600) / 60);
    const seconds = activeSeconds % 60;
    
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // Parse the date
    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

    // Parse active time
    const timeParts = activeTime.split(":");
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const seconds = parseInt(timeParts[2]);

    // Convert active time to seconds
    const activeSeconds = hours * 3600 + minutes * 60 + seconds;

    // Determine the quota based on Eid period
    // Eid period: April 10-30, 2025
    let quotaSeconds;
    if (month === 4 && day >= 10 && day <= 30) {
        // During Eid: 6 hours
        quotaSeconds = 6 * 3600;
    } else {
        // Normal day: 8 hours 24 minutes
        quotaSeconds = 8 * 3600 + 24 * 60;
    }

    return activeSeconds >= quotaSeconds;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // Read the file
    const fileData = fs.readFileSync(textFile, { encoding: 'utf8' });
    const lines = fileData.split("\n");
    
    // Check if record already exists
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(",");
        if (parts[0] === shiftObj.driverID && parts[2] === shiftObj.date) {
            // Record already exists
            return {};
        }
    }
    
    // Calculate required fields
    const shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    const idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    const activeTime = getActiveTime(shiftDuration, idleTime);
    const quotaMet = metQuota(shiftObj.date, activeTime);
    
    // Create the record object
    const record = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: quotaMet,
        hasBonus: false
    };
    
    // Prepare the CSV line
    const csvLine = `${record.driverID},${record.driverName},${record.date},${record.startTime},${record.endTime},${record.shiftDuration},${record.idleTime},${record.activeTime},${record.metQuota},${record.hasBonus}`;
    
    // Append to file
    fs.appendFileSync(textFile, "\n" + csvLine);
    
    return record;
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
    // Read the file
    const fileData = fs.readFileSync(textFile, { encoding: 'utf8' });
    const lines = fileData.split("\n");
    
    // Find and update the matching record
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(",");
        if (parts[0] === driverID && parts[2] === date) {
            // Update the HasBonus field (last column)
            parts[9] = newValue.toString();
            lines[i] = parts.join(",");
            break;
        }
    }
    
    // Write the file back
    fs.writeFileSync(textFile, lines.join("\n"));
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // Read the file
    const fileData = fs.readFileSync(textFile, { encoding: 'utf8' });
    const lines = fileData.split("\n");
    
    // Normalize month to two-digit format
    const normalizedMonth = month.padStart(2, "0");
    
    // Check if driver exists and count bonuses
    let driverFound = false;
    let bonusCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(",");
        if (parts[0] === driverID) {
            driverFound = true;
            
            // Extract month from date (yyyy-mm-dd)
            const date = parts[2];
            const dateMonth = date.split("-")[1];
            
            // Check if this record is in the requested month and has bonus
            if (dateMonth === normalizedMonth && parts[9].toLowerCase() === "true") {
                bonusCount++;
            }
        }
    }
    
    // Return -1 if driver not found, otherwise return bonus count
    return driverFound ? bonusCount : -1;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // Read the file
    const fileData = fs.readFileSync(textFile, { encoding: 'utf8' });
    const lines = fileData.split("\n");
    
    // Normalize month to two-digit format
    const normalizedMonth = month.toString().padStart(2, "0");
    
    // Sum total active hours
    let totalSeconds = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(",");
        if (parts[0] === driverID) {
            // Extract month from date (yyyy-mm-dd)
            const date = parts[2];
            const dateMonth = date.split("-")[1];
            
            // Check if this record is in the requested month
            if (dateMonth === normalizedMonth) {
                // Parse activeTime (h:mm:ss format)
                const activeTime = parts[7];
                const timeParts = activeTime.split(":");
                const hours = parseInt(timeParts[0]);
                const minutes = parseInt(timeParts[1]);
                const seconds = parseInt(timeParts[2]);
                
                totalSeconds += hours * 3600 + minutes * 60 + seconds;
            }
        }
    }
    
    // Convert back to hhh:mm:ss format
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
    // Read the shifts file
    const shiftData = fs.readFileSync(textFile, { encoding: 'utf8' });
    const shiftLines = shiftData.split("\n");
    
    // Normalize month to two-digit format
    const normalizedMonth = month.toString().padStart(2, "0");
    
    // Calculate total required hours based on shifts worked
    let totalSeconds = 0;
    
    for (let i = 1; i < shiftLines.length; i++) {
        const line = shiftLines[i].trim();
        if (!line) continue;
        
        const parts = line.split(",");
        if (parts[0] === driverID) {
            // Extract month and day from date
            const date = parts[2];
            const dateMonth = date.split("-")[1];
            const dateDay = parseInt(date.split("-")[2]);
            
            // Check if this record is in the requested month
            if (dateMonth === normalizedMonth) {
                let daySeconds;
                
                // Determine quota based on Eid period (Apr 10-30, 2025)
                if (dateMonth === "04" && dateDay >= 10 && dateDay <= 30) {
                    // During Eid: 6 hours
                    daySeconds = 6 * 3600;
                } else {
                    // Normal day: 8 hours 24 minutes
                    daySeconds = 8 * 3600 + 24 * 60;
                }
                
                totalSeconds += daySeconds;
            }
        }
    }
    
    // Subtract bonus hours (2 hours per bonus)
    totalSeconds -= bonusCount * 2 * 3600;
    
    // Convert to hhh:mm:ss format
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
    // Read the driver rates file
    const fileData = fs.readFileSync(rateFile, { encoding: 'utf8' });
    const lines = fileData.split("\n");
    
    // Find the driver's record
    let driverBasePay = 0;
    let driverTier = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(",");
        if (parts[0] === driverID) {
            driverBasePay = parseInt(parts[2]);
            driverTier = parseInt(parts[3]);
            break;
        }
    }
    
    // Parse actual and required hours to seconds
    const actualParts = actualHours.split(":");
    const actualSeconds = parseInt(actualParts[0]) * 3600 + parseInt(actualParts[1]) * 60 + parseInt(actualParts[2]);
    
    const requiredParts = requiredHours.split(":");
    const requiredSeconds = parseInt(requiredParts[0]) * 3600 + parseInt(requiredParts[1]) * 60 + parseInt(requiredParts[2]);
    
    // Calculate missing hours
    let missingHours = (requiredSeconds - actualSeconds) / 3600;
    if (missingHours < 0) {
        missingHours = 0; // No deduction if actual >= required
    }
    
    // Determine tier allowance
    let tierAllowance = 0;
    if (driverTier === 1) {
        tierAllowance = 50;
    } else if (driverTier === 2) {
        tierAllowance = 20;
    } else if (driverTier === 3) {
        tierAllowance = 10;
    } else if (driverTier === 4) {
        tierAllowance = 3;
    }
    
    // Calculate net pay
    let netPay = driverBasePay;
    if (missingHours > tierAllowance) {
        const deductionRatePerHour = Math.floor(driverBasePay / 185);
        netPay = driverBasePay - deductionRatePerHour;
    }
    
    return netPay;
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