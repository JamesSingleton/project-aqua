import { SidebarProvider } from '@project-aqua/design-system/components/ui/sidebar'
import type { ReactNode } from "react";
import { GlobalSidebar } from '@/components/sidebar';

interface AdminLayoutProperties {
  readonly children: ReactNode;
  readonly params: Promise<{ teamId: string }>;
}

const AdminLayout = async ({ children, params }: AdminLayoutProperties) => {
  const { teamId } = await params;
  return (
    <SidebarProvider>
      <GlobalSidebar teamId={teamId}>
        { children}
      </GlobalSidebar>
    </SidebarProvider>
  )
}

export default AdminLayout
