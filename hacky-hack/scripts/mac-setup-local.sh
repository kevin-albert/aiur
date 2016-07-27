#!/bin/bash
set -e

echo "attempting local install"
PLIST=~/Library/LaunchAgents/com.onezork.frobozz.Aiur.plist

cat >$PLIST <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
	<dict>
		<key>Label</key>
		<string>com.onezork.frobozz.Aiur</string>
    <key>ProgramArguments</key>
    <array>
			<string>$(which npm)</string>
			<string>--prefix</string>
    	<string>/usr/local/opt/aiur/z</string>
			<string>start</string>
    </array>
		<key>KeepAlive</key>
		<true/>
    <key>ThrottleInterval</key>
    <integer>30</integer>
	</dict>
</plist>
EOF

chmod 644 $PLIST
launchctl load $PLIST
launchctl start com.onezork.frobozz.Aiur
