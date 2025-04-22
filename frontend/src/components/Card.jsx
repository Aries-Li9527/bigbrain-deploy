// import React, { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

// CardShape component: displays a list of games in card layout
const CardShape = (props) => {
  // Get games array from props 
  const games = props.games ?? [];

  // React router navigation function
  const navigate = useNavigate();

  // Navigate to edit game page
  const turnToEditGame = (id) => {
    navigate(`/game/${id}`);
  };

  return (
    // Card container with flex layout
    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
      {games.map((game) => (
        <Card key={game.id} sx={{ maxWidth: 345 }}>
          {/* Game thumbnail */}
          <CardMedia
            sx={{ height: 140 }}
            image={game.thumbnail || "https://picsum.photos/300/180?random=10"}
            alt="Game picture"
          />

          {/* Game title and subtitle */}
          <CardContent>
            {/* game title */}
            <Typography gutterBottom variant="h5" component="div">
              {game.name}
            </Typography>

            {/* question */}
            <Typography variant="body2" color="text.secondary">
              Questions: {game.questions?.length ?? 0}
            </Typography>

            {/* Total Time */}
            <Typography variant="body2" color="text.secondary">
              Total Time: {game.questions?.reduce((sum, q) => sum + (q.time || 0), 0)} sec
            </Typography>
          </CardContent>

          {/* Action buttons */}
          <CardActions>
            <Button size="small" onClick={() => turnToEditGame(game.id)}>Edit Game</Button>
            <Button size="small" color="error" onClick={() => props.onDelete?.(game.id)}>
              Delete Game
            </Button>

          </CardActions>
        </Card>
      ))}
    </div>
  );
};

export default CardShape;
