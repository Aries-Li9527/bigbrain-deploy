import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Navbar from './components/Navbar';
import MainPage from './components/MainPage';
import Dashboard from './components/Dashboard';
import EditGame from './components/EditGame';
import EditQuestion from './components/EditQuestion'


function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  //  maintains login token state and passes it to Navbar and route pages
  return (
    <BrowserRouter>
      <Navbar token={token} setToken={setToken} />
      <Routes>
        {/* Define a route: render <SignIn /> when path is /login */}
        <Route path='/' element={<MainPage token={token} />} />
        <Route path='/login' element={<SignIn setToken={setToken} />} />
        <Route path='/register' element={<SignUp setToken={setToken} />} />
        <Route path='/dashboard' element={<Dashboard setToken={setToken} />} />
        <Route path="/game/:game_id" element={<EditGame setToken={setToken}/>} />
        <Route path="/game/:game_id/question/:question_id" element={<EditQuestion setToken={setToken}/>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;