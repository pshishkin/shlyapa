import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Helper to get ?gameId from the URL
function getGameIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('gameId');
}

function App() {
  const [teams, setTeams] = useState({});
  const [players, setPlayers] = useState({});
  const gameId = getGameIdFromUrl() || '';
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    let browserId = localStorage.getItem('shlyapa_browser_id');
    if (!browserId) {
      browserId = Math.random().toString(36).slice(2);
      localStorage.setItem('shlyapa_browser_id', browserId);
    }

    if (gameId) {
      fetch(`/game/${gameId}/player/${browserId}`)
        .then((res) => res.json())
        .then(async (data) => {
          if (!data.name) {
            const newName = prompt('Enter your name:') || 'Unnamed';
            await fetch(`/game/${gameId}/player`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ browserId, name: newName }),
            });
            setPlayerName(newName);
          } else {
            setPlayerName(data.name);
          }
        });
      fetch(`/game/${gameId}`)
        .then((r) => r.json())
        .then((gameData) => {
          if (!gameData) return;
          setTeams(gameData.teams || {});
          setPlayers(gameData.players || {});
        });
    }
  }, [gameId]);

  function renderTeams() {
    return Object.entries(teams).map(([teamName, arrOfBrowserIds]) => (
      <div key={teamName} style={{ marginTop: '10px' }}>
        <strong>Team {teamName}:</strong>
        <ul>
          {arrOfBrowserIds.map((bid) => (
            <li key={bid}>
              {players[bid] || bid}
            </li>
          ))}
        </ul>
      </div>
    ));
  }

  return (
    <div style={{ margin: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h3>Your name: {playerName}</h3>
      <h1>Hello Shlyapa Client!</h1>
      <p>Первая версия фронтенда</p>
      {gameId && <p>Game ID: {gameId}</p>}

      {Object.keys(teams).length > 0 && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h4>Team Distribution</h4>
          {renderTeams()}
        </div>
      )}
    </div>
  );
}

function Admin() {
  const [gameIds, setGameIds] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [teamCount, setTeamCount] = useState(2);

  const [gamesData, setGamesData] = useState({});

  async function loadGames() {
    const res = await fetch('/admin/games');
    const data = await res.json();
    setGameIds(data);
  }

  async function createNewGame() {
    const res = await fetch('/admin/game', { method: 'POST' });
    const data = await res.json();
    alert('New game created: ' + data.gameId);
    await loadGames();
  }

  async function distributeTeams() {
    if (!selectedGameId) {
      return alert('Select a game first.');
    }
    const res = await fetch(`/admin/game/${selectedGameId}/distribute-teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamCount }),
    });
    const data = await res.json();
    if (!data.ok) {
      alert('Error distributing teams: ' + data.error);
    } else {
      alert('Teams distributed!');
      await loadSingleGame(selectedGameId);
    }
  }

  async function loadSingleGame(id) {
    const res = await fetch(`/game/${id}`);
    const data = await res.json();
    setGamesData((prev) => ({ ...prev, [id]: data }));
  }

  useEffect(() => {
    if (selectedGameId) {
      loadSingleGame(selectedGameId);
    }
  }, [selectedGameId]);

  useEffect(() => {
    loadGames();
  }, []);

  function renderTeamDistribution(gameData) {
    if (!gameData?.teams) return null;
    return (
      <div style={{ marginTop: '10px' }}>
        {Object.entries(gameData.teams).map(([teamName, arr]) => (
          <div key={teamName} style={{ marginTop: '5px' }}>
            <strong>Team {teamName}:</strong>{' '}
            <ul>
              {arr.map((browserId) => (
                <li key={browserId}>
                  {gameData.players && gameData.players[browserId]
                    ? gameData.players[browserId]
                    : browserId}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

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
            <a href={'/?gameId=' + id}>Join link {id}</a>
            {'  '}
            <button onClick={() => setSelectedGameId(id)}>
              Admin show
            </button>
          </li>
        ))}
      </ul>

      {selectedGameId && (
        <div style={{ border: '1px solid #ccc', padding: '10px' }}>
          <h4>Selected Game: {selectedGameId}</h4>

          <div style={{ marginTop: '10px' }}>
            Number of teams:
            <input
              type="number"
              min={1}
              max={10}
              value={teamCount}
              onChange={(e) => setTeamCount(Number(e.target.value))}
              style={{ width: '50px', marginLeft: '5px' }}
            />
            <button onClick={distributeTeams} style={{ marginLeft: '10px' }}>
              Distribute players into teams
            </button>
          </div>

          {renderTeamDistribution(gamesData[selectedGameId])}
        </div>
      )}
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
