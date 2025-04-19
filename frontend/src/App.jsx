import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignIn from './components/SignIn';

function App() {
  const [count, setCount] = useState(0);

  return (
    // BrowserRouter-整个路由系统最外层; Routes-所有Route的容器; 定义路径为 /login 时，渲染 SignIn 组件
    <BrowserRouter>
      <Routes>
        {/* Define a route: render <SignIn /> when path is /login */}
        <Route path='/login' element={<SignIn />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
