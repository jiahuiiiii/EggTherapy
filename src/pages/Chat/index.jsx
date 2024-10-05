import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import InputBox from "./components/InputBox";
import { Icon } from '@iconify/react';
import { Link } from "react-router-dom";
import { useSpeechRecognition } from 'react-speech-kit';


const ChatGPTComponent = () => {
    const [message, setMessage] = useState("");
    const containerRef = useRef(null);
    const [response, setResponse] = useState("");
    const [chatHistory, setChatHistory] = useState([]); // State to store the chat history
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const handleScroll = () => {
        const container = containerRef.current;
        if (container) {
            // Calculate if the user is at the bottom
            const isUserAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
            setIsAtBottom(isUserAtBottom);
        }
    };
    useEffect(() => {
        // If the user is at the bottom, scroll down when new messages arrive
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
    // Function to handle text-to-speech
    const textToSpeech = async (text) => {
        const apiUrl = 'http://localhost:3001/text-to-speech';
        const apiKey = ''; // Replace with your actual API key
    
        try {
            const response = await axios.post(apiUrl, {
                text: text,
                voice: "en_us_male" // Adjust as per your requirements
            });
    
            console.log(response.data); // Handle the response
        } catch (error) {
            console.error("Error with text-to-speech:", error);
        }
    };


    // Call ChatGPT API
    const callChatGPT = async () => {
        setLoading(true);
        setResponse("");

        const apiKey = 'sk-xWl5CCRDcHqQUqi8vmV1wNppa55VQyVPKb3znQ-bMST3BlbkFJCUvJlgRCoK1BRIUow67N6IIAB4XAAPrnOQHoey6vQA'; // Store API key securely!
        const apiUrl = "https://api.openai.com/v1/chat/completions";

        // Prepare messages for the API
        const messages = [
            { role: "system", content: "You are a compassionate and empathetic therapist." },
            ...chatHistory.map(chat => [
                { role: "user", content: chat.message },
                { role: "assistant", content: chat.response }
            ]).flat(),
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

            const data = await res.json();
            const chatResponse = data.choices[0].message.content;

            // Update response and chat history
            setResponse(chatResponse);
            const newChatHistory = [...chatHistory, { message, response: chatResponse }];
            setChatHistory(newChatHistory);
            localStorage.setItem('chatHistory', JSON.stringify(newChatHistory)); // Save to localStorage
            await textToSpeech(chatResponse);
            setLoading(false);
        } catch (error) {
            console.error("Error connecting to ChatGPT API:", error);
            setLoading(false);
        }
    };

    return (
        <div className="w-full justify-center items-center flex relative">
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
                    <div className="flex flex-row gap-3 items-center">
                        <span className="text-sm text-[#FEFAE0]">mode switch:</span>
                        <label className='switch'>
                            <input type="checkbox" />
                            <span className='slider round'></span>
                        </label>
                    </div>
                    <Icon icon="carbon:user-avatar-filled-alt" className="text-[#FEFAE0] w-8 h-8" />
                </div>
            </div>

            {/* Main Content */}
            <div className='w-1/2 justify-between flex flex-col'>
                {/* Display Chat History */}
                <div
                    className="text-white bg-[#626F47] overflow-y-scroll p-4 rounded-md mb-4 h-96 relative flex flex-col "
                    onScroll={handleScroll} // Corrected here
                    ref={containerRef}
                >
                    {chatHistory.length > 0 ? (
                        chatHistory.map((chat, index) => (
                            <div key={index} className="mb-2">
                                <div className="flex justify-end">
                                    <div className="p-2 rounded-lg max-w-xs bg-[#FEFAE0] text-[#866340]">
                                        {chat.message}
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="p-2 rounded-lg max-w-xs bg-[#866340] text-[#FEFAE0]">
                                        {chat.response}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        "No chat history yet"
                    )}
                    {
                        isAtBottom ? '':(
                            <button className="fixed left-1/2 flex bg-[F2EED7] p-1 rounded-full" onClick={
                                ()=>{
                                    const container = containerRef.current;
                                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                                }
                                }>
                                <Icon icon="akar-icons:arrow-right" className="text-2xl te" rotate={1} />
                            </button>
                        )
                    }
                </div>
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
