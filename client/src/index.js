import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Helper to get ?gameId from the URL
function getGameIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('gameId');
}

function App() {
  const [playerName, setPlayerName] = useState('');
  const gameId = getGameIdFromUrl() || '';

  useEffect(() => {
    // Check or generate browserId
    let browserId = localStorage.getItem('shlyapa_browser_id');
    if (!browserId) {
      browserId = Math.random().toString(36).slice(2); // quick random ID
      localStorage.setItem('shlyapa_browser_id', browserId);
    }

    // If we have a gameId, check if the server already has a name
    if (gameId) {
      fetch(`/game/${gameId}/player/${browserId}`)
        .then((res) => res.json())
        .then(async (data) => {
          if (!data.name) {
            // Ask for a new name
            const newName = prompt('Enter your name:') || 'Unnamed';
            // Save it to the server
            await fetch(`/game/${gameId}/player`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ browserId, name: newName }),
            });
            setPlayerName(newName);
          } else {
            // We already have a name
            setPlayerName(data.name);
          }
        });
    }
  }, [gameId]);

  return (
    <div style={{ margin: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h3>Your name: {playerName}</h3>
      <h1>Hello Shlyapa Client!</h1>
      <p>Первая версия фронтенда</p>
      {gameId && <p>Game ID: {gameId}</p>}
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
  content = <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(content); 