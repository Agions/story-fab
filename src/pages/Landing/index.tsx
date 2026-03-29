/**
 * StoryForge Landing Page
 * 电影级 AI 视频创作平台首页
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './index.module.css';

// 功能特性数据
const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: '剧情分析',
    description: 'AI 深度理解视频叙事结构，自动识别高光时刻与情感曲线',
    badge: '核心功能',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
    title: '智能剪辑',
    description: '基于 AI 分析结果，一键生成专业级剪辑方案',
    badge: '高效创作',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    title: 'AI 配音',
    description: '多音色 AI 配音，支持中文、英文及多种方言',
    badge: '全新升级',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    title: '智能混剪',
    description: '自动识别节奏卡点，多素材智能拼接与转场',
    badge: null,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    title: '多格式导出',
    description: '剪映草稿、Premiere、Final Cut Pro、DaVinci Resolve',
    badge: null,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: '云端协作',
    description: '项目云端同步，跨设备无缝继续创作',
    badge: '即将上线',
  },
];

// 统计数据
const stats = [
  { value: '10+', label: 'AI 模型支持' },
  { value: '5min', label: '完成智能剪辑' },
  { value: '180+', label: '用户正在使用' },
  { value: '99.9%', label: '服务稳定性' },
];

// 步骤数据
const steps = [
  {
    number: '01',
    title: '导入素材',
    description: '支持多种视频格式，轻松导入原始素材',
  },
  {
    number: '02',
    title: 'AI 分析',
    description: '一键分析视频内容，识别剧情结构与高光',
  },
  {
    number: '03',
    title: '智能剪辑',
    description: 'AI 生成剪辑建议，可视化预览效果',
  },
  {
    number: '04',
    title: '导出成片',
    description: '多格式导出，适配各种平台需求',
  },
];

export const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={styles.landing}>
      {/* 导航栏 */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <svg viewBox="0 0 40 40" className={styles.logoIcon}>
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="32" height="32" rx="8" fill="url(#logoGradient)" />
              <path d="M14 12L28 20L14 28V12Z" fill="white" />
            </svg>
            <span className={styles.logoText}>StoryForge</span>
          </div>

          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>功能</a>
            <a href="#how" className={styles.navLink}>工作流</a>
            <a href="#pricing" className={styles.navLink}>定价</a>
          </div>

          <div className={styles.navActions}>
            <Link to="/login" className={styles.navLogin}>登录</Link>
            <Link to="/register" className={styles.btnPrimary}>免费开始</Link>
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGradient} />
          <div className={styles.heroGrid} />
        </div>

        <div className={`${styles.heroContent} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.heroBadge}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            AI 驱动的视频创作新时代
          </div>

          <h1 className={styles.heroTitle}>
            用 AI 讲述
            <br />
            <span className={styles.heroTitleAccent}>更精彩的故事</span>
          </h1>

          <p className={styles.heroDescription}>
            StoryForge 是一款 AI 驱动的视频创作平台。智能分析剧情、精准提取高光、
            <br />
            一键生成专业级剪辑，让创作变得前所未有的简单。
          </p>

          <div className={styles.heroActions}>
            <Link to="/editor" className={styles.btnHeroPrimary}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              立即开始创作
            </Link>
            <a href="#demo" className={styles.btnHeroSecondary}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="var(--bg-base)" />
              </svg>
              观看演示
            </a>
          </div>

          <div className={styles.heroStats}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.heroStat}>
                <span className={styles.heroStatValue}>{stat.value}</span>
                <span className={styles.heroStatLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 功能区域 */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>核心功能</span>
          <h2 className={styles.sectionTitle}>为创作者打造的强大功能</h2>
          <p className={styles.sectionDescription}>
            从剧情分析到智能剪辑，StoryForge 提供完整的 AI 视频创作解决方案
          </p>
        </div>

        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={styles.featureCard}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <div className={styles.featureContent}>
                <div className={styles.featureHeader}>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  {feature.badge && (
                    <span className={styles.featureBadge}>{feature.badge}</span>
                  )}
                </div>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 工作流区域 */}
      <section id="how" className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>工作流</span>
          <h2 className={styles.sectionTitle}>简单四步，完成专业级创作</h2>
        </div>

        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div key={index} className={styles.stepCard}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
              {index < steps.length - 1 && <div className={styles.stepArrow} />}
            </div>
          ))}
        </div>
      </section>

      {/* CTA 区域 */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>准备好开始创作了吗？</h2>
          <p className={styles.ctaDescription}>
            立即加入 StoryForge，开启 AI 驱动的视频创作之旅
          </p>
          <div className={styles.ctaActions}>
            <Link to="/register" className={styles.btnCtaPrimary}>
              免费开始
            </Link>
            <Link to="/pricing" className={styles.btnCtaSecondary}>
              查看定价
            </Link>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <svg viewBox="0 0 40 40" className={styles.logoIcon}>
                <defs>
                  <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <rect x="4" y="4" width="32" height="32" rx="8" fill="url(#logoGradient2)" />
                <path d="M14 12L28 20L14 28V12Z" fill="white" />
              </svg>
              <span className={styles.logoText}>StoryForge</span>
            </div>
            <p className={styles.footerTagline}>
              AI 驱动的视频创作平台
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>产品</h4>
              <a href="#features">功能介绍</a>
              <a href="#pricing">定价方案</a>
              <a href="#changelog">更新日志</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>资源</h4>
              <a href="#docs">文档中心</a>
              <a href="#api">API 接口</a>
              <a href="#support">技术支持</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>关于</h4>
              <a href="#about">关于我们</a>
              <a href="#blog">博客</a>
              <a href="#contact">联系我们</a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; 2025-2026 StoryForge. All rights reserved.</p>
          <div className={styles.footerSocial}>
            <a href="#github" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a href="#twitter" aria-label="Twitter">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 0 0-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 0 0-.666 2.475c0 .61.075 1.215.225 1.79a13.44 13.44 0 0 0 6.105 2.105c-.62-.02-1.2-.185-1.695-.49v.06a4.935 4.935 0 0 0 3.945 4.835 4.95 4.95 0 0 1-2.22.08 4.936 4.936 0 0 0 4.604 3.42 9.866 9.866 0 0 1-6.1 2.09c-.39 0-.775-.02-1.155-.065a13.41 13.41 0 0 0 7.365 2.11c8.815 0 13.647-7.27 13.647-13.575 0-.21 0-.42-.015-.63A9.726 9.726 0 0 0 24 4.59z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
