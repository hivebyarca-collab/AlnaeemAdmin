export type IconName =
  | 'home'
  | 'store'
  | 'search'
  | 'extras'
  | 'account'
  | 'cpu'
  | 'gamepad'
  | 'headphones'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'tool'
  | 'box';

export type Product = {
  id: string;
  name: string;
  brand: string;
  spec: string;
  price: string;
  rating: string;
  reviews: number;
  image: string;
  imagePosition: string;
};

export const navigationItems = [
  { label: 'المتجر', href: '/store', icon: 'store' as const },
  { label: 'الرئيسية', href: '/', icon: 'home' as const, home: true },
  { label: 'الإضافات', href: '/extras', icon: 'extras' as const },
];

export const categories = [
  { label: 'PC ومكونات', icon: 'cpu' as const, count: '2,480' },
  { label: 'PlayStation', icon: 'gamepad' as const, count: '1,240' },
  { label: 'Xbox', icon: 'gamepad' as const, count: '980' },
  { label: 'الإكسسوارات', icon: 'headphones' as const, count: '1,560' },
  { label: 'أخرى', icon: 'box' as const, count: '890' },
];

export const products: Product[] = [
  { id: 'gpu-4070', name: 'GeForce RTX 4070 SUPER', brand: 'MSI', spec: '12GB GDDR6X', price: '$599.00', rating: '4.8', reviews: 124, image: '/assets/build-pc-hardware.png', imagePosition: '17% 42%' },
  { id: 'i7-13700k', name: 'Core i7-13700K', brand: 'Intel', spec: '24 Cores / 32 Threads', price: '$379.00', rating: '4.7', reviews: 98, image: '/assets/build-pc-hardware.png', imagePosition: '52% 42%' },
  { id: 'g-pro-x2', name: 'G Pro X 2', brand: 'Logitech', spec: 'Wireless Gaming Headset', price: '$249.00', rating: '4.6', reviews: 210, image: '/assets/gaming-setup.png', imagePosition: '84% 70%' },
  { id: 'dualsense', name: 'DualSense', brand: 'Sony', spec: 'Wireless Controller', price: '$69.00', rating: '4.8', reviews: 320, image: '/assets/gaming-setup.png', imagePosition: '58% 72%' },
  { id: 'tuf-monitor', name: 'TUF Gaming 27”', brand: 'ASUS', spec: '1440p · 165Hz · IPS', price: '$299.00', rating: '4.5', reviews: 66, image: '/assets/gaming-setup.png', imagePosition: '55% 43%' },
  { id: 'mechanical-keyboard', name: 'Pro Mechanical Keyboard', brand: 'Gaming Series', spec: 'Linear Switches · USB-C', price: '$149.00', rating: '4.4', reviews: 112, image: '/assets/gaming-setup.png', imagePosition: '67% 72%' },
  { id: 'ssd-990', name: '990 PRO 1TB', brand: 'Samsung', spec: 'NVMe Gen4 SSD', price: '$129.00', rating: '4.8', reviews: 420, image: '/assets/build-pc-hardware.png', imagePosition: '47% 83%' },
  { id: 'huntsman', name: 'Huntsman V3 Pro', brand: 'Razer', spec: 'Analog Gaming Keyboard', price: '$249.00', rating: '4.7', reviews: 96, image: '/assets/gaming-setup.png', imagePosition: '69% 70%' },
  { id: 'liquid-cooler', name: '240mm Liquid Cooler', brand: 'Performance Series', spec: 'Dual Fan · PWM', price: '$89.00', rating: '4.6', reviews: 74, image: '/assets/build-pc-hardware.png', imagePosition: '18% 17%' },
  { id: 'mid-tower', name: 'Mid-Tower ATX Case', brand: 'AL NAEEM Select', spec: 'Tempered Glass · 3 Fans', price: '$129.00', rating: '4.5', reviews: 68, image: '/assets/build-pc-hardware.png', imagePosition: '87% 43%' },
];

export type CartItem = { productId: string; quantity: number };

export const devInitialCart: CartItem[] = [
  { productId: 'gpu-4070', quantity: 1 },
  { productId: 'mechanical-keyboard', quantity: 1 },
  { productId: 'g-pro-x2', quantity: 1 },
];

export const searchSuggestions = [
  'ps4',
  'ps4 games',
  'ps4 controller',
  'ps4 accessories',
  'ps4 console',
  'ps4 headset',
  'ps4 charging station',
];

export const extrasCards = [
  {
    number: '01',
    english: 'MAINTENANCE',
    title: 'الصيانة',
    description: 'صيانة وتشخيص أجهزة الألعاب والكمبيوتر مع متابعة حالة الطلب والتواصل المباشر معنا.',
    href: '/extras/maintenance',
    cta: 'اطلب صيانة',
    image: '/assets/maintenance-bench.png',
    points: ['تشخيص شامل للمشكلة', 'صيانة احترافية بأيدي فنية', 'متابعة حالة الطلب', 'دعم مباشر مع الفريق'],
  },
  {
    number: '02',
    english: 'BUILD YOUR PC',
    title: 'ابنِ جهازك',
    description: 'اختر القطع وتحقق من التوافق وتابع السعر ثم أرسل التجميعة لمركز النعيم لتجهيزها.',
    href: '/extras/build-pc',
    cta: 'ابدأ التجميع',
    image: '/assets/build-pc-hardware.png',
    points: ['اختيار المكونات من منتجاتنا', 'تحقق تلقائي من التوافق', 'متابعة السعر بوضوح', 'حفظ التجميعة أو إرسالها'],
  },
];

export const buildParts = [
  { id: 'cpu', label: 'CPU', name: 'Intel Core i7-13700K', price: '$379.00', imagePosition: '52% 45%' },
  { id: 'cooler', label: 'CPU COOLER', name: '240mm Liquid Cooler', price: '$89.00', imagePosition: '17% 18%' },
  { id: 'gpu', label: 'GPU', name: 'GeForce RTX 4070', price: '$599.00', imagePosition: '17% 46%' },
  { id: 'ram', label: 'RAM', name: '32GB DDR5 5600MHz', price: '$109.00', imagePosition: '25% 75%' },
  { id: 'storage', label: 'STORAGE', name: '1TB NVMe Gen4 SSD', price: '$79.00', imagePosition: '48% 85%' },
  { id: 'psu', label: 'PSU', name: '750W 80+ Gold', price: '$99.00', imagePosition: '66% 79%' },
  { id: 'case', label: 'CASE', name: 'Mid-Tower ATX', price: '$129.00', imagePosition: '88% 45%' },
  { id: 'os', label: 'OS', name: 'Windows 11 Pro', price: '$139.00', imagePosition: '50% 46%' },
];

export const deviceTypes = ['PC', 'PlayStation', 'Laptop', 'أخرى'];
export const issueTypes = ['حرارة', 'لا يعمل', 'تنظيف', 'تحديث نظام', 'صوت', 'أخرى'];

export const accountBuilds = [
  { id: 'PC-0754', title: 'تجميعة البداية', specs: 'i5-12400F / RTX 3060', compatibility: 88, price: '$987' },
  { id: 'PC-0987', title: 'تجميعة الأسطورة', specs: 'Ryzen 7 7800X3D / RX 7900 XTX', compatibility: 95, price: '$2,312' },
  { id: 'PC-1021', title: 'تجميعة القناص', specs: 'i7-13700K / RTX 4070 Ti', compatibility: 92, price: '$1,845' },
];

export const accountActions = [
  { label: 'سجل الطلبات', detail: 'عرض وتتبع طلباتك' },
  { label: 'قائمة المفضلة', detail: 'منتجاتك المحفوظة' },
  { label: 'محادثات الدعم', detail: 'تواصلاتك مع الدعم' },
  { label: 'العناوين المحفوظة', detail: 'إدارة عناوين الشحن' },
];

export const filterBrands = ['ASUS', 'MSI', 'Gigabyte', 'Sony', 'Microsoft', 'Logitech', 'Razer', 'Corsair'];

export const adminMetrics = [
  { label: 'إجمالي المبيعات', value: '$4,280', change: '+18%', icon: 'sales' as const },
  { label: 'الطلبات الجديدة', value: '36', change: '+24%', icon: 'orders' as const },
  { label: 'العملاء الجدد', value: '58', change: '+8%', icon: 'customers' as const },
  { label: 'جهات التواصل', value: '24', change: '+12%', icon: 'messages' as const },
];

export const adminSalesChart = [24, 38, 31, 48, 35, 41, 30, 76, 28, 34, 43, 51, 29, 61, 36, 47, 32, 56, 69, 42, 62, 39, 66, 86, 48];

export const adminOrders = [
  { id: '1003', age: 'منذ دقيقتين', amount: '$599.00', status: 'مكتمل', tone: 'complete' as const },
  { id: '1002', age: 'منذ 12 دقيقة', amount: '$129.00', status: 'قيد التجهيز', tone: 'preparing' as const },
  { id: '1001', age: 'منذ 28 دقيقة', amount: '$249.00', status: 'بانتظار الدفع', tone: 'pending' as const },
  { id: '1000', age: 'منذ ساعة', amount: '$69.00', status: 'مكتمل', tone: 'complete' as const },
  { id: '0999', age: 'منذ ساعتين', amount: '$379.00', status: 'ملغي', tone: 'cancelled' as const },
];

export const adminContacts = [
  { name: 'Ahmad K.', email: 'ahmadk@example.dev', subject: 'استفسار عن منتج', age: 'منذ 10 دقائق' },
  { name: 'Sara M.', email: 'sara.m@example.dev', subject: 'دعم فني', age: 'منذ 22 دقيقة' },
  { name: 'Yazan H.', email: 'yazan.h@example.dev', subject: 'طلب كمية', age: 'منذ ساعة' },
  { name: 'Lina A.', email: 'lina.a@example.dev', subject: 'استفسار عام', age: 'منذ 3 ساعات' },
];

export const adminInventory = [
  { productId: 'gpu-4070', sku: 'GPU-4070-S', category: 'بطاقات الرسوميات', stock: 12 },
  { productId: 'i7-13700k', sku: 'CPU-13700K', category: 'المعالجات', stock: 8 },
  { productId: 'ssd-990', sku: 'SSD-990PRO', category: 'التخزين', stock: 24 },
  { productId: 'g-pro-x2', sku: 'HEAD-GPROX', category: 'الإكسسوارات', stock: 16 },
  { productId: 'tuf-monitor', sku: 'MON-TUF27', category: 'الشاشات', stock: 5 },
  { productId: 'dualsense', sku: 'CTRL-DUALSENSE', category: 'أجهزة التحكم', stock: 32 },
  { productId: 'mid-tower', sku: 'CASE-MID-ATX', category: 'الصناديق', stock: 18 },
  { productId: 'liquid-cooler', sku: 'COOLER-240', category: 'التبريد', stock: 0 },
];

// DEVELOPMENT CATALOG ONLY. Prices are illustrative USD cents, never live inventory.
export type BuilderItem = {
  id: string;
  name: string;
  arabicName: string;
  priceCents: number;
  sprite: number;
};

export type BuilderCase = BuilderItem & {
  motherboardFormats: string[];
  maxGpuLengthMm: number;
  maxCoolerHeightMm: number;
  radiatorMm: number;
  ports: string;
};

export type CorePart = {
  id: string;
  slot: string;
  label: string;
  name: string;
  priceCents: number;
  imagePosition: string;
  specs: {
    socket?: string;
    format?: string;
    memoryType?: string;
    gpuLengthMm?: number;
    watts?: number;
    radiatorMm?: number;
    coolerHeightMm?: number;
    performance?: number;
  };
};

export const builderCases: BuilderCase[] = [
  { id: 'standard', name: 'Standard Mid-Tower', arabicName: 'ستاندرد ميد تاور', priceCents: 12900, sprite: 0, motherboardFormats: ['ATX', 'mATX', 'Mini-ITX'], maxGpuLengthMm: 410, maxCoolerHeightMm: 175, radiatorMm: 360, ports: 'USB 3.2 ×2 / USB-C / Audio' },
  { id: 'airflow', name: 'Airflow Case', arabicName: 'كيس تدفق هواء', priceCents: 14900, sprite: 1, motherboardFormats: ['ATX', 'mATX', 'Mini-ITX'], maxGpuLengthMm: 430, maxCoolerHeightMm: 185, radiatorMm: 420, ports: 'USB 3.2 ×2 / USB-C / Audio' },
  { id: 'compact', name: 'Compact Case', arabicName: 'كيس كومباكت', priceCents: 10900, sprite: 2, motherboardFormats: ['mATX', 'Mini-ITX'], maxGpuLengthMm: 320, maxCoolerHeightMm: 155, radiatorMm: 240, ports: 'USB 3.2 ×2 / Audio' },
];

export const builderAccessories: BuilderItem[] = [
  { id: 'mouse', name: 'Logitech G502', arabicName: 'ماوس قيمنق', priceCents: 5900, sprite: 3 },
  { id: 'keyboard', name: 'Redragon K558', arabicName: 'كيبورد ميكانيكي', priceCents: 8900, sprite: 4 },
  { id: 'headset', name: 'HyperX Cloud II', arabicName: 'سماعة رأس', priceCents: 9900, sprite: 5 },
  { id: 'monitor', name: 'AOC 24G2SP IPS 24"', arabicName: 'شاشة IPS', priceCents: 14900, sprite: 6 },
  { id: 'pad', name: 'Redragon P027', arabicName: 'ماوس باد', priceCents: 1900, sprite: 7 },
  { id: 'speakers', name: 'Redragon GS520', arabicName: 'سماعات قيمنق', priceCents: 4500, sprite: 8 },
];

export const builderCoreOptions: CorePart[] = [
  { id: 'cpu-i7', slot: 'cpu', label: 'CPU', name: 'Intel Core i7-13700K', priceCents: 37900, imagePosition: '52% 45%', specs: { socket: 'LGA1700', watts: 253, performance: 92 } },
  { id: 'cpu-i5', slot: 'cpu', label: 'CPU', name: 'Intel Core i5-13400F', priceCents: 20900, imagePosition: '52% 45%', specs: { socket: 'LGA1700', watts: 148, performance: 76 } },
  { id: 'cooler-240', slot: 'cooler', label: 'CPU COOLER', name: '240mm Liquid Cooler', priceCents: 8900, imagePosition: '17% 18%', specs: { socket: 'LGA1700', radiatorMm: 240, watts: 12 } },
  { id: 'cooler-360', slot: 'cooler', label: 'CPU COOLER', name: '360mm Liquid Cooler', priceCents: 12900, imagePosition: '17% 18%', specs: { socket: 'LGA1700', radiatorMm: 360, watts: 18 } },
  { id: 'gpu-4070', slot: 'gpu', label: 'GPU', name: 'GeForce RTX 4070', priceCents: 59900, imagePosition: '17% 46%', specs: { gpuLengthMm: 300, watts: 200, performance: 91 } },
  { id: 'gpu-4080', slot: 'gpu', label: 'GPU', name: 'GeForce RTX 4080 SUPER', priceCents: 99900, imagePosition: '17% 46%', specs: { gpuLengthMm: 342, watts: 320, performance: 98 } },
  { id: 'ram-32', slot: 'ram', label: 'RAM', name: '32GB DDR5 5600MHz', priceCents: 10900, imagePosition: '25% 75%', specs: { memoryType: 'DDR5', watts: 10 } },
  { id: 'ram-64', slot: 'ram', label: 'RAM', name: '64GB DDR5 6000MHz', priceCents: 18900, imagePosition: '25% 75%', specs: { memoryType: 'DDR5', watts: 15 } },
  { id: 'storage-1tb', slot: 'storage', label: 'STORAGE', name: '1TB NVMe Gen4 SSD', priceCents: 7900, imagePosition: '48% 85%', specs: { watts: 8 } },
  { id: 'storage-2tb', slot: 'storage', label: 'STORAGE', name: '2TB NVMe Gen4 SSD', priceCents: 13900, imagePosition: '48% 85%', specs: { watts: 10 } },
  { id: 'psu-750', slot: 'psu', label: 'PSU', name: '750W 80+ Gold', priceCents: 9900, imagePosition: '66% 79%', specs: { watts: 750 } },
  { id: 'psu-1000', slot: 'psu', label: 'PSU', name: '1000W 80+ Gold', priceCents: 15900, imagePosition: '66% 79%', specs: { watts: 1000 } },
  { id: 'os-pro', slot: 'os', label: 'OS', name: 'Windows 11 Pro', priceCents: 13900, imagePosition: '50% 46%', specs: {} },
  { id: 'os-none', slot: 'os', label: 'OS', name: 'No operating system', priceCents: 0, imagePosition: '50% 46%', specs: {} },
  { id: 'board-atx', slot: 'motherboard', label: 'MOTHERBOARD', name: 'Z790 ATX DDR5', priceCents: 19900, imagePosition: '50% 46%', specs: { socket: 'LGA1700', format: 'ATX', memoryType: 'DDR5', watts: 60 } },
  { id: 'board-matx', slot: 'motherboard', label: 'MOTHERBOARD', name: 'B760 mATX DDR5', priceCents: 13900, imagePosition: '50% 46%', specs: { socket: 'LGA1700', format: 'mATX', memoryType: 'DDR5', watts: 50 } },
];

export const builderDefaults = {
  name: 'تجميعة النعيم',
  caseId: 'standard',
  assemblyFeeCents: 4900,
  parts: { cpu: 'cpu-i7', cooler: 'cooler-240', gpu: 'gpu-4070', ram: 'ram-32', storage: 'storage-1tb', psu: 'psu-750', os: 'os-pro', motherboard: 'board-atx' },
};
