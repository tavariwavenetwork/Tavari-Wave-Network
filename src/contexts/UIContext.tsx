import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  isTransferModalOpen: boolean;
  isDistractionFree: boolean;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  setDistractionFree: (value: boolean) => void;
  mrBActivationPopup: { planName: string; amount: number } | null;
  setMrBActivationPopup: (val: { planName: string; amount: number } | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [mrBActivationPopup, setMrBActivationPopup] = useState<{ planName: string; amount: number } | null>(null);

  const openTransferModal = () => setIsTransferModalOpen(true);
  const closeTransferModal = () => setIsTransferModalOpen(false);
  const setDistractionFree = (value: boolean) => setIsDistractionFree(value);

  return (
    <UIContext.Provider value={{ 
      isTransferModalOpen, 
      isDistractionFree,
      openTransferModal, 
      closeTransferModal,
      setDistractionFree,
      mrBActivationPopup,
      setMrBActivationPopup
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
