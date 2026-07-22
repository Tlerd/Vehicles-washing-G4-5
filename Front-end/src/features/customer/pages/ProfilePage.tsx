import { useEffect, useState } from 'react';
import { Button, Card, ErrorState, Skeleton } from '@/components/ui';
import { useMyProfile, useUpdateMyProfile } from '@/lib/api/customers';

/** Self-service profile: view/edit full name and email through the real
 *  GET/PUT /api/v1/customers/me endpoints. Phone, tier, and points are
 *  server-owned and shown read-only. */
export function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useMyProfile();
  const updateProfile = useUpdateMyProfile();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setEmail(profile.email);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState message="Không thể tải hồ sơ." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Hồ sơ của tôi</h1>
        <p className="text-sm text-text-secondary">Xem và cập nhật thông tin cá nhân.</p>
      </div>

      <Card>
        <div className="grid gap-1.5 text-sm">
          <span className="text-text-secondary">Số điện thoại</span>
          <span className="font-medium text-text-primary">{profile.phone}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3 text-sm">
          <div>
            <p className="text-text-secondary">Hạng thành viên</p>
            <p className="font-semibold text-text-primary">{profile.tier}</p>
          </div>
          <div>
            <p className="text-text-secondary">Điểm tích lũy</p>
            <p className="font-semibold text-text-primary">{profile.accumulatedPoints}</p>
          </div>
          <div>
            <p className="text-text-secondary">Số lượt rửa xe</p>
            <p className="font-semibold text-text-primary">{profile.totalWashes}</p>
          </div>
        </div>
      </Card>

      <Card>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile.mutate({ fullName, email });
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-primary">Họ tên</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-surface-soft px-4 py-3 text-sm text-text-primary transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-primary">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-soft px-4 py-3 text-sm text-text-primary transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
          {updateProfile.isError && (
            <p className="text-sm text-danger">Không thể lưu thông tin. Vui lòng thử lại.</p>
          )}
          {updateProfile.isSuccess && (
            <p className="text-sm text-success">Đã lưu thông tin hồ sơ.</p>
          )}
        </form>
      </Card>
    </div>
  );
}
