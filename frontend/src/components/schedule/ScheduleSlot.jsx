function toMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const CSS = `
  .tc-slot:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .tc-slot:active { transform: scale(0.98); }
`;

export default function ScheduleSlot({ schedule, onClick, compact = false }) {
  const {
    subjectCode, subjectName, teacherName, roomName,
    sessionType, subjectType, status, campusCode
  } = schedule;

  const slotDur = schedule._spanBands ? schedule._spanBands * 30 : null;

  const isOnline   = schedule.online ?? schedule.isOnline ?? false;
  const isLab      = sessionType === 'LABORATORY';
  const isConflict = status === 'CONFLICTED';
  const isDraft    = status === 'DRAFT';
  const isMajor    = subjectType === 'MAJOR';

  const accent = isConflict ? '#E24B4A'
    : isLab    ? '#185FA5'
    : isMajor  ? '#BA7517'
    :             '#1A6A2A';

  const bg = isConflict ? 'rgba(226,75,74,0.08)'
    : isLab    ? 'rgba(24,95,165,0.08)'
    : isMajor  ? 'rgba(186,117,23,0.08)'
    :             'rgba(26,106,42,0.07)';

  // ── Compact card (60 min slots or side-by-side overlap columns) ──
  if (compact) {
    return (
      <>
        <style>{CSS}</style>
        <button
          className="tc-slot"
          onClick={onClick}
          title={`${subjectName} — ${teacherName} — ${roomName}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2px',
            width: '100%',
            height: '100%',
            minHeight: '0',
            padding: '4px 7px',
            border: 'none',
            borderRadius: '5px',
            borderLeft: `3px solid ${accent}`,
            background: bg,
            opacity: isDraft ? 0.85 : 1,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'filter 0.15s, transform 0.12s',
            overflow: 'hidden',
            fontFamily: "'DM Sans', sans-serif",
            boxSizing: 'border-box',
          }}
        >
          {/* Row 1: subject code + name + badges */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            width: '100%', overflow: 'hidden',
          }}>
            <span style={{
              fontSize: '10px', fontWeight: '700', color: accent,
              letterSpacing: '0.3px', textTransform: 'uppercase',
              lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {subjectCode}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: '500', color: '#112A17',
              lineHeight: 1, overflow: 'hidden', whiteSpace: 'nowrap',
              textOverflow: 'ellipsis', flexGrow: 1,
            }}>
              {subjectName}
            </span>
            <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
              {slotDur && (
                <span style={{
                  fontSize: '8px', fontWeight: '600', padding: '1px 4px',
                  borderRadius: '3px',
                  background: slotDur <= 60 ? '#FEF3C7' : '#E8F5E9',
                  color: slotDur <= 60 ? '#92400E' : '#2D6A4F',
                }}>
                  {slotDur}m
                </span>
              )}
              {isLab && (
                <span style={{
                  fontSize: '8px', fontWeight: '600', padding: '1px 4px',
                  borderRadius: '3px', background: 'rgba(24,95,165,0.12)', color: '#185FA5',
                }}>LAB</span>
              )}
              {isOnline && (
                <span style={{
                  fontSize: '8px', fontWeight: '600', padding: '1px 4px',
                  borderRadius: '3px', background: 'rgba(99,60,180,0.12)', color: '#6330B4',
                }}>ONLINE</span>
              )}
              {isConflict && (
                <span style={{
                  fontSize: '8px', fontWeight: '600', padding: '1px 4px',
                  borderRadius: '3px', background: 'rgba(226,75,74,0.15)', color: '#E24B4A',
                }}>⚠</span>
              )}
            </div>
          </div>

          {/* Row 2: teacher name */}
          {teacherName && (
            <span style={{
              fontSize: '9px', color: '#7AAE7A', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              width: '100%',
            }}>
              · {teacherName}
            </span>
          )}

          {/* Row 3: room or online */}
          {isOnline ? (
            <span style={{ fontSize: '9px', color: '#6330B4', lineHeight: 1, whiteSpace: 'nowrap' }}>
              ◫ Online Class
            </span>
          ) : roomName ? (
            <span style={{
              fontSize: '9px', color: '#7AAE7A', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              width: '100%',
            }}>
              ◫ {roomName}{campusCode ? ` ${campusCode}` : ''}
            </span>
          ) : null}
        </button>
      </>
    );
  }

  // ── Full card (90 min slots) ──
  return (
    <>
      <style>{CSS}</style>
      <button
        className="tc-slot"
        onClick={onClick}
        title={`${subjectName} — ${teacherName} — ${roomName}`}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px',
          width: '100%', height: '100%', minHeight: '0',
          padding: '7px 9px',
          border: 'none', borderRadius: '7px',
          borderLeft: `3px solid ${accent}`,
          background: bg,
          opacity: isDraft ? 0.85 : 1,
          cursor: 'pointer', textAlign: 'left',
          transition: 'filter 0.15s, transform 0.12s',
          overflow: 'hidden', fontFamily: "'DM Sans', sans-serif",
          boxSizing: 'border-box',
        }}
      >
        <span style={{
          fontSize: '10.5px', fontWeight: '700', color: accent,
          letterSpacing: '0.3px', textTransform: 'uppercase', lineHeight: 1,
        }}>
          {subjectCode}
        </span>
        <span style={{
          fontSize: '11px', fontWeight: '500', color: '#112A17', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {subjectName}
        </span>
        {teacherName && (
          <span style={{
            fontSize: '10px', color: '#7AAE7A',
            display: 'flex', alignItems: 'center', gap: '4px',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            width: '100%',
          }}>
            <span style={{ color: '#AAC8AA', flexShrink: 0 }}>·</span>
            {teacherName}
          </span>
        )}
        {isOnline ? (
          <span style={{ fontSize: '10px', color: '#6330B4', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#AAC8AA' }}>◫</span>Online Class
          </span>
        ) : roomName ? (
          <span style={{
            fontSize: '10px', color: '#7AAE7A',
            display: 'flex', alignItems: 'center', gap: '4px',
            overflow: 'hidden', whiteSpace: 'nowrap', width: '100%',
          }}>
            <span style={{ color: '#AAC8AA', flexShrink: 0 }}>◫</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {roomName}
              {campusCode && (
                <span style={{
                  fontWeight: '700', fontSize: '9px', color: '#AAC8AA',
                  textTransform: 'uppercase', marginLeft: '2px',
                }}>
                  {campusCode}
                </span>
              )}
            </span>
          </span>
        ) : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
          {isConflict && (
            <span style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: 'rgba(226,75,74,0.15)', color: '#E24B4A',
              textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>⚠ conflict</span>
          )}
          {isDraft && (
            <span style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: 'rgba(136,135,128,0.1)', color: '#888780',
              textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>draft</span>
          )}
          {slotDur && (
            <span style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: slotDur <= 60 ? '#FEF3C7' : '#E8F5E9',
              color: slotDur <= 60 ? '#92400E' : '#2D6A4F',
            }}>{slotDur} min</span>
          )}
          {isLab && (
            <span style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: 'rgba(24,95,165,0.12)', color: '#185FA5',
              textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>lab</span>
          )}
          {isOnline && (
            <span style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: 'rgba(99,60,180,0.12)', color: '#6330B4',
              textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>🌐 online</span>
          )}
        </div>
      </button>
    </>
  );
}