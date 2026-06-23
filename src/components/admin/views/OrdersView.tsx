import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingBag, Truck, Utensils, X } from 'lucide-react';
import { useOrders } from '@/hooks/useDashboard';
import type { Order, OrderFulfillmentType, OrderStatus } from '@/types';
import {
  getOrderFulfillmentLabel,
  getOrderFulfillmentTone,
  getOrderFulfillmentType,
  getOrderSearchText,
  getOrderTableNumber,
  orderFulfillmentTypes,
} from '@/utils/orderDisplay';
import { cn } from '@/utils/cn';
import { DataTable, Td, Th } from '../components/DataTable';
import { SectionTitle } from '../components/SectionTitle';
import { StatusPill } from '../components/StatusPill';
import { useOrderStatusMutation } from '../hooks/useAdminMutations';

const nextStatuses: Record<string, OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served'],
};

export function OrdersView() {
  const { t } = useTranslation();
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'all' | OrderFulfillmentType>('all');
  const [search, setSearch] = useState('');
  const { data: orders, isLoading } = useOrders({
    limit: 150,
    fulfillmentType: fulfillmentFilter === 'all' ? undefined : fulfillmentFilter,
  });
  const updateOrderStatus = useOrderStatusMutation();
  const orderList = orders?.data || [];
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orderList;
    return orderList.filter((order) =>
      getOrderSearchText(order, t).toLowerCase().includes(query),
    );
  }, [orderList, search, t]);

  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.orders')} />

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface-elevated p-3 lg:grid-cols-[1fr_auto]">
        <label className="relative">
          <span className="sr-only">{t('common.search')}</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('admin.ordersView.searchPlaceholder')}
            className="h-10 w-full rounded-xl border border-border bg-surface px-9 text-sm outline-none transition-colors focus:border-primary-500/60"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-foreground-muted hover:bg-foreground-muted/10 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 [&::-webkit-scrollbar]:hidden">
          {(['all', ...orderFulfillmentTypes] as Array<'all' | OrderFulfillmentType>).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFulfillmentFilter(type)}
              className={cn(
                'flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors',
                fulfillmentFilter === type
                  ? 'bg-primary-500 text-white'
                  : 'text-foreground-muted hover:bg-foreground-muted/10 hover:text-foreground',
              )}
            >
              {type !== 'all' && <FulfillmentIcon type={type} />}
              {type === 'all' ? t('filters.allTypes') : getOrderFulfillmentLabel(type, t)}
            </button>
          ))}
        </div>
      </div>

      <DataTable loading={isLoading} colSpan={7}>
        <thead className="bg-foreground-muted/5">
          <tr>
            <Th>{t('admin.ordersView.orderNumber')}</Th>
            <Th>{t('admin.ordersView.type')}</Th>
            <Th>{t('admin.ordersView.customer')}</Th>
            <Th>{t('admin.status')}</Th>
            <Th>{t('admin.ordersView.total')}</Th>
            <Th>{t('admin.ordersView.time')}</Th>
            <Th right>{t('admin.actions')}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-foreground-muted">
                {t('filters.noResults')}
              </td>
            </tr>
          ) : (
            filteredOrders.map((order: Order) => (
              <tr key={order.id} className="hover:bg-foreground-muted/5">
                <Td className="font-medium">#{order.orderNumber}</Td>
                <Td>
                  <FulfillmentPill order={order} t={t} />
                </Td>
                <Td>
                  <OrderCustomerCell order={order} t={t} />
                </Td>
                <Td>
                  <StatusPill status={order.status} />
                </Td>
                <Td className="font-medium">${order.total?.toFixed(2)}</Td>
                <Td muted>{new Date(order.createdAt).toLocaleTimeString()}</Td>
                <Td right>
                  {(nextStatuses[order.status] || []).map((status) => (
                    <button key={status} onClick={() => updateOrderStatus.mutate({ orderId: order.id, status })} className="ml-2 px-2.5 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium capitalize">
                      {t(`order.status.${status}`)}
                    </button>
                  ))}
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>
    </div>
  );
}

function FulfillmentPill({ order, t }: { order: Order; t: (key: string) => string }) {
  const type = getOrderFulfillmentType(order);
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', getOrderFulfillmentTone(type))}>
      <FulfillmentIcon type={type} />
      {getOrderFulfillmentLabel(type, t)}
    </span>
  );
}

function FulfillmentIcon({ type }: { type: OrderFulfillmentType }) {
  const Icon = type === 'delivery' ? Truck : type === 'takeaway' ? ShoppingBag : Utensils;
  return <Icon className="h-3.5 w-3.5" />;
}

function OrderCustomerCell({ order, t }: { order: Order; t: (key: string) => string }) {
  const type = getOrderFulfillmentType(order);
  if (type === 'dine_in') {
    return (
      <div>
        <p className="font-medium">{t('kitchen.table')} {getOrderTableNumber(order)}</p>
        <p className="text-xs text-foreground-muted">{t('order.fulfillment.dine_in')}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="truncate font-medium">{order.customerName || '-'}</p>
      {order.customerPhone && (
        <p className="truncate text-xs text-foreground-muted">{order.customerPhone}</p>
      )}
      {type === 'delivery' && order.deliveryAddress && (
        <p className="truncate text-xs text-foreground-muted">{order.deliveryAddress}</p>
      )}
    </div>
  );
}
