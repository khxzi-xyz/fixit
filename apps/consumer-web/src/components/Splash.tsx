export const Splash = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #1B6EF3 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
    <div className="text-center w-full max-w-sm relative z-10">
      <img src={import.meta.env.BASE_URL + "logo.png"} className="w-32 h-32 mx-auto mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(27,110,243,0.5)]" alt="Logo" />
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">FixIt Now</h1>
      <p className="text-muted-foreground mb-8 text-sm">Loading...</p>
    </div>
  </div>
);
