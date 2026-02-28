package com.alchemistspath.game;

import android.app.Activity;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DynamicIcon")
public class DynamicIconPlugin extends Plugin {
    
    @PluginMethod
    public void setIcon(PluginCall call) {
        String iconName = call.getString("icon", "default");
        
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("动态图标需要 Android 8.0 (API 26) 或更高版本");
            return;
        }
        
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("无法获取 Activity");
            return;
        }
        
        try {
            PackageManager pm = activity.getPackageManager();
            String packageName = activity.getPackageName();
            String activityName = activity.getClass().getName();
            
            // 可用的图标别名
            String[] aliases = {"default", "icon1", "icon2", "icon3", "icon4", "icon5"};
            
            // 禁用所有别名
            for (String alias : aliases) {
                ComponentName componentName = new ComponentName(packageName, 
                    activityName + "." + alias);
                int state = alias.equals(iconName) ? 
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED : 
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
                pm.setComponentEnabledSetting(componentName, state, PackageManager.DONT_KILL_APP);
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("icon", iconName);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("切换图标失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.O);
        call.resolve(result);
    }
}
