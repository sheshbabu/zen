import { h, useState } from "../../assets/preact.esm.js";
import Button from "../../commons/components/Button.jsx";
import Input from "../../commons/components/Input.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import { showToast } from "../../commons/components/Toast.jsx";

export default function SecurityPane() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPasswordError, setOldPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  function handlePasswordSubmit(e) {
    e.preventDefault();

    setOldPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");

    if (!oldPassword.trim()) {
      setOldPasswordError("Current password is required");
      return;
    }

    if (!newPassword.trim()) {
      setNewPasswordError("New password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    if (oldPassword === newPassword) {
      setNewPasswordError("New password must be different");
      return;
    }

    setIsPasswordLoading(true);

    ApiClient.updatePassword({
      oldPassword: oldPassword,
      newPassword: newPassword
    })
      .then(() => {
        showToast("Password updated successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch((error) => {
        if (error.code === "INCORRECT_OLD_PASSWORD") {
          setOldPasswordError("Incorrect password");
        } else if (error.code === "INVALID_NEW_PASSWORD") {
          setNewPasswordError("New password must be different");
        } else {
          showToast("Failed to update password");
        }
      })
      .finally(() => {
        setIsPasswordLoading(false);
      });
  }

  function handleLogout() {
    setIsLogoutLoading(true);

    ApiClient.logout()
      .then(() => {
        showToast("Logged out successfully");
        window.location.reload();
      })
      .catch(() => {
        showToast("Failed to logout");
      })
      .finally(() => {
        setIsLogoutLoading(false);
      });
  }

  return (
    <div className="settings-tab-content">
      <h3>Change Password</h3>
      <p>Update your account password. You'll need to provide your current password.</p>

      <form className="settings-form" onSubmit={handlePasswordSubmit}>
        <Input
          id="current-password"
          label="Current Password"
          type="password"
          placeholder="Enter current password"
          value={oldPassword}
          error={oldPasswordError}
          isDisabled={isPasswordLoading}
          onChange={(e) => setOldPassword(e.target.value)}
        />

        <Input
          id="new-password"
          label="New Password"
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          error={newPasswordError}
          isDisabled={isPasswordLoading}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <Input
          id="confirm-password"
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          error={confirmPasswordError}
          isDisabled={isPasswordLoading}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" variant={`primary ${isPasswordLoading ? 'disabled' : ''}`} isDisabled={isPasswordLoading}>
          {isPasswordLoading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>

      <hr/>

      <h3>Session Management</h3>
      <p>Log out of your account. You'll need to sign in again.</p>

      <Button onClick={handleLogout} isDisabled={isLogoutLoading}>
        {isLogoutLoading ? 'Logging out...' : 'Log out'}
      </Button>
    </div>
  );
}