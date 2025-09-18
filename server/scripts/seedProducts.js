// Script to seed sample products data
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const User = require('../models/userModel');

const sampleProducts = [
    {
        name: "Tấm Pin Mặt Trời Monocrystalline 450W",
        shortDescription: "Tấm pin mặt trời monocrystalline hiệu suất cao 450W, phù hợp cho hệ thống gia đình và thương mại.",
        description: "Tấm pin mặt trời Monocrystalline 450W sử dụng công nghệ tiên tiến với hiệu suất chuyển đổi năng lượng cao đến 22%. Thiết kế bền bỉ, chống thấm nước IP67, khung nhôm anodized chống ăn mòn. Phù hợp cho các hệ thống điện mặt trời gia đình và thương mại.",
        price: 3500000,
        originalPrice: 4000000,
        category: "solar-panels",
        brand: "SolarTech",
        model: "ST-450M",
        specifications: {
            power: "450W",
            efficiency: "22.1%",
            warranty: "25 năm",
            dimensions: "2108 x 1048 x 40mm",
            weight: "22.5kg",
            material: "Monocrystalline Silicon",
            certification: "IEC 61215, IEC 61730, CE"
        },
        images: [
            {
                url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
                alt: "Tấm pin mặt trời monocrystalline 450W",
                isPrimary: true
            },
            {
                url: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800",
                alt: "Chi tiết tấm pin mặt trời",
                isPrimary: false
            }
        ],
        features: [
            "Hiệu suất chuyển đổi cao 22.1%",
            "Khung nhôm anodized chống ăn mòn",
            "Chống thấm nước IP67",
            "Bảo hành 25 năm",
            "Chịu được tải trọng gió 2400Pa, tuyết 5400Pa"
        ],
        applications: [
            "Hệ thống điện mặt trời gia đình",
            "Dự án thương mại quy mô nhỏ",
            "Hệ thống off-grid",
            "Hệ thống hybrid"
        ],
        inStock: true,
        stockQuantity: 50,
        isFeatured: true
    },
    {
        name: "Inverter Hybrid 5kW MPPT",
        shortDescription: "Inverter hybrid 5kW với bộ điều khiển sạc MPPT tích hợp, hỗ trợ pin lưu trữ.",
        description: "Inverter hybrid 5kW với công nghệ MPPT tiên tiến, hiệu suất chuyển đổi cao đến 97%. Tích hợp bộ điều khiển sạc pin thông minh, hỗ trợ nhiều loại pin lithium và acid. Màn hình LCD hiển thị thông số hoạt động chi tiết.",
        price: 15000000,
        originalPrice: 18000000,
        category: "inverters",
        brand: "PowerMax",
        model: "PM-5K-HYBRID",
        specifications: {
            power: "5000W",
            efficiency: "97.2%",
            warranty: "5 năm",
            dimensions: "420 x 290 x 150mm",
            weight: "12kg",
            material: "Nhôm đúc",
            certification: "CE, RoHS, FCC"
        },
        images: [
            {
                url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
                alt: "Inverter hybrid 5kW",
                isPrimary: true
            }
        ],
        features: [
            "Công nghệ MPPT hiệu suất cao",
            "Tích hợp bộ điều khiển sạc pin",
            "Màn hình LCD thông minh",
            "Hỗ trợ nhiều loại pin",
            "Chế độ UPS tự động",
            "Kết nối WiFi/Bluetooth"
        ],
        applications: [
            "Hệ thống hybrid gia đình",
            "Backup power cho văn phòng",
            "Hệ thống off-grid",
            "Microgrid"
        ],
        inStock: true,
        stockQuantity: 25,
        isFeatured: true
    },
    {
        name: "Pin Lithium LiFePO4 100Ah 12V",
        shortDescription: "Pin lithium LiFePO4 100Ah 12V với BMS tích hợp, tuổi thọ cao, an toàn tuyệt đối.",
        description: "Pin lithium LiFePO4 100Ah 12V sử dụng công nghệ LiFePO4 tiên tiến, tuổi thọ lên đến 6000 chu kỳ. Tích hợp BMS thông minh bảo vệ quá sạc, quá phát, ngắn mạch. Trọng lượng nhẹ, kích thước nhỏ gọn, thân thiện với môi trường.",
        price: 8500000,
        category: "batteries",
        brand: "EnergyStore",
        model: "ES-100LFP",
        specifications: {
            power: "1280Wh",
            efficiency: "95%",
            warranty: "10 năm",
            dimensions: "330 x 173 x 220mm",
            weight: "13.5kg",
            material: "LiFePO4",
            certification: "UN38.3, CE, RoHS"
        },
        images: [
            {
                url: "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800",
                alt: "Pin lithium LiFePO4 100Ah",
                isPrimary: true
            }
        ],
        features: [
            "Công nghệ LiFePO4 an toàn",
            "BMS thông minh tích hợp",
            "Tuổi thọ 6000+ chu kỳ",
            "Sạc nhanh 0.5C",
            "Hoạt động -20°C đến 60°C",
            "Không độc hại, thân thiện môi trường"
        ],
        applications: [
            "Hệ thống lưu trữ năng lượng gia đình",
            "RV và thuyền",
            "Hệ thống backup",
            "Off-grid solar system"
        ],
        inStock: true,
        stockQuantity: 30,
        isFeatured: false
    },
    {
        name: "Giá Đỡ Tấm Pin Mặt Trời Mái Ngói",
        shortDescription: "Hệ thống giá đỡ chuyên dụng cho mái ngói, chịu lực cao, lắp đặt dễ dàng.",
        description: "Hệ thống giá đỡ tấm pin mặt trời chuyên dụng cho mái ngói, được thiết kế để phù hợp với các loại ngói phổ biến tại Việt Nam. Chất liệu nhôm hợp kim 6005-T5 chống ăn mòn, chịu được điều kiện thời tiết khắc nghiệt.",
        price: 1200000,
        category: "mounting-systems",
        brand: "MountPro",
        model: "MP-TILE-01",
        specifications: {
            power: "Chịu tải 60kg/m²",
            warranty: "15 năm",
            dimensions: "Tùy chỉnh theo dự án",
            weight: "2.5kg/m²",
            material: "Nhôm hợp kim 6005-T5",
            certification: "AS/NZS 1170, CE"
        },
        images: [
            {
                url: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800",
                alt: "Giá đỡ tấm pin mái ngói",
                isPrimary: true
            }
        ],
        features: [
            "Phù hợp mái ngói Việt Nam",
            "Nhôm hợp kim chống ăn mòn",
            "Lắp đặt không cần khoan ngói",
            "Chịu tải trọng cao",
            "Thiết kế thẩm mỹ",
            "Bộ phụ kiện hoàn chỉnh"
        ],
        applications: [
            "Mái ngói gia đình",
            "Nhà xưởng mái ngói",
            "Biệt thự",
            "Nhà phố"
        ],
        inStock: true,
        stockQuantity: 100,
        isFeatured: false
    },
    {
        name: "Hệ Thống Giám Sát Năng Lượng WiFi",
        shortDescription: "Thiết bị giám sát năng lượng mặt trời qua WiFi, theo dõi real-time trên smartphone.",
        description: "Hệ thống giám sát năng lượng mặt trời thông minh với kết nối WiFi, cho phép theo dõi hiệu suất hệ thống real-time qua smartphone. Tích hợp cảm biến nhiệt độ, độ ẩm, cường độ ánh sáng. Cảnh báo sự cố tự động qua email/SMS.",
        price: 2500000,
        category: "monitoring",
        brand: "SmartSolar",
        model: "SS-MONITOR-W1",
        specifications: {
            power: "5W",
            warranty: "3 năm",
            dimensions: "120 x 80 x 25mm",
            weight: "0.3kg",
            material: "ABS + PC",
            certification: "FCC, CE, IC"
        },
        images: [
            {
                url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
                alt: "Hệ thống giám sát năng lượng",
                isPrimary: true
            }
        ],
        features: [
            "Kết nối WiFi 2.4GHz",
            "App mobile iOS/Android",
            "Giám sát real-time",
            "Cảnh báo sự cố tự động",
            "Lưu trữ dữ liệu cloud",
            "Báo cáo hiệu suất chi tiết"
        ],
        applications: [
            "Hệ thống solar gia đình",
            "Dự án thương mại",
            "Microgrid",
            "Nghiên cứu và phát triển"
        ],
        inStock: true,
        stockQuantity: 40,
        isFeatured: true
    },
    {
        name: "Cáp DC Solar 4mm² PV1-F",
        shortDescription: "Cáp DC chuyên dụng cho hệ thống năng lượng mặt trời, chống UV, chịu nhiệt độ cao.",
        description: "Cáp DC Solar 4mm² PV1-F được thiết kế chuyên dụng cho hệ thống năng lượng mặt trời. Vỏ cáp XLPE chống UV, chịu được nhiệt độ từ -40°C đến +90°C. Lõi đồng nguyên chất 99.9%, độ dẫn điện cao, tổn thất thấp.",
        price: 45000,
        category: "accessories",
        brand: "CableTech",
        model: "CT-PV1F-4",
        specifications: {
            power: "Dòng định mức 32A",
            warranty: "20 năm",
            dimensions: "4mm² x 100m",
            weight: "0.065kg/m",
            material: "Đồng + XLPE",
            certification: "TÜV, CE, RoHS"
        },
        images: [
            {
                url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
                alt: "Cáp DC Solar 4mm²",
                isPrimary: true
            }
        ],
        features: [
            "Chống UV tia cực tím",
            "Chịu nhiệt -40°C đến +90°C",
            "Lõi đồng nguyên chất 99.9%",
            "Vỏ cáp XLPE bền bỉ",
            "Chống cháy halogen-free",
            "Tuổi thọ 25+ năm"
        ],
        applications: [
            "Kết nối tấm pin mặt trời",
            "Hệ thống DC solar",
            "Inverter và combiner box",
            "Monitoring system"
        ],
        inStock: true,
        stockQuantity: 200,
        isFeatured: false
    }
];

async function seedProducts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find an admin user to assign as creator
        let adminUser = await User.findOne({ role: 'admin' });
        
        if (!adminUser) {
            // Create a default admin user if none exists
            adminUser = new User({
                name: 'Admin',
                email: 'admin@solaranalytics.vn',
                password: 'admin123',
                role: 'admin',
                isVerified: true
            });
            await adminUser.save();
            console.log('Created default admin user');
        }

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Add createdBy field to all products
        const productsWithCreator = sampleProducts.map(product => ({
            ...product,
            createdBy: adminUser._id
        }));

        // Insert sample products
        const insertedProducts = await Product.insertMany(productsWithCreator);
        console.log(`Inserted ${insertedProducts.length} sample products`);

        // Display inserted products
        insertedProducts.forEach(product => {
            console.log(`- ${product.name} (${product.category}) - ${product.price.toLocaleString('vi-VN')}đ`);
        });

        console.log('\nSample products seeded successfully!');
        console.log('\nAdmin login credentials:');
        console.log('Email: admin@solaranalytics.vn');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error seeding products:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the seed function
seedProducts();
