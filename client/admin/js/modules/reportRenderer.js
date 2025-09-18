// File này chứa các hàm để render giao diện báo cáo và biểu đồ

let billChartInstance = null;
let paybackChartInstance = null;

/**
 * Hiển thị toàn bộ trang kết quả báo cáo vào một element container
 * @param {HTMLElement} container - Element DOM để chèn kết quả vào
 * @param {object} data - Dữ liệu báo cáo đầy đủ từ server
 */
export function renderReport(container, data) {
    const { survey, scenarios, createdAt, shareId } = data;
    const mainScenario = scenarios[0];
    const formatCurrency = (value) => (value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    container.innerHTML = `
        <div id="report-content" class="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <div class="flex justify-between items-start mb-6 border-b pb-6">
                <div>
                    <h2 class="text-3xl font-bold text-gray-800">Báo Cáo Phân Tích Đầu Tư</h2>
                    <p class="text-lg font-semibold text-blue-700">Khách hàng: ${survey.name}</p>
                    <p class="text-sm text-gray-400 mt-1">Ngày tạo: ${new Date(createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <button id="export-pdf-btn" class="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span class="hidden sm:inline">Tải PDF</span>
                </button>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-1 space-y-6">
                    <div class="p-6 bg-gray-50 rounded-lg border">
                        <h3 class="text-xl font-bold mb-4">Hệ Thống Đề Xuất</h3>
                        <div id="system-details" class="space-y-4"></div>
                    </div>
                    <div class="p-6 bg-gray-50 rounded-lg border">
                        <h3 class="text-xl font-bold mb-4">Tác Động Môi Trường</h3>
                        <div id="env-details" class="space-y-4"></div>
                    </div>
                </div>
                <div class="lg:col-span-2 space-y-6">
                     <div class="p-6 bg-gray-50 rounded-lg border">
                        <h3 class="text-xl font-bold mb-4">Phân Tích Tài Chính</h3>
                        <div id="financial-details" class="space-y-4"></div>
                    </div>
                     <div class="p-6 bg-gray-50 rounded-lg border">
                        <h3 class="font-bold text-center mb-4">So Sánh Chi Phí Điện Hàng Tháng</h3>
                        <div class="h-64"><canvas id="billChart"></canvas></div>
                    </div>
                     <div class="p-6 bg-gray-50 rounded-lg border">
                        <h3 class="font-bold text-center mb-4">Phân Tích Dòng Tiền & Hoàn Vốn</h3>
                        <div class="h-80"><canvas id="paybackChart"></canvas></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- Điền dữ liệu chi tiết ---
    const createDetailRow = (label, value, valueColor = 'text-gray-900') => `
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <p class="text-sm text-gray-600">${label}</p>
            <p class="font-bold text-base ${valueColor}">${value}</p>
        </div>`;
    
    document.getElementById('system-details').innerHTML = [
        createDetailRow('Công suất hệ thống:', `${mainScenario.results.recommendedKwp.toFixed(2)} kWp`),
        createDetailRow('Số tấm pin:', `${mainScenario.results.numberOfPanels} tấm (${mainScenario.inputs.panelWattage} Wp)`),
        createDetailRow('Diện tích mái cần:', `${mainScenario.results.requiredArea.toFixed(2)} m²`),
        mainScenario.inputs.systemType === 'Hybrid' ? createDetailRow('Lưu trữ (Hybrid):', `${mainScenario.results.storageKwh.toFixed(2)} kWh`) : ''
    ].join('');
    
    document.getElementById('financial-details').innerHTML = [
         createDetailRow('Tổng chi phí đầu tư:', formatCurrency(mainScenario.results.totalInvestment)),
         createDetailRow('Tiết kiệm/tháng:', formatCurrency(mainScenario.results.monthlySavings), 'text-green-600'),
         createDetailRow('Thời gian hoàn vốn:', `${mainScenario.results.paybackPeriodYears.toFixed(1)} năm`),
         createDetailRow('ROI (Năm đầu):', `${mainScenario.results.roiFirstYear.toFixed(1)}%`)
    ].join('');

    document.getElementById('env-details').innerHTML = [
        createDetailRow('Giảm thải CO₂:', `${mainScenario.results.co2ReductionYearly.toFixed(2)} tấn/năm`),
        createDetailRow('Tương đương trồng:', `${Math.round(mainScenario.results.treeEquivalent)} cây xanh`)
    ].join('');

    // --- Vẽ biểu đồ ---
    createBillChart(mainScenario.results.originalBill, mainScenario.results.newBill);
    createPaybackChart(mainScenario.results.totalInvestment, mainScenario.results.annualSavings);

    // --- Gắn sự kiện xuất PDF ---
    document.getElementById('export-pdf-btn').onclick = () => {
         const reportElement = document.getElementById('report-content');
         const customerName = survey.name.replace(/\s/g, '_');
         html2canvas(reportElement, { scale: 2 }).then(canvas => {
             const imgData = canvas.toDataURL('image/png');
             const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
             const pdfWidth = pdf.internal.pageSize.getWidth();
             const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
             pdf.save(`Bao_cao_${customerName}.pdf`);
         });
    };
}

function createBillChart(originalBill, newBill) {
    const ctx = document.getElementById('billChart')?.getContext('2d');
    if (!ctx) return;
    if (billChartInstance) billChartInstance.destroy();
    billChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Trước khi lắp', 'Sau khi lắp'],
            datasets: [{
                label: 'Chi phí (VNĐ)',
                data: [originalBill, newBill],
                backgroundColor: ['rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)'],
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function createPaybackChart(totalInvestment, annualSavings) {
    const ctx = document.getElementById('paybackChart')?.getContext('2d');
    if (!ctx) return;
    if (paybackChartInstance) paybackChartInstance.destroy();
    if (totalInvestment <= 0 || annualSavings <= 0) return;
    
    const years = Array.from({length: 16}, (_, i) => `Năm ${i}`);
    const cashFlow = years.map((y, i) => (annualSavings * i) - totalInvestment);
    
    paybackChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: years, datasets: [{
            label: 'Dòng tiền tích lũy (VNĐ)',
            data: cashFlow,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.1
        }]},
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                annotation: {
                    annotations: {
                        zeroLine: {
                            type: 'line', yMin: 0, yMax: 0,
                            borderColor: 'rgb(239, 68, 68)',
                            borderWidth: 2, borderDash: [6, 6],
                            label: {
                                content: 'Điểm hòa vốn',
                                position: 'start', enabled: true,
                                backgroundColor: 'rgba(239, 68, 68, 0.8)'
                            }
                        }
                    }
                }
            }
        }
    });
}