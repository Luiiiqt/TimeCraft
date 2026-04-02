import React from 'react'
import ScheduleSlot from './ScheduleSlot'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TIMESLOTS = [
  { slot: 1, label: '7:30 – 9:00' },
  { slot: 2, label: '9:00 – 10:30' },
  { slot: 3, label: '10:30 – 12:00' },
  { slot: 4, label: '12:00 – 1:30' },
  { slot: 5, label: '1:30 – 3:00' },
  { slot: 6, label: '3:00 – 4:30' },
  { slot: 7, label: '4:30 – 6:00' },
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
    const key1 = `${entry.day1?.toUpperCase()}-${entry.timeslotId}`
    const key2 = `${entry.day2?.toUpperCase()}-${entry.timeslot2Id}`
    slotMap[key1] = entry
    slotMap[key2] = entry
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
        {TIMESLOTS.map(({ slot, label }) => (
          <React.Fragment key={slot}>
            {/* Time label */}
            <div key={`time-${slot}`} style={styles.timeCell}>
              <span style={styles.timeText}>{label}</span>
              <span style={styles.slotNum}>S{slot}</span>
            </div>

            {/* Cells for each day */}
            {DAYS.map(day => {
              const dayUpper = day.toUpperCase()
              // Find a schedule that has this day + slot
              const entry = schedules.find(
                s =>
                  (s.day1?.toUpperCase() === dayUpper && s.timeslotId === slot) ||
                  (s.day2?.toUpperCase() === dayUpper && s.timeslot2Id === slot)
              )

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
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: '#0f172a',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '90px repeat(6, 1fr)',
    minWidth: '820px',
  },
  cornerCell: {
    background: '#0f172a',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  dayHeader: {
    padding: '14px 8px',
    textAlign: 'center',
    background: '#0f172a',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    borderRight: '1px solid rgba(255,255,255,0.04)',
  },
  dayFull: {
    display: 'block',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  dayShort: {
    display: 'none',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  timeCell: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: '8px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    minHeight: '80px',
    gap: '3px',
  },
  timeText: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '10px',
    color: '#475569',
    textAlign: 'right',
    letterSpacing: '0.2px',
  },
  slotNum: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '9px',
    color: '#334155',
    textAlign: 'right',
    letterSpacing: '0.3px',
  },
  cell: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    borderRight: '1px solid rgba(255,255,255,0.04)',
    padding: '4px',
    minHeight: '80px',
  },
  empty: {
    height: '100%',
    minHeight: '72px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.01)',
  },
  skeleton: {
    height: '72px',
    borderRadius: '6px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  },
}