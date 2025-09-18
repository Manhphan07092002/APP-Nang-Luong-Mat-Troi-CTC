// File: client/js/modules/calculation.js
// Logic tính toán được chuyển đổi hoàn toàn từ script.js gốc

// --- KHAI BÁO HẰNG SỐ ---
const VAT_RATE = 1.08; // Thuế VAT 8%
const GIA_DIEN_SINH_HOAT = {
    bac_1: { min: 0, max: 50, gia: 1984 },
    bac_2: { min: 51, max: 100, gia: 2050 },
    bac_3: { min: 101, max: 200, gia: 2380 },
    bac_4: { min: 201, max: 300, gia: 2998 },
    bac_5: { min: 301, max: 400, gia: 3350 },
    bac_6: { min: 401, max: Infinity, gia: 3460 }
};
const GIA_DIEN_KINH_DOANH_AVG = 3878;
const GIA_DIEN_SAN_XUAT_AVG = 2457;
const GIA_DIEN_HANH_CHINH_AVG = 2238;
const SO_GIO_NANG = {
    "Miền Trung/Nam": 4.0,
    "Miền Bắc": 2.9
};
const DIEN_TICH_TREN_KWP = 5.45;
const SO_NGAY_TRONG_THANG = 30;
const PERFORMANCE_RATIO = 0.90;
const CO2_REDUCTION_FACTOR = 0.709;
const TREE_EQUIVALENT_FACTOR = 0.012;

// --- CÁC HÀM TIỆN ÍCH (EXPORTED) ---
export function formatNumberInput(value) {
    if (!value) return '';
    const numberString = value.toString().replace(/\D/g, '');
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function unformatNumber(value) {
    return parseFloat(String(value).replace(/\./g, '')) || 0;
}

// --- CÁC HÀM TÍNH TOÁN (INTERNAL) ---

function tinh_kwh_tu_tien_dien_sinh_hoat(tong_tien_sau_thue) {
    const tong_tien_truoc_thue = tong_tien_sau_thue / VAT_RATE;
    let tong_kwh = 0, tien_con_lai = tong_tien_truoc_thue;
    for (const key of Object.keys(GIA_DIEN_SINH_HOAT)) {
        const bac = GIA_DIEN_SINH_HOAT[key];
        if (tien_con_lai <= 0) break;
        if (bac.max === Infinity) { tong_kwh += tien_con_lai / bac.gia; break; }
        const so_kwh_trong_bac = bac.max - (bac.min > 0 ? bac.min - 1 : 0);
        const tien_toi_da_bac = so_kwh_trong_bac * bac.gia;
        if (tien_con_lai > tien_toi_da_bac) {
            tong_kwh += so_kwh_trong_bac;
            tien_con_lai -= tien_toi_da_bac;
        } else {
            tong_kwh += tien_con_lai / bac.gia;
            tien_con_lai = 0;
        }
    }
    return Math.round(tong_kwh);
}

function tinh_tien_dien_sinh_hoat(so_kwh) {
    let tong_tien_truoc_thue = 0, kwh_con_lai = so_kwh;
    for (const bac of Object.values(GIA_DIEN_SINH_HOAT)) {
        if (kwh_con_lai <= 0) break;
        const so_kwh_trong_bac = bac.max - (bac.min > 0 ? bac.min - 1 : 0);
        const kwh_can_tinh = Math.min(kwh_con_lai, so_kwh_trong_bac);
        tong_tien_truoc_thue += kwh_can_tinh * bac.gia;
        kwh_con_lai -= kwh_can_tinh;
    }
    return tong_tien_truoc_thue * VAT_RATE;
}

// --- HÀM TÍNH TOÁN CHÍNH (EXPORTED) ---
export function calculateSolarResults(inputs, survey) {
    const { 
        monthlyKwh: monthly_kwh_input, 
        monthlyBill: monthly_bill_input,
        investmentCostPerKwp: investment_cost_per_kwp, 
        panelWattage: panel_wattage, 
        systemType: system_type, 
        storageInvestmentCost: storage_investment_cost_per_kwh, 
        dayUsageRatio: day_usage_ratio_val 
    } = inputs;
    
    const { customerType, region } = survey;
    const day_usage_ratio = day_usage_ratio_val / 100.0;
    
    let monthly_kwh = 0;
    let average_price_pre_tax = 0;

    switch (customerType) {
        case "Kinh doanh": average_price_pre_tax = GIA_DIEN_KINH_DOANH_AVG; break;
        case "Sản xuất": average_price_pre_tax = GIA_DIEN_SAN_XUAT_AVG; break;
        case "Hành chính sự nghiệp": average_price_pre_tax = GIA_DIEN_HANH_CHINH_AVG; break;
    }

    if (monthly_kwh_input > 0) {
        monthly_kwh = monthly_kwh_input;
    } else {
        if (customerType === 'Hộ gia đình') {
            monthly_kwh = tinh_kwh_tu_tien_dien_sinh_hoat(monthly_bill_input);
        } else {
            monthly_kwh = Math.round(monthly_bill_input / (average_price_pre_tax * VAT_RATE));
        }
    }

    let original_bill = 0;
    if (customerType === 'Hộ gia đình') {
        original_bill = tinh_tien_dien_sinh_hoat(monthly_kwh);
        // Always calculate average_price_pre_tax for household customers based on progressive tariff
        if (monthly_kwh > 0) {
            average_price_pre_tax = (original_bill / VAT_RATE) / monthly_kwh;
        }
    } else {
        original_bill = monthly_kwh * average_price_pre_tax * VAT_RATE;
    }
    
    const sun_hours = SO_GIO_NANG[region] || 4.0;
    let required_kwp = 0;
    if (system_type === 'Hybrid') {
        required_kwp = (monthly_kwh / SO_NGAY_TRONG_THANG) / sun_hours;
    } else {
        required_kwp = (monthly_kwh / SO_NGAY_TRONG_THANG) * day_usage_ratio / sun_hours;
    }
    
    const recommended_kwp = Math.round(required_kwp * 100) / 100;
    
    const solar_generation_monthly = recommended_kwp * sun_hours * SO_NGAY_TRONG_THANG;
    const effective_saved_kwh = solar_generation_monthly * day_usage_ratio * PERFORMANCE_RATIO;
    
    const savings = effective_saved_kwh * average_price_pre_tax * VAT_RATE;
    const new_bill = Math.max(0, original_bill - savings);
    const annual_savings = savings * 12;

    const storage_kwh = system_type === "Hybrid" ? recommended_kwp / 2 : 0;
    const panel_investment = recommended_kwp * investment_cost_per_kwp;
    const storage_investment = system_type === "Hybrid" ? storage_kwh * storage_investment_cost_per_kwh : 0;
    const total_investment = panel_investment + storage_investment;
    
    const payback_period_years = total_investment > 0 && annual_savings > 0 ? total_investment / annual_savings : 0;
    const roi_first_year = total_investment > 0 ? (annual_savings / total_investment) * 100 : 0;
    const number_of_panels = panel_wattage > 0 ? Math.ceil((recommended_kwp * 1000) / panel_wattage) : 0;
    const required_area = recommended_kwp * DIEN_TICH_TREN_KWP;
    const co2_reduction_yearly = (solar_generation_monthly * 12 * CO2_REDUCTION_FACTOR) / 1000;
    const tree_equivalent = solar_generation_monthly * TREE_EQUIVALENT_FACTOR * 12;

    // Trả về một object chứa tất cả kết quả
    return {
        monthlyKwh: monthly_kwh,
        recommendedKwp: recommended_kwp,
        numberOfPanels: number_of_panels,
        requiredArea: required_area,
        storageKwh: storage_kwh,
        totalInvestment: total_investment,
        monthlySavings: savings,
        newBill: new_bill,
        paybackPeriodYears: payback_period_years,
        roiFirstYear: roi_first_year,
        co2ReductionYearly: co2_reduction_yearly,
        treeEquivalent: tree_equivalent,
        originalBill: original_bill,
        annualSavings: annual_savings
    };
}