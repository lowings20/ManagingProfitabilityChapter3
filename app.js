// Gelat-oat Financial Model
// Chapter 3: Income Statement & Scenario Tool

const PRICE = 4.00;

const productionOptions = {
  coPacker: {
    name: "Co-Packer",
    vc: 2.80,
    plantOps: 0
  },
  retrofit: {
    name: "Retrofit",
    vc: 1.80,
    plantOps: 438000
  },
  newPlant: {
    name: "New Plant",
    vc: 0.80,
    plantOps: 824000
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
  hireSalesperson: { volumeMultiplier: 1.15, costCategory: "sm", costAmount: 80000 },
  brandBuilding: { volumeMultiplier: 1.10, costCategory: "brandRD", costAmount: 100000 },
  samplingProgram: { volumeMultiplier: 1.08, costCategory: "sm", costAmount: 50000 },
  secondFlavor: { volumeMultiplier: 1.20, costCategory: "brandRD", costAmount: 60000 }
};

const defensiveLevers = {
  cutSeniorSales: { volumeMultiplier: 0.94, costCategory: "sm", costSavings: 80000 },
  reduceBrandMktg: { volumeMultiplier: 1.00, costCategory: "brandRD", costSavings: 80000 },
  pauseRD: { volumeMultiplier: 1.00, costCategory: "brandRD", costSavings: 60000 },
  cutJuniorSales: { volumeMultiplier: 0.97, costCategory: "sm", costSavings: 60000 }
};

// State
let selectedMethod = 'coPacker';
let selectedDemand = 'medium';
let activeLevers = new Set();
let viewMode = 'basic';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('view-basic');
  updateAll();
});

// Select view mode
function selectViewMode(mode) {
  viewMode = mode;

  // Update button states
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === mode) {
      btn.classList.add('active');
    }
  });

  // Update body class for CSS visibility
  document.body.classList.remove('view-basic', 'view-growth', 'view-defensive');
  document.body.classList.add('view-' + mode);

  // Clear levers that are now hidden
  if (mode === 'basic') {
    activeLevers.clear();
    document.querySelectorAll('.lever-toggle').forEach(btn => btn.classList.remove('active'));
  } else if (mode === 'growth') {
    // Remove defensive levers
    Object.keys(defensiveLevers).forEach(lever => {
      activeLevers.delete(lever);
      const btn = document.querySelector(`[data-lever="${lever}"]`);
      if (btn) btn.classList.remove('active');
    });
  } else if (mode === 'defensive') {
    // Remove growth levers
    Object.keys(growthLevers).forEach(lever => {
      activeLevers.delete(lever);
      const btn = document.querySelector(`[data-lever="${lever}"]`);
      if (btn) btn.classList.remove('active');
    });
  }

  updateAll();
}

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

// Toggle a lever on/off
function toggleLever(lever) {
  if (activeLevers.has(lever)) {
    activeLevers.delete(lever);
  } else {
    activeLevers.add(lever);
  }

  // Update button state
  const btn = document.querySelector(`[data-lever="${lever}"]`);
  if (btn) {
    btn.classList.toggle('active', activeLevers.has(lever));
  }

  updateAll();
}

// Reset all levers
function resetAll() {
  activeLevers.clear();
  document.querySelectorAll('.lever-toggle').forEach(btn => {
    btn.classList.remove('active');
  });
  updateAll();
}

// Core calculation
function calculate() {
  const option = productionOptions[selectedMethod];
  let baseVolume = demandScenarios[selectedDemand];

  // Calculate adjusted volume
  let volume = baseVolume;
  activeLevers.forEach(lever => {
    if (growthLevers[lever]) {
      volume *= growthLevers[lever].volumeMultiplier;
    }
    if (defensiveLevers[lever]) {
      volume *= defensiveLevers[lever].volumeMultiplier;
    }
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

  activeLevers.forEach(lever => {
    if (growthLevers[lever]) {
      const l = growthLevers[lever];
      if (l.costCategory === "sm") sm += l.costAmount;
      if (l.costCategory === "brandRD") brandRD += l.costAmount;
    }
    if (defensiveLevers[lever]) {
      const l = defensiveLevers[lever];
      if (l.costCategory === "sm") sm -= l.costSavings;
      if (l.costCategory === "brandRD") brandRD -= l.costSavings;
    }
  });

  sm = Math.max(0, sm);
  brandRD = Math.max(0, brandRD);

  const plantOps = option.plantOps;
  const totalOpex = sm + brandRD + plantOps;

  // Operating income
  const operatingIncome = grossProfit - totalOpex;
  const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;

  // Calculate deltas for SM and Brand/RD
  const smDelta = sm - baseSM;
  const brandRDDelta = brandRD - baseBrandRD;

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
    smDelta,
    brandRDDelta
  };
}

// Format currency for statement
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

// Format currency for deltas
function formatCurrency(value) {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return (value < 0 ? '-' : '+') + '$' + (absValue / 1000000).toFixed(2) + 'M';
  } else if (absValue >= 1000) {
    return (value < 0 ? '-' : '+') + '$' + (absValue / 1000).toFixed(0) + 'K';
  }
  return (value < 0 ? '-' : '+') + '$' + absValue.toFixed(0);
}

// Update all displays
function updateAll() {
  const result = calculate();

  // Volume display
  document.getElementById('volume-display').textContent = formatNumber(result.volume) + ' pints';

  // Income statement
  document.getElementById('revenue').textContent = formatStatementValue(result.revenue);
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
    smDeltaEl.textContent = formatCurrency(result.smDelta);
    smDeltaEl.className = 'row-delta ' + (result.smDelta > 0 ? 'negative' : 'positive');
  } else {
    smDeltaEl.textContent = '';
    smDeltaEl.className = 'row-delta';
  }

  if (result.brandRDDelta !== 0) {
    brandRDDeltaEl.textContent = formatCurrency(result.brandRDDelta);
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
}
