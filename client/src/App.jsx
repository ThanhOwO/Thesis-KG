import React, { useState } from 'react'
import { AddTriple, Integrate, Header } from './components'

function App () {
  const [activeComponent, setActiveComponent] = useState('Integrate');

  const renderComponent = () => {
    switch (activeComponent) {
      case 'Integrate':
        return <Integrate />;
      case 'Add Triple':
        return <AddTriple />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Header setActiveComponent={setActiveComponent} />
      {renderComponent()}
    </div>
  )
}

export default App
