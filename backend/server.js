const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const Transcript = require('./models/Transcript');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const {GoogleGenerativeAI} = require("@google/generative-ai");

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors({origin: 'http://localhost:3000'}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/ai_tutor_lms')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
  });

// Extract YouTube Video ID Function
const extractVideoId = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// Route: Transcribe Video
app.post('/api/transcribe', async (req, res) => {
    const { videoUrl } = req.body;
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        console.log('Received transcription request:', req.body);
        const existingTranscript = await Transcript.findOne({ videoId });
        if (existingTranscript) {
            return res.json({ transcript: existingTranscript.transcript });
        }
       
        // Simulating transcription (replace with actual transcription logic)
        // Fetch video details from YouTube API
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${YOUTUBE_API_KEY}`;

        const youtubeResponse = await axios.get(youtubeApiUrl);
        const videoTitle = youtubeResponse.data.items[0]?.snippet?.title || 'Unknown Title';

        // Save to MongoDB with video title
        const transcript = `Transcription for video: ${videoTitle}`;
        await Transcript.create({ videoId, title: videoTitle, transcript,cachedAt: new Date() });

        res.json({ transcript, title: videoTitle });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to transcribe video' });
    }
});

// Route: Answer Questions
app.post('/api/ask', async (req, res) => {
    const { videoId, question } = req.body;

    try {
        console.log("Received request for videoId:", videoId);
        const transcriptData = await Transcript.findOne({ videoId });
        if (!transcriptData) {
            return res.status(404).json({ error: 'Transcript not found' }   );
        }

        const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model=genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt=  `Based on this transcript: ${transcriptData.transcript}, answer the question: ${question}`;
        console.log("Prompt: ",prompt);

        const result= await model.generateContent(prompt);
        const responseText= result?.response?.candidates?.[0]?.content || "No response";

        console.log("AI Response:", responseText);
        res.json({ answer: responseText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process question' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
