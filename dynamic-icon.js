// 动态图标管理
// 需要 Android 8.0+ 才能使用

let DynamicIcon = null;

// 初始化 Capacitor 插件
function initDynamicIcon() {
    if (typeof Capacitor !== 'undefined') {
        if (Capacitor.Plugins && Capacitor.Plugins.DynamicIcon) {
            DynamicIcon = Capacitor.Plugins.DynamicIcon;
        } else if (Capacitor.getPlatform() === 'android') {
            // 等待插件加载
            setTimeout(initDynamicIcon, 100);
        }
    }
}

// 自动初始化
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDynamicIcon);
    } else {
        initDynamicIcon();
    }
}

/**
 * 切换应用图标
 * @param {string} iconName - 图标名称: 'default', 'icon1', 'icon2', 'icon3' 等
 * @returns {Promise<boolean>} 是否成功
 */
async function setAppIcon(iconName) {
    if (!DynamicIcon) {
        console.warn('动态图标插件未加载，可能不在 Android 环境中');
        return false;
    }
    
    try {
        const result = await DynamicIcon.setIcon({ icon: iconName });
        if (result.success) {
            console.log(`图标已切换为: ${iconName}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('切换图标失败:', error);
        return false;
    }
}

/**
 * 检查是否支持动态图标
 * @returns {Promise<boolean>}
 */
async function isIconChangeSupported() {
    if (!DynamicIcon) {
        return false;
    }
    
    try {
        const result = await DynamicIcon.isSupported();
        return result.supported || false;
    } catch (error) {
        console.error('检查支持状态失败:', error);
        return false;
    }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setAppIcon, isIconChangeSupported };
}
