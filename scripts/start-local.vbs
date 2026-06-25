scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
arguments = "/k """ & scriptDir & "\start-local.cmd"""
CreateObject("Shell.Application").ShellExecute "cmd.exe", arguments, scriptDir, "open", 1
