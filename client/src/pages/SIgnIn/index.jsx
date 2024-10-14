import React from "react";
import { Icon } from "@iconify/react";
import CornerVideo from "../conervid.jsx"; // Import the video component
import { signInWithGoogle } from "../../firebase.js";
import { Link } from "react-router-dom";

function EmojioneMonotoneBackArrow(props) {
  return (
    <Link to="/">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 64 64"
        onClick={() => signInWithGoogle()}
        {...props}
      >
        <path
          fill="currentColor"
          d="M3 18L19 2v10h42v12H19v10zm11 28.346C14 42.848 11.308 40 8 40H2v22h6c3.308 0 6-2.848 6-6.348c0-1.84-.748-3.492-1.936-4.652A6.5 6.5 0 0 0 14 46.346M8 58.617H5.125v-5.926H8c1.654 0 3 1.328 3 2.961s-1.346 2.965-3 2.965m0-9.308H5.125v-5.926H8c1.654 0 3 1.33 3 2.963s-1.346 2.963-3 2.963m32 9.308c-1.654 0-3-1.332-3-2.965v-9.307c0-1.633 1.346-2.963 3-2.963s3 1.33 3 2.963h3C46 42.848 43.308 40 40 40s-6 2.848-6 6.346v9.307c0 3.5 2.692 6.348 6 6.348s6-2.848 6-6.348h-3c0 1.632-1.346 2.964-3 2.964M62 40h-3.152l-3.886 9.5H53V40h-3v22h3v-9.5h1.962l3.886 9.5H62l-4.424-11zM27 62h3l-4-22h-5l-3 22h3l.826-6.059h4.072zm-4.713-9.441l1.284-9.416l1.712 9.416z"
        ></path>
      </svg>
    </Link>
  );
}

const SignIn = () => {
  return (
    <div className="flex justify-center items-center flex-col w-full h-full relative">
      <div className="absolute top-0 left-0 p-10">
        <Link to="/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="5em"
            height="5em"
            viewBox="0 0 64 64"
          >
            <path
              fill="#fefae0"
              d="M3 18L19 2v10h42v12H19v10zm11 28.346C14 42.848 11.308 40 8 40H2v22h6c3.308 0 6-2.848 6-6.348c0-1.84-.748-3.492-1.936-4.652A6.5 6.5 0 0 0 14 46.346M8 58.617H5.125v-5.926H8c1.654 0 3 1.328 3 2.961s-1.346 2.965-3 2.965m0-9.308H5.125v-5.926H8c1.654 0 3 1.33 3 2.963s-1.346 2.963-3 2.963m32 9.308c-1.654 0-3-1.332-3-2.965v-9.307c0-1.633 1.346-2.963 3-2.963s3 1.33 3 2.963h3C46 42.848 43.308 40 40 40s-6 2.848-6 6.346v9.307c0 3.5 2.692 6.348 6 6.348s6-2.848 6-6.348h-3c0 1.632-1.346 2.964-3 2.964M62 40h-3.152l-3.886 9.5H53V40h-3v22h3v-9.5h1.962l3.886 9.5H62l-4.424-11zM27 62h3l-4-22h-5l-3 22h3l.826-6.059h4.072zm-4.713-9.441l1.284-9.416l1.712 9.416z"
            ></path>
          </svg>
        </Link>
      </div>
      <div className="flex justify-center items-center flex-col gap-3">
        <Icon icon="ph:egg-crack" className="text-9xl  text-[#FEFAE0]" />
        <h1 className="text-3xl text-[#FEFAE0] font-bold">Sign In</h1>
      </div>
      <div className="flex flex-col gap-3 w-full justify-center items-center mt-5">
        {/* <p className="text-left w-1/4 text-md text-[#FEFAE0]">Email</p>
        <div className="w-1/4 border-[#866340] border-2 rounded-md p-3">
          <input className="w-full bg-[#AFBB89] outline-none text-[#FEFAE0]" />
        </div>
        <p className="text-left w-1/4 text-md text-[#FEFAE0]">Password</p>
        <div className="w-1/4 border-[#866340] border-2 rounded-md p-3">
          <input
            className="w-full bg-[#AFBB89] outline-none text-[#FEFAE0]"
            type="password"
          />
        </div> */}
        <button
          onClick={() => signInWithGoogle()}
          className="text-[#FEFAE0] justify-center hover:gap-6 transition-all flex flex-row items-center gap-2 rounded-md p-6 text-xl font-bold bg-[#866340]"
        >
          <Icon
            icon="icon-park-outline:google"
            className="w-5 h-5 "
            onClick={() => signInWithGoogle()}
          />
          Google
        </button>
      </div>
      {/* Video at the Bottom Right Corner */}
      <CornerVideo /> {/* Using the reusable video component */}
    </div>
  );
};

export default SignIn;
