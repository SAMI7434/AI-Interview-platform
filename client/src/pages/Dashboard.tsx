import React, { useEffect, useState } from "react";
import { getAllInterviews } from "@/api/mockinterview.api";
import { getUser } from "@/api/user.api";
import { useNotification } from "@/components/Notifications/NotificationContext";
import { useNavigate } from "react-router-dom";
import InterviewCard from "@/components/InterviewCard";

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const validateLogin = async () => {
      try {
        await getUser();
      } catch {
        addNotification({ id: Date.now().toString(), type: "error", message: "User not Authorized" });
        navigate("/login");
      }
    };
    const fetchInterviews = async () => {
      try {
        const response = await getAllInterviews();
        setInterviews(response);
        setLoading(false);
      } catch {
        addNotification({ id: Date.now().toString(), type: "error", message: "Error fetching interviews" });
      }
    };
    validateLogin();
    fetchInterviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0c10]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Loading your interviews…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 relative overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Gradient background for dark mode */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#10131a] via-[#181c24] to-[#0a0c10]" />

      {/* Fixed left sidebar for interview categories */}
      <aside className="fixed left-0 top-0 h-[50vh] w-[20vw] min-w-[220px] flex flex-col p-4 mt-20 ml-2 z-40 rounded-2xl bg-[#181c24] shadow-2xl border border-[#23272f]" style={{ marginTop: '130px' }}>
        {[
          "Frontend Interview",
          "Backend Interview",
          "Cloud / DevOps Interview",
          "AI / ML Interview",
          "DSA / Coding Interview",
          "HR / Behavioral Interview",
        ].map((label, idx, arr) => (
          <React.Fragment key={label}>
            <button
              className="w-full py-3 px-4 text-left text-gray-300 bg-transparent hover:text-white hover:scale-105 transition-all duration-200 focus:outline-none"
              style={{ letterSpacing: "0.01em" }}
            >
              {label}
            </button>
            {idx < arr.length - 1 && (
              <hr className="border-t border-gray-700/60 mx-2" />
            )}
          </React.Fragment>
        ))}
      </aside>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-10 py-5 border-b border-white/[0.06] backdrop-blur-xl bg-[#10131a]/80 shadow-lg">
        <span className="font-bold text-lg tracking-tight text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
          mock<span className="text-emerald-400">prep</span>
        </span>
        <div className="flex items-center gap-3">
          <button className="text-sm px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200 transition-all">
            Dashboard
          </button>
          <button className="text-sm px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200 transition-all">
            History
          </button>
          <button className="text-sm px-4 py-2 rounded-lg bg-emerald-400 text-[#0a0c10] font-semibold hover:bg-emerald-300 transition-all">
            + New Interview
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-10 py-12" style={{ marginLeft: '22vw' }}>

        {/* Hero */}
        <div className="mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-emerald-400/[0.10] border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 shadow">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            AI Interview Coach
          </div>
          <h1 className="text-5xl font-bold leading-none tracking-tight text-white mb-4 drop-shadow-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
            Practice smarter,<br />
            land your <em className="not-italic text-emerald-400">dream role</em>.
          </h1>
          <p className="text-slate-500 font-light text-base max-w-md leading-relaxed">
            Sharpen your answers with AI-powered mock interviews tailored to your target role and company.
          </p>
          <div className="flex items-center gap-3 mt-7">
            <button
              className="bg-gradient-to-r from-emerald-400 to-green-500 text-[#0a0c10] font-semibold text-sm px-6 py-3 rounded-xl shadow-lg hover:from-emerald-300 hover:to-green-400 hover:-translate-y-1 transition-all duration-200"
              onClick={() => navigate('/start-interview')}
            >
              Start New Interview
            </button>
            <button className="text-slate-300 text-sm px-6 py-3 rounded-xl border border-white/10 hover:border-emerald-400/40 hover:text-emerald-300 transition-all duration-200 bg-white/[0.02] backdrop-blur-sm">
              Browse Questions
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
          {[
            { label: "Total Sessions", value: interviews.length, suffix: "interviews" },
            { label: "Avg. Score", value: "7.4", suffix: "/ 10" },
            { label: "Streak", value: "4", suffix: "days" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-6 bg-white/[0.06] border border-white/[0.10] shadow-xl backdrop-blur-md hover:scale-105 hover:shadow-emerald-400/20 transition-all duration-200">
              <p className="text-xs uppercase tracking-widest text-emerald-300 font-semibold mb-2">{s.label}</p>
              <p className="text-3xl font-bold text-white tracking-tight drop-shadow" style={{ fontFamily: "'Syne', sans-serif" }}>
                {s.value}
                <span className="text-sm text-emerald-400 font-normal ml-2">{s.suffix}</span>
              </p>
            </div>
          ))}
        </div>

        <hr className="border-emerald-400/10 mb-14" />

        {/* Interview Grid */}
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-semibold text-white tracking-tight drop-shadow" style={{ fontFamily: "'Syne', sans-serif" }}>
            Past Interviews
          </h2>
          <span className="text-sm text-emerald-300 cursor-pointer hover:underline">View all →</span>
        </div>

        {interviews.length === 0 ? (
          <div className="text-center py-16 border border-emerald-400/10 rounded-2xl bg-white/[0.03] shadow-inner animate-fade-in">
            <p className="text-slate-400 text-base">No interviews yet — start your first session!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {interviews.map((interview, i) => (
              <InterviewCard key={i} interview={interview} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;