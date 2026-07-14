import { ReactNode } from "react";
import { Layout } from "antd";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const { Content, Footer } = Layout;

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <Layout className="min-h-screen bg-background-light text-text-light">
      <AdminHeader />
      <Layout className="pt-16">
        <AdminSidebar />
        <Layout className="ml-64">
          <Content className="flex-1 overflow-y-auto p-8 pt-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </Content>

          <Footer className="text-center text-sm text-text-muted-light bg-transparent">
            <p>© 2025 LecVidGen Admin.</p>
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;