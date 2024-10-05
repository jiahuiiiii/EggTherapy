import React from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
const Home = () => {
  return (
    <div className=" flex justify-center items-center">
      <div className="flex flex-col justify-center items-center gap-7 ">
        <div className="flex justify-center items-center flex-col gap-3">
          <Icon icon="ph:egg-crack" className="text-9xl  text-[#FEFAE0]" />
          <h1 className="text-5xl text-[#FEFAE0] font-bold">
            Eggsperience Therapy
          </h1>
        </div>
        <div className="flex flex-row items-center gap-8">
          <Link to="/signin">
          <button className="border-4 flex justify-center items-center px-16 p-3 w-40 border-[#866340] hover:text-[#A6B37D] transistion-all hover:bg-[#866340] rounded-md text-[#866340] font-bold text-xl">
            SignIn
          </button>
          </Link>
          <Link to="/chat">
            <button className="flex flex-row justify-center items-center px-16 p-3 w-40 bg-[#866340] border-[#866340] border-4 rounded-md text-[#A6B37D] font-bold text-xl">
              <div className="flex flex-row items-center gap-2  hover:gap-4 transition-all">
                Start
                <Icon icon="akar-icons:arrow-right" className="text-2xl" />
              </div>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
