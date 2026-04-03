[Setup]
AppName=Ninja Games Kiosk
AppId={{B5E2F8A1-3C4D-4E6F-9A8B-1C2D3E4F5A6B}
AppVersion=3.0.0
AppPublisher=Ninja Games
DefaultDirName={autopf}\NinjaKiosk
DefaultGroupName=Ninja Games Kiosk
OutputDir=C:\Users\vip-2\Desktop
OutputBaseFilename=NinjaKiosk-Setup
Compression=lzma2/ultra64
SolidCompression=yes
PrivilegesRequired=admin
UninstallDisplayName=Ninja Games Kiosk v3.0
DisableProgramGroupPage=yes
WizardStyle=modern
CloseApplications=force
RestartApplications=no

[Files]
; Kiosk client (self-contained .NET publish)
Source: "C:\Users\vip-2\Desktop\NinjaKiosk\NinjaKiosk\bin\Release\net8.0-windows\win-x64\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\vip-2\Desktop\NinjaKiosk\restore-shell.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{commondesktop}\Ninja Games Kiosk"; Filename: "{app}\NinjaKiosk.exe"; WorkingDir: "{app}"
Name: "{group}\Ninja Games Kiosk"; Filename: "{app}\NinjaKiosk.exe"; WorkingDir: "{app}"
Name: "{group}\Uninstall Ninja Games Kiosk"; Filename: "{uninstallexe}"
Name: "{group}\Restore Normal Desktop"; Filename: "{app}\restore-shell.bat"; WorkingDir: "{app}"

[Registry]
; Replace Windows shell with NinjaKiosk — kiosk mode on boot
Root: HKCU; Subkey: "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"; ValueType: string; ValueName: "Shell"; ValueData: """{app}\NinjaKiosk.exe"""; Flags: uninsdeletevalue; Check: IsKioskShell
; Disable Task Manager
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Policies\System"; ValueType: dword; ValueName: "DisableTaskMgr"; ValueData: "1"; Flags: uninsdeletevalue; Check: IsKioskShell
; Disable Lock Workstation
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Policies\System"; ValueType: dword; ValueName: "DisableLockWorkstation"; ValueData: "1"; Flags: uninsdeletevalue; Check: IsKioskShell
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Policies\System"; ValueType: dword; ValueName: "DisableChangePassword"; ValueData: "1"; Flags: uninsdeletevalue; Check: IsKioskShell
; Disable Sign Out
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Policies\Explorer"; ValueType: dword; ValueName: "NoLogoff"; ValueData: "1"; Flags: uninsdeletevalue; Check: IsKioskShell

[Run]
Filename: "{app}\NinjaKiosk.exe"; Parameters: "{code:GetLaunchParams}"; Description: "Launch Ninja Games Kiosk"; Flags: nowait postinstall skipifsilent runascurrentuser

[InstallDelete]
Type: filesandordirs; Name: "{app}\*"

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[UninstallRun]
; Restore shell on uninstall
Filename: "reg.exe"; Parameters: "delete ""HKCU\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"" /v Shell /f"; Flags: runhidden
; Re-enable Task Manager
Filename: "reg.exe"; Parameters: "delete ""HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System"" /v DisableTaskMgr /f"; Flags: runhidden
Filename: "reg.exe"; Parameters: "delete ""HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System"" /v DisableLockWorkstation /f"; Flags: runhidden
Filename: "reg.exe"; Parameters: "delete ""HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System"" /v DisableChangePassword /f"; Flags: runhidden
Filename: "reg.exe"; Parameters: "delete ""HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer"" /v NoLogoff /f"; Flags: runhidden

[Code]
var
  ModePage: TInputOptionWizardPage;
  PcNamePage: TInputQueryWizardPage;
  ServerIpPage: TInputQueryWizardPage;
  ShellPage: TInputOptionWizardPage;

procedure InitializeWizard;
begin
  // Page 1: Installation Mode
  ModePage := CreateInputOptionPage(wpWelcome,
    'Installation Mode', 'Choose how this PC will be used',
    'Select the role for this PC in your gaming center:',
    True, False);
  ModePage.Add('Client PC — Gaming station (connects to LAN server or cloud)');
  ModePage.Add('Server PC — Hosts the kiosk web app for LAN clients');
  ModePage.SelectedValueIndex := 0;

  // Page 2: PC Name
  PcNamePage := CreateInputQueryPage(ModePage.ID,
    'PC Registration', 'Enter a name for this gaming station',
    'This name appears in the admin panel. Use something like PC-01, PC-02, VIP-01.');
  PcNamePage.Add('PC Name:', False);
  PcNamePage.Values[0] := 'PC-01';

  // Page 3: Server IP (for client mode)
  ServerIpPage := CreateInputQueryPage(PcNamePage.ID,
    'LAN Server', 'Enter the LAN server IP (optional)',
    'Leave blank for auto-detect. The kiosk will scan the LAN for the server automatically.' + #13#10 +
    'Only fill this if auto-detect does not work.');
  ServerIpPage.Add('Server IP (e.g. 192.168.1.23):', False);
  ServerIpPage.Values[0] := '';

  // Page 4: Shell replacement (kiosk lockdown)
  ShellPage := CreateInputOptionPage(ServerIpPage.ID,
    'Kiosk Lockdown', 'Replace Windows desktop with kiosk?',
    'If enabled, NinjaKiosk replaces Explorer as the Windows shell. ' +
    'The PC boots directly into kiosk mode with no desktop, taskbar, or Start menu. ' +
    'Type "ghanemexit" to exit kiosk mode. Recommended for gaming stations.',
    True, False);
  ShellPage.Add('Yes — Full kiosk lockdown (recommended for client PCs)');
  ShellPage.Add('No — Normal desktop, kiosk runs as an app');
  ShellPage.SelectedValueIndex := 0;
end;

function IsServerMode: Boolean;
begin
  Result := (ModePage.SelectedValueIndex = 1);
end;

function IsKioskShell: Boolean;
begin
  Result := (ShellPage.SelectedValueIndex = 0);
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;
  // Skip Server IP page in server mode
  if (PageID = ServerIpPage.ID) and IsServerMode then
    Result := True;
  // Skip shell replacement page in server mode (server doesn't need lockdown)
  if (PageID = ShellPage.ID) and IsServerMode then
    Result := True;
end;

function GetPcName(Param: String): String;
begin
  Result := PcNamePage.Values[0];
end;

function GetServerIp(Param: String): String;
begin
  Result := ServerIpPage.Values[0];
end;

function GetLaunchParams(Param: String): String;
var
  Params: String;
begin
  Params := '--pc-name=' + PcNamePage.Values[0];
  if (not IsServerMode) and (ServerIpPage.Values[0] <> '') then
    Params := Params + ' --server-ip=' + ServerIpPage.Values[0];
  Result := Params;
end;

procedure SaveLanConfig;
var
  ConfigDir, ConfigFile: String;
begin
  ConfigDir := ExpandConstant('{userappdata}') + '\ninja-games-kiosk';
  ForceDirectories(ConfigDir);

  if IsServerMode then
  begin
    // Server mode: save own IP as server
    ConfigFile := ConfigDir + '\lan-config.json';
    SaveStringToFile(ConfigFile, '{"serverIp":"127.0.0.1","isServer":true}', False);
  end
  else if ServerIpPage.Values[0] <> '' then
  begin
    // Client mode with explicit IP
    ConfigFile := ConfigDir + '\lan-config.json';
    SaveStringToFile(ConfigFile, '{"serverIp":"' + ServerIpPage.Values[0] + '"}', False);
  end;
end;

procedure SetupFirewall;
var
  ResultCode: Integer;
begin
  // Allow port 3000
  Exec('netsh.exe', 'advfirewall firewall delete rule name="NinjaKiosk LAN TCP 3000"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec('netsh.exe', 'advfirewall firewall add rule name="NinjaKiosk LAN TCP 3000" dir=in action=allow protocol=TCP localport=3000 profile=any', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec('netsh.exe', 'advfirewall firewall add rule name="NinjaKiosk LAN TCP 3000 Out" dir=out action=allow protocol=TCP remoteport=3000 profile=any', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Allow the kiosk exe
  Exec('netsh.exe', 'advfirewall firewall delete rule name="NinjaKiosk App"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec('netsh.exe', 'advfirewall firewall add rule name="NinjaKiosk App" dir=in action=allow program="' + ExpandConstant('{app}') + '\NinjaKiosk.exe" profile=any', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Enable network discovery
  Exec('netsh.exe', 'advfirewall firewall set rule group="Network Discovery" new enable=Yes', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  OldUninstaller, OldDir: String;
begin
  Result := '';

  // Kill running instances
  Exec('taskkill.exe', '/F /IM NinjaKiosk.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(1000);

  // Remove old installs
  OldDir := ExpandConstant('{localappdata}') + '\Programs\NinjaKiosk';
  OldUninstaller := OldDir + '\unins000.exe';
  if FileExists(OldUninstaller) then
  begin
    Exec(OldUninstaller, '/VERYSILENT /NORESTART /SUPPRESSMSGBOXES', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Sleep(2000);
    DelTree(OldDir, True, True, True);
  end;

  OldDir := ExpandConstant('{autopf}') + '\NinjaKiosk';
  OldUninstaller := OldDir + '\unins000.exe';
  if FileExists(OldUninstaller) then
  begin
    Exec(OldUninstaller, '/VERYSILENT /NORESTART /SUPPRESSMSGBOXES', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Sleep(2000);
    DelTree(OldDir, True, True, True);
  end;

  // Clean stale shell registry
  if RegQueryStringValue(HKCU, 'SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon', 'Shell', OldUninstaller) then
  begin
    if Pos('AppData', OldUninstaller) > 0 then
      RegDeleteValue(HKCU, 'SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon', 'Shell');
  end;

  // Kill again
  Exec('taskkill.exe', '/F /IM NinjaKiosk.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    SaveLanConfig;
    SetupFirewall;
  end;
end;
