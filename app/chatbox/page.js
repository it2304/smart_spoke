'use client'

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Box, Typography, Paper, Avatar, IconButton, TextField, Button, Switch, CssBaseline, ThemeProvider } from "@mui/material";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme } from '@mui/material/styles';
import { CircularProgress } from "@mui/material";
import { useUser } from "@auth0/nextjs-auth0/client";
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, error, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi, thank you for connecting with SmartHealth. I'm your medical assistant. How can I help you today?`
    }
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [conversationId, setConversationId] = useState(null);
  const [languagePreference, setLanguagePreference] = useState('English');

  useEffect(() => {
    if (user) {
      fetchLanguagePreference();
    }
  }, [user]);

  const fetchLanguagePreference = async () => {
    try {
      const response = await fetch(`/api/user/language?userId=${user.sub}`);
      if (response.ok) {
        const data = await response.json();
        setLanguagePreference(data.languagePreference);
        // Update initial message based on language preference
        setMessages([
          {
            role: 'assistant',
            content: getWelcomeMessage(data.languagePreference)
          }
        ]);
      } else {
        console.error('Failed to fetch language preference');
      }
    } catch (error) {
      console.error('Error fetching language preference:', error);
    }
  };

  const getWelcomeMessage = (lang) => {
    switch (lang) {
      case 'Hindi':
        return 'नमस्ते, TelehealthAI से जुड़ने के लिए धन्यवाद। मैं आपका मेडिकल सहायक हूं। मैं आज आपकी कैसे मदद कर सकता हूं?';
      case 'Bengali':
        return 'হ্যালো, TelehealthAI-এর সাথে যোগাযোগ করার জন্য় ধন্যবাদ। আমি আপনার মেডিকেল সহকারী। আজ আমি আপনাকে কীভাবে সাহায় করতে পারি?';
      default:
        return 'Hi, thank you for connecting with TelehealthAI. I\'m your virtual medical assistant. How can I help you today?';
    }
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#121212' : '#f0f0f0',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2',
        light: darkMode ? '#4b5563' : '#e3f2fd',
      },
      secondary: {
        main: darkMode ? '#f48fb1' : '#dc004e',
        light: darkMode ? '#4a4a4a' : '#fce4ec',
      },
    },
  });

  const messagesEndRef = useRef(null);
  
  const sendMessage = async (e) => {
      if (!message.trim()) return; 

      setMessage('')
      setMessages((messages)=>[
          ...messages,
          { role: 'user', content: message },
          { role: 'assistant', content: '' },
      ])
      setIsLoading(true)

      try {
          const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                  messages: [...messages, { role: 'user', content: message }],
                  conversationId,
                  languagePreference,
                  userId: user?.sub // Include user ID if available
              }),
          });

          if (!response.ok) {
              throw new Error('Network response was not ok')
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const chunk = decoder.decode(value, { stream: true })
              
              // Check if the chunk contains conversation ID
              if (chunk.includes('###CONVERSATION_ID###')) {
                  const [messageChunk, idChunk] = chunk.split('###CONVERSATION_ID###')
                  setConversationId(idChunk.trim())
                  if (messageChunk) {
                      updateLastMessage(messageChunk)
                  }
              } else {
                  updateLastMessage(chunk)
              }
          }
      } catch (error) {
          console.error('Error:', error)
          setMessages((messages) => [
              ...messages,
              { 
                  role: 'assistant', 
                  content: "I'm sorry, but I encountered an error. Please try again later." 
              },
          ])
      } finally {
          setIsLoading(false)
      }
  };

  const updateLastMessage = (chunk) => {
      setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
              ...otherMessages,
              {
                  ...lastMessage,
                  content: lastMessage.content + chunk,
              },
          ]
      })
  }

  const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      // You could add a toast notification here
  };

  const handleKeyPress = (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault()
          sendMessage()
      }
  }

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  useEffect(() => {
      scrollToBottom()
  }, [messages])

  const renderMessage = (message) => (
    <Box>
      <ReactMarkdown
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={tomorrow}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {message.content}
      </ReactMarkdown>
    </Box>
  );
  
  const endConversation = async () => {
      if (!conversationId) return;

      try {
          const response = await fetch('/api/chat/end', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                conversationId,
                userId: user?.sub // Include user ID if available
              }),
          });

          if (response.ok) {
            // Redirect to the dashboard
            router.push('/dashboard');
          } else {
            console.error('Failed to end conversation');
          }
      } catch (error) {
          console.error('Error ending conversation:', error);
      }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Add the faded background image */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 100,
            width: "50%",
            height: "110%",
            backgroundImage: "url(/images/doctor_4x.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1,
            zIndex: 0,
          }}
        />

        {/* Existing content */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: "relative", zIndex: 1 }}>
          <Typography variant="h5"> TelehealthAI ({languagePreference}) </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ ml: 2 }}>
              <Button href="/api/auth/logout" 
                variant="contained" 
                size="small"
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }}>
                Logout
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Chat area */}
        <Paper 
          elevation={3}
          sx={{
            flexGrow: 1,
            width: isMobile ? "100%" : "90%",
            maxWidth: "600px",
            m: 'auto',
            display: "flex",
            flexDirection: "column",
            p: 2,
            overflow: "hidden",
            bgcolor: "background.paper",
            position: "relative",
            zIndex: 1,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <Box sx={{ flexGrow: 1, overflow: "auto", mb: 2 }}>
            {messages.map((message, index) => (
              <Box 
                key={index} 
                sx={{
                  display: "flex",
                  justifyContent: message.role === "assistant" ? "flex-start" : "flex-end",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", maxWidth: "80%" }}>
                  {message.role === "assistant" && (
                    <Avatar sx={{ bgcolor: "primary.main", mr: 1, mt: 1 }}>
                      <SmartToyIcon />
                    </Avatar>
                  )}
                  <Paper 
                    elevation={1}
                    sx={{
                      p: 2,
                      bgcolor: message.role === "assistant" ? "primary.light" : "secondary.light",
                      color: theme.palette.getContrastText(message.role === "assistant" ? theme.palette.primary.light : theme.palette.secondary.light),
                    }}
                  >
                    {renderMessage(message)}
                    <IconButton size="small" onClick={() => copyToClipboard(message.content)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                  {message.role === "user" && (
                    <Avatar sx={{ bgcolor: "secondary.main", ml: 1, mt: 1 }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                </Box>
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button 
                variant="contained" 
                endIcon={<SendIcon />}
                type="submit"
                disabled={isLoading}
              >
                Send
              </Button>
            </Box>
            <Button 
              variant="contained" 
              color="error" 
              onClick={endConversation}
              startIcon={<CallEndIcon />}
              sx={{ 
                alignSelf: 'center',
                borderRadius: '24px', // Rounded corners
                minWidth: '200px', // Minimum width to accommodate text
                height: '48px', // Fixed height
                textTransform: 'none', // Prevent uppercase transformation
                '& .MuiButton-startIcon': {
                  marginRight: 1 // Add some space between icon and text
                }
              }}
            >
              End Conversation
            </Button>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
