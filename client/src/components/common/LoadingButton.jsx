export const LoadingButton = ({
  children,
  loading = false,
  loadingText = "Chargement...",
  className = "",
  disabled = false,
  type = "button",
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`${className} ${(disabled || loading) ? "cursor-not-allowed opacity-70" : ""}`}
    {...props}
  >
    <span className="inline-flex items-center justify-center gap-2">
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
      {loading ? loadingText : children}
    </span>
  </button>
);
