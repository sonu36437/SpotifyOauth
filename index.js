const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI
} = process.env;

const generateRandomString = length => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

app.get('/login', (req, res) => {
  const state = generateRandomString(16);
const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
  ];
  const scope = scopes.join(' ');


  const queryParams = querystring.stringify({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString('base64'),
        },
      }
    );

    console.log(response.data);
    
    const { access_token, refresh_token } = response.data;
    console.log(access_token,refresh_token);
    res.redirect('https://spotify-oauth-pi.vercel.app/callback/success?access_token='+access_token+'&refresh_token='+refresh_token);
    // res.redirect('http://localhost:3000/callback/success')
    

    // res.json({
    //   access_token,
    //   refresh_token,
    // });
  } catch (error) {
    console.error('Error exchanging code for token:', error.response.data);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});
app.get('/callback/success', (req, res) => {
  const { access_token, refresh_token, expires_in } = req.query;

  console.log('Access Token:', access_token);
  console.log('Refresh Token:', refresh_token);


  res.send(`
    <h2>Spotify Auth Success!</h2>
    <p><strong>Access Token:</strong> ${access_token}</p>
    <p><strong>Refresh Token:</strong> ${refresh_token}</p>
  `);
});



    

  


// app.listen(3000, () => {
//   console.log('✅ Server running on http://localhost:3000');
// });
app.get('/refresh_token', async (req, res) => {
  const refresh_token = req.query.refresh_token;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Missing refresh_token' });
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
        },
      }
    );

    const { access_token, expires_in } = response.data;

    res.json({
      access_token,
      expires_in,
    });
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Refresh token failed' });
  }
});

app.listen(3000,'192.168.223.179', () => {
  console.log('✅ Server running on http://192.168.223.179:3000');
});
