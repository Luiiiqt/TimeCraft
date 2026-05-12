import React from 'react'
import ScheduleSlot from './ScheduleSlot'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function getDuration(start, end) {
  if (!start || !end) return 90;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// Find which row (by startTime) this time belongs to
function findRowKey(startTime, timeblocks) {
  const match = timeblocks.find(tb => tb.startTime === startTime);
  return match ? match.startTime : startTime;
}

export default function TimetableGrid({ schedules = [], onSlotClick, loading = false }) {

  // Build rows: one per unique startTime, keep the LONGEST endTime for that start
  const timeRowMap = new Map();
  schedules.forEach(s => {
    ['1', '2'].forEach(n => {
      const start = s[`startTime${n}`]?.substring(0, 5);
      const end = s[`endTime${n}`]?.substring(0, 5);
      if (!start) return;
      if (!timeRowMap.has(start)) {
        timeRowMap.set(start, { startTime: start, endTime: end ?? '' });
      } else if (end && end > timeRowMap.get(start).endTime) {
        timeRowMap.get(start).endTime = end;
      }
    });
  });

  const TIMEBLOCKS = Array.from(timeRowMap.values())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Build slotMap: key = DAY|startTime, deduplicate by id+sessionType
  const slotMap = {};
  schedules.forEach(entry => {
    ['1', '2'].forEach(n => {
      const day = entry[`day${n}`];
      const start = entry[`startTime${n}`]?.substring(0, 5);
      if (!day || !start) return;
      const rowKey = findRowKey(start, TIMEBLOCKS);
      const k = `${day.toUpperCase()}|${rowKey}`;
      if (!slotMap[k]) slotMap[k] = [];
      const exists = slotMap[k].some(e => e.id === entry.id && e.sessionType === entry.sessionType);
      if (!exists) slotMap[k].push(entry);
    });
  });

  return (
    <div style={styles.wrapper}>
      <div style={styles.grid}>
        <div style={styles.cornerCell} />
        {DAYS.map(day => (
          <div key={day} style={styles.dayHeader}>
            <span style={styles.dayFull}>{day}</span>
          </div>
        ))}

        {TIMEBLOCKS.map(({ startTime, endTime }) => {
          const dur = getDuration(startTime, endTime);
          const rowHeight = dur <= 60 ? '80px' : '110px';

          return (
            <React.Fragment key={startTime}>
              <div style={{ ...styles.timeCell, minHeight: rowHeight }}>
                <span style={styles.timeStart}>{fmt(startTime)}</span>
                <span style={styles.timeSep}>—</span>
                <span style={styles.timeEnd}>{fmt(endTime)}</span>
                <span style={{
                  fontSize: '8px', fontWeight: '700', marginTop: '2px',
                  background: dur <= 60 ? '#FEF3C7' : '#E8F5E9',
                  color: dur <= 60 ? '#92400E' : '#2D6A4F',
                  borderRadius: '4px', padding: '1px 5px',
                }}>
                  {dur} min
                </span>
              </div>

              {DAYS.map(day => {
                const entries = slotMap[`${day.toUpperCase()}|${startTime}`] ?? [];
                return (
                  <div key={`${day}|${startTime}`} style={{ ...styles.cell, minHeight: rowHeight }}>
                    {loading ? (
                      <div style={{ ...styles.skeleton, height: '90px' }} />
                    ) : entries.length > 0 ? (
                      entries.map((entry, i) => (
                        <ScheduleSlot
                          key={`${entry.id}-${entry.sessionType ?? i}`}
                          schedule={entry}
                          onClick={() => onSlotClick?.(entry)}
                        />
                      ))
                    ) : (
                      <div style={styles.empty} />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid #E0EAE0',
    background: '#fff',
    fontFamily: "'DM Sans', sans-serif",
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '110px repeat(6, 1fr)',
    minWidth: '860px',
  },
  cornerCell: {
    background: '#F4FAF6',
    borderBottom: '2px solid #D0E8D0',
    borderRight: '2px solid #D0E8D0',
  },
  dayHeader: {
    padding: '14px 8px',
    textAlign: 'center',
    background: '#F4FAF6',
    borderBottom: '2px solid #D0E8D0',
    borderRight: '1px solid #E8EEE8',
  },
  dayFull: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#3B6D3B',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  timeCell: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: '6px 10px',
    borderBottom: '1px solid #E0EAE0',
    borderRight: '2px solid #D0E8D0',
    background: '#F7FBF7',
    gap: '2px',
  },
  timeStart: { fontSize: '10px', fontWeight: '700', color: '#2D5A2D', textAlign: 'right', whiteSpace: 'nowrap' },
  timeSep: { fontSize: '9px', color: '#C8DEC8', textAlign: 'right' },
  timeEnd: { fontSize: '10px', fontWeight: '700', color: '#2D5A2D', textAlign: 'right', whiteSpace: 'nowrap' },
  cell: {
    borderBottom: '1px solid #EEF4EE',
    borderRight: '1px solid #EEF4EE',
    padding: '5px',
  },
  empty: { height: '100%', minHeight: '60px', borderRadius: '6px' },
  skeleton: {
    borderRadius: '6px',
    background: 'linear-gradient(90deg, #F4FAF6 25%, #E8F5EC 50%, #F4FAF6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  },
};