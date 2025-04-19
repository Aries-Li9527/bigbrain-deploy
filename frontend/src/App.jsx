import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Navbar from './components/Navbar';
import MainPage from './components/MainPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  //  maintains login token state and passes it to Navbar and route pages
  return (
    // BrowserRouter-整个路由系统最外层; Routes-所有Route的容器; 定义路径为 /login 时，渲染 SignIn 组件
    <BrowserRouter>
      <Navbar token={token} setToken={setToken} />
      <Routes>
        {/* Define a route: render <SignIn /> when path is /login */}
        <Route path='/' element={<MainPage token={token}/>} />
        <Route path='/login' element={<SignIn setToken={setToken} />} />
        <Route path='/register' element={<SignUp setToken={setToken} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;