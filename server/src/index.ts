import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json()); // parse JSON body

const port = 8080;

interface GameData {
  id: string;
  players?: Record<string, string>;   // browserId => playerName
  teams?: Record<string, string[]>;   // teamName => array of browserIds
}
const games: Record<string, GameData> = {};

// Example shuffle helper:
function shuffleArray<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

app.get('/', (req, res) => {
  res.send('Hello from Shlyapa!');
});

// Простой пример эндпойнта для создания игры:
app.post('/game', (req, res) => {
  const newId = Date.now().toString();
  games[newId] = { id: newId };
  res.json({ ok: true, gameId: newId });
});

app.post('/admin/clear', (req, res) => {
  // Reset the in-memory store of games:
  Object.keys(games).forEach((id) => delete games[id]);
  res.json({ ok: true, message: 'Cleared all games' });
});

// POST /admin/game => Create a new game with a random ID
app.post('/admin/game', (req, res) => {
  const newId = crypto.randomBytes(3).toString('hex'); // for example: "2af93c"
  games[newId] = { id: newId };
  res.json({ ok: true, gameId: newId });
});

// GET /admin/games => Return all game IDs
app.get('/admin/games', (req, res) => {
  res.json(Object.keys(games));
});

// GET /game/:gameId/player/:browserId => returns { name: string|null }
app.get('/game/:gameId/player/:browserId', (req, res) => {
  const { gameId, browserId } = req.params;
  const game = games[gameId];
  if (!game) {
    return res.json({ name: null });
  }
  // If players dictionary doesn't exist, or no entry => name is null
  const playerName = game.players?.[browserId] ?? null;
  res.json({ name: playerName });
});

// POST /game/:gameId/player => body: { browserId, name }
app.use(express.json()); // so we can parse JSON body
app.post('/game/:gameId/player', (req, res) => {
  const { gameId } = req.params;
  const { browserId, name } = req.body;
  const game = games[gameId];
  if (!game) {
    return res.json({ ok: false, error: 'No such game' });
  }
  if (!game.players) {
    game.players = {};
  }
  game.players[browserId] = name;
  res.json({ ok: true });
});

// GET /game/:gameId => returns the full game object (id, players, teams, etc.)
app.get('/game/:gameId', (req, res) => {
  const g = games[req.params.gameId];
  if (!g) {
    return res.json(null);
  }
  res.json(g);
});

// POST /admin/game/:gameId/distribute-teams => body: { teamCount }
app.post('/admin/game/:gameId/distribute-teams', (req, res) => {
  const { gameId } = req.params;
  const { teamCount } = req.body;
  const game = games[gameId];
  if (!game) {
    return res.status(404).json({ ok: false, error: 'No such game' });
  }
  if (!game.players) {
    game.players = {};
  }

  // gather all browserIds, shuffle them, then distribute among teams
  const browserIds = Object.keys(game.players);
  shuffleArray(browserIds);

  // possible team names: A, B, C, ...
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const chosenTeams = letters.slice(0, Math.min(teamCount, 10)).split('');

  // reset or create the teams object
  game.teams = {};
  for (const t of chosenTeams) {
    game.teams[t] = [];
  }

  // assign each player in round-robin fashion
  let idx = 0;
  for (const browserId of browserIds) {
    const teamName = chosenTeams[idx % chosenTeams.length];
    game.teams[teamName].push(browserId);
    idx++;
  }

  res.json({ ok: true, teams: game.teams });
});

app.listen(port, () => {
  console.log(`Shlyapa server is running on port ${port}`);
}); 