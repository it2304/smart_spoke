'use client'

import { useState } from 'react';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Button, Grid, Box } from '@mui/material';
import { Settings, AccountCircle, Chat, Person } from '@mui/icons-material';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';

function Dashboard() {
    const {user, error, isLoading} = useUser();
    const [open, setOpen] = useState(false);
   

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Bar */}
      <AppBar position="fixed">
        <Toolbar sx ={{justifyContent: 'space-between'}}>
        <Typography variant="h6" noWrap component="div" sx={{ marginLeft: '250px' }}>
            TelehealthAI Dashboard
        </Typography>
          <Button color="inherit">
            <Link href="/chatbox" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
              Logout
            </Link>
          </Button>


        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
        }}
      > 

        <Typography variant='h4'>hello</Typography>
       
        <Toolbar />
        <List>
          {['Settings', 'Account', 'Profile'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>
                {index % 2 === 0 ? <Settings /> : <AccountCircle />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* This toolbar is for spacing below the AppBar */}
        <Grid container spacing={3}>



<Box sx={{
          position: 'absolute',
          left: 225,
          top: 20,
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
            //background: 'linear-gradient(to left, rgba(255,255,255,0), rgba(255,255,255,1))',
          }
        }} />
            <Button
              sx={{marginTop: '375px', marginLeft:'650px'}}  
              variant="contained"
              size="large"
              startIcon={<Chat />}
              href = '/chatbox'
            >
              Talk to TelehealthAI
            </Button>
          {/* </Grid> */}
        </Grid>
      </Box>

      {/* You can add a dialog or modal here for the AI chat interface */}
    </Box>
  );
}

export default Dashboard;