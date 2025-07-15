import { h, useState, useEffect } from "../../assets/preact.esm.js";
import Input from "../../commons/components/Input.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import formatDate from "../../commons/utils/formatDate.js";

export default function McpPane() {
  const [tokens, setTokens] = useState([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [newlyCreatedToken, setNewlyCreatedToken] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTokens();
  }, []);

  async function loadTokens() {
    try {
      const response = await ApiClient.getTokens();
      setTokens(response);
    } catch (err) {
      console.error('Load token error:', err);
    }
  }

  function handleNameChange(e) {
    setNewTokenName(e.target.value);
    setError("");
  }

  async function handleCreateToken() {
    if (!newTokenName.trim()) {
      setError("Token name is required");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const response = await ApiClient.createToken({
        name: newTokenName.trim()
      });
      
      setNewlyCreatedToken(response.token);
      setNewTokenName("");
      setTokens([response.tokenInfo, ...tokens]);
    } catch (err) {
      console.error('Create token error:', err);
    } finally {
      setIsCreating(false);
    }
  }

  async function revokeToken(tokenId, tokenName) {
    try {
      await ApiClient.deleteToken(tokenId);
      setTokens(tokens.filter(token => token.tokenId !== tokenId));
    } catch (err) {
      console.error('Revoke token error:', err);
    }
  }

  const tokenItems = tokens.map(token => (
    <div key={token.tokenId} className="mcp-token-item">
      <div className="mcp-token-info">
        <div className="mcp-token-name">{token.name}</div>
        <div className="mcp-token-date" title={token.createdAt}>{formatDate(new Date(token.createdAt))}</div>
      </div>
      <button className="button danger" onClick={() => revokeToken(token.tokenId, token.name)}>
        Revoke
      </button>
    </div>
  ));

  const buttonText = isCreating ? "Generating..." : "Generate Token";
  
  let tokenDisplay = null;
  if (newlyCreatedToken) {
    tokenDisplay = (
      <div className="mcp-token-display">
        <div className="mcp-token-display-header">
          <strong>Your New Token</strong>
        </div>
        <div className="mcp-token-value">
          <code>{newlyCreatedToken}</code>
        </div>
      </div>
    );
  }

  let tokensContent = null;
  if (tokens.length === 0) {
    tokensContent = <p className="mcp-no-tokens">No tokens created yet. Create your first token above.</p>;
  } else {
    tokensContent = (
      <div className="mcp-tokens-list">
        {tokenItems}
      </div>
    );
  }

  return (
    <div className="settings-tab-content">
      <h3>MCP Access Tokens</h3>
      <p>Create tokens for MCP clients and agents to access your notes.</p>
      
      <div className="mcp-token-creator">
        <Input
          id="mcp-token-name"
          label="Token Name"
          type="text"
          placeholder="e.g., Claude Desktop, Cursor, etc."
          value={newTokenName}
          error={error}
          isDisabled={isCreating}
          onChange={handleNameChange}
        />
        <button className="button primary" onClick={handleCreateToken} disabled={isCreating || !newTokenName.trim()}>
          {buttonText}
        </button>
      </div>

      {tokenDisplay}

      <div className="mcp-tokens-section">
        <h4>Active Tokens</h4>
        {tokensContent}
      </div>
    </div>
  );
}