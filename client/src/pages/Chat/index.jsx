import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import InputBox from "./components/InputBox";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useSpeechRecognition } from "react-speech-kit";
import ReactMarkdown from "react-markdown"; // Import react-markdown
import remarkGfm from "remark-gfm"; // Import remark-gfm if using
import talkVideo from "../../assets/vid/talk.mp4";
import idleVideo from "../../assets/vid/idle.mp4";
import { appContext } from "../../App";
import { signOut } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import { useDocument } from "react-firebase-hooks/firestore";

const ChatGPTComponent = () => {
  const videoRef = useRef(null);
  const audioRef = useRef(null); // Ref to manage audio
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(null); // Changed from '' to null
  const containerRef = useRef(null);
  const [response, setResponse] = useState("");
  //   const [chatHistory, setChatHistory] = useState([]); // State to store the chat history
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [backgroundVideo, setBackgroundVideo] = useState(idleVideo); // Default to idle video
  const { userData, navigate } = useContext(appContext);
  const uid = "vldJ5N8kKpVJ3tX1pLRNiMPNIWD2";
  const [value, vloading] = uid
    ? useDocument(doc(firestore, "user", uid))
    : [null, false];

  const [chatHistory, setChatHistory] = useState(
    value?.data().chathistory || []
  );
  useEffect(() => {
    setChatHistory(value?.data().chathistory || []);
  }, [value]);
  console.log(chatHistory);
  // Ref to track the end of the chat for scrolling
  const endOfChatRef = useRef(null);

  useEffect(() => {
    // Update video source based on audioPlaying state
    const newVideo = audioPlaying ? talkVideo : idleVideo;
    setBackgroundVideo(newVideo);

    if (videoRef.current) {
      videoRef.current.load(); // Reload the video when the source changes
    }
  }, [audioPlaying]);

  const handleBuffer = () => {
    console.log("Video is buffering");
  };

  const handleError = () => {
    console.error("Error loading the video");
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const isUserAtBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 50; // Added tolerance
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
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [chatHistory, isAtBottom]);

  // Initialize Speech Recognition
  const { listen, listening, stop, supported } = useSpeechRecognition({
    onResult: (result) => {
      setMessage(result);
    },
  });

  //   // Load chat history from localStorage on component mount
  //   useEffect(() => {
  //     const savedChatHistory = localStorage.getItem("chatHistory");
  //     if (savedChatHistory) {
  //       setChatHistory(JSON.parse(savedChatHistory));
  //     }

  //     // Scroll to bottom on initial load
  //     scrollToBottom();
  //   }, []);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Function to handle new messages and scroll
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, response]);

  // Function to handle text-to-speech with Eleven Labs
  const textToSpeech = async (text, voiceId, index) => {
    try {
      const response = await fetch("http://localhost:3000/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        newAudio.addEventListener("ended", () => {
          setAudioPlaying(false);
          setPlaying(null);
          audioRef.current = null;
        });

        // Optional: Handle audio errors
        newAudio.addEventListener("error", (e) => {
          console.error("Error playing audio:", e);
          setAudioPlaying(false);
          setPlaying(null);
          audioRef.current = null;
        });
      } else {
        console.error("API returned error:", response.statusText);
      }
    } catch (error) {
      console.error("Error calling backend API:", error);
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
  const uploadChatHistory = (newChatHistory) => {
    if (userData) {
      updateDoc(doc(firestore, "user", uid), {
        chathistory: newChatHistory,
      });
    }
  };
  // Call ChatGPT API with Streaming and Markdown Support
  const callChatGPT = async () => {
    if (!message.trim()) return; // Prevent empty messages

    setLoading(true);
    setResponse("");

    const apiKey =
      "sk-xWl5CCRDcHqQUqi8vmV1wNppa55VQyVPKb3znQ-bMST3BlbkFJCUvJlgRCoK1BRIUow67N6IIAB4XAAPrnOQHoey6vQA"; // **Important:** Move this to a secure location
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const messages = [
      {
        role: "system",
        content:
          "You are a compassionate and empathetic therapist. Speak with a calm, understanding tone and ask open-ended questions that encourage reflection. Use gentle affirmations and acknowledge feelings. Offer short, conversational, and human-like responses that convey genuine concern and support. Adapt your responses to show active listening and avoid rushing the conversation.",
      },
      ...chatHistory.flatMap((chat) => [
        { role: "user", content: chat.message },
        { role: "assistant", content: chat.response },
      ]),
      { role: "user", content: message },
    ];

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-2024-07-18",
          messages: messages,
          stream: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let doneReading = false;
      let fullResponse = "";
      let buffer = ""; // Initialize buffer

      while (!doneReading) {
        const { value, done } = await reader.read();
        doneReading = done;
        const chunkValue = decoder.decode(value, { stream: true });
        buffer += chunkValue;

        // Split buffer into lines
        const lines = buffer.split("\n");

        // Keep the last partial line in the buffer
        buffer = lines.pop();

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const message = trimmedLine.replace(/^data: /, "");
            if (message === "[DONE]") {
              doneReading = true;
              break;
            }
            try {
              const parsed = JSON.parse(message);
              const content = parsed.choices[0].delta.content;
              if (content) {
                fullResponse += content;
                setResponse(fullResponse); // Update response incrementally
              }
            } catch (error) {
              console.error(
                "Error parsing stream message:",
                error,
                "Line:",
                message
              );
              // Optionally, you can reset the buffer or handle the error as needed
            }
          }
        }
      }

      // After the full response is received
      const newChatHistory = [
        ...chatHistory,
        { message, response: fullResponse },
      ];
      //   setChatHistory(newChatHistory);
      uploadChatHistory(newChatHistory);
      localStorage.setItem("chatHistory", JSON.stringify(newChatHistory)); // Save to localStorage

      // Call Eleven Labs TTS, if necessary
      textToSpeech(
        fullResponse,
        "a0euEDMIIr9cUObJf0DX",
        newChatHistory.length - 1
      );
      setLoading(false);
      setMessage(""); // Clear input after sending
    } catch (error) {
      console.error("Error connecting to ChatGPT API:", error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full justify-center items-center flex relative h-full">
      {/* Header Section */}
      <InputBox
        SubmitFunc={callChatGPT}
        listen={listen}
        stop={stop}
        speaking={speaking}
        setSpeaking={setSpeaking}
        message={message}
        setMessage={setMessage}
      />
      <div className="fixed top-1 flex justify-between w-full p-4 z-20">
        <div className="flex flex-row gap-5 items-center">
          <Link to="/">
            <button>
              <div className="flex items-center flex-row gap-3 text-left">
                <Icon
                  icon="ph:egg-crack"
                  className="w-12 h-12 text-[#FEFAE0]"
                />
                <div className="flex flex-col text-[#FEFAE0]">
                  <span className="font-bold flex justify-begin">
                    Eggsperience
                  </span>
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
          {/* <Icon
            icon="carbon:user-avatar-filled-alt"
            className="text-[#FEFAE0] w-12 h-12"
          /> */}
          <button onClick={() => signOut(navigate)}>
            <img
              src={userData?.userImage}
              alt="user"
              className="w-14 h-14 rounded-full"
            />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-3/5 justify-between flex flex-col z-10">
        <div
          className="text-white bg-[#626F47] overflow-y-scroll overflow-x-clip p-4 rounded-md mb-4 h-[38rem] relative flex flex-col"
          onScroll={handleScroll}
          ref={containerRef}
        >
          <div className="flex justify-start">
            <div className="p-4 rounded-lg max-w-md bg-[#866340] text-[#FEFAE0] flex flex-col">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                Hello! I am here to listen to you. How are you doing today?
              </ReactMarkdown>
            </div>
          </div>

          {value ? (
            chatHistory.map((chat, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-end">
                  <div className="p-2 rounded-lg max-w-md bg-[#FEFAE0] text-[#866340]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {chat.message}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="p-4 rounded-lg max-w-md bg-[#866340] text-[#FEFAE0] flex flex-col">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {chat.response}
                    </ReactMarkdown>
                    <Icon
                      icon={
                        !audioPlaying || playing !== index
                          ? "solar:restart-broken"
                          : "mdi:stop"
                      }
                      className="text-[#FEFAE0] text-xl mt-1 cursor-pointer"
                      onClick={() => {
                        if (!audioPlaying || playing !== index) {
                          textToSpeech(
                            chat.response,
                            "XB0fDUnXU5powFXDhCwa",
                            index
                          );
                        } else {
                          stopAudio();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : vloading ? (
            <div>loaind..</div>
          ) : (
            <div className="text-center text-gray-400">No chat history yet</div>
          )}
          {!isAtBottom && (
            <button
              className="fixed left-1/2 transform -translate-x-1/2 flex bg-[#F2EED7] p-2 rounded-full shadow-lg text-[#626F47]"
              onClick={() => {
                const container = containerRef.current;
                container.scrollTo({
                  top: container.scrollHeight,
                  behavior: "smooth",
                });
              }}
            >
              <Icon
                icon="akar-icons:arrow-right"
                className="text-2xl"
                rotate={1}
              />
            </button>
          )}
          {/* Ref to scroll into view */}
          <div ref={endOfChatRef} />
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
    </div>
  );
};

export default ChatGPTComponent;
