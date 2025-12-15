import React from 'react';

export const Card = ({ children, className = "", title, action }) => {
  return (
    <div className={`bg-white rounded-xl shadow-[0_2px_8px_rgba(63,98,18,0.06)] border border-olive-200 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-olive-100 flex justify-between items-center bg-white">
          {title && <h3 className="text-lg font-bold text-olive-900">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};