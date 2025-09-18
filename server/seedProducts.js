const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load biến môi trường
dotenv.config({ path: __dirname + '/.env' });

// Import Models
const Product = require('./models/productModel');
const User = require('./models/userModel');

// Hàm kết nối CSDL
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Product Seeding...');
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

// Dữ liệu sản phẩm mẫu
const sampleProducts = [
    {
        name: 'Tấm Pin Mặt Trời Monocrystalline 450W',
        description: 'Tấm pin mặt trời công nghệ Monocrystalline hiệu suất cao 450W, phù hợp cho hệ thống điện mặt trời gia đình và thương mại.',
        shortDescription: 'Tấm pin 450W hiệu suất cao, bền bỉ 25 năm',
        price: 3500000,
        originalPrice: 4000000,
        category: 'solar-panels',
        brand: 'JinkoSolar',
        model: 'JKM450M-72H',
        sku: 'SP001',
        stockQuantity: 50,
        inStock: true,
        isFeatured: true,
        isActive: true,
        images: [
            {
                url: '/assets/placeholder-product.jpg',
                alt: 'Tấm Pin Mặt Trời 450W',
                isPrimary: true
            }
        ],
        specifications: {
            'Công suất': '450W',
            'Hiệu suất': '21.2%',
            'Kích thước': '2094 x 1038 x 35mm',
            'Trọng lượng': '22.5kg',
            'Bảo hành': '25 năm',
            'Chứng nhận': 'IEC, CE, TUV'
        },
        features: [
            'Công nghệ Monocrystalline tiên tiến',
            'Hiệu suất cao 21.2%',
            'Chống chịu thời tiết khắc nghiệt',
            'Bảo hành 25 năm'
        ],
        applications: [
            'Hệ thống điện mặt trời gia đình',
            'Dự án thương mại',
            'Hệ thống lưới điện'
        ],
        warranty: '25 năm bảo hành sản phẩm, 12 năm bảo hành hiệu suất'
    },
    {
        name: 'Inverter Hybrid 5kW MPPT',
        description: 'Inverter hybrid 5kW với công nghệ MPPT, hỗ trợ lưu trữ năng lượng và kết nối lưới điện.',
        shortDescription: 'Inverter hybrid 5kW, MPPT, lưu trữ năng lượng',
        price: 15000000,
        originalPrice: 18000000,
        category: 'inverters',
        brand: 'Growatt',
        model: 'SPH5000',
        sku: 'IV001',
        stock: 25,
        inStock: true,
        isFeatured: true,
        isActive: true,
        images: [
            {
                url: '/assets/placeholder-product.jpg',
                alt: 'Inverter Hybrid 5kW',
                isPrimary: true
            }
        ],
        specifications: {
            'Công suất': '5000W',
            'Điện áp đầu vào': '150-500V',
            'Hiệu suất': '97.6%',
            'Kích thước': '415 x 330 x 175mm',
            'Trọng lượng': '14kg',
            'Bảo hành': '5 năm'
        },
        features: [
            'Công nghệ MPPT tiên tiến',
            'Hỗ trợ pin lưu trữ',
            'Kết nối WiFi/4G',
            'Màn hình LCD hiển thị'
        ],
        applications: [
            'Hệ thống hybrid gia đình',
            'Backup điện dự phòng',
            'Hệ thống off-grid'
        ],
        warranty: '5 năm bảo hành toàn diện'
    },
    {
        name: 'Pin Lithium LiFePO4 100Ah 12V',
        description: 'Pin lithium LiFePO4 100Ah 12V, tuổi thọ cao, an toàn và thân thiện môi trường.',
        shortDescription: 'Pin lithium 100Ah, tuổi thọ 6000+ chu kỳ',
        price: 8500000,
        originalPrice: 10000000,
        category: 'batteries',
        brand: 'CATL',
        model: 'LFP100-12V',
        sku: 'BT001',
        stock: 30,
        inStock: true,
        isFeatured: false,
        isActive: true,
        images: [
            {
                url: '/assets/placeholder-product.jpg',
                alt: 'Pin Lithium LiFePO4',
                isPrimary: true
            }
        ],
        specifications: {
            'Dung lượng': '100Ah',
            'Điện áp': '12.8V',
            'Chu kỳ sạc': '6000+ cycles',
            'Kích thước': '330 x 172 x 220mm',
            'Trọng lượng': '11kg',
            'Nhiệt độ hoạt động': '-20°C đến +60°C'
        },
        features: [
            'Công nghệ LiFePO4 an toàn',
            'BMS thông minh tích hợp',
            'Tuổi thọ 6000+ chu kỳ',
            'Sạc nhanh, hiệu suất cao'
        ],
        applications: [
            'Hệ thống lưu trữ năng lượng',
            'UPS dự phòng',
            'Xe điện, thuyền điện'
        ],
        warranty: '5 năm bảo hành, 10 năm tuổi thọ'
    },
    {
        name: 'Giá Đỡ Tấm Pin Mặt Trời Mái Ngói',
        description: 'Hệ thống giá đỡ chuyên dụng cho mái ngói, chịu lực tốt, dễ lắp đặt.',
        shortDescription: 'Giá đỡ mái ngói, nhôm anodized, chịu lực cao',
        price: 1200000,
        originalPrice: 1500000,
        category: 'mounting-systems',
        brand: 'SolarMount',
        model: 'SM-TILE-01',
        sku: 'MS001',
        stock: 100,
        inStock: true,
        isFeatured: false,
        isActive: true,
        images: [
            {
                url: '/assets/placeholder-product.jpg',
                alt: 'Giá đỡ mái ngói',
                isPrimary: true
            }
        ],
        specifications: {
            'Chất liệu': 'Nhôm anodized',
            'Tải trọng': '50kg/m²',
            'Góc nghiêng': '15-60°',
            'Chiều cao': '150-300mm',
            'Bảo hành': '15 năm'
        },
        features: [
            'Nhôm anodized chống ăn mòn',
            'Thiết kế modular linh hoạt',
            'Lắp đặt nhanh chóng',
            'Chịu lực gió bão tốt'
        ],
        applications: [
            'Mái ngói gia đình',
            'Mái ngói thương mại',
            'Dự án quy mô lớn'
        ],
        warranty: '15 năm bảo hành cấu trúc'
    },
    {
        name: 'Hệ Thống Giám Sát Năng Lượng WiFi',
        description: 'Thiết bị giám sát năng lượng thông minh, kết nối WiFi, theo dõi real-time qua app.',
        shortDescription: 'Giám sát năng lượng WiFi, app mobile',
        price: 2500000,
        originalPrice: 3000000,
        category: 'monitoring',
        brand: 'SolarEdge',
        model: 'SE-WIFI-01',
        sku: 'MN001',
        stock: 40,
        inStock: true,
        isFeatured: true,
        isActive: true,
        images: [
            {
                url: '/assets/placeholder-product.jpg',
                alt: 'Hệ thống giám sát',
                isPrimary: true
            }
        ],
        specifications: {
            'Kết nối': 'WiFi 2.4GHz',
            'Giao thức': 'Modbus RTU/TCP',
            'Màn hình': 'LCD 3.5 inch',
            'Nguồn': '12-24VDC',
            'Nhiệt độ': '-10°C đến +70°C'
        },
        features: [
            'Kết nối WiFi không dây',
            'App mobile iOS/Android',
            'Cảnh báo real-time',
            'Lưu trữ dữ liệu cloud'
        ],
        applications: [
            'Hệ thống gia đình',
            'Dự án thương mại',
            'Giám sát từ xa'
        ],
        warranty: '3 năm bảo hành thiết bị'
    },
    {
        name: 'Cáp DC Solar 4mm² PV1-F',
        description: 'Cáp DC chuyên dụng cho hệ thống điện mặt trời, chống UV, chịu nhiệt độ cao.',
        shortDescription: 'Cáp DC 4mm², chống UV, TUV certified',
        price: 45000,
        originalPrice: 55000,
        category: 'accessories',
        brand: 'Lapp',
        model: 'PV1-F-4mm',
        sku: 'AC001',
        stock: 500,
        inStock: true,
        isFeatured: false,
        isActive: true,
        images: [
            {
                url: '/assets/placeholder-product.jpg',
                alt: 'Cáp DC Solar',
                isPrimary: true
            }
        ],
        specifications: {
            'Tiết diện': '4mm²',
            'Điện áp': '1500VDC',
            'Nhiệt độ': '-40°C đến +90°C',
            'Màu sắc': 'Đen/Đỏ',
            'Chứng nhận': 'TUV, UL'
        },
        features: [
            'Chống UV và ozone',
            'Chịu nhiệt độ cao',
            'Cách điện XLPE',
            'Tuổi thọ 25 năm'
        ],
        applications: [
            'Kết nối tấm pin',
            'Hệ thống DC',
            'Dự án outdoor'
        ],
        warranty: '25 năm bảo hành chất lượng'
    }
];

const importProducts = async () => {
    try {
        // Tìm admin user để gán làm người tạo
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.error('Admin user not found! Please run seed script first.');
            process.exit(1);
        }

        // Xóa sản phẩm cũ
        await Product.deleteMany();
        console.log('Old products destroyed!');

        // Thêm createdBy cho tất cả sản phẩm
        const productsWithCreator = sampleProducts.map(product => ({
            ...product,
            createdBy: adminUser._id
        }));

        // Thêm sản phẩm mới
        await Product.insertMany(productsWithCreator);
        console.log(`${sampleProducts.length} products imported successfully!`);

        process.exit(0);
    } catch (error) {
        console.error(`Error importing products: ${error}`);
        process.exit(1);
    }
};

// Kết nối DB và import sản phẩm
connectDB().then(() => {
    importProducts();
});
