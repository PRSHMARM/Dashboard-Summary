import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard.tsx';
import Container from '@mui/material/Container';

function App() {
  return (
    <div className="App">
     <Container maxWidth="xl" sx={{ paddingTop: 4 }}>
      <Dashboard />
    </Container>
    </div>
  );
}

export default App;
