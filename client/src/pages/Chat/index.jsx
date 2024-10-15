import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import InputBox from "./components/InputBox";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useSpeechRecognition } from "react-speech-kit";
import ReactMarkdown from "react-markdown"; // Import react-markdown
import remarkGfm from "remark-gfm"; // Import remark-gfm if using
import removeMarkdown from "remove-markdown";
import talkVideo from "../../assets/vid/talk.mp4";
import idleVideo from "../../assets/vid/idle.mp4";
import { appContext } from "../../App";
import { signOut } from "../../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import { useDocument } from "react-firebase-hooks/firestore";
import * as faceapi from "face-api.js";

const ChatGPTComponent = () => {
  const [alert, setAlert] = useState(false);
  const [historyEmotion, setHistoryEmotion] = useState([]);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(null);
  const containerRef = useRef(null);
  const [response, setResponse] = useState("");

  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [backgroundVideo, setBackgroundVideo] = useState(idleVideo);
  const { userData, navigate } = useContext(appContext);
  const uid = userData?.uid;
  const [value, setValue] = useState(null);
  const [vloading, setVloading] = useState(true);
  const buttonScrollRef = useRef(null);
  const cameraRef = useRef();
  const canvasRef = useRef();
  const endOfChatRef = useRef(null);
  const [emotions, setEmotions] = useState([]);

  useEffect(() => {
    loadModels();
  }, []);

  // Track user scrolling and update if they are at the bottom
  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 50;
      setIsAtBottom(isNearBottom);
    }
  };

  // Scroll to the bottom when new messages are added
  const scrollToBottom = () => {
    if (isAtBottom && endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (uid) {
      const docRef = doc(firestore, "user", uid);
      const unsubscribe = onSnapshot(docRef, (doc) => {
        setValue(doc);
        setVloading(false);
      });
      return unsubscribe;
    }
  }, [userData]);

  useEffect(() => {
    // Auto scroll to the bottom when chat history changes and user is at the bottom
    scrollToBottom();
  }, [value]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((currentStream) => {
        if (cameraRef.current) {
          cameraRef.current.srcObject = currentStream;

          // Ensure video is loaded and dimensions are available
          cameraRef.current.addEventListener("loadedmetadata", () => {
            faceMyDetect(); // Start detection only after video metadata is loaded
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loadModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);
    startVideo(); // Start the video after models are loaded
  };

  useEffect(() => {
    setHistoryEmotion((prev) => [...prev, ...emotions]);
  }, [emotions]);

  const faceMyDetect = () => {
    const detectFaces = async () => {
      if (!cameraRef.current || !cameraRef.current.readyState >= 2) {
        return; // Video is not ready yet
      }

      const detections = await faceapi
        .detectAllFaces(
          cameraRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length > 0) {
        const detectedEmotions = detections.map((detection) => {
          const expressions = detection.expressions;
          const dominantEmotion = Object.keys(expressions).reduce((a, b) =>
            expressions[a] > expressions[b] ? a : b
          );
          return dominantEmotion;
        });
        setEmotions(detectedEmotions);
      }

      const canvas = canvasRef.current;
      const videoWidth = cameraRef.current.videoWidth;
      const videoHeight = cameraRef.current.videoHeight;

      if (videoWidth && videoHeight) {
        const displaySize = { width: videoWidth, height: videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }
      requestAnimationFrame(detectFaces);
    };
    detectFaces();
  };
  useEffect(() => {
    if (buttonScrollRef.current) {
      buttonScrollRef.current.click();
    }
  }, [value]);
  useEffect(() => {
    if (uid) {
      const docRef = doc(firestore, "user", uid);
      const unsubscribe = onSnapshot(docRef, (doc) => {
        setValue(doc);
        setVloading(false);
      });
      return unsubscribe;
    }
  }, [userData]);
  //   const [chatHistory, setChatHistory] = useState(
  //     value?.data().chathistory || []
  //   );
  //   useEffect(() => {
  //     setChatHistory(value?.data().chathistory || []);
  //   }, [value]);
  //   console.log(chatHistory);
  // Ref to track the end of the chat for scrolling

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

  // const handleScroll = () => {
  //   const container = containerRef.current;
  //   if (container) {
  //     const isUserAtBottom =
  //       container.scrollHeight - container.scrollTop <= container.clientHeight; // Added tolerance
  //     setIsAtBottom(isUserAtBottom);
  //   }
  // };
  // const isrefresh =
  //   window.performance.navigation.type === performance.navigation.TYPE_RELOAD;
  // useEffect(() => {
  //   handleScroll();
  // });
  // useEffect(() => {
  //   scrollToBottom();
  // });
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setAudioPlaying(false);
    setPlaying(null); // reset playing index
  };

  // useEffect(() => {
  //   const container = containerRef.current;
  //   setIsAtBottom(false);
  //   if (!isAtBottom) {
  //     container.scrollTo({
  //       top: container.scrollHeight,
  //       behavior: "smooth",
  //     });
  //   }
  //   setIsAtBottom(true);
  // }, [value]);
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
  // const scrollToBottom = () => {
  //   if (endOfChatRef.current) {
  //     endOfChatRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // };

  // Function to handle new messages and scrolls

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
  const [last10Emotions, setLast10Emotions] = useState([]); // State to store the last 10 emotions

  const updateLast10Emotions = (detectedEmotions) => {
    setLast10Emotions((prevEmotions) => {
      const updatedEmotions = [...prevEmotions, ...detectedEmotions].slice(-10);
      return updatedEmotions;
    });
  };

  // Function to find the most frequent emotion in the last 10 emotions

  const callChatGPT = async () => {
    if (!message.trim()) return; // Prevent empty messages
    updateLast10Emotions(historyEmotion); // Update the last 10 emotions// Update the most frequent emotion
    let mostFrequent;

    if (last10Emotions.length >= 10) {
      const emotionCounts = last10Emotions.reduce((acc, emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {});

      mostFrequent = Object.keys(emotionCounts).reduce((a, b) =>
        emotionCounts[a] > emotionCounts[b] ? a : b
      );
    } else if (historyEmotion.length > 0) {
      const emotionCounts = historyEmotion.reduce((acc, emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {});

      mostFrequent = Object.keys(emotionCounts).reduce((a, b) =>
        emotionCounts[a] > emotionCounts[b] ? a : b
      );
    } else {
      mostFrequent = "neutral";
    }
    setLoading(true);
    setResponse("");

    const apiKey =
      "sk-xWl5CCRDcHqQUqi8vmV1wNppa55VQyVPKb3znQ-bMST3BlbkFJCUvJlgRCoK1BRIUow67N6IIAB4XAAPrnOQHoey6vQA"; // **Important:** Move this to a secure location
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const messages = [
      {
        role: "system",
        content: `You are a compassionate and empathetic therapist. Speak with a calm, understanding tone and ask open-ended questions that encourage reflection. Use gentle affirmations and acknowledge feelings. Offer short, conversational, and human-like responses that convey genuine concern and support. Adapt your responses to show active listening and avoid rushing the conversation. This guy is very ${mostFrequent} `,
      },
      ...value?.data()?.chathistory?.flatMap((chat) => [
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
          model: "gpt-4o",
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
        ...(value?.data()?.chathistory || []),
        { message, response: fullResponse, emotions: mostFrequent },
      ];
      //   setChatHistory(newChatHistory);
      uploadChatHistory(newChatHistory);
      localStorage.setItem("chatHistory", JSON.stringify(newChatHistory)); // Save to localStorage

      const plainText = removeMarkdown(fullResponse);

      textToSpeech(
        plainText,
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
      <div className="">
        <video className="w-96 h-96 hidden" ref={cameraRef} autoPlay />
      </div>
      <canvas ref={canvasRef} className="w-96 h-96 hidden" />
      {alert && (
        <div className="top-2 fixed z-50 rounded-md flex flex-row p-2 gap-3  w-1/3 justify-center items-center bg-[#626F47]">
          <Icon
            icon="rivet-icons:exclamation-mark-circle"
            className="text-rose-600 text-2xl "
          />
          <button
            className="w-1/4 p-3 bg-[#FEFAE0] rounded-md text-[#626F47] flex flex-row items-center justify-center gap-1 hover:gap-3 transition-all"
            onClick={() => {
              signOut(navigate);
              setAlert(false);
            }}
          >
            <Icon icon="material-symbols:logout" className="text-red-500" />
            Logout
          </button>
          <button
            className="w-1/4 p-3 bg-[#FEFAE0] rounded-md text-[#626F47] flex flex-row items-center justify-center gap-1 hover:gap-3 transition-all"
            onClick={() => setAlert(false)}
          >
            <Icon icon="iconoir:xmark-circle" className="text-red-500" />
            Cancel
          </button>
        </div>
      )}
      {/* Header Section */}
      <InputBox
        className="z-5"
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
          <div className="text-[#FEFAE0] font-bold text-xl">
            {userData?.userName}
          </div>
          <button onClick={() => setAlert(true)}>
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
            value?.data()?.chathistory?.map((chat, index) => (
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
                            "a0euEDMIIr9cUObJf0DX",
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
            <div className="p-2">loading...</div>
          ) : (
            <div className="text-center text-gray-400">No chat history yet</div>
          )}
          {!isAtBottom && (
            <button
              ref={buttonScrollRef}
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
