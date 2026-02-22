import React from 'react';
import { Radio, Tooltip, Space } from 'antd';
import { BulbOutlined, BulbFilled, SyncOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useTranslation from '../utils/i18n';
import { useTheme } from '../context/ThemeContext';

// 样式化组件
const ThemeSwitch = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ThemeModeSelector = styled(Radio.Group)`
  display: flex;
  justify-content: space-between;
  background-color: ${props => props.theme.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  padding: 4px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};

  .ant-radio-button-wrapper {
    background: transparent;
    border: none !important;
    color: ${props => props.theme.isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'};
    
    &:not(:first-child)::before {
      display: none;
    }
    
    &:hover {
      color: ${props => props.theme.isDarkMode ? '#fff' : '#000'};
      background: ${props => props.theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
    }
    
    &.ant-radio-button-wrapper-checked {
      background: ${props => props.theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'white'};
      color: ${props => props.theme.isDarkMode ? '#fff' : '#1E88E5'};
      box-shadow: ${props => props.theme.isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
    }
  }
`;

interface ThemeSwitcherProps {
  compact?: boolean;
}

/**
 * 主题切换组件
 * 支持亮色、暗色和自动（跟随系统）三种模式
 */
const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { t } = useTranslation();
  const { isDarkMode, themeMode, setThemeMode } = useTheme();
  
  // 根据模式选择图标
  const getThemeIcon = () => {
    if (themeMode === 'dark' || (themeMode === 'auto' && isDarkMode)) {
      return <BulbOutlined />;
    }
    return <BulbFilled />;
  };
  
  // 紧凑模式只显示切换图标
  if (compact) {
    return (
      <Tooltip title={t('theme.toggleDarkMode')}>
        <div 
          onClick={() => setThemeMode(isDarkMode ? 'light' : 'dark')}
          style={{ 
            cursor: 'pointer', 
            padding: '8px', 
            borderRadius: '50%',
            transition: 'background 0.3s' 
          }}
        >
          {getThemeIcon()}
        </div>
      </Tooltip>
    );
  }
  
  return (
    <ThemeSwitch theme={{ isDarkMode }}>
      <Space direction="vertical" size={4}>
        <div style={{ fontSize: '13px', opacity: 0.85, marginLeft: '2px' }}>
          {t('theme.themeMode')}
        </div>
        <ThemeModeSelector 
          value={themeMode} 
          onChange={e => setThemeMode(e.target.value)}
          buttonStyle="solid"
          optionType="button"
          theme={{ isDarkMode }}
        >
          <Radio.Button value="light">
            <Space size={4}>
              <BulbFilled />
              {t('theme.light')}
            </Space>
          </Radio.Button>
          <Radio.Button value="dark">
            <Space size={4}>
              <BulbOutlined />
              {t('theme.dark')}
            </Space>
          </Radio.Button>
          <Radio.Button value="auto">
            <Space size={4}>
              <SyncOutlined />
              {t('theme.auto')}
            </Space>
          </Radio.Button>
        </ThemeModeSelector>
      </Space>
    </ThemeSwitch>
  );
};

export default ThemeSwitcher; 