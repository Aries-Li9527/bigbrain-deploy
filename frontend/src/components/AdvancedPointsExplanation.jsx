import { Card, CardContent, Typography, Box } from '@mui/material';

// This component visually explains how the Advanced Points system works
const AdvancedPointsExplanation = () => {
  return (
    // Center the explanation box on the page with margin on top
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
      {/* Card provides a nice container with shadow and padding */}
      <Card sx={{ maxWidth: 800, width: '100%', p: 3 }}>
        <CardContent>
          {/* Title */}
          <Typography variant="h5" align="center" gutterBottom>
            Advanced Points System Explanation
          </Typography>

          {/* Introductory paragraph explaining the system */}
          <Typography variant="body1" paragraph>
            In addition to the standard score (based on whether an answer is correct), this game also uses an
            <strong> advanced scoring system</strong> that rewards faster responses.
            Your <strong>Advanced Score</strong> for each question is calculated as:
          </Typography>

          {/* Highlighted formula box */}
          <Box
            sx={{
              backgroundColor: '#e3f2fd',  // Light blue background
              color: '#0d47a1',             // Dark blue text
              textAlign: 'center',
              py: 2,                        // Vertical padding
              px: 3,                        // Horizontal padding
              borderRadius: 1,              // Rounded corners
              fontWeight: 'bold',
              mb: 2,                        // Margin bottom
              fontSize: '1.1rem'
            }}
          >
            Advanced Score = Time Remaining (speed) × Question Points
          </Box>

          {/* Follow-up explanation to emphasize the scoring philosophy */}
          <Typography variant="body1">
            This means the faster you answer a question correctly, the more bonus points you receive.
            It encourages both <strong>accuracy</strong> and <strong>speed</strong>!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedPointsExplanation;
