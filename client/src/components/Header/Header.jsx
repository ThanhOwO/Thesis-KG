import React from 'react';
import './styles.scss';

function Header({ setActiveComponent }) {
  return (
    <div className="header">
      <button className="button" onClick={() => setActiveComponent('Integrate')}>
        Integrate
      </button>
      <button className="button" onClick={() => setActiveComponent('AddTriple')}>
        Add Triple
      </button>
    </div>
  );
}

export default Header;
