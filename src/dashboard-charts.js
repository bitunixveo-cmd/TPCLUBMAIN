import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkPointComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkPointComponent,
  CanvasRenderer
]);

const COLORS = {
  spend: '#aaff00',
  spendDeep: '#6aaa00',
  conversions: '#ff8ec8',
  clicks: '#7ec8ff',
  cpc: '#ffd166',
  cpa: '#ff9f43',
  google: '#aaff00',
  meta: '#ff5ea8',
  muted: '#8fa08f',
  axis: 'rgba(255,255,255,0.14)',
  split: 'rgba(255,255,255,0.06)'
};

const chartStore = new Map();

function baseGrid(bottom = 28) {
  return {
    left: 12,
    right: 20,
    top: 48,
    bottom,
    containLabel: true
  };
}

function chartBackground() {
  return { backgroundColor: 'transparent' };
}

function axisStyle() {
  return {
    axisLine: { lineStyle: { color: COLORS.axis } },
    axisTick: { show: false },
    axisLabel: { color: COLORS.muted, fontSize: 11 },
    splitLine: { lineStyle: { color: COLORS.split } }
  };
}

function tooltipStyle() {
  return {
    backgroundColor: 'rgba(6, 12, 8, 0.94)',
    borderColor: 'rgba(170, 255, 0, 0.22)',
    borderWidth: 1,
    textStyle: { color: '#e8f0e8', fontSize: 12 },
    padding: [10, 12]
  };
}

function disposeChart(key) {
  const chart = chartStore.get(key);
  if (chart && !chart.isDisposed()) chart.dispose();
  chartStore.delete(key);
}

function showChartEmpty(el, key, message) {
  if (!el) return;
  disposeChart(key);
  el.innerHTML = `<div class="empty-state">${message}</div>`;
}

function ensureChart(el, key) {
  if (!el) return null;

  if (el.querySelector('.empty-state')) {
    disposeChart(key);
    el.innerHTML = '';
  }

  let chart = chartStore.get(key);
  if (chart) {
    const dom = chart.getDom();
    if (chart.isDisposed() || dom !== el || !dom.isConnected) {
      disposeChart(key);
      chart = null;
    }
  }

  if (!chart) {
    chart = echarts.init(el, null, { renderer: 'canvas' });
    chartStore.set(key, chart);
  }

  return chart;
}

export function resizeDashboardCharts() {
  chartStore.forEach((chart) => {
    if (!chart.isDisposed()) chart.resize();
  });
}

export function renderSpendConversionTrendChart(el, days, formatters, onDayClick) {
  if (!el) return;
  if (!days.length) {
    showChartEmpty(el, 'trend', 'No trend data.');
    return;
  }

  const chart = ensureChart(el, 'trend');
  if (!chart) return;

  const labels = days.map((day) => day.name.slice(5));
  const spend = days.map((day) => day.spend || 0);
  const conversions = days.map((day) => day.conversions || 0);
  const maxSpendIndex = spend.indexOf(Math.max(...spend));

  chart.setOption({
    ...chartBackground(),
    animationDuration: 720,
    animationEasing: 'cubicOut',
    grid: baseGrid(labels.length > 14 ? 52 : 32),
    legend: {
      top: 4,
      textStyle: { color: COLORS.muted, fontSize: 11 },
      data: ['Spend (AED)', 'Conversions']
    },
    dataZoom: labels.length > 10 ? [
      { type: 'inside', start: labels.length > 20 ? 35 : 0, end: 100 },
      {
        type: 'slider',
        height: 18,
        bottom: 6,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        fillerColor: 'rgba(170,255,0,0.18)',
        handleStyle: { color: COLORS.spend, borderColor: COLORS.spend },
        textStyle: { color: COLORS.muted, fontSize: 10 }
      }
    ] : [],
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle(),
      formatter(params) {
        const index = params[0]?.dataIndex ?? 0;
        const day = days[index];
        if (!day) return '';
        return [
          `<strong>${day.name}</strong>`,
          `Spend: ${formatters.currency(day.spend)}`,
          `Conversions: ${formatters.number(day.conversions)}`,
          `Clicks: ${formatters.number(day.clicks)}`,
          `CTR: ${formatters.percent(formatters.ctr(day))}`,
          `CPC: ${formatters.cpc(day)}`,
          `CPA: ${formatters.cpa(day)}`
        ].join('<br/>');
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      ...axisStyle(),
      axisLabel: { color: COLORS.muted, fontSize: 10, interval: labels.length > 14 ? 1 : 0 }
    },
    yAxis: [
      { type: 'value', name: 'Spend', ...axisStyle(), nameTextStyle: { color: COLORS.muted, fontSize: 10 } },
      { type: 'value', name: 'Conv.', ...axisStyle(), nameTextStyle: { color: COLORS.muted, fontSize: 10 }, splitLine: { show: false } }
    ],
    series: [
      {
        name: 'Spend (AED)',
        type: 'bar',
        data: spend,
        barMaxWidth: 26,
        emphasis: { focus: 'series', itemStyle: { shadowBlur: 18, shadowColor: 'rgba(170, 255, 0, 0.45)' } },
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#d4ff66' },
            { offset: 0.55, color: COLORS.spend },
            { offset: 1, color: COLORS.spendDeep }
          ])
        },
        markPoint: maxSpendIndex >= 0 ? {
          symbol: 'pin',
          symbolSize: 42,
          label: { color: '#0a1208', fontWeight: 800, fontSize: 10 },
          itemStyle: { color: COLORS.spend },
          data: [{ name: 'Peak', coord: [maxSpendIndex, spend[maxSpendIndex]], value: formatters.currency(spend[maxSpendIndex]) }]
        } : undefined
      },
      {
        name: 'Conversions',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: COLORS.conversions, shadowBlur: 8, shadowColor: 'rgba(255, 142, 200, 0.45)' },
        itemStyle: { color: '#fff', borderColor: COLORS.conversions, borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 142, 200, 0.35)' },
            { offset: 1, color: 'rgba(255, 142, 200, 0.02)' }
          ])
        },
        data: conversions
      }
    ]
  }, true);

  chart.off('click');
  if (onDayClick) {
    chart.on('click', (event) => {
      const day = days[event.dataIndex];
      if (day) onDayClick(day.name);
    });
  }
  chart.resize();
}

export function renderMetricTrendChart(el, days, metric, formatters, onDayClick) {
  if (!el) return;
  if (!days.length) {
    showChartEmpty(el, 'metric', 'No line chart data.');
    return;
  }

  const chart = ensureChart(el, 'metric');
  if (!chart) return;

  const metricMeta = {
    spend: { label: 'Spend (AED)', color: COLORS.spend },
    clicks: { label: 'Clicks', color: COLORS.clicks },
    conversions: { label: 'Conversions', color: COLORS.conversions },
    cpc: { label: 'CPC (AED)', color: COLORS.cpc },
    cpa: { label: 'CPA (AED)', color: COLORS.cpa }
  };
  const meta = metricMeta[metric] || metricMeta.spend;
  const labels = days.map((day) => day.name.slice(5));
  const values = days.map((day) => formatters.metricValue(day, metric));

  chart.setOption({
    ...chartBackground(),
    animationDuration: 560,
    animationEasing: 'cubicOut',
    grid: baseGrid(),
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle(),
      formatter(params) {
        const index = params[0]?.dataIndex ?? 0;
        const day = days[index];
        if (!day) return '';
        return [`<strong>${day.name}</strong>`, `${meta.label}: ${formatters.formatMetric(values[index], metric)}`].join('<br/>');
      }
    },
    xAxis: { type: 'category', data: labels, boundaryGap: false, ...axisStyle() },
    yAxis: { type: 'value', ...axisStyle() },
    series: [{
      name: meta.label,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 3, color: meta.color, shadowBlur: 10, shadowColor: `${meta.color}66` },
      itemStyle: { color: '#fff', borderColor: meta.color, borderWidth: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `${meta.color}55` },
          { offset: 1, color: `${meta.color}05` }
        ])
      },
      data: values
    }]
  }, true);

  chart.off('click');
  if (onDayClick) {
    chart.on('click', (event) => {
      const day = days[event.dataIndex];
      if (day) onDayClick(day.name);
    });
  }
  chart.resize();
}

export function renderPlatformChart(el, groups, formatters, onPlatformClick) {
  if (!el) return;
  if (!groups.length) {
    showChartEmpty(el, 'platform', 'No platform data for this filter.');
    return;
  }

  const chart = ensureChart(el, 'platform');
  if (!chart) return;

  const names = groups.map((group) => group.name);
  const spend = groups.map((group) => group.spend || 0);
  const conversions = groups.map((group) => group.conversions || 0);
  const colors = groups.map((group) => (group.name === 'Meta Ads' ? COLORS.meta : COLORS.google));

  chart.setOption({
    ...chartBackground(),
    animationDuration: 480,
    grid: { ...baseGrid(), left: 8, right: 24, top: 36, bottom: 8 },
    legend: { top: 0, textStyle: { color: COLORS.muted, fontSize: 11 }, data: ['Spend (AED)', 'Conversions'] },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter(params) {
        const index = params[0]?.dataIndex ?? 0;
        const group = groups[index];
        if (!group) return '';
        return [
          `<strong>${group.name}</strong>`,
          `Spend: ${formatters.currency(group.spend)}`,
          `Conversions: ${formatters.number(group.conversions)}`,
          `CPA: ${formatters.cpa(group)}`,
          `CTR: ${formatters.percent(formatters.ctr(group))}`
        ].join('<br/>');
      }
    },
    xAxis: { type: 'value', ...axisStyle() },
    yAxis: { type: 'category', data: names, ...axisStyle(), axisLabel: { color: '#dce6dc', fontSize: 11 } },
    series: [
      {
        name: 'Spend (AED)',
        type: 'bar',
        data: spend.map((value, index) => ({
          value,
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: colors[index] },
              { offset: 1, color: colors[index] === COLORS.meta ? '#ff8ec8' : COLORS.spendDeep }
            ])
          }
        })),
        barMaxWidth: 16
      },
      {
        name: 'Conversions',
        type: 'bar',
        data: conversions,
        barMaxWidth: 12,
        itemStyle: { borderRadius: [0, 6, 6, 0], color: 'rgba(126, 200, 255, 0.75)' }
      }
    ]
  }, true);

  chart.off('click');
  if (onPlatformClick) {
    chart.on('click', (event) => {
      const group = groups[event.dataIndex];
      if (group) onPlatformClick(group.name);
    });
  }
  chart.resize();
}

export function renderAccountChart(el, accounts, formatters, onAccountClick) {
  if (!el) return;
  if (!accounts.length) {
    showChartEmpty(el, 'account', 'No account data for this filter.');
    return;
  }

  const chartHeight = Math.max(220, accounts.length * 52 + 72);
  el.style.height = `${chartHeight}px`;
  el.style.minHeight = `${chartHeight}px`;

  const chart = ensureChart(el, 'account');
  if (!chart) return;

  const labels = accounts.map((group) => group.name);
  const spend = accounts.map((group) => group.spend || 0);
  const conversions = accounts.map((group) => group.conversions || 0);

  chart.setOption({
    ...chartBackground(),
    animationDuration: 560,
    grid: { ...baseGrid(), left: 12, right: 24, top: 36, bottom: 8 },
    legend: { top: 0, textStyle: { color: COLORS.muted, fontSize: 11 }, data: ['Spend (AED)', 'Conversions'] },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter(params) {
        const index = params[0]?.dataIndex ?? 0;
        const group = accounts[index];
        if (!group) return '';
        return [
          `<strong>${group.name}</strong>`,
          `Spend: ${formatters.currency(group.spend)}`,
          `Conversions: ${formatters.number(group.conversions)}`,
          `Wasted: ${formatters.currency(group.wastedSpend || 0)}`,
          `CPA: ${formatters.cpa(group)}`,
          `CTR: ${formatters.percent(formatters.ctr(group))}`
        ].join('<br/>');
      }
    },
    xAxis: { type: 'value', ...axisStyle() },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      ...axisStyle(),
      axisLabel: { color: '#dce6dc', fontSize: 11, width: 140, overflow: 'truncate' }
    },
    series: [
      {
        name: 'Spend (AED)',
        type: 'bar',
        data: spend.map((value) => ({
          value,
          itemStyle: {
            borderRadius: [0, 8, 8, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: COLORS.spend },
              { offset: 1, color: COLORS.cpc }
            ])
          }
        })),
        barMaxWidth: 18,
        emphasis: { focus: 'series', itemStyle: { shadowBlur: 14, shadowColor: 'rgba(170, 255, 0, 0.35)' } }
      },
      {
        name: 'Conversions',
        type: 'bar',
        data: conversions,
        barMaxWidth: 12,
        itemStyle: { borderRadius: [0, 8, 8, 0], color: 'rgba(126, 200, 255, 0.8)' }
      }
    ]
  }, true);

  chart.off('click');
  if (onAccountClick) {
    chart.on('click', (event) => {
      const group = accounts[event.dataIndex];
      if (group) onAccountClick(group.name);
    });
  }
  chart.resize();
}

export function renderCampaignEchart(el, campaigns, formatters, onCampaignClick, selectedKey) {
  if (!el) return;
  if (!campaigns.length) {
    showChartEmpty(el, 'campaign', 'No campaign chart data for this filter.');
    return;
  }

  const chartHeight = Math.max(300, campaigns.length * 56 + 80);
  el.style.height = `${chartHeight}px`;
  el.style.minHeight = `${chartHeight}px`;

  const chart = ensureChart(el, 'campaign');
  if (!chart) return;

  const labels = campaigns.map((campaign) => campaign.campaign || formatters.campaignLabel(campaign));
  const spend = campaigns.map((campaign) => campaign.spend || 0);
  const conversions = campaigns.map((campaign) => campaign.conversions || 0);
  const colors = campaigns.map((campaign) => (campaign.platform === 'Meta Ads' ? COLORS.meta : COLORS.google));

  chart.setOption({
    ...chartBackground(),
    animationDuration: 640,
    animationEasing: 'cubicOut',
    grid: { ...baseGrid(), left: 12, right: 28, top: 16, bottom: 12 },
    legend: { top: 0, textStyle: { color: COLORS.muted, fontSize: 11 }, data: ['Spend (AED)', 'Conversions'] },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter(params) {
        const index = params[0]?.dataIndex ?? 0;
        const campaign = campaigns[index];
        if (!campaign) return '';
        return [
          `<strong>${campaign.campaign}</strong>`,
          `${campaign.platform} · ${campaign.account}`,
          `Spend: ${formatters.currency(campaign.spend)}`,
          `Conversions: ${formatters.number(campaign.conversions)}`,
          `CPA: ${formatters.cpa(campaign)}`,
          `CTR: ${formatters.percent(formatters.ctr(campaign))}`
        ].join('<br/>');
      }
    },
    xAxis: { type: 'value', ...axisStyle() },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      ...axisStyle(),
      axisLabel: {
        color: '#dce6dc',
        fontSize: 11,
        width: 168,
        overflow: 'truncate',
        formatter(value, index) {
          const campaign = campaigns[index];
          if (!campaign) return value;
          const tag = campaign.platform === 'Meta Ads' ? 'M' : 'G';
          return `{tag|${tag}} ${value}`;
        },
        rich: {
          tag: {
            color: '#0a1208',
            backgroundColor: COLORS.spend,
            borderRadius: 4,
            padding: [1, 4, 1, 4],
            fontSize: 9,
            fontWeight: 800
          }
        }
      }
    },
    series: [
      {
        name: 'Spend (AED)',
        type: 'bar',
        data: spend.map((value, index) => {
          const key = formatters.campaignKey(campaigns[index]);
          const isSelected = selectedKey && key === selectedKey;
          return {
            value,
            itemStyle: {
              borderRadius: [0, 8, 8, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: colors[index] },
                { offset: 1, color: colors[index] === COLORS.meta ? '#ff8ec8' : COLORS.spendDeep }
              ]),
              opacity: selectedKey && !isSelected ? 0.42 : 1,
              borderColor: isSelected ? '#ffffff' : 'transparent',
              borderWidth: isSelected ? 2 : 0,
              shadowBlur: isSelected ? 14 : 0,
              shadowColor: 'rgba(170, 255, 0, 0.35)'
            }
          };
        }),
        barMaxWidth: 20,
        emphasis: { focus: 'series', itemStyle: { shadowBlur: 16, shadowColor: 'rgba(170, 255, 0, 0.35)' } }
      },
      {
        name: 'Conversions',
        type: 'bar',
        data: conversions,
        barMaxWidth: 14,
        itemStyle: { borderRadius: [0, 8, 8, 0], color: 'rgba(126, 200, 255, 0.82)' }
      }
    ]
  }, true);

  chart.off('click');
  if (onCampaignClick) {
    chart.on('click', (event) => {
      const campaign = campaigns[event.dataIndex];
      if (campaign) onCampaignClick(formatters.campaignKey(campaign));
    });
  }
  chart.resize();
}

export function renderKeywordWasteChart(el, keywords, formatters) {
  if (!el) return;
  if (!keywords.length) {
    showChartEmpty(el, 'keywordWaste', 'No wasted keyword spend in this filter.');
    return;
  }

  const chartHeight = Math.max(260, keywords.length * 44 + 80);
  el.style.height = `${chartHeight}px`;
  el.style.minHeight = `${chartHeight}px`;

  const chart = ensureChart(el, 'keywordWaste');
  if (!chart) return;

  const labels = keywords.map((row) => row.keyword);
  const spend = keywords.map((row) => row.spend || 0);

  chart.setOption({
    ...chartBackground(),
    animationDuration: 560,
    grid: { ...baseGrid(), left: 12, right: 20, top: 16, bottom: 8 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter(params) {
        const index = params[0]?.dataIndex ?? 0;
        const row = keywords[index];
        if (!row) return '';
        return [
          `<strong>${row.keyword}</strong>`,
          `Wasted spend: ${formatters.currency(row.spend)}`,
          `Clicks: ${formatters.number(row.clicks)}`,
          `Conversions: ${formatters.number(row.conversions)}`
        ].join('<br/>');
      }
    },
    xAxis: { type: 'value', ...axisStyle() },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      ...axisStyle(),
      axisLabel: { color: '#ffd0df', fontSize: 10, width: 180, overflow: 'truncate' }
    },
    series: [{
      name: 'Wasted spend',
      type: 'bar',
      data: spend.map((value) => ({
        value,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#ff5ea8' },
            { offset: 1, color: '#ff9f43' }
          ])
        }
      })),
      barMaxWidth: 16,
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(255, 94, 168, 0.45)' } }
    }]
  }, true);
  chart.resize();
}

export function renderSearchTermWasteChart(el, terms, formatters) {
  if (!el) return;
  if (!terms.length) {
    showChartEmpty(el, 'searchTermWaste', 'No wasted search term spend in this filter.');
    return;
  }

  const chartHeight = Math.max(260, terms.length * 44 + 80);
  el.style.height = `${chartHeight}px`;
  el.style.minHeight = `${chartHeight}px`;

  const chart = ensureChart(el, 'searchTermWaste');
  if (!chart) return;

  const labels = terms.map((row) => row.searchTerm);
  const spend = terms.map((row) => row.spend || 0);

  chart.setOption({
    ...chartBackground(),
    animationDuration: 560,
    grid: { ...baseGrid(), left: 12, right: 20, top: 16, bottom: 8 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter(params) {
        const index = params[0]?.dataIndex ?? 0;
        const row = terms[index];
        if (!row) return '';
        return [
          `<strong>${row.searchTerm}</strong>`,
          `Wasted spend: ${formatters.currency(row.spend)}`,
          `Clicks: ${formatters.number(row.clicks || 0)}`,
          `Conversions: ${formatters.number(row.conversions)}`
        ].join('<br/>');
      }
    },
    xAxis: { type: 'value', ...axisStyle() },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      ...axisStyle(),
      axisLabel: { color: '#ffd0df', fontSize: 10, width: 180, overflow: 'truncate' }
    },
    series: [{
      name: 'Wasted spend',
      type: 'bar',
      data: spend.map((value) => ({
        value,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#ff7eb3' },
            { offset: 1, color: '#ffb347' }
          ])
        }
      })),
      barMaxWidth: 16,
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(255, 94, 168, 0.45)' } }
    }]
  }, true);
  chart.resize();
}

export function renderMatchTypeChart(el, groups, formatters) {
  if (!el) return;
  if (!groups.length) {
    showChartEmpty(el, 'matchType', 'No keyword match-type data for this filter.');
    return;
  }

  el.style.height = '280px';
  el.style.minHeight = '280px';

  const chart = ensureChart(el, 'matchType');
  if (!chart) return;

  const labels = groups.map((row) => row.matchType);
  const spend = groups.map((row) => row.spend || 0);
  const conversions = groups.map((row) => row.conversions || 0);

  chart.setOption({
    ...chartBackground(),
    animationDuration: 560,
    legend: {
      top: 4,
      right: 8,
      textStyle: { color: '#dce6dc', fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8
    },
    grid: { ...baseGrid(), left: 12, right: 16, top: 36, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter(params) {
        const index = params[0]?.dataIndex ?? 0;
        const row = groups[index];
        if (!row) return '';
        return [
          `<strong>${row.matchType}</strong>`,
          `Spend: ${formatters.currency(row.spend)}`,
          `Conversions: ${formatters.number(row.conversions)}`,
          `CPA: ${formatters.cpa(row)}`
        ].join('<br/>');
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      ...axisStyle(),
      axisLabel: { color: '#dce6dc', fontSize: 11 }
    },
    yAxis: { type: 'value', ...axisStyle() },
    series: [
      {
        name: 'Spend',
        type: 'bar',
        data: spend.map((value) => ({
          value,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: COLORS.spend },
              { offset: 1, color: COLORS.spendDeep }
            ])
          }
        })),
        barMaxWidth: 36
      },
      {
        name: 'Conversions',
        type: 'bar',
        data: conversions,
        barMaxWidth: 28,
        itemStyle: { borderRadius: [8, 8, 0, 0], color: 'rgba(126, 200, 255, 0.82)' }
      }
    ]
  }, true);
  chart.resize();
}

export function renderCountrySpendChart(el, countries, formatters, onCountryClick) {
  if (!el) return;
  if (!countries.length) {
    showChartEmpty(el, 'countrySpend', 'No country spend data for this filter.');
    return;
  }

  const chartHeight = Math.max(280, countries.length * 46 + 80);
  el.style.height = `${chartHeight}px`;
  el.style.minHeight = `${chartHeight}px`;

  const chart = ensureChart(el, 'countrySpend');
  if (!chart) return;

  const spend = countries.map((c) => c.spend || 0);
  const rich = {};
  const axisLabels = countries.map((country, index) => {
    const code = formatters.countryCode(country);
    const flag = formatters.flagEmoji(code);
    const flagKey = `f${index}`;
    const url = formatters.flagUrl(code);
    if (url) {
      rich[flagKey] = { height: 14, width: 20, backgroundColor: { image: url } };
      return `{${flagKey}|} ${country.name}`;
    }
    return `${flag || '🌍'} ${country.name}`;
  });

  chart.setOption({
    ...chartBackground(),
    animationDuration: 560,
    grid: { ...baseGrid(), left: 12, right: 24, top: 16, bottom: 8 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter(params) {
        const index = params[0]?.dataIndex ?? 0;
        const country = countries[index];
        if (!country) return '';
        return [
          `<strong>${country.name}</strong>`,
          `Spend: ${formatters.currency(country.spend)}`,
          `Conversions: ${formatters.number(country.conversions)}`,
          `CPA: ${formatters.cpa(country)}`,
          `CTR: ${formatters.percent(formatters.ctr(country))}`
        ].join('<br/>');
      }
    },
    xAxis: { type: 'value', ...axisStyle() },
    yAxis: {
      type: 'category',
      data: axisLabels,
      inverse: true,
      ...axisStyle(),
      axisLabel: { color: '#dce6dc', fontSize: 10, width: 190, overflow: 'truncate', rich }
    },
    series: [{
      name: 'Spend',
      type: 'bar',
      data: spend.map((value) => ({
        value,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: COLORS.spend },
            { offset: 1, color: COLORS.spendDeep }
          ])
        }
      })),
      barMaxWidth: 18,
      emphasis: { focus: 'series', itemStyle: { shadowBlur: 14, shadowColor: 'rgba(170, 255, 0, 0.35)' } }
    }]
  }, true);

  chart.off('click');
  if (onCountryClick) {
    chart.on('click', (event) => {
      const country = countries[event.dataIndex];
      if (country) onCountryClick(country.name);
    });
  }
  chart.resize();
}
