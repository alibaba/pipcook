import React from 'react';

export default function BasicLayout({ children }) {
  console.log(children);
  return (
    <div>
      {children}
    </div>
  );
}

