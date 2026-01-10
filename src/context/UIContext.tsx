import React, { createContext, useContext, useState, ReactNode } from "react";

interface UIContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  return (
    <UIContext.Provider value={{ loading, setLoading }}>
      {/* TODO: Add a proper Loading Overlay compatible with new design */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}
      {children}
    </UIContext.Provider>
  );
};
