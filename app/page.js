'use client'

import React, { useState } from 'react';
import { Box, Typography, Button, CssBaseline, ThemeProvider } from '@mui/material';
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
          height: '100%',
          backgroundImage: 'url(/images/landingPage1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to left, rgba(255,255,255,0), rgba(255,255,255,1))',
          }
        }} />
        <Box sx={{ 
          width: '50%', 
          marginLeft: 'auto', 
          p: 4, 
          zIndex: 1,
          backgroundColor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          
          {!isLoading && (
                user ? (
                  <>
                  <Typography variant="h2" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            Welcome Back, \n{user.name}
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
      </Box>
    </ThemeProvider>
  );
}