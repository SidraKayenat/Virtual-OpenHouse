const DigitCard = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white/6 border border-white/1 backdrop-blur-[12px] border-radius-[14px] min-w-[72px] p-[14px_10px_10px] text-center ${className}`}
    >
      {children}
    </div>
  );
};

export default DigitCard;