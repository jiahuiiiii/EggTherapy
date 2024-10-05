import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import InputBox from "./components/InputBox";
import { Icon } from '@iconify/react';
import { Link } from "react-router-dom";
import { useSpeechRecognition } from 'react-speech-kit';
import talkVideo from '../../assets/vid/talk.mp4';
import idleVideo from '../../assets/vid/idle.mp4';

const ChatGPTComponent = () => {
    const videoRef = useRef(null);
    const audioRef = useRef(null); // Ref to manage audio
    const [message, setMessage] = useState("");
    const [playing, setPlaying] = useState(null); // Changed from '' to null
    const containerRef = useRef(null);
    const [response, setResponse] = useState("");
    const [chatHistory, setChatHistory] = useState([]); // State to store the chat history
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [backgroundVideo, setBackgroundVideo] = useState(idleVideo); // Default to idle video

    useEffect(() => {
        // Update video source based on audioPlaying state
        const newVideo = audioPlaying ? talkVideo : idleVideo;
        setBackgroundVideo(newVideo);

        if (videoRef.current) {
            videoRef.current.load(); // Reload the video when the source changes
        }
    }, [audioPlaying]);

    const handleBuffer = () => {
        console.log('Video is buffering');
    };

    const handleError = () => {
        console.error('Error loading the video');
    };

    const handleScroll = () => {
        const container = containerRef.current;
        if (container) {
            const isUserAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50; // Added tolerance
            setIsAtBottom(isUserAtBottom);
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setAudioPlaying(false);
        setPlaying(null); // reset playing index
    };

    useEffect(() => {
        const container = containerRef.current;
        if (container && isAtBottom) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    }, [chatHistory, isAtBottom]);

    // Initialize Speech Recognition
    const { listen, listening, stop, supported } = useSpeechRecognition({
        onResult: (result) => {
            setMessage(result);
        },
    });

    // Load chat history from localStorage on component mount
    useEffect(() => {
        const savedChatHistory = localStorage.getItem('chatHistory');
        if (savedChatHistory) {
            setChatHistory(JSON.parse(savedChatHistory));
        }
    }, []);

    // Function to handle text-to-speech with Eleven Labs
    const textToSpeech = async (text, voiceId, index) => {
        try {
            const response = await fetch('http://localhost:3000/api/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, voiceId }),
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioURL = URL.createObjectURL(audioBlob);

                // Pause and reset any existing audio
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current = null;
                }

                // Create new audio instance
                const newAudio = new Audio(audioURL);
                audioRef.current = newAudio;

                // Update state
                setAudioPlaying(true);
                setPlaying(index);

                // Play audio
                newAudio.play();

                // Event listener for when audio ends
                newAudio.addEventListener('ended', () => {
                    setAudioPlaying(false);
                    setPlaying(null);
                    audioRef.current = null;
                });

                // Optional: Handle audio errors
                newAudio.addEventListener('error', (e) => {
                    console.error('Error playing audio:', e);
                    setAudioPlaying(false);
                    setPlaying(null);
                    audioRef.current = null;
                });
            } else {
                console.error('API returned error:', response.statusText);
            }
        } catch (error) {
            console.error('Error calling backend API:', error);
        }
    };

    // Clean up audio on component unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Call ChatGPT API
    const callChatGPT = async () => {
        setLoading(true);
        setResponse("");

        const apiKey = 'sk-xWl5CCRDcHqQUqi8vmV1wNppa55VQyVPKb3znQ-bMST3BlbkFJCUvJlgRCoK1BRIUow67N6IIAB4XAAPrnOQHoey6vQA'; // Ensure you store API keys securely!
        const apiUrl = "https://api.openai.com/v1/chat/completions";

        const messages = [
            { role: "system", content: "You are a compassionate and empathetic therapist." },
            ...chatHistory.flatMap(chat => ([
                { role: "user", content: chat.message },
                { role: "assistant", content: chat.response }
            ])),
            { role: "user", content: message }
        ];

        try {
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: messages,
                }),
            });

            if (!res.ok) {
                throw new Error(`API Error: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            const chatResponse = data.choices[0].message.content;

            // Update response and chat history
            setResponse(chatResponse);
            const newChatHistory = [...chatHistory, { message, response: chatResponse }];
            setChatHistory(newChatHistory);
            localStorage.setItem('chatHistory', JSON.stringify(newChatHistory)); // Save to localStorage

            // Call Eleven Labs TTS
            await textToSpeech(chatResponse, "XB0fDUnXU5powFXDhCwa", newChatHistory.length - 1);
            setLoading(false);
        } catch (error) {
            console.error("Error connecting to ChatGPT API:", error);
            setLoading(false);
        }
    };

    return (
        <div className="w-full justify-center items-center flex relative h-full">
            {/* Header Section */}
            <div className="fixed top-1 flex justify-between w-full p-4">
                <div className='flex flex-row gap-5 items-center'>
                    <Link to='/'>
                        <button>
                            <div className='flex items-center flex-row gap-3 text-left'>
                                <Icon icon="ph:egg-crack" className="w-12 h-12 text-[#FEFAE0]" />
                                <div className="flex flex-col text-[#FEFAE0]">
                                    <span className='font-bold flex justify-begin'>Eggsperience</span>
                                    <span>Therapy</span>
                                </div>
                            </div>
                        </button>
                    </Link>
                </div>
                <div className="flex flex-row items-center justify-center gap-3">
                    {/* <div className="flex flex-row gap-3 items-center">
                        <span className="text-sm text-[#FEFAE0]">mode switch:</span>
                        <label className='switch'>
                            <input type="checkbox" />
                            <span className='slider round'></span>
                        </label>
                    </div> */}
                    <Icon icon="carbon:user-avatar-filled-alt" className="text-[#FEFAE0] w-12 h-12" />
                </div>
            </div>

            {/* Main Content */}
            <div className='w-3/5 justify-between flex flex-col z-10'>
                <div className="text-white bg-[#626F47] overflow-y-scroll overflow-x-clip p-4 rounded-md mb-4 h-[38rem] relative flex flex-col"
                    onScroll={handleScroll}
                    ref={containerRef}
                >
                    {chatHistory.length > 0 ? (
                        chatHistory.map((chat, index) => (
                            <div key={index} className="mb-2">
                                <div className="flex justify-end">
                                    <div className="p-2 rounded-lg max-w-md bg-[#FEFAE0] text-[#866340]">
                                        {chat.message}
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="p-4 rounded-lg max-w-md bg-[#866340] text-[#FEFAE0] flex flex-col">
                                        <span>{chat.response}</span>
                                        <Icon
                                            icon={!audioPlaying || playing !== index ? "solar:restart-broken" : "mdi:stop"}
                                            className="text-[#FEFAE0] text-xl mt-1 cursor-pointer"
                                            onClick={() => {
                                                if (!audioPlaying || playing !== index) {
                                                    textToSpeech(chat.response, "XB0fDUnXU5powFXDhCwa", index);
                                                } else {
                                                    stopAudio();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-400">No chat history yet</div>
                    )}
                    {
                        !isAtBottom && (
                            <button className="fixed left-1/2 transform -translate-x-1/2  flex bg-[#F2EED7] p-2 rounded-full shadow-lg text-[#626F47]" onClick={() => {
                                const container = containerRef.current;
                                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                            }}>
                                <Icon icon="akar-icons:arrow-right" className="text-2xl" rotate={1} />
                            </button>
                        )
                    }
                </div>
            </div>
            <div className="video-container">
                <video
                    ref={videoRef}
                    src={backgroundVideo}
                    onBuffer={handleBuffer}
                    onError={handleError}
                    autoPlay
                    loop
                    muted
                    className="absolute bottom-0 right-0 w-1/3 h-auto z-0"
                />
            </div>
            {/* InputBox Component for Submission */}
            <InputBox
                SubmitFunc={callChatGPT}
                listen={listen}
                stop={stop}
                speaking={speaking}
                setSpeaking={setSpeaking}
                message={message}
                setMessage={setMessage}
            />
        </div>
    );
};

export default ChatGPTComponent;
