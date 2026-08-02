import React from 'react';
const Header = ({ tableNumber, billCount }) => {
  return (
    <header className="sticky top-0 bg-base-100 z-10 border-b border-base-200 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Table {tableNumber}</h1>
          <p className="text-sm opacity-60">{billCount} active bill{billCount > 1 ? 's' : ''}</p>
        </div>
        <div className="text-sm opacity-40">Shalphyoke</div>
      </div>
    </header>
  );
};
export default Header;
