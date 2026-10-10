'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { GlobalRole, CreateUserSchema, CreateUserInput } from '@forgeline/shared';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HeatSkeleton } from '@/components/ui/heat-skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  ShieldCheck,
  PowerOff,
  RotateCcw,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserRecord {
  id: string;
  name: string;
  handle: string;
  email: string;
  globalRole: GlobalRole;
  isActive: boolean;
  avatarSeed?: string | null;
  createdAt: string;
}

export default function UsersAdminPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const isAdmin = currentUser?.globalRole === 'ADMIN';

  // 1. Fetch Users List
  const { data, isLoading } = useQuery({
    queryKey: ['users', 'list', { search }],
    queryFn: () => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return apiClient.get<{ items: UserRecord[]; totalCount: number }>(`/users${qs}`);
    },
    enabled: isAdmin,
  });

  const users = data?.items || [];

  // 2. Create User Mutation
  const createUser = useMutation({
    mutationFn: (data: CreateUserInput) => apiClient.post<UserRecord>('/users', data),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('PERSONNEL COMMISSIONED', {
        description: `Account created for @${newUser.handle}`,
      });
      setCreateDialogOpen(false);
    },
  });

  // 3. Update User Mutation
  const updateUser = useMutation({
    mutationFn: ({ id, globalRole }: { id: string; globalRole: GlobalRole }) =>
      apiClient.patch<UserRecord>(`/users/${id}`, { globalRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('ROLE CLEARED', { description: 'User permissions updated.' });
      setEditingUser(null);
    },
  });

  // 4. Deactivate / Reactivate Mutations
  const deactivateUser = useMutation({
    mutationFn: (id: string) => apiClient.post(`/users/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.warning('ACCOUNT DEACTIVATED', {
        description: 'Session severed and token version incremented.',
      });
    },
  });

  const reactivateUser = useMutation({
    mutationFn: (id: string) => apiClient.post(`/users/${id}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('ACCOUNT RESTORED', { description: 'User credentials re-armed.' });
    },
  });

interface CreateUserFormValues {
  name: string;
  email: string;
  handle: string;
  password: string;
  globalRole: GlobalRole;
}

  // Create User Form
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(CreateUserSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      handle: '',
      password: '',
      globalRole: GlobalRole.TEAM_MEMBER,
    },
  });

  const onCreateSubmit = async (formData: CreateUserFormValues) => {
    try {
      await createUser.mutateAsync(formData);
      resetCreate();
    } catch {
      // Toast handles error
    }
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<UserRecord, any>[]>(
    () => [
      {
        header: 'PERSONNEL',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-graphite border border-steel flex items-center justify-center font-hud text-xs font-bold text-bone flex-shrink-0">
              {row.original.name.charAt(0)}
            </div>
            <div className="truncate">
              <span className="font-hud uppercase tracking-wide text-xs font-bold text-bone block truncate">
                {row.original.name}
              </span>
              <span className="font-mono text-[10px] text-ash truncate block">
                @{row.original.handle}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: 'EMAIL ADDRESS',
        accessorKey: 'email',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ash">{row.original.email}</span>
        ),
      },
      {
        header: 'CLEARANCE ROLE',
        accessorKey: 'globalRole',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.globalRole === GlobalRole.ADMIN
                ? 'ember'
                : row.original.globalRole === GlobalRole.PROJECT_MANAGER
                ? 'plasma'
                : row.original.globalRole === GlobalRole.TEAM_MEMBER
                ? 'ice'
                : 'default'
            }
          >
            {row.original.globalRole}
          </Badge>
        ),
      },
      {
        header: 'ACCOUNT STATUS',
        accessorKey: 'isActive',
        cell: ({ row }) => (
          <div className="flex items-center space-x-1.5 font-mono text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                row.original.isActive ? 'bg-plasma' : 'bg-crimson'
              }`}
            />
            <span className={row.original.isActive ? 'text-plasma' : 'text-crimson'}>
              {row.original.isActive ? 'ACTIVE' : 'DEACTIVATED'}
            </span>
          </div>
        ),
      },
      {
        header: 'ACTIONS',
        id: 'actions',
        cell: ({ row }) => {
          const u = row.original;
          const isSelf = u.id === currentUser?.id;

          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(u)}
                className="h-7 text-[10px] px-2"
              >
                EDIT ROLE
              </Button>

              {!isSelf && (
                u.isActive ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deactivateUser.isPending}
                    onClick={() => deactivateUser.mutate(u.id)}
                    className="h-7 text-[10px] px-2"
                  >
                    <PowerOff className="w-3 h-3 mr-1" /> DEACTIVATE
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reactivateUser.isPending}
                    onClick={() => reactivateUser.mutate(u.id)}
                    className="h-7 text-[10px] px-2 text-plasma border-plasma/50"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> REACTIVATE
                  </Button>
                )
              )}
            </div>
          );
        },
      },
    ],
    [currentUser, deactivateUser, reactivateUser],
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!isAdmin) {
    return (
      <div className="hud-panel p-12 text-center bg-basalt border-steel rounded text-xs font-mono text-crimson space-y-2">
        <ShieldAlert className="w-8 h-8 mx-auto" />
        <h3 className="font-hud uppercase text-sm font-bold">ACCESS RESTRICTED</h3>
        <p className="text-ash">Administrator authorization required to view personnel registry.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="hud-panel p-5 sm:p-7 hud-corner-brackets bg-basalt/85 border-steel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-ember mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                SYSTEM ADMINISTRATION
              </span>
            </div>
            <h1 className="font-hud uppercase tracking-wide text-2xl sm:text-3xl font-black text-bone">
              USER DIRECTORY & ACCESS
            </h1>
            <p className="font-body text-xs sm:text-sm text-ash mt-1">
              Manage team accounts, assign global roles, and handle account status.
            </p>
          </div>

          <div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateDialogOpen(true)}
              className="min-h-[44px]"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> NEW USER
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-basalt/60 p-3 rounded border border-steel flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-ash absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search by name, handle, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-void"
          />
        </div>
        <span className="font-mono text-xs text-ash">Total Records: {users.length}</span>
      </div>

      {/* TanStack Table View */}
      {isLoading ? (
        <div className="space-y-3">
          <HeatSkeleton className="h-14 w-full" />
          <HeatSkeleton className="h-14 w-full" />
          <HeatSkeleton className="h-14 w-full" />
        </div>
      ) : (
        <div className="hud-panel bg-basalt border-steel rounded overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-steel/80 bg-graphite/60">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-3.5 font-mono text-[10px] uppercase tracking-wider text-ash font-bold"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-steel/40">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-graphite/40 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>CREATE NEW USER</DialogTitle>
            <DialogDescription>
              Create user credentials and assign a global role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-3">
            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">Full Name *</label>
              <Input placeholder="e.g. Elena Rostova" {...registerCreate('name')} />
              {createErrors.name && (
                <p className="text-crimson text-[10px] font-mono mt-1">{createErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">Handle *</label>
              <Input placeholder="e.g. elena" {...registerCreate('handle')} />
              {createErrors.handle && (
                <p className="text-crimson text-[10px] font-mono mt-1">{createErrors.handle.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">Email Address *</label>
              <Input type="email" placeholder="elena@forgeline.dev" {...registerCreate('email')} />
              {createErrors.email && (
                <p className="text-crimson text-[10px] font-mono mt-1">{createErrors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">Initial Password *</label>
              <Input type="password" placeholder="Minimum 8 characters" {...registerCreate('password')} />
              {createErrors.password && (
                <p className="text-crimson text-[10px] font-mono mt-1">{createErrors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">Global Clearance Role</label>
              <select
                {...registerCreate('globalRole')}
                className="w-full bg-void border border-steel px-3 py-2 text-xs font-mono text-bone rounded focus:border-plasma outline-none min-h-[44px]"
              >
                {Object.values(GlobalRole).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-steel/60">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isCreating || createUser.isPending}>
                {createUser.isPending ? 'CREATING...' : 'CREATE USER'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ADJUST CLEARANCE LEVEL</DialogTitle>
            <DialogDescription>
              Update global role for @{editingUser?.handle}.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-ash mb-1">Global Role</label>
                <select
                  defaultValue={editingUser.globalRole}
                  onChange={(e) =>
                    updateUser.mutate({
                      id: editingUser.id,
                      globalRole: e.target.value as GlobalRole,
                    })
                  }
                  className="w-full bg-void border border-steel px-3 py-2 text-xs font-mono text-bone rounded focus:border-plasma outline-none min-h-[44px]"
                >
                  {Object.values(GlobalRole).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                  CLOSE
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
