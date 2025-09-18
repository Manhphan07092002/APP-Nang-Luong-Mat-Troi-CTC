import { calculateSolarResults, unformatNumber, formatNumberInput } from './modules/calculation.js';
import { renderReport } from './modules/reportRenderer.js';

// --- BƯỚC 1: BẢO VỆ TRANG - KIỂM TRA ĐĂNG NHẬP ---
let userInfo = null;
try {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr);
    }
} catch (error) {
    console.error('Error parsing userInfo:', error);
    localStorage.removeItem('userInfo');
}

if (!userInfo || !userInfo.token) {
    alert('Vui lòng đăng nhập để sử dụng chức năng này.');
    window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // Dừng thực thi nếu không có thông tin đăng nhập
    if (!userInfo) return;

    // --- BƯỚC 2: LẤY TẤT CẢ CÁC PHẦN TỬ GIAO DIỆN (DOM) ---
    const analysisForm = document.getElementById('analysis-form');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultContainer = document.getElementById('result-container');
    const formContainer = document.getElementById('analysis-form-container');
    const systemTypeSelect = document.getElementById('system-type');
    const hybridCostSection = document.getElementById('hybrid-cost-section');
    const dayUsageRatioSlider = document.getElementById('day-usage-ratio');
    const dayUsageValue = document.getElementById('day-usage-value');
    const formErrorMessage = document.getElementById('form-error-message');
    const tabVnd = document.getElementById('tab-vnd');
    const tabKwh = document.getElementById('tab-kwh');
    const panelVnd = document.getElementById('panel-vnd');
    const panelKwh = document.getElementById('panel-kwh');

    // --- BƯỚC 3: CÁC HÀM XỬ LÝ SỰ KIỆN VÀ GIAO DIỆN ---

    /**
     * Hàm khởi tạo ban đầu, gắn các sự kiện cho form
     */
    function initializePage() {
        // Format các ô nhập số khi người dùng gõ và khi tải trang
        ['investment-cost', 'panel-wattage', 'storage-investment-cost', 'monthly-bill', 'monthly-kwh'].forEach(id => {
            const inputEl = document.getElementById(id);
            if(inputEl) {
                inputEl.addEventListener('input', (e) => e.target.value = formatNumberInput(e.target.value));
                inputEl.value = formatNumberInput(inputEl.value);
            } else {
                console.warn(`Input element not found: ${id}`);
            }
        });

        // Tạo 12 ô nhập tiền điện chi tiết
        createMonthlyBillInputs();

        // Gắn các sự kiện tương tác
        if (systemTypeSelect) systemTypeSelect.addEventListener('change', toggleHybridCost);
        if (dayUsageRatioSlider) dayUsageRatioSlider.addEventListener('input', (e) => {
            if (dayUsageValue) dayUsageValue.textContent = `${e.target.value}%`;
        });
        if (tabVnd) tabVnd.addEventListener('click', switchTab);
        if (tabKwh) tabKwh.addEventListener('click', switchTab);
        if (analysisForm) analysisForm.addEventListener('submit', handleFormSubmit);
        
        const monthlyBillEl = document.getElementById('monthly-bill');
        if (monthlyBillEl) monthlyBillEl.addEventListener('input', clearDetailInputs);

        // Kích hoạt trạng thái ban đầu
        toggleHybridCost();
    }

    /**
     * Xử lý việc chuyển đổi giữa tab nhập Tiền điện và kWh
     */
    function switchTab(e) {
        e.preventDefault();
        const isVndTab = e.target.id === 'tab-vnd';
        tabVnd.classList.toggle('active', isVndTab);
        tabKwh.classList.toggle('active', !isVndTab);
        panelVnd.classList.toggle('active', isVndTab);
        panelKwh.classList.toggle('active', !isVndTab);
    }
    
    /**
     * Hàm chính xử lý khi người dùng nhấn nút "Tính Toán & Lưu Báo Cáo"
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        formErrorMessage.textContent = '';

        // Lấy dữ liệu từ các trường trong form
        const surveyData = {
            name: document.getElementById('survey-name').value.trim(),
            address: document.getElementById('survey-address').value,
            customerType: document.getElementById('survey-customer-type').value,
            region: document.getElementById('survey-region').value,
            // Lấy thêm thông tin chi tiết từ userInfo
            phone: userInfo.user?.phone || userInfo.phone,
            email: userInfo.user?.email || userInfo.email,
            company: userInfo.user?.company || userInfo.company,
            position: userInfo.user?.position || userInfo.position,
            gender: userInfo.user?.gender || userInfo.gender,
            dateOfBirth: userInfo.user?.dateOfBirth || userInfo.dateOfBirth
        };

        if (!surveyData.name) {
            formErrorMessage.textContent = 'Tên khách hàng là bắt buộc.'; return;
        }

        const inputsData = {
            monthlyBill: unformatNumber(document.getElementById('monthly-bill').value),
            monthlyKwh: unformatNumber(document.getElementById('monthly-kwh').value),
            investmentCostPerKwp: unformatNumber(document.getElementById('investment-cost').value),
            panelWattage: unformatNumber(document.getElementById('panel-wattage').value),
            systemType: systemTypeSelect.value,
            storageInvestmentCost: unformatNumber(document.getElementById('storage-investment-cost').value),
            dayUsageRatio: parseInt(dayUsageRatioSlider.value, 10),
        };

        // Xác thực dữ liệu đầu vào chính
        if (tabKwh.classList.contains('active')) {
            // Khi người dùng chọn nhập theo kWh
            inputsData.monthlyBill = 0; // Đặt tiền điện = 0 để báo hiệu sử dụng kWh
            if (inputsData.monthlyKwh <= 0) {
                formErrorMessage.textContent = 'Số kWh hàng tháng phải lớn hơn 0.'; return;
            }
        } else {
            // Khi người dùng chọn nhập theo tiền điện
            inputsData.monthlyKwh = 0; // Đặt kWh = 0 để báo hiệu sử dụng tiền điện
            if (inputsData.monthlyBill <= 0) {
                formErrorMessage.textContent = 'Tiền điện hàng tháng phải lớn hơn 0.'; return;
            }
        }

        calculateBtn.disabled = true;
        calculateBtn.textContent = 'Đang xử lý...';

        try {
            // Gọi hàm tính toán
            const resultsData = calculateSolarResults(inputsData, surveyData);
            // Cập nhật lại inputsData với kWh đã được tính toán để lưu vào CSDL
            inputsData.monthlyKwh = resultsData.monthlyKwh; 
            
            // Chuẩn bị payload để gửi lên server
            const reportPayload = {
                survey: surveyData,
                scenarios: [{
                    scenarioName: `Phân tích cho ${surveyData.name}`,
                    inputs: inputsData,
                    results: resultsData
                }]
            };

            // Gửi yêu cầu lưu báo cáo lên server
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
                body: JSON.stringify(reportPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi không xác định từ server');
            }
            
            const savedReport = await response.json();
            
            // Hiển thị kết quả lên giao diện
            renderReport(resultContainer, savedReport);
            formContainer.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            window.scrollTo(0, 0);

            // Thêm link chia sẻ vào container đã được tạo bởi hàm render
            const shareLinkContainer = document.getElementById('share-link-container');
            if(shareLinkContainer) {
                const shareableLink = `${window.location.origin}/report_detail.html?id=${savedReport.shareId}`;
                shareLinkContainer.innerHTML = `
                    <p class="font-semibold">Link chia sẻ báo cáo:</p>
                    <a href="${shareableLink}" target="_blank" class="text-blue-600 break-all hover:underline">${shareableLink}</a>
                `;
            }

        } catch (error) {
            // Hiển thị lỗi nếu có
            formErrorMessage.textContent = `Lỗi: ${error.message}`;
        } finally {
            // Kích hoạt lại nút bấm
            calculateBtn.disabled = false;
            calculateBtn.textContent = 'Tính Toán & Lưu Báo Cáo';
        }
    }

    // --- CÁC HÀM TIỆN ÍCH CHO GIAO DIỆN ---

    function toggleHybridCost() {
        console.log('toggleHybridCost called, system type:', systemTypeSelect?.value);
        console.log('hybridCostSection element:', hybridCostSection);
        
        if (!hybridCostSection || !systemTypeSelect) {
            console.error('Missing elements - hybridCostSection:', hybridCostSection, 'systemTypeSelect:', systemTypeSelect);
            return;
        }
        
        const isHybrid = systemTypeSelect.value === 'Hybrid';
        console.log('Is hybrid system:', isHybrid);
        
        if (isHybrid) {
            hybridCostSection.classList.remove('hidden');
            console.log('Showing hybrid cost section');
        } else {
            hybridCostSection.classList.add('hidden');
            console.log('Hiding hybrid cost section');
        }
    }

    function createMonthlyBillInputs() {
        const grid = document.getElementById('monthly-bills-grid');
        if (!grid) return;
        for (let i = 1; i <= 12; i++) {
            const monthDiv = document.createElement('div');
            monthDiv.innerHTML = `
                <label for="month-${i}" class="text-sm font-medium text-gray-500">Tháng ${i}</label>
                <input type="text" id="month-${i}" inputmode="numeric" class="w-full p-1 border-b monthly-bill-detail text-center focus:border-blue-500 outline-none">
            `;
            grid.appendChild(monthDiv);
        }
        document.querySelectorAll('.monthly-bill-detail').forEach(input => {
            input.addEventListener('input', () => {
                input.value = formatNumberInput(input.value);
                updateAverageBillFromDetails();
            });
        });
    }
    
    function updateAverageBillFromDetails() {
        let total = 0, count = 0;
        document.querySelectorAll('.monthly-bill-detail').forEach(input => {
            const value = unformatNumber(input.value);
            if (value > 0) { total += value; count++; }
        });
        const average = count > 0 ? Math.round(total / count) : 0;
        document.getElementById('total-12-months').textContent = `${formatNumberInput(total)} VNĐ`;
        document.getElementById('monthly-bill').value = formatNumberInput(average);
    }
    
    function clearDetailInputs() {
        document.querySelectorAll('.monthly-bill-detail').forEach(input => input.value = '');
        document.getElementById('total-12-months').textContent = '0 VNĐ';
    }

    // --- KHỞI CHẠY ---
    initializePage();
});