'use client'

import { useState } from 'react';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Button, Grid, Box } from '@mui/material';
import { Settings, AccountCircle, Chat } from '@mui/icons-material';
import Link from 'next/link';

function Dashboard() {
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
        <Toolbar />
        <List>
          {['Settings', 'Account'].map((text, index) => (
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
          {/* Middle graphic */}
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 300, bgcolor: 'grey.300', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              Middle Graphic Placeholder
            </Box>
          </Grid>

          {/* Right side graphic */}
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 300, bgcolor: 'grey.300', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              Right Side Graphic Placeholder
            </Box>
          </Grid>

          {/* AI Chat Button */}
          <Grid item xs={12} sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Chat />}
              href = '/chatbox'
            >
              Talk to TelehealthAI
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* You can add a dialog or modal here for the AI chat interface */}
    </Box>
  );
}

export default Dashboard;