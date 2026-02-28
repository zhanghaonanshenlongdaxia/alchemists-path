package com.alchemistspath.game;

import android.app.Activity;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.RequiresApi;

public class IconManager {
    private static final String DEFAULT_ALIAS = "MainActivity";
    
    /**
     * 动态切换应用图标（Android 8.0+）
     * @param activity 当前 Activity
     * @param iconAlias 图标别名，例如 "icon1", "icon2" 等
     */
    @RequiresApi(api = Build.VERSION_CODES.O)
    public static void setIcon(Activity activity, String iconAlias) {
        if (iconAlias == null || iconAlias.isEmpty()) {
            iconAlias = DEFAULT_ALIAS;
        }
        
        PackageManager pm = activity.getPackageManager();
        String packageName = activity.getPackageName();
        
        // 禁用所有别名
        String[] aliases = {DEFAULT_ALIAS, "icon1", "icon2", "icon3", "icon4", "icon5"};
        for (String alias : aliases) {
            ComponentName componentName = new ComponentName(packageName, 
                activity.getClass().getName() + "." + alias);
            int state = alias.equals(iconAlias) ? 
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED : 
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
            pm.setComponentEnabledSetting(componentName, state, PackageManager.DONT_KILL_APP);
        }
    }
    
    /**
     * 检查是否支持动态图标（需要 Android 8.0+）
     */
    public static boolean isSupported() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
    }
}
