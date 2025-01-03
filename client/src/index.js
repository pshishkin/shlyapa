import React, { useState, useEffect } from 'react';
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
  const [gameIds, setGameIds] = useState([]);

  // fetch the list of games from server
  async function loadGames() {
    const res = await fetch('/admin/games');
    const data = await res.json();
    setGameIds(data);
  }

  // create a new random game
  async function createNewGame() {
    const res = await fetch('/admin/game', { method: 'POST' });
    const data = await res.json();
    alert('New game created: ' + data.gameId);
    await loadGames(); // refresh list
  }

  // load game list on first render
  useEffect(() => {
    loadGames();
  }, []);

  return (
    <div style={{ margin: '20px' }}>
      <h2>Admin Page</h2>
      <button onClick={createNewGame}>
        Create a new game
      </button>
      <h3>Games:</h3>
      <ul>
        {gameIds.map((id) => (
          <li key={id}>
            {id} – <a href={'/?gameId=' + id}>Join link</a>
          </li>
        ))}
      </ul>
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