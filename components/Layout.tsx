
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  fullBleed?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, fullBleed = false }) => {
  return (
    <main className={`flex-1 w-full max-w-md mx-auto bg-white shadow-xl min-h-screen flex flex-col ${fullBleed ? '' : 'p-6'}`}>
      {children}
    </main>
  );
};

export default Layout;
