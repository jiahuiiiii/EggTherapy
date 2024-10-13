import React, { useEffect, useState, createContext } from "react";
import { Icon } from "@iconify/react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import { Link } from "react-router-dom";
import SignIn from "./pages/SignIn";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { firestore } from "./firebase";

export const appContext = createContext({
  user: null,
  userData: {},
  navigate: () => {},
  uid: null,
});

const App = () => {
  const navigate = useNavigate();
  const [uid, setUid] = useState(null);
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState();
  const [userData, setUserData] = useState({});
  useEffect(() => {
    onAuthStateChanged(auth, (_user) => {
      if (_user) {
        setUser(_user);
        navigate("/chat");
        getDoc(doc(firestore, "user", _user.uid)).then((_doc) => {
          setUserDoc(_doc);
          setUserData(_doc.data());
        });
      } else {
        setUser(null);
      }
    });
  }, []);
  return (
    <appContext.Provider value={{ user, userData, navigate, uid }}>
      <div className="h-screen w-full relative bg-[#AFBB89] flex justify-center items-center flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/signin" element={<SignIn />} />
        </Routes>
      </div>
    </appContext.Provider>
  );
};

export default App;
