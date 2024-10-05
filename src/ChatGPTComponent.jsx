import React, { useState } from "react";

const ChatGPTComponent = () => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const callChatGPT = async () => {
    const apiKey = 'sk-xWl5CCRDcHqQUqi8vmV1wNppa55VQyVPKb3znQ-bMST3BlbkFJCUvJlgRCoK1BRIUow67N6IIAB4XAAPrnOQHoey6vQA';
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",  // or gpt-4
          messages: [{ role: "user", content: message }],
        }),
      });

      const data = await res.json();
      setResponse(data.choices[0].message.content);
    } catch (error) {
      console.error("Error connecting to ChatGPT API:", error);
    }
  };

  return (
    <div>
      <h1>ChatGPT Integration</h1>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message..."
      />
      <button onClick={callChatGPT}>Send</button>
      <div>
        <h3>Response:</h3>
        <p>{response}</p>
      </div>
    </div>
  );
};

export default ChatGPTComponent;