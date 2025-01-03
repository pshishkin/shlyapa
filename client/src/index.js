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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />); 