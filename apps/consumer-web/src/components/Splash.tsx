export const Splash = () => (
  <div className="min-h-screen flex items-center justify-center bg-primary p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
    <div className="text-center w-full max-w-sm relative z-10 flex flex-col items-center justify-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-white rounded-[2.5rem] blur-xl opacity-20 animate-pulse"></div>
        <img 
          src={import.meta.env.BASE_URL + "logo.png"} 
          className="w-32 h-32 relative z-10 animate-bounce duration-1000 drop-shadow-2xl" 
          alt="Logo" 
        />
        {/* Animated ring */}
        <div className="absolute inset-[-1rem] border-4 border-white/20 border-t-white rounded-full animate-spin duration-1000"></div>
      </div>
      
      <h1 className="text-5xl font-black tracking-tight text-white mb-3 drop-shadow-md">FixIt</h1>
      <p className="text-white/80 text-lg font-medium tracking-wide animate-pulse">Loading experience...</p>
    </div>
  </div>
);
