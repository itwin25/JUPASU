import BottomNav from '@/components/common/bottom-nav/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <main className="app-shell bottom-nav-safe min-h-screen flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
