import AUTH from "./Constant"; 
// Global error handler
const handleError = (res) => {
  const { error } = res;
  if (error) {
    throw new Error(error);
  }
  return res;
};

// Fetch all games from backend with authentication
export const fetchAllGames = () => {
  const userToken = localStorage.getItem(AUTH.TOKEN_KEY); 

  return fetch("http://localhost:5005/admin/games", {
    method: "GET", 
    headers: {
      "Content-type": "application/json; charset=UTF-8", 
      Authorization: `Bearer ${userToken}`,              
    },
  })
    .then((res) => res.json()) 
    .then(handleError);        
};

