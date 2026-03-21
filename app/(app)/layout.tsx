import { Navbar } from '@/components/layout/Navbar'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <LeftSidebar />
      <RightSidebar />
      <main
        className="pb-20 lg:pb-4 lg:pl-60 xl:pr-64"
        style={{ 
          minHeight: '100vh',
          paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))' 
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
