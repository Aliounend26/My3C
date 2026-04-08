export const BrandLogo = ({ className = "", compact = false, alt = "My 3C" }) => {
  const imageClasses = compact ? "h-10 w-auto" : "h-16 w-auto";

  return (
    <div className={className}>
      <img src="/logo-my-3c.png" alt={alt} className={imageClasses} />
    </div>
  );
};
