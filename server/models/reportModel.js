const mongoose = require('mongoose');
const shortid = require('shortid');

const scenarioSchema = new mongoose.Schema({
    scenarioName: { type: String, default: 'Kịch bản phân tích cơ bản' },
    inputs: {
        monthlyKwh: Number,
        monthlyBill: Number,
        investmentCostPerKwp: Number,
        panelWattage: Number,
        systemType: String,
        storageInvestmentCost: Number,
        dayUsageRatio: Number
    },
    results: {
        monthlyKwh: Number, // Thêm trường này để lưu lại kWh đã tính
        recommendedKwp: Number,
        numberOfPanels: Number,
        requiredArea: Number,
        storageKwh: Number,
        totalInvestment: Number,
        monthlySavings: Number,
        newBill: Number,
        paybackPeriodYears: Number,
        roiFirstYear: Number,
        co2ReductionYearly: Number,
        treeEquivalent: Number,
        originalBill: Number,
        annualSavings: Number
    }
}, {_id: false});

const reportSchema = new mongoose.Schema({
    shareId: {
        type: String,
        default: shortid.generate,
        unique: true,
        index: true
    },
    survey: {
        name: { type: String, required: [true, 'Tên khách hàng là bắt buộc'] },
        address: String,
        customerType: String,
        region: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    scenarios: [scenarioSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);