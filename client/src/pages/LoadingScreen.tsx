import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LoadingScreen() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/library");
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="bg-forest-green flex flex-col items-center justify-center px-6 min-h-screen min-h-[100dvh]">
      <div className="flex-1 flex items-center justify-center">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Lisc_lipy.jpg"
          alt="Split-leaf Philodendron"
          className="w-64 h-64 object-cover rounded-full shadow-2xl border-4 border-white"
          style={{ borderColor: 'var(--white-pastel)' }}
        />
      </div>
      <div className="pb-12">
        <h1 className="text-white-pastel text-2xl font-light text-center tracking-wide">
          welcome
        </h1>
      </div>
      <div className="absolute inset-0 bg-forest-green opacity-90 -z-10"></div>
    </div>
  );
}
