/* ================= API ================= */

const API_URL = "http://localhost:3000/api/waste";

/* ================= AUTH ================= */

function checkAuth() {
  if (!localStorage.getItem("login")) {
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("login");
  window.location.href = "index.html";
}

function login(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "1234") {
    localStorage.setItem("login", "true");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials");
  }
}

function toggleMode() {
  document.body.classList.toggle("dark-mode");
  const dark = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", dark ? "true" : "false");
}

function setTodayDate() {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.value = today;
  }
}

/* ================= LOG WASTE ================= */

async function logWaste(event) {
  event.preventDefault();

  const data = {
    date: document.getElementById("date").value,
    food: document.getElementById("food").value,
    category: document.getElementById("category").value,
    waste: parseFloat(document.getElementById("waste").value),
    reason: document.getElementById("reason").value,
    notes: document.getElementById("notes").value,
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert("Waste logged successfully!");
      document.querySelector(".waste-form").reset();
      setTodayDate();
      window.location.href = "dashboard.html";
    } else {
      alert("Failed to save waste entry");
    }
  } catch (err) {
    console.log("API error:", err);
    console.log("Saving to localStorage");

    const records = JSON.parse(localStorage.getItem("wasteRecords") || "[]");
    records.push(data);
    localStorage.setItem("wasteRecords", JSON.stringify(records));

    alert("Waste logged locally!");
    document.querySelector(".waste-form").reset();
    setTodayDate();
    window.location.href = "dashboard.html";
  }
}

/* ================= DATA ACCESS ================= */

async function getWasteData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.log("API error, using localStorage");
    return JSON.parse(localStorage.getItem("wasteRecords") || "[]");
  }
}

/* ================= DASHBOARD ================= */

function updateDashboardStats(data) {
  const totalRecords = data.length;
  let totalWaste = 0;
  let monthlyWaste = 0;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  data.forEach((d) => {
    const waste = Number(d.waste) || 0;
    totalWaste += waste;

    const date = new Date(d.date);
    if (date.getMonth() === month && date.getFullYear() === year) {
      monthlyWaste += waste;
    }
  });

  const avgWaste = totalRecords ? totalWaste / totalRecords : 0;

  const totalRecordsEl = document.getElementById("totalRecords");
  if (totalRecordsEl) totalRecordsEl.innerText = totalRecords;

  const totalWasteEl = document.getElementById("totalWaste");
  if (totalWasteEl) totalWasteEl.innerText = totalWaste.toFixed(2) + " kg";

  const avgWasteEl = document.getElementById("avgWaste");
  if (avgWasteEl) avgWasteEl.innerText = avgWaste.toFixed(2) + " kg";

  const monthlyWasteEl = document.getElementById("monthlyWaste");
  if (monthlyWasteEl) monthlyWasteEl.innerText = monthlyWaste.toFixed(2) + " kg";
}

async function loadDashboard() {
  const data = await getWasteData();
  updateDashboardStats(data);
  generateInsights(data);
  smartAssistant(data);

  const recentBody = document.getElementById("recentTable");
  if (!recentBody) return;

  if (!data.length) {
    recentBody.innerHTML =
      '<tr><td colspan="4" class="text-center">No records yet</td></tr>';
    return;
  }

  const sorted = [...data].sort((a, b) => {
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  const topFive = sorted.slice(0, 5);

  recentBody.innerHTML = topFive
    .map(
      (d) =>
        `<tr>
          <td>${d.food || "-"}</td>
          <td>${Number(d.waste || 0).toFixed(2)}</td>
          <td>${d.date || "-"}</td>
          <td>${
            d._id
              ? `<button class="btn-small btn-danger" onclick="deleteWaste('${d._id}', true)">Delete</button>`
              : `<button class="btn-small btn-danger" onclick="deleteLocalWaste(${data.indexOf(
                  d
                )})">Delete</button>`
          }</td>
        </tr>`
    )
    .join("");
}

/* ================= RECORDS SUMMARY + TABLE ================= */

function updateSummary(data) {
  let total = 0;

  data.forEach((d) => {
    total += Number(d.waste) || 0;
  });

  const avg = data.length ? total / data.length : 0;

  const summaryCountEl = document.getElementById("summaryCount");
  if (summaryCountEl) summaryCountEl.innerText = data.length;

  const summaryTotalEl = document.getElementById("summaryTotal");
  if (summaryTotalEl) summaryTotalEl.innerText = total.toFixed(2) + " kg";

  const summaryAvgEl = document.getElementById("summaryAvg");
  if (summaryAvgEl) summaryAvgEl.innerText = avg.toFixed(2) + " kg";
}

async function loadWasteTable() {
  const data = await getWasteData();
  updateSummary(data);

  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center">No records yet</td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map(
      (d, index) =>
        `<tr data-category="${(d.category || "").toLowerCase()}" data-local-index="${index}">
          <td>${d.date || "-"}</td>
          <td>${d.food || "-"}</td>
          <td>${d.category || "-"}</td>
          <td>${Number(d.waste || 0).toFixed(2)}</td>
          <td>${d.reason || "-"}</td>
          <td>${d.notes || "-"}</td>
          <td>${
            d._id
              ? `<button class="btn-small btn-danger" onclick="deleteWaste('${d._id}')">Delete</button>`
              : `<button class="btn-small btn-danger" onclick="deleteLocalWaste(${index})">Delete</button>`
          }</td>
        </tr>`
    )
    .join("");
}

function filterTable() {
  const searchInput = document.getElementById("searchInput");
  const filterCategory = document.getElementById("filterCategory");
  const tbody = document.getElementById("tableBody");

  if (!tbody) return;

  const searchValue = (searchInput?.value || "").toLowerCase();
  const categoryValue = (filterCategory?.value || "").toLowerCase();

  Array.from(tbody.rows).forEach((row) => {
    const food = (row.cells[1]?.innerText || "").toLowerCase();
    const category = (row.cells[2]?.innerText || "").toLowerCase();

    const matchesSearch = !searchValue || food.includes(searchValue);
    const matchesCategory = !categoryValue || category === categoryValue;

    row.style.display = matchesSearch && matchesCategory ? "" : "none";
  });
}

let sortAsc = false;
function sortTable() {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  const rows = Array.from(tbody.rows).filter(
    (r) => r.cells[0] && r.cells[0].innerText !== "No records yet"
  );

  sortAsc = !sortAsc;

  rows.sort((a, b) => {
    const da = new Date(a.cells[0].innerText || 0).getTime();
    const db = new Date(b.cells[0].innerText || 0).getTime();
    return sortAsc ? da - db : db - da;
  });

  tbody.innerHTML = "";
  rows.forEach((r) => tbody.appendChild(r));
}

function exportData() {
  const tbody = document.getElementById("tableBody");
  if (!tbody || !tbody.rows.length) {
    alert("No data to export.");
    return;
  }

  const headers = [
    "Date",
    "Food Item",
    "Category",
    "Waste (kg)",
    "Reason",
    "Notes",
  ];

  const rows = Array.from(tbody.rows)
    .filter((r) => r.style.display !== "none")
    .map((row) =>
      Array.from(row.cells)
        .slice(0, 6)
        .map((cell) => `"${(cell.innerText || "").replace(/"/g, '""')}"`)
        .join(",")
    );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "waste-records.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ================= DELETE ================= */

async function deleteWaste(id, refreshDashboardOnly) {
  if (!id) return;
  if (!confirm("Delete this record?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error("Delete failed");
    }

    if (refreshDashboardOnly) {
      const data = await getWasteData();
      updateDashboardStats(data);
      loadDashboard();
    } else {
      loadWasteTable();
      const data = await getWasteData();
      updateDashboardStats(data);
    }
  } catch (err) {
    console.log("Delete error:", err);
    alert("Failed to delete record from server.");
  }
}

function deleteLocalWaste(index) {
  if (index === undefined || index === null) return;
  if (!confirm("Delete this locally stored record?")) return;

  const records = JSON.parse(localStorage.getItem("wasteRecords") || "[]");
  if (index < 0 || index >= records.length) {
    alert("Could not find this local record.");
    return;
  }

  records.splice(index, 1);
  localStorage.setItem("wasteRecords", JSON.stringify(records));

  // Refresh table and dashboard stats from updated local data
  if (document.getElementById("tableBody")) {
    loadWasteTable();
  }
  updateDashboardStats(records);
  if (document.getElementById("recentTable")) {
    loadDashboard();
  }
}

/* ================= ANALYTICS ================= */

let charts = [];

async function loadAnalytics() {
  const data = await getWasteData();

  updateDashboardStats(data);

  const foodMap = {};
  const categoryMap = {};
  const dateMap = {};
  const reasonMap = {};
  const weeklyMap = {};

  data.forEach((d) => {
    const waste = Number(d.waste) || 0;

    foodMap[d.food] = (foodMap[d.food] || 0) + waste;
    const cat = d.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + waste;
    if (d.date) {
      dateMap[d.date] = (dateMap[d.date] || 0) + waste;
      const date = new Date(d.date);
      const week = getWeekNumber(date);
      weeklyMap[week] = (weeklyMap[week] || 0) + waste;
    }

    const reason = d.reason || "Other";
    reasonMap[reason] = (reasonMap[reason] || 0) + waste;
  });

  const totalWaste = Object.values(foodMap).reduce((a, b) => a + b, 0);
  const avgWaste = data.length ? totalWaste / data.length : 0;

  let highest = 0;
  let lowest = Infinity;
  const totalEntries = data.length;

  data.forEach((d) => {
    const w = Number(d.waste) || 0;
    if (w > highest) highest = w;
    if (w < lowest && w > 0) lowest = w;
  });

  if (lowest === Infinity) lowest = 0;

  const totalEntriesEl = document.getElementById("totalEntries");
  if (totalEntriesEl) totalEntriesEl.innerText = totalEntries;

  const totalWasteAnalyticsEl = document.getElementById("totalWasteAnalytics");
  if (totalWasteAnalyticsEl)
    totalWasteAnalyticsEl.innerText = totalWaste.toFixed(2) + " kg";

  const avgWasteAnalyticsEl = document.getElementById("avgWasteAnalytics");
  if (avgWasteAnalyticsEl)
    avgWasteAnalyticsEl.innerText = avgWaste.toFixed(2) + " kg";

  const highestWasteEl = document.getElementById("highestWaste");
  if (highestWasteEl) highestWasteEl.innerText = highest.toFixed(2) + " kg";

  const lowestWasteEl = document.getElementById("lowestWaste");
  if (lowestWasteEl) lowestWasteEl.innerText = lowest.toFixed(2) + " kg";

  const daysWithRecordsEl = document.getElementById("daysWithRecords");
  if (daysWithRecordsEl) {
    const uniqueDays = new Set(data.map((d) => d.date)).size;
    daysWithRecordsEl.innerText = uniqueDays;
  }

  const avgPricePerKg = 50;
  const totalCost = totalWaste * avgPricePerKg;
  const wasteCostEl = document.getElementById("wasteCost");
  if (wasteCostEl) wasteCostEl.innerText = "₹" + totalCost.toFixed(2);

  const efficiencyScoreEl = document.getElementById("efficiencyScore");
  if (efficiencyScoreEl) {
    efficiencyScoreEl.innerText = Math.max(
      0,
      Math.min(100, 100 - avgWaste * 20)
    ).toFixed(0);
  }

  const predictionBox = document.getElementById("predictionBox");
  if (predictionBox) {
    const est = (avgWaste * 7).toFixed(2);
    predictionBox.innerHTML = `
      <div class="prediction-card">
        <p class="prediction-card__label">Simple trend estimate</p>
        <p class="prediction-card__value">${est} kg</p>
        <p class="prediction-card__hint">Roughly seven times your average entry—use it as a planning target, not a forecast.</p>
      </div>`;
  }

  const categoryStats = Object.keys(categoryMap)
    .map((cat) => ({
      name: cat,
      count: data.filter((d) => d.category === cat).length,
      total: categoryMap[cat],
      percentage: totalWaste
        ? ((categoryMap[cat] / totalWaste) * 100).toFixed(1)
        : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const topCategoriesBody = document.getElementById("topCategoriesBody");
  if (topCategoriesBody) {
    topCategoriesBody.innerHTML = categoryStats
      .map(
        (s) =>
          `<tr><td>${s.name}</td><td>${s.count}</td><td>${s.total.toFixed(
            2
          )}</td><td>${s.percentage}%</td></tr>`
      )
      .join("");
  }

  const reasonStats = Object.keys(reasonMap)
    .map((r) => ({
      name: r,
      count: data.filter((d) => (d.reason || "Other") === r).length,
      total: reasonMap[r],
      percentage: totalWaste
        ? ((reasonMap[r] / totalWaste) * 100).toFixed(1)
        : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const reasonsBody = document.getElementById("reasonsBody");
  if (reasonsBody) {
    reasonsBody.innerHTML = reasonStats
      .map(
        (s) =>
          `<tr><td>${s.name}</td><td>${s.count}</td><td>${s.total.toFixed(
            2
          )}</td><td>${s.percentage}%</td></tr>`
      )
      .join("");
  }

  createCharts(foodMap, categoryMap, dateMap, reasonMap, weeklyMap);
  generateInsights(data);
  smartAssistant(data);
}

/* ================= CHARTS ================= */

function createCharts(foodMap, categoryMap, dateMap, reasonMap, weeklyMap) {
  charts.forEach((c) => c.destroy());
  charts = [];

  if (document.getElementById("foodChart")) {
    const chart = new Chart(document.getElementById("foodChart"), {
      type: "pie",
      data: {
        labels: Object.keys(foodMap),
        datasets: [
          {
            data: Object.values(foodMap),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
            ],
          },
        ],
      },
    });
    charts.push(chart);
  }

  if (document.getElementById("categoryChart")) {
    const chart = new Chart(document.getElementById("categoryChart"), {
      type: "bar",
      data: {
        labels: Object.keys(categoryMap),
        datasets: [
          {
            label: "Waste (kg)",
            data: Object.values(categoryMap),
            backgroundColor: "#36A2EB",
          },
        ],
      },
    });
    charts.push(chart);
  }

  if (document.getElementById("dailyChart")) {
    const chart = new Chart(document.getElementById("dailyChart"), {
      type: "line",
      data: {
        labels: Object.keys(dateMap),
        datasets: [
          {
            label: "Daily Waste",
            data: Object.values(dateMap),
            borderColor: "#FF6384",
            fill: false,
          },
        ],
      },
    });
    charts.push(chart);
  }

  if (document.getElementById("reasonChart")) {
    const chart = new Chart(document.getElementById("reasonChart"), {
      type: "doughnut",
      data: {
        labels: Object.keys(reasonMap),
        datasets: [
          {
            data: Object.values(reasonMap),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
            ],
          },
        ],
      },
    });
    charts.push(chart);
  }

  if (document.getElementById("weeklyChart")) {
    const chart = new Chart(document.getElementById("weeklyChart"), {
      type: "line",
      data: {
        labels: Object.keys(weeklyMap),
        datasets: [
          {
            label: "Weekly Waste",
            data: Object.values(weeklyMap),
            borderColor: "#FF6384",
            fill: false,
          },
        ],
      },
    });
    charts.push(chart);
  }
}

/* ================= INSIGHTS ================= */

function escapeHtml(str) {
  if (str == null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateInsights(data) {
  const box = document.getElementById("insightsList");
  if (!box) return;

  if (!data.length) {
    box.innerHTML =
      "<li>Log your first waste entry to unlock trend insights.</li>";
    return;
  }

  let total = 0;
  const foodMap = {};
  const reasonMap = {};
  const categoryMap = {};
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let monthTotal = 0;

  data.forEach((d) => {
    const waste = Number(d.waste) || 0;
    total += waste;
    const food = String(d.food || "Unnamed").trim() || "Unnamed";
    foodMap[food] = (foodMap[food] || 0) + waste;
    const reason = d.reason || "Other";
    reasonMap[reason] = (reasonMap[reason] || 0) + waste;
    const cat = d.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + waste;
    const date = new Date(d.date);
    if (date.getMonth() === month && date.getFullYear() === year) {
      monthTotal += waste;
    }
  });

  const topFood = Object.keys(foodMap).reduce((a, b) =>
    foodMap[a] > foodMap[b] ? a : b
  );
  const topFoodPct = total ? ((foodMap[topFood] / total) * 100).toFixed(1) : "0";
  const topReason = Object.keys(reasonMap).reduce((a, b) =>
    reasonMap[a] > reasonMap[b] ? a : b
  );
  const topReasonPct = total
    ? ((reasonMap[topReason] / total) * 100).toFixed(1)
    : "0";
  const topCat = Object.keys(categoryMap).reduce((a, b) =>
    categoryMap[a] > categoryMap[b] ? a : b
  );

  box.innerHTML = `
    <li><strong>${total.toFixed(2)} kg</strong> total waste across <strong>${data.length}</strong> entries.</li>
    <li>This month: <strong>${monthTotal.toFixed(2)} kg</strong> — focus on <strong>${escapeHtml(topFood)}</strong> (${topFoodPct}% of all waste).</li>
    <li>Leading waste driver: <strong>${escapeHtml(topReason)}</strong> (${topReasonPct}% of volume); top category: <strong>${escapeHtml(topCat)}</strong>.</li>
  `;
}

/* ================= AI ASSISTANT (data-driven waste reduction) ================= */

const REASON_ACTIONS = {
  Spoiled: {
    title: "Cut spoilage with rotation and visibility",
    detail:
      "Use FIFO (first in, first out) when stocking. Move older items to eye level and run a quick weekly fridge audit before shopping.",
    priority: "high",
  },
  Overstock: {
    title: "Right-size purchasing with a simple PAR level",
    detail:
      "Set a maximum stock level per staple and buy to your meal plan for the week. Prefer one focused shop over repeated top-ups that invite overflow.",
    priority: "high",
  },
  "Preparation Loss": {
    title: "Tighten prep yields",
    detail:
      "Prep only what the next two meals need. Save trimmings for stocks or soups, and weigh a few batches to calibrate realistic prep quantities.",
    priority: "medium",
  },
  Preparation: {
    title: "Tighten prep yields",
    detail:
      "Prep only what the next two meals need. Save trimmings for stocks or soups, and weigh a few batches to calibrate realistic prep quantities.",
    priority: "medium",
  },
  "Not Eaten": {
    title: "Reduce plate and pot waste",
    detail:
      "Serve smaller portions with seconds available. Label leftovers with dates and schedule a 'use-up' meal mid-week.",
    priority: "high",
  },
  Expired: {
    title: "Make dates impossible to miss",
    detail:
      "Mark open dates on dairy and jars. Place soonest-use items at the front of shelves and build meals around them two days before they expire.",
    priority: "high",
  },
  Other: {
    title: "Review 'Other' reasons in your notes",
    detail:
      "Tag recurring patterns in notes so you can spot hidden causes (storage, recipes, or timing) and address them systematically.",
    priority: "low",
  },
};

const CATEGORY_ACTIONS = {
  Vegetables: {
    title: "Protect vegetables from moisture loss",
    detail:
      "Store leafy greens with a dry towel, use crisper drawers correctly, and plan stir-fries or soups to clear softening veg mid-week.",
    priority: "medium",
  },
  Fruits: {
    title: "Stage fruit ripening",
    detail:
      "Ripen on the counter, then refrigerate. Freeze overripe fruit for smoothies or baking instead of discarding.",
    priority: "medium",
  },
  Grains: {
    title: "Keep dry goods fresh and visible",
    detail:
      "Use airtight containers, FIFO for rice and flour, and buy pack sizes that match your monthly usage.",
    priority: "low",
  },
  Meat: {
    title: "Freeze in meal-sized portions",
    detail:
      "Portion before freezing with clear labels. Thaw in the fridge, not on the counter, to keep quality and avoid last-minute waste.",
    priority: "medium",
  },
  Dairy: {
    title: "Prioritize dairy turnover",
    detail:
      "Keep milk and yogurt in the coldest zone (not the door). Buy smaller packs if you often lose dairy to dates.",
    priority: "medium",
  },
  "Prepared Food": {
    title: "Cool fast, eat on schedule",
    detail:
      "Chill leftovers within two hours in shallow containers. Plan reheats within three to four days or freeze immediately.",
    priority: "medium",
  },
  Other: {
    title: "Clarify mixed or misc items",
    detail:
      "Split 'Other' into clearer categories in future logs so patterns are easier to act on.",
    priority: "low",
  },
};

function buildWasteReductionTips(data) {
  const foodMap = {};
  const reasonMap = {};
  const categoryMap = {};
  let totalWaste = 0;

  data.forEach((d) => {
    const waste = Number(d.waste) || 0;
    totalWaste += waste;
    const food = (d.food || "Unnamed").trim() || "Unnamed";
    foodMap[food] = (foodMap[food] || 0) + waste;
    const reason = d.reason || "Other";
    reasonMap[reason] = (reasonMap[reason] || 0) + waste;
    const cat = d.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + waste;
  });

  const avgEntry = data.length ? totalWaste / data.length : 0;
  const tips = [];
  const seenTitles = new Set();

  const addTip = (tip) => {
    if (!tip || !tip.title) return;
    const key = tip.title.toLowerCase();
    if (seenTitles.has(key)) return;
    seenTitles.add(key);
    tips.push(tip);
  };

  const sortedReasons = Object.keys(reasonMap).sort(
    (a, b) => reasonMap[b] - reasonMap[a]
  );
  const sortedCats = Object.keys(categoryMap).sort(
    (a, b) => categoryMap[b] - categoryMap[a]
  );
  const sortedFoods = Object.keys(foodMap).sort(
    (a, b) => foodMap[b] - foodMap[a]
  );

  const topReason = sortedReasons[0];
  const topReasonShare = totalWaste ? reasonMap[topReason] / totalWaste : 0;
  if (topReason && topReasonShare >= 0.18 && REASON_ACTIONS[topReason]) {
    addTip({ ...REASON_ACTIONS[topReason] });
  } else if (topReason && REASON_ACTIONS[topReason]) {
    addTip({
      ...REASON_ACTIONS[topReason],
      priority: "medium",
    });
  }

  const topCat = sortedCats[0];
  const topCatShare = totalWaste ? categoryMap[topCat] / totalWaste : 0;
  if (topCat && topCatShare >= 0.22 && CATEGORY_ACTIONS[topCat]) {
    addTip({ ...CATEGORY_ACTIONS[topCat] });
  } else if (topCat && CATEGORY_ACTIONS[topCat]) {
    addTip({
      ...CATEGORY_ACTIONS[topCat],
      priority: "low",
    });
  }

  const topFood = sortedFoods[0];
  if (topFood && foodMap[topFood] > 0) {
    const pct = totalWaste ? ((foodMap[topFood] / totalWaste) * 100).toFixed(1) : 0;
    addTip({
      priority: topCatShare > 0.35 || topReasonShare > 0.35 ? "high" : "medium",
      title: `Focus on "${topFood}" first`,
      detail: `It accounts for about ${pct}% of logged waste. Plan two meals this week that use it, or freeze a prepared portion before it declines.`,
    });
  }

  if (sortedFoods.length > 1 && foodMap[sortedFoods[1]] > 0) {
    const second = sortedFoods[1];
    const pct2 = totalWaste
      ? ((foodMap[second] / totalWaste) * 100).toFixed(1)
      : 0;
    if (Number(pct2) >= 12) {
      addTip({
        priority: "medium",
        title: `Also watch "${second}"`,
        detail: `Roughly ${pct2}% of waste. Pair it with your top item in one combined meal to clear both faster.`,
      });
    }
  }

  if (avgEntry > 0.45) {
    addTip({
      priority: "medium",
      title: "Reduce typical portion size",
      detail:
        "Your average entry is relatively high. Try 10–15% smaller batches and track if waste per meal drops without affecting satisfaction.",
    });
  }

  if (totalWaste > 8) {
    addTip({
      priority: "low",
      title: "Recover value safely",
      detail:
        "Where food is still safe, donate through local programs or compost inedible scraps. Both cut landfill impact and reinforce mindful purchasing.",
    });
  }

  if (tips.length < 3) {
    addTip({
      priority: "low",
      title: "Keep logging consistently",
      detail:
        "Weekly logging for four weeks gives the coach enough signal to separate real trends from one-off events.",
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tips.sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      (b.detail || "").length - (a.detail || "").length
  );

  return { tips: tips.slice(0, 7), totalWaste, foodMap, reasonMap, categoryMap };
}

function renderAiCoach(data) {
  const {
    tips,
    totalWaste,
    foodMap,
    reasonMap,
    categoryMap,
  } = buildWasteReductionTips(data);

  const sortedFoods = Object.keys(foodMap).sort(
    (a, b) => foodMap[b] - foodMap[a]
  );
  const sortedReasons = Object.keys(reasonMap).sort(
    (a, b) => reasonMap[b] - reasonMap[a]
  );
  const sortedCats = Object.keys(categoryMap).sort(
    (a, b) => categoryMap[b] - categoryMap[a]
  );

  const topFood = sortedFoods[0] || "—";
  const topReason = sortedReasons[0] || "—";
  const topCat = sortedCats[0] || "—";
  const uniqueDays = new Set(data.map((d) => d.date).filter(Boolean)).size;

  const tipHtml = tips
    .map(
      (t) => `
    <li class="ai-tip">
      <span class="ai-tip-priority ai-tip-priority--${t.priority}">${t.priority}</span>
      <div class="ai-tip-text">
        <div class="ai-tip-title">${escapeHtml(t.title)}</div>
        <p class="ai-tip-detail">${escapeHtml(t.detail)}</p>
      </div>
    </li>`
    )
    .join("");

  return `
    <div class="ai-coach">
      <div class="ai-coach-bar">
        <span class="ai-badge">AI kitchen coach</span>
        <span class="ai-coach-sub">Suggestions from your waste history</span>
      </div>
      <div class="ai-coach-body">
        <p class="ai-summary">Based on <strong>${data.length}</strong> entries over <strong>${uniqueDays}</strong> days, here is how to reduce waste next.</p>
        <div class="ai-metrics">
          <div class="ai-metric">
            <span class="ai-metric-label">Total logged</span>
            <span class="ai-metric-value">${totalWaste.toFixed(2)} kg</span>
          </div>
          <div class="ai-metric">
            <span class="ai-metric-label">Top item</span>
            <span class="ai-metric-value">${escapeHtml(topFood)}</span>
          </div>
          <div class="ai-metric">
            <span class="ai-metric-label">Main reason</span>
            <span class="ai-metric-value">${escapeHtml(topReason)}</span>
          </div>
          <div class="ai-metric">
            <span class="ai-metric-label">Top category</span>
            <span class="ai-metric-value">${escapeHtml(topCat)}</span>
          </div>
        </div>
        <ul class="ai-tip-list">${tipHtml}</ul>
        <p class="ai-footnote">Tips are generated from your data (categories, reasons, and amounts), not from an external API. Log accurately for better guidance.</p>
      </div>
    </div>
  `;
}

function smartAssistant(data) {
  const box = document.getElementById("aiAssistant");
  if (!box) return;

  if (!data.length) {
    box.innerHTML = `
      <div class="ai-coach">
        <div class="ai-coach-bar">
          <span class="ai-badge">AI kitchen coach</span>
          <span class="ai-coach-sub">Waiting for your first entries</span>
        </div>
        <div class="ai-coach-body ai-empty">
          Log a few waste events with category and reason. The coach will highlight the biggest levers—spoilage, overbuying, portions—and give ordered actions to cut waste.
        </div>
      </div>`;
    return;
  }

  box.classList.add("ai-box");
  box.innerHTML = renderAiCoach(data);
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
}

function generateFullReport() {
  alert("Full report generation not implemented yet.");
}

/* ================= MONTHLY REPORT ================= */

async function loadMonthlyReport() {
  const allData = await getWasteData();
  if (!allData.length) {
    setMonthlyEmptyState();
    return;
  }

  const monthInput = document.getElementById("monthInput");
  if (!monthInput) return;

  if (!monthInput.value) {
    const now = new Date();
    monthInput.value = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  const [yearStr, monthStr] = monthInput.value.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  const monthData = allData.filter((d) => {
    if (!d.date) return false;
    const dt = new Date(d.date);
    return dt.getFullYear() === year && dt.getMonth() === month;
  });

  if (!monthData.length) {
    setMonthlyEmptyState();
    return;
  }

  let total = 0;
  let maxWaste = 0;
  const categoryMap = {};
  const reasonMap = {};
  const foodMap = {};

  monthData.forEach((d) => {
    const waste = Number(d.waste) || 0;
    total += waste;
    if (waste > maxWaste) maxWaste = waste;

    const cat = d.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + waste;

    const reason = d.reason || "Other";
    reasonMap[reason] = (reasonMap[reason] || 0) + waste;

    foodMap[d.food] = (foodMap[d.food] || 0) + waste;
  });

  const avg = monthData.length ? total / monthData.length : 0;

  const monthEntriesEl = document.getElementById("monthEntries");
  if (monthEntriesEl) monthEntriesEl.innerText = monthData.length;

  const monthTotalEl = document.getElementById("monthTotal");
  if (monthTotalEl) monthTotalEl.innerText = total.toFixed(2) + " kg";

  const monthAvgEl = document.getElementById("monthAvg");
  if (monthAvgEl) monthAvgEl.innerText = avg.toFixed(2) + " kg";

  const monthMaxEl = document.getElementById("monthMax");
  if (monthMaxEl) monthMaxEl.innerText = maxWaste.toFixed(2) + " kg";

  createMonthlyCharts(categoryMap, reasonMap);
  updateMonthlyInsights(monthData, foodMap);
}

function setMonthlyEmptyState() {
  const entriesEl = document.getElementById("monthEntries");
  if (entriesEl) entriesEl.innerText = "0";
  const totalEl = document.getElementById("monthTotal");
  if (totalEl) totalEl.innerText = "0 kg";
  const avgEl = document.getElementById("monthAvg");
  if (avgEl) avgEl.innerText = "0 kg";
  const maxEl = document.getElementById("monthMax");
  if (maxEl) maxEl.innerText = "0 kg";

  const monthlyAI = document.getElementById("monthlyAI");
  if (monthlyAI) monthlyAI.innerText = "No data for this month yet.";

  const monthlyTopFoods = document.getElementById("monthlyTopFoods");
  if (monthlyTopFoods)
    monthlyTopFoods.innerHTML = "<li>No data for this month</li>";
}

let monthCharts = [];
function createMonthlyCharts(categoryMap, reasonMap) {
  monthCharts.forEach((c) => c.destroy());
  monthCharts = [];

  const catCanvas = document.getElementById("monthCategoryChart");
  if (catCanvas && typeof Chart !== "undefined") {
    const chart = new Chart(catCanvas, {
      type: "pie",
      data: {
        labels: Object.keys(categoryMap),
        datasets: [
          {
            data: Object.values(categoryMap),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
            ],
          },
        ],
      },
    });
    monthCharts.push(chart);
  }

  const reasonCanvas = document.getElementById("monthReasonChart");
  if (reasonCanvas && typeof Chart !== "undefined") {
    const chart = new Chart(reasonCanvas, {
      type: "doughnut",
      data: {
        labels: Object.keys(reasonMap),
        datasets: [
          {
            data: Object.values(reasonMap),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
            ],
          },
        ],
      },
    });
    monthCharts.push(chart);
  }
}

function updateMonthlyInsights(monthData, foodMap) {
  const monthlyAI = document.getElementById("monthlyAI");
  if (!monthlyAI) return;

  if (!monthData.length) {
    monthlyAI.innerText = "No data for this month yet.";
    return;
  }

  const total = monthData.reduce(
    (sum, d) => sum + (Number(d.waste) || 0),
    0
  );
  const avg = total / monthData.length;

  const topFoods = Object.keys(foodMap)
    .map((name) => ({ name, total: foodMap[name] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  monthlyAI.innerHTML = `
    <p>Total waste this month: <strong>${total.toFixed(2)} kg</strong></p>
    <p>Average waste per entry: <strong>${avg.toFixed(2)} kg</strong></p>
    <p>Focus on reducing the top wasted items to improve efficiency.</p>
  `;

  const monthlyTopFoods = document.getElementById("monthlyTopFoods");
  if (monthlyTopFoods) {
    monthlyTopFoods.innerHTML = topFoods
      .map(
        (f) =>
          `<li>${f.name || "Unknown"} - ${f.total.toFixed(2)} kg wasted</li>`
      )
      .join("");
  }
}

async function exportMonthlyCSV() {
  const monthInput = document.getElementById("monthInput");
  if (!monthInput || !monthInput.value) {
    alert("Please select a month first.");
    return;
  }

  const allData = await getWasteData();
  if (!allData.length) {
    alert("No data to export.");
    return;
  }

  const [yearStr, monthStr] = monthInput.value.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  const monthData = allData.filter((d) => {
    if (!d.date) return false;
    const dt = new Date(d.date);
    return dt.getFullYear() === year && dt.getMonth() === month;
  });

  if (!monthData.length) {
    alert("No records for the selected month.");
    return;
  }

  const headers = [
    "Date",
    "Food Item",
    "Category",
    "Waste (kg)",
    "Reason",
    "Notes",
  ];

  const rows = monthData.map((d) =>
    [
      d.date || "",
      d.food || "",
      d.category || "",
      Number(d.waste || 0).toFixed(2),
      d.reason || "",
      d.notes || "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `monthly-report-${monthInput.value}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async function () {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }

  if (document.getElementById("tableBody")) {
    loadWasteTable();
  }

  if (document.getElementById("foodChart")) {
    loadAnalytics();
  }

  if (document.getElementById("totalRecords")) {
    const data = await getWasteData();
    updateDashboardStats(data);
  }

  // Log waste & records pages: coach here. Dashboard uses loadDashboard(); analytics uses loadAnalytics().
  if (
    document.getElementById("aiAssistant") &&
    !document.getElementById("foodChart") &&
    !document.getElementById("recentTable")
  ) {
    const aiData = await getWasteData();
    smartAssistant(aiData);
  }
});