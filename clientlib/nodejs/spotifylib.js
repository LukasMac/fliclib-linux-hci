const qs = require('qs');
const axios = require('axios');

const SPOTIFY_WEBAPI_PLAYER_URL = 'https://api.spotify.com/v1/me/player';
const PLAY_URL = `${SPOTIFY_WEBAPI_PLAYER_URL}/play`;
const PAUSE_URL = `${SPOTIFY_WEBAPI_PLAYER_URL}/pause`;
const NEXT_URL = `${SPOTIFY_WEBAPI_PLAYER_URL}/next`;
const PREVIOUS_URL = `${SPOTIFY_WEBAPI_PLAYER_URL}/previous`;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const CLIENT_ID = 'd31e45b5514f45c9a298fcc76263305b';
const CLIENT_SECRET = process.env.CLIENT_SECRET;

var token = 'invalid';

const renewAccessToken = async () => {
  try {
    const response = await axios.request({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': 'Basic ' + (new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')),
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN
      })
    });

    token = response.data.access_token;
    return token;
  } catch (e) {
    return;
  }
}

const callSpotifyWebApi = async (method, url) => {

  const request = async () => {
    try {
      if (token === 'invalid') {
        return false;
      }
      const response = await axios.request({
        method,
        url,
        headers: {
          'Authorization': 'Bearer ' + token
        },
        json: true
      });

      console.log(`Request to ${url} succeded.`);
      return response;
    } catch (e) {
      console.log(`Request to ${url} failed: ${e}`);
      return false;
    }
  }

  const response = await request();
  if (response) {
    return response;
  } else {
    console.log('Spotify: Trying to get new access token...');
    await renewAccessToken();
    return await request();
  }
}

const playPause = async () => {
  const response = await callSpotifyWebApi('get', 'https://api.spotify.com/v1/me/player');
  const isPlaying = response && response.data && response.data.is_playing;

  if (isPlaying) {
    return await callSpotifyWebApi('put', 'https://api.spotify.com/v1/me/player/pause');
  } else {
    return await callSpotifyWebApi('put', 'https://api.spotify.com/v1/me/player/play');
  }
}

const next = async () => {
  return await callSpotifyWebApi('post', NEXT_URL);
}

const previous = async () => {
  return await callSpotifyWebApi('post', 'https://api.spotify.com/v1/me/player/previous');
}

module.exports = {
  playPause: playPause,
  next: next,
  previous: previous,
}
