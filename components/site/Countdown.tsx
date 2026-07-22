"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  openAt: string;
  closeAt: string;
  labelOpen: string; // Message when active (e.g. "Submissions close in")
  labelClosed: string; // Message when closed (e.g. "Submissions have closed")
  labelCountdown: string; // Message before open (e.g. "Submissions open in")
}

export function Countdown({
  openAt,
  closeAt,
  labelOpen,
  labelClosed,
  labelCountdown,
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  } | null>(null);
  const [status, setStatus] = useState<"upcoming" | "active" | "ended">("upcoming");

  useEffect(() => {
    const openTime = new Date(openAt).getTime();
    const closeTime = new Date(closeAt).getTime();

    const updateTimer = () => {
      const now = Date.now();

      let targetTime = 0;
      if (now < openTime) {
        setStatus("upcoming");
        targetTime = openTime;
      } else if (now < closeTime) {
        setStatus("active");
        targetTime = closeTime;
      } else {
        setStatus("ended");
        setTimeLeft(null);
        return;
      }

      const diff = targetTime - now;
      if (diff <= 0) {
        updateTimer();
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [openAt, closeAt]);

  if (status === "ended") {
    return (
      <div className="text-center p-6 rounded-md bg-brand-surface border border-brand-brown-deep shadow-black/40">
        <p className="font-heading text-lg text-brand-gold font-medium">{labelClosed}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-sans text-brand-white/80 text-sm font-semibold tracking-wider uppercase text-center">
        {status === "upcoming" ? labelCountdown : labelOpen}
      </p>

      {timeLeft && (
        <div className="flex gap-2 sm:gap-3">
          {[
            { label: "DAYS", val: timeLeft.days },
            { label: "HOURS", val: timeLeft.hours },
            { label: "MINS", val: timeLeft.minutes },
            { label: "SECS", val: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-md bg-brand-surface border border-brand-brown-deep shadow-black/40">
                <span className="font-mono text-brand-gold text-2xl sm:text-3xl font-semibold">
                  {item.val}
                </span>
              </div>
              <span className="font-sans text-[10px] text-brand-white/40 font-semibold tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
