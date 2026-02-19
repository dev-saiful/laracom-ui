import type { ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#f97316',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#0ea5e9',
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBgElevated: '#ffffff',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
    colorTextBase: '#0f172a',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    colorTextQuaternary: '#cbd5e1',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    boxShadowSecondary: '0 4px 16px -2px rgb(0 0 0 / 0.10), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
    lineHeight: 1.6,
    lineHeightLG: 1.7,
    controlOutlineWidth: 2,
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Button: {
      borderRadius: 10,
      borderRadiusLG: 12,
      borderRadiusSM: 8,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: 600,
      primaryShadow: '0 4px 12px rgb(249 115 22 / 0.35)',
    },
    Input: {
      borderRadius: 10,
      borderRadiusLG: 12,
      controlHeight: 40,
      controlHeightLG: 48,
    },
    Select: {
      borderRadius: 10,
      borderRadiusLG: 12,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 14,
      boxShadow: '0 1px 3px rgb(0 0 0 / 0.06), 0 1px 6px rgb(0 0 0 / 0.04)',
      paddingLG: 24,
    },
    Table: {
      borderRadius: 14,
      headerBg: '#f8fafc',
      rowHoverBg: '#f8fafc',
    },
    Menu: {
      itemBorderRadius: 10,
      itemHeight: 44,
      subMenuItemBorderRadius: 8,
      activeBarBorderWidth: 0,
    },
    Tag: {
      borderRadius: 6,
    },
    Badge: {
      colorBgContainer: '#f97316',
    },
    Statistic: {
      titleFontSize: 13,
    },
    Pagination: {
      borderRadius: 8,
    },
    Modal: {
      borderRadius: 16,
    },
    Drawer: {
      borderRadius: 0,
    },
    Alert: {
      borderRadius: 10,
    },
    Form: {
      itemMarginBottom: 20,
    },
    Steps: {
      colorPrimary: '#f97316',
    },
  },
}
