import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Text,
} from "react-native";

type PrivacyPolicyModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function PrivacyPolicyModal({
  visible,
  onClose,
}: PrivacyPolicyModalProps) {
  return (
    <Modal
      animationType="slide"
      visible={visible}
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <Text style={styles.modalBody}>
              {`Effective Date: June 12, 2025

At Cricket Buddy, your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you use our cricket notes application (“the App”). By using Cricket Buddy, you agree to the practices described below.

1. Information We Collect

a. Personal Information
- When you sign in using Google, we collect your name, email address, and Google profile picture to create and manage your account.
- We do not collect your password or sensitive authentication data.

b. Usage Data
- We collect information about how you use the App, such as the features you access, notes you create, and your interactions with cricket content.
- We may collect device information (such as device type, operating system, and app version) for analytics and troubleshooting.

2. How We Use Your Information

- To provide, maintain, and improve the App’s features and your user experience.
- To authenticate your identity and secure your account using Google OAuth and Firebase Authentication.
- To personalize your experience, such as saving your cricket notes and preferences.
- To communicate important updates, service information, or respond to your support requests.

3. Data Sharing and Disclosure

- We do not sell or rent your personal data to third parties.
- Your data may be shared with trusted service providers (such as Firebase) only to the extent necessary for app functionality and security.
- We may disclose information if required by law or to protect the rights, property, or safety of Cricket Buddy, its users, or others.

4. Data Security

- We use industry-standard security measures, including encryption and secure authentication, to protect your information.
- Access to your data is restricted to authorized personnel only.

5. Data Retention

- Your notes and personal data are retained as long as your account is active or as needed to provide you with the App’s services.
- You may delete your notes or request account deletion at any time via the app or by contacting support.

6. Your Rights

- You can access, update, or delete your personal information at any time through the App.
- You may withdraw your consent for data processing by deleting your account.

7. Children’s Privacy

- Cricket Buddy is not intended for children under 13. We do not knowingly collect personal information from children under 13.

8. Changes to This Policy

- We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy in the App.

9. Contact Us

If you have any questions or concerns about this Privacy Policy or your data, please contact us at:
Email: support@cricketbuddy.app

By using Cricket Buddy, you acknowledge that you have read and understood this Privacy Policy.
`}
            </Text>
          </ScrollView>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)", // Darker blur as requested
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#0A3D2C",
    textAlign: "center",
  },
  modalBody: {
    fontSize: 15,
    color: "#333",
    marginBottom: 20,
    textAlign: "left",
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: {
    color: "#0A3D2C",
    fontWeight: "bold",
    fontSize: 16,
  },
});
