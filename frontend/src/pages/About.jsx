export default function About({ site }) {
  const handle = site?.handle || "n0ct";
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="font-mono text-sm text-[#606060] mb-2">$ cat /etc/whoami</div>
      <h1 className="font-mono text-4xl sm:text-5xl font-bold tracking-tighter text-[#E0E0E0] mb-8">
        <span className="text-[#FF00FF]">$</span> whoami<span className="text-[#00FFFF] animate-pulse">_</span>
      </h1>

      <div className="panel p-6 sm:p-8">
        <div className="font-mono text-sm text-[#00FFFF] mb-4">{"// bio.txt"}</div>
        <p className="text-[#E0E0E0] leading-relaxed text-lg">
          {"Hi, I'm "}<span className="font-mono text-[#FF00FF]">{handle}</span>.
        </p>
        <p className="mt-4 text-[#A0A0A0] leading-relaxed" data-testid="about-bio">
          {site?.bio}
        </p>

        <div className="mt-8 font-mono text-sm text-[#00FFFF] mb-3">{"// stack.log"}</div>
        <ul className="font-mono text-sm space-y-2 text-[#A0A0A0]">
          <li><span className="text-[#FF00FF]">▸</span> {"daily driver: kali / arch / whatever's on the usb"}</li>
          <li><span className="text-[#FF00FF]">▸</span> favorite tool: <span className="text-[#E0E0E0]">burp suite</span></li>
          <li><span className="text-[#FF00FF]">▸</span> {"currently reading: The Web Application Hacker's Handbook"}</li>
          <li><span className="text-[#FF00FF]">▸</span> currently building: this blog, apparently</li>
        </ul>

        <div className="mt-8 font-mono text-sm text-[#00FFFF] mb-3">{"// contact.sh"}</div>
        <p className="font-mono text-sm text-[#A0A0A0]">
          {'echo "reach me via the usual channels — '}<span className="text-[#FF00FF]">@{handle}</span>{'"'}
        </p>
      </div>
    </div>
  );
}
