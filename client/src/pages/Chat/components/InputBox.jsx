import React from "react";
import { Icon } from "@iconify/react";
const InputBox = ({
  SubmitFunc,
  listen,
  stop,
  speaking,
  setSpeaking,
  message,
  setMessage,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && message.trim()) {
      event.preventDefault();
      SubmitFunc();
      setMessage("");
    }
  };
  return (
    <div className="fixed z-30 bottom-30 bottom-12 rounded-md bg-[#866340] flex flex-row text-[#FEFAE0] justify-center items-center px-4 py-2 w-3/5 shadow-md">
      {/* <Icon icon="mdi:pin-outline" className="w-6 h-6" /> */}
      <>
        {speaking ? (
          <button
            onClick={() => {
              stop();
              SubmitFunc();
              setMessage("");
              setSpeaking(false);
            }}
          >
            <Icon icon="mdi:stop" className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={() => {
              listen();
              setSpeaking(true);
            }}
          >
            <Icon icon="material-symbols:mic" className="w-6 h-6" />
          </button>
        )}
      </>
      <input
        className="outline-none bg-[#866340] w-full  p-2 "
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        onKeyDown={handleKeyDown}
      />
      <button
        onClick={() => {
          stop();
          SubmitFunc();
          setMessage("");
          setSpeaking(false);
        }}
      >
        <Icon icon="circum:paperplane" className="w-6 h-6" />
      </button>
    </div>
  );
};

export default InputBox;
