const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Import Models
const User = require('./models/userModel');
const Report = require('./models/reportModel');
const Product = require('./models/productModel');

// Load biến môi trường
dotenv.config({ path: __dirname + '/.env' });

// Hàm kết nối CSDL
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding...');
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

// --- DỮ LIỆU MẪU ---

const users = [
    {
        name: 'Admin Solar Analytics',
        email: 'manh092002@gmail.com',
        password: 'ManhPhan09@', // Mật khẩu sẽ được mã hóa
        phone: '0979900874',
        address: 'Hà Nội, Việt Nam',
        employeeId: 'ADMIN001',
        role: 'admin',
    },
    {
        name: 'Phan Xuân Mạnh',
        email: 'pxmanhctc@gmail.com',
        password: '123456789@',
        phone: '0987654321',
        address: 'TP.HCM, Việt Nam',
        employeeId: 'USER001',
        role: 'user',
    },
];

// Dữ liệu sản phẩm năng lượng mặt trời
const products = [
    {
        name: 'Tấm Pin Mặt Trời Monocrystalline 450W',
        description: 'Tấm pin năng lượng mặt trời công nghệ Monocrystalline hiệu suất cao 450W, phù hợp cho hệ thống điện mặt trời gia đình và thương mại.',
        shortDescription: 'Tấm pin Monocrystalline 450W hiệu suất cao 21.2%',
        price: 3500000,
        originalPrice: 4000000,
        category: 'solar-panels',
        brand: 'JinkoSolar',
        model: 'JKM450M-72HL4-V',
        stockQuantity: 50,
        images: [
            {
                url: '/assets/images/mt_1.jpg',
                alt: 'Tấm Pin Mặt Trời Monocrystalline 450W',
                isPrimary: true
            },
            {
                url: '/assets/images/mt_2.jpg',
                alt: 'Tấm Pin Mặt Trời Monocrystalline 450W - Mặt sau',
                isPrimary: false
            }
        ],
        specifications: {
            power: '450W',
            efficiency: '21.2%',
            warranty: '25 năm',
            dimensions: '2094 x 1038 x 35mm',
            weight: '22.5kg',
            certification: 'IEC 61215, IEC 61730, CE'
        },
        features: ['Hiệu suất cao 21.2%', 'Chống thấm nước IP67', 'Chịu được gió mạnh', 'Công nghệ PERC'],
        applications: ['Hệ thống điện mặt trời gia đình', 'Dự án thương mại', 'Hệ thống off-grid'],
        inStock: true,
        isActive: true,
        isFeatured: true,
        rating: {
            average: 4.8,
            count: 156
        },
        tags: ['monocrystalline', 'high-efficiency', 'residential', 'commercial']
    },
    {
        name: 'Inverter Hybrid 5kW MPPT',
        description: 'Inverter lai (Hybrid) 5kW với bộ điều khiển sạc MPPT tích hợp, hỗ trợ lưu trữ năng lượng pin và kết nối lưới điện.',
        shortDescription: 'Inverter Hybrid 5kW với MPPT kép và WiFi',
        price: 15000000,
        originalPrice: 17000000,
        category: 'inverters',
        brand: 'Growatt',
        model: 'SPH5000TL3-BH-UP',
        stockQuantity: 25,
        images: [
            {
                url: '/assets/images/mt_3.jpg',
                alt: 'Inverter Hybrid 5kW MPPT',
                isPrimary: true
            },
            {
                url: '/assets/images/mt_4.jpg',
                alt: 'Inverter Hybrid 5kW MPPT - Màn hình LCD',
                isPrimary: false
            }
        ],
        specifications: {
            power: '5000W',
            efficiency: '97.6%',
            warranty: '5 năm',
            dimensions: '375 x 470 x 170mm',
            weight: '16.5kg',
            certification: 'CE, VDE, G98/G99'
        },
        features: ['MPPT kép', 'Chế độ Hybrid', 'Màn hình LCD', 'Kết nối WiFi', 'Bảo vệ quá tải'],
        applications: ['Hệ thống hybrid có pin', 'Hệ thống on-grid', 'Backup power'],
        inStock: true,
        isActive: true,
        isFeatured: true,
        rating: {
            average: 4.7,
            count: 89
        },
        tags: ['hybrid', 'mppt', 'wifi', 'backup-power']
    },
    {
        name: 'Pin Lithium LiFePO4 100Ah 12V',
        description: 'Pin Lithium Iron Phosphate (LiFePO4) 100Ah 12V, tuổi thọ cao, an toàn và hiệu suất ổn định cho hệ thống năng lượng mặt trời.',
        shortDescription: 'Pin LiFePO4 100Ah với BMS tích hợp',
        price: 8500000,
        originalPrice: 9500000,
        category: 'batteries',
        brand: 'CATL',
        model: 'LFP100-12V',
        stockQuantity: 30,
        images: [
            {
                url: '/assets/images/nl_mat_troi.jpg',
                alt: 'Pin Lithium LiFePO4 100Ah 12V',
                isPrimary: true
            },
            {
                url: '/assets/images/mt_1.jpg',
                alt: 'Pin Lithium LiFePO4 100Ah 12V - Cổng kết nối',
                isPrimary: false
            }
        ],
        specifications: {
            power: '1280Wh',
            efficiency: '95%',
            warranty: '5 năm',
            dimensions: '330 x 172 x 220mm',
            weight: '13.5kg',
            certification: 'UN38.3, CE, RoHS'
        },
        features: ['Công nghệ LiFePO4', 'BMS tích hợp', 'Sạc nhanh', 'An toàn cao', 'Tuổi thọ dài'],
        applications: ['Hệ thống solar hybrid', 'UPS', 'RV/Marine', 'Off-grid systems'],
        inStock: true,
        isActive: true,
        isFeatured: false,
        rating: {
            average: 4.6,
            count: 67
        },
        tags: ['lifepo4', 'bms', 'long-life', 'safe']
    },
    {
        name: 'Giá Đỡ Tấm Pin Mặt Trời Mái Ngói',
        description: 'Hệ thống giá đỡ chuyên dụng cho tấm pin mặt trời trên mái ngói, chất liệu nhôm anodized chống ăn mòn.',
        shortDescription: 'Giá đỡ nhôm anodized cho mái ngói',
        price: 1200000,
        originalPrice: 1400000,
        category: 'mounting-systems',
        brand: 'SolarMount',
        model: 'SM-TR-001',
        stockQuantity: 100,
        images: [
            {
                url: '/assets/images/mt_2.jpg',
                alt: 'Giá Đỡ Tấm Pin Mặt Trời Mái Ngói',
                isPrimary: true
            },
            {
                url: '/assets/images/mt_3.jpg',
                alt: 'Giá Đỡ Tấm Pin Mặt Trời Mái Ngói - Chi tiết lắp đặt',
                isPrimary: false
            }
        ],
        specifications: {
            power: 'N/A',
            efficiency: 'N/A',
            warranty: '15 năm',
            dimensions: '40 x 40mm rail',
            weight: '2.5kg/m',
            material: 'Nhôm anodized AL6005-T5',
            certification: 'AS/NZS 1170'
        },
        features: ['Chống ăn mòn', 'Lắp đặt dễ dàng', 'Chịu tải cao', 'Thiết kế tối ưu'],
        applications: ['Mái ngói gia đình', 'Mái tôn công nghiệp', 'Dự án thương mại'],
        inStock: true,
        isActive: true,
        isFeatured: false,
        rating: {
            average: 4.5,
            count: 34
        },
        tags: ['mounting', 'aluminum', 'tile-roof', 'corrosion-resistant']
    },
    {
        name: 'Hệ Thống Giám Sát Năng Lượng WiFi',
        description: 'Thiết bị giám sát năng lượng thông minh với kết nối WiFi, theo dõi real-time qua smartphone app.',
        shortDescription: 'Thiết bị giám sát WiFi real-time',
        price: 2500000,
        originalPrice: 3000000,
        category: 'monitoring',
        brand: 'SolarEdge',
        model: 'SE-MON-WIFI-01',
        stockQuantity: 40,
        images: [
            {
                url: '/assets/images/mt_4.jpg',
                alt: 'Hệ Thống Giám Sát Năng Lượng WiFi',
                isPrimary: true
            },
            {
                url: '/assets/images/nl_mat_troi.jpg',
                alt: 'Hệ Thống Giám Sát Năng Lượng WiFi - App mobile',
                isPrimary: false
            }
        ],
        specifications: {
            power: '12V DC',
            efficiency: '±1% accuracy',
            warranty: '3 năm',
            dimensions: '120 x 80 x 25mm',
            weight: '200g',
            certification: 'CE, FCC, IC'
        },
        features: ['Giám sát real-time', 'App mobile', 'Cảnh báo thông minh', 'Lưu trữ cloud', 'Báo cáo tự động'],
        applications: ['Hệ thống gia đình', 'Giám sát từ xa', 'Tối ưu hiệu suất'],
        inStock: true,
        isActive: true,
        isFeatured: false,
        rating: {
            average: 4.4,
            count: 23
        },
        tags: ['monitoring', 'wifi', 'real-time', 'mobile-app']
    },
    {
        name: 'Cáp DC Solar 4mm² PV1-F',
        description: 'Cáp DC chuyên dụng cho hệ thống điện mặt trời, tiết diện 4mm², chứng nhận TÜV, chịu UV và thói tiết khắc nghiệt.',
        shortDescription: 'Cáp DC 4mm² chứng nhận TÜV',
        price: 45000,
        originalPrice: 55000,
        category: 'accessories',
        brand: 'Lapp',
        model: 'PV1-F-4mm2',
        stockQuantity: 500,
        images: [
            {
                url: '/assets/images/mt_1.jpg',
                alt: 'Cáp DC Solar 4mm² PV1-F',
                isPrimary: true
            },
            {
                url: '/assets/images/mt_2.jpg',
                alt: 'Cáp DC Solar 4mm² PV1-F - Đầu kết nối MC4',
                isPrimary: false
            }
        ],
        specifications: {
            power: '1500V DC',
            efficiency: 'N/A',
            warranty: '25 năm',
            dimensions: '4mm² cross-section',
            weight: '0.05kg/m',
            material: 'XLPE/LSZH',
            certification: 'TÜV, CE, RoHS'
        },
        features: ['Chịu UV cao', 'Chống cháy LSZH', 'Chứng nhận TÜV', 'Tuổi thọ 25 năm'],
        applications: ['Kết nối tấm pin', 'Hệ thống DC', 'Lắp đặt ngoài trời'],
        inStock: true,
        isActive: true,
        isFeatured: false,
        rating: {
            average: 4.3,
            count: 78
        },
        tags: ['cable', 'dc', 'tuv-certified', 'uv-resistant']
    }
];

// Dữ liệu báo cáo bạn cung cấp
const sampleReportData = {
    survey: {
        name: 'Mạnh',
        address: 'Xã Nghĩa Lợi, Huyện Nghĩa Đàn, Tỉnh Nghệ An',
        customerType: 'Hộ gia đình',
        region: 'Miền Trung/Nam'
    },
    scenarios: [{
        scenarioName: 'Phân tích cho khách hàng Mạnh',
        inputs: {
            monthlyKwh: 560,
            investmentCostPerKwp: 9000000,
            panelWattage: 620,
            systemType: 'Hybrid',
            storageInvestmentCost: 15000000,
            dayUsageRatio: 40,
        },
        results: {
            recommendedKwp: 4.67,
            numberOfPanels: 8, // (4.67 * 1000) / 620 ~ 7.5 -> làm tròn lên 8
            requiredArea: 25.43,
            storageKwh: 2.33,
            totalInvestment: 77055000, // (4.67 * 9M) + (2.33 * 15M) = 42.03M + 34.95M = 76.98M ~ 77.055M
            monthlySavings: 633457,
            paybackPeriodYears: 10.1,
            roiFirstYear: 9.9,
            co2ReductionYearly: 4.77,
            treeEquivalent: 81
        }
    }]
};


// --- CÁC HÀM XỬ LÝ ---

const importData = async () => {
    try {
        // Xóa dữ liệu cũ
        await Report.deleteMany();
        await User.deleteMany();
        await Product.deleteMany();
        console.log('Data Destroyed!');

        // Mã hóa mật khẩu cho người dùng mẫu
        const createdUsers = await Promise.all(users.map(async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            return user;
        }));
        
        // Thêm người dùng vào CSDL
        const insertedUsers = await User.insertMany(createdUsers);
        const adminUserId = insertedUsers.find(u => u.role === 'admin')._id;
        const regularUserId = insertedUsers.find(u => u.role === 'user')._id;
        console.log('Users Imported!');

        // Gán createdBy cho tất cả sản phẩm
        const productsWithCreatedBy = products.map(product => ({
            ...product,
            createdBy: adminUserId
        }));

        // Thêm 6 sản phẩm năng lượng mặt trời vào CSDL
        await Product.insertMany(productsWithCreatedBy);
        console.log('Products Imported! (6 sản phẩm năng lượng mặt trời)');

        // Gán báo cáo mẫu cho 'Normal User'
        const reportWithUser = { ...sampleReportData, user: regularUserId };
        
        // Thêm báo cáo mẫu vào CSDL
        await Report.create(reportWithUser);
        console.log('Sample Report Imported!');

        console.log('Data Imported Successfully!');
        console.log('\n=== THÔNG TIN ĐĂNG NHẬP ===');
        console.log('Admin: manh092002@gmail.com / ManhPhan09@');
        console.log('User: pxmanhctc@gmail.com / 123456789@');
        
        console.log('\n=== SẢN PHẨM ĐÃ THÊM ===');
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ${product.price.toLocaleString('vi-VN')}đ`);
        });
        process.exit();
    } catch (error) {
        console.error(`Error with data import: ${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Report.deleteMany();
        await User.deleteMany();
        await Product.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`Error with data destruction: ${error}`);
        process.exit(1);
    }
};


// --- THỰC THI SCRIPT ---
connectDB().then(() => {
    if (process.argv[2] === '-d') {
        destroyData();
    } else {
        importData();
    }
});