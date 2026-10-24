import { h, useState, useEffect, useRef } from "../../assets/preact.esm.js";
import Input from "../../commons/components/Input.jsx";
import Button from "../../commons/components/Button.jsx";
import SegmentedControl from "../../commons/components/SegmentedControl.jsx";
import { ArrowDownIcon, BracesIcon, CheckIcon, CloseIcon, CopyIcon } from "../../commons/components/Icon.jsx";
import { showToast } from "../../commons/components/Toast.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import SettingsRow from "./SettingsRow.jsx";
import SettingsSection from "./SettingsSection.jsx";

const ALL_TAGS = 0;
const COPIED_DURATION = 2000;

const ACCESS_OPTIONS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Read and write" },
];

export default function ApiTokensPane() {
  const [tokens, setTokens] = useState([]);
  const [tags, setTags] = useState([]);
  const [isTokensLoading, setIsTokensLoading] = useState(true);
  const [newTokenName, setNewTokenName] = useState("");
  const [scopes, setScopes] = useState([newScope()]);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isTokenCopied, setIsTokenCopied] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState(null);

  useEffect(() => {
    loadTokens();
    loadTags();
  }, []);

  function loadTokens() {
    ApiClient.getTokens()
      .then(response => {
        setTokens(response);
      })
      .catch(() => { })
      .finally(() => {
        setIsTokensLoading(false);
      });
  }

  function loadTags() {
    ApiClient.getTags()
      .then(response => {
        setTags(response);
      })
      .catch(() => { });
  }

  function handleNameChange(e) {
    setNewTokenName(e.target.value);
  }

  function handleCreateTokenClick() {
    setIsCreating(true);

    ApiClient.createToken({ name: newTokenName.trim(), scopes: scopes })
      .then(response => {
        setNewlyCreatedToken(response.token);
        setNewTokenName("");
        setScopes([newScope()]);
        setTokens(prevTokens => [response.tokenInfo, ...prevTokens]);
      })
      .catch(() => { })
      .finally(() => {
        setIsCreating(false);
      });
  }

  function handleCopyTokenClick() {
    navigator.clipboard.writeText(newlyCreatedToken)
      .then(() => {
        setIsTokenCopied(true);
        setTimeout(() => setIsTokenCopied(false), COPIED_DURATION);
      })
      .catch(() => {
        showToast("Couldn't copy token.");
      });
  }

  function handleEditClick(tokenId) {
    setEditingTokenId(tokenId);
  }

  function handleEditCancel() {
    setEditingTokenId(null);
  }

  function handleEditSave(updatedToken) {
    setTokens(prevTokens => prevTokens.map(token => token.tokenId === updatedToken.tokenId ? updatedToken : token));
    setEditingTokenId(null);
  }

  function handleRevokeClick(tokenId) {
    ApiClient.deleteToken(tokenId)
      .then(() => {
        setTokens(prevTokens => prevTokens.filter(token => token.tokenId !== tokenId));
      })
      .catch(() => { });
  }

  function tagNameFor(tagId) {
    if (tagId === ALL_TAGS) {
      return "All tags";
    }

    const tag = tags.find(tag => tag.tagId === tagId);
    if (tag) {
      return tag.name;
    }

    return `Tag ${tagId}`;
  }

  function grantsSummary(tokenScopes) {
    if (!tokenScopes || tokenScopes.length === 0) {
      return ["No access"];
    }

    const writeTagNames = [];
    const readTagNames = [];
    for (const scope of tokenScopes) {
      if (scope.canWrite) {
        writeTagNames.push(tagNameFor(scope.tagId));
      } else {
        readTagNames.push(tagNameFor(scope.tagId));
      }
    }

    const lines = [];
    if (writeTagNames.length > 0) {
      lines.push(`Read and write: ${writeTagNames.join(", ")}`);
    }
    if (readTagNames.length > 0) {
      lines.push(`Read: ${readTagNames.join(", ")}`);
    }
    return lines;
  }

  const tagOptions = [
    { value: ALL_TAGS, label: "All tags" },
    ...tags.map(tag => ({ value: tag.tagId, label: tag.name }))
  ];

  const tokenItems = tokens.map(token => {
    if (token.tokenId === editingTokenId) {
      return <TokenEditor key={token.tokenId} token={token} tagOptions={tagOptions} onSave={handleEditSave} onCancel={handleEditCancel} />;
    }

    const grantLines = grantsSummary(token.scopes).map(line => (
      <div key={line} className="api-token-grants">{line}</div>
    ));

    const description = [
      ...grantLines,
      <div key="created" className="api-token-date" title={token.createdAt}>
        Created {formatCreatedDate(token.createdAt)}
      </div>
    ];

    return (
      <SettingsRow key={token.tokenId} icon={<BracesIcon />} label={token.name} description={description}>
        <div className="api-token-actions">
          <Button variant="secondary" onClick={() => handleEditClick(token.tokenId)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => handleRevokeClick(token.tokenId)}>
            Revoke
          </Button>
        </div>
      </SettingsRow>
    );
  });

  const buttonText = isCreating ? "Generating..." : "Generate Token";

  let copyButton = null;
  if (typeof navigator.clipboard !== "undefined") {
    copyButton = (
      <button type="button" className={`api-token-copy-button ${isTokenCopied ? "is-copied" : ""}`} onClick={handleCopyTokenClick}>
        {isTokenCopied ? <CheckIcon /> : <CopyIcon />}
      </button>
    );
  }

  let tokenDisplay = null;
  if (newlyCreatedToken) {
    tokenDisplay = (
      <div className="api-token-display">
        <div className="api-token-display-header">
          <strong>Your New Token</strong>
        </div>
        <div className="api-token-value">
          <code>{newlyCreatedToken}</code>
          {copyButton}
        </div>
        <p className="api-token-display-hint">Copy it now. You won't be able to see it again.</p>
      </div>
    );
  }

  let tokensContent = null;
  if (tokens.length === 0 && isTokensLoading === false) {
    tokensContent = <p className="api-no-tokens">No tokens created yet. Create your first token above.</p>;
  } else {
    tokensContent = (
      <div className="api-tokens-list settings-card">
        {tokenItems}
      </div>
    );
  }

  return (
    <div className="settings-tab-content">
      <SettingsSection title="Create Token" description="Create tokens for agents and scripts to access your notes over the API. Each token is limited to the tags and permissions you grant it.">
        <div className="api-token-creator">
          <TokenFields
            id="api-token-name"
            name={newTokenName}
            scopes={scopes}
            tagOptions={tagOptions}
            isDisabled={isCreating}
            onNameChange={handleNameChange}
            onScopesChange={setScopes}
          />

          <Button variant="primary" onClick={handleCreateTokenClick} isDisabled={isCreating || !isTokenFormValid(newTokenName, scopes)}>
            {buttonText}
          </Button>
        </div>

        {tokenDisplay}
      </SettingsSection>

      <SettingsSection title="Active Tokens">
        {tokensContent}
      </SettingsSection>
    </div>
  );
}

function TokenEditor({ token, tagOptions, onSave, onCancel }) {
  const [name, setName] = useState(token.name);
  const [scopes, setScopes] = useState(token.scopes);
  const [isSaving, setIsSaving] = useState(false);

  function handleNameChange(e) {
    setName(e.target.value);
  }

  function handleSaveClick() {
    setIsSaving(true);

    ApiClient.updateToken(token.tokenId, { name: name.trim(), scopes: scopes })
      .then(response => {
        onSave(response);
      })
      .catch(() => {
        setIsSaving(false);
      });
  }

  const saveButtonText = isSaving ? "Saving..." : "Save";

  return (
    <div className="api-token-editor">
      <TokenFields
        id={`api-token-name-${token.tokenId}`}
        name={name}
        scopes={scopes}
        tagOptions={tagOptions}
        isDisabled={isSaving}
        onNameChange={handleNameChange}
        onScopesChange={setScopes}
      />
      <div className="api-token-editor-actions">
        <Button variant="secondary" onClick={onCancel} isDisabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSaveClick} isDisabled={isSaving || !isTokenFormValid(name, scopes)}>
          {saveButtonText}
        </Button>
      </div>
    </div>
  );
}

function TokenFields({ id, name, scopes, tagOptions, isDisabled, onNameChange, onScopesChange }) {
  function handleScopeTagChange(index, tagId) {
    onScopesChange(scopes.map((scope, i) => i === index ? { ...scope, tagId } : scope));
  }

  function handleScopeAccessChange(index, value) {
    const canWrite = value === "write";
    onScopesChange(scopes.map((scope, i) => i === index ? { ...scope, canWrite } : scope));
  }

  function handleAddScopeClick() {
    onScopesChange([...scopes, newScope()]);
  }

  function handleRemoveScopeClick(index) {
    onScopesChange(scopes.filter((_, i) => i !== index));
  }

  const scopeRows = scopes.map((scope, index) => {
    return (
      <div key={index} className="api-token-scope-row">
        <ScopeTagDropdown
          options={tagOptions}
          value={scope.tagId}
          onChange={tagId => handleScopeTagChange(index, tagId)}
        />
        <SegmentedControl
          options={ACCESS_OPTIONS}
          value={scope.canWrite ? "write" : "read"}
          isDisabled={isDisabled}
          onChange={value => handleScopeAccessChange(index, value)}
        />
        <Button variant="ghost" onClick={() => handleRemoveScopeClick(index)} title="Remove">
          <CloseIcon />
        </Button>
      </div>
    );
  });

  let scopeWarning = null;
  if (hasDuplicateTags(scopes)) {
    scopeWarning = <p className="api-token-scope-warning">Each tag can only be granted once.</p>;
  }

  return (
    <div className="api-token-fields">
      <Input
        id={id}
        label="Token Name"
        type="text"
        placeholder="e.g., Ingest agent, Quick capture, etc."
        value={name}
        isDisabled={isDisabled}
        onChange={onNameChange}
      />

      <div className="api-token-scopes">
        <label className="api-token-field-label">Access</label>
        {scopeRows}
        {scopeWarning}
        <Button variant="secondary" onClick={handleAddScopeClick} isDisabled={isDisabled}>
          Add tag
        </Button>
      </div>
    </div>
  );
}

function hasDuplicateTags(scopes) {
  return new Set(scopes.map(scope => scope.tagId)).size !== scopes.length;
}

function isTokenFormValid(name, scopes) {
  return name.trim() !== "" && scopes.length > 0 && !hasDuplicateTags(scopes);
}

function formatCreatedDate(createdAt) {
  return new Date(createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function newScope() {
  return { tagId: ALL_TAGS, canRead: true, canWrite: false };
}

function ScopeTagDropdown({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  function handleOptionClick(optionValue) {
    setIsOpen(false);
    onChange(optionValue);
  }

  const selectedOption = options.find(option => option.value === value);

  let selectedLabel = "";
  if (selectedOption) {
    selectedLabel = selectedOption.label;
  }

  const items = options.map(option => {
    const className = option.value === value ? "dropdown-option is-selected" : "dropdown-option";
    return (
      <li key={option.value} className={className} onClick={() => handleOptionClick(option.value)}>
        {option.label}
      </li>
    );
  });

  return (
    <div ref={containerRef} className={`api-token-scope-tag dropdown-container ${isOpen ? "is-open" : ""}`}>
      <Button className="dropdown-button" onClick={() => setIsOpen(prevIsOpen => !prevIsOpen)}>
        {selectedLabel}
        <ArrowDownIcon />
      </Button>
      <ul className="dropdown-menu">
        {items}
      </ul>
    </div>
  );
}
