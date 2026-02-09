// Gelat-oat Financial Model
// Chapter 3: Income Statement & Scenario Tool

const PRICE = 4.00;

const productionOptions = {
  coPacker: {
    name: "Co-Packer",
    vc: 2.80,
    plantOps: 0,
    color: "#3B82F6"
  },
  retrofit: {
    name: "Retrofit",
    vc: 1.80,
    plantOps: 438000,
    color: "#F59E0B"
  },
  newPlant: {
    name: "New Plant",
    vc: 0.80,
    plantOps: 824000,
    color: "#10B981"
  }
};

const baseSM = 280000;
const baseBrandRD = 170000;

const demandScenarios = {
  low: 350000,
  medium: 500000,
  high: 650000
};

const growthLevers = {
  hireSalesperson: {
    volumeMultiplier: 1.15,
    costCategory: "sm",
    costAmount: 80000
  },
  brandBuilding: {
    volumeMultiplier: 1.10,
    costCategory: "brandRD",
    costAmount: 100000
  },
  samplingProgram: {
    volumeMultiplier: 1.08,
    costCategory: "sm",
    costAmount: 50000
  },
  secondFlavor: {
    volumeMultiplier: 1.20,
    costCategory: "brandRD",
    costAmount: 60000
  }
};

const defensiveLevers = {
  cutSeniorSales: {
    volumeMultiplier: 0.94,
    costCategory: "sm",
    costSavings: 80000
  },
  reduceBrandMktg: {
    volumeMultiplier: 1.00,
    costCategory: "brandRD",
    costSavings: 80000
  },
  pauseRD: {
    volumeMultiplier: 1.00,
    costCategory: "brandRD",
    costSavings: 60000
  },
  cutJuniorSales: {
    volumeMultiplier: 0.97,
    costCategory: "sm",
    costSavings: 60000
  }
};

// State
let selectedMethod = 'coPacker';
let selectedDemand = 'medium';
let activeGrowthLevers = [];
let activeDefensiveLevers = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateAll();
});

// Select production method
function selectMethod(method) {
  selectedMethod = method;

  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.method === method) {
      btn.classList.add('active');
    }
  });

  updateAll();
}

// Select demand scenario
function selectDemand(demand) {
  selectedDemand = demand;

  document.querySelectorAll('.demand-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.demand === demand) {
      btn.classList.add('active');
    }
  });

  updateAll();
}

// Update levers from checkboxes
function updateLevers() {
  activeGrowthLevers = [];
  activeDefensiveLevers = [];

  Object.keys(growthLevers).forEach(lever => {
    const checkbox = document.getElementById(`lever-${lever}`);
    if (checkbox && checkbox.checked) {
      activeGrowthLevers.push(lever);
    }
  });

  Object.keys(defensiveLevers).forEach(lever => {
    const checkbox = document.getElementById(`lever-${lever}`);
    if (checkbox && checkbox.checked) {
      activeDefensiveLevers.push(lever);
    }
  });

  updateAll();
}

// Reset all levers
function resetAll() {
  document.querySelectorAll('.lever-item input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  activeGrowthLevers = [];
  activeDefensiveLevers = [];
  updateAll();
}

// Core calculation
function calculate() {
  const option = productionOptions[selectedMethod];
  let baseVolume = demandScenarios[selectedDemand];

  // Calculate adjusted volume
  let volume = baseVolume;
  activeGrowthLevers.forEach(lever => {
    volume *= growthLevers[lever].volumeMultiplier;
  });
  activeDefensiveLevers.forEach(lever => {
    volume *= defensiveLevers[lever].volumeMultiplier;
  });
  volume = Math.round(volume);

  // Revenue & COGS
  const revenue = volume * PRICE;
  const cogs = volume * option.vc;
  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  // Fixed costs
  let sm = baseSM;
  let brandRD = baseBrandRD;

  activeGrowthLevers.forEach(lever => {
    const l = growthLevers[lever];
    if (l.costCategory === "sm") sm += l.costAmount;
    if (l.costCategory === "brandRD") brandRD += l.costAmount;
  });

  activeDefensiveLevers.forEach(lever => {
    const l = defensiveLevers[lever];
    if (l.costCategory === "sm") sm -= l.costSavings;
    if (l.costCategory === "brandRD") brandRD -= l.costSavings;
  });

  sm = Math.max(0, sm);
  brandRD = Math.max(0, brandRD);

  const plantOps = option.plantOps;
  const totalOpex = sm + brandRD + plantOps;

  // Operating income
  const operatingIncome = grossProfit - totalOpex;
  const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;

  // Breakeven
  const contributionMargin = PRICE - option.vc;
  const breakeven = Math.ceil(totalOpex / contributionMargin);

  // Margin of safety
  const marginOfSafety = volume - breakeven;
  const marginOfSafetyPct = breakeven > 0 ? (marginOfSafety / breakeven) * 100 : 0;

  // Calculate deltas for SM and Brand/RD
  const smDelta = sm - baseSM;
  const brandRDDelta = brandRD - baseBrandRD;

  // Calculate growth and defensive summaries
  let growthVolumeMultiplier = 1;
  let growthCostIncrease = 0;
  activeGrowthLevers.forEach(lever => {
    growthVolumeMultiplier *= growthLevers[lever].volumeMultiplier;
    growthCostIncrease += growthLevers[lever].costAmount;
  });
  const growthVolumePct = (growthVolumeMultiplier - 1) * 100;

  let defensiveVolumeMultiplier = 1;
  let defensiveCostSavings = 0;
  activeDefensiveLevers.forEach(lever => {
    defensiveVolumeMultiplier *= defensiveLevers[lever].volumeMultiplier;
    defensiveCostSavings += defensiveLevers[lever].costSavings;
  });
  const defensiveVolumePct = (defensiveVolumeMultiplier - 1) * 100;

  return {
    volume,
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    sm,
    brandRD,
    plantOps,
    totalOpex,
    operatingIncome,
    operatingMargin,
    breakeven,
    marginOfSafety,
    marginOfSafetyPct,
    smDelta,
    brandRDDelta,
    growthVolumePct,
    growthCostIncrease,
    defensiveVolumePct,
    defensiveCostSavings
  };
}

// Format currency
function formatCurrency(value, showParens = false) {
  const absValue = Math.abs(value);
  let formatted;

  if (absValue >= 1000000) {
    formatted = '$' + (absValue / 1000000).toFixed(2) + 'M';
  } else if (absValue >= 1000) {
    formatted = '$' + (absValue / 1000).toFixed(0) + 'K';
  } else {
    formatted = '$' + absValue.toFixed(0);
  }

  if (value < 0) {
    return showParens ? `(${formatted})` : `-${formatted}`;
  }
  return formatted;
}

// Format currency for statement (larger values)
function formatStatementValue(value) {
  const absValue = Math.abs(value);
  const formatted = '$' + absValue.toLocaleString();
  return value < 0 ? `(${formatted})` : formatted;
}

// Format number with commas
function formatNumber(value) {
  return Math.round(value).toLocaleString();
}

// Format percentage
function formatPercent(value) {
  return value.toFixed(1) + '%';
}

// Update all displays
function updateAll() {
  const result = calculate();

  // Volume display
  document.getElementById('volume-display').textContent = formatNumber(result.volume) + ' pints';

  // Income statement
  document.getElementById('revenue').textContent = formatStatementValue(result.revenue);
  document.getElementById('revenue-margin').textContent = '100.0%';

  document.getElementById('cogs').textContent = formatStatementValue(-result.cogs);

  document.getElementById('gross-profit').textContent = formatStatementValue(result.grossProfit);
  document.getElementById('gross-margin').textContent = formatPercent(result.grossMargin);

  // Operating expenses
  document.getElementById('sm-cost').textContent = formatStatementValue(-result.sm);
  document.getElementById('brand-rd-cost').textContent = formatStatementValue(-result.brandRD);
  document.getElementById('plant-ops-cost').textContent = result.plantOps === 0 ? '$0' : formatStatementValue(-result.plantOps);
  document.getElementById('total-opex').textContent = formatStatementValue(-result.totalOpex);

  // Deltas
  const smDeltaEl = document.getElementById('sm-delta');
  const brandRDDeltaEl = document.getElementById('brand-rd-delta');

  if (result.smDelta !== 0) {
    smDeltaEl.textContent = (result.smDelta > 0 ? '+' : '') + formatCurrency(result.smDelta);
    smDeltaEl.className = 'row-delta ' + (result.smDelta > 0 ? 'negative' : 'positive');
  } else {
    smDeltaEl.textContent = '';
    smDeltaEl.className = 'row-delta';
  }

  if (result.brandRDDelta !== 0) {
    brandRDDeltaEl.textContent = (result.brandRDDelta > 0 ? '+' : '') + formatCurrency(result.brandRDDelta);
    brandRDDeltaEl.className = 'row-delta ' + (result.brandRDDelta > 0 ? 'negative' : 'positive');
  } else {
    brandRDDeltaEl.textContent = '';
    brandRDDeltaEl.className = 'row-delta';
  }

  // Operating income
  const opIncomeEl = document.getElementById('operating-income');
  opIncomeEl.textContent = formatStatementValue(result.operatingIncome);

  const opIncomeRow = document.querySelector('.statement-row.operating-income');
  opIncomeRow.classList.remove('positive', 'negative');
  if (result.operatingIncome >= 0) {
    opIncomeRow.classList.add('positive');
  } else {
    opIncomeRow.classList.add('negative');
  }

  document.getElementById('operating-margin').textContent = formatPercent(result.operatingMargin);

  // Breakeven indicator
  document.getElementById('breakeven-volume').textContent = formatNumber(result.breakeven) + ' pints';
  document.getElementById('current-volume').textContent = formatNumber(result.volume) + ' pints';

  const marginSafetyEl = document.getElementById('margin-safety');
  const marginSafetyItem = document.querySelector('.breakeven-item.margin-safety');

  if (result.marginOfSafety >= 0) {
    marginSafetyEl.textContent = formatNumber(result.marginOfSafety) + ' pints (' + formatPercent(result.marginOfSafetyPct) + ')';
    marginSafetyItem.classList.remove('negative');
  } else {
    marginSafetyEl.textContent = formatNumber(Math.abs(result.marginOfSafety)) + ' pints below (' + formatPercent(Math.abs(result.marginOfSafetyPct)) + ')';
    marginSafetyItem.classList.add('negative');
  }

  // Growth lever summary
  if (result.growthVolumePct > 0) {
    document.getElementById('growth-volume-impact').textContent = '+' + formatPercent(result.growthVolumePct);
  } else {
    document.getElementById('growth-volume-impact').textContent = '+0%';
  }
  document.getElementById('growth-cost-impact').textContent = '+' + formatCurrency(result.growthCostIncrease);

  // Defensive lever summary
  document.getElementById('defensive-cost-savings').textContent = '-' + formatCurrency(result.defensiveCostSavings);
  if (result.defensiveVolumePct < 0) {
    document.getElementById('defensive-volume-impact').textContent = formatPercent(result.defensiveVolumePct);
  } else {
    document.getElementById('defensive-volume-impact').textContent = '-0%';
  }
}
