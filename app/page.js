'use client'

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {Paper, Avatar, IconButton, TextField, Button, Switch, CssBaseline, ThemeProvider } from "@mui/material";
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box, Typography, Button, CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';

export default function Home() {
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
          <Typography variant="h2" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            Welcome to TelehealthAI
          </Typography>
          <Button 
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
        </Box>
      </Box>
    </ThemeProvider>
  );
}
