import React from 'react';
import './App.css';
import BookSearch from './components/booksearch';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Mga Libro na Hindi mo Mahanap sa Library</h1>
      </header>
      <main>
        <BookSearch />
      </main>
    </div>
  );
}

export default App;