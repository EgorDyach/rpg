import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import type { InventoryItem, EquippedItem } from '@/types';
import toast from 'react-hot-toast';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equippedItems, setEquippedItems] = useState<EquippedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'cosmetic' | 'consumable' | 'boost'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inventoryData, equippedData] = await Promise.all([
        apiClient.getInventory(),
        apiClient.getEquippedItems(),
      ]);
      setInventory(inventoryData);
      setEquippedItems(equippedData);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка загрузки инвентаря');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipItem = async (inventoryItem: InventoryItem, slot: string = 'default') => {
    try {
      await apiClient.equipItem(inventoryItem.id, slot);
      toast.success(`${inventoryItem.item.name} экипирован!`);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка экипировки');
    }
  };

  const handleUnequipItem = async (inventoryItem: InventoryItem, slot: string = 'default') => {
    try {
      await apiClient.unequipItem(inventoryItem.id, slot);
      toast.success(`${inventoryItem.item.name} снят!`);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка');
    }
  };

  const isItemEquipped = (itemId: number) => {
    return equippedItems.some((eq) => eq.item.id === itemId);
  };

  const getEquippedItem = (itemId: number) => {
    return equippedItems.find((eq) => eq.item.id === itemId);
  };

  const filteredInventory = inventory.filter((invItem) => {
    if (filter === 'all') return true;
    return invItem.item.item_type === filter;
  });

  const getItemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cosmetic: '🎨 Косметика',
      consumable: '⚗️ Расходники',
      boost: '⚡ Бусты',
      other: '📦 Другое',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-game text-rpg-gold mb-6">🎒 Инвентарь</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Все
        </Button>
        <Button
          variant={filter === 'cosmetic' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('cosmetic')}
        >
          🎨 Косметика
        </Button>
        <Button
          variant={filter === 'consumable' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('consumable')}
        >
          ⚗️ Расходники
        </Button>
        <Button
          variant={filter === 'boost' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('boost')}
        >
          ⚡ Бусты
        </Button>
      </div>

      {/* Equipped Items */}
      {equippedItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-rpg-gold mb-4">Экипировано</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equippedItems.map((equipped) => {
              const invItem = inventory.find((inv) => inv.item.id === equipped.item.id);
              return (
                <Card key={equipped.id} gold>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-rpg-text">
                          {equipped.item.name}
                        </h3>
                        <span className="inline-block text-xs px-2 py-1 rounded bg-rpg-purple/20 text-rpg-purple mt-1">
                          {getItemTypeLabel(equipped.item.item_type)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-rpg-text-dim">{equipped.item.description}</p>
                    <div className="text-xs text-rpg-text-dim">
                      Слот: {equipped.slot}
                    </div>
                    {invItem && (
                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth
                        onClick={() => handleUnequipItem(invItem, equipped.slot)}
                      >
                        Снять
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Inventory Items */}
      {filteredInventory.length === 0 ? (
        <Card>
          <p className="text-center text-rpg-text-dim py-8">Инвентарь пуст</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((invItem) => {
            const isEquipped = isItemEquipped(invItem.item.id);
            const equipped = getEquippedItem(invItem.item.id);

            return (
              <Card key={invItem.id} className="flex flex-col" gold={isEquipped}>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-rpg-text mb-1">
                        {invItem.item.name}
                      </h3>
                      <span className="inline-block text-xs px-2 py-1 rounded bg-rpg-purple/20 text-rpg-purple">
                        {getItemTypeLabel(invItem.item.item_type)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rpg-text">
                        x{invItem.quantity}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-rpg-text-dim">
                    {invItem.item.description}
                  </p>

                  {isEquipped && (
                    <div className="text-sm text-rpg-green font-semibold">
                      ✅ Экипировано (слот: {equipped?.slot || 'default'})
                    </div>
                  )}

                  {invItem.expires_at && (
                    <div className="text-xs text-rpg-text-dim">
                      Истекает: {new Date(invItem.expires_at).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-rpg-border">
                  {invItem.item.item_type === 'cosmetic' ? (
                    <div className="space-y-2">
                      {isEquipped ? (
                        <Button
                          fullWidth
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUnequipItem(invItem, equipped?.slot || 'default')}
                        >
                          Снять
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="gold"
                          size="sm"
                          onClick={() => handleEquipItem(invItem)}
                        >
                          Экипировать
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-rpg-text-dim text-center">
                      Этот предмет нельзя экипировать
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

