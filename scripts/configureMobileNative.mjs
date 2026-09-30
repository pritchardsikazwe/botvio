import fs from "node:fs";

const androidManifest = "android/app/src/main/AndroidManifest.xml";
if (fs.existsSync(androidManifest)) {
  let xml = fs.readFileSync(androidManifest, "utf8");
  if (!xml.includes("botvio://auth/callback") && xml.includes("<activity")) {
    const filter = [
      '<intent-filter android:autoVerify="false">',
      '<action android:name="android.intent.action.VIEW" />',
      '<category android:name="android.intent.category.DEFAULT" />',
      '<category android:name="android.intent.category.BROWSABLE" />',
      '<data android:scheme="botvio" android:host="auth" android:path="/callback" />',
      "</intent-filter>",
    ].join("\n");
    xml = xml.replace("</activity>", filter + "\n</activity>");
    fs.writeFileSync(androidManifest, xml);
  }
}

const iosInfo = "ios/App/App/Info.plist";
if (fs.existsSync(iosInfo)) {
  let plist = fs.readFileSync(iosInfo, "utf8");
  if (!plist.includes("<string>botvio</string>")) {
    const block = [
      "  <key>CFBundleURLTypes</key>",
      "  <array>",
      "    <dict>",
      "      <key>CFBundleTypeRole</key>",
      "      <string>Editor</string>",
      "      <key>CFBundleURLSchemes</key>",
      "      <array>",
      "        <string>botvio</string>",
      "      </array>",
      "    </dict>",
      "  </array>",
    ].join("\n");
    plist = plist.replace("</dict>\n</plist>", block + "\n</dict>\n</plist>");
    fs.writeFileSync(iosInfo, plist);
  }
}
