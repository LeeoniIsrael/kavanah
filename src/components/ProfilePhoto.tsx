import { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Linking,
  Platform,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Device from "expo-device";
import { File, Paths } from "expo-file-system";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { Camera, UserRound } from "./ui/icons";
import { useThemeColors } from "@/design/appearance";
import { confirmHaptic } from "@/services/haptics";

// One durable, account-scoped file. Never retain the picker's temporary URI.
export function profilePhotoFile(owner: string) {
  return new File(
    Paths.document,
    `profile-photo-${encodeURIComponent(owner)}.jpg`,
  );
}
export function ProfilePhoto({ owner, name }: { owner: string; name: string }) {
  const colors = useThemeColors();
  const [uri, setUri] = useState(() => {
    if (Platform.OS === "web") return null;
    const file = profilePhotoFile(owner);
    return file.exists ? file.uri : null;
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const choose = async (source: "camera" | "library") => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (source === "camera") {
        if (!Device.isDevice) {
          setMessage(
            "The simulator has no camera. Choose a photo, or use your iPhone to take one.",
          );
          return;
        }
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Camera access is off",
            "Allow camera access in Settings, or choose a photo instead.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Settings", onPress: () => void Linking.openSettings() },
            ],
          );
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        cameraType: ImagePicker.CameraType.front,
      };
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;
      const picked = new File(result.assets[0].uri);
      if (picked.size > 15 * 1024 * 1024) {
        setMessage("Choose a photo smaller than 15 MB.");
        return;
      }
      // Stage the replacement before touching the previous portrait.
      const target = profilePhotoFile(owner);
      const staged = new File(
        Paths.document,
        `profile-photo-${encodeURIComponent(owner)}-pending.jpg`,
      );
      if (staged.exists) staged.delete();
      await picked.copy(staged);
      await staged.move(target, { overwrite: true });
      setUri(`${target.uri}?v=${Date.now()}`);
      setMessage("Photo saved on this device.");
      void confirmHaptic();
    } catch {
      setMessage("Your photo couldn’t be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const remove = () => {
    try {
      const file = profilePhotoFile(owner);
      if (file.exists) file.delete();
      setUri(null);
      setMessage("Photo removed.");
      void confirmHaptic();
    } catch {
      setMessage("Your photo couldn’t be removed. Please try again.");
    }
  };
  const open = () => {
    if (Platform.OS === "web") { setMessage("Profile photos are available in the mobile app."); return; }
    if (Platform.OS === "ios") {
      const options = [
        "Take photo",
        "Choose photo",
        ...(uri ? ["Remove photo"] : []),
        "Cancel",
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          ...(uri ? { destructiveButtonIndex: 2 } : {}),
        },
        (index) => {
          if (index === 0) void choose("camera");
          if (index === 1) void choose("library");
          if (index === 2 && uri) remove();
        },
      );
    } else {
      Alert.alert("Profile photo", undefined, [
        { text: "Take photo", onPress: () => void choose("camera") },
        { text: "Choose photo", onPress: () => void choose("library") },
        ...(uri ? [{ text: "Remove photo", onPress: remove }] : []),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };
  return (
    <View style={{ gap: 12 }}>
      <Button
        variant="ghost"
        size="content"
        disabled={busy}
        onPress={open}
        accessibilityLabel={uri ? "Change profile photo" : "Add profile photo"}
        accessibilityState={{ busy }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
          paddingVertical: 8,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.blueSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: 88, height: 88, borderRadius: 44 }}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <UserRound size={32} color={colors.ink} />
          )}
          <View
            style={{
              position: "absolute",
              right: -2,
              bottom: 0,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.blue,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Camera size={16} color={colors.onAccent} />
          </View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="section">{name}</Text>
          <Text variant="body" style={{ color: colors.blue }}>
            {busy
              ? "Saving photo…"
              : uri
                ? "Change photo"
                : "Add a profile photo"}
          </Text>
          <Text variant="caption">
            Saved on this device. Not shared with Circle.
          </Text>
        </View>
      </Button>
      {message ? (
        <Text variant="caption" accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
