/* MONA-X wordmark — the gradient cycles continuously on its own (CSS animation
   in globals.css `.monax`). No mouse interaction needed. */
export default function MonaX({ className = "" }: { className?: string }) {
  return (
    <span className={`monax font-extrabold tracking-tight ${className}`}>
      MONA-X
    </span>
  );
}
