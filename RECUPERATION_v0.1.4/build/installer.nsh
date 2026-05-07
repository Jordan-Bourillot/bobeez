; ============================================================
;  Bobeez — installer customizations
;
;  Ajoute un dialogue Oui/Non "Voulez-vous un raccourci bureau ?"
;  juste après le choix du dossier d'install. Approche MessageBox
;  native Win32 — fiable sur toutes les machines Windows (les
;  custom pages nsDialogs peuvent échouer silencieusement avec
;  certains antivirus / versions de NSIS).
;
;  Les macros customXxx sont des points d'extension fournis par
;  electron-builder. Elles sont inlinées dans son script principal
;  à des endroits précis : voir https://www.electron.build/configuration/nsis
; ============================================================

!include "MUI2.nsh"
!include "LogicLib.nsh"

; --- Code script-level (Var) injecté avant la Section install ---
!macro customHeader
  Var BzWantDesktop
!macroend

; --- Valeur par défaut : oui (avant que le dialogue n'apparaisse) ---
!macro preInit
  StrCpy $BzWantDesktop "1"
!macroend

; --- Force install per-user pour éviter le double-launch UAC ---
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

; --- Question Oui/Non juste après le choix du dossier d'install ---
!macro customPageAfterChangeDir
  Page custom BzDesktopShortcutAsk
!macroend

Function BzDesktopShortcutAsk
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Voulez-vous créer un raccourci Bobeez sur votre Bureau ?$\n$\n(Oui = icône sur le bureau pour lancer Bobeez en un clic — Non = pas de raccourci)" \
    /SD IDYES \
    IDYES bz_yes IDNO bz_no
  bz_yes:
    StrCpy $BzWantDesktop "1"
    Goto bz_done
  bz_no:
    StrCpy $BzWantDesktop "0"
  bz_done:
  Abort  ; on a fait le job via MessageBox, on saute la page custom NSIS
FunctionEnd

; --- Création du raccourci selon le choix utilisateur ---
!macro customInstall
  ${If} $BzWantDesktop == "1"
    CreateShortCut "$DESKTOP\${PRODUCT_FILENAME}.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe" "" "$INSTDIR\${PRODUCT_FILENAME}.exe" 0
  ${EndIf}
!macroend

; --- Suppression du raccourci à la désinstallation ---
!macro customUnInstall
  Delete "$DESKTOP\${PRODUCT_FILENAME}.lnk"
!macroend
