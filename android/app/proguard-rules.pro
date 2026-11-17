# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ---- InnovApp ----
# Plugins nativos propios (Imprimir, Archivos) y de Capacitor: los registra Capacitor por reflexión.
-keep class pe.innovacontratistas.app.** { *; }
# Compras con Google Play (cordova-plugin-purchase): Cordova crea el plugin por su nombre (config.xml).
-keep class cc.fovea.** { *; }
-keep class org.apache.cordova.** { *; }
# Puente JS ↔ nativo del WebView.
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
# Informes de errores legibles en Play Console (se sube mapping.txt).
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile
