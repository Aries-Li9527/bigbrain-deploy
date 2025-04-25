// MainPage component: displays welcome text if user is logged in
import { Box, Typography, Container } from "@mui/material";

const MainPage = (props) => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          mt: { xs: 4, sm: 8 }, 
          px: 2,               
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' } }}
          gutterBottom
        >
          Welcome to Big Brain
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '1rem', sm: '1.2rem' },
            maxWidth: 500,
            mt: 2,
          }}
        >
          {props.token === null
            ? <>
              Please click the login button to log in. <br />
              New here? Feel free to register an account and join us!
            </>
            : <>You are already logged in — enjoy your stay!</>}
        </Typography>
      </Box>
    </Container>
  );
};

export default MainPage;