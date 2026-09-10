import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body><div id=\"root\"></div></body></html>", {
  url: "http://localhost:3000/"
});

(global as any).window = dom.window;
(global as any).document = dom.window.document;
Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true
});
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).Node = dom.window.Node;
(global as any).Event = dom.window.Event;
(global as any).CustomEvent = dom.window.CustomEvent;
(global as any).localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] || null; },
  setItem(key: string, value: any) { this.store[key] = String(value); },
  removeItem(key: string) { delete this.store[key]; },
  clear() { this.store = {}; }
};
(global as any).sessionStorage = { ...global.localStorage, store: {} };
(global as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 0);
(global as any).cancelAnimationFrame = (id: any) => clearTimeout(id);

let foundError: any = null;
const origError = console.error;
console.error = (...args: any[]) => {
  origError(...args);
  const msg = args.map(a => (a instanceof Error ? a.stack || a.message : String(a))).join(" ");
  if (msg.includes("Maximum update depth exceeded") || msg.includes("Too many re-renders")) {
    foundError = msg;
  }
};

async function main() {
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { act } = await import("react");
  const App = (await import("../src/App")).default;
  const { DepositHubModal } = await import("../src/components/DepositHubModal");
  const { TopupModal } = await import("../src/components/TopupModal");
  const { AdminPanelModal } = await import("../src/components/AdminPanelModal");
  const { CreatePoolModal } = await import("../src/components/CreatePoolModal");
  const { SectionHeaderEditorModal } = await import("../src/components/SectionHeaderEditorModal");
  const { AppProviders } = await import("../src/contexts/AppProviders");

  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);

  console.log("1. Rendering App...");
  await act(async () => {
    root.render(React.createElement(App));
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("2. Testing DepositHubModal explicitly...");
  const dummyUser = {
    id: "user-test-123",
    name: "Test User",
    email: "test@example.com",
    role: "buyer" as const,
    balance: 1000000,
    walletBalance: 1000000,
    lockedBalance: 0,
    escrowLocked: 0,
    reputationScore: 100,
    avatar: "https://example.com/avatar.png",
    completedOrders: 5,
    joinedDate: "2025-01-01",
    currency: "VND" as const,
    language: "vi" as const,
  };

  await act(async () => {
    root.render(
      React.createElement(
        AppProviders,
        null,
        React.createElement(DepositHubModal, {
          isOpen: true,
          onClose: () => {},
          user: dummyUser,
          currency: "VND",
          onDepositSuccess: () => {},
          transactions: [],
          systemConfig: {
            bankName: "MBBank",
            bankAccountNo: "12345",
            bankAccountName: "CYBER",
            qrDisplayMode: "vietqr_auto",
          } as any
        })
      )
    );
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("3. Testing DepositHubModal with switching channels...");
  // Let's test with other props
  await act(async () => {
    root.render(
      React.createElement(
        AppProviders,
        null,
        React.createElement(DepositHubModal, {
          isOpen: true,
          onClose: () => {},
          user: dummyUser,
          currency: "USD",
          onDepositSuccess: () => {},
          transactions: [],
          systemConfig: {
            depositModulesConfig: {
              vietqr: { enabled: true, maintenanceMessage: "" },
              momo: { enabled: true, maintenanceMessage: "" },
              crypto: { enabled: true, maintenanceMessage: "" },
              ltc: { enabled: true, maintenanceMessage: "" },
              binance: { enabled: true, maintenanceMessage: "" },
              telco: { enabled: true, maintenanceMessage: "" }
            }
          } as any
        })
      )
    );
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("4. Testing TopupModal...");
  await act(async () => {
    root.render(
      React.createElement(
        AppProviders,
        null,
        React.createElement(TopupModal, {
          isOpen: true,
          onClose: () => {},
          user: dummyUser,
          currency: "VND",
          onConfirmTopup: () => {},
          onOpenWallet: () => {}
        })
      )
    );
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("5. Testing CreatePoolModal...");
  await act(async () => {
    root.render(
      React.createElement(
        AppProviders,
        null,
        React.createElement(CreatePoolModal, {
          isOpen: true,
          onClose: () => {},
          currency: "VND",
          onSuccessCreate: () => {}
        })
      )
    );
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("6. Testing SectionHeaderEditorModal...");
  await act(async () => {
    root.render(
      React.createElement(
        AppProviders,
        null,
        React.createElement(SectionHeaderEditorModal, {
          isOpen: true,
          onClose: () => {},
          initialSection: "marketplace",
          sectionsConfig: {},
          onSave: () => {}
        })
      )
    );
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("7. Testing AdminPanelModal tabs...");
  const adminTabs = [
    'dashboard', 'products', 'sold_orders', 'manual_orders', 'banking', 
    'order_reliability', 'cyborg_pipeline', 'source_connector', 'suppliers', 
    'members', 'vouchers', 'chat_support', 'payment_system', 'cron_monitor', 'hero_layout'
  ];
  for (const tab of adminTabs) {
    await act(async () => {
      root.render(
        React.createElement(
          AppProviders,
          null,
          React.createElement(AdminPanelModal as any, {
            isOpen: true,
            onClose: () => {},
            initialTab: tab as any,
            user: { ...dummyUser, role: "admin" },
            currency: "VND",
            products: [],
            games: [],
            orders: [],
            manualOrders: [],
            members: [],
            suppliers: [],
            vouchers: [],
            systemConfig: {} as any,
            onUpdateSystemConfig: () => {},
            onUpdateProduct: () => {},
            onDeleteProduct: () => {},
            onAddProduct: () => {},
            onUpdateGame: () => {},
            onAddGame: () => {},
            onDeleteGame: () => {},
            onAddGameTier: () => {},
            onUpdateGameTier: () => {},
            onDeleteGameTier: () => {},
            onUpdateMemberRole: () => {},
            onToggleMemberStatus: () => {},
            onAdjustMemberBalance: () => {},
            onAddVoucher: () => {},
            onToggleVoucher: () => {},
            onDeleteVoucher: () => {},
            onProcessManualOrder: () => {},
            onAdminReplyTicket: () => {},
            onAdminSendChatMessage: () => {},
            onBulkAdjustGamePrices: () => {},
            onResetGamesToDefault: () => {},
            onAddStockToProduct: () => {},
            onAdjustStock: () => {},
            onToggleFlashSale: () => {},
            onRetranslateProduct: () => {},
            onAddCategory: () => {},
            onUpdateCategory: () => {},
            onDeleteCategory: () => {},
            onSaveSectionsConfig: () => {}
          })
        )
      );
    });
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (foundError) {
    console.log("=== CAUGHT INFINITE LOOP ERROR ===");
    console.log(foundError);
    process.exit(1);
  } else {
    console.log("=== ALL MODALS AND TABS RENDERED WITH ZERO INFINITE LOOPS! ===");
    process.exit(0);
  }
}

main().catch(e => {
  console.error("Main uncaught error:", e);
  process.exit(1);
});
