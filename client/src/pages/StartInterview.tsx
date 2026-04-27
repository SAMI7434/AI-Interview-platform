import React from "react";

const StartInterview: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#10131a] via-[#181c24] to-[#0a0c10] text-white">
      <div className="bg-[#181c24] border border-[#23272f] rounded-2xl shadow-2xl p-10 w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Start a New Interview</h1>
        <p className="text-slate-400 mb-8 text-center">Select your interview type and get started with AI-powered mock questions tailored to your needs.</p>
        <form className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-slate-300">Interview Type</span>
            <select className="bg-[#23272f] border border-[#2d323c] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option>Frontend Interview</option>
              <option>Backend Interview</option>
              <option>Cloud / DevOps Interview</option>
              <option>AI / ML Interview</option>
              <option>DSA / Coding Interview</option>
              <option>HR / Behavioral Interview</option>
            </select>
          </label>
          <button type="submit" className="mt-4 bg-gradient-to-r from-emerald-400 to-green-500 text-[#0a0c10] font-semibold text-lg px-6 py-3 rounded-xl shadow-lg hover:from-emerald-300 hover:to-green-400 transition-all duration-200">
            Start Interview
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartInterview;
