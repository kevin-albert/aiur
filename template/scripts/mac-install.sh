#!/bin/bash

[ "$(uname -s)" == "Darwin" ] || exit 1

cat >~/Library/LaunchAgents/com.onezork.frobozz.Aiur.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
	<dict>
		<key>Label</key>
		<string>com.onezork.frobozz.Aiur</string>
    <key>ProgramArguments</key>
    <array>
    	<string>/Users/kevin/projects/nonsense/aiur/template/scripts/hello.sh</string>
    </array>
		<key>KeepAlive</key>
		<true/>
    <key>ThrottleInterval</key>
    <integer>30</integer>
	</dict>
</plist>
EOF

chmod 644 ~/Library/LaunchAgents/com.onezork.frobozz.Aiur.plist
launchctl load -w ~/Library/LaunchAgents/com.onezork.frobozz.Aiur.plist
