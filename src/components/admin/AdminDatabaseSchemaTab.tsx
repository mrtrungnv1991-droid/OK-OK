import React, { useState } from 'react';
import { Database, Search, Table, ArrowUpRight, X, Key, Code, Copy } from 'lucide-react';
import { DATABASE_64_TABLES } from '../../data/databaseSchema64';

interface AdminDatabaseSchemaTabProps {
  // Can be extended if needed
}

export const AdminDatabaseSchemaTab: React.FC<AdminDatabaseSchemaTabProps> = () => {
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [tableCategoryFilter, setTableCategoryFilter] = useState('all');
  const [selectedTableForModal, setSelectedTableForModal] = useState<typeof DATABASE_64_TABLES[0] | null>(null);
  const [copiedTableSql, setCopiedTableSql] = useState<string | null>(null);

  const filteredTables = DATABASE_64_TABLES.filter(t => {
    const matchCat = tableCategoryFilter === 'all' || t.category === tableCategoryFilter;
    const matchSearch = t.name.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
      t.sampleColumns.some(c => c.toLowerCase().includes(tableSearchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Schema Header & Metrics Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0b1220] via-[#0d1627] to-[#0b1220] border border-cyan-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <span>SYSTEM ARCHITECTURE // 64 DATABASE TABLES SCHEMAS</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono">
                  schema_clean.sql VERIFIED
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Khám phá cấu trúc bảng InnoDB, UTF8MB4, khóa chính, chỉ mục và mã nguồn DDL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-700">
              Total Tables: <strong>{DATABASE_64_TABLES.length}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 text-emerald-300 border border-slate-700">
              Engine: <strong>InnoDB</strong>
            </span>
          </div>
        </div>

        {/* Architecture Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2 rounded bg-black/40 border border-slate-800">
            <div className="text-slate-500 text-[10px]">TỔNG FILE HỆ THỐNG</div>
            <div className="text-white font-bold text-sm mt-0.5">~18.700 Files</div>
            <div className="text-[9px] text-slate-400">9K SVG • 3.6K JS • 2.4K PNG</div>
          </div>

          <div className="p-2 rounded bg-black/40 border border-slate-800">
            <div className="text-slate-500 text-[10px]">MÃ NGUỒN PHP CORE</div>
            <div className="text-amber-400 font-bold text-sm mt-0.5">388 Files</div>
            <div className="text-[9px] text-slate-400">Core Engine & Crons</div>
          </div>

          <div className="p-2 rounded bg-black/40 border border-slate-800">
            <div className="text-slate-500 text-[10px]">BẢNG CƠ SỞ DỮ LIỆU</div>
            <div className="text-cyan-400 font-bold text-sm mt-0.5">64 Tables</div>
            <div className="text-[9px] text-slate-400">schema_clean.sql</div>
          </div>

          <div className="p-2 rounded bg-black/40 border border-slate-800">
            <div className="text-slate-500 text-[10px]">DANH MỤC TOP-UP GAME</div>
            <div className="text-purple-400 font-bold text-sm mt-0.5">121 Games / 1.702 Tiers</div>
            <div className="text-[9px] text-slate-400">Midasbuy / SmileOne API</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400" />
            <input
              type="text"
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              placeholder="Tìm theo tên bảng hoặc trường dữ liệu..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-lg text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none"
            />
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Hiển thị <strong>{filteredTables.length}</strong> / {DATABASE_64_TABLES.length} bảng
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 font-mono text-[11px] scrollbar-none">
          {[
            { id: 'all', label: 'Tất Cả', count: DATABASE_64_TABLES.length },
            { id: 'topup', label: 'Top-up Games', count: DATABASE_64_TABLES.filter(t => t.category === 'topup').length },
            { id: 'products', label: 'Sản Phẩm', count: DATABASE_64_TABLES.filter(t => t.category === 'products').length },
            { id: 'orders', label: 'Đơn Hàng', count: DATABASE_64_TABLES.filter(t => t.category === 'orders').length },
            { id: 'users', label: 'Người Dùng', count: DATABASE_64_TABLES.filter(t => t.category === 'users').length },
            { id: 'finance', label: 'Nạp/Rút & Ví', count: DATABASE_64_TABLES.filter(t => t.category === 'finance').length },
            { id: 'support', label: 'Hỗ Trợ & CSKH', count: DATABASE_64_TABLES.filter(t => t.category === 'support').length },
            { id: 'marketing', label: 'Affiliate & CTV', count: DATABASE_64_TABLES.filter(t => t.category === 'marketing').length },
            { id: 'system', label: 'Hệ Thống', count: DATABASE_64_TABLES.filter(t => t.category === 'system').length },
            { id: 'logs', label: 'Nhật Ký Logs', count: DATABASE_64_TABLES.filter(t => t.category === 'logs').length },
            { id: 'core', label: 'Core Tables', count: DATABASE_64_TABLES.filter(t => t.category === 'core').length },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setTableCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                tableCategoryFilter === cat.id
                  ? 'bg-cyan-500 text-black font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* 64 Tables List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTables.map(table => (
          <div
            key={table.name}
            onClick={() => setSelectedTableForModal(table)}
            className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer flex flex-col justify-between space-y-3 group hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300 group-hover:text-cyan-200">
                  <Table className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-xs">{table.name}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase">
                  {table.category}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 font-sans line-clamp-2">
                {table.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-300">{table.columnsCount} columns</span>
                <span>•</span>
                <span className="text-emerald-400">{table.rowCount.toLocaleString()} rows</span>
              </div>

              <div className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-bold">
                <span>Chi tiết</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Table Detail Modal / Drawer */}
      {selectedTableForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-2xl bg-[#090d18] border border-cyan-500/50 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {selectedTableForModal.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                      {selectedTableForModal.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      {selectedTableForModal.cleanStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    {selectedTableForModal.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTableForModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500">Khóa chính:</span>{' '}
                <span className="text-cyan-300 font-bold">{selectedTableForModal.primaryKey}</span>
              </div>
              <div>
                <span className="text-slate-500">Số cột (Fields):</span>{' '}
                <span className="text-white font-bold">{selectedTableForModal.columnsCount}</span>
              </div>
              <div>
                <span className="text-slate-500">Storage Engine:</span>{' '}
                <span className="text-emerald-400 font-bold">{selectedTableForModal.engine}</span>
              </div>
              <div>
                <span className="text-slate-500">Bản ghi ước tính:</span>{' '}
                <span className="text-amber-400 font-bold">{selectedTableForModal.rowCount.toLocaleString()}</span>
              </div>
            </div>

            {/* Indexes and Sample Columns */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div>
                <div className="text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>TRƯỜNG DỮ LIỆU ĐẠI DIỆN ({selectedTableForModal.sampleColumns.length}/{selectedTableForModal.columnsCount}):</span>
                  <span className="text-[10px] text-slate-500">{selectedTableForModal.collation}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedTableForModal.sampleColumns.map((col, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {col === selectedTableForModal.primaryKey ? (
                          <Key className="w-3 h-3 text-amber-400" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        )}
                        <span className={col === selectedTableForModal.primaryKey ? 'text-amber-300 font-bold' : 'text-slate-200 font-bold'}>
                          {col}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {col === selectedTableForModal.primaryKey ? 'PRI KEY' : 'FIELD'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-300 mb-1.5">
                  CHỈ MỤC & TỐI ƯU TRUY VẤN (INDEXES):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTableForModal.indexes.map((idxName, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[10px]">
                      {idxName}
                    </span>
                  ))}
                </div>
              </div>

              {/* SQL DDL Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SQL DDL STRUCTURE (schema_clean.sql):</span>
                  </span>
                  <button
                    onClick={() => {
                      const sql = `-- Table structure for table \`${selectedTableForModal.name}\`\n` +
                        `DROP TABLE IF EXISTS \`${selectedTableForModal.name}\`;\n` +
                        `CREATE TABLE \`${selectedTableForModal.name}\` (\n` +
                        `  \`${selectedTableForModal.primaryKey}\` int(11) NOT NULL AUTO_INCREMENT,\n` +
                        selectedTableForModal.sampleColumns.filter(c => c !== selectedTableForModal.primaryKey).map(c => `  \`${c}\` varchar(255) DEFAULT NULL`).join(',\n') +
                        `,\n  PRIMARY KEY (\`${selectedTableForModal.primaryKey}\`)\n` +
                        `) ENGINE=${selectedTableForModal.engine} DEFAULT CHARSET=utf8mb4 COLLATE=${selectedTableForModal.collation};`;
                      navigator.clipboard.writeText(sql);
                      setCopiedTableSql(selectedTableForModal.name);
                      setTimeout(() => setCopiedTableSql(null), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedTableSql === selectedTableForModal.name ? 'Đã Sao Chép SQL!' : 'Sao Chép DDL'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-black/70 border border-slate-800 text-[10px] text-cyan-200 overflow-x-auto font-mono">
                  {`-- Table structure for table \`${selectedTableForModal.name}\`\n`}
                  {`DROP TABLE IF EXISTS \`${selectedTableForModal.name}\`;\n`}
                  {`CREATE TABLE \`${selectedTableForModal.name}\` (\n`}
                  {`  \`${selectedTableForModal.primaryKey}\` int(11) NOT NULL AUTO_INCREMENT,\n`}
                  {selectedTableForModal.sampleColumns.filter(c => c !== selectedTableForModal.primaryKey).map(c => `  \`${c}\` varchar(255) DEFAULT NULL`).join(',\n')}
                  {`,\n  PRIMARY KEY (\`${selectedTableForModal.primaryKey}\`)\n`}
                  {`) ENGINE=${selectedTableForModal.engine} DEFAULT CHARSET=utf8mb4 COLLATE=${selectedTableForModal.collation};`}
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTableForModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
