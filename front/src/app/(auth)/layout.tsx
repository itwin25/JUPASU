export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(235,230,223,0.95),_rgba(249,247,242,1)_50%)]">
      <div className="app-shell page-gutter top-safe bottom-safe min-h-screen">{children}</div>
    </div>
  );
}
