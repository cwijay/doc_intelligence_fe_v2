// EMERGENCY TOKEN DEBUGGING - Run this in browser console
// Copy and paste this entire function into browser console and run: debugCurrentToken()

function debugCurrentToken() {
  console.log('🚨 TOKEN DEBUG START 🚨');
  
  // Get token from localStorage directly
  const token = localStorage.getItem('biz_to_bricks_token');
  const refreshToken = localStorage.getItem('biz_to_bricks_refresh_token');
  const user = localStorage.getItem('biz_to_bricks_user');
  
  console.log('Raw localStorage data:');
  console.log('- Token exists:', !!token);
  console.log('- Refresh token exists:', !!refreshToken);
  console.log('- User data exists:', !!user);
  
  if (token) {
    console.log('FULL TOKEN:', token);
    console.log('Token length:', token.length);
    
    try {
      // Decode the token manually
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log('Decoded payload:', payload);
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Current time:', new Date());
        console.log('Is expired:', payload.exp < Math.floor(Date.now() / 1000));
      }
    } catch (e) {
      console.log('Error decoding token:', e);
    }
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User data:', userData);
    } catch (e) {
      console.log('Error parsing user data:', e);
    }
  }
  
  console.log('🚨 TOKEN DEBUG END 🚨');
  
  // Test the token with a direct fetch call
  if (token) {
    console.log('🚨 TESTING TOKEN WITH DIRECT FETCH 🚨');
    fetch('http://localhost:8000/api/v1/organizations/GUbmPT49OSDO3eFDU2r5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Direct fetch response:', response.status, response.statusText);
      return response.json();
    })
    .then(data => {
      console.log('Direct fetch data:', data);
    })
    .catch(error => {
      console.log('Direct fetch error:', error);
    });
  }
}

// Auto-run if pasted in console
if (typeof window !== 'undefined') {
  console.log('🔍 Token debugging function ready. Run: debugCurrentToken()');
  debugCurrentToken();
}