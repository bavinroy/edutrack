New-NetFirewallRule -DisplayName "Allow Django Dev Server" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
Write-Host "Firewall rule added for port 8000. You should now be able to connect."
Pause

