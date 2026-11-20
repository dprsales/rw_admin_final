import React, { useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import VanillaTilt from 'vanilla-tilt';
import notFoundImage from '../../assets/images/notfound.svg';
import { tokens } from '../../Theme/tokens';

function NotFound() {
  const tiltRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (tiltRef.current) {
      VanillaTilt.init(tiltRef.current, {
        max: 25,
        speed: 400,
        glare: true,
        'max-glare': 0.2,
      });
    }

    return () => {
      if (tiltRef.current) {
        tiltRef.current.removeAttribute('style');
        tiltRef.current = null;
      }
    };
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        textAlign: { xs: 'center', md: 'left' },
        gap: { xs: 3, md: 6 },
        backgroundColor: tokens.bg,
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          ref={tiltRef}
          component="img"
          src={notFoundImage}
          alt="404 Not Found"
          sx={{
            width: '100%',
            maxWidth: { xs: '300px', md: '500px' },
            cursor: 'pointer',
          }}
        />
      </Box>

      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: { xs: 'center', md: 'flex-start' },
        }}
      >
        <Typography color="inherit" gutterBottom sx={{ fontWeight: 700, lineHeight: 1 }}>
          <span style={{ color: tokens.gold, fontSize: 'clamp(84px, 18vw, 150px)' }}>40</span>
          <span style={{ color: tokens.text, fontSize: 'clamp(84px, 18vw, 150px)' }}>4</span>
        </Typography>

        <Typography
          variant="h5"
          color="inherit"
          gutterBottom
          sx={{ fontWeight: 700, textAlign: { xs: 'center', md: 'left' } }}
        >
          Oops! It looks like you're lost.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: tokens.textMuted,
            maxWidth: '32rem',
            textAlign: { xs: 'center', md: 'left' },
            mb: 2,
          }}
        >
          The page you're looking for isn't available. Try to search again or use the button below.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/"
          sx={{
            padding: '10px 24px',
            borderRadius: '8px',
          }}
        >
          Go back to Homepage
        </Button>
      </Box>
    </Box>
  );
}

export default NotFound;
