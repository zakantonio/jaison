import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  KeyIcon,
  PlusIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { APIKeyResponse, APIKeyRequest } from "../types";
import { generateApiKey, listApiKeys, revokeApiKey } from "../services/api";
import "../styles/apiKeys.css";

const ApiKeys: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKeyResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [keyToDelete, setKeyToDelete] = useState<APIKeyResponse | null>(null);
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [newKeyExpiration, setNewKeyExpiration] = useState<number | null>(null);
  const [newKey, setNewKey] = useState<APIKeyResponse | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(true);

  // Load API keys on mount
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const keys = await listApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error("Error fetching API keys:", err);
      setError("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError("Key name is required");
      return;
    }

    try {
      const request: APIKeyRequest = {
        name: newKeyName.trim(),
        expires_in_days: newKeyExpiration,
      };
      const key = await generateApiKey(request);
      setNewKey(key);
      setApiKeys([key, ...apiKeys]);
      setNewKeyName("");
      setNewKeyExpiration(null);
    } catch (err) {
      console.error("Error creating API key:", err);
      setError("Failed to create API key");
    }
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    try {
      // Use key_id or id, whichever is available
      const keyId = keyToDelete.key_id || keyToDelete.id;
      if (!keyId) {
        throw new Error("API key ID is missing");
      }
      await revokeApiKey(keyId);
      setApiKeys(
        apiKeys.filter((key) => {
          const currentKeyId = key.key_id || key.id;
          return currentKeyId !== keyId;
        })
      );
      setIsDeleteModalOpen(false);
      setKeyToDelete(null);
    } catch (err) {
      console.error("Error revoking API key:", err);
      setError("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const truncateKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 12) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="api-keys-container">
      <div className="api-keys-header sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="api-keys-title">API Keys</h1>
          <p className="api-keys-subtitle">
            API keys are used to authenticate requests to the Jaison OCR API.
            Keep your API keys secure and never share them in public
            repositories or client-side code.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <button
            type="button"
            className="api-keys-button api-keys-button-primary inline-flex items-center justify-center px-4 py-2 rounded-md"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Create API Key
          </button>
        </div>
      </div>

      <div className="api-keys-info-box">
        <div className="flex">
          <div className="flex-shrink-0">
            <KeyIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="api-keys-info-content">
              <strong>Important:</strong> API keys grant full access to your
              account. Store them securely and use environment variables or
              secret management systems in your applications.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="api-keys-error-box">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2">
                <p className="api-keys-error-content">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="api-keys-loading">
            <div className="api-keys-spinner"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="api-keys-empty">
            <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="api-keys-empty-title">No API keys</h3>
            <p className="api-keys-empty-text">
              Get started by creating a new API key.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="api-keys-button api-keys-button-primary inline-flex items-center justify-center px-4 py-2 rounded-md"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <PlusIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                Create API Key
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="api-keys-filter">
              <label className="api-keys-filter-label">
                <input
                  type="checkbox"
                  className="api-keys-filter-checkbox"
                  checked={showOnlyActive}
                  onChange={(e) => setShowOnlyActive(e.target.checked)}
                />
                Show only active keys
              </label>
            </div>
            <div className="api-keys-list">
              <ul>
                {apiKeys
                  .filter((key) => (showOnlyActive ? key.is_active : true))
                  .map((key) => (
                    <li
                      key={key.key_id || key.id}
                      className="api-keys-list-item"
                    >
                      <div className="api-keys-list-row">
                        <div className="api-keys-list-left">
                          <div className="api-keys-list-name-container">
                            <div className="api-keys-list-name">
                              <p>{key.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="api-keys-list-right">
                          <div className="api-keys-list-key">
                            <span className="api-keys-list-key-value">
                              {key.key
                                ? truncateKey(key.key)
                                : "sk_FXl98lp...kPVYe"}
                            </span>
                          </div>
                          {key.is_active ? (
                            <span className="api-keys-list-badge api-keys-list-badge-active">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="api-keys-list-badge api-keys-list-badge-inactive">
                              INACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="api-keys-list-row">
                        <div className="api-keys-list-left">
                          <div className="api-keys-list-dates">
                            <p>
                              Created: {formatDate(key.created_at)}
                              {key.expires_at &&
                                ` • Expires: ${formatDate(key.expires_at)}`}
                              {key.last_used &&
                                ` • Last used: ${formatDate(key.last_used)}`}
                            </p>
                          </div>
                        </div>
                        <div className="api-keys-list-right">
                          <button
                            type="button"
                            className="api-keys-button-revoke"
                            onClick={() => {
                              setKeyToDelete(key);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Create API Key Modal */}
      <Transition.Root show={isCreateModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={setIsCreateModalOpen}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                {newKey ? (
                  <div className="api-keys-modal-content">
                    <div className="api-keys-modal-header">
                      <div className="api-keys-modal-icon api-keys-modal-icon-success">
                        <KeyIcon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <Dialog.Title as="h3" className="api-keys-modal-title">
                        API Key Created
                      </Dialog.Title>
                    </div>
                    <div className="api-keys-modal-body">
                      <p className="api-keys-modal-description">
                        Your new API key has been created. Please copy it now as
                        you won't be able to see it again.
                      </p>
                      <div className="mt-5">
                        <div className="api-keys-form-input-wrapper">
                          <input
                            type="text"
                            className="api-keys-form-input api-keys-form-input-readonly"
                            value={newKey.key || ""}
                            readOnly
                          />
                          <div className="api-keys-form-input-icon">
                            <button
                              type="button"
                              onClick={() =>
                                newKey.key && copyToClipboard(newKey.key)
                              }
                            >
                              <ClipboardDocumentIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                        {isCopied && (
                          <p className="api-keys-form-success">
                            Copied to clipboard!
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="api-keys-modal-actions">
                      <button
                        type="button"
                        className="api-keys-button api-keys-button-primary"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          setNewKey(null);
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="api-keys-modal-content">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                      <button
                        type="button"
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="api-keys-modal-header">
                      <div className="api-keys-modal-icon api-keys-modal-icon-create">
                        <KeyIcon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <Dialog.Title as="h3" className="api-keys-modal-title">
                        Create API Key
                      </Dialog.Title>
                    </div>
                    <div className="api-keys-modal-body">
                      <p className="api-keys-modal-description">
                        Create a new API key to access the OCR API. You will
                        only be shown the key once, so make sure to copy it.
                      </p>
                      <div className="mt-5">
                        <div className="api-keys-form-group">
                          <label
                            htmlFor="key-name"
                            className="api-keys-form-label"
                          >
                            Key Name
                          </label>
                          <input
                            type="text"
                            name="key-name"
                            id="key-name"
                            className="api-keys-form-input"
                            placeholder="e.g., Development Key"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                        </div>
                        <div className="api-keys-form-group">
                          <label
                            htmlFor="key-expiration"
                            className="api-keys-form-label"
                          >
                            Expiration (Optional)
                          </label>
                          <select
                            id="key-expiration"
                            name="key-expiration"
                            className="api-keys-form-select"
                            value={newKeyExpiration || ""}
                            onChange={(e) =>
                              setNewKeyExpiration(
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                          >
                            <option value="">Never expires</option>
                            <option value="30">30 days</option>
                            <option value="90">90 days</option>
                            <option value="180">180 days</option>
                            <option value="365">365 days</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="api-keys-modal-actions">
                      <button
                        type="button"
                        className="api-keys-button api-keys-button-secondary"
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="api-keys-button api-keys-button-primary"
                        onClick={handleCreateKey}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Delete API Key Modal */}
      <Transition.Root show={isDeleteModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={setIsDeleteModalOpen}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="api-keys-modal-content">
                  <div className="api-keys-modal-header">
                    <div className="api-keys-modal-icon api-keys-modal-icon-delete">
                      <ExclamationTriangleIcon
                        className="h-6 w-6"
                        aria-hidden="true"
                      />
                    </div>
                    <Dialog.Title as="h3" className="api-keys-modal-title">
                      Revoke API Key
                    </Dialog.Title>
                  </div>
                  <div className="api-keys-modal-body">
                    <p className="api-keys-modal-description">
                      Are you sure you want to revoke this API key? This action
                      cannot be undone. Any applications using this key will no
                      longer be able to access the API.
                    </p>
                  </div>
                  <div className="api-keys-modal-actions">
                    <button
                      type="button"
                      className="api-keys-button api-keys-button-secondary"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="api-keys-button api-keys-button-danger"
                      onClick={handleDeleteKey}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default ApiKeys;
