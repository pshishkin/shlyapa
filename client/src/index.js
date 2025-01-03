import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div style={{ margin: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Hello Shlyapa Client!</h1>
      <p>Первая версия фронтенда</p>
    </div>
  );
}

function Admin() {
  const createNewGame = async () => {
    await fetch('/admin/clear', { method: 'POST' });
    alert('Cleared all games on the server');
  };

  return (
    <div style={{ margin: '20px' }}>
      <h2>Admin Page</h2>
      <button onClick={createNewGame}>
        Create a new game (clear server memory)
      </button>
    </div>
  );
}

// Switch between the normal App and Admin panel:
let content;
if (window.location.pathname === '/admin') {
  content = <Admin />;
} else {
  // the original App component
  content = <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(content); 