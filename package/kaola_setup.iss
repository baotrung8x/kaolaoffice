; Script generated for Inno Setup - Kaola Office
#define MyAppName "Kaola Office"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "Kaola"
#define MyAppURL "https://id.kaola.vn"
#define MyAppExeName "KaolaOffice.exe"
#define MyAppAssocName "Tài liệu " + MyAppName
#define MyAppAssocExt ".docx"
#define MyAppAssocKey "KaolaOffice.docx"

[Setup]
AppId={{E6F7D891-3C4D-4E90-95A2-B7F0E8C5D3E1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\KaolaOffice
ChangesAssociations=yes
DisableProgramGroupPage=yes
OutputBaseFilename=KaolaOffice_Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
SetupIconFile=..\app\app.ico
WizardImageFile=wizard_large.bmp
WizardSmallImageFile=wizard_small.bmp
UninstallDisplayIcon={app}\app.ico
ShowLanguageDialog=no

[Languages]
Name: "vietnamese"; MessagesFile: "Vietnamese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.bak,*.tmp,updatesvc.exe"
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"; AppUserModelID: "Kaola.Office.v1"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"; AppUserModelID: "Kaola.Office.v1"; Tasks: desktopicon

[Registry]
; Cài đặt ngôn ngữ mặc định là Tiếng Việt (vi-VN)
Root: HKCU; Subkey: "Software\ONLYOFFICE\DesktopEditors"; ValueType: string; ValueName: "langid"; ValueData: "vi-VN"

; Đăng ký AppUserModelId để Windows Taskbar luôn nhận đúng Icon Kaola Office
Root: HKCU; Subkey: "Software\Classes\AppUserModelId\Kaola.Office.v1"; ValueType: string; ValueName: "DisplayName"; ValueData: "Kaola Office"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Classes\AppUserModelId\Kaola.Office.v1"; ValueType: string; ValueName: "IconUri"; ValueData: "{app}\app.ico"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Classes\AppUserModelId\ASC.Documents.5"; ValueType: string; ValueName: "DisplayName"; ValueData: "Kaola Office"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Classes\AppUserModelId\ASC.Documents.5"; ValueType: string; ValueName: "IconUri"; ValueData: "{app}\app.ico"; Flags: uninsdeletevalue


; ==========================================================
; Đăng ký File Association cho nhóm Word (.docx, .doc, .dotx, .dotm, .rtf, .odt)
; ==========================================================
Root: HKA; Subkey: "Software\Classes\KaolaOffice.docx"; ValueType: string; ValueName: ""; ValueData: "Tài liệu Kaola Office"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\KaolaOffice.docx\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\icons\docx.ico"
Root: HKA; Subkey: "Software\Classes\KaolaOffice.docx\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

Root: HKA; Subkey: "Software\Classes\.docx\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.docx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.doc\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.docx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.dotx\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.docx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.dotm\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.docx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.rtf\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.docx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.odt\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.docx"; ValueData: ""; Flags: uninsdeletevalue

; ==========================================================
; Đăng ký File Association cho nhóm Excel (.xlsx, .xls, .xlsm, .xltx, .csv, .ods)
; ==========================================================
Root: HKA; Subkey: "Software\Classes\KaolaOffice.xlsx"; ValueType: string; ValueName: ""; ValueData: "Bảng tính Kaola Office"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\KaolaOffice.xlsx\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\icons\xlsx.ico"
Root: HKA; Subkey: "Software\Classes\KaolaOffice.xlsx\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

Root: HKA; Subkey: "Software\Classes\.xlsx\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.xlsx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.xls\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.xlsx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.xlsm\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.xlsx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.xltx\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.xlsx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.csv\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.xlsx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.ods\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.xlsx"; ValueData: ""; Flags: uninsdeletevalue

; ==========================================================
; Đăng ký File Association cho nhóm PowerPoint (.pptx, .ppt, .potx, .ppsx, .odp)
; ==========================================================
Root: HKA; Subkey: "Software\Classes\KaolaOffice.pptx"; ValueType: string; ValueName: ""; ValueData: "Bài thuyết trình Kaola Office"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\KaolaOffice.pptx\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\icons\pptx.ico"
Root: HKA; Subkey: "Software\Classes\KaolaOffice.pptx\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

Root: HKA; Subkey: "Software\Classes\.pptx\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.pptx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.ppt\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.pptx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.potx\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.pptx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.ppsx\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.pptx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.odp\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.pptx"; ValueData: ""; Flags: uninsdeletevalue

; ==========================================================
; Đăng ký File Association cho nhóm PDF (.pdf)
; ==========================================================
Root: HKA; Subkey: "Software\Classes\KaolaOffice.pdf"; ValueType: string; ValueName: ""; ValueData: "Tài liệu PDF Kaola Office"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\KaolaOffice.pdf\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\icons\pdf.ico"
Root: HKA; Subkey: "Software\Classes\KaolaOffice.pdf\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

Root: HKA; Subkey: "Software\Classes\.pdf\OpenWithProgids"; ValueType: string; ValueName: "KaolaOffice.pdf"; ValueData: ""; Flags: uninsdeletevalue

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
procedure SHChangeNotify(wEventId: Integer; uFlags: Cardinal; dwItem1, dwItem2: Integer);
  external 'SHChangeNotify@shell32.dll stdcall';

const
  SHCNE_ASSOCCHANGED = $08000000;
  SHCNF_IDLIST = $0000;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    try
      SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, 0, 0);
    except
    end;
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    try
      SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, 0, 0);
    except
    end;
  end;
end;
