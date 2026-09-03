import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Key, 
  PlusCircle, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Lock,
  Gift
} from 'lucide-react';
import { 
  Product, 
  GroupPool, 
  UserOrder, 
  ProductCategory, 
  GameItem, 
  SupportTicket, 
  TelcoCardSubmission, 
  WheelPrize, 
  TransactionRecord, 
  LanguageCode, 
  CurrencyCode,
  ProductReview,
  TopupOrder
} from './types';
import { formatCurrency, generateTxHash, generateRandomKey } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { HeroTelemetry } from './components/HeroTelemetry';
import { ProductCard } from './components/ProductCard';
import { PoolDetailModal } from './components/PoolDetailModal';
import { InstantBuyModal } from './components/InstantBuyModal';
import { KeyVaultModal } from './components/KeyVaultModal';
import { CreatePoolModal } from './components/CreatePoolModal';
import { WalletModal } from './components/WalletModal';
import { EscrowGuideModal } from './components/EscrowGuideModal';
import { LiveTelemetryStream } from './components/LiveTelemetryStream';
import { TopupSection } from './components/TopupSection';
import { FlashSalesSection } from './components/FlashSalesSection';
import { ActivePoolsShowcase } from './components/ActivePoolsShowcase';
import { TopupModal } from './components/TopupModal';
import { TicketsModal } from './components/TicketsModal';
import { SellerSupplierModal } from './components/SellerSupplierModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { TelcoCardModal } from './components/TelcoCardModal';
import { LuckyWheelModal } from './components/LuckyWheelModal';
import { OrderLookupModal } from './components/OrderLookupModal';
import { AffiliateResellerModal } from './components/AffiliateResellerModal';
import { TransactionLedgerModal } from './components/TransactionLedgerModal';
import { KeyToolsModal } from './components/KeyToolsModal';
import { DepositHubModal } from './components/DepositHubModal';
import { LiveSupportChatWidget } from './components/LiveSupportChatWidget';
import { HomeAnnouncementModal } from './components/HomeAnnouncementModal';
import { FanMenuModal } from './components/FanMenuModal';
import { AiLanguageCurrencyModal } from './components/AiLanguageCurrencyModal';
import { CartModal } from './components/CartModal';
import { CheckoutConfirmationModal } from './components/CheckoutConfirmationModal';
import { MainModulesBar } from './components/MainModulesBar';
import { GlobalToastContainer } from './components/GlobalToastContainer';
import { startOracleBackgroundTicker, subscribeToRates } from './utils/rateOracle';
import { useTranslation } from './i18n';

// Context Providers & Hooks

import { AppProviders } from './contexts/AppProviders';
import { useUI, ModalType } from './contexts/UIContext';
import { useAuth } from './contexts/AuthContext';
import { useWallet } from './contexts/WalletContext';
import { useCatalog } from './contexts/CatalogContext';
import { useOrders } from './contexts/OrdersContext';
import { useAdmin } from './contexts/AdminContext';
import { useCart } from './contexts/CartContext';

function AppContent() {
  const { t, locale, setLocale } = useTranslation();

  // UI & Modal Context
  const { 
    activeModal, 
    modalPayload, 
    openModal, 
    closeModal, 
    isModalOpen, 
    showToast 
  } = useUI();


  // Auth Context
  const { 
    currentUser, 
    updateUserRole, 
    updateUserBalance, 
    updateEscrowLocked, 
    updateLanguage, 
    updateCurrency 
  } = useAuth();

  // Wallet Context
  const { 
    transactions, 
    telcoCards, 
    topupInvoices, 
    withdrawals, 
    addTransaction, 
    depositMoney, 
    submitTelcoCard, 
    approveInvoice, 
    rejectInvoice, 
    requestWithdrawal 
  } = useWallet();

  // Catalog Context
  const { 
    products, 
    games, 
    categories, 
    selectedCategory, 
    setSelectedCategory, 
    searchTerm, 
    setSearchTerm, 
    sortBy, 
    setSortBy, 
    selectedPlatform, 
    setSelectedPlatform,
    addNewProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    adjustProductStock,
    toggleFlashSale,
    bulkAddStock,
    updateGame,
    addNewGame,
    deleteGame,
    addGameTier,
    updateGameTier,
    deleteGameTier,
    bulkAdjustGamePrices,
    addCategory,
    updateCategory,
    deleteCategory
  } = useCatalog();

  // Orders Context
  const { 
    orders, 
    manualOrders, 
    tickets, 
    chatSessions, 
    luckyWheelPrizes, 
    addOrder,
    createSupportTicket, 
    adminReplyTicket, 
    adminSendChatMessage, 
    sendUserChatMessage, 
    processManualOrder, 
    spinLuckyWheel,
    forceEscrowAction
  } = useOrders();

  // Admin Context
  const { 
    members, 
    suppliers, 
    systemConfig, 
    vouchers, 
    updateMemberRole, 
    toggleMemberStatus, 
    adjustMemberBalance, 
    updateSupplierBalance, 
    updateSystemConfig, 
    addVoucher, 
    toggleVoucherStatus, 
    deleteVoucher 
  } = useAdmin();

  // Purchase Type Filter ('all' | 'retail_instant' | 'escrow_pools')
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState<'all' | 'retail_instant' | 'escrow_pools'>('all');

  // Rate Oracle Live Ticker
  const [, setRateVersion] = useState<number>(0);
  useEffect(() => {
    startOracleBackgroundTicker();
    const unsub = subscribeToRates(() => {
      setRateVersion(v => v + 1);
    });
    return () => unsub();
  }, []);

  const triggerConfetti = (count = 75, spread = 65) => {
    try {
      confetti({ particleCount: count, spread, origin: { y: 0.5 } });
    } catch {
      // ignore in iframe
    }
  };

  // Quick Switch Language & Currency
  const handleApplyLanguageCurrency = (lang: LanguageCode, curr: CurrencyCode) => {
    setLocale(lang as any);
    updateLanguage(lang);
    updateCurrency(curr);
  };


  // Top-Up Direct Game Handler
  const handleConfirmTopup = (topupOrder: TopupOrder, isGroupTopup: boolean) => {
    updateUserBalance(-topupOrder.pricePaid);

    const newOrder: UserOrder = {
      id: `ord-topup-${Date.now()}`,
      productId: topupOrder.gameId,
      productTitle: `${topupOrder.gameTitle} - ${topupOrder.tierName}`,
      platform: 'Garena/HoYoverse',
      type: isGroupTopup ? 'topup_group' : 'topup_direct',
      pricePaid: topupOrder.pricePaid,
      status: 'fulfilled',
      createdAt: new Date().toLocaleString('vi-VN'),
      topupDetails: {
        gameName: topupOrder.gameTitle,
        uid: topupOrder.uid,
        zoneId: topupOrder.zoneId,
        server: topupOrder.server,
        characterName: topupOrder.characterName,
        tierName: topupOrder.tierName
      },
      txId: topupOrder.txId
    };

    addTransaction({
      type: 'topup_game',
      description: `Nạp ${topupOrder.gameTitle} (${topupOrder.tierName}) - UID: ${topupOrder.uid}`,
      amount: -topupOrder.pricePaid,
      balanceAfter: currentUser.walletBalance - topupOrder.pricePaid,
      status: 'completed',
      txCode: topupOrder.txId
    });

    triggerConfetti();

    showToast(
      `Đã nạp ${topupOrder.tierName} cho nhân vật [${topupOrder.characterName || topupOrder.uid}] qua cổng ${topupOrder.provider}.`,
      'success',
      {
        title: '⚡ NẠP GAME THÀNH CÔNG // API ĐÃ BẮN KIM CƯƠNG',
        duration: 5000,
        action: { label: 'Xem đơn nạp →', onClick: () => openModal('vault') }
      }
    );
  };

  // Telco Card Submit Handler
  const handleCardSubmit = (submission: TelcoCardSubmission) => {
    submitTelcoCard({
      telco: submission.telco,
      declaredAmount: submission.declaredAmount,
      pin: submission.pin,
      serial: submission.serial
    });

    triggerConfetti(60, 60);

    showToast(
      `Đã nạp thẻ ${submission.telco} ${formatCurrency(submission.declaredAmount, currentUser.currency)} -> Nhận +${formatCurrency(submission.receivedAmount, currentUser.currency)} vào ví!`,
      'success',
      {
        title: '⚡ GẠCH THẺ THÀNH CÔNG // CỘNG TIỀN VÍ NGAY',
        duration: 5000,
        action: { label: 'Mở Ví Tiền →', onClick: () => openModal('wallet') }
      }
    );
  };

  // Lucky Wheel Spin
  const handleSpinSuccess = (_cost: number, prize: WheelPrize) => {
    triggerConfetti(90, 75);

    showToast(
      `Chúc mừng bạn đã trúng [${prize.name}]. Đã cập nhật vào tài khoản!`,
      'success',
      {
        title: '🎉 TRÚNG THƯỞNG VÒNG QUAY MAY MẮN!',
        duration: 5000
      }
    );
  };

  // Join Group Buy Pool Handler
  const handleConfirmJoinPool = (product: Product, pool: GroupPool) => {
    if (currentUser.walletBalance < pool.pricePerSlot) {
      openModal('wallet');
      return;
    }

    // Deduct from wallet & lock in escrow
    updateUserBalance(-pool.pricePerSlot);
    updateEscrowLocked(pool.pricePerSlot);

    const newParticipant = {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      joinedAt: 'Vừa xong',
      txHash: generateTxHash(),
      slotNumber: pool.filledSlots + 1
    };

    const newFilledSlots = pool.filledSlots + 1;
    const isPoolComplete = newFilledSlots >= pool.targetSlots;

    // Update pool slots in catalog
    const updatedPools = product.activePools.map(pl => {
      if (pl.id !== pool.id) return pl;
      return {
        ...pl,
        filledSlots: newFilledSlots,
        status: (isPoolComplete ? 'completed' : 'filling') as GroupPool['status'],
        participants: [...pl.participants, newParticipant]
      };
    });

    updateProduct(product.id, { activePools: updatedPools });

    if (isPoolComplete) {
      triggerConfetti(80, 70);

      const assignedKey = pool.keysVault.find(k => k.status === 'available') || {
        id: 'k-gen',
        code: generateRandomKey(product.platform)
      };

      const newOrder: UserOrder = {
        id: `ord-${Date.now()}`,
        poolId: pool.id,
        productId: product.id,
        productTitle: product.title,
        platform: product.platform,
        type: 'group_buy',
        pricePaid: pool.pricePerSlot,
        status: 'fulfilled',
        createdAt: new Date().toLocaleString('vi-VN'),
        deliveredKey: assignedKey.code,
        pinCode: '8821',
        giftUpCard: product.deliveryType === 'giftup_card' ? {
          cardNumber: `4928 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
          pinCode: '8821',
          barcode: `GU-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          balance: 50,
          currency: 'USD',
          expiryDate: '12/2028',
          redeemUrl: 'https://giftup.app/redeem/cyberpool'
        } : undefined,
        slotNumber: newFilledSlots,
        txId: `TX-ESCROW-${Date.now().toString().slice(-6)}`
      };

      addTransaction({
        type: 'buy_pool',
        description: `Gom đơn hoàn tất: ${product.title}`,
        amount: -pool.pricePerSlot,
        balanceAfter: currentUser.walletBalance,
        status: 'completed',
        txCode: newOrder.txId
      });

      updateEscrowLocked(-pool.pricePerSlot);
      closeModal();

      showToast(
        `Mã bản quyền ${product.title} đã được chuyển an toàn vào Kho Key & GiftUp của bạn.`,
        'success',
        {
          title: '🎉 NHÓM GOM ĐÃ ĐỦ SLOTS & BUNG KEY THÀNH CÔNG!',
          duration: 5000,
          action: { label: 'Xem Kho Key Vault →', onClick: () => openModal('vault') }
        }
      );
    } else {
      closeModal();
      showToast(
        `Đã khóa tạm ${formatCurrency(pool.pricePerSlot, currentUser.currency)} trong ví Escrow. Bạn là thành viên #${newFilledSlots}/${pool.targetSlots}. Key sẽ bung ngay khi đủ nhóm!`,
        'success',
        {
          title: '⚡ ĐÃ KHÓA SLOT GOM ĐƠN THÀNH CÔNG',
          duration: 5000
        }
      );
    }
  };

  // Simulate Another Participant Joining Pool
  const handleSimulateAddParticipant = (poolId: string) => {
    const fakeNames = ['SpaceX_Tester', 'CyberNova_99', 'AnhTuan_Tech', 'PhuongLinh_AI', 'GamingVn_Pro'];
    const fakeAvatars = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'
    ];

    products.forEach(p => {
      const targetPool = p.activePools.find(pl => pl.id === poolId);
      if (!targetPool) return;

      const newFilled = targetPool.filledSlots + 1;
      const isComplete = newFilled >= targetPool.targetSlots;
      const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)] + '_' + Math.floor(Math.random() * 90 + 10);
      const randomAvatar = fakeAvatars[Math.floor(Math.random() * fakeAvatars.length)];

      const updatedPool: GroupPool = {
        ...targetPool,
        filledSlots: newFilled,
        status: isComplete ? 'completed' : 'filling',
        participants: [
          ...targetPool.participants,
          {
            id: `p-${Date.now()}`,
            name: randomName,
            avatar: randomAvatar,
            joinedAt: 'Vừa xong',
            txHash: generateTxHash(),
            slotNumber: newFilled
          }
        ]
      };

      const updatedPools = p.activePools.map(pl => pl.id === poolId ? updatedPool : pl);
      updateProduct(p.id, { activePools: updatedPools });

      if (isComplete) {
        triggerConfetti(70, 60);
      }
    });
  };

  // Instant Single Purchase Handler (Opens InstantBuy Modal with full specs & payment options)
  const handleInstantBuy = (product: Product) => {
    openModal('instantBuy', { selectedProduct: product });
  };

  // Instant Single Purchase Finalized Execution Handler
  const handleInstantBuySuccess = (order: UserOrder, paymentAmount: number, paymentMethod: string) => {
    if (paymentMethod === 'wallet') {
      updateUserBalance(-paymentAmount);
    }

    addTransaction({
      type: 'buy_instant',
      description: `Mua lẻ: ${order.productTitle}`,
      amount: -paymentAmount,
      balanceAfter: paymentMethod === 'wallet' ? (currentUser.walletBalance - paymentAmount) : currentUser.walletBalance,
      status: 'completed',
      txCode: order.txId
    });

    addOrder(order);

    // Reduce visual stock
    updateProduct(order.productId, {
      stockAvailable: Math.max(0, (products.find(p => p.id === order.productId)?.stockAvailable || 10) - 1)
    });

    triggerConfetti(80, 70);

    showToast(
      `Đơn mua ${order.productTitle} đã hoàn tất. Key đã sẵn sàng trong Kho Key của bạn!`,
      'success',
      {
        title: '⚡ MUA LẺ THÀNH CÔNG // GIAO KEY TỨC THÌ',
        duration: 5000,
        action: { label: 'Mở Kho Key →', onClick: () => openModal('vault') }
      }
    );
  };

  // Create Pool Handler
  const handleCreatePool = (product: Product, newPool: GroupPool) => {
    const existing = products.find(p => p.id === product.id);
    if (existing) {
      updateProduct(product.id, {
        activePools: [newPool, ...existing.activePools]
      });
    } else {
      addNewProduct({
        ...product,
        activePools: [newPool]
      });
    }

    triggerConfetti(65, 60);

    showToast(
      `Đã mở nhóm gom #${newPool.id} cho sản phẩm ${product.title} với giá sỉ ${formatCurrency(newPool.pricePerSlot, currentUser.currency)}.`,
      'success',
      {
        title: '🚀 MỞ NHÓM GOM ĐƠN THÀNH CÔNG!',
        duration: 5000
      }
    );
  };

  // Rate Product Handler
  const handleRateProduct = (productId: string, rating: number, comment?: string) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      rating,
      comment: comment || 'Đã nhận key tức thì, kích hoạt bản quyền 100% chính hãng!',
      createdAt: 'Vừa xong',
      verifiedPurchase: true
    };

    const existingReviews = target.reviews || [];
    const newCount = (target.reviewCount || 1) + 1;
    const newRating = Number((((target.rating || 5) * (target.reviewCount || 1) + rating) / newCount).toFixed(1));

    updateProduct(productId, {
      rating: newRating,
      reviewCount: newCount,
      reviews: [newReview, ...existingReviews]
    });

    showToast(`Cảm ơn bạn đã đánh giá ${rating} sao cho ${target.title}!`, 'success');
  };

  // Dynamic Module Counts
  const moduleCounts = {
    all: products.length,
    accounts: products.filter(p => p.category === 'accounts' || p.productType === 'account' || p.category === 'entertainment').length,
    key_games: products.filter(p => p.category === 'key_games' || p.productType === 'key_game' || p.category === 'gaming').length,
    key_apps: products.filter(p => p.category === 'key_apps' || p.productType === 'key_app' || p.category === 'software').length,
    topup_games: products.filter(p => p.category === 'topup_games' || p.productType === 'topup').length,
    ai_tools: products.filter(p => p.category === 'ai_tools').length
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    let matchesCategory = selectedCategory === 'all';
    if (selectedCategory === 'accounts') {
      matchesCategory = p.category === 'accounts' || p.productType === 'account' || p.category === 'entertainment';
    } else if (selectedCategory === 'key_games') {
      matchesCategory = p.category === 'key_games' || p.productType === 'key_game' || p.category === 'gaming';
    } else if (selectedCategory === 'key_apps') {
      matchesCategory = p.category === 'key_apps' || p.productType === 'key_app' || p.category === 'software';
    } else if (selectedCategory === 'topup_games') {
      matchesCategory = p.category === 'topup_games' || p.productType === 'topup';
    } else {
      matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    }

    const matchesPlatform = selectedPlatform === 'all' || p.platform.toLowerCase() === selectedPlatform.toLowerCase();
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesPurchaseType = 
      purchaseTypeFilter === 'all' ||
      (purchaseTypeFilter === 'retail_instant' && (p.stockAvailable ?? 10) > 0) ||
      (purchaseTypeFilter === 'escrow_pools' && (p.activePools?.length ?? 0) > 0);

    return matchesCategory && matchesPlatform && matchesSearch && matchesPurchaseType;
  }).sort((a, b) => {
    if (sortBy === 'popular') return (b.reviewCount || 0) - (a.reviewCount || 0);
    if (sortBy === 'price_low') return a.retailPrice - b.retailPrice;
    if (sortBy === 'price_high') return b.retailPrice - a.retailPrice;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
    return 0;
  });

  const siteContainerClass = systemConfig.uiLayoutConfig?.siteContainerWidth || systemConfig.heroConfig?.containerMaxWidth || 'max-w-7xl';

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. Global Navigation Bar */}
      <Navbar
        user={currentUser}
        currentLanguage={currentUser.language || 'vi'}
        activeOrdersCount={orders.length}
        containerMaxWidth={siteContainerClass}
        onOpenWallet={() => openModal('wallet')}
        onOpenDepositHub={() => openModal('depositHub')}
        onOpenVault={() => openModal('vault')}
        onOpenCreatePool={() => openModal('createPool')}
        onOpenLanguageModal={() => openModal('aiConfig')}
        onCurrencyToggle={() => openModal('aiConfig')}
        onQuickChangeLanguage={(lang, curr) => {
          setLocale(lang as any);
          updateLanguage(lang);
          if (curr) updateCurrency(curr);
        }}

        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenEscrowGuide={() => openModal('escrowGuide')}
        onOpenTopup={() => openModal('topup')}
        onOpenTickets={() => openModal('tickets')}
        onOpenSuppliers={() => openModal('sellerSupplier')}
        onOpenAdmin={() => openModal('admin')}
        onOpenTelcoCard={() => openModal('telcoCard')}
        onOpenLuckyWheel={() => openModal('luckyWheel')}
        onOpenOrderLookup={() => openModal('orderLookup')}
        onOpenAffiliate={() => openModal('affiliate')}
        onOpenLedger={() => openModal('txLedger')}
        onOpenKeyTools={() => openModal('keyTools')}
        onOpenFanMenu={() => openModal('fanMenu')}
      />

      {/* 2. Hero Telemetry & Status Engine with Main Categories Modules Bar */}
      <HeroTelemetry 
        user={currentUser}
        currency={currentUser.currency}
        heroConfig={systemConfig.heroConfig}
        uiLayoutConfig={systemConfig.uiLayoutConfig}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (cat === 'topup_games') {
            openModal('topup');
          } else {
            const el = document.getElementById('marketplace-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        moduleCounts={moduleCounts}
        onOpenTopupModal={() => openModal('topup')}
        onOpenCreatePool={() => openModal('createPool')}
        onOpenEscrowGuide={() => openModal('escrowGuide')}
        onOpenTopup={() => openModal('topup')}
        onOpenTelcoCard={() => openModal('telcoCard')}
        onOpenLuckyWheel={() => openModal('luckyWheel')}
        onOpenDepositHub={() => openModal('depositHub')}
        onOpenAffiliate={() => openModal('affiliate')}
        onOpenLedger={() => openModal('txLedger')}
        onOpenFanMenu={() => openModal('fanMenu')}
      />

      {/* 3. Live Flash Sales & Hot Deals Banner */}
      <div className={`w-full ${siteContainerClass} mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6`}>
        <FlashSalesSection
          products={products}
          currency={currentUser.currency}
          onOpenPool={(prod, pool) => openModal('poolDetail', { selectedProduct: prod, selectedPool: pool })}
          onInstantBuy={handleInstantBuy}
        />
      </div>

      {/* 4. Active Pools Showcase (Gom Đơn Đang Chạy) */}
      <div className={`w-full ${siteContainerClass} mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6`}>
        <ActivePoolsShowcase
          products={products}
          currency={currentUser.currency}
          onOpenPool={(prod, pool) => openModal('poolDetail', { selectedProduct: prod, selectedPool: pool })}
          onInstantBuy={handleInstantBuy}
          onCreateNewPool={(prod) => openModal('createPool', { initialProduct: prod })}
        />
      </div>

      {/* 5. 121 Direct Game Top-Up Grid (Game4Win Module) */}
      <div className={`w-full ${siteContainerClass} mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6`}>
        <TopupSection 
          games={games}
          currency={currentUser.currency}
          onSelectGame={(game) => openModal('topup', { selectedGame: game })}
          onOpenAllGames={() => openModal('topup')}
        />
      </div>

      {/* 6. Main Digital Products Marketplace */}
      <section id="marketplace-section" className={`w-full ${siteContainerClass} mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 scroll-mt-20`}>
        {/* Marketplace Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                {t('marketplace.badge')}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {t('marketplace.title')}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {t('marketplace.subtitle')}
            </p>
          </div>

          {/* Quick Action Button to Open Pool */}
          <button
            onClick={() => openModal('createPool')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm tracking-wide shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('marketplace.create_pool_btn')}</span>
          </button>
        </div>

        {/* Categories & Search Filter Bar */}
        <div className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl p-4 mb-8 space-y-3 backdrop-blur-md">
          {/* Row 1: Search & Purchase Type Toggle */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('marketplace.search_placeholder')}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  {t('marketplace.search_clear')}
                </button>
              )}
            </div>

            {/* Purchase Mode Toggle: All / Mua Lẻ / Gom Đơn */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setPurchaseTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  purchaseTypeFilter === 'all'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('marketplace.tab_all')} ({products.length})
              </button>
              <button
                onClick={() => setPurchaseTypeFilter('retail_instant')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  purchaseTypeFilter === 'retail_instant'
                    ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.3)] font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{t('marketplace.tab_retail')}</span>
              </button>
              <button
                onClick={() => setPurchaseTypeFilter('escrow_pools')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  purchaseTypeFilter === 'escrow_pools'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{t('marketplace.tab_pools')}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Category Filter Pills & Sort Dropdown */}
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between pt-1 border-t border-slate-800/50">
            {/* Category Filter Pills */}
            <div className="w-full lg:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {[
                { id: 'all', label: t('categories.all'), icon: '🌐' },
                { id: 'accounts', label: t('categories.accounts'), icon: '👤' },
                { id: 'key_games', label: t('categories.key_games'), icon: '🎮' },
                { id: 'key_apps', label: t('categories.key_apps'), icon: '🔑' },
                { id: 'topup_games', label: t('categories.topup_games'), icon: '⚡' },
                { id: 'ai_tools', label: t('categories.ai_tools'), icon: '🤖' },
                { id: 'entertainment', label: t('categories.entertainment'), icon: '🍿' },
                { id: 'software', label: t('categories.software'), icon: '💻' },
                { id: 'vpn_security', label: t('categories.vpn_security'), icon: '🛡️' },
                { id: 'education', label: t('categories.education'), icon: '🎓' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as ProductCategory)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Filter Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/60 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500/80 cursor-pointer"
            >
              <option value="popular">{t('marketplace.sort_popular')}</option>
              <option value="price_low">{t('marketplace.sort_price_low')}</option>
              <option value="price_high">{t('marketplace.sort_price_high')}</option>
              <option value="rating">{t('marketplace.sort_rating')}</option>
              <option value="discount">{t('marketplace.sort_discount')}</option>
            </select>
          </div>
        </div>


        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#0b1329]/40 border border-slate-800/60 rounded-2xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">{t('errors.not_found')}</h3>
            <p className="text-sm text-slate-400 mb-4">
              {t('marketplace.subtitle')}
            </p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-colors cursor-pointer"
            >
              {t('marketplace.search_clear')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currentUser.currency}
                onOpenPoolModal={(pool) => openModal('poolDetail', { selectedProduct: product, selectedPool: pool })}
                onCreatePool={() => openModal('createPool', { initialProduct: product })}
                onInstantBuy={() => handleInstantBuy(product)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 7. Footer & Bottom Spacing for Mobile */}
      <footer className="w-full border-t border-slate-800/80 bg-[#060913] py-8 sm:py-10 pb-28 sm:pb-12 text-center text-xs font-mono text-slate-500">
        <div className={`w-full ${siteContainerClass} mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider">CYBER<span className="text-cyan-400">POOL</span></span>
            <span>•</span>
            <span className="text-slate-400">Nền Tảng Gom Đơn & Kho Phẩm Số Escrow</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Bảo lãnh 100% hoàn tiền</span>
            <span>•</span>
            <span>Hỗ trợ 24/7</span>
          </div>
        </div>
      </footer>

      {/* 8. Live Telemetry Activity Stream (Giao dịch thời gian thực) */}
      <LiveTelemetryStream currency={currentUser.currency} />

      {/* 9. Global Modals & Dialogs */}
      {isModalOpen('instantBuy') && modalPayload.selectedProduct && (
        <InstantBuyModal
          isOpen={true}
          onClose={closeModal}
          product={modalPayload.selectedProduct}
          user={currentUser}
          onSuccessOrder={handleInstantBuySuccess}
          onOpenWallet={() => openModal('wallet')}
          onOpenVault={() => openModal('vault')}
        />
      )}

      {isModalOpen('poolDetail') && modalPayload.selectedProduct && modalPayload.selectedPool && (
        <PoolDetailModal
          isOpen={true}
          onClose={closeModal}
          product={modalPayload.selectedProduct}
          pool={modalPayload.selectedPool}
          user={currentUser}
          onConfirmJoin={handleConfirmJoinPool}
          onSimulateAddParticipant={handleSimulateAddParticipant}
          onOpenWallet={() => openModal('wallet')}
          onRateProduct={handleRateProduct}
          onInstantBuy={handleInstantBuy}
        />
      )}

      {isModalOpen('vault') && (
        <KeyVaultModal
          isOpen={true}
          onClose={closeModal}
          orders={orders}
          currency={currentUser.currency}
          onOpenTickets={() => openModal('tickets')}
        />
      )}

      {isModalOpen('createPool') && (
        <CreatePoolModal
          isOpen={true}
          onClose={closeModal}
          onSuccessCreate={handleCreatePool}
          currency={currentUser.currency}
          products={products}
          initialProduct={modalPayload.initialProduct || null}
        />
      )}

      {isModalOpen('wallet') && (
        <WalletModal
          isOpen={true}
          onClose={closeModal}
          user={currentUser}
          currency={currentUser.currency}
          onDeposit={depositMoney}
          onOpenDepositHub={() => openModal('depositHub')}
          onOpenTelcoCard={() => openModal('telcoCard')}
          onOpenLedger={() => openModal('txLedger')}
          onOpenAffiliate={() => openModal('affiliate')}
        />
      )}

      {isModalOpen('depositHub') && (
        <DepositHubModal
          isOpen={true}
          onClose={closeModal}
          user={currentUser}
          currency={currentUser.currency}
          initialAmount={modalPayload.initialDepositAmount}
          initialMethod={modalPayload.initialDepositMethod}
          onDepositSuccess={(amount, methodTitle) => {
            depositMoney(amount, methodTitle);
            triggerConfetti(60, 60);
          }}
        />
      )}

      {isModalOpen('escrowGuide') && (
        <EscrowGuideModal
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {isModalOpen('topup') && (
        <TopupModal
          isOpen={true}
          onClose={closeModal}
          games={games}
          currency={currentUser.currency}
          initialGame={modalPayload.selectedGame || null}
          userBalance={currentUser.walletBalance}
          onConfirmTopup={handleConfirmTopup}
          onOpenWallet={() => openModal('wallet')}
        />
      )}

      {isModalOpen('tickets') && (
        <TicketsModal
          isOpen={true}
          onClose={closeModal}
          tickets={tickets}
          orders={orders}
          user={currentUser}
          onCreateTicket={(subject, category, message) => {
            createSupportTicket({ subject, category, userId: currentUser.id }, message);
            showToast('Đã gửi phiếu hỗ trợ thành công! Đội ngũ sẽ phản hồi sớm.', 'success');
          }}
          onReplyTicket={(ticketId, text) => {
            adminReplyTicket(ticketId, text);
          }}
        />
      )}

      {isModalOpen('sellerSupplier') && (
        <SellerSupplierModal
          isOpen={true}
          onClose={closeModal}
          suppliers={suppliers}
          currency={currentUser.currency}
        />
      )}

      {isModalOpen('admin') && (
        <AdminPanelModal
          isOpen={true}
          onClose={closeModal}
          products={products}
          games={games}
          orders={orders}
          tickets={tickets}
          suppliers={suppliers}
          members={members}
          chatSessions={chatSessions}
          currency={currentUser.currency}
          systemConfig={systemConfig}
          onUpdateSystemConfig={updateSystemConfig}
          onAddNewProduct={addNewProduct}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
          onUpdateProductStock={updateProductStock}
          onAdjustProductStock={adjustProductStock}
          onToggleFlashSale={toggleFlashSale}
          onBulkAddStock={bulkAddStock}
          onForceEscrowAction={forceEscrowAction}
          onAdminReplyTicket={adminReplyTicket}
          onUpdateSupplierBalance={updateSupplierBalance}
          onUpdateMemberRole={updateMemberRole}
          onToggleMemberStatus={toggleMemberStatus}
          onAdjustMemberBalance={adjustMemberBalance}
          onAdminSendChatMessage={adminSendChatMessage}
          onUpdateGame={updateGame}
          onAddNewGame={addNewGame}
          onDeleteGame={deleteGame}
          onAddGameTier={addGameTier}
          onUpdateGameTier={updateGameTier}
          onDeleteGameTier={deleteGameTier}
          onBulkAdjustGamePrices={bulkAdjustGamePrices}
          categories={categories}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          manualOrders={manualOrders}
          onProcessManualOrder={processManualOrder}
          vouchers={vouchers}
          onAddVoucher={addVoucher}
          onToggleVoucherStatus={toggleVoucherStatus}
          onDeleteVoucher={deleteVoucher}
          topupInvoices={topupInvoices}
          onApproveInvoice={approveInvoice}
          onRejectInvoice={rejectInvoice}
        />
      )}

      {isModalOpen('telcoCard') && (
        <TelcoCardModal
          isOpen={true}
          onClose={closeModal}
          currency={currentUser.currency}
          telcoCards={telcoCards}
          onSubmitCard={handleCardSubmit}
        />
      )}

      {isModalOpen('luckyWheel') && (
        <LuckyWheelModal
          isOpen={true}
          onClose={closeModal}
          user={currentUser}
          currency={currentUser.currency}
          prizes={luckyWheelPrizes}
          onSpinSuccess={handleSpinSuccess}
          onOpenWallet={() => openModal('wallet')}
        />
      )}

      {isModalOpen('orderLookup') && (
        <OrderLookupModal
          isOpen={true}
          onClose={closeModal}
          orders={orders}
          currency={currentUser.currency}
        />
      )}

      {isModalOpen('affiliate') && (
        <AffiliateResellerModal
          isOpen={true}
          onClose={closeModal}
          user={currentUser}
          currency={currentUser.currency}
          withdrawals={withdrawals}
          onWithdrawCommission={(amount) => {
            requestWithdrawal(amount, 'MB Bank', '0388999999', currentUser.name);
          }}
          onRequestWithdrawal={(req) => {
            requestWithdrawal(req.amount, req.bankName, req.accountNumber, req.accountName);
          }}
        />
      )}

      {isModalOpen('txLedger') && (
        <TransactionLedgerModal
          isOpen={true}
          onClose={closeModal}
          transactions={transactions}
          currency={currentUser.currency}
        />
      )}

      {isModalOpen('keyTools') && (
        <KeyToolsModal
          isOpen={true}
          onClose={closeModal}
          currency={currentUser.currency}
        />
      )}

      {isModalOpen('aiConfig') && (
        <AiLanguageCurrencyModal
          isOpen={true}
          onClose={closeModal}
          currentLanguage={currentUser.language || 'vi'}
          currentCurrency={currentUser.currency}
          onApply={handleApplyLanguageCurrency}
        />
      )}

      {isModalOpen('homeAnnouncement') && (
        <HomeAnnouncementModal
          isOpen={true}
          onClose={closeModal}
          systemConfig={systemConfig}
        />
      )}

      {isModalOpen('fanMenu') && (
        <FanMenuModal
          isOpen={true}
          onClose={closeModal}
          user={currentUser}
          activeOrdersCount={orders.length}
          onOpenWallet={() => openModal('wallet')}
          onOpenDepositHub={() => openModal('depositHub')}
          onOpenVault={() => openModal('vault')}
          onOpenCreatePool={() => openModal('createPool')}
          onOpenTopup={() => openModal('topup')}
          onOpenLuckyWheel={() => openModal('luckyWheel')}
          onOpenTelcoCard={() => openModal('telcoCard')}
          onOpenAffiliate={() => openModal('affiliate')}
          onOpenTickets={() => openModal('tickets')}
          onOpenEscrowGuide={() => openModal('escrowGuide')}
          onCurrencyToggle={() => openModal('aiConfig')}
          onOpenSuppliers={() => openModal('sellerSupplier')}
          onOpenAdmin={() => openModal('admin')}
          onOpenOrderLookup={() => openModal('orderLookup')}
          onOpenLedger={() => openModal('txLedger')}
          onOpenKeyTools={() => openModal('keyTools')}
        />
      )}

      {/* Cart & Checkout Confirmation Flow */}
      <CartModal />
      <CheckoutConfirmationModal 
        onOpenVault={() => openModal('vault')}
        onOpenDeposit={() => openModal('depositHub')}
      />

      {/* 9. Live Customer Support Chat Widget */}
      <LiveSupportChatWidget
        chatSessions={chatSessions}
        onSendMessage={sendUserChatMessage}
        userName={currentUser.name}
      />

      {/* 10. Global Notification & Toast Stack Container */}
      <GlobalToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
