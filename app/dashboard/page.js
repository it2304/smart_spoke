'use client'

import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Button, Grid, Box, Avatar, Menu, MenuItem, Paper} from '@mui/material';
import { Settings, AccountCircle, Chat, Person, Language} from '@mui/icons-material';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

const translations = {
  English: {
    profile: 'Profile',
    account: 'Account',
    settings: 'Settings',
    language: 'Language',
    logout: 'Logout',
    startConversation: 'Start a new conversation',
    welcome: 'Welcome to TelehealthAI!',
    welcomeBack: 'Welcome Back',
  },
  Hindi: {
    profile: 'प्रोफ़ाइल',
    account: 'खाता',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    logout: 'लॉग आउट',
    startConversation: 'नया संवाद शुरू करें',
    welcome: 'TelehealthAI में आपका स्वागत है!',
    welcomeBack: 'वापसी पर स्वागत है',
  },
  Bengali: {
    profile: 'প্রোফাইল',
    account: 'অ্যাকাউন্ট',
    settings: 'সেটিংস',
    language: 'ভাষা',
    logout: 'লগ আউট',
    startConversation: 'নতুন কথোপকথন শুরু করুন',
    welcome: 'TelehealthAI তে স্বাগতম!',
    welcomeBack: 'ফিরে আসায় স্বাগতম',
  },
};

function Dashboard() {
    const {user, error, isLoading} = useUser();
    const [open, setOpen] = useState(false);
    const [language, setLanguage] = useState('English');
    const [anchorEl, setAnchorEl] = useState(null);
    const router = useRouter();

    useEffect(() => {
      if (user) {
        fetchUserLanguagePreference();
      }
    }, [user]);

    const fetchUserLanguagePreference = async () => {
      try {
        const response = await fetch(`/api/user/language?userId=${user.sub}`);
        if (response.ok) {
          const data = await response.json();
          setLanguage(data.languagePreference);
        }
      } catch (error) {
        console.error('Error fetching language preference:', error);
      }
    };

    const handleListItemClick = (text) => {
      if (text === 'Profile') {
        router.push('/profile');
      }
      // You can add more conditions here for other buttons if needed
    };

    const handleLanguageClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleLanguageClose = async (lang) => {
      if (lang && lang !== language) {
        setLanguage(lang);
        try {
          const response = await fetch('/api/user/language', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.sub, languagePreference: lang }),
          });
          if (!response.ok) {
            console.error('Failed to update language preference');
          }
        } catch (error) {
          console.error('Error updating language preference:', error);
        }
      }
      setAnchorEl(null);
    };

    const t = (key) => translations[language][key] || key;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Bar */}
      <AppBar position="fixed">
        <Toolbar sx ={{justifyContent: 'space-between'}}>
            <Link href="/dashboard" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="h5" noWrap component="div" sx={{ marginLeft: '250px', cursor: 'pointer' }}>
                    TelehealthAI Dashboard
                </Typography>
            </Link>
          <Button color="inherit" href="/api/auth/logout">
            {t('logout')}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            width: 240, 
            top: 15,
            left: 15,
            boxSizing: 'border-box',
            borderTopRightRadius: 20,
            borderTopLeftRadius: 20,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
            borderRight: 'none', // Remove the right border for a cleaner look
          },
        }}
      > 
        <Toolbar />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 4 }}>
          <Avatar
            src={user?.picture}
            alt={user?.name || 'User'}
            sx={{ width: 80, height: 80, mb: 2 }}
          />
          <Typography variant="h6">{user?.name || 'User'}</Typography>
        </Box>
        <List>
          <ListItem component="div" onClick={() => handleListItemClick('Profile')}>
            <ListItemIcon><Person /></ListItemIcon>
            <ListItemText primary={t('profile')} />
          </ListItem>
          <ListItem component="div" onClick={handleLanguageClick}>
            <ListItemIcon><Language /></ListItemIcon>
            <ListItemText primary={`${t('language')}: ${language}`} />
          </ListItem>
          {[t('account'), t('settings')].map((text, index) => (
            <ListItem component="div" key={text} onClick={() => handleListItemClick(text)}>
              <ListItemIcon>
                {text === t('account') ? <AccountCircle /> : <Settings />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleLanguageClose()}
      >
        <MenuItem onClick={() => handleLanguageClose('English')}>English</MenuItem>
        <MenuItem onClick={() => handleLanguageClose('Hindi')}>Hindi</MenuItem>
        <MenuItem onClick={() => handleLanguageClose('Bengali')}>Bengali</MenuItem>
      </Menu>

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          borderTopLeftRadius: 20,
          backgroundColor: (theme) => theme.palette.background.default,
          marginLeft: '-20px', // Pull the main content slightly to the left
          paddingLeft: '40px', // Add extra padding to compensate for the negative margin
          position: 'relative', // Add this to position the chat bubble
        }}
      >
        <Toolbar /> {/* This toolbar is for spacing below the AppBar */}
        <Grid container spacing={3}>
          <Box sx={{
            position: 'absolute',
            left: 36,
            top: 70,
            width: '50%',
            height: '125%',
            backgroundImage: 'url(/images/doctor_4x.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            borderRadius: 20, // Add rounded corners to the image box
            overflow: 'hidden', // Ensure the image respects the border radius
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              //background: 'linear-gradient(to left, rgba(255,255,255,0), rgba(255,255,255,1))',
            }
          }} />
          
          {/* Chat bubble */}
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              right: 200,
              top: 250,
              maxWidth: 400, // Increased from 250
              padding: '30px', // Increased from 15px
              borderRadius: '30px', // Increased from 20px
              borderBottomLeftRadius: 0, // Changed from borderTopLeftRadius
              backgroundColor: "#7a9cd6",
              color: (theme) => theme.palette.primary.contrastText,
              '&::before': { // Changed from '&::after'
                content: '""',
                position: 'absolute',
                left: '-40px', // Changed from right: '-20px'
                bottom: 0, // Changed from top: 0
                border: '20px solid transparent', // Increased from 10px
                borderRightColor: "#7a9cd6", // Changed from borderLeftColor
                borderBottomColor: "#7a9cd6", // Changed from borderTopColor
              }
            }}
          >
            <Typography variant="h5"> 
              {t('welcome')}
            </Typography>
          </Paper>

          <Button
            sx={{
              marginTop: '450px',
              marginLeft: '725px',
              padding: '15px 30px', // Increase padding to make the button larger
              fontSize: '1.2rem', // Increase font size
              borderRadius: '50px', // Add rounded edges
              textTransform: 'none', // Prevent uppercase transformation
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Add a subtle shadow
              '&:hover': {
                backgroundColor: "#1e2794",
                boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)', // Enhance shadow on hover
              },
            }}  
            variant="contained"
            size="large"
            startIcon={<Chat sx={{ fontSize: '1.5rem' }} />} // Increase icon size
            href='/chatbox'
          >
            {t('startConversation')}
          </Button>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;