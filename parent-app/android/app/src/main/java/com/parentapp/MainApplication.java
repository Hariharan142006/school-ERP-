package com.parentapp;

import android.app.Application;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return false;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return false;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();

    // Catch any native or RN crash and display it on CrashDisplayActivity instead of closing
    Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
      @Override
      public void uncaughtException(Thread thread, Throwable throwable) {
        android.util.Log.e("ParentAppCrash", "FATAL CRASH:", throwable);
        try {
          android.content.Intent intent = new android.content.Intent(MainApplication.this, CrashDisplayActivity.class);
          intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK | android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK);
          intent.putExtra("error", android.util.Log.getStackTraceString(throwable));
          startActivity(intent);
        } catch (Exception e) {
          android.util.Log.e("ParentAppCrash", "Failed to launch crash activity", e);
        }
        android.os.Process.killProcess(android.os.Process.myPid());
        System.exit(10);
      }
    });

    SoLoader.init(this, /* native exopackage */ false);
  }
}
