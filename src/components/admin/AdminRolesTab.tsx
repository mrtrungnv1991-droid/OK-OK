import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Lock, 
  Key, 
  Shield, 
  Eye, 
  FileEdit, 
  Sliders
} from 'lucide-react';
import { AdminRoleItem, AdminStaffUser, AdminPermission, Currency } from '../../types';
import { INITIAL_ADMIN_ROLES, INITIAL_ADMIN_STAFF } from '../../data/systemExtendedData';

interface AdminRolesTabProps {
  currency?: Currency;
}

export const AdminRolesTab: React.FC<AdminRolesTabProps> = () => {
  const [subTab, setSubTab] = useState<'roles_matrix' | 'staff_users'>('roles_matrix');
  const [roles, setRoles] = useState<AdminRoleItem[]>(INITIAL_ADMIN_ROLES);
  const [staffUsers, setStaffUsers] = useState<AdminStaffUser[]>(INITIAL_ADMIN_STAFF);
  const [selectedRole, setSelectedRole] = useState<AdminRoleItem>(INITIAL_ADMIN_ROLES[0]);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const modulesList: { id: AdminPermission['module']; label: string }[] = [
    { id: 'products', label: '1. Sản Phẩm & Kho Key' },
    { id: 'categories', label: '2. Chuyên Mục & Phân Nhánh' },
    { id: 'manual_orders', label: '3. Hàng Đợi Đơn Hàng Thủ Công' },
    { id: 'sold_orders', label: '4. Đơn Hàng Đã Bán & Kho Lưu Trữ' },
    { id: 'banking', label: '5. Cổng Nạp Tiền & Hóa Đơn' },
    { id: 'ctv_reseller', label: '6. CTV Panel & Đại Lý Reseller' },
    { id: 'promotions', label: '7. Khuyến Mãi, Giảm Giá & Minigame' },
    { id: 'members', label: '8. Thành Viên & Số Dư Ví' },
    { id: 'security_ip', label: '9. Tường Lửa & Block IP' },
    { id: 'automation_cron', label: '10. Tự Động Hóa & Cron Jobs' },
    { id: 'logs', label: '11. Lịch Sử Biến Động & Đăng Nhập' },
    { id: 'settings', label: '12. Cài Đặt Hệ Thống & Giao Diện' },
    { id: 'roles', label: '13. Phân Quyền & Tài Khoản Admin' }
  ];

  const handleTogglePermission = (moduleId: AdminPermission['module'], permType: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    if (selectedRole.isSuperAdmin) {
      setSaveNotice('⚠️ Không thể chỉnh sửa quyền của Quản Trị Viên Tối Cao (Super Admin)!');
      setTimeout(() => setSaveNotice(null), 3000);
      return;
    }

    const updatedPermissions = selectedRole.permissions.map(p => {
      if (p.module === moduleId) {
        return { ...p, [permType]: !p[permType] };
      }
      return p;
    });

    const updatedRole = { ...selectedRole, permissions: updatedPermissions };
    setSelectedRole(updatedRole);
    setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
    setSaveNotice('Đã cập nhật ma trận quyền hạn cho nhóm!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="space-y-4 font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 tracking-wide">
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            <span>PHÂN QUYỀN NHÂN VIÊN & TÀI KHOẢN ADMIN (RBAC ACCESS CONTROL)</span>
            <span className="px-2 py-0.5 rounded text-xs bg-rose-950 text-rose-300 border border-rose-500/30 font-medium">
              Role Matrix
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Cấu hình phân quyền chi tiết (Xem, Thêm, Sửa, Xóa) theo từng vai trò: Super Admin, Quản lý kho, Kế toán duyệt tiền, CSKH 24/7.
          </p>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSubTab('roles_matrix')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 cursor-pointer text-xs transition-colors ${
            subTab === 'roles_matrix'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Ma Trận Quyền Hạn ({roles.length} Nhóm Quyền)</span>
        </button>

        <button
          onClick={() => setSubTab('staff_users')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 cursor-pointer text-xs transition-colors ${
            subTab === 'staff_users'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Tài Khoản Nhân Viên Ban Quản Trị ({staffUsers.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: ROLES MATRIX */}
      {subTab === 'roles_matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Roles List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-400 text-xs uppercase mb-2 tracking-wider">Chọn Nhóm Quyền:</h4>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-1.5 ${
                  selectedRole.id === role.id
                    ? 'bg-slate-900 border-rose-500 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ color: role.color }}>{role.name}</span>
                  {role.isSuperAdmin && (
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-semibold">Root</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2">{role.description}</div>
              </button>
            ))}
          </div>

          {/* Matrix Detail */}
          <div className="md:col-span-3 space-y-3">
            <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <h4 className="font-bold text-white text-sm">
                  BẢNG PHÂN QUYỀN CHI TIẾT: <span style={{ color: selectedRole.color }}>{selectedRole.name}</span>
                </h4>
                <div className="text-xs text-slate-400 mt-0.5">
                  Tích chọn các quyền được phép thực thi trên từng phân hệ.
                </div>
              </div>
              {selectedRole.isSuperAdmin && (
                <span className="px-3 py-1 rounded-md bg-rose-950 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                  Quản Trị Tối Cao: Toàn Quyền
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold tracking-wider">
                    <th className="py-3 px-4">Phân Hệ Quản Trị</th>
                    <th className="py-3 px-4 text-center w-28">Xem (View)</th>
                    <th className="py-3 px-4 text-center w-32">Thêm (Create)</th>
                    <th className="py-3 px-4 text-center w-32">Sửa (Edit)</th>
                    <th className="py-3 px-4 text-center w-28">Xóa (Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {modulesList.map((mod) => {
                    const perm = selectedRole.permissions.find(p => p.module === mod.id) || {
                      canView: false,
                      canCreate: false,
                      canEdit: false,
                      canDelete: false
                    };

                    return (
                      <tr key={mod.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          {mod.label}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            disabled={selectedRole.isSuperAdmin}
                            checked={perm.canView}
                            onChange={() => handleTogglePermission(mod.id, 'canView')}
                            className="w-4 h-4 accent-rose-500 cursor-pointer disabled:opacity-70"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            disabled={selectedRole.isSuperAdmin}
                            checked={perm.canCreate}
                            onChange={() => handleTogglePermission(mod.id, 'canCreate')}
                            className="w-4 h-4 accent-rose-500 cursor-pointer disabled:opacity-70"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            disabled={selectedRole.isSuperAdmin}
                            checked={perm.canEdit}
                            onChange={() => handleTogglePermission(mod.id, 'canEdit')}
                            className="w-4 h-4 accent-rose-500 cursor-pointer disabled:opacity-70"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            disabled={selectedRole.isSuperAdmin}
                            checked={perm.canDelete}
                            onChange={() => handleTogglePermission(mod.id, 'canDelete')}
                            className="w-4 h-4 accent-rose-500 cursor-pointer disabled:opacity-70"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: STAFF USERS */}
      {subTab === 'staff_users' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap w-52">Tài Khoản / Họ Tên</th>
                <th className="py-3 px-4 whitespace-nowrap w-48">Email Liên Hệ</th>
                <th className="py-3 px-4 whitespace-nowrap w-40">Vai Trò Phân Quyền</th>
                <th className="py-3 px-4 whitespace-nowrap w-44">Lần Đăng Nhập Gần Nhất</th>
                <th className="py-3 px-4 whitespace-nowrap w-36">Trạng Thái</th>
                <th className="py-3 px-4 whitespace-nowrap w-32 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {staffUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">{user.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{user.username}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-cyan-400 font-mono text-xs">
                    {user.email}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md bg-rose-950 text-rose-300 border border-rose-500/30 font-semibold text-xs whitespace-nowrap">
                      {user.roleName}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                    {user.lastLogin}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs whitespace-nowrap">
                      <Check className="w-3.5 h-3.5" />
                      <span>Đang Hoạt Động</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs cursor-pointer transition-colors">
                      Đổi Vai Trò
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
