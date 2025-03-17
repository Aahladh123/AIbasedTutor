import React, { useState } from 'react';
import axios from 'axios';

const AiTutorLMS = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [transcript, setTranscript] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);

    // Extract YouTube Video ID Function
    const extractVideoId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const handleTranscribe = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5001/api/transcribe', { videoUrl });
            setTranscript(response.data.transcript);
        } catch (error) {
            if(error.response){
                console.error('Error response: ',error.response.data);
            }else if(error.request){
                console.error('No response received: ',error.request);
            }else{
                console.error('Error setting up request: ',error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleQuestion = async () => {
        setLoading(true);
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            console.error('Invalid YouTube URL');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5001/api/ask', {
                videoId,
                question,
            });
            setAnswer(response.data.answer);
        } catch (error) {
            if (error.response) {
                console.error('Error response:', error.response.data);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error setting up request:', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">AI Tutor LMS</h1>
           
            {/* YouTube Video URL Input */}
            <input
                type="text"
                placeholder="Enter YouTube Video URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full p-2 rounded border mb-4"
            />
            <button onClick={handleTranscribe} disabled={loading} className="w-full p-2 bg-blue-500 text-white rounded">
                {loading ? 'Transcribing...' : 'Transcribe Video'}
            </button>

            {/* Display Transcript */}
            {transcript && (
                <div className="mt-4 p-4 border rounded">
                    <h2 className="text-xl font-semibold">Transcript:</h2>
                    <p className="mt-2 whitespace-pre-wrap">{transcript}</p>
                </div>
            )}

            {/* Question Input */}
            {transcript && (
                <div className="mt-4">
                    <input
                        type="text"
                        placeholder="Ask a question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="w-full p-2 rounded border mb-2"
                    />
                    <button onClick={handleQuestion} disabled={loading} className="w-full p-2 bg-green-500 text-white rounded">
                        {loading ? 'Processing...' : 'Get Answer'}
                    </button>
                </div>
            )}

            {/* Display Answer */}
            {answer && (
                <div className="mt-4 p-4 border rounded">
                    <h2 className="text-xl font-semibold">Answer:</h2>
                    <p className="mt-2 whitespace-pre-wrap">{answer.parts[0].text}</p>
                </div>
            )}
        </div>
    );
};

export default AiTutorLMS;
