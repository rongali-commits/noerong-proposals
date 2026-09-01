import type { ProposalStatus } from '@/types/database';
import { Badge } from '@/components/ui/Badge';

const statusConfig: Record<ProposalStatus, { label: string; variant: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'neutral' }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  sent: { label: 'Sent', variant: 'default' },
  viewed: { label: 'Viewed', variant: 'accent' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  expired: { label: 'Expired', variant: 'warning' },
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
