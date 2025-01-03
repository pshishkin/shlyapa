import express from 'express';
import crypto from 'crypto';

const app = express();
const port = 8080;

// Храним все данные в памяти:
interface GameData {
  id: string;
  players?: Record<string, string>; // browserId => name
}
const games: Record<string, GameData> = {};

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

app.listen(port, () => {
  console.log(`Shlyapa server is running on port ${port}`);
}); 