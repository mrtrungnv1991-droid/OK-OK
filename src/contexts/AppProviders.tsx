import React, { ReactNode } from 'react';
import { I18nProvider } from '../i18n';
import { UIProvider } from './UIContext';
import { AuthProvider } from './AuthContext';
import { WalletProvider } from './WalletContext';
import { CatalogProvider } from './CatalogContext';
import { OrdersProvider } from './OrdersContext';
import { AdminProvider } from './AdminContext';
import { CartProvider } from './CartContext';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <I18nProvider>
      <UIProvider>
        <AuthProvider>
          <WalletProvider>
            <CatalogProvider>
              <OrdersProvider>
                <AdminProvider>
                  <CartProvider>
                    {children}
                  </CartProvider>
                </AdminProvider>
              </OrdersProvider>
            </CatalogProvider>
          </WalletProvider>
        </AuthProvider>
      </UIProvider>
    </I18nProvider>
  );
};

