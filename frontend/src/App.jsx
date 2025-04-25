import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Navbar from './components/Navbar';
import MainPage from './components/MainPage';
import Dashboard from './components/Dashboard';
import EditGame from './components/EditGame';
import EditQuestion from './components/EditQuestion';
import SessionPage from './components/SessionPage';
import PlayScreen from './components/PlayScreen';
import PlayerResult from './components/PlayerResult';
import SessionResult from './components/SessionResult';
import AdvancedPointsExplanation from './components/AdvancedPointsExplanation';

function App () {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Automatically sync token to localStorage if changed
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  //  maintains login token state and passes it to Navbar and route pages
  return (
    <BrowserRouter>
      <Navbar token={token} setToken={setToken} />
      <Routes>
        {/* Define a route: render <MainPage /> when path is / */}
        <Route path='/' element={<MainPage token={token} />} />

        {/* Login and Register */}
        <Route path='/login' element={<SignIn setToken={setToken} />} />
        <Route path='/register' element={<SignUp setToken={setToken} />} />

        {/* Main app functionality */}
        <Route path='/dashboard' element={<Dashboard setToken={setToken} />} />
        <Route path='/game/:game_id' element={<EditGame setToken={setToken} />} />
        <Route path='/game/:game_id/question/:question_id' element={<EditQuestion setToken={setToken} />} />
        <Route path='/session/:session_id' element={<SessionPage />} />
        <Route path='/play/:session_id' element={<PlayScreen />} />
        <Route path='/result/:session_id/:player_id' element={<PlayerResult />} />
        <Route path='/session/:session_id/results' element={<SessionResult />} />
        {/* Informational page */}
        <Route path='/points-explanation' element={<AdvancedPointsExplanation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
