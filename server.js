const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  // TODO: Paste your bias-tracker.js logic here and format the output as needed
  res.send("Bias live output yahan aayega");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
