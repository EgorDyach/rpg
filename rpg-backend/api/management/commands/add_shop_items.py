"""
Django management command для добавления предметов в магазин
Использование: python manage.py add_shop_items
"""
from django.core.management.base import BaseCommand
from api.models import Item, StoreItem


class Command(BaseCommand):
    help = 'Добавляет игровые предметы в магазин'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Очистить существующие предметы перед добавлением'
        )

    def handle(self, *args, **options):
        clear = options['clear']

        if clear:
            self.stdout.write(self.style.WARNING('Очистка существующих предметов...'))
            StoreItem.objects.all().delete()
            Item.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Предметы очищены'))

        self.stdout.write(self.style.SUCCESS('Добавление предметов в магазин...'))

        items_data = [
            # Косметика
            {
                'item': {
                    'sku': 'COSM-001',
                    'name': 'Золотая корона',
                    'description': 'Корона из чистого золота. Показывает ваш статус короля квестов! 👑',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'legendary', 'slot': 'head'}
                },
                'store': {
                    'price': 500,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-002',
                    'name': 'Плащ мудреца',
                    'description': 'Магический плащ, который придает мудрости и интеллекта 🧙',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'epic', 'slot': 'back'}
                },
                'store': {
                    'price': 300,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-003',
                    'name': 'Меч победителя',
                    'description': 'Легендарный меч, который светится при выполнении квестов ⚔️',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'epic', 'slot': 'weapon'}
                },
                'store': {
                    'price': 400,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-004',
                    'name': 'Ореол достижений',
                    'description': 'Светящийся ореол над головой. Видно всем, что вы мастер! ✨',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'rare', 'slot': 'head'}
                },
                'store': {
                    'price': 200,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-005',
                    'name': 'Крылья ангела',
                    'description': 'Прекрасные белые крылья. Летайте к новым высотам! 🕊️',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'legendary', 'slot': 'back'}
                },
                'store': {
                    'price': 600,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-006',
                    'name': 'Маска ниндзя',
                    'description': 'Таинственная маска для скрытных операций 🥷',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'rare', 'slot': 'face'}
                },
                'store': {
                    'price': 150,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-007',
                    'name': 'Доспех чемпиона',
                    'description': 'Блестящие латы легендарного воина. Показывает всем, что вы непобедимы! 🛡️',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'legendary', 'slot': 'chest'}
                },
                'store': {
                    'price': 550,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-008',
                    'name': 'Шлем дракона',
                    'description': 'Грозный шлем с рогами дракона. Внушает страх врагам! 🐉',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'epic', 'slot': 'head'}
                },
                'store': {
                    'price': 350,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-009',
                    'name': 'Кольцо власти',
                    'description': 'Магическое кольцо, излучающее ауру лидерства 💍',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'epic', 'slot': 'ring'}
                },
                'store': {
                    'price': 280,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-010',
                    'name': 'Плащ вампира',
                    'description': 'Темный плащ, развевающийся на ветру. Для истинных ночных охотников! 🦇',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'epic', 'slot': 'back'}
                },
                'store': {
                    'price': 320,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-011',
                    'name': 'Посох мага',
                    'description': 'Древний посох, украшенный кристаллами силы. Увеличивает магию! 🔮',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'epic', 'slot': 'weapon'}
                },
                'store': {
                    'price': 380,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'COSM-012',
                    'name': 'Ореол святости',
                    'description': 'Божественный ореол, озаряющий путь к знаниям ✨',
                    'item_type': 'cosmetic',
                    'properties': {'rarity': 'legendary', 'slot': 'head'}
                },
                'store': {
                    'price': 650,
                    'stock': None,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            # Расходники
            {
                'item': {
                    'sku': 'CONS-001',
                    'name': 'Зелье опыта',
                    'description': 'Дает +50 XP при использовании. Быстрый способ повысить уровень! ⭐',
                    'item_type': 'consumable',
                    'properties': {'xp_bonus': 50}
                },
                'store': {
                    'price': 100,
                    'stock': 50,
                    'purchase_limit': 10,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'CONS-002',
                    'name': 'Большое зелье опыта',
                    'description': 'Дает +150 XP при использовании. Мощный буст! 💪',
                    'item_type': 'consumable',
                    'properties': {'xp_bonus': 150}
                },
                'store': {
                    'price': 250,
                    'stock': 30,
                    'purchase_limit': 5,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'CONS-003',
                    'name': 'Мешок с монетами',
                    'description': 'Содержит 50 монет. Быстрый заработок! 💰',
                    'item_type': 'consumable',
                    'properties': {'coins_bonus': 50}
                },
                'store': {
                    'price': 40,
                    'stock': 100,
                    'purchase_limit': 20,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'CONS-004',
                    'name': 'Сундук с сокровищами',
                    'description': 'Содержит 200 монет и случайный предмет! 🎁',
                    'item_type': 'consumable',
                    'properties': {'coins_bonus': 200, 'random_item': True}
                },
                'store': {
                    'price': 150,
                    'stock': 20,
                    'purchase_limit': 3,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'CONS-005',
                    'name': 'Энергетический напиток',
                    'description': 'Восстанавливает энергию. +1 к streak! 🔋',
                    'item_type': 'consumable',
                    'properties': {'streak_bonus': 1}
                },
                'store': {
                    'price': 80,
                    'stock': 40,
                    'purchase_limit': 10,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'CONS-006',
                    'name': 'Эликсир мудрости',
                    'description': 'Дает +100 XP и +50 монет. Зелье великих мудрецов! 📖',
                    'item_type': 'consumable',
                    'properties': {'xp_bonus': 100, 'coins_bonus': 50}
                },
                'store': {
                    'price': 180,
                    'stock': 25,
                    'purchase_limit': 5,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'CONS-007',
                    'name': 'Зелье удачи',
                    'description': 'Увеличивает шанс получить бонусы в следующих квестах! 🍀',
                    'item_type': 'consumable',
                    'properties': {'luck_bonus': True}
                },
                'store': {
                    'price': 120,
                    'stock': 30,
                    'purchase_limit': 8,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'CONS-008',
                    'name': 'Кристалл силы',
                    'description': 'Дает +250 XP единовременно. Мощный источник энергии! 💎',
                    'item_type': 'consumable',
                    'properties': {'xp_bonus': 250}
                },
                'store': {
                    'price': 400,
                    'stock': 15,
                    'purchase_limit': 3,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'CONS-009',
                    'name': 'Кошелек фортуны',
                    'description': 'Содержит от 100 до 300 монет. Удача определяет сумму! 🎰',
                    'item_type': 'consumable',
                    'properties': {'coins_bonus_random': {'min': 100, 'max': 300}}
                },
                'store': {
                    'price': 200,
                    'stock': 20,
                    'purchase_limit': 5,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'CONS-010',
                    'name': 'Свиток возрождения',
                    'description': 'Восстанавливает весь streak! Для тех, кто пропустил день 🌱',
                    'item_type': 'consumable',
                    'properties': {'streak_restore': True}
                },
                'store': {
                    'price': 300,
                    'stock': 10,
                    'purchase_limit': 2,
                    'is_active': True
                }
            },
            # Бусты
            {
                'item': {
                    'sku': 'BOOST-001',
                    'name': 'Буст XP (1 день)',
                    'description': 'Удваивает получаемый XP на 24 часа! 🚀',
                    'item_type': 'boost',
                    'properties': {'xp_multiplier': 2, 'duration_hours': 24}
                },
                'store': {
                    'price': 200,
                    'stock': None,
                    'purchase_limit': 3,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'BOOST-002',
                    'name': 'Буст монет (1 день)',
                    'description': 'Удваивает получаемые монеты на 24 часа! 💎',
                    'item_type': 'boost',
                    'properties': {'coins_multiplier': 2, 'duration_hours': 24}
                },
                'store': {
                    'price': 180,
                    'stock': None,
                    'purchase_limit': 3,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'BOOST-003',
                    'name': 'Буст удачи (3 дня)',
                    'description': 'Увеличивает шанс получить бонусы на 3 дня! 🍀',
                    'item_type': 'boost',
                    'properties': {'luck_multiplier': 1.5, 'duration_hours': 72}
                },
                'store': {
                    'price': 350,
                    'stock': None,
                    'purchase_limit': 2,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'BOOST-004',
                    'name': 'Буст скорости (1 день)',
                    'description': 'Ускоряет выполнение квестов. Меньше времени на задания! ⚡',
                    'item_type': 'boost',
                    'properties': {'speed_multiplier': 1.3, 'duration_hours': 24}
                },
                'store': {
                    'price': 220,
                    'stock': None,
                    'purchase_limit': 3,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'BOOST-005',
                    'name': 'Мега-буст (7 дней)',
                    'description': 'Все бонусы сразу на целую неделю! Легендарный предмет! 🌟',
                    'item_type': 'boost',
                    'properties': {
                        'xp_multiplier': 1.5,
                        'coins_multiplier': 1.5,
                        'luck_multiplier': 1.2,
                        'duration_hours': 168
                    }
                },
                'store': {
                    'price': 800,
                    'stock': 10,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            # Другое
            {
                'item': {
                    'sku': 'OTHER-001',
                    'name': 'Свиток телепортации',
                    'description': 'Позволяет мгновенно переместиться к любому квесту! 📜',
                    'item_type': 'other',
                    'properties': {'teleport': True}
                },
                'store': {
                    'price': 120,
                    'stock': 25,
                    'purchase_limit': 5,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'OTHER-002',
                    'name': 'Книга знаний',
                    'description': 'Открывает секретные техники выполнения квестов 📚',
                    'item_type': 'other',
                    'properties': {'knowledge_boost': True}
                },
                'store': {
                    'price': 300,
                    'stock': 15,
                    'purchase_limit': 2,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'OTHER-003',
                    'name': 'Амулет защиты',
                    'description': 'Защищает от потери streak при пропуске дня 🛡️',
                    'item_type': 'other',
                    'properties': {'streak_protection': True}
                },
                'store': {
                    'price': 400,
                    'stock': 10,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'OTHER-004',
                    'name': 'Компас искателя',
                    'description': 'Помогает находить скрытые квесты и редкие награды! 🧭',
                    'item_type': 'other',
                    'properties': {'quest_finder': True}
                },
                'store': {
                    'price': 250,
                    'stock': 20,
                    'purchase_limit': 2,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'OTHER-005',
                    'name': 'Кристалл времени',
                    'description': 'Замедляет время выполнения квестов. Больше времени на задания! ⏳',
                    'item_type': 'other',
                    'properties': {'time_extension': True}
                },
                'store': {
                    'price': 450,
                    'stock': 12,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'OTHER-006',
                    'name': 'Талисман удачи',
                    'description': 'Постоянно увеличивает шанс получения бонусных наград! 🎯',
                    'item_type': 'other',
                    'properties': {'permanent_luck': True}
                },
                'store': {
                    'price': 600,
                    'stock': 8,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
            {
                'item': {
                    'sku': 'OTHER-007',
                    'name': 'Свиток дружбы',
                    'description': 'Удваивает награды за групповые квесты на 7 дней! 🤝',
                    'item_type': 'other',
                    'properties': {'group_boost': 2, 'duration_days': 7}
                },
                'store': {
                    'price': 500,
                    'stock': 15,
                    'purchase_limit': 1,
                    'is_active': True
                }
            },
        ]

        created_count = 0
        updated_count = 0

        for item_data in items_data:
            item_info = item_data['item']
            store_info = item_data['store']

            # Создаем или получаем предмет
            item, item_created = Item.objects.get_or_create(
                sku=item_info['sku'],
                defaults={
                    'name': item_info['name'],
                    'description': item_info['description'],
                    'item_type': item_info['item_type'],
                    'properties': item_info.get('properties', {})
                }
            )

            # Обновляем предмет, если он уже существует
            if not item_created:
                item.name = item_info['name']
                item.description = item_info['description']
                item.item_type = item_info['item_type']
                item.properties = item_info.get('properties', {})
                item.save()

            # Создаем или обновляем запись в магазине
            store_item, store_created = StoreItem.objects.get_or_create(
                item=item,
                defaults=store_info
            )

            if not store_created:
                store_item.price = store_info['price']
                store_item.stock = store_info['stock']
                store_item.purchase_limit = store_info['purchase_limit']
                store_item.is_active = store_info['is_active']
                store_item.save()
                updated_count += 1
            else:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'\n✅ Предметы добавлены в магазин!'))
        self.stdout.write(f'   - Создано новых: {created_count}')
        self.stdout.write(f'   - Обновлено существующих: {updated_count}')
        self.stdout.write(f'   - Всего предметов в магазине: {StoreItem.objects.filter(is_active=True).count()}')

