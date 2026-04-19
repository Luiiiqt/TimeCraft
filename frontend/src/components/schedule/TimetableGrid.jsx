import React from 'react'
import ScheduleSlot from './ScheduleSlot'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TIMESLOTS = [
  { slot: 1, label: '7:30 AM – 9:00 AM',    display: '7:30 – 9:00 AM',      startTime: '07:30' },
  { slot: 2, label: '9:00 AM – 10:30 AM',   display: '9:00 – 10:30 AM',     startTime: '09:00' },
  { slot: 3, label: '10:30 AM – 12:00 PM',  display: '10:30 AM – 12:00 PM', startTime: '10:30' },
  { slot: 4, label: '12:00 PM – 1:30 PM',   display: '12:00 – 1:30 PM',     startTime: '12:00' },
  { slot: 5, label: '1:30 PM – 3:00 PM',    display: '1:30 – 3:00 PM',      startTime: '13:30' },
  { slot: 6, label: '3:00 PM – 4:30 PM',    display: '3:00 – 4:30 PM',      startTime: '15:00' },
  { slot: 7, label: '4:30 PM – 6:00 PM',    display: '4:30 – 6:00 PM',      startTime: '16:30' },
]

/**
 * TimetableGrid
 *
 * @param {Array}    schedules  - list of ScheduleResponse objects from the API
 * @param {Function} onSlotClick - called with a schedule entry when clicked
 * @param {boolean}  loading    - shows skeleton state when true
 */
export default function TimetableGrid({ schedules = [], onSlotClick, loading = false }) {
  // Build a lookup map: "DAY-SLOT" -> schedule entry
  const slotMap = {}
  schedules.forEach(entry => {
    if (entry.day1 && entry.startTime1) {
      slotMap[`${entry.day1.toUpperCase()}-${entry.startTime1}`] = entry
    }
    if (entry.day2 && entry.startTime2) {
      slotMap[`${entry.day2.toUpperCase()}-${entry.startTime2}`] = entry
    }
  })

  return (
    <div style={styles.wrapper}>
      <div style={styles.grid}>
        {/* Top-left empty corner */}
        <div style={styles.cornerCell} />

        {/* Day headers */}
        {DAYS.map(day => (
          <div key={day} style={styles.dayHeader}>
            <span style={styles.dayFull}>{day}</span>
            <span style={styles.dayShort}>{day.slice(0, 3)}</span>
          </div>
        ))}

        {/* Time rows */}
        {TIMESLOTS.map(({ slot, label, display, startTime }) => (
          <React.Fragment key={slot}>
            {/* Time label */}
            <div key={`time-${slot}`} style={styles.timeCell}>
              <span style={styles.timeText}>{display}</span>
              <span style={styles.slotNum}>S{slot}</span>
            </div>

            {/* Cells for each day */}
            {DAYS.map(day => {
              const dayUpper = day.toUpperCase()
              const entry = slotMap[`${dayUpper}-${startTime}`]

              return (
                <div key={`${day}-${slot}`} style={styles.cell}>
                  {loading ? (
                    <div style={styles.skeleton} />
                  ) : entry ? (
                    <ScheduleSlot
                      schedule={entry}
                      onClick={() => onSlotClick?.(entry)}
                    />
                  ) : (
                    <div style={styles.empty} />
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #E0EAE0",
    background: "#fff",
    fontFamily: "'DM Sans', sans-serif",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "90px repeat(6, 1fr)",
    minWidth: "820px",
  },
  cornerCell: {
    background: "#F4FAF6",
    borderBottom: "1px solid #E0EAE0",
    borderRight: "1px solid #E0EAE0",
  },
  dayHeader: {
    padding: "12px 8px",
    textAlign: "center",
    background: "#F4FAF6",
    borderBottom: "1px solid #E0EAE0",
    borderRight: "1px solid #E8EEE8",
  },
  dayFull: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: "#3B6D3B",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    fontFamily: "'DM Sans', sans-serif",
  },
  dayShort: {
    display: "none",
    fontSize: "11px",
    fontWeight: "700",
    color: "#3B6D3B",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    fontFamily: "'DM Sans', sans-serif",
  },
  timeCell: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
    padding: "8px 10px",
    borderBottom: "1px solid #EEF4EE",
    borderRight: "1px solid #E0EAE0",
    minHeight: "80px",
    gap: "3px",
    background: "#FAFCFA",
  },
  timeText: {
    fontSize: "10px",
    color: "#7AAE7A",
    textAlign: "right",
    letterSpacing: "0.2px",
    fontFamily: "'DM Sans', sans-serif",
  },
  slotNum: {
    fontSize: "9px",
    color: "#AAC8AA",
    textAlign: "right",
    letterSpacing: "0.3px",
    fontFamily: "'DM Sans', sans-serif",
  },
  cell: {
    borderBottom: "1px solid #EEF4EE",
    borderRight: "1px solid #EEF4EE",
    padding: "4px",
    minHeight: "80px",
  },
  empty: {
    height: "100%",
    minHeight: "72px",
    borderRadius: "6px",
    background: "rgba(52,196,124,0.02)",
  },
  skeleton: {
    height: "72px",
    borderRadius: "6px",
    background: "linear-gradient(90deg, #F4FAF6 25%, #E8F5EC 50%, #F4FAF6 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  },
};