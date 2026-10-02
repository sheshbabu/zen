import { h, useState, useEffect, useRef } from "../../assets/preact.esm.js";
import Input from "../../commons/components/Input.jsx";
import Button from "../../commons/components/Button.jsx";
import SegmentedControl from "../../commons/components/SegmentedControl.jsx";
import { ArrowDownIcon, CloseIcon } from "../../commons/components/Icon.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import formatDate from "../../commons/utils/formatDate.js";

const ALL_TAGS = 0;

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
  const [error, setError] = useState("");

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
    setError("");
  }

  function handleScopeTagChange(index, tagId) {
    setScopes(scopes.map((scope, i) => i === index ? { ...scope, tagId } : scope));
  }

  function handleScopeAccessChange(index, value) {
    const canWrite = value === "write";
    setScopes(scopes.map((scope, i) => i === index ? { ...scope, canWrite } : scope));
  }

  function handleAddScopeClick() {
    setScopes([...scopes, newScope()]);
  }

  function handleRemoveScopeClick(index) {
    setScopes(scopes.filter((_, i) => i !== index));
  }

  function handleCreateTokenClick() {
    if (!newTokenName.trim()) {
      setError("Token name is required");
      return;
    }

    setIsCreating(true);
    setError("");

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
      return "No access";
    }

    return tokenScopes.map(scope => {
      const access = scope.canWrite ? "read and write" : "read";
      return `${tagNameFor(scope.tagId)}: ${access}`;
    }).join(" · ");
  }

  const hasDuplicateTags = new Set(scopes.map(scope => scope.tagId)).size !== scopes.length;
  const isFormValid = newTokenName.trim() !== "" && scopes.length > 0 && !hasDuplicateTags;

  const tagOptions = [
    { value: ALL_TAGS, label: "All tags" },
    ...tags.map(tag => ({ value: tag.tagId, label: tag.name }))
  ];

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
          isDisabled={isCreating}
          onChange={value => handleScopeAccessChange(index, value)}
        />
        <Button variant="ghost" onClick={() => handleRemoveScopeClick(index)} title="Remove">
          <CloseIcon />
        </Button>
      </div>
    );
  });

  const tokenItems = tokens.map(token => (
    <div key={token.tokenId} className="api-token-item">
      <div className="api-token-info">
        <div className="api-token-name">{token.name}</div>
        <div className="api-token-grants">{grantsSummary(token.scopes)}</div>
        <div className="api-token-date" title={token.createdAt}>
          {formatDate(new Date(token.createdAt))}
        </div>
      </div>
      <Button variant="danger" onClick={() => handleRevokeClick(token.tokenId)}>
        Revoke
      </Button>
    </div>
  ));

  const buttonText = isCreating ? "Generating..." : "Generate Token";

  let tokenDisplay = null;
  if (newlyCreatedToken) {
    tokenDisplay = (
      <div className="api-token-display">
        <div className="api-token-display-header">
          <strong>Your New Token</strong>
        </div>
        <div className="api-token-value">
          <code>{newlyCreatedToken}</code>
        </div>
      </div>
    );
  }

  let scopeWarning = null;
  if (hasDuplicateTags) {
    scopeWarning = <p className="api-token-scope-warning">Each tag can only be granted once.</p>;
  }

  let tokensContent = null;
  if (tokens.length === 0 && isTokensLoading === false) {
    tokensContent = <p className="api-no-tokens">No tokens created yet. Create your first token above.</p>;
  } else {
    tokensContent = (
      <div className="api-tokens-list">
        {tokenItems}
      </div>
    );
  }

  return (
    <div className="settings-tab-content">
      <h3>API Tokens</h3>
      <p>Create tokens for agents and scripts to access your notes over the API. Each token is limited to the tags and permissions you grant it.</p>

      <div className="api-token-creator">
        <Input
          id="api-token-name"
          label="Token Name"
          type="text"
          placeholder="e.g., Ingest agent, Quick capture, etc."
          value={newTokenName}
          error={error}
          isDisabled={isCreating}
          onChange={handleNameChange}
        />

        <div className="api-token-scopes">
          <label className="api-token-field-label">Access</label>
          {scopeRows}
          {scopeWarning}
          <Button variant="secondary" onClick={handleAddScopeClick} isDisabled={isCreating}>
            Add tag
          </Button>
        </div>

        <Button variant="primary" onClick={handleCreateTokenClick} isDisabled={isCreating || !isFormValid}>
          {buttonText}
        </Button>
      </div>

      {tokenDisplay}

      <hr/>

      <div className="api-tokens-section">
        <h4>Active Tokens</h4>
        {tokensContent}
      </div>
    </div>
  );
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
