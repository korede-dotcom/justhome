"use client"

import { useState } from "react"
import { toast } from "sonner"

const SettingsPage = () => {
  const [currentUser] = useState(() => {
    const user = localStorage.getItem("currentUser")
    return user ? JSON.parse(user) : null
  })
  const [currentRole] = useState(() => {
    return localStorage.getItem("currentRole") || "Attendee"
  })

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "Just Homes Interior Designs",
    companyEmail: "info@justhomes.com",
    companyPhone: "+1 (555) 123-4567",
    companyAddress: "123 Design Street, Interior City, IC 12345",
    timezone: "America/New_York",
    currency: "USD",
    language: "en",
    dateFormat: "MM/DD/YYYY"
  })

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    inventoryAlerts: true,
    systemAlerts: true,
    marketingEmails: false
  })

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90",
    loginAttempts: "5",
    ipWhitelist: "",
    auditLogging: true
  })

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    cacheEnabled: true,
    backupFrequency: "daily",
    logLevel: "info",
    maxFileSize: "10",
    allowRegistration: true
  })

  const handleSaveGeneral = () => {
    toast.success("General settings saved successfully!")
  }

  const handleSaveNotifications = () => {
    toast.success("Notification settings saved successfully!")
  }

  const handleSaveSecurity = () => {
    toast.success("Security settings saved successfully!")
  }

  const handleSaveSystem = () => {
    toast.success("System settings saved successfully!")
  }

  const handleBackupDatabase = () => {
    toast.success("Database backup initiated successfully!")
  }

  const handleRestoreDatabase = () => {
    toast.success("Database restore initiated successfully!")
  }

  const handleClearCache = () => {
    toast.success("System cache cleared successfully!")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-3xl font-semibold mb-6">System Settings</h1>

      {/* General Settings */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-medium mb-4">General Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="border p-2 rounded"
            placeholder="Company Name"
            value={generalSettings.companyName}
            onChange={(e) =>
              setGeneralSettings({ ...generalSettings, companyName: e.target.value })
            }
          />
          <input
            className="border p-2 rounded"
            placeholder="Company Email"
            value={generalSettings.companyEmail}
            onChange={(e) =>
              setGeneralSettings({ ...generalSettings, companyEmail: e.target.value })
            }
          />
          <input
            className="border p-2 rounded"
            placeholder="Phone"
            value={generalSettings.companyPhone}
            onChange={(e) =>
              setGeneralSettings({ ...generalSettings, companyPhone: e.target.value })
            }
          />
          <input
            className="border p-2 rounded"
            placeholder="Address"
            value={generalSettings.companyAddress}
            onChange={(e) =>
              setGeneralSettings({ ...generalSettings, companyAddress: e.target.value })
            }
          />
        </div>
        <button
          onClick={handleSaveGeneral}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save General Settings
        </button>
      </div>

      {/* Notification Settings */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-medium mb-4">Notification Settings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={() =>
                  setNotificationSettings({
                    ...notificationSettings,
                    [key]: !value,
                  })
                }
              />
              <span>{key}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleSaveNotifications}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Notification Settings
        </button>
      </div>

      {/* Security Settings */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-medium mb-4">Security Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(securitySettings).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium">{key}</label>
              <input
                className="border p-2 w-full rounded"
                type={typeof value === "boolean" ? "checkbox" : "text"}
                checked={typeof value === "boolean" ? value : undefined}
                value={typeof value === "string" ? value : undefined}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    [key]: typeof value === "boolean" ? e.target.checked : e.target.value,
                  })
                }
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveSecurity}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Security Settings
        </button>
      </div>

      {/* System Settings */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-medium mb-4">System Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(systemSettings).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium">{key}</label>
              <input
                className="border p-2 w-full rounded"
                type={typeof value === "boolean" ? "checkbox" : "text"}
                checked={typeof value === "boolean" ? value : undefined}
                value={typeof value === "string" ? value : undefined}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    [key]: typeof value === "boolean" ? e.target.checked : e.target.value,
                  })
                }
              />
            </div>
          ))}
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleSaveSystem}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save System Settings
          </button>
          <button
            onClick={handleBackupDatabase}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Backup DB
          </button>
          <button
            onClick={handleRestoreDatabase}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Restore DB
          </button>
          <button
            onClick={handleClearCache}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
