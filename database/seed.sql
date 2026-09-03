-- ============================================================================
-- CYBERPOOL INITIAL SEED DATA
-- ============================================================================

-- 1. Insert Categories
INSERT INTO categories (id, name, slug, icon, display_order) VALUES
('ai_tools', 'AI & Machine Learning', 'ai-tools', 'Sparkles', 1),
('entertainment', 'Giải Trí & Phim Ảnh', 'entertainment', 'Film', 2),
('software', 'Bản Quyền Phần Mềm', 'software', 'Key', 3),
('gaming', 'Gaming & Steam Vault', 'gaming', 'Gamepad2', 4),
('vpn_security', 'VPN & An Ninh Mạng', 'vpn-security', 'ShieldCheck', 5)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert SuperAdmin User
INSERT INTO users (id, email, password_hash, full_name, role, wallet_balance, is_verified, status) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@cyberpool.vn', '$2a$12$e8h.tV2f778v5x9028h2.09918239081290381029381029381029', 'CyberPool SuperAdmin', 'SUPER_ADMIN', 50000000, true, 'ACTIVE'),
('00000000-0000-0000-0000-000000000002', 'lombard2508@gmail.com', '$2a$12$e8h.tV2f778v5x9028h2.09918239081290381029381029381029', 'CyberTrader_Vip', 'USER', 2450000, true, 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Core Products
INSERT INTO products (id, category_id, title, subtitle, platform, wholesale_price, retail_price, discount_percent, stock_available, rating, review_count, image_url) VALUES
('prod-chatgpt-plus', 'ai_tools', 'ChatGPT Plus 1 Tháng (Chính Chủ Mail Bạn)', 'Truy cập mô hình GPT-4o, DALL-E 3, Voice Mode không giới hạn', 'OpenAI', 145000, 390000, 63, 42, 4.9, 128, 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80'),
('prod-canva-pro', 'ai_tools', 'Canva Pro Nâng Cấp Mail Riêng 1 Năm', 'Mở khóa kho template vô tận, xóa phông nền AI, Brand Kit VIP', 'Canva', 85000, 240000, 65, 88, 5.0, 310, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'),
('prod-netflix-4k', 'entertainment', 'Netflix Premium Ultra HD 4K 1 Tháng (Slot Riêng)', 'Xem phim 4K HDR mượt mà, hỗ trợ SmartTV, điện thoại, laptop', 'Netflix', 65000, 180000, 64, 25, 4.8, 95, 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80'),
('prod-youtube-premium', 'entertainment', 'YouTube Premium 1 Năm (Không Quảng Cáo + Music)', 'Tận hưởng YouTube không quảng cáo, chạy nền và YouTube Music', 'Google', 120000, 320000, 62, 60, 4.9, 215, 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80'),
('prod-win-11-pro', 'software', 'Key Windows 11 Pro Bản Quyền Vĩnh Viễn OEM', 'Kích hoạt chính hãng Microsoft, cập nhật Windows Update trọn đời', 'Microsoft', 95000, 290000, 67, 120, 5.0, 420, 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO NOTHING;
