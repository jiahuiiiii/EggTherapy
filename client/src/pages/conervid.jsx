import React, { useRef } from "react";

// Ensure you have the correct path to your video file
import backgroundVideo from "../assets/vid/idle.mp4"; // Adjust the path as needed

const CornerVideo = () => {
  const videoRef = useRef(null);


  const handleError = (error) => {
    console.error("Video Error:", error);
  };

  return (
    <video
      ref={videoRef}
      src={backgroundVideo}
      onError={handleError}
      autoPlay
      loop
      muted
      className="absolute bottom-0 right-0 w-1/3 h-auto"
    />
  );
};

export default CornerVideo;
