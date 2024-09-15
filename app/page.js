'use client'

import React, { useState } from 'react';
import { Box, Typography, Button, CssBaseline, ThemeProvider, Paper, Grid } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Home() {
  const {user, error, isLoading} = useUser();
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#4a90e2', // A soothing blue color
      },
    },
    typography: {
      fontFamily: '"Roboto Slab", "Helvetica", "Arial", sans-serif',
      h2: {
        fontWeight: 300,
        letterSpacing: '-0.5px',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '50%',
          height: '110%',
          backgroundImage: 'url(/images/doctor_4x.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0)', // White overlay with 50% opacity
          }
        }} />
        <Box sx={{ 
          width: '55%', 
          marginLeft: 'auto', 
          p: 4, 
          zIndex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100vh',
          position: 'relative', // Add this
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
          }}>
            {!isLoading && (
              user ? (
                <>
                  <Typography variant="h2" component="h1" gutterBottom sx={{ mb: 2, textAlign: 'center' }}>
                    Welcome Back,
                  </Typography>
                  <Typography variant="h2" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
                    {user.name}
                  </Typography>
                  <Button
                    href="/dashboard"  
                    variant="contained" 
                    size="large" 
                    sx={{ 
                      fontSize: '1.2rem', 
                      padding: '12px 24px',
                      borderRadius: '30px',
                      textTransform: 'none',
                    }}
                  >
                    Continue
                  </Button>
                </>        
              ) : (
                <>
                  <Typography variant="h2" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
                    Welcome to TelehealthAI!
                  </Typography>
                  <Button
                    href="/api/auth/login" 
                    variant="contained" 
                    size="large" 
                    sx={{ 
                      fontSize: '1.2rem', 
                      padding: '12px 24px',
                      borderRadius: '30px',
                      textTransform: 'none',
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )
            )}
          </Box>
          
          <Grid container spacing={2} sx={{ mt: 4 }}>
            {['Adaptive Smart Questions', 'AI with RAG', 'Human-like Interactions'].map((text, index) => (
              <Grid item xs={4} key={index}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: '15px',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <Typography variant="h6" component="h3">
                    {text}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}