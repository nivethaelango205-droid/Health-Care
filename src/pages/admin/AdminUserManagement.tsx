import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { DEMO_USERS } from '../../services/mockData';
import { Search, Users, Shield, UserCheck, MoreVertical, CheckCircle2 } from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const usersList = [
    { id: 'usr-1', name: 'Asha Sharma', email: 'patient@demo.ruralcare.test', role: 'patient', status: 'active', joined: '15 Feb 2026' },
    { id: 'usr-2', name: 'Dr. Meera Nambiar', email: 'doctor@demo.ruralcare.test', role: 'doctor', status: 'verified', joined: '10 Jan 2026' },
    { id: 'usr-3', name: 'Dr. Rajesh Rao', email: 'rajesh.rao@ruralcare.in', role: 'doctor', status: 'verified', joined: '12 Jan 2026' },
    { id: 'usr-4', name: 'Dr. Ananya Sen', email: 'ananya.sen@ruralcare.in', role: 'doctor', status: 'verified', joined: '22 Jan 2026' },
    { id: 'usr-5', name: 'Dr. Vikramaditya Joshi', email: 'vikram.j@ruralcare.in', role: 'doctor', status: 'pending', joined: '01 Mar 2026' },
    { id: 'usr-6', name: 'Suresh Verma', email: 'admin@demo.ruralcare.test', role: 'admin', status: 'active', joined: '01 Jan 2026' },
  ];

  const filtered = usersList.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">User Management</h2>
          <p className="text-xs text-brandMuted">
            Review registered platform participants, assign access permissions and verify account statuses.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Role filter buttons */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {['all', 'patient', 'doctor', 'admin'].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              roleFilter === role
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {role}s
          </button>
        ))}
      </div>

      {/* Users Responsive Table */}
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-navy-900 font-bold flex items-center justify-center shrink-0">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-navy-900">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 capitalize">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.role === 'doctor'
                          ? 'bg-teal-50 text-teal-700'
                          : u.role === 'admin'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge variant={u.status === 'verified' || u.status === 'active' ? 'confirmed' : 'pending'} dot size="sm">
                      {u.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-600">{u.joined}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Edit Permissions
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

