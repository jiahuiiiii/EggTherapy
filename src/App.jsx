import React from "react";
import { Icon } from "@iconify/react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import { Link } from "react-router-dom";
import SignIn from "./pages/SignIn";
const App = () => {
  return (
    <div className="h-screen w-full relative bg-[#A6B37D] flex justify-center items-center flex-col">

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path='/signin' element={<SignIn />} />
      </Routes>
    </div>
  );
};

export default App;
