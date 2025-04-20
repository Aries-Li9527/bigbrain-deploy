import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import AUTH from '../Constant';
import { useLocation } from 'react-router-dom';

const EditGame = () => {
  const { gameId } = useParams(); // Get gameId from URL parameters
  const navigate = useNavigate();
  const location = useLocation();

  const [game, setGame] = useState(null); // Current game object
  const [allGames, setAllGames] = useState([]); // All games owned by the user
  const [editName, setEditName] = useState(''); // Game name to be edited
  const [editThumbnail, setEditThumbnail] = useState(''); // Game thumbnail to be edited

  const token = localStorage.getItem(AUTH.TOKEN_KEY);
  const ownerEmail = localStorage.getItem('email');

  // Compress the uploaded image before saving (client-side compression)
  const compressImage = (file, maxWidth = 400, maxHeight = 400) =>
    new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Return base64 JPEG string
      };

      reader.readAsDataURL(file);
    });

  // Fetch games from backend and populate target game
  const fetchGame = async () => {
    const res = await fetch('http://localhost:5005/admin/games', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    const owned = data.games.filter(g => g.owner === ownerEmail);
    setAllGames(owned);

    const current = owned.find(g => g.id.toString() === gameId);

    // Check if local questions exist and override the game questions
    const tempKey = `questions-${gameId}`;
    const localQuestions = JSON.parse(localStorage.getItem(tempKey) || '[]');
    if (localQuestions.length > 0) {
      current.questions = localQuestions;
    }

    setGame(current);
    setEditName(current?.name || '');
    setEditThumbnail(current?.thumbnail || '');
  };

  // Re-fetch game whenever path changes (e.g. question updated)
  useEffect(() => {
    fetchGame();
  }, [location.pathname]);

  // Update game metadata (name & thumbnail)
  const updateGame = async (updatedGame) => {
    const updatedGames = allGames.map(g => g.id.toString() === gameId ? updatedGame : g);

    const res = await fetch('http://localhost:5005/admin/games', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ games: updatedGames }),
    });

    if (res.ok) {
      await fetchGame(); // Refresh after successful update
    } else {
      const err = await res.text();
      console.error('Update failed:', err);
    }
  };

  // Delete question from local storage
  const deleteQuestion = (index) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    const tempKey = `questions-${gameId}`;
    const currentQuestions = JSON.parse(localStorage.getItem(tempKey) || '[]');

    currentQuestions.splice(index, 1); // Remove question
    localStorage.setItem(tempKey, JSON.stringify(currentQuestions)); // Save changes

    setGame({ ...game, questions: currentQuestions }); // Update local state
  };

  // Save updated game name and thumbnail
  const saveMeta = () => {
    const updated = {
      ...game,
      name: editName,
      thumbnail: editThumbnail,
    };
    updateGame(updated);
  };

  // Show loading text if game is not loaded yet
  if (!game) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  
};

export default EditGame;
