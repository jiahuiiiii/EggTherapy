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
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import { useDocument } from "react-firebase-hooks/firestore";
import * as faceapi from "face-api.js";

const ChatGPTComponent = () => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const apiKey =
    "sk-xWl5CCRDcHqQUqi8vmV1wNppa55VQyVPKb3znQ-bMST3BlbkFJCUvJlgRCoK1BRIUow67N6IIAB4XAAPrnOQHoey6vQA";
  const [alert, setAlert] = useState(false);
  const [historyEmotion, setHistoryEmotion] = useState([]);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(null);
  const containerRef = useRef(null);
  const [response, setResponse] = useState("");
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [backgroundVideo, setBackgroundVideo] = useState(idleVideo);
  const { userData, navigate, setUserData } = useContext(appContext);
  const uid = userData?.uid;
  const [value, setValue] = useState(null);
  const [vloading, setVloading] = useState(true);
  const buttonScrollRef = useRef(null);
  const cameraRef = useRef();
  const canvasRef = useRef();
  const endOfChatRef = useRef(null);
  const [emotions, setEmotions] = useState([]);
  const [userCharacteristics, setUserCharacteristics] = useState("");

  useEffect(() => {
    loadModels();
    console.log(userData?.userImage);
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

  const handleNewResponse = () => {
    // Increment response count on each new response
    setResponseCount((prevCount) => prevCount + 1);
    //console.log("Response Count:", responseCount);

    // Store characteristics every 20 responses
    if (responseCount >= 9) {
      deduceUserCharacteristics(value?.data()?.chathistory).then(
        (characteristics) => {
          if (characteristics) {
            console.log("User Characteristics:", characteristics);
            saveUserCharacteristics(characteristics); // Call function to save
            setResponseCount(0);
          }
        }
      );
    }
  };

  const saveUserCharacteristics = (characteristics) => {
    if (uid) {
      try {
        updateDoc(doc(firestore, "user", uid), {
          characteristics: characteristics, // Save characteristics in Firebase
        });
        getDoc(doc(firestore, "user", _user.uid)).then((_doc) => {
          setUserData(_doc.data());
        });
        console.log("User characteristics saved successfully");
      } catch (error) {
        console.error("Error saving user characteristics:", error);
      }
    }
  };

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
    // startVideo(); // Start the video after models are loaded
  };

  useEffect(() => {
    setHistoryEmotion((prev) => [...prev, ...emotions]);
  }, [emotions]);

  const toggleCamera = () => {
    if (!cameraOpen) {
      // Open the camera
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((currentStream) => {
          if (cameraRef.current) {
            cameraRef.current.srcObject = currentStream;
            setCameraOpen(true);

            // Ensure video is loaded and dimensions are available
            cameraRef.current.addEventListener("loadedmetadata", () => {
              faceMyDetect(); // Start detection only after video metadata is loaded
            });
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
        });
    } else {
      // Close the camera
      if (cameraRef.current && cameraRef.current.srcObject) {
        let tracks = cameraRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop()); // Stop all video tracks
        cameraRef.current.srcObject = null;
      }
      setCameraOpen(false); // Set camera state to closed
    }
  };

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

      // ... (existing face detection logic)
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

  useEffect(() => {
    const newVideo = audioPlaying ? talkVideo : idleVideo;
    setBackgroundVideo(newVideo);

    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [audioPlaying]);

  const handleBuffer = () => {
    console.log("Video is buffering");
  };

  const handleError = () => {
    console.error("Error loading the video");
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setAudioPlaying(false);
    setPlaying(null);
  };

  const { listen, listening, stop, supported } = useSpeechRecognition({
    onResult: (result) => {
      setMessage(result);
    },
  });

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

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }

        const newAudio = new Audio(audioURL);
        audioRef.current = newAudio;

        setAudioPlaying(true);
        setPlaying(index);

        newAudio.play();

        newAudio.addEventListener("ended", () => {
          setAudioPlaying(false);
          setPlaying(null);
          audioRef.current = null;
        });

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

  const deduceUserCharacteristics = async (chatHistory) => {
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const prompt = `
      You are an AI expert in user analysis. Based on the following chat history, deduce the user's characteristics such as emotional state, communication style, personality traits, and overall mood. 
      Please provide a summary of these characteristics in a sentence.
  
      Chat History:
      ${chatHistory
        .map((chat) => `User: ${chat.message}\nAssistant: ${chat.response}`)
        .join("\n\n")}
    `;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4", // You can change to the appropriate GPT model
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const characteristics = data.choices[0].message.content;
        console.log("Inferred Characteristics:", characteristics);
        return characteristics;
      } else {
        throw new Error(`API Error: ${data.error.message}`);
      }
    } catch (error) {
      console.error("Error inferring user characteristics:", error);
      return null;
    }
  };

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
      handleNewResponse();
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
          <button
            className={`text-[#FEFAE0] mr-8 transition-all p-3 rounded-full ${
              cameraOpen ? "bg-rose-400" : ""
            } `}
            onClick={() => {
              toggleCamera();
            }}
          >
            <Icon icon="solar:camera-bold" className="w-7 h-7" />
          </button>
          <div className="text-[#FEFAE0] font-bold text-xl ">
            {userData?.userName}
          </div>
          <Link to="/acc">
            <button
              onClick={() => {
                //setAlert(true);
              }}
            >
              {userData.userImage ? (
                <img
                  src={userData?.userImage}
                  alt="user"
                  className="w-14 h-14 rounded-full"
                />
              ) : (
                <Icon
                  icon="carbon:user-avatar-filled-alt"
                  className="text-[#FEFAE0] w-12 h-12"
                />
              )}
            </button>
          </Link>
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
