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
  const [wordsPerPlayer, setWordsPerPlayer] = useState(0);
  const [myWords, setMyWords] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [rounds, setRounds] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

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
          setWordsPerPlayer(gameData.wordsPerPlayer || 0);
          if (gameData.wordsByPlayer?.[browserId]) {
            setMyWords(gameData.wordsByPlayer[browserId]);
            setHasSubmitted(true);
          }
        });
      fetchGameData();

      const intervalId = setInterval(() => {
        fetchGameData();
      }, 2000);

      return () => clearInterval(intervalId);
    }
  }, [gameId]);

  async function fetchGameData() {
    const browserId = localStorage.getItem('shlyapa_browser_id') || '';
    const res = await fetch(`/game/${gameId}`);
    const gameData = await res.json();
    if (!gameData) return;

    setTeams(gameData.teams || {});
    setPlayers(gameData.players || {});
    setWordsPerPlayer(gameData.wordsPerPlayer || 0);
    setRounds(gameData.rounds || []);

    const ar = gameData.rounds?.find(r => r.isActive);
    if (ar) {
      setActiveRound(ar);
      const now = Date.now();
      const isMine = ar.currentPlayer === browserId && ar.turnEndsAt && (ar.turnEndsAt > now);
      setIsMyTurn(isMine);
      if (ar.turnEndsAt) {
        setTimeLeft(Math.max(0, Math.floor((ar.turnEndsAt - now)/1000)));
      }
    } else {
      setActiveRound(null);
      setIsMyTurn(false);
      setTimeLeft(0);
    }
  }

  async function submitWords() {
    const browserId = localStorage.getItem('shlyapa_browser_id') || '';
    // POST myWords
    const res = await fetch(`/game/${gameId}/submit-words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ browserId, words: myWords }),
    });
    const data = await res.json();
    if(!data.ok) {
      alert(data.error || 'Error submitting words');
    } else {
      setHasSubmitted(true);
    }
  }

  function renderWordInputs() {
    if (!wordsPerPlayer) return null;
    const inputs = [];
    for (let i = 0; i < wordsPerPlayer; i++) {
      inputs.push(
        <div key={i} style={{ marginBottom: '5px' }}>
          <input
            type="text"
            disabled={hasSubmitted}
            value={myWords[i] || ''}
            onChange={(e) => {
              const copy = [...myWords];
              copy[i] = e.target.value;
              setMyWords(copy);
            }}
          />
        </div>
      );
    }
    return (
      <div style={{ margin: '10px 0' }}>
        <h4>Enter your words</h4>
        {inputs}
        {!hasSubmitted && (
          <button onClick={submitWords} style={{ marginTop: '10px' }}>
            Submit Words
          </button>
        )}
      </div>
    );
  }

  function renderTeams() {
    return Object.entries(teams).map(([teamName, arrOfBrowserIds]) => {
      const roundScores = rounds?.map(r => r.teamScores[teamName] || 0) ?? [];
      const roundsString = roundScores.join('/');

      return (
        <div key={teamName} style={{ marginTop: '10px' }}>
          <strong>Team {teamName} ({roundsString})</strong>
          <ul>
            {arrOfBrowserIds.map((bid) => (
              <li key={bid}>
                {players[bid] || bid}
              </li>
            ))}
          </ul>
        </div>
      );
    });
  }

  async function startTurn() {
    const browserId = localStorage.getItem('shlyapa_browser_id') || '';
    const res = await fetch(`/game/${gameId}/start-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ browserId }),
    });
    const data = await res.json();
    if (!data.ok) {
      alert(data.error || 'Error starting turn');
    } else {
      if (data.nextWord) {
        setCurrentWord(data.nextWord);
      }
      fetchGameData();
    }
  }

  async function guessWord() {
    const browserId = localStorage.getItem('shlyapa_browser_id') || '';
    const res = await fetch(`/game/${gameId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ browserId }),
    });
    const data = await res.json();
    if (data.ok) {
      if (!data.roundIsOver && data.nextWord) {
        setCurrentWord(data.nextWord);
      } else {
        setCurrentWord('(No more words)');
      }
      fetchGameData();
    } else {
      alert(data.error || 'Error guessing word');
    }
  }

  async function skipWord() {
    const browserId = localStorage.getItem('shlyapa_browser_id') || '';
    const res = await fetch(`/game/${gameId}/skip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ browserId }),
    });
    const data = await res.json();
    if(data.ok) {
      setCurrentWord(data.nextWord);
    } else {
      alert(data.error || 'Error skipping word');
    }
  }

  function renderActiveTurnUI() {
    return (
      <div style={{ marginTop: '10px', border: '1px solid #ccc', padding: '10px' }}>
        <h4>It's your turn!</h4>
        <p>Time left: {timeLeft} s</p>
        <p>Word: {currentWord || '(click Guess or Skip to load one)'} </p>
        <button onClick={guessWord}>Guess</button>
        <button onClick={skipWord} style={{ marginLeft: '10px' }}>Skip</button>
      </div>
    );
  }

  function renderRoundInfo() {
    if (!activeRound) {
      return null;
    }
    const wordsLeft = activeRound.unguessedWords?.length || 0;

    return (
      <div style={{ marginTop: '10px', border: '1px solid #ccc', padding: '10px' }}>
        <h4>Round {activeRound.roundNumber} is in progress ({wordsLeft} words left)</h4>
        {isMyTurn
          ? renderActiveTurnUI()
          : <button onClick={startTurn}>Start Turn</button>
        }
      </div>
    );
  }

  return (
    <div style={{ margin: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h3>Your name: {playerName}</h3>
      {gameId && <p>Game ID: {gameId}</p>}

      {renderWordInputs()}

      {Object.keys(teams).length > 0 && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h4>Team Distribution</h4>
          {renderTeams()}
        </div>
      )}

      {activeRound && renderRoundInfo()}
    </div>
  );
}

function Admin() {
  const [gameIds, setGameIds] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [teamCount, setTeamCount] = useState(2);

  const [gamesData, setGamesData] = useState({});
  const [newWordsPerPlayer, setNewWordsPerPlayer] = useState(5);
  const [secondsPerTurn, setSecondsPerTurn] = useState(30);

  async function loadGames() {
    const res = await fetch('/admin/games');
    const data = await res.json();
    setGameIds(data);
    if (data.length > 0) {
      setSelectedGameId(data[0]);
      loadSingleGame(data[0]);
    }
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

  async function setWordsPerPlayer() {
    if (!selectedGameId) {
      return alert('Select a game first.');
    }
    const res = await fetch(`/admin/game/${selectedGameId}/set-words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordsPerPlayer: newWordsPerPlayer }),
    });
    const data = await res.json();
    if (!data.ok) {
      alert('Error: ' + data.error);
    } else {
      alert('wordsPerPlayer set to ' + newWordsPerPlayer);
      await loadSingleGame(selectedGameId);
    }
  }

  async function startNewRound() {
    if (!selectedGameId) return alert('Select a game first.');
    const res = await fetch(`/admin/game/${selectedGameId}/start-round`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secondsPerTurn }),
    });
    const data = await res.json();
    if (!data.ok) {
      alert('Error: ' + data.error);
    } else {
      alert(`Round ${data.roundNumber} started with ${data.secondsPerTurn} seconds per turn`);
      await loadSingleGame(selectedGameId);
    }
  }

  useEffect(() => {
    if (selectedGameId) {
      loadSingleGame(selectedGameId);
    }
  }, [selectedGameId]);

  useEffect(() => {
    loadGames();
  }, []);

  function renderGamePlayers(gameData) {
    if (!gameData.players) {
      return <p>No players yet</p>;
    }
    const allPlayers = Object.entries(gameData.players);
    return (
      <div style={{ marginTop: '10px' }}>
        <h5>{allPlayers.length} player(s) in this game:</h5>
        <ul>
          {allPlayers.map(([browserId, playerName]) => {
            const wordsProvided = gameData.wordsByPlayer?.[browserId]?.length || 0;
            return (
              <li key={browserId}>
                {playerName} ({browserId}) — {wordsProvided} words
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  function renderTeamDistribution(gameData) {
    if (!gameData) {
      return <p>No game data loaded yet.</p>;
    }

    if (!gameData.teams) {
      return <p>No teams yet!</p>;
    }

    return Object.entries(gameData.teams).map(([teamName, arrOfBrowserIds]) => {
      const roundScores = gameData.rounds?.map(r => r.teamScores[teamName] || 0) ?? [];
      const roundsString = roundScores.join('/');
      return (
        <div key={teamName}>
          <strong>Team {teamName} ({roundsString})</strong>
          <ul>
            {arrOfBrowserIds.map(bid => (
              <li key={bid}>{gameData.players[bid]}</li>
            ))}
          </ul>
        </div>
      );
    });
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
          </li>
        ))}
      </ul>

      {selectedGameId && (
        <div style={{ border: '1px solid #ccc', padding: '10px' }}>
          <h4>Selected Game: {selectedGameId}</h4>

          <div style={{ marginTop: '10px' }}>
            <label>
              Words per player:
              <input
                type="number"
                min={1}
                value={newWordsPerPlayer}
                onChange={(e) => setNewWordsPerPlayer(Number(e.target.value))}
                style={{ width: '50px', marginLeft: '5px' }}
              />
            </label>
            <button onClick={setWordsPerPlayer} style={{ marginLeft: '10px' }}>
              Set words-per-player
            </button>
          </div>

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

          <div style={{ marginTop: '10px' }}>
            <label>Seconds per turn: </label>
            <input
              type="number"
              min={5}
              value={secondsPerTurn}
              onChange={(e) => setSecondsPerTurn(Number(e.target.value))}
            />
            <button onClick={startNewRound} style={{ marginLeft: '10px' }}>
              Start new round
            </button>
          </div>

          {gamesData[selectedGameId] ? (
            <div>
              {renderGamePlayers(gamesData[selectedGameId])}
              {renderTeamDistribution(gamesData[selectedGameId])}
            </div>
          ) : (
            <p>No data loaded yet</p>
          )}
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
