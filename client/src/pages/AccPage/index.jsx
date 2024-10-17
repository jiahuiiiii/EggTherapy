import React, { useContext, useState } from "react";
import { doc } from "firebase/firestore";
import { useDocument } from "react-firebase-hooks/firestore";
import { firestore } from "../../firebase";
import { appContext } from "../../App";
import { Icon } from "@iconify/react/dist/iconify.js";
import { signOut } from "../../firebase";
import { Link } from "react-router-dom";
const AccPage = () => {
  const { userData, navigate } = useContext(appContext);
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };
  console.log(userData?.userImage);
  const uid = userData?.uid;
  return (
    <div className="w-full h-full justify-center items-center flex transition-all">
      <div className="w-1/4  rounded-md bg-[#626F47] p-5 flex flex-col  items-center transition-all">
        <div className="w-full">
          <img src={userData?.userImage} className="rounded-full" />
        </div>
        <h1 className="w-full text-left text-[#FEFAE0] font-bold text-2xl mt-2">
          {userData?.userName}
        </h1>
        <button
          onClick={toggleExpand}
          className="flex flex-row w-full justify-between p-2 rounded-md bg-[#505b3a] transition-all text-[#FEFAE0] mt-2 items-center"
        >
          <h1 className="font-semibold">characteristics</h1>
          <Icon icon="ic:sharp-expand-more" className="w-6 h-6" />
        </button>
        {expanded && (
          <div className="w-full bg-[#505b3a] transition-all text-[#FEFAE0] p-4 mt-2 rounded-md">
            {userData?.characteristics?.length >= 0 ? (
              <p>{userData?.characteristics}</p>
            ) : (
              <p>bruh</p>
            )}
          </div>
        )}
        <Link to="/chat" className="w-full">
          <button className="bg-[#FEFAE0] w-full h-11 rounded-md mt-16 flex justify-center items-center gap-3 hover:gap-5 transition-all">
            <p className=" text-[#505b3a] font-semibold">Back to Chat</p>
            <Icon icon="line-md:chat" className="w-6 h-6 text-[#505b3a]" />
          </button>
        </Link>
        <button
          onClick={() => signOut(navigate)}
          className="bg-[#FEFAE0] w-full h-11 rounded-md mt-3 flex justify-center items-center gap-3 hover:gap-5 transition-all"
        >
          <p className=" text-[#505b3a] font-semibold">Sign Out</p>
          <Icon icon="line-md:logout" className="w-6 h-6 text-[#505b3a]" />
        </button>
      </div>
    </div>
  );
};

export default AccPage;
