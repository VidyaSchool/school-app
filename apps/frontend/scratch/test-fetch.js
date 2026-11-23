// scratch/test-fetch.js
const url = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
console.log("Testing fetch to:", url + '/api/auth/get-session');
fetch(url + '/api/auth/get-session')
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(text => console.log("Response:", text))
  .catch(err => {
    console.error("Fetch failed!");
    console.error(err);
    console.error("Cause:", err.cause);
  });
