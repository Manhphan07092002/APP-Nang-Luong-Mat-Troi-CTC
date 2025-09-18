// File: client/js/modules/reportRenderer.js
// Module này chứa các hàm để render giao diện báo cáo và biểu đồ với thiết kế hiện đại

// Biến để lưu trữ các đối tượng biểu đồ, giúp hủy chúng đi trước khi vẽ lại
let billChartInstance = null;
let paybackChartInstance = null;

/**
 * Hiển thị toàn bộ trang kết quả báo cáo vào một element container
 * @param {HTMLElement} container - Element DOM để chèn kết quả vào
 * @param {object} data - Dữ liệu báo cáo đầy đủ từ server
 */
export function renderReport(container, data) {
    const { survey, scenarios, createdAt } = data;
    const mainScenario = scenarios[0];

    // Thêm CSS styles hiện đại
    if (!document.getElementById('modern-report-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'modern-report-styles';
        styleSheet.textContent = `
            /* Modern Report Styles */
            .modern-report-container {
                background: #ffffff;
                min-height: 100vh;
                font-family: 'Be Vietnam Pro', sans-serif;
            }
            
            .modern-container {
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(200, 200, 200, 0.3);
                border-radius: 24px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .modern-container:hover {
                transform: translateY(-4px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            }
            
            .stat-card {
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(200, 200, 200, 0.3);
                border-radius: 20px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .stat-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid rgba(200, 200, 200, 0.2);
                transition: background 0.2s ease;
            }
            
            .stat-item:hover {
                background: rgba(240, 240, 240, 0.3);
            }
            
            .stat-item:last-child {
                border-bottom: none;
            }
            
            .stat-label {
                color: rgba(0, 0, 0, 0.8);
                font-size: 0.875rem;
                font-weight: 500;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
            }
            
            .stat-value {
                font-weight: 700;
                font-size: 1.1rem;
                color: #000000;
                text-shadow: 0 1px 3px rgba(255, 255, 255, 0.3);
            }
            
            .chart-container {
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(200, 200, 200, 0.3);
                border-radius: 20px;
                padding: 2rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .chart-container:hover {
                transform: translateY(-4px);
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
            }
            
            .modern-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 50px;
                padding: 12px 32px;
                font-weight: 600;
                color: white;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .modern-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
            }
            
            h1, h2, h3, h4, h5, h6 {
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                letter-spacing: -0.025em;
                color: #000000 !important;
            }
            
            p, span, div {
                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    // Chèn cấu trúc HTML chính của báo cáo với thiết kế hiện đại
    container.innerHTML = `
        <div id="report-content" class="modern-report-container p-4 sm:p-8">
            <div class="max-w-7xl mx-auto">
                <!-- Modern Header Section -->
                <div class="modern-container p-8 mb-8">
                    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div class="flex-1">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                                    <i class="fas fa-chart-line text-white text-xl"></i>
                                </div>
                                <h1 class="text-4xl font-bold text-black drop-shadow-lg">📊 Báo Cáo Phân Tích Đầu Tư</h1>
                            </div>
                            <div class="space-y-2">
                                <p class="text-xl text-black drop-shadow-md">
                                    <i class="fas fa-user mr-2 text-blue-300"></i>
                                    Khách hàng: <span class="font-bold text-gray-800 drop-shadow-sm">${survey.name}</span>
                                </p>
                                <p class="text-black/90 drop-shadow-sm">
                                    <i class="fas fa-calendar mr-2 text-green-200"></i>
                                    Ngày tạo: <span class="font-semibold">${new Date(createdAt).toLocaleString('vi-VN')}</span>
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row gap-4">
                            <button id="export-pdf-btn" class="modern-btn bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                                <i class="fas fa-file-pdf"></i>
                                <span>📄 Tải PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Customer Information Section -->
                <div class="modern-container p-8 mb-8">
                    <div class="flex items-center mb-6">
                        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-user-circle text-white text-xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-black drop-shadow-lg">👤 Thông tin khách hàng</h2>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div class="stat-card p-6">
                            <div id="customer-info-left" class="space-y-1"></div>
                        </div>
                        <div class="stat-card p-6">
                            <div id="customer-info-right" class="space-y-1"></div>
                        </div>
                    </div>
                </div>

                <!-- System Parameters Section -->
                <div class="modern-container p-8 mb-8">
                    <div class="flex items-center mb-6">
                        <div class="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-bolt text-white text-xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-black drop-shadow-lg">💡 Thông số Tiêu thụ</h2>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div class="stat-card p-6">
                            <div id="consumption-details" class="space-y-1"></div>
                        </div>
                        <div class="stat-card p-6">
                            <div id="system-specs" class="space-y-1"></div>
                        </div>
                    </div>
                </div>

                <!-- Main Results Section -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Left Column -->
                    <div class="lg:col-span-1 space-y-8">
                        <!-- System Recommendations Card -->
                        <div class="stat-card p-6">
                            <div class="flex items-center mb-6">
                                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
                                    <i class="fas fa-solar-panel text-white"></i>
                                </div>
                                <h2 class="text-xl font-bold text-black drop-shadow-lg">⚡ Hệ Thống Đề Xuất</h2>
                            </div>
                            <div id="system-details" class="space-y-1"></div>
                        </div>
                        
                        <!-- Environmental Impact Card -->
                        <div class="stat-card p-6">
                            <div class="flex items-center mb-6">
                                <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                                    <i class="fas fa-leaf text-white"></i>
                                </div>
                                <h2 class="text-xl font-bold text-black drop-shadow-lg">🌱 Tác Động Môi Trường</h2>
                            </div>
                            <div id="env-details" class="space-y-1"></div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="lg:col-span-2 space-y-8">
                        <!-- Financial Analysis Card -->
                        <div class="stat-card p-6">
                            <div class="flex items-center mb-6">
                                <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                                    <i class="fas fa-chart-pie text-white"></i>
                                </div>
                                <h2 class="text-xl font-bold text-black drop-shadow-lg">💰 Phân Tích Tài Chính</h2>
                            </div>
                            <div id="financial-details" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                        </div>
                        
                        <!-- Monthly Bill Comparison Chart -->
                        <div class="chart-container">
                            <div class="flex items-center mb-6">
                                <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
                                    <i class="fas fa-chart-bar text-white"></i>
                                </div>
                                <h3 class="text-xl font-bold text-black drop-shadow-lg">📊 So Sánh Chi Phí Điện Hàng Tháng</h3>
                            </div>
                            <div class="h-64 bg-white/10 rounded-xl p-4">
                                <canvas id="billChart"></canvas>
                            </div>
                        </div>
                        
                        <!-- Payback Analysis Chart -->
                        <div class="chart-container">
                            <div class="flex items-center mb-6">
                                <div class="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                                    <i class="fas fa-chart-line text-white"></i>
                                </div>
                                <h3 class="text-xl font-bold text-black drop-shadow-lg">📈 Phân Tích Dòng Tiền & Hoàn Vốn</h3>
                            </div>
                            <div class="h-80 bg-white/10 rounded-xl p-4">
                                <canvas id="paybackChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Điền dữ liệu vào các phần của báo cáo
    fillReportDetails(data);

    // Vẽ biểu đồ
    const originalBill = mainScenario.results?.originalBill || mainScenario.inputs.monthlyBill || 0;
    const monthlySavings = mainScenario.results?.monthlySavings || 0;
    const newBill = mainScenario.results?.newBill || Math.max(0, originalBill - monthlySavings);
    
    console.log('Chart data:', { originalBill, monthlySavings, newBill }); // Debug log
    createBillChart(originalBill, newBill);

    const totalInvestment = mainScenario.results?.totalInvestment || 0;
    const annualSavings = mainScenario.results?.annualSavings || 0;
    createPaybackChart(totalInvestment, annualSavings);

    // Gắn sự kiện cho nút xuất PDF
    document.getElementById('export-pdf-btn').addEventListener('click', () => {
        exportPDF(survey.name);
    });
}

/**
 * Điền dữ liệu chi tiết vào các phần của báo cáo
 * @param {object} data - Dữ liệu báo cáo
 */
function fillReportDetails(data) {
    const { survey, scenarios } = data;
    const mainScenario = scenarios[0];
    const formatCurrency = (value) => (value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    const createStatItem = (iconClass, iconColor, label, value) => `
        <div class="stat-item">
            <span class="stat-label">
                <i class="${iconClass} mr-2 ${iconColor}"></i>
                ${label}:
            </span>
            <span class="stat-value">${value}</span>
        </div>`;
    
    // Thông tin khách hàng - Cột trái
    document.getElementById('customer-info-left').innerHTML = [
        createStatItem('fas fa-user', 'text-blue-400', 'Tên khách hàng', survey.name || 'Chưa cung cấp'),
        createStatItem('fas fa-phone', 'text-green-400', 'Số điện thoại', survey.phone || 'Chưa cung cấp'),
        createStatItem('fas fa-envelope', 'text-purple-400', 'Email', survey.email || 'Chưa cung cấp'),
        createStatItem('fas fa-venus-mars', 'text-pink-400', 'Giới tính', survey.gender || 'Chưa cung cấp'),
        createStatItem('fas fa-birthday-cake', 'text-teal-400', 'Ngày sinh', survey.dateOfBirth ? new Date(survey.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cung cấp')
    ].join('');

    // Thông tin khách hàng - Cột phải
    document.getElementById('customer-info-right').innerHTML = [
        createStatItem('fas fa-map-marker-alt', 'text-red-400', 'Địa chỉ', survey.address || 'Chưa cung cấp'),
        createStatItem('fas fa-building', 'text-orange-400', 'Loại khách hàng', survey.customerType || 'Chưa xác định'),
        createStatItem('fas fa-globe', 'text-cyan-400', 'Khu vực', survey.region || 'Chưa xác định'),
        createStatItem('fas fa-briefcase', 'text-indigo-400', 'Công ty', survey.company || 'Chưa cung cấp'),
        createStatItem('fas fa-user-tie', 'text-gray-400', 'Chức vụ', survey.position || 'Chưa cung cấp')
    ].join('');

    // Thông số tiêu thụ - Cột trái
    document.getElementById('consumption-details').innerHTML = [
        createStatItem('fas fa-calendar-alt', 'text-blue-400', 'Tiêu thụ điện/tháng', `${mainScenario.results?.monthlyKwh || mainScenario.inputs.monthlyKwh || 'N/A'} kWh`),
        createStatItem('fas fa-money-bill-wave', 'text-green-400', 'Hóa đơn điện/tháng', formatCurrency(mainScenario.results?.originalBill || mainScenario.inputs.monthlyBill || 0)),
        createStatItem('fas fa-calendar', 'text-purple-400', 'Tiêu thụ điện/năm', `${((mainScenario.results?.monthlyKwh || mainScenario.inputs.monthlyKwh || 0) * 12).toFixed(0)} kWh`)
    ].join('');

    // Thông số tiêu thụ - Cột phải
    document.getElementById('system-specs').innerHTML = [
        createStatItem('fas fa-sun', 'text-yellow-400', 'Tỷ lệ sử dụng ban ngày', `${mainScenario.inputs.dayUsageRatio || 'N/A'}%`),
        createStatItem('fas fa-moon', 'text-indigo-400', 'Sử dụng ban đêm', `${(100 - (mainScenario.inputs.dayUsageRatio || 0))}%`),
        createStatItem('fas fa-chart-line', 'text-cyan-400', 'Hóa đơn điện/năm', formatCurrency((mainScenario.results?.originalBill || mainScenario.inputs.monthlyBill || 0) * 12))
    ].join('');
    
    // Hệ thống đề xuất
    const systemDetailsItems = [
        createStatItem('fas fa-bolt', 'text-yellow-400', 'Công suất hệ thống', `${mainScenario.results?.recommendedKwp?.toFixed(2) || 'N/A'} kWp`),
        createStatItem('fas fa-th', 'text-blue-400', 'Số tấm pin', `${mainScenario.results?.numberOfPanels || 'N/A'} tấm (${mainScenario.inputs.panelWattage || 'N/A'} Wp)`),
        createStatItem('fas fa-home', 'text-purple-400', 'Diện tích mái cần', `${mainScenario.results?.requiredArea?.toFixed(2) || 'N/A'} m²`)
    ];
    
    // Add battery storage for hybrid systems
    if (mainScenario.inputs.systemType === 'Hybrid' && mainScenario.results?.storageKwh) {
        systemDetailsItems.push(
            createStatItem('fas fa-battery-three-quarters', 'text-green-400', 'Pin lưu trữ đề xuất', `${mainScenario.results.storageKwh.toFixed(2)} kWh`)
        );
    }
    
    document.getElementById('system-details').innerHTML = systemDetailsItems.join('');
    
    // Phân tích tài chính với styling đặc biệt
    const financialItems = [
        {
            label: 'Tổng chi phí đầu tư',
            value: formatCurrency(mainScenario.results?.totalInvestment || 0),
            bgClass: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
            borderClass: 'border-red-500/30',
            textClass: 'text-red-200 drop-shadow-sm'
        },
        {
            label: 'Tiết kiệm/tháng',
            value: formatCurrency(mainScenario.results?.monthlySavings || 0),
            bgClass: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
            borderClass: 'border-green-500/30',
            textClass: 'text-green-200 drop-shadow-sm'
        },
        {
            label: 'Thời gian hoàn vốn',
            value: `${mainScenario.results?.paybackPeriodYears?.toFixed(1) || 'N/A'} năm`,
            bgClass: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
            borderClass: 'border-blue-500/30',
            textClass: 'text-blue-200 drop-shadow-sm'
        },
        {
            label: 'ROI (Năm đầu)',
            value: `${mainScenario.results?.roiFirstYear?.toFixed(1) || 'N/A'}%`,
            bgClass: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
            borderClass: 'border-purple-500/30',
            textClass: 'text-purple-200 drop-shadow-sm'
        }
    ];

    document.getElementById('financial-details').innerHTML = financialItems.map(item => `
        <div class="stat-item ${item.bgClass} rounded-xl border ${item.borderClass}">
            <span class="stat-label">
                <i class="fas fa-money-bill-wave mr-2 text-green-400"></i>
                ${item.label}:
            </span>
            <span class="stat-value ${item.textClass}">${item.value}</span>
        </div>
    `).join('');

    // Tác động môi trường
    document.getElementById('env-details').innerHTML = [
        createStatItem('fas fa-cloud', 'text-green-400', 'Giảm thải CO₂', `${mainScenario.results?.co2ReductionYearly?.toFixed(2) || 'N/A'} tấn/năm`),
        createStatItem('fas fa-tree', 'text-emerald-400', 'Tương đương trồng', `${Math.round(mainScenario.results?.treeEquivalent || 0)} cây xanh`)
    ].join('');
}


/**
 * Vẽ biểu đồ so sánh chi phí điện hiện đại với gradient và animation
 * @param {number} originalBill - Tiền điện ban đầu
 * @param {number} newBill - Tiền điện sau khi lắp
 */
function createBillChart(originalBill, newBill) {
    const ctx = document.getElementById('billChart')?.getContext('2d');
    if (!ctx) return;
    if (billChartInstance) billChartInstance.destroy();

    // Đảm bảo dữ liệu hợp lệ
    const validOriginalBill = Math.max(0, originalBill || 0);
    const validNewBill = Math.max(0, newBill || 0);
    
    console.log('Creating bill chart with:', { validOriginalBill, validNewBill });

    // Tạo gradient cho các cột
    const redGradient = ctx.createLinearGradient(0, 0, 0, 400);
    redGradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
    redGradient.addColorStop(0.5, 'rgba(220, 38, 127, 0.6)');
    redGradient.addColorStop(1, 'rgba(157, 23, 77, 0.4)');

    const greenGradient = ctx.createLinearGradient(0, 0, 0, 400);
    greenGradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
    greenGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.6)');
    greenGradient.addColorStop(1, 'rgba(5, 150, 105, 0.4)');

    const savings = validOriginalBill - validNewBill;
    const savingsPercent = validOriginalBill > 0 ? ((savings / validOriginalBill) * 100).toFixed(1) : 0;

    billChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['🔴 Trước khi lắp', '🟢 Sau khi lắp'],
            datasets: [{
                label: 'Chi phí điện hàng tháng',
                data: [validOriginalBill, validNewBill],
                backgroundColor: [redGradient, greenGradient],
                borderColor: ['rgba(239, 68, 68, 1)', 'rgba(34, 197, 94, 1)'],
                borderWidth: 2,
                borderRadius: 12,
                borderSkipped: false,
                barThickness: 80,
                maxBarThickness: 100
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: { 
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#374151',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return context[0].label.replace(/🔴|🟢/g, '').trim();
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            const formatted = value.toLocaleString('vi-VN') + ' VNĐ';
                            if (context.dataIndex === 1) {
                                return [
                                    `Chi phí: ${formatted}`,
                                    `💰 Tiết kiệm: ${savings.toLocaleString('vi-VN')} VNĐ`,
                                    `📊 Giảm: ${savingsPercent}%`
                                ];
                            }
                            return `Chi phí: ${formatted}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#374151',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(156, 163, 175, 0.2)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'tr';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(0) + 'k';
                            }
                            return value.toLocaleString('vi-VN');
                        }
                    }
                }
            }
        }
    });
}

/**
 * Vẽ biểu đồ phân tích dòng tiền và hoàn vốn hiện đại với gradient và animation
 * @param {number} totalInvestment - Tổng chi phí đầu tư
 * @param {number} annualSavings - Tiền tiết kiệm hàng năm
 */
function createPaybackChart(totalInvestment, annualSavings) {
    const ctx = document.getElementById('paybackChart')?.getContext('2d');
    if (!ctx) return;
    if (paybackChartInstance) paybackChartInstance.destroy();

    if (totalInvestment <= 0 || annualSavings <= 0) {
        return;
    }
    
    // Tính toán dữ liệu thông minh hơn
    const paybackYears = Math.ceil(totalInvestment / annualSavings);
    const maxYears = Math.max(15, paybackYears + 5);
    const years = Array.from({length: maxYears + 1}, (_, i) => i);
    const yearLabels = years.map(i => i === 0 ? 'Bắt đầu' : `Năm ${i}`);
    const cashFlow = years.map(i => (annualSavings * i) - totalInvestment);
    
    // Tạo gradient cho vùng âm và dương
    const negativeGradient = ctx.createLinearGradient(0, 0, 0, 400);
    negativeGradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    negativeGradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
    
    const positiveGradient = ctx.createLinearGradient(0, 0, 0, 400);
    positiveGradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
    positiveGradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');

    // Tạo gradient cho đường line
    const lineGradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    lineGradient.addColorStop(0, 'rgba(239, 68, 68, 1)');
    lineGradient.addColorStop(0.5, 'rgba(168, 85, 247, 1)');
    lineGradient.addColorStop(1, 'rgba(34, 197, 94, 1)');

    // Tìm điểm hòa vốn
    const breakEvenIndex = cashFlow.findIndex(value => value >= 0);
    const breakEvenYear = breakEvenIndex > 0 ? breakEvenIndex : paybackYears;

    paybackChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: yearLabels,
            datasets: [
                {
                    label: '💰 Dòng tiền tích lũy',
                    data: cashFlow,
                    borderColor: lineGradient,
                    backgroundColor: positiveGradient,
                    fill: {
                        target: 'origin',
                        above: positiveGradient,
                        below: negativeGradient
                    },
                    borderWidth: 4,
                    tension: 0.4,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2500,
                easing: 'easeInOutCubic',
                delay: 0
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: { 
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#374151',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            const year = context[0].dataIndex;
                            if (year === 0) return 'Thời điểm bắt đầu';
                            if (year === breakEvenYear) return `🎯 Năm ${year} - Điểm hòa vốn`;
                            return `Năm ${year}`;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            const year = context.dataIndex;
                            const formatted = (value / 1000000).toFixed(1);
                            const status = value < 0 ? '📉 Chưa hoàn vốn' : '📈 Đã có lãi';
                            
                            if (year === breakEvenYear) {
                                return [
                                    `${status}: ${formatted} triệu VNĐ`,
                                    `🎉 Đây là điểm hòa vốn!`,
                                    `⏰ Hoàn vốn sau ${breakEvenYear} năm`
                                ];
                            }
                            
                            const result = [`${status}: ${formatted} triệu VNĐ`];
                            if (year > 0) {
                                const totalSavings = annualSavings * year;
                                const roi = ((totalSavings - totalInvestment) / totalInvestment * 100).toFixed(1);
                                result.push(`💵 Tổng tiết kiệm: ${(totalSavings / 1000000).toFixed(1)} triệu`);
                                result.push(`📊 ROI: ${roi}%`);
                            }
                            return result;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(156, 163, 175, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 11
                        },
                        maxTicksLimit: 10,
                        callback: function(value, index) {
                            if (index === 0) return 'Bắt đầu';
                            return index % 2 === 0 ? `Năm ${index}` : '';
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(156, 163, 175, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            const millions = value / 1000000;
                            if (millions === 0) return '0 (Hòa vốn)';
                            return millions > 0 ? `+${millions.toFixed(0)}tr` : `${millions.toFixed(0)}tr`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Xử lý xuất báo cáo ra file PDF
 * @param {string} customerName - Tên khách hàng để đặt tên file
 */
function exportPDF(customerName) {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;

    const safeCustomerName = customerName.replace(/\s/g, '_');
    
    // Tạm thời ẩn nút Tải PDF để không xuất hiện trong file
    const pdfButton = document.getElementById('export-pdf-btn');
    pdfButton.style.display = 'none';

    html2canvas(reportElement, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Bao_cao_${safeCustomerName}.pdf`);

        // Hiện lại nút Tải PDF sau khi đã tạo xong file
        pdfButton.style.display = 'flex';
    });
}