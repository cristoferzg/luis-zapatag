; Instalador de InnovApp para Windows (se compila con makensis, sin Wine).
Unicode true
!define APP "InnovApp"
!define EMPRESA "Innova Contratistas"
!define EXE "InnovApp.exe"
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}"

Name "${APP}"
OutFile "..\release\InnovApp-Setup-${VERSION}.exe"
InstallDir "$LOCALAPPDATA\Programs\${APP}"
InstallDirRegKey HKCU "Software\${APP}" "Carpeta"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "${EMPRESA}"
VIProductVersion "${VERSION}.0"
VIAddVersionKey /LANG=1034 "ProductName" "${APP}"
VIAddVersionKey /LANG=1034 "CompanyName" "${EMPRESA}"
VIAddVersionKey /LANG=1034 "FileDescription" "Instalador de ${APP}"
VIAddVersionKey /LANG=1034 "FileVersion" "${VERSION}"
VIAddVersionKey /LANG=1034 "LegalCopyright" "${EMPRESA}"

!include "MUI2.nsh"
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "lateral.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "lateral.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT
!define MUI_HEADERIMAGE_BITMAP "cabecera.bmp"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Bienvenido a ${APP}"
!define MUI_WELCOMEPAGE_TEXT "Se instalará ${APP}, el sistema de ${EMPRESA}, en este equipo.$\r$\n$\r$\nSe actualiza solo: cada mejora publicada llega al abrirlo, sin reinstalar.$\r$\n$\r$\nPulsa Siguiente para continuar."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Abrir ${APP} ahora"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Spanish"

Section "Instalar"
  ; Si el programa está abierto, se cierra para poder reemplazarlo.
  nsExec::Exec 'taskkill /F /IM "${EXE}"'
  Sleep 500
  SetOutPath "$INSTDIR"
  File /r "..\release\win-unpacked\*.*"
  CreateShortCut "$DESKTOP\${APP}.lnk" "$INSTDIR\${EXE}" "" "$INSTDIR\${EXE}" 0
  CreateShortCut "$SMPROGRAMS\${APP}.lnk" "$INSTDIR\${EXE}" "" "$INSTDIR\${EXE}" 0
  ; Avisos de Windows: el programa se registra con su identificador (el acceso directo lo arregla el programa al abrirse).
  WriteRegStr HKCU "Software\Classes\AppUserModelId\pe.innovacontratistas.pc" "DisplayName" "${APP}"
  WriteUninstaller "$INSTDIR\Desinstalar ${APP}.exe"
  WriteRegStr HKCU "Software\${APP}" "Carpeta" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "${APP} - ${EMPRESA}"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\${EXE}"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "${EMPRESA}"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Desinstalar ${APP}.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM "${EXE}"'
  Sleep 500
  Delete "$DESKTOP\${APP}.lnk"
  Delete "$SMPROGRAMS\${APP}.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${UNINST}"
  DeleteRegKey HKCU "Software\Classes\AppUserModelId\pe.innovacontratistas.pc"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "InnovApp"
  DeleteRegKey HKCU "Software\${APP}"
SectionEnd
