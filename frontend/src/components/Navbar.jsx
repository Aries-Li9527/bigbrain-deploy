import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { Link } from 'react-router-dom';

const Navbar = (props) => {
  // 登出功能：
  // Logout function: clear token and update state
  const logout = () => {
    props.setToken(null)
    localStorage.removeItem('token');
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top App Bar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 3 }}
          />

          {/* App Title */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Bigbrain
          </Typography>

          {/* Conditional rendering of buttons */}
          {props.token === null ? (
            <>
              {/* 未登录时显示登录和注册按钮 // Show Login and Register when not logged in */}
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/register">Register</Button>
            </>
          ) : (
            // 已登录显示登出按钮 // Show Logout button when logged in
            <Button color="inherit" onClick={logout}>Logout</Button>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Navbar;