import express from 'express';

const app = express();
const port = 8080;

// Храним все данные в памяти:
interface GameData {
  id: string;
  // тут можно добавить все поля текущей игры:
  // список игроков, команд, введённые слова и т.д.
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

app.listen(port, () => {
  console.log(`Shlyapa server is running on port ${port}`);
}); 