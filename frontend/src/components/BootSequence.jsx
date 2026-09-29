import { useEffect, useRef, useState } from "react";

const LINES = [
  { s: "OK", t: "Entering non-interactive startup" },
  { s: "OK", t: "Applying INTEL CPU microcode update" },
  { s: "OK", t: "Checking for hardware changes" },
  { s: "OK", t: "Bringing up interface eth0" },
  { s: "OK", t: "Determining IP information for eth0... done" },
  { s: "OK", t: "Connecting to backend service" },
  { s: "OK", t: "Connected to backend service" },
  { s: "OK", t: "Finding blog database services" },
  { s: "OK", t: "Services found on port 27017" },
  { s: "OK", t: "Establishing connection to the database" },
  { s: "OK", t: "Connection established" },
  { s: "OK", t: "Reading blog index" },
  { s: "OK", t: "Fetching posts" },
  { s: "OK", t: "Data acquired" },
  { s: "OK", t: "Finding other resources" },
  { s: "OK", t: "Loading images" },
  { s: "OK", t: "Loading content" },
  { s: "OK", t: "Page rendered" },
  { s: "OK", t: "Starting display manager" },
  { s: "OK", t: "WELCOME TO n0ct.log v2.0.26" },
  { s: "OK", t: "Initializing..." },
];

export default function BootSequence({ onDone }) {
  const [shown, setShown] = useState([]);
  const [skipping, setSkipping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setShown((prev) => [...prev, LINES[i]]);
      i += 1;
      if (i >= LINES.length) {
        clearInterval(interval);
        setTimeout(() => {
          setSkipping(true);
          setTimeout(onDone, 500);
        }, 550);
      }
    }, 95);
    return () => clearInterval(interval);
  }, [onDone]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [shown]);

  const handleSkip = () => {
    setSkipping(true);
    setTimeout(onDone, 250);
  };

  return (
    <div
      data-testid="boot-sequence"
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] bg-[#050505] crt-flicker font-mono text-sm cursor-pointer transition-opacity duration-500 ${skipping ? "opacity-0" : "opacity-100"}`}
    >
      <div className="scanlines absolute inset-0" />
      <div ref={scrollRef} className="relative h-full w-full overflow-hidden px-4 sm:px-8 py-6">
        {shown.map((line, idx) => (
          <div key={idx} className="flex text-white leading-7">
            <span className="text-[#606060]">[</span>
            <span className="text-[#00FF00] px-1.5 font-bold">{line.s}</span>
            <span className="text-[#606060]">]</span>
            <span className="ml-3">{line.t}</span>
          </div>
        ))}
        <div className="mt-2 text-[#00FFFF]">
          <span className="terminal-cursor" />
        </div>
      </div>
      <div className="absolute bottom-4 right-6 text-[#606060] text-xs font-mono">
        [click anywhere to skip]
      </div>
    </div>
  );
}
