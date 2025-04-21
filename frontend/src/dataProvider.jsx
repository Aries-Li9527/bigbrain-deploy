import AUTH from './Constant';

// Error handler: throw if response contains an error field
const handleError = (res) => {
  const { error } = res;
  if (error) {
    throw new Error(error);
  }
  return res;
};


// Fetch all games 
export const fetchAllGames = async () => {
  const userToken = localStorage.getItem(AUTH.TOKEN_KEY);

  const res = await fetch('http://localhost:5005/admin/games', {
    method: 'GET',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
      Authorization: `Bearer ${userToken}`,
    },
  });

  const data = await res.json();
  return handleError(data);
};
