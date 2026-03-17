import React from 'react';
import { SHIFT_TIMES } from '../lib/rotationLogic';

const ShiftTag = ({ shift, onClick }) => {
  const { name, time, reason } = shift;
  const config = SHIFT_TIMES[time] || SHIFT_TIMES['0900'];
  
  const getDisplayContent = () => {
    if (time === 'OFF') {
      return <span>{name} {reason ? `(연차-${reason})` : '(연차)'}</span>;
    }
    if (time === 'OUTSIDE') {
      return <span>{name} {reason ? `(외근-${reason})` : '(외근)'}</span>;
    }
    return (
      <>
        <span>{name}{reason ? ` (${reason})` : ''}</span>
        <span>{time.substring(0, 2)}:{time.substring(2)}</span>
      </>
    );
  };

  return (
    <div 
      className={`shift-tag tag-${time}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(shift);
      }}
    >
      {getDisplayContent()}
    </div>
  );
};

export default ShiftTag;
