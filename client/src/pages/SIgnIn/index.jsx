import React from "react";
import { Icon } from "@iconify/react";
import CornerVideo from '../conervid.jsx'; // Import the video component
import { signInWithGoogle } from "../../firebase.js";

const SignIn = () => {
    return (
        <div className='flex justify-center items-center flex-col w-full h-full relative'>
            {/* Sign-in Icon and Form */}
            <Icon icon="ph:egg-crack" className="text-5xl text-[#FEFAE0]" />
            <h1 className="text-3xl text-[#FEFAE0] font-bold">
                Eggsperience Therapy
            </h1>
            <div className='flex flex-col gap-3 w-full justify-center items-center mt-5'>
                <p className='text-left w-1/4 text-md text-[#FEFAE0]'>Email</p>
                <div className='w-1/4 border-[#866340] border-2 rounded-md p-3'>
                    <input className='w-full bg-[#AFBB89] outline-none text-[#FEFAE0]' />
                </div>
                <p className='text-left w-1/4 text-md text-[#FEFAE0]'>Password</p>
                <div className='w-1/4 border-[#866340] border-2 rounded-md p-3'>
                    <input 
                        className='w-full bg-[#AFBB89] outline-none text-[#FEFAE0]' 
                        type='password' 
                    />
                </div>
                <button className='text-[#FEFAE0] w-1/4 justify-center hover:gap-6 transition-all flex flex-row items-center gap-2 rounded-md p-3 font-bold bg-[#866340]'>
                    <Icon icon="icon-park-outline:google" className='w-5 h-5 ' onClick={()=>signInWithGoogle()} />Google
                </button>
            </div>

            {/* Video at the Bottom Right Corner */}
            <CornerVideo /> {/* Using the reusable video component */}
        </div>
    );
}

export default SignIn;
