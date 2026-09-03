import React, { useState } from 'react';
import { 
  Gamepad2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  Layers, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Copy, 
  RefreshCw, 
  Save, 
  X, 
  Percent, 
  Server, 
  ShieldCheck, 
  Zap, 
  Tag, 
  DollarSign, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { GameItem, TopupTier } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AdminGamesTabProps {
  games: GameItem[];
  currency?: 'VND' | 'USD';
  onUpdateGame?: (gameId: string, updatedData: Partial<GameItem>) => void;
  onAddNewGame?: (newGame: Partial<GameItem>) => void;
  onDeleteGame?: (gameId: string) => void;
  onAddGameTier?: (gameId: string, tier: TopupTier) => void;
  onUpdateGameTier?: (gameId: string, tierId: string, updatedTier: Partial<TopupTier>) => void;
  onDeleteGameTier?: (gameId: string, tierId: string) => void;
  onBulkAdjustGamePrices?: (gameId: string, percentDelta: number) => void;
}

export const AdminGamesTab: React.FC<AdminGamesTabProps> = ({
  games,
  currency = 'VND',
  onUpdateGame,
  onAddNewGame,
  onDeleteGame,
  onAddGameTier,
  onUpdateGameTier,
  onDeleteGameTier,
  onBulkAdjustGamePrices
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [expandedGameIds, setExpandedGameIds] = useState<Record<string, boolean>>({});
  
  // Notice Feedback
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Modal / Form States
  const [isAddingNewGame, setIsAddingNewGame] = useState(false);
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);
  const [bulkPercent, setBulkPercent] = useState<number>(5);
  const [bulkScope, setBulkScope] = useState<'all' | 'filtered' | 'selected'>('all');

  // Inline Editing Game Form
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [gameEditForm, setGameEditForm] = useState<Partial<GameItem>>({});

  // New Game Form
  const [newGameForm, setNewGameForm] = useState<{
    name: string;
    category: string;
    publisher: string;
    thumbnail: string;
    banner: string;
    uidLabel: string;
    uidPlaceholder: string;
    hasZoneId: boolean;
    zonePlaceholder: string;
    servers: string;
    requiresServer: boolean;
    description: string;
    initialTierCount: number;
    basePrice: number;
  }>({
    name: '',
    category: 'Mobile',
    publisher: 'Garena / VNG / Riot',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    uidLabel: 'UID Nhân Vật (ID Game)',
    uidPlaceholder: 'Nhập UID / Tên nhân vật game',
    hasZoneId: false,
    zonePlaceholder: 'Zone ID / Server ID',
    servers: 'Asia, Vietnam, Global',
    requiresServer: false,
    description: 'Nạp trực tiếp qua cổng API kết nối nhà phát hành, nạp siêu tốc 3-5 giây.',
    initialTierCount: 5,
    basePrice: 50000
  });

  // Adding Tier state for a game
  const [addingTierForGameId, setAddingTierForGameId] = useState<string | null>(null);
  const [newTierForm, setNewTierForm] = useState<{
    name: string;
    retailPrice: number;
    groupPrice: number;
    badge: string;
  }>({
    name: 'Gói Nạp Mới',
    retailPrice: 50000,
    groupPrice: 42000,
    badge: 'HOT'
  });

  const showNotification = (msg: string) => {
    setSaveNotice(msg);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Toggle expand game tiers
  const toggleExpand = (gameId: string) => {
    setExpandedGameIds(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
  };

  // Expand all / Collapse all
  const handleExpandAll = (expand: boolean) => {
    const nextState: Record<string, boolean> = {};
    if (expand) {
      games.forEach(g => { nextState[g.id] = true; });
    }
    setExpandedGameIds(nextState);
  };

  // Categories list
  const categoriesList = ['all', 'Mobile', 'PC', 'Console', 'Other'];

  // Filtered games
  const filteredGames = games.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || g.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchSearch && matchCategory;
  });

  // Total tiers count
  const totalTiersCount = games.reduce((sum, g) => sum + (g.tiers?.length || 0), 0);

  // Start inline editing game
  const handleStartEditGame = (game: GameItem) => {
    setEditingGameId(game.id);
    setGameEditForm({
      name: game.name,
      category: game.category,
      publisher: game.publisher,
      thumbnail: game.thumbnail,
      uidLabel: game.uidLabel,
      uidPlaceholder: game.uidPlaceholder,
      requiresServer: game.requiresServer,
      hasZoneId: game.hasZoneId,
      description: game.description
    });
  };

  // Save inline editing game
  const handleSaveGameEdit = (gameId: string) => {
    if (onUpdateGame) {
      onUpdateGame(gameId, gameEditForm);
    }
    setEditingGameId(null);
    showNotification(`Đã lưu cập nhật thông tin Game "${gameEditForm.name || gameId}"!`);
  };

  // Direct Tier update
  const handleTierChange = (gameId: string, tierId: string, field: keyof TopupTier, value: any) => {
    if (onUpdateGameTier) {
      onUpdateGameTier(gameId, tierId, { [field]: value });
    }
  };

  // Quick Price delta for tier (+/- amount or +/- %)
  const handleQuickAdjustTierPrice = (gameId: string, tier: TopupTier, percentDelta: number) => {
    const newRetail = Math.max(1000, Math.round(tier.retailPrice * (1 + percentDelta / 100)));
    const newGroup = Math.max(1000, Math.round(tier.groupPrice * (1 + percentDelta / 100)));
    if (onUpdateGameTier) {
      onUpdateGameTier(gameId, tier.id, {
        retailPrice: newRetail,
        groupPrice: newGroup
      });
      showNotification(`Đã điều chỉnh giá gói "${tier.name}" (${percentDelta > 0 ? '+' : ''}${percentDelta}%)`);
    }
  };

  // Add new tier to game
  const handleCreateTier = (gameId: string) => {
    const tierId = `tier-${Date.now()}`;
    const retail = Number(newTierForm.retailPrice) || 50000;
    const tier: TopupTier = {
      id: tierId,
      name: newTierForm.name || 'Gói Nạp Mới',
      currencyAmount: `${(retail / 100).toLocaleString('vi-VN')} Gems/Points`,
      icon: '💎',
      retailPrice: retail,
      groupPrice: Number(newTierForm.groupPrice) || Math.round(retail * 0.85),
      badge: newTierForm.badge || undefined
    };

    if (onAddGameTier) {
      onAddGameTier(gameId, tier);
    }
    setAddingTierForGameId(null);
    setNewTierForm({
      name: 'Gói Nạp Mới',
      retailPrice: 50000,
      groupPrice: 42000,
      badge: 'HOT'
    });
    showNotification(`Đã thêm gói nạp "${tier.name}" vào game!`);
  };

  // Delete tier from game
  const handleDeleteTier = (gameId: string, tierId: string, tierName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa gói nạp "${tierName}" khỏi game này?`)) {
      if (onDeleteGameTier) {
        onDeleteGameTier(gameId, tierId);
      }
      showNotification(`Đã xóa gói nạp "${tierName}"!`);
    }
  };

  // Clone a game
  const handleCloneGame = (game: GameItem) => {
    const newId = `game-clone-${Date.now()}`;
    const clonedGame: Partial<GameItem> = {
      ...game,
      id: newId,
      name: `${game.name} (Bản Sao)`,
      tiers: game.tiers.map(t => ({
        ...t,
        id: `tier-cloned-${Date.now()}-${Math.random().toString(36).substring(7)}`
      }))
    };
    if (onAddNewGame) {
      onAddNewGame(clonedGame);
    }
    showNotification(`Đã nhân bản game "${game.name}" thành công!`);
  };

  // Create new game
  const handleCreateNewGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameForm.name.trim()) return;

    const baseP = Number(newGameForm.basePrice) || 50000;
    const count = Number(newGameForm.initialTierCount) || 3;
    const generatedTiers: TopupTier[] = [];

    for (let i = 1; i <= count; i++) {
      const mult = i === 1 ? 1 : i === 2 ? 2.5 : i === 3 ? 5 : i * 2;
      const retail = Math.round(baseP * mult);
      const group = Math.round(retail * 0.85);
      generatedTiers.push({
        id: `t-${Date.now()}-${i}`,
        name: i === 1 ? 'Gói Khởi Động' : i === 2 ? 'Gói Cơ Bản (x2)' : i === 3 ? 'Gói VIP Thẻ Tháng' : `Gói Đại Gia Tier ${i}`,
        currencyAmount: `${(retail / 100).toLocaleString('vi-VN')} Gems/Points`,
        icon: '💎',
        retailPrice: retail,
        groupPrice: group,
        badge: i === 3 ? 'BEST SELLER' : i === 2 ? 'HOT' : undefined
      });
    }

    const newGame: Partial<GameItem> = {
      name: newGameForm.name,
      category: newGameForm.category,
      publisher: newGameForm.publisher,
      thumbnail: newGameForm.thumbnail,
      banner: newGameForm.banner,
      uidLabel: newGameForm.uidLabel,
      uidPlaceholder: newGameForm.uidPlaceholder,
      hasZoneId: newGameForm.hasZoneId,
      zonePlaceholder: newGameForm.zonePlaceholder,
      servers: newGameForm.servers.split(',').map(s => s.trim()).filter(Boolean),
      requiresServer: newGameForm.requiresServer,
      description: newGameForm.description,
      tiers: generatedTiers
    };

    if (onAddNewGame) {
      onAddNewGame(newGame);
    }

    setIsAddingNewGame(false);
    setNewGameForm({
      name: '',
      category: 'Mobile',
      publisher: 'Garena / VNG / Riot',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      uidLabel: 'UID Nhân Vật (ID Game)',
      uidPlaceholder: 'Nhập UID / Tên nhân vật game',
      hasZoneId: false,
      zonePlaceholder: 'Zone ID / Server ID',
      servers: 'Asia, Vietnam, Global',
      requiresServer: false,
      description: 'Nạp trực tiếp qua cổng API kết nối nhà phát hành, nạp siêu tốc 3-5 giây.',
      initialTierCount: 5,
      basePrice: 50000
    });
    showNotification(`Đã tạo mới tựa game "${newGame.name}" với ${generatedTiers.length} gói nạp!`);
  };

  // Delete a game
  const handleDeleteGameConfirm = (game: GameItem) => {
    if (confirm(`⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA TỰA GAME "${game.name.toUpperCase()}" VÀ TOÀN BỘ ${game.tiers.length} GÓI NẠP?`)) {
      if (onDeleteGame) {
        onDeleteGame(game.id);
      }
      showNotification(`Đã xóa vĩnh viễn tựa game "${game.name}"!`);
    }
  };

  // Execute bulk price adjustment
  const handleExecuteBulkPrice = () => {
    if (bulkScope === 'all') {
      if (onBulkAdjustGamePrices) {
        onBulkAdjustGamePrices('all', bulkPercent);
      }
    } else if (bulkScope === 'filtered') {
      filteredGames.forEach(g => {
        if (onBulkAdjustGamePrices) {
          onBulkAdjustGamePrices(g.id, bulkPercent);
        }
      });
    } else if (selectedGameId) {
      if (onBulkAdjustGamePrices) {
        onBulkAdjustGamePrices(selectedGameId, bulkPercent);
      }
    }
    setIsBulkAdjustOpen(false);
    showNotification(`Đã điều chỉnh ${bulkPercent > 0 ? '+' : ''}${bulkPercent}% giá thành công!`);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {saveNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveNotice}</span>
          </div>
          <button onClick={() => setSaveNotice(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Metrics Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                QUẢN LÝ GÓI NẠP GAME DIRECT & API TIERS
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-600 text-white font-extrabold font-mono">
                  {games.length} GAMES
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Cấu hình trực tiếp 121 tựa game, {totalTiersCount.toLocaleString()} gói nạp, bảng giá sỉ/lẻ và cổng API kết nối.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExpandAll(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            title="Mở rộng tất cả các gói nạp"
          >
            <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
            <span>Mở Tất Cả</span>
          </button>

          <button
            onClick={() => handleExpandAll(false)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            title="Thu gọn tất cả"
          >
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            <span>Thu Gọn</span>
          </button>

          <button
            onClick={() => setIsBulkAdjustOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
            title="Tăng hoặc giảm giá đồng loạt cho toàn bộ game"
          >
            <Percent className="w-3.5 h-3.5 text-amber-200" />
            <span>Tăng / Giảm Giá Hàng Loạt</span>
          </button>

          <button
            onClick={() => setIsAddingNewGame(true)}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/50 cursor-pointer transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 text-purple-200" />
            <span>+ Thêm Tựa Game Mới</span>
          </button>
        </div>
      </div>

      {/* Modal / Panel: TĂNG / GIẢM GIÁ HÀNG LOẠT */}
      {isBulkAdjustOpen && (
        <div className="p-4 rounded-xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                ĐIỀU CHỈNH TĂNG / GIẢM GIÁ ĐỒNG LOẠT (% PERCENTAGE)
              </h4>
            </div>
            <button onClick={() => setIsBulkAdjustOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Phạm vi áp dụng:</label>
              <select
                value={bulkScope}
                onChange={(e) => setBulkScope(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="all">Toàn bộ 121 Tựa Game ({totalTiersCount} Gói nạp)</option>
                <option value="filtered">Chỉ các game đang lọc ({filteredGames.length} Games)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Mức tăng / giảm (%):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bulkPercent}
                  onChange={(e) => setBulkPercent(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold"
                  placeholder="Ví dụ: 5 hoặc -10"
                />
                <span className="text-xs font-bold text-amber-400">%</span>
              </div>
            </div>

            <div className="flex items-end gap-2">
              {[-10, -5, 5, 10, 15].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setBulkPercent(pct)}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                    bulkPercent === pct 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setIsBulkAdjustOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              onClick={handleExecuteBulkPrice}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Xác Nhận Thay Đổi ({bulkPercent > 0 ? `+${bulkPercent}%` : `${bulkPercent}%`})</span>
            </button>
          </div>
        </div>
      )}

      {/* Form: THÊM TỰA GAME MỚI */}
      {isAddingNewGame && (
        <form onSubmit={handleCreateNewGame} className="p-4 rounded-xl bg-slate-900/90 border-2 border-purple-500/50 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                THÊM TỰA GAME MỚI VÀO DANH MỤC NẠP TRỰC TIẾP
              </h4>
            </div>
            <button type="button" onClick={() => setIsAddingNewGame(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tên Tựa Game (*):</label>
              <input
                type="text"
                required
                value={newGameForm.name}
                onChange={(e) => setNewGameForm({ ...newGameForm, name: e.target.value })}
                placeholder="Ví dụ: Black Myth Wukong, Zenless Zone Zero..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Thể loại nền tảng:</label>
              <select
                value={newGameForm.category}
                onChange={(e) => setNewGameForm({ ...newGameForm, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="Mobile">Mobile (iOS / Android)</option>
                <option value="PC">PC / Windows</option>
                <option value="Console">Console (PlayStation / Xbox / Switch)</option>
                <option value="Other">Khác (Steam / Webgame)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nhà Phát Hành:</label>
              <input
                type="text"
                value={newGameForm.publisher}
                onChange={(e) => setNewGameForm({ ...newGameForm, publisher: e.target.value })}
                placeholder="Garena, VNG, Riot, Mihoyo..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Link Ảnh Thumbnail:</label>
              <input
                type="text"
                value={newGameForm.thumbnail}
                onChange={(e) => setNewGameForm({ ...newGameForm, thumbnail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nhãn Nhập ID Khách Hàng:</label>
              <input
                type="text"
                value={newGameForm.uidLabel}
                onChange={(e) => setNewGameForm({ ...newGameForm, uidLabel: e.target.value })}
                placeholder="UID Game, Tên tài khoản, OpenID..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Số Gói Nạp Khởi Tạo Tự Động:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newGameForm.initialTierCount}
                  onChange={(e) => setNewGameForm({ ...newGameForm, initialTierCount: parseInt(e.target.value) || 3 })}
                  className="w-20 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                />
                <span className="text-[11px] text-slate-400">gói (Giá gốc từ: {formatCurrency(newGameForm.basePrice, currency)})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newGameForm.hasZoneId}
                  onChange={(e) => setNewGameForm({ ...newGameForm, hasZoneId: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-500 bg-slate-900 border-slate-700"
                />
                <span>Cần nhập Zone ID / Server ID</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newGameForm.requiresServer}
                  onChange={(e) => setNewGameForm({ ...newGameForm, requiresServer: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-500 bg-slate-900 border-slate-700"
                />
                <span>Chọn Server Game (Asia / Global / VN)</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNewGame(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Thêm Game & Tự Động Tạo Gói Nạp</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search & Filtering Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tựa game theo tên, nhà phát hành hoặc mã game..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'all' ? `Tất Cả (${games.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Games List with Direct Inline Editing */}
      <div className="space-y-3">
        {filteredGames.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            Không tìm thấy tựa game nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredGames.map(game => {
            const isExpanded = !!expandedGameIds[game.id];
            const isEditing = editingGameId === game.id;

            return (
              <div
                key={game.id}
                className="rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden"
              >
                {/* Game Card Header */}
                <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={game.thumbnail}
                      alt={game.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0 shadow-md"
                    />

                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          value={gameEditForm.name || ''}
                          onChange={(e) => setGameEditForm({ ...gameEditForm, name: e.target.value })}
                          className="bg-slate-950 border border-purple-500 rounded-lg px-2 py-1 text-xs text-white font-bold"
                          placeholder="Tên game"
                        />
                        <input
                          type="text"
                          value={gameEditForm.publisher || ''}
                          onChange={(e) => setGameEditForm({ ...gameEditForm, publisher: e.target.value })}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                          placeholder="Nhà phát hành"
                        />
                        <select
                          value={gameEditForm.category || 'Mobile'}
                          onChange={(e) => setGameEditForm({ ...gameEditForm, category: e.target.value })}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        >
                          <option value="Mobile">Mobile</option>
                          <option value="PC">PC</option>
                          <option value="Console">Console</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-extrabold text-white truncate">{game.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[9px] bg-purple-950 text-purple-300 border border-purple-500/30 font-bold">
                            {game.category}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400">
                            {game.publisher}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold font-mono">
                            {game.tiers?.length || 0} Gói Nạp
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-3">
                          <span>Nhập: <strong className="text-slate-300">{game.uidLabel}</strong></span>
                          {game.hasZoneId && <span className="text-amber-400 font-semibold">• Có Zone ID</span>}
                          {game.requiresServer && <span className="text-cyan-400 font-semibold">• Có Server</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions for Game */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveGameEdit(game.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu</span>
                        </button>
                        <button
                          onClick={() => setEditingGameId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEditGame(game)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          title="Sửa thông tin tựa game"
                        >
                          <Edit3 className="w-3 h-3 text-cyan-400" />
                          <span>Sửa</span>
                        </button>

                        <button
                          onClick={() => handleCloneGame(game)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          title="Nhân bản tựa game này"
                        >
                          <Copy className="w-3 h-3 text-purple-400" />
                          <span>Nhân Bản</span>
                        </button>

                        <button
                          onClick={() => setAddingTierForGameId(game.id)}
                          className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Thêm gói nạp mới vào game này"
                        >
                          <Plus className="w-3 h-3 text-purple-400" />
                          <span>+ Gói Nạp</span>
                        </button>

                        <button
                          onClick={() => handleDeleteGameConfirm(game)}
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-950 hover:text-rose-300 transition-colors cursor-pointer"
                          title="Xóa tựa game này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => toggleExpand(game.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                            isExpanded
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-purple-300'
                          }`}
                        >
                          <span>{isExpanded ? 'Đóng Gói' : `Xem ${game.tiers.length} Gói`}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Form: Thêm Gói Nạp Mới Vào Game Này */}
                {addingTierForGameId === game.id && (
                  <div className="p-3 bg-purple-950/30 border-t border-b border-purple-500/30 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                      <span>THÊM GÓI NẠP MỚI VÀO "{game.name.toUpperCase()}":</span>
                      <button onClick={() => setAddingTierForGameId(null)} className="text-slate-400 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <input
                          type="text"
                          value={newTierForm.name}
                          onChange={(e) => setNewTierForm({ ...newTierForm, name: e.target.value })}
                          placeholder="Tên gói (Ví dụ: 100 KC, Thẻ Tuần...)"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={newTierForm.retailPrice}
                          onChange={(e) => setNewTierForm({ ...newTierForm, retailPrice: parseInt(e.target.value) || 0 })}
                          placeholder="Giá bán lẻ (VND)"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={newTierForm.groupPrice}
                          onChange={(e) => setNewTierForm({ ...newTierForm, groupPrice: parseInt(e.target.value) || 0 })}
                          placeholder="Giá sỉ gom đơn (VND)"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-cyan-300 font-mono"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newTierForm.badge}
                          onChange={(e) => setNewTierForm({ ...newTierForm, badge: e.target.value })}
                          placeholder="Badge (HOT, VIP...)"
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-amber-300"
                        />
                        <button
                          onClick={() => handleCreateTier(game.id)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded Tiers Grid (SỬA TRỰC TIẾP & TĂNG / GIẢM GIÁ) */}
                {isExpanded && (
                  <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/40">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                      <span>DANH SÁCH {game.tiers.length} GÓI NẠP (SỬA TRỰC TIẾP GIÁ & TÊN GÓI):</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Chỉnh giá nhanh cho game này:</span>
                        <button
                          onClick={() => {
                            if (onBulkAdjustGamePrices) {
                              onBulkAdjustGamePrices(game.id, -5);
                              showNotification(`Đã giảm -5% giá toàn bộ gói nạp game "${game.name}"`);
                            }
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold"
                        >
                          -5%
                        </button>
                        <button
                          onClick={() => {
                            if (onBulkAdjustGamePrices) {
                              onBulkAdjustGamePrices(game.id, 5);
                              showNotification(`Đã tăng +5% giá toàn bộ gói nạp game "${game.name}"`);
                            }
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-mono font-bold"
                        >
                          +5%
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {game.tiers.map((tier, idx) => (
                        <div
                          key={tier.id || idx}
                          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
                        >
                          {/* Tier Name & Badge */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0 font-mono">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) => handleTierChange(game.id, tier.id, 'name', e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-purple-500 rounded px-2 py-1 text-xs text-white font-medium focus:outline-none"
                              placeholder="Tên gói nạp"
                            />
                            <input
                              type="text"
                              value={tier.badge || ''}
                              onChange={(e) => handleTierChange(game.id, tier.id, 'badge', e.target.value)}
                              className="w-20 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded px-1.5 py-1 text-[10px] text-amber-300 text-center font-bold focus:outline-none placeholder:text-slate-600"
                              placeholder="Badge (HOT)"
                            />
                          </div>

                          {/* Prices & Quick Adjust Controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Retail Price */}
                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-400">Lẻ:</span>
                              <input
                                type="number"
                                value={tier.retailPrice}
                                onChange={(e) => handleTierChange(game.id, tier.id, 'retailPrice', parseInt(e.target.value) || 0)}
                                className="w-20 bg-transparent text-xs text-white font-bold font-mono text-right focus:outline-none focus:text-purple-300"
                              />
                              <span className="text-[10px] text-slate-500">đ</span>
                            </div>

                            {/* Group Price */}
                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              <span className="text-[10px] text-cyan-400">Sỉ:</span>
                              <input
                                type="number"
                                value={tier.groupPrice}
                                onChange={(e) => handleTierChange(game.id, tier.id, 'groupPrice', parseInt(e.target.value) || 0)}
                                className="w-20 bg-transparent text-xs text-cyan-300 font-bold font-mono text-right focus:outline-none focus:text-cyan-200"
                              />
                              <span className="text-[10px] text-slate-500">đ</span>
                            </div>

                            {/* Quick Delta Buttons */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleQuickAdjustTierPrice(game.id, tier, -10)}
                                className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-mono font-bold"
                                title="Giảm -10% giá gói này"
                              >
                                -10%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjustTierPrice(game.id, tier, 10)}
                                className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-mono font-bold"
                                title="Tăng +10% giá gói này"
                              >
                                +10%
                              </button>
                            </div>

                            {/* Delete Tier */}
                            <button
                              type="button"
                              onClick={() => handleDeleteTier(game.id, tier.id, tier.name)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Xóa gói nạp này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
