const RegisterButton = ({
  children,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`bg-gradient-to-r from-violet-500 to-violet-600 border-radius-[12px] p-[14px_32px] font-semibold text-sm tracking-[0.02em] box-shadow-[0_4px_24px_rgba(124,58,237,0.35)] border border-violet-400/3 text-white w-full transition-all duration-250 hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(124,58,237,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default RegisterButton;
