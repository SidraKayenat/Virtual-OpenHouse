const GlassCard = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white/3 border border-white/7 rounded-2xl backdrop-blur-[8px] ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
