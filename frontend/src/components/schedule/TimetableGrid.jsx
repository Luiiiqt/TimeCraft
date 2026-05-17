import React from 'react'
import ScheduleSlot from './ScheduleSlot'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function toMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function TimetableGrid({ schedules = [], onSlotClick, loading = false }) {

  const daySlotMap = {};
  DAYS.forEach(d => { daySlotMap[d] = new Map(); });

  schedules.forEach(entry => {
    const day1 = entry.day1?.toUpperCase();
    const day2 = entry.day2?.toUpperCase();
    // Use actual end times per session for correct row keying
    const end1 = entry.endTime1?.substring(0, 5);
    const end2 = entry.endTime2?.substring(0, 5);
    const isOnline = entry.online === true || entry.isOnline === true || false;

    const sessionType = entry.sessionType;

    // For with-lab subjects: the grid receives both a LECTURE row and a LAB row
    // for the same subject. Each row already has its own ts1+ts2 pair.
    // We render each row on its own two days — no special merging needed.
    // The LECTURE row shows on its 2 days, the LAB row shows on its 2 days.

    const toRender = [];

    if (isOnline && day1 === 'SATURDAY' && day2 === 'SATURDAY') {
      // Rule 10: fully online minor — one card on Saturday
      if (entry.startTime1) {
        toRender.push({
          day: 'SATURDAY',
          start: entry.startTime1.substring(0, 5),
          end: entry.endTime1?.substring(0, 5),
          session: '1',
          onlineOnly: true
        });
      }
    } else if (isOnline && day1 === 'SATURDAY') {
      // Rule 9: Saturday online card + weekday physical card (physical is NOT online)
      if (entry.startTime1) {
        toRender.push({
          day: 'SATURDAY',
          start: entry.startTime1.substring(0, 5),
          end: entry.endTime1?.substring(0, 5),
          session: '1',
          onlineOnly: true
        });
      }
      if (day2 && entry.startTime2) {
        toRender.push({
          day: day2,
          start: entry.startTime2.substring(0, 5),
          end: entry.endTime2?.substring(0, 5),
          session: '2',
          overrideOnline: false
        });
      }
    } else if (isOnline && day2 === 'SATURDAY') {
      // ts2 is Saturday — only show ts1 weekday physical session
      if (day1 && entry.startTime1) {
        toRender.push({
          day: day1,
          start: entry.startTime1.substring(0, 5),
          end: entry.endTime1?.substring(0, 5),
          session: '1'
        });
      }
    } else {
      // Normal: render both days, but respect per-session online flags
      const ts1Online = entry.isOnlineTs1 === true || entry.onlineTs1 === true;
      const ts2Online = entry.isOnlineTs2 === true || entry.onlineTs2 === true;
      if (day1 && entry.startTime1) {
        toRender.push({
          day: day1,
          start: entry.startTime1.substring(0, 5),
          end: entry.endTime1?.substring(0, 5),
          session: '1',
          overrideOnline: ts1Online
        });
      }
      if (day2 && entry.startTime2) {
        toRender.push({
          day: day2,
          start: entry.startTime2.substring(0, 5),
          end: entry.endTime2?.substring(0, 5),
          session: '2',
          overrideOnline: ts2Online
        });
      }
    }

    toRender.forEach(({ day, start, end, session, onlineOnly, overrideOnline }) => {
      if (!day || !start || !end || !DAYS.includes(day)) return;
      // Key by "start|end" so different durations at same start get separate rows
      const rowKey = `${start}|${end}`;
      if (!daySlotMap[day].has(rowKey)) {
        daySlotMap[day].set(rowKey, { startTime: start, endTime: end, entries: [] });
      }
      const slot = daySlotMap[day].get(rowKey);      // Deduplicate: same schedule id + same session
      const already = slot.entries.some(e => e.id === entry.id && e._session === session && e.sessionType === entry.sessionType);
      if (!already) slot.entries.push({
        ...entry,
        _session: session,
        isOnline: overrideOnline !== undefined ? overrideOnline : (entry.online ?? entry.isOnline ?? false),
        online: overrideOnline !== undefined ? overrideOnline : (entry.online ?? entry.isOnline ?? false),
      });
    });
  });

  // Collect all unique startTimes → grid rows
  const allRowKeys = new Set();
  DAYS.forEach(d => daySlotMap[d].forEach((_, key) => allRowKeys.add(key)));
  const TIMEROWS = Array.from(allRowKeys).sort(); // sorts by "HH:MM|HH:MM" which is correct

  const rowEndTime = {};
  const rowStartTime = {};
  const rowMinEnd = {};
  TIMEROWS.forEach(key => {
    const [start, end] = key.split('|');
    rowStartTime[key] = start;
    rowEndTime[key] = end;
    rowMinEnd[key] = end;
  });

  return (
    <div style={styles.wrapper}>
      <div style={styles.grid}>
        <div style={styles.cornerCell} />
        {DAY_LABELS.map(day => (
          <div key={day} style={styles.dayHeader}>
            <span style={styles.dayFull}>{day}</span>
          </div>
        ))}

        {TIMEROWS.map(rowKey => {
          const startTime = rowStartTime[rowKey];
          const endTime = rowEndTime[rowKey];
          const dur = toMinutes(endTime) - toMinutes(startTime);
          const rowHeight = dur <= 60 ? '90px' : dur <= 90 ? '110px' : '130px';

          return (
            <React.Fragment key={rowKey}>
              <div style={{ ...styles.timeCell, minHeight: rowHeight }}>
                <span style={styles.timeStart}>{fmt(startTime)}</span>
                <span style={styles.timeSep}>–</span>
                <span style={styles.timeEnd}>
                  {rowMinEnd[startTime] !== endTime
                    ? `${fmt(rowMinEnd[startTime])} / ${fmt(endTime)}`
                    : fmt(endTime)}
                </span>
                {(() => {
                  const durs = new Set();
                  DAYS.forEach(d => {
                    const slot = daySlotMap[d].get(rowKey);
                    if (slot) slot.entries.forEach(e => {
                      const eEnd = e._session === '1' ? e.endTime1 : e.endTime2;
                      if (eEnd) durs.add(toMinutes(eEnd.substring(0, 5)) - toMinutes(startTime));
                    });
                  });
                  return Array.from(durs).sort().map(d => (
                    <span key={d} style={{
                      fontSize: '8px', fontWeight: '700', marginTop: '2px',
                      background: d <= 60 ? '#FEF3C7' : '#E8F5E9',
                      color: d <= 60 ? '#92400E' : '#2D6A4F',
                      borderRadius: '4px', padding: '1px 5px',
                    }}>{d} min</span>
                  ));
                })()}
              </div>
              {DAYS.map(day => {
                const slot = daySlotMap[day].get(rowKey);
                const entries = slot?.entries ?? [];
                return (
                  <div key={`${day}|${rowKey}`} style={{ ...styles.cell, minHeight: rowHeight }}>
                    {loading ? (
                      <div style={{ ...styles.skeleton, height: '80px' }} />
                    ) : entries.length > 0 ? (
                      entries.map((entry, i) => (
                        <ScheduleSlot
                          key={`${entry.id}-${entry._session}-${i}`}
                          schedule={{
                            ...entry,
                            _displayEnd: entry._session === '1' ? entry.endTime1 : entry.endTime2,
                          }}
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
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  empty: { height: '100%', minHeight: '60px', borderRadius: '6px' },
  skeleton: {
    borderRadius: '6px',
    background: 'linear-gradient(90deg, #F4FAF6 25%, #E8F5EC 50%, #F4FAF6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  },
};